import { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSwap } from "../context/SwapContext";
import SwapForm from '../components/SwapForm';
import TradingPairsList from '../components/TradingPairsList';

function Swap() {
  const { tradingPairs } = useSwap();
  const { address } = useParams<{ address?: string }>();
  const history = useHistory();
  const { setSelectedPair } = useSwap();

  useEffect(() => {
    if (tradingPairs && address && !tradingPairs.includes(address)) {
      setSelectedPair(undefined);
    }
  }, [address, tradingPairs]);

  const handlePairClick = (pairAddress: string) => {
    setSelectedPair(pairAddress);
    history.push(`/swap/${pairAddress}`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-start bg-background text-text pr-4">
      <div className="hidden md:flex sm">
        <TradingPairsList tradingPairs={["ee300fe87cf9fb3bd600b25d6af4cd54569022a3fa264a1cb20174bb9ef7afa2","ee300fe87cf9fb3bd600b25d6af4cd54569022a3fa264a1cb20174bb9ef7afa3","ee300fe87cf9fb3bd600b25d6af4cd54569022a3fa264a1cb20174bb9ef7afa3"]} onSelectPair={handlePairClick} />
      </div>
      <div className="flex w-full items-center justify-center">
        <SwapForm  onPairSelect={handlePairClick} />
      </div>
    </div>
  );
}

export default Swap;
