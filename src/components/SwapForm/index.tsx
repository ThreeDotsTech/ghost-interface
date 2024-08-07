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


enum LastInput {
  DERO = "DERO",
  ASSET = "ASSET",
}

const SwapForm: React.FC = () => {
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
  const { tradingPairs, tradingPairsBalances, selectedPair, setSelectedPair, executeTrade } = useSwap(); // Retrieve executeTrade
  const { walletInfo, xswd, connectionType, isTransactionConfirmed } = useNetwork();

  const [swapButtonDisabled, setSwapButtonDisabled] = useState<boolean>(false);

  // Debounce function that takes a callback
  const debounce = (callback: () => void, delay = 500) => {
    if (inpuChangetTimeoutId) clearTimeout(inpuChangetTimeoutId);
    const id = setTimeout(callback, delay);
    setInpuChangetTimeoutId(id);
  };

  // Update selected pair price
  useEffect(() => {
    if (!selectedPair || !tradingPairsBalances) return;
    if (!tradingPairsBalances[selectedPair]) return;
    const numerator = tradingPairsBalances[selectedPair].dero;
    setDeroReserve(numerator);
    const denominator = tradingPairsBalances[selectedPair].asset;
    setAssetReserve(denominator);
  }, [selectedPair, tradingPairsBalances, setAssetReserve, setDeroReserve]);

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
      <div className="flex gap-3 sm:gap-4 items-start my-5">
        <InputField
          type="number"
          additionalClasses = {'w-7/12 pl-2 py-2 sm:py-4'}
          placeholder="From Amount"
          value={assetValue}
          onChange={handleAssetInputChange}
          onFocus={(e) => e.target.select()}
        />
        <div className="relative flex flex-col w-5/12">
          <Select
            additionalClasses = {'w-full'}
            value={selectedPair ?? 'WTF'}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelectedPair(e.target.value);
            }}
            options={tradingPairs ?? []}
          />
          <div className='pl-1 mt-2 text-sm text-gray-700  absolute top-12 sm:top-16 left-0'>
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
      <div className="flex gap-3 sm:gap-4 items-start my-5">
        <InputField
          type="number"
          additionalClasses = {'w-7/12  pl-2 py-2 sm:py-4'}
          placeholder="To Amount"
          value={deroValue}
          onChange={handleDeroInputChange}
          onFocus={(e) => e.target.select()}
        />
        <div className="relative flex flex-col w-5/12">
          <div className="flex justify-start pl-2 py-2 sm:py-4 border-4 border-black shadow-neu-black">
            DERO
          </div>
          <div className='pl-1 mt-2 text-sm text-gray-700 absolute top-12 sm:top-16 left-0'>
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
    <div className="flex-1 w-full sm:w-fit p-2 sm:p-6 border-4 bg-white border-black shadow-neu-black">
      <div className=" my-3 sm:my-3">
        {direction === SwapDirection.ASSET_TO_DERO ? assetInput : deroInput}
        <button
          className="mx-auto w-5 sm:w-8 h-8 flex items-center justify-center stroke-primary cursor-pointer transition-colors duration-200 ease-in-out"
          onClick={toggleDirection}
          aria-label="Change direction"
          style={{ background: 'none', border: 'none', outline: 'none' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </button>
        {direction === SwapDirection.ASSET_TO_DERO ? deroInput : assetInput}
        { connectionType === 'XSWD' ? 
            <PrimaryButton 
            disabled={swapButtonDisabled}
            additionalClasses ={"w-full mt-5"}
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
