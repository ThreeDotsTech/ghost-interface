import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { useSwap } from '../../context/SwapContext';

interface TradingPairListButtonProps {
  tradingPair: {
    name?: string;
    asset_balance: number;
    dero_balance: number;
    key: string;
  };
  selectedPair: string | undefined;
  onManageLiquidityClick: (pair: string) => void;
}

const TradingPairListButton: React.FC<TradingPairListButtonProps> = ({
  tradingPair,
  selectedPair,
  onManageLiquidityClick,
}) => {
  const { connectionType } = useNetwork();
  const { setSelectedPair } = useSwap();

  // Determine the text to display: use `name` if it exists, otherwise fallback to `key`
  const displayName = tradingPair.name || tradingPair.key;

  return (
    <li className="ml-4 border-l-4 border-y-4 rounded-l-xl border-black shadow-neu-interactive-black transition-all duration-200 flex justify-between items-stretch overflow-hidden font-semibold text-lg">
      {selectedPair === tradingPair.key && connectionType === 'XSWD' && (
        <button
          className="p-1 bg-primary text-white border-black border-r-4 shadow hover:bg-accent transition-colors duration-200 ease-in-out"
          onClick={() => onManageLiquidityClick(tradingPair.key)}
        >
          Manage
        </button>
      )}
      <a
        className={`block cursor-pointer pl-6 py-3 truncate flex-1 ${
          selectedPair === tradingPair.key
            ? 'text-white bg-primary shadow-neu-interactive-active-black'
            : 'text-black bg-white hover:bg-gray-200'
        }`}
        onClick={() => {
          setSelectedPair(tradingPair.key);
        }}
        aria-current={selectedPair === tradingPair.key ? 'page' : undefined}
        title={displayName}
      >
        {displayName.length > 12
          ? `${displayName.substring(0, 6)}...${displayName.substring(displayName.length - 6)}`
          : displayName}
      </a>
    </li>
  );
};

export default TradingPairListButton;
