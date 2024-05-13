import React from 'react';

interface TradingPairsListProps {
  tradingPairs: string[] | null;
  selectedPair: string | undefined;
  onSelectPair: (pair: string) => void;
}

const TradingPairsList: React.FC<TradingPairsListProps> = ({ tradingPairs, selectedPair, onSelectPair }) => {
  return (
    <div className="px-6 py-4 mr-10 w-72 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Trading Pairs</h2>
      <ul className="space-y-2">
        {tradingPairs?.map(pair => (
          <li
            key={pair}
            className={`cursor-pointer p-3 truncate rounded-md ${selectedPair === pair ? 'text-white bg-primary' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => onSelectPair(pair)}
            title={pair}
          >
            {pair.substring(0, 6)}...{pair.substring(pair.length - 4)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TradingPairsList;
