import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { to } from 'dero-xswd-api';
import { GHOST_EXCHANGE_SCID } from '../../constants/addresses';

interface RemoveLiquiditySectionProps {
    pair: string;
    setStatusMessage: (message: string) => void;
    setLoading: (loading: boolean) => void;
    setSucceed: (succeed: boolean | undefined) => void;
}

const RemoveLiquiditySection: React.FC<RemoveLiquiditySectionProps> = ({ pair, setStatusMessage, setLoading, setSucceed }) => {
    const { xswd, isTransactionConfirmed } = useNetwork();
    const [amount, setAmount] = useState('');
    const [estimatedAssets, setEstimatedAssets] = useState('');
    const [estimatedDero, setEstimatedDero] = useState('');

    const trimToFiveDecimals = (value: string): string => {
        const [integerPart, decimalPart] = value.split('.');
        if (!decimalPart) return value;
        return `${integerPart}.${decimalPart.substring(0, 5)}`;
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = trimToFiveDecimals(e.target.value);
        setAmount(value);
        // Placeholder: Update estimated assets and dero based on the value
        setEstimatedAssets(''); // Implement logic to estimate assets
        setEstimatedDero(''); // Implement logic to estimate dero
    };

    const handleRemoveLiquidity = async () => {
        if (!xswd || !amount) {
            setStatusMessage('Please fill in all fields');
            return;
        }

        setLoading(true);
        setStatusMessage('Processing transaction...');

        const amountNum = Math.round(parseFloat(amount) * 1e5); // Adjust to your atomic unit factor

        const response = await xswd.wallet.scinvoke({
            scid: GHOST_EXCHANGE_SCID,
            sc_rpc: [
                { name: 'entrypoint', datatype: 'S', value: 'RemoveLiquidity' },
                { name: 'asset_address', datatype: 'S', value: pair },
                { name: 'amount', datatype: 'U', value: amountNum },
                { name: 'min_dero', datatype: 'U', value: 1 },
                { name: 'min_assets', datatype: 'U', value: 1 },
            ],
            ringsize: 2,
        });

        const [error, resultResponse] = to<'wallet', 'scinvoke'>(response);

        if (error) {
            setStatusMessage('Transaction failed. Please try again.');
            console.error(error);
            setLoading(false);
        } else {
            const txid = resultResponse?.txid;
            if (txid) {
                await isTransactionConfirmed(txid);
                setStatusMessage('Liquidity removed successfully!');
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount of BOO to withrawn</label>
                <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={amount}
                    onChange={handleAmountChange}
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Assets</label>
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
                    {estimatedAssets || '0'}
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated DERO</label>
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
                    {estimatedDero || '0'}
                </div>
            </div>
            <button
                className="w-full mt-5 p-3 bg-primary text-white rounded-md shadow transition-colors duration-200 ease-in-out hover:bg-accent"
                onClick={handleRemoveLiquidity}
            >
                Remove Liquidity
            </button>
        </div>
    );
};

export default RemoveLiquiditySection;
