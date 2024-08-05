import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { to } from 'dero-xswd-api';
import { GHOST_EXCHANGE_SCID } from '../../constants/addresses';
import PrimaryButton from '../PrimaryButton';
import InputField from '../InputField';
import { useSwap } from '../../context/SwapContext';
import { DERO_ATOMIC_UNIT_FACTOR } from '../../constants/misc';

interface RemoveLiquiditySectionProps {
    pair: string;
    setStatusMessage: (message: string) => void;
}

const RemoveLiquiditySection: React.FC<RemoveLiquiditySectionProps> = ({ pair, setStatusMessage}) => {
    const { xswd, address, isTransactionConfirmed } = useNetwork();
    const { getTotalLiquidity, tradingPairsBalances, selectedPair, getBooBalance } = useSwap();
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
        if(!selectedPair || !tradingPairsBalances || !address) return;
        const value = trimToFiveDecimals(e.target.value);
        const booBalance = getBooBalance(address);
        const totalLiquidity =  getTotalLiquidity();
        if(!totalLiquidity || !booBalance) return;
        if (parseFloat(value) > booBalance){
            setStatusMessage("Max BOO balance exceeded.");
            setAmount(booBalance.toString());
        } else{
            setAmount(value);
        }
        setEstimatedAssets((parseFloat(value) * tradingPairsBalances[selectedPair].asset/totalLiquidity*DERO_ATOMIC_UNIT_FACTOR).toFixed(5)); 
        setEstimatedDero((parseFloat(value) * tradingPairsBalances[selectedPair].dero/totalLiquidity*DERO_ATOMIC_UNIT_FACTOR).toFixed(5)); 
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
