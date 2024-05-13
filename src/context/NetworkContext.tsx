import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Api, AppInfo, ConnectionState, DEROGetInfoResult, EventType, Result, generateAppId, to } from "dero-xswd-api";
import { ConnectionType, NetworkContext } from './Types';

const name = "Ghost Exchange";

const NetworkContext = createContext<NetworkContext | undefined>(undefined);

// Hook to use the network context
export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within an NetworkProvider');
  }
  return context;
};

// Function to get wallet balance on demand.
function getBalance(api: Api , setBalance: React.Dispatch<React.SetStateAction<number | null | string>>) {
    api?.wallet.GetBalance().then((response) => {
    const [error, result] = to<"wallet", "GetBalance", Result>(response);
    console.log(result);
    setBalance(result?.balance || null);
    if (error) setBalance('???');
    });
}

// Function to get blockInfo on demand.
function getBlockInfo(api: Api , setBlockInfo: React.Dispatch<React.SetStateAction<DEROGetInfoResult | null>>) {
        api.node.GetInfo().then((response) => {
        const [_, result] = to<"daemon", "DERO.GetInfo", Result>(response);
        if (result) {
            console.log("New block: ", result.topoheight)
            setBlockInfo(result);
        }});
}

// Provider component
// First it initializes with a default Daemon until the user conects with XWSD.
export const NetworkProvider = ({ children }: { children: ReactNode }) => {
    const [api, setApi] = useState<Api | null>(null);
    const [blockInfo, setBlockInfo] = useState<DEROGetInfoResult | null>(null);
    const [balance, setBalance] = useState<number | null | string>(null);
    const [intervalTimeout, setIntervalTimeout] = useState<NodeJS.Timeout | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<{
        new_topoheight: boolean | undefined;
        new_balance: boolean | undefined;
        new_entry: boolean | undefined;
    }>({
        new_topoheight: undefined,
        new_balance: undefined,
        new_entry: undefined
    });

    // Exposed to connect to Xswd
    const connectXswd = useCallback(async () => {
        if (!api) return;  // Early return if api is not set
    
            await api.initializeXSWD();
            if (intervalTimeout) {
                clearInterval(intervalTimeout);
                setIntervalTimeout(null);
            }
            await getBalance(api, setBalance);  // Assuming getBalance is an async function
    }, [api, intervalTimeout]);

    // Exposed to disconnect to Xswd
    const disconnectXswd = useCallback(() => {
        if (api) {
          api.closeXSWD().then(()=>{
            setApi(null);
            setBalance(null);
            setSubscriptionStatus({
                new_topoheight: undefined,
                new_balance: undefined,
                new_entry: undefined
            })
          });
        }
    }, [api, intervalTimeout]);

    // Handle suscriptions
    useEffect(() => {
        if(!api?.connection.xswd) return;
        const eventTypes: EventType[] = [
            "new_topoheight",
            "new_balance",
            "new_entry",
        ];

        eventTypes.forEach(async (event) => {
            if (!api) return;
            // Suscribe only when connection is XWSD and intervalTimeout has been cleared.
            if (!api.connection.xswd && !intervalTimeout) return;
            const success = await api.subscribe({
            event,
            callback: (value: any) => {
                const date = new Date();
                const eventData = {
                time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                event,
                value,
                };
                console.log("callback", eventData);
                switch (event) {
                    case "new_topoheight":
                        getBlockInfo(api, setBlockInfo);
                        break;
                    case "new_balance":
                        getBalance(api, setBalance);
                        break;
                    default:
                        break;
                }
            },
            });
            setSubscriptionStatus(prevStatus => ({
                ...prevStatus,
                [event]: success
            }));
        });

    }, [api, api?.connection, intervalTimeout, setBlockInfo, api?.subscriptions]);
    
    // Initialize Provider
    //TODO: Handle sad path.
    useEffect(() => {
        if (api == null) {
            const id = generateAppId(name);
            const appInfo: AppInfo = {
            id,
            name,
            description: "Ghost Exchange",
            };
        setApi(new Api(appInfo, undefined, {address: "dero-api.mysrv.cloud", port: 443, secure: true} ));
        } else if(!api.connection.fallback && !api.connection.xswd){
            // When opening the dapp, it will initialize with the fallback connection.
            // TODO: Allow the user to specify fallback daemon address.
            api.initializeFallback().then(()=>{
                console.log("Triggering first getBlockInfo")
                getBlockInfo(api,setBlockInfo);
                const intervalId = setInterval(() => {
                    if (api == null) return;
                    getBlockInfo(api,setBlockInfo);
                }, 18000); // 18 seconds
                    
                setIntervalTimeout(intervalId);
            });
        } 
        
        return () => {
            if (!intervalTimeout) return;
            clearInterval(intervalTimeout);
        };
    }, [api, api?.connection, api?.connection.fallback]);
  
    return useMemo(()=> 
        <NetworkContext.Provider
            value={{
            isConnected: typeof api?.connection !== 'undefined',
            connectionType:
                api?.connection.xswd
                ? ConnectionType.XSWD
                : api?.connection.fallback
                ? ConnectionType.DAEMON
                : null,
            xswd: api,
            blockInfo,
            initializeXswd: connectXswd,
            disconnectXswd,
            walletInfo: {
                balance
            },
            subscriptions: subscriptionStatus
            }}>
            {children}
        </NetworkContext.Provider>,
        [api, api?.connection, blockInfo, connectXswd, balance, subscriptionStatus]);
  };
