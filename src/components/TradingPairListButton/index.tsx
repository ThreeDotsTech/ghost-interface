import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { useSwap } from '../../context/SwapContext';

interface TradingPairListButtonProps {
  pair: string;
  selectedPair: string | undefined;
  onManageLiquidityClick: (pair: string) => void;
}

const TradingPairListButton: React.FC<TradingPairListButtonProps> = ({
  pair,
  selectedPair,
  onManageLiquidityClick,
}) => {
  const { connectionType } = useNetwork();
  const { setSelectedPair } = useSwap();
  return (
    <li className="ml-4 border-l-4 border-y-4 rounded-l-xl border-black shadow-neu-black transition-all duration-200 flex justify-between items-stretch overflow-hidden font-semibold text-lg">
        {
            selectedPair === pair ? // Only show when the pair is active
            connectionType === 'XSWD' ? // Only show if wallet is connected
            <button
            className="p-1 bg-primary text-white border-black border-r-4 shadow hover:bg-accent transition-colors duration-200 ease-in-out"
            onClick={() => onManageLiquidityClick(pair)}
            >
            Manage
            </button>  
            : <></> : <></>
        }
        <a
        className={`block cursor-pointer pl-6 py-3 truncate flex-1 ${
            selectedPair === pair
            ? 'text-white bg-primary shadow-neu-active-black'
            : 'text-black bg-white hover:bg-gray-200 hover:shadow-neu-hover-black'
        }`}
        onClick={() => {setSelectedPair(pair)}}
        aria-current={selectedPair === pair ? 'page' : undefined}
        title={pair}
        >
        {pair.substring(0, 6)}...{pair.substring(pair.length -  6)}
        </a>
    </li>
  );
};

export default TradingPairListButton;