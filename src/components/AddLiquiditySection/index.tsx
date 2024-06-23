import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { useSwap } from '../../context/SwapContext';
import { to } from 'dero-xswd-api';
import { DERO_SCID, GHOST_EXCHANGE_SCID } from '../../constants/addresses';

interface AddLiquiditySectionProps {
    pair: string;
    setStatusMessage: (message: string) => void;
    setLoading: (loading: boolean) => void;
    setSucceed: (succeed: boolean | undefined) => void;
}

const AddLiquiditySection: React.FC<AddLiquiditySectionProps> = ({ pair, setStatusMessage, setLoading, setSucceed }) => {
    const { xswd, isTransactionConfirmed } = useNetwork();
    const { tradingPairsBalances, selectedPair } = useSwap();
    const [assetAmount, setAssetAmount] = useState('');
    const [deroAmount, setDeroAmount] = useState('');
    const [currentRatio, setCurrentRatio] = useState<number>(0);

    useEffect(() => {
        if (!tradingPairsBalances) return;
        if (selectedPair && tradingPairsBalances[selectedPair]) {
            const { dero, asset } = tradingPairsBalances[selectedPair];
            setCurrentRatio(dero / asset);
        }
    }, [selectedPair, tradingPairsBalances]);

    const trimToFiveDecimals = (value: string): string => {
        const [integerPart, decimalPart] = value.split('.');
        if (!decimalPart) return value;
        return `${integerPart}.${decimalPart.substring(0, 5)}`;
    };

    const handleAssetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const assetValue = trimToFiveDecimals(e.target.value);
        setAssetAmount(assetValue);
        if (currentRatio && assetValue) {
            setDeroAmount((parseFloat(assetValue) * currentRatio).toFixed(5));
        } else {
            setDeroAmount('');
        }
    };

    const handleDeroAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const deroValue = trimToFiveDecimals(e.target.value);
        setDeroAmount(deroValue);
        if (currentRatio && deroValue) {
            setAssetAmount((parseFloat(deroValue) / currentRatio).toFixed(5));
        } else {
            setAssetAmount('');
        }
    };

    const handleAddLiquidity = async () => {
        if (!xswd || !assetAmount || !deroAmount) {
            setStatusMessage('Please fill in all fields');
            return;
        }

        setLoading(true);
        setStatusMessage('Processing transaction...');
        
        const assetAmountNum = Math.round(parseFloat(assetAmount) * 1e5); 
        const deroAmountNum = Math.round(parseFloat(deroAmount) * 1e5); 

        const response = await xswd.wallet.transfer({
            scid: GHOST_EXCHANGE_SCID, 
            transfers: [
                { scid: pair, burn: assetAmountNum },
                { scid: DERO_SCID, burn: deroAmountNum }, 
            ],
            sc_rpc: [
                { name: 'entrypoint', datatype: 'S', value: 'AddLiquidity' },
                { name: 't', datatype: 'S', value: pair },
                { name: 'u', datatype: 'U', value: 1 },
            ],
            ringsize: 2,
        });

        const [error, resultResponse] = to<'wallet', 'transfer'>(response);

        if (error) {
            setStatusMessage('Transaction failed. Please try again.');
            console.error(error);
            setLoading(false);
        } else {
            const txid = resultResponse?.txid;
            if (txid) {
                await isTransactionConfirmed(txid);
                setStatusMessage('Liquidity added successfully!');
                setSucceed(true);
            } else {
                setStatusMessage('Failed to retrieve transaction ID.');
                setSucceed(false);
            }
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount of assets to deposit</label>
                <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={assetAmount}
                    onChange={handleAssetAmountChange}
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount of DERO to deposit</label>
                <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={deroAmount}
                    onChange={handleDeroAmountChange}
                />
            </div>
            <button
                className="w-full mt-5 p-3 bg-primary text-white rounded-md shadow transition-colors duration-200 ease-in-out hover:bg-accent"
                onClick={handleAddLiquidity}
            >
                Add Liquidity
            </button>
        </div>
    );
};

export default AddLiquiditySection;
