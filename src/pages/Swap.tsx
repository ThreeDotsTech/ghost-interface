import { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSwap } from "../context/SwapContext";
import SwapForm from '../components/SwapForm';
import TradingPairsList from '../components/TradingPairsList';
import happyGhost from '../../assets/SVG/happy-ghost.svg';

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
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center md:justify-start bg-background text-text -z-50">
      <div className="relative w-full flex items-center justify-center z-10">
        <div className="relative">
          <SwapForm onPairSelect={handlePairClick}/>
          <img
            src={happyGhost}
            alt="Happy Ghost"
            className="absolute -top-12 xl:-top-0 -right-12 xl:-left-3/4 w-24 xl:w-full  h-24 xl:h-full -z-20"
          />
        </div>
      </div>
      <div className="hidden md:flex sm">
        <TradingPairsList tradingPairs={["ee300fe87cf9fb3bd600b25d6af4cd54569022a3fa264a1cb20174bb9ef7afa2","ee300fe87cf9fb3bd600b25d6af4cd54569022a3fa264a1cb20174bb9ef7afa3","ee300fe87cf9fb3bd600b25d6af4cd54569022a3fa264a1cb20174bb9ef7afa3"]} onSelectPair={handlePairClick} />
      </div>
    </div>
  );
}

export default Swap;
