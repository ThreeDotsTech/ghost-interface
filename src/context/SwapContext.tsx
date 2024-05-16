import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { to } from "dero-xswd-api";
import { SwapContext, TradingPairBalances } from './Types';
import { GHOST_EXCHANGE_SCID } from '../constants/addresses';
import { useNetwork } from './NetworkContext';
import { getAddressKeys } from '../utils';

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
    const {xswd} = useNetwork();
    const [tradingPairs, setTradingPairs] = useState<string[] | null>(null)
    const [stringkeys, setStringKeys] = useState<{
        [k: string]: string | number;
        C: string;
    } | undefined>(undefined);
    const [balances, setBalances] = useState<TradingPairBalances>({});

    const  getContractInfo = () => {
        if (!xswd) return;
        console.log("Getting SC")
        xswd.node.GetSC(
            {
              scid: GHOST_EXCHANGE_SCID,
              code: false,
              variables: true,
            }, false).then(
                (response) => {
                const [_, contract] = to<"daemon", "DERO.GetSC">(response);
                const stringkeys = contract?.stringkeys;

                setStringKeys(stringkeys);
                if (stringkeys) {
                    const addressKeys = getAddressKeys(stringkeys);
                    setTradingPairs(addressKeys);
                    console.log(addressKeys);
                } else {
                    setTradingPairs(null);
                }
            });      
    }

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
        console.log(newBalances)
        setBalances(newBalances);
    };

    useEffect(() => {
        if (tradingPairs) {
            fetchBalances(tradingPairs);
        }
    }, [tradingPairs, stringkeys]);

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
                tradingPairsBalances: balances ?? null
            }}>
            {children}
        </SwapContext.Provider>,
        [tradingPairs, balances]);
  };
