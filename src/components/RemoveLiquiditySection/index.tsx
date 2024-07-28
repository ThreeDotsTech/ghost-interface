import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { to } from 'dero-xswd-api';
import { GHOST_EXCHANGE_SCID } from '../../constants/addresses';
import PrimaryButton from '../PrimaryButton';
import InputField from '../InputField';

interface RemoveLiquiditySectionProps {
    pair: string;
    setStatusMessage: (message: string) => void;
}

const RemoveLiquiditySection: React.FC<RemoveLiquiditySectionProps> = ({ pair, setStatusMessage}) => {
    const { xswd, isTransactionConfirmed } = useNetwork();
    const [amount, setAmount] = useState('');
    const [estimatedAssets, setEstimatedAssets] = useState('');
    const [estimatedDero, setEstimatedDero] = useState('');
    const [buttonDisabled, setButtonDisabled] = useState(false);

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

        setButtonDisabled(true);
        setStatusMessage('Processing transaction...');

        const amountNum = Math.round(parseFloat(amount));

        console.log(amountNum, pair)

        const response = await xswd.wallet.scinvoke({
            scid: GHOST_EXCHANGE_SCID,
            sc_rpc: [
                { name: 'entrypoint', datatype: 'S', value: 'RemoveLiquidity' },
                { name: 't', datatype: 'S', value: pair },
                { name: 'v', datatype: 'U', value: amountNum },
                { name: 'w', datatype: 'U', value: 1 },
                { name: 'y2', datatype: 'U', value: 1 },
            ],
            ringsize: 2,
        });

        const [error, resultResponse] = to<'wallet', 'scinvoke'>(response);

        if (error) {
            setStatusMessage('Transaction failed. Please try again.');
            console.error(error);
            setButtonDisabled(false);
        } else {
            const txid = resultResponse?.txid;
            if (txid) {
                await isTransactionConfirmed(txid);
                setStatusMessage('Liquidity removed successfully!');
            } else {
                setStatusMessage('Failed to retrieve transaction ID.');
            }
            setButtonDisabled(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount of BOO to withrawn</label>
                <InputField
                    type="number"
                    additionalClasses = {'w-full pl-2 mb-2 py-2'}
                    placeholder="0"
                    value={amount}
                    onChange={handleAmountChange}
                />
            </div>
            <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Assets</label>
                <InputField
                    type="number"
                    additionalClasses = {'w-full pl-2 mb-2 py-2'}
                    placeholder="0"
                    value={estimatedAssets}
                    onChange={()=>{}}
                    disabled = {true}
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated DERO</label>
                <InputField
                    type="number"
                    additionalClasses = {'w-full pl-2 mb-5 py-2'}
                    placeholder="0"
                    value={estimatedDero}
                    onChange={()=>{}}
                    disabled = {true}
                />
            </div>
            <PrimaryButton 
                disabled={buttonDisabled}
                additionalClasses ={"w-full"}
                onClick={handleRemoveLiquidity}
            >
                {buttonDisabled ? "Waiting for Tx" : "Remove Liquidity"}
            </PrimaryButton>
        </div>
    );
};

export default RemoveLiquiditySection;
