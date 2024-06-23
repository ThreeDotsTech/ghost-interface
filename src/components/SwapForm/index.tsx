import React, { useCallback, useEffect, useState } from 'react';
import { useSwap } from '../../context/SwapContext';
import { DERO_ATOMIC_UNIT_FACTOR } from '../../constants/misc';
import { atomicUnitsToString, validateAssetUnitsFormat } from '../../utils';
import { getInputPrice, getOutputPrice } from '../../utils/swap';
import { useNetwork } from '../../context/NetworkContext';
import { DERO_SCID } from '../../constants/addresses';
import { SwapDirection, SwapType } from '../../context/Types';
import PrimaryButton from '../PrimaryButton';
import InputField from '../InputField';
import Select from '../Select';
import ConnectWalletButton from '../ConnectWalletButton';

interface SwapFormProps {
  onPairSelect: (pair: string) => void;
}

enum LastInput {
  DERO = "DERO",
  ASSET = "ASSET",
}

const SwapForm: React.FC<SwapFormProps> = ({ onPairSelect }) => {
  const [assetValue, setAssetValue] = useState('0');
  const [deroValue, setDeroValue] = useState('0');
  const [assetErrorMessage, setAssetErrorMessage] = useState<undefined | string>();
  const [deroErrorMessage, setDeroErrorMessage] = useState<undefined | string>();
  const [direction, setDirection] = useState<SwapDirection>(SwapDirection.ASSET_TO_DERO);
  const [lastInput, setLastInput] = useState<LastInput>(LastInput.DERO)
  const [inpuChangetTimeoutId, setInpuChangetTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);
  const [errorMessageTimeoutId, setErrorMessageTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);
  const [assetReserve, setAssetReserve] = useState<number | undefined>();
  const [deroReserve, setDeroReserve] = useState<number | undefined>();
  const { tradingPairs, tradingPairsBalances, selectedPair, executeTrade } = useSwap(); // Retrieve executeTrade
  const [selectedPairPrice, setSelectedPairPrice] = useState<string | null>(null);
  const { walletInfo, xswd, connectionType, isTransactionConfirmed } = useNetwork();

  const [swapButtonDisabled, setSwapButtonDisabled] = useState<boolean>(false);

  // Debounce function that takes a callback
  const debounce = (callback: () => void, delay = 500) => {
    if (inpuChangetTimeoutId) clearTimeout(inpuChangetTimeoutId);
    const id = setTimeout(callback, delay);
    setInpuChangetTimeoutId(id);
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
  const handleAssetValueChange = useCallback((inputValue: string, updatedDirection?: SwapDirection) => {
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
    var currentDirection: SwapDirection;

    if (updatedDirection) {
      currentDirection = updatedDirection;
    } else {
      currentDirection = direction
    }

    if (currentDirection == SwapDirection.DERO_TO_ASSET && atomicUnits >= assetReserve) {
      setAssetErrorMessageWithTimeout('Not enough liquidity to recieve desired asset amount.');
      return;
    }

    if (currentDirection == SwapDirection.ASSET_TO_DERO) {
      unitsSold = getInputPrice(atomicUnits, assetReserve, deroReserve);
    } else if (currentDirection == SwapDirection.DERO_TO_ASSET) {
      unitsSold = getOutputPrice(atomicUnits, deroReserve, assetReserve);
    }
    setDeroValue(atomicUnitsToString(unitsSold));

  }, [assetReserve, deroReserve, direction, setAssetValue, setDeroValue]);

  // Function to handle dero input changes
  const handleDeroValueChange = useCallback((inputValue: string, updatedDirection?: SwapDirection) => {
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
    var currentDirection: SwapDirection;

    if (updatedDirection) {
      currentDirection = updatedDirection;
    } else {
      currentDirection = direction
    }

    if (currentDirection == SwapDirection.ASSET_TO_DERO && atomicUnits >= deroReserve) {
      setDeroErrorMessageWithTimeout('Not enough liquidity to recieve desired Dero amount.');
      return;
    }

    if (currentDirection == SwapDirection.ASSET_TO_DERO) {
      unitsSold = getOutputPrice(atomicUnits, assetReserve, deroReserve);
    } else if (currentDirection == SwapDirection.DERO_TO_ASSET) {
      unitsSold = getInputPrice(atomicUnits, deroReserve, assetReserve);
    }
    setAssetValue(atomicUnitsToString(unitsSold))

  }, [assetReserve, deroReserve, direction, setAssetValue, setDeroValue]);

  // Function to toggle swap direction
  const toggleDirection = () => {
    setDirection((prevDirection: React.SetStateAction<SwapDirection>) => {
      const newDirection = prevDirection === SwapDirection.ASSET_TO_DERO ? SwapDirection.DERO_TO_ASSET : SwapDirection.ASSET_TO_DERO;
      if (lastInput === LastInput.ASSET) {
        handleAssetValueChange(assetValue, newDirection);
      } else {
        handleDeroValueChange(deroValue, newDirection);
      }
      return newDirection;
    });
  };

  // Function to show an error message below Dero Input, and remove it after 2 secs.
  const setDeroErrorMessageWithTimeout = (message: string) => {
    setDeroErrorMessage(message);
    const id = setTimeout(() => {
      setDeroErrorMessage(undefined);
      setAssetValue('0');
      setDeroValue('0');
    }, 2000);
    setErrorMessageTimeoutId(id);
  };
  // Function to show an error message below Asset Input, and remove it after 2 secs.
  const setAssetErrorMessageWithTimeout = (message: string) => {
    setAssetErrorMessage(message);
    const id = setTimeout(() => {
      setAssetErrorMessage(undefined);
      setAssetValue('0');
      setDeroValue('0');
    }, 2000);
    setErrorMessageTimeoutId(id);
  };

  // Clear the Error timeout if there is a change in the input fields
  useEffect(() => {
    return () => {
      if (errorMessageTimeoutId) clearTimeout(errorMessageTimeoutId);
    };
  }, [assetValue, deroValue]);

  // Handle changes in asset input and trigger debounce
  const handleAssetInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (validateAssetUnitsFormat(value)) {
      setDeroErrorMessage(undefined);
      setAssetErrorMessage(undefined);
      setLastInput(LastInput.ASSET);
      setAssetValue(value);
      debounce(() => handleAssetValueChange(value));
    }
  };
  // Handle changes in dero input and trigger debounce
  const handleDeroInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (validateAssetUnitsFormat(value)) {
      setDeroErrorMessage(undefined);
      setAssetErrorMessage(undefined);
      setLastInput(LastInput.DERO);
      setDeroValue(value);
      debounce(() => handleDeroValueChange(value));
    }
  };

  //Recalculate values everytime the reserves update
  useEffect(() => {
    if (!assetReserve) return;
    if(parseFloat(assetValue) == 0 && parseFloat(deroValue) == 0) return;
    console.log("Recalculating values...")
    if (lastInput === LastInput.ASSET){
      console.log("Last was asset: ", assetValue);
      handleAssetValueChange(assetValue);
    } else{
      console.log("Last was Dero:", deroValue)
      handleDeroValueChange(deroValue);
    }
  }, [assetReserve]); // Could be any reserve

  // Cleanup
  useEffect(() => {
    return () => {
      if (inpuChangetTimeoutId) clearTimeout(inpuChangetTimeoutId);
      if (errorMessageTimeoutId) clearTimeout(errorMessageTimeoutId);
    };
  }, [inpuChangetTimeoutId]);
  
  // Handler for swap button click
  const handleSwapButtonClick = async () => {
    if (!xswd) return;
    const amount = Math.round(parseFloat(lastInput === LastInput.ASSET ? assetValue : deroValue) * (1 / DERO_ATOMIC_UNIT_FACTOR));
    const swapType =  direction === SwapDirection.ASSET_TO_DERO ? 
      lastInput === LastInput.ASSET ? SwapType.INPUT : SwapType.OUTPUT : 
      lastInput === LastInput.DERO ? SwapType.INPUT : SwapType.OUTPUT;
      const counterAmount = Math.round(parseFloat(lastInput === LastInput.ASSET ?  deroValue: assetValue) * (1 / DERO_ATOMIC_UNIT_FACTOR));
    const txid = await executeTrade(amount, direction, swapType, counterAmount);
    if (!txid) return;
    setSwapButtonDisabled(true);
    await isTransactionConfirmed(txid, 1);
    setSwapButtonDisabled(false);
  };

  const assetInput = (
    <div>
      <div className="flex gap-4 items-start m-3">
        <InputField
          type="number"
          additionalClasses='flex-1 py-4'
          //className="flex-1 p-3 border border-gray-300 text-black rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-gray-400"
          placeholder="From Amount"
          value={assetValue}
          onChange={handleAssetInputChange}
          onFocus={(e) => e.target.select()}
        />
        <div className="flex flex-col w-5/12">
          <Select
            //className="p-3 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:ring-primary focus:border-primary"
            value={selectedPair ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              onPairSelect(e.target.value);
            }}
            options={tradingPairs ?? []}
          />
          <div className='pl-1 mt-2 text-sm text-gray-700'>
            {selectedPair && walletInfo.balances[selectedPair] ? "Balance: " + atomicUnitsToString(walletInfo.balances[selectedPair] as number) : ""}
          </div>
        </div>
      </div>
      {assetErrorMessage && (
        <p className="text-red-500 text-sm mt-1">{assetErrorMessage}</p>
      )}
    </div>
  );

  const deroInput = (
    <div>
      <div className="flex gap-4 items-start m-3">
        <InputField
          type="number"
          additionalClasses='flex-1 py-4'
          //className="flex-1 p-3 border border-gray-300 text-black rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-gray-400"
          placeholder="To Amount"
          value={deroValue}
          onChange={handleDeroInputChange}
          onFocus={(e) => e.target.select()}
        />
        <div className="flex flex-col w-5/12">
          <div className="py-4 px-2 border-4 border-black shadow-neu-black">
            DERO
          </div>
          <div className='pl-1 mt-2 text-sm text-gray-700'>
            {typeof(walletInfo.balances[DERO_SCID]) === "number" ? "Balance: " + atomicUnitsToString(walletInfo.balances[DERO_SCID] as number) : ""}
          </div>
        </div>
      </div>
      {deroErrorMessage && (
        <p className="text-red-500 text-sm mt-1">{deroErrorMessage}</p>
      )}
    </div>
  );

  return (
    <div className="flex-1 max-w-lg p-6 border-4 bg-white border-black shadow-neu-black">
      <div className="space-y-4 my-3">
        {direction === SwapDirection.ASSET_TO_DERO ? assetInput : deroInput}
        <button
          className="mx-auto w-8 h-5 flex items-end justify-center text-primary cursor-pointer hover:text-accent transition-colors duration-200 ease-in-out"
          onClick={toggleDirection}
          aria-label="Change direction"
          style={{ background: 'none', border: 'none', outline: 'none' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        {direction === SwapDirection.ASSET_TO_DERO ? deroInput : assetInput}
        { connectionType === 'XSWD' ? 
            <PrimaryButton 
            disabled={swapButtonDisabled}
            additionalClasses ={"w-full"}
            //className="w-full p-3 bg-primary disabled:bg-slate-400 disabled:hover:bg-slate-400 disabled:hover:cursor-wait text-white rounded-md shadow hover:bg-accent transition-colors duration-200 ease-in-out" 
            onClick={handleSwapButtonClick} // Attach handler to swap button
          >
            {swapButtonDisabled ? "Waiting for Tx" : "Swap"}
          </PrimaryButton>
            : <ConnectWalletButton additionalClasses='py-2 w-full'/>
          }
        
      </div>
    </div>
  );
};

export default SwapForm;
