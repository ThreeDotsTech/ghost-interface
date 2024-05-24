import React from 'react';
import { useSwap } from '../../context/SwapContext';
import { useModal } from '../../context/ModalContext';
import CreateTradingPairModalContent from '../CreatePairModalContent';

interface TradingPairsListProps {
  tradingPairs: string[] | null;
  onSelectPair: (pair: string) => void;
}

const TradingPairsList: React.FC<TradingPairsListProps> = ({ tradingPairs, onSelectPair }) => {
  const { selectedPair } = useSwap();
  const { showModal, hideModal } = useModal();

  const handleCreatePairClick = () => {
      showModal(<CreateTradingPairModalContent hideModal={hideModal}/>)

  };

  return (
    <div className="pr-6 py-4 mr-10 w-72 bg-white shadow-lg rounded-r-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 pl-6">Trading Pairs</h2>
      <ul className="space-y-4">
        {tradingPairs?.map(pair => (
          <li
          className={`cursor-pointer border-y-4 border-r-4 border-black pl-6 py-3 truncate rounded-r-md shadow-neu-black hover:shadow-neu-black  transition-all duration-200 ${
            selectedPair === pair
              ? 'text-white bg-primary shadow-neu-active-black'
              : 'text-black bg-white hover:bg-gray-200'
          }`}
            key={pair}
            onClick={() => onSelectPair(pair)}
            title={pair}
          >
            <a  >
              {pair.substring(0, 6)}...{pair.substring(pair.length - 4)}
            </a>
            
          </li>
        ))}
        <li
          key={"add-pair"}
          className="cursor-pointer border-y-4 border-r-4 pl-6 py-3 rounded-r-md border-accent shadow-neu-accent"
          title={"Create pair"}
          onClick={handleCreatePairClick}
        >
          {"Create pair"}
        </li>
      </ul>
    </div>
  );
};

export default TradingPairsList;
