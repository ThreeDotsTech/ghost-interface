import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { gasEstimateSCArgs, to } from "dero-xswd-api";
import { SwapContext, SwapDirection, SwapType, TradingPairBalances } from './Types';
import { GHOST_EXCHANGE_SCID } from '../constants/addresses';
import { useNetwork } from './NetworkContext';
import { getAddressKeys, isEqual } from '../utils';

const SwapContext = createContext<SwapContext | undefined>(undefined);


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
    const [tradingPairs, setTradingPairs] = useState<string[] | null>(null)
    const [balances, setBalances] = useState<TradingPairBalances>({});
    const [selectedPair, setSelectedPair] = useState<string | undefined>(undefined);
    const [stringkeys, setStringKeys] = useState<{
        [k: string]: string | number;
        C: string;
    } | undefined>(undefined);
    
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
            console.log("Balances updated.");
            console.log(newBalances);
            setBalances(newBalances);
          }
    };
    
    //
    useEffect(() => {
        async function updateGhostBalances() {
            if (!tradingPairs) return;
            await getContractInfo();
            fetchBalances(tradingPairs);
        }

        updateGhostBalances()
      }, [blockInfo, tradingPairs])



    const executeTrade = useCallback(async (amount: number, swapDirection: SwapDirection, swapType: SwapType, counterAmount?: number) => {
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
                        console.error(error)
                    } else {
                        console.log(resultResponse)
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
                        console.error(error)
                    } else {
                        console.log(resultResponse)
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
                        console.error(error)
                    } else {
                        console.log(resultResponse)
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
                    console.error(error)
                } else {
                    console.log(resultResponse)
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
                setSelectedPair
            }}>
            {children}
        </SwapContext.Provider>,
        [tradingPairs, balances, selectedPair, setSelectedPair]);
  };
