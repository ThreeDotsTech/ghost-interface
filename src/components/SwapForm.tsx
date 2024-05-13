import React, { useCallback, useEffect, useState } from 'react';
import { useSwap } from '../context/SwapContext';
import { DERO_ATOMIC_UNIT_FACTOR } from '../constants/misc';

interface SwapFormProps {
  selectedPair: string | undefined;
  onPairSelect: (pair: string) => void;
}

enum SwapDirection {
  ASSET_TO_DERO = "ASSET_TO_DERO",
  DERO_TO_ASSET = "DERO_TO_ASSET",
}

function getInputPrice (inputAmount: number, inputReserve: number, outputReserve: number){
  const inputAmountWithFee = inputAmount * 997;
  console.log('Input amount with fee: ', inputAmountWithFee);
  return inputAmountWithFee * outputReserve / ((inputReserve * 1000) + inputAmountWithFee);
}

function getOutputPrice (outputAmount: number, inputReserve: number, outputReserve: number){
  return (inputReserve * 1000) * outputAmount / ((outputReserve - outputAmount) * 997 + 1);
}
  
const SwapForm: React.FC<SwapFormProps> = ({ selectedPair, onPairSelect }) => {
  const [inputValue, setInputValue] = useState('');
  const [assetValue, setAssetValue] = useState< number>(0);  
  const [deroValue, setDeroValue] = useState< number>(0); 
  const [direction, setDirection] = useState<SwapDirection>(SwapDirection.ASSET_TO_DERO);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);
  const [assetReserve, setAssetReserve] = useState<number | undefined>();
  const [deroReserve, setDeroReserve] = useState<number | undefined>();
  const { tradingPairs, tradingPairsBalances} = useSwap();
  const [selectedPairPrice, setSelectedPairPrice] = useState<string | null>(null);

  // Debounce function that takes a callback
  const debounce = (callback: (inputValue: string) => void, delay = 500) => {
    clearTimeout(timeoutId);
    const id = setTimeout(() => {
      callback(inputValue);
    }, delay);
    setTimeoutId(id);
  };

  // Set the initial selected trading pair
  useEffect(() => {
    if (tradingPairs && tradingPairs.length > 0 && !selectedPair) {
      const defaultPair = tradingPairs[0];
      onPairSelect(defaultPair);
    }
  }, [tradingPairs, onPairSelect]);

  // Update selected pair price
  useEffect(() => {
    if (!selectedPair || !tradingPairsBalances) return;
    if(!tradingPairsBalances[selectedPair]) return;
    const numerator = tradingPairsBalances[selectedPair].dero;
    setDeroReserve(numerator);
    const denominator = tradingPairsBalances[selectedPair].asset;
    setAssetReserve(denominator);
    setSelectedPairPrice((numerator/denominator).toFixed(5));
  }, [selectedPair, tradingPairsBalances, setSelectedPairPrice, setAssetReserve, setDeroReserve]);
  
  // Handle Asset Value change
  useEffect(() => {
    if (!selectedPair || !tradingPairsBalances) return;
    if(!tradingPairsBalances[selectedPair]) return;
    // var deroSold = "0";
    // if (direction==SwapDirection.DERO_TO_ASSET) {
    //   deroSold = getOutputPrice(assetValue, tradingPairsBalances[selectedPair].dero, tradingPairsBalances[selectedPair].asset);
    // } else if (direction==SwapDirection.ASSET_TO_DERO) {
    //   deroSold = getInputPrice(assetValue, tradingPairsBalances[selectedPair].asset, tradingPairsBalances[selectedPair].dero);
    // }
    // setDeroValue(deroSold);
  }, [assetValue, setDeroValue]);

  // Function to handle asset input changes
  const handleAssetValueChange =  useCallback((
    inputValue: string
    ) => {
    // Convert input value to a number
    const numberValue = parseFloat(inputValue);

    // Check if the number is a decimal
    if (isNaN(numberValue)) {
      // Set to empty string if not a number
      console.log('NAN!')
      setAssetValue(0);
      return;
    }

    // Fix to at most 5 decimal places if it is a decimal
    const fixedValue = numberValue.toFixed(5);
    const atomicUnits = Math.round(parseFloat(fixedValue) * 100000);
    setAssetValue(atomicUnits);
    console.log('Atomic units: ', atomicUnits)
    if (!assetReserve || !deroReserve) return;
    //Calculate opposite input value
    var unitsSold = 0;
    console.log('Assets: ', assetReserve);
    console.log('Dero: ', deroReserve);
    if (direction==SwapDirection.ASSET_TO_DERO) {
      unitsSold = getInputPrice(atomicUnits, assetReserve, deroReserve);
      console.log('Units sold: ', unitsSold);
    } else if (direction==SwapDirection.DERO_TO_ASSET) {
      unitsSold = getOutputPrice(atomicUnits, deroReserve, assetReserve);
    }
    setDeroValue(unitsSold)
    
  }, [assetReserve, deroReserve, setAssetValue, setDeroValue]);

  // Function to handle asset input changes
  const handleDeroValueChange = (
    inputValue: string,
    assetReserve: number | undefined,
    deroReserve: number | undefined,
    setAssetValue: React.Dispatch<React.SetStateAction<number>>,
    setDeroValue: React.Dispatch<React.SetStateAction<number>>
    ) => {
    // Convert input value to a number
    const numberValue = parseFloat(inputValue);

    // Check if the number is a decimal
    if (isNaN(numberValue)) {
      // Set to empty string if not a number
      console.log('NAN!')
      setDeroValue(0);
      return;
    }

    // Fix to at most 5 decimal places if it is a decimal
    const fixedValue = numberValue.toFixed(5);
    const atomicUnits = Math.round(parseFloat(fixedValue) * 100000);
    // Remove trailing zeros and unnecessary decimal point
    setDeroValue(atomicUnits);

    if (!assetReserve || !deroReserve) return;
    //Calculate opposite input value
    var unitsSold = 0;
    if (direction==SwapDirection.ASSET_TO_DERO) {
      unitsSold = getOutputPrice(atomicUnits, assetReserve, deroReserve);
    } else if (direction==SwapDirection.DERO_TO_ASSET) {
      unitsSold = getInputPrice(atomicUnits, deroReserve, assetReserve);
    }
    setAssetValue(unitsSold)
    
  };

  // Function to toggle swap direction
  const toggleDirection = () => {
    setDirection(prevDirection =>
      prevDirection === SwapDirection.ASSET_TO_DERO ? SwapDirection.DERO_TO_ASSET : SwapDirection.ASSET_TO_DERO
    );
  };

  // Handle changes in input and trigger debounce
  const handleAssetInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    debounce(() => handleAssetValueChange(event.target.value));
  };

  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);
  
  const assetInput = (
    <div className="flex gap-4 items-center">
      <input
        type="number"
        className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-gray-400"
        placeholder="From Amount"
        value={inputValue }
        onChange={handleAssetInputChange}
      />
      <select
        className="w-1/3 p-3 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:ring-primary focus:border-primary"
        defaultValue={selectedPair}
        onChange={e => onPairSelect(e.target.value)}
      >
        <option disabled>Select Asset</option>
        {tradingPairs?.map(pair => (
          <option key={pair} value={pair}>
            {pair.substring(0, 6)}...{pair.substring(pair.length - 4)}
          </option>
        ))}
      </select>
    </div>
  );

  const deroInput = (
    <div className="flex gap-4 items-center">
      <input
        type="number"
        className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-gray-400"
        placeholder="To Amount"
        value={(deroValue * DERO_ATOMIC_UNIT_FACTOR).toFixed(5)}
        onChange={e => handleDeroValueChange(e.target.value, assetReserve, deroReserve, setAssetValue, setDeroValue)}
      />
      <div className="w-1/3 p-3 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:ring-primary focus:border-primary bg-gray-100">
        DERO
      </div>
    </div>
  );

  return (
    <div className="flex-1 max-w-lg p-6 bg-white shadow-lg rounded-lg border border-gray-200">
  <h1 className="text-xl font-semibold mb-6 text-gray-800">Ghost Exchange {selectedPairPrice}</h1>
  <div className="space-y-6">
    {direction === SwapDirection.ASSET_TO_DERO ? assetInput : deroInput}
    <button
      className="mx-auto my-3 w-8 h-8 flex items-center justify-center text-primary cursor-pointer hover:text-accent transition-colors duration-200 ease-in-out"
      onClick={toggleDirection}
      aria-label="Change direction"
      style={{ background: 'none', border: 'none', outline: 'none' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
    {direction === SwapDirection.ASSET_TO_DERO ? deroInput : assetInput}
    <button className="w-full p-3 bg-primary text-white rounded-md shadow hover:bg-accent transition-colors duration-200 ease-in-out">Swap</button>
  </div>
</div>


  );
};

export default SwapForm;
