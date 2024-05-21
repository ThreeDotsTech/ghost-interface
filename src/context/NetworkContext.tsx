import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { Api, AppInfo, DEROGetInfoResult, EventType, Result, generateAppId, sleep, to } from "dero-xswd-api";
import { ConnectionType, NetworkContext } from './Types';
import { DERO_SCID } from '../constants/addresses';

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

// Function to get wallet balances for all assets on demand
async function getBalances(api: Api, setBalances: React.Dispatch<React.SetStateAction<{ [key: string]: number | null | string }>>) {
  try {
    const response = await api.wallet.GetTrackedAssets({
      skip_balance_check: false,
      only_positive_balances: false,
    });
    const [error, resultResponse] = to<"wallet", "GetTrackedAssets">(response);
    if (error) {
      console.error("Error fetching balances:", error);
      // User is free to decline revealing balances.
      setBalances({[DERO_SCID]:'???'});
      return;
    }
    const balances = resultResponse?.balances || {};
    console.log("GetTrackedAssets", { resultResponse });
    setBalances(balances);
  } catch (error) {
    console.error("Error fetching balances:", error);
    setBalances({});
  }
}

// Function to get blockInfo on demand
function getBlockInfo(api: Api, setBlockInfo: React.Dispatch<React.SetStateAction<DEROGetInfoResult | null>>) {
  api.node.GetInfo().then((response) => {
    const [_, result] = to<"daemon", "DERO.GetInfo", Result>(response);
    if (result) {
      console.log("New block: ", result.topoheight);
      setBlockInfo(result);
    }
  });
}

// Provider component
// First it initializes with a default Daemon until the user conects with XWSD.
export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [api, setApi] = useState<Api | null>(null);
  const [blockInfo, setBlockInfo] = useState<DEROGetInfoResult | null>(null);
  const blockInfoRef = useRef<DEROGetInfoResult | null>(null);
  const [balances, setBalances] = useState<{ [key: string]: number | null | string }>({});
  const [intervalTimeout, setIntervalTimeout] = useState<NodeJS.Timeout | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    new_topoheight: boolean | undefined;
    new_balance: boolean | undefined;
    new_entry: boolean | undefined;
  }>({
    new_topoheight: undefined,
    new_balance: undefined,
    new_entry: undefined,
  });

  useEffect(() => {
    blockInfoRef.current = blockInfo;
  }, [blockInfo]);

  // Exposed to connect to Xswd
  const connectXswd = useCallback(async () => {
    if (!api) return; // Early return if api is not set

    await api.initializeXSWD();
    if (intervalTimeout) {
      clearInterval(intervalTimeout);
      setIntervalTimeout(null);
    }
    getBalances(api, setBalances); // Fetch all asset balances, async
  }, [api, intervalTimeout]);

  // Exposed to disconnect to Xswd
  const disconnectXswd = useCallback(() => {
    if (api) {
      api.closeXSWD().then(() => {
        setApi(null);
        setBalances({});
        setSubscriptionStatus({
          new_topoheight: undefined,
          new_balance: undefined,
          new_entry: undefined,
        });
      });
    }
  }, [api, intervalTimeout]);

  // Function to check if a transaction is confirmed
  // TODO: This can be done cleaner, possibly create an array of pending tx and confirmations expected
  // Then check 
  const isTransactionConfirmed = useCallback(async (txHash: string, confirmations: number = 0): Promise<boolean> => {
    if (!api || !blockInfo?.height) {
      console.error("API not initialized");
      return false;
    }

    try {
        var isConfirmed = false;
        while (!isConfirmed) {
          const response = await api.node.GetTransaction({
            txs_hashes: [txHash],
          });
          const [error, result] = to<"daemon", "DERO.GetTransaction">(response);
          if (error) {
            console.error("Error fetching transaction:", error);
            return false;
          }
          
          const txBlockHeight = (result?.txs as any)[0].block_height;
          const currentBlockHeight = blockInfoRef.current?.topoheight;

          if (txBlockHeight === -1 || txBlockHeight === 0) {
            await sleep(1000);
            continue;
          };

          if (currentBlockHeight && txBlockHeight + confirmations <= currentBlockHeight) {
            isConfirmed = true;
          } else {
            await sleep(1000);
          }
        }
        return false;
      } catch (error) {
      console.error("Error checking transaction confirmation:", error);
      return false;
    }
  }, [api, blockInfo]);

  // Handle subscriptions
  useEffect(() => {
    if (!api?.connection.xswd) return;
    const eventTypes: EventType[] = [
      "new_topoheight",
      "new_balance",
      "new_entry",
    ];

    eventTypes.forEach(async (event) => {
      if (!api) return;
      // Subscribe only when connection is XWSD and intervalTimeout has been cleared.
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
              getBalances(api, setBalances); // Fetch all asset balances
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
  useEffect(() => {
    if (api == null) {
      const id = generateAppId(name);
      const appInfo: AppInfo = {
        id,
        name,
        description: "Ghost Exchange",
      };
      setApi(new Api(appInfo, undefined, { address: "dero-api.mysrv.cloud", port: 443, secure: true }));
    } else if (!api.connection.fallback && !api.connection.xswd) {
      // When opening the dapp, it will initialize with the fallback connection.
      api.initializeFallback().then(() => {
        console.log("Triggering first getBlockInfo");
        getBlockInfo(api, setBlockInfo);
        const intervalId = setInterval(() => {
          if (api == null) return;
          getBlockInfo(api, setBlockInfo);
        }, 18000); // 18 seconds

        setIntervalTimeout(intervalId);
      });
    }

    return () => {
      if (!intervalTimeout) return;
      clearInterval(intervalTimeout);
    };
  }, [api, api?.connection, api?.connection.fallback]);

  return useMemo(() =>
    <NetworkContext.Provider
      value={{
        isConnected: typeof api?.connection !== 'undefined',
        connectionType: api?.connection.xswd
          ? ConnectionType.XSWD
          : api?.connection.fallback
            ? ConnectionType.DAEMON
            : null,
        xswd: api,
        blockInfo,
        initializeXswd: connectXswd,
        disconnectXswd,
        isTransactionConfirmed,
        walletInfo: {
          balances
        },
        subscriptions: subscriptionStatus
      }}>
      {children}
    </NetworkContext.Provider>,
    [api, api?.connection, blockInfo, connectXswd, balances, subscriptionStatus]);
};
