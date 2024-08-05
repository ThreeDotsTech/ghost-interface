import { useSwap } from "../context/SwapContext";
import SwapForm from '../components/SwapForm';
import TradingPairsList from '../components/TradingPairsList';
import HappyGhost from '../../assets/SVG/happy-ghost.svg';
import ScaryGhost from '../../assets/SVG/scary-ghost.svg';
import { useTheme } from '../context/ThemeContext';
import { useEffect } from "react";
import { useParams } from "react-router-dom";

function Swap() {
  
  const {theme} = useTheme();
  const { setSelectedPair, tradingPairs } = useSwap();
  const { address } = useParams<{ address: string }>();

    // Update dom route on selected pair change
    // Has to do here as contexts are not children of Router
    useEffect(() => {
      setSelectedPair(address)
    }, [ address]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center lg:justify-start bg-background text-text -z-50 overflow-hidden">
      <div className="relative w-full flex items-center justify-center z-10 mt-20 xl:mt-10">
        <div className="flex flex-col items-center relative w-11/12 sm:w-auto">
          <SwapForm />
          <img
            src={theme == "day"  ? HappyGhost : ScaryGhost}
            alt="Happy Ghost"
            className="absolute -top-12 xl:-top-0 -right-12 xl:-left-3/4 w-24 xl:w-full  h-24 xl:h-full -z-20"
          />
        </div>
      </div>
      <div className="hidden lg:flex sm mt-20 xl:mt-10">
        <TradingPairsList tradingPairs={tradingPairs} />
      </div>
    </div>
  );
}

export default Swap;
