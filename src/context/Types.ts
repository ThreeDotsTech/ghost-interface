import { Api, DEROGetInfoResult, EventType } from "dero-xswd-api";

export const ConnectionType = {
    XSWD: 'XSWD',
    DAEMON: 'DAEMON'
  } as const;
  
export type ConnectionType = typeof ConnectionType[keyof typeof ConnectionType];

export type WalletInfo = {
  balances: { [key: string]: number | null | string};
}

export type NetworkContext = {
  isConnected: boolean;
  connectionType: ConnectionType | null;
  xswd: Api | null;
  blockInfo: DEROGetInfoResult | null;
  initializeXswd: () => Promise<unknown>;
  disconnectXswd: () => void;
  walletInfo: WalletInfo;
  subscriptions: {
    new_topoheight: boolean | undefined;
    new_balance: boolean | undefined;
    new_entry: boolean | undefined;
  }
  // TODO: Add allowances to show optional approvals when connecting wallet
  // (GetAddress, GetTrackedAssets)
}

export type SwapContext = {
  tradingPairs: string[] | null;
  tradingPairsBalances: TradingPairBalances | null;
}

export type TradingPairBalances = {
  [address: string]: {
      asset: number;
      dero: number;
  };
}