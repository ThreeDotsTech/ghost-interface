import React from 'react';
import { useSwap } from '../../context/SwapContext';
import { useModal } from '../../context/ModalContext';
import CreateTradingPairModalContent from '../CreatePairModalContent';
import ManageLiquidityModalContent from '../ManageLiquidityModalContent';
import TradingPairListButton from '../TradingPairListButton';

interface TradingPairsListProps {
  tradingPairs: string[] | null;
  onSelectPair: (pair: string | undefined) => void;
}

const TradingPairsList: React.FC<TradingPairsListProps> = ({ tradingPairs, onSelectPair }) => {
  const { selectedPair } = useSwap();
  const { showModal, hideModal } = useModal();

  const handleCreatePairClick = () => {
    showModal(<CreateTradingPairModalContent hideModal={hideModal} />);
  };

  const handleManageLiquidityClick = (pair: string) => {
    showModal(<ManageLiquidityModalContent pair={pair} hideModal={hideModal} />);
  };

  return (
    <div className="pt-4 pb-6 w-72 bg-white shadow-lg border-y-4 border-l-4 border-black">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 pl-6">Trading Pairs</h2>
      <ul className="space-y-4">
        {tradingPairs?.map(pair => (
          <TradingPairListButton
            key={pair}
            pair={pair}
            selectedPair={selectedPair}
            onSelectPair={onSelectPair}
            onManageLiquidityClick={handleManageLiquidityClick}
          />
        ))}
        <li
          key={"add-pair"}
          className="ml-4 cursor-pointer border-y-4 border-l-4 pl-6 py-3 rounded-l-xl border-accent shadow-neu-accent text-black"
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