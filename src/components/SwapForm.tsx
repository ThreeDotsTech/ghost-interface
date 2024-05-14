import React, { useCallback, useEffect, useState } from 'react';
import { useSwap } from '../context/SwapContext';
import { DERO_ATOMIC_UNIT_FACTOR } from '../constants/misc';
import { atomicUnitsToString, validateAssetUnitsFormat } from '../utils';
import { getInputPrice, getOutputPrice } from '../utils/swap';

interface SwapFormProps {
  selectedPair: string | undefined;
  onPairSelect: (pair: string) => void;
}

enum SwapDirection {
  ASSET_TO_DERO = "ASSET_TO_DERO",
  DERO_TO_ASSET = "DERO_TO_ASSET",
}

const SwapForm: React.FC<SwapFormProps> = ({ selectedPair, onPairSelect }) => {
  const [assetValue, setAssetValue] = useState('0');
  const [deroValue, setDeroValue] = useState('0');
  const [direction, setDirection] = useState<SwapDirection>(SwapDirection.ASSET_TO_DERO);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);
  const [assetReserve, setAssetReserve] = useState<number | undefined>();
  const [deroReserve, setDeroReserve] = useState<number | undefined>();
  const { tradingPairs, tradingPairsBalances } = useSwap();
  const [selectedPairPrice, setSelectedPairPrice] = useState<string | null>(null);

  // Debounce function that takes a callback
  const debounce = (callback: () => void, delay = 500) => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(callback, delay);
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
    if (!tradingPairsBalances[selectedPair]) return;
    const numerator = tradingPairsBalances[selectedPair].dero;
    setDeroReserve(numerator);
    const denominator = tradingPairsBalances[selectedPair].asset;
    setAssetReserve(denominator);
    setSelectedPairPrice((numerator / denominator).toFixed(5));
  }, [selectedPair, tradingPairsBalances, setSelectedPairPrice, setAssetReserve, setDeroReserve]);

  // Function to handle asset input changes
  const handleAssetValueChange = useCallback((inputValue: string) => {
    // Convert input value to a number
    const numberValue = parseFloat(inputValue);

    // Check if the number is a decimal
    if (isNaN(numberValue)) {
      // Set to 0 if not a number
      setAssetValue('0');
      setDeroValue('0');
      return;
    }

    // Fix to at most 5 decimal places if it is a decimal
    const fixedValue = numberValue.toFixed(5);
    const atomicUnits = Math.round(parseFloat(fixedValue) * (1 / DERO_ATOMIC_UNIT_FACTOR));

    if (!assetReserve || !deroReserve) return;
    // Calculate opposite input value
    var unitsSold = 0;
    if (direction == SwapDirection.ASSET_TO_DERO) {
      unitsSold = getInputPrice(atomicUnits, assetReserve, deroReserve);
    } else if (direction == SwapDirection.DERO_TO_ASSET) {
      unitsSold = getOutputPrice(atomicUnits, deroReserve, assetReserve);
    }
    setDeroValue(atomicUnitsToString(unitsSold));

  }, [assetReserve, deroReserve, direction, setAssetValue, setDeroValue]);

  // Function to handle dero input changes
  const handleDeroValueChange = useCallback((inputValue: string) => {
    // Convert input value to a number
    const numberValue = parseFloat(inputValue);

    // Check if the number is a decimal
    if (isNaN(numberValue)) {
      // Set to 0 if not a number
      setDeroValue('0');
      setAssetValue('0');
      return;
    }

    // Fix to at most 5 decimal places if it is a decimal
    const fixedValue = numberValue.toFixed(5);
    const atomicUnits = Math.round(parseFloat(fixedValue) * (1 / DERO_ATOMIC_UNIT_FACTOR));

    if (!assetReserve || !deroReserve) return;
    // Calculate opposite input value
    var unitsSold = 0;
    if (direction == SwapDirection.ASSET_TO_DERO) {
      unitsSold = getOutputPrice(atomicUnits, assetReserve, deroReserve);
    } else if (direction == SwapDirection.DERO_TO_ASSET) {
      unitsSold = getInputPrice(atomicUnits, deroReserve, assetReserve);
    }
    setAssetValue(atomicUnitsToString(unitsSold))

  }, [assetReserve, deroReserve, direction, setAssetValue, setDeroValue]);

  // Function to toggle swap direction
  const toggleDirection = () => {
    setDirection(prevDirection =>
      prevDirection === SwapDirection.ASSET_TO_DERO ? SwapDirection.DERO_TO_ASSET : SwapDirection.ASSET_TO_DERO
    );
  };

  // Handle changes in asset input and trigger debounce
  const handleAssetInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (validateAssetUnitsFormat(value)) {
      setAssetValue(value);
      debounce(() => handleAssetValueChange(value));
    }
  };

  const handleDeroInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (validateAssetUnitsFormat(value)) {
      setDeroValue(value);
      debounce(() => handleDeroValueChange(value));
    }
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
        value={assetValue}
        onChange={handleAssetInputChange}
        onFocus={(e) => e.target.select()}
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
        value={deroValue}
        onChange={handleDeroInputChange}
        onFocus={(e) => e.target.select()}
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
