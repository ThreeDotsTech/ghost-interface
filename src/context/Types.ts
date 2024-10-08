import { Api, DEROGetInfoResult } from "dero-xswd-api";

export const ConnectionType = {
    XSWD: 'XSWD',
    DAEMON: 'DAEMON'
  } as const;
  
export type ConnectionType = typeof ConnectionType[keyof typeof ConnectionType];

export type WalletInfo = {
  balances: { [key: string]: number | null | string};
}

export enum SwapDirection {
  ASSET_TO_DERO = "ASSET_TO_DERO",
  DERO_TO_ASSET = "DERO_TO_ASSET"
}

export enum SwapType {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT"
}

export type NetworkContextType = {
  isConnected: boolean;
  connectionType: ConnectionType | null;
  xswd: Api | null;
  blockInfo: DEROGetInfoResult | null;
  initializeXswd: () => Promise<unknown>;
  disconnectXswd: () => void;
  isTransactionConfirmed: (txHash: string, confirmations?: number) => Promise<boolean>;
  walletInfo: WalletInfo;
  subscriptions: {
    new_topoheight: boolean | undefined;
    new_balance: boolean | undefined;
    new_entry: boolean | undefined;
  }
  // TODO: Add allowances to show optional approvals when connecting wallet
  // (GetAddress, GetTrackedAssets)
  address: string | undefined;
  setAddress: React.Dispatch<React.SetStateAction<string | undefined>>;

}

export type SwapContextType = {
  tradingPairs: TradingPairsList | null;
  selectedPair: string | undefined;
  setSelectedPair: React.Dispatch<React.SetStateAction<string | undefined>>;
  executeTrade: (amount: number, swapDirection: SwapDirection, swapType: SwapType, counterAmount?: number) => Promise<string | undefined>;
  getBooBalance: (lpAddress: string) => number | undefined,
  getTotalLiquidity: () => number | undefined
}

export type TradingPairsList = {
  [address: string]: {
      name?: string;
      asset_balance: number;
      dero_balance: number;
  };
}