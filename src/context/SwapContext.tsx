import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { gasEstimateSCArgs, to } from "dero-xswd-api";
import { SwapContextType, SwapDirection, SwapType, TradingPairBalances } from './Types';
import { GHOST_EXCHANGE_SCID } from '../constants/addresses';
import { useNetwork } from './NetworkContext';
import { getAddressKeys, isEqual } from '../utils';
import { useHistory } from 'react-router-dom';

const SwapContext = createContext<SwapContextType | undefined>(undefined);


// Hook to use the swap context
export const useSwap = () => {
  const context = useContext(SwapContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within an NetworkProvider');
  }
  return context;
};



export const SwapProvider = ({ children }: { children: ReactNode }) => {
    const {xswd, blockInfo} = useNetwork();
    // List of all the SCIDs of assets with a trading pair in Ghost
    const [tradingPairs, setTradingPairs] = useState<string[] | null>(null)
    const [balances, setBalances] = useState<TradingPairBalances>({});
    const [selectedPair, setSelectedPair] = useState<string | undefined>(undefined);
    const [stringkeys, setStringKeys] = useState<{
        [k: string]: string | number;
        C: string;
    } | undefined>(undefined);
    const history = useHistory();
    // Get Ghost SC info.
    const  getContractInfo = async () => {
        if (!xswd) return;
        const response = await xswd.node.GetSC(
            {
              scid: GHOST_EXCHANGE_SCID,
              code: false,
              variables: true,
            }, false);
        const [_, contract] = to<"daemon", "DERO.GetSC">(response);
        const stringkeys = contract?.stringkeys;

        setStringKeys(stringkeys);
        if (stringkeys) {
            const addressKeys = getAddressKeys(stringkeys);
            if (JSON.stringify(tradingPairs && tradingPairs.sort()) !== JSON.stringify(addressKeys.sort())) {
                console.log("Updating Trading Pairs")
                setTradingPairs(addressKeys);
            }

        } else {
            setTradingPairs(null);
        }      
    }

    // Parses the contents of all balances keys from SC info.
    const fetchBalances = (addressKeys: string[]) => {
        if (!stringkeys) return;
        const newBalances: TradingPairBalances = {};
    
        addressKeys.forEach((address) => {
            const assetBalance = stringkeys[address];
            const deroBalance = stringkeys[`${address}:DERO`];
    
            newBalances[address] = {
                asset: assetBalance as number ?? 0,
                dero: deroBalance as number ?? 0,
            };
        });
        if (!isEqual(balances, newBalances)) {
            setBalances(newBalances);
          }
    };

    // Set the initial selected trading pair
    useEffect(() => {
        if (tradingPairs && tradingPairs.length > 0 && !selectedPair) {
        const defaultPair = tradingPairs[0];
        setSelectedPair(defaultPair);
        }
    }, [tradingPairs, selectedPair, history, setSelectedPair]);

    // Update dom route on selected pair change
    useEffect(() => {
        if (!selectedPair) return
        console.log("selected pair updated:", selectedPair)
        history.replace(`/${selectedPair}`);
    }, [ selectedPair, history]);

    // Gets the balance of Boo tokens of an address for a given trading pair,
    // given by the pair's asset's SCID
    const getBooBalance = (lpAddress: string) => {
        if (!stringkeys) return;
        try{ // LP record may not exist
            // Typecast, this entries will always be atomic units
            return (stringkeys[`${lpAddress}:BOO:${selectedPair}`] as number);
        } catch {
            return 0;
        }
    };

    const getTotalLiquidity = () => {
        if (!stringkeys) return;
        try{ // LP record may not exist
            // Typecast, this entries will always be atomic units
            return (stringkeys[`${selectedPair}:BOO`] as number);
        } catch {
            return 0;
        }
    }
    
    // Updates reserves every block
    useEffect(() => {
        async function updateGhostBalances() {
            if (!tradingPairs) return;
            await getContractInfo();
            fetchBalances(tradingPairs);
        }

        updateGhostBalances()
      }, [blockInfo, tradingPairs])


    // Function exposed by provider to execute swaps on the current trading pair.
    const executeTrade = useCallback(async (amount: number, swapDirection: SwapDirection, swapType: SwapType, counterAmount?: number): Promise<string | undefined> => {
        if (!xswd) return; // Early return if xswd is not set
        if (!selectedPair) return; // A trading pair needs to be set
        //TODO: Add slippage control, currently disabled by setting min amount to 1.
        switch (swapType) {
            case SwapType.INPUT:
                //AssetToDeroSwapInput
                if(swapDirection == SwapDirection.ASSET_TO_DERO){

                    const response = await xswd.wallet.transfer({
                        scid: GHOST_EXCHANGE_SCID,
                        transfers: [
                            {
                                scid: selectedPair,
                                burn: amount,

                            }
                        ],
                        sc_rpc: gasEstimateSCArgs(
                            GHOST_EXCHANGE_SCID,
                            "AssetToDeroSwapInput", [
                                { name: "min_dero",  value: 1 },
                                { name: "asset_address", value: selectedPair }
                        ]),
                        ringsize: 2,
                        });
            
                    const [error, resultResponse] = to<"wallet", "transfer">(response);
                    if (error){
                        console.error(error);
                    } else {
                        return resultResponse?.txid;
                    }
                //DeroToAssetSwapInput
                } else {
                    const response = await xswd.wallet.scinvoke({
                        scid: GHOST_EXCHANGE_SCID,
                        sc_dero_deposit: amount,
                        sc_rpc: gasEstimateSCArgs(
                            GHOST_EXCHANGE_SCID,
                            "DeroToAssetSwapInput", 
                            [
                                { name: "asset_address", value: selectedPair }
                        ]),
                        ringsize: 2,
                        });
            
                    const [error, resultResponse] = to<"wallet", "transfer">(response);
                    if (error){
                        console.error(error);
                    } else {
                        return resultResponse?.txid;
                    }
                }
              break;
            case SwapType.OUTPUT:
                //AssetToDeroSwapOutput
                if(!counterAmount) throw Error("No input amount on output swap.")
                if(swapDirection == SwapDirection.ASSET_TO_DERO){

                    const response = await xswd.wallet.transfer({
                        scid: GHOST_EXCHANGE_SCID,
                        transfers: [
                            {
                                scid: selectedPair,
                                burn: counterAmount,

                            }
                        ],
                        sc_rpc: gasEstimateSCArgs(
                            GHOST_EXCHANGE_SCID,
                            "AssetToDeroSwapOutput", 
                            [
                                { name: "dero_bought",  value: amount },
                                { name: "asset_address", value: selectedPair }
                        ]),
                        ringsize: 2,
                        });
            
                    const [error, resultResponse] = to<"wallet", "transfer">(response);
                    if (error){
                        console.error(error);
                    } else {
                        return resultResponse?.txid;
                    }
                //DeroToAssetSwapOutput
            } else {
                const response = await xswd.wallet.scinvoke({
                    scid: GHOST_EXCHANGE_SCID,
                    sc_dero_deposit: counterAmount,
                    sc_rpc: gasEstimateSCArgs(
                        GHOST_EXCHANGE_SCID,
                        "DeroToAssetSwapOutput", 
                        [
                            { name: "assets_bought", value: amount },
                            { name: "asset_address", value: selectedPair }
                    ]),
                    ringsize: 2,
                    });
        
                const [error, resultResponse] = to<"wallet", "transfer">(response);
                if (error){
                    console.error(error);
                } else {
                    return resultResponse?.txid;
                }
            }
                break;
            default:
              break;
          }
    }, [xswd, selectedPair]);

    // Initialize Provider
    //TODO: Handle sad path.
    useEffect(() => {
        if (!xswd || !xswd.connection.fallback) return;
        if (tradingPairs == null) {
            getContractInfo();
        }

    }, [xswd, xswd?.connection.fallback]);
  
    return useMemo(()=> 
        <SwapContext.Provider
            value={{
                tradingPairs:  tradingPairs ?? null,
                tradingPairsBalances: balances ?? null,
                executeTrade,
                selectedPair, 
                setSelectedPair,
                getBooBalance,
                getTotalLiquidity
            }}>
            {children}
        </SwapContext.Provider>,
        [tradingPairs, balances, selectedPair, setSelectedPair]);
  };
