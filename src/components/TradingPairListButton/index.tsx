import React from 'react';

interface TradingPairListButtonProps {
  pair: string;
  selectedPair: string | undefined;
  onSelectPair: (pair: string | undefined) => void;
  onManageLiquidityClick: (pair: string) => void;
}

const TradingPairListButton: React.FC<TradingPairListButtonProps> = ({
  pair,
  selectedPair,
  onSelectPair,
  onManageLiquidityClick,
}) => {
  return (
    <li className="ml-4 border-l-4 border-y-4 rounded-l-xl border-black shadow-neu-black transition-all duration-200 flex justify-between items-stretch overflow-hidden font-semibold text-lg">
        {
            selectedPair === pair ?
            <button
            className="p-1 bg-primary text-white border-black border-r-4 shadow hover:bg-accent transition-colors duration-200 ease-in-out"
            onClick={() => onManageLiquidityClick(pair)}
            >
            Manage
            </button>  
            : <></>
        }
        <a
        href="#"
        className={`block pl-6 py-3 truncate flex-1 ${
            selectedPair === pair
            ? 'text-white bg-primary shadow-neu-active-black'
            : 'text-black bg-white hover:bg-gray-200 hover:shadow-neu-hover-black'
        }`}
        onClick={() => onSelectPair(pair)}
        aria-current={selectedPair === pair ? 'page' : undefined}
        title={pair}
        >
        {pair.substring(0, 6)}...{pair.substring(pair.length -  6)}
        </a>
    </li>
  );
};

export default TradingPairListButton;