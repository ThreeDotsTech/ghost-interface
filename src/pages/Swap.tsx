import { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSwap } from "../context/SwapContext";
import SwapForm from '../components/SwapForm';
import TradingPairsList from '../components/TradingPairsList';

function Swap() {
  const { tradingPairs } = useSwap();
  const { address } = useParams<{ address?: string }>();
  const history = useHistory();
  const [selectedPair, setSelectedPair] = useState<string | undefined>(address);

  useEffect(() => {
    if (tradingPairs && address && !tradingPairs.includes(address)) {
      setSelectedPair(undefined);
    }
  }, [address, tradingPairs]);

  const handlePairClick = (pairAddress: string) => {
    console.log('Selected pair')
    setSelectedPair(pairAddress);
    history.push(`/swap/${pairAddress}`);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-background text-text p-4">
      <div className="flex-1 max-w-md lg:max-w-lg mx-auto mb-8 lg:mb-0 lg:mr-8">
        <SwapForm  selectedPair={selectedPair} onPairSelect={handlePairClick} />
      </div>
      <div className="w-full max-w-xs lg:max-w-sm mx-auto">
        <TradingPairsList tradingPairs={tradingPairs} selectedPair={selectedPair} onSelectPair={handlePairClick} />
      </div>
    </div>
  );
}

export default Swap;
