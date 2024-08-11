import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { useSwap } from '../../context/SwapContext';
import { gasEstimateSCArgs, to } from 'dero-xswd-api';
import { GHOST_EXCHANGE_SCID } from '../../constants/addresses';
import PrimaryButton from '../PrimaryButton';
import InputField from '../InputField';

interface AddLiquiditySectionProps {
    pair: string;
    setStatusMessage: (message: string) => void;
}

const AddLiquiditySection: React.FC<AddLiquiditySectionProps> = ({ pair, setStatusMessage }) => {
    const { xswd, isTransactionConfirmed } = useNetwork();
    const { tradingPairs, selectedPair } = useSwap();
    const [assetAmount, setAssetAmount] = useState('');
    const [deroAmount, setDeroAmount] = useState('');
    const [currentRatio, setCurrentRatio] = useState<number>(0);
    const [buttonDisabled, setButtonDisabled] = useState(false);

    useEffect(() => {
        if (!tradingPairs) return;
        if (selectedPair && tradingPairs[selectedPair]) {
            const { dero_balance, asset_balance } = tradingPairs[selectedPair];
            setCurrentRatio(dero_balance / asset_balance);
        }
    }, [selectedPair, tradingPairs]);

    const trimToFiveDecimals = (value: string): string => {
        const [integerPart, decimalPart] = value.split('.');
        if (!decimalPart) return value;
        return `${integerPart}.${decimalPart.substring(0, 5)}`;
    };

    const handleAssetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const assetValue = trimToFiveDecimals(e.target.value);
        setAssetAmount(assetValue);
        if (currentRatio && assetValue) {
            setDeroAmount((parseFloat(assetValue) * currentRatio - 0.00001 ).toFixed(5));
        } else {
            setDeroAmount('');
        }
    };

    const handleDeroAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const deroValue = trimToFiveDecimals(e.target.value);
        setDeroAmount(deroValue);
        if (currentRatio && deroValue) {
            setAssetAmount((parseFloat(deroValue) / currentRatio + 0.00001).toFixed(5));
        } else {
            setAssetAmount('');
        }
    };

    const handleAddLiquidity = async () => {
        if (!xswd || !assetAmount || !deroAmount) {
            setStatusMessage('Please fill in all fields');
            return;
        }

        setButtonDisabled(true);
        setStatusMessage('Processing transaction...');
        
        const assetAmountNum = Math.round(parseFloat(assetAmount) * 1e5 ); 
        const deroAmountNum = Math.round(parseFloat(deroAmount) * 1e5); 

        const response = await xswd.wallet.transfer({
            scid: GHOST_EXCHANGE_SCID, 
            transfers: [
                // The "destination" parameter requires a valid DERO address DIFFERENT FROM THE SENDER'S but, in this context, it serves solely
                // to satisfy the RPC syntax. Rest assured, the DERO specified will be transferred to the Smart Contract, not the random address provided.
                // In this case, the random address used is Captain's address, as disclosed in the genesis block:
                // https://github.com/deroproject/derohe/blob/e9df1205b6603c62f0651d0e18e5e77a2584b15e/config/config.go#L103C28-L103C94
                { burn: deroAmountNum, destination: "dero1qykyta6ntpd27nl0yq4xtzaf4ls6p5e9pqu0k2x4x3pqq5xavjsdxqgny8270" },
                { scid: pair, burn: assetAmountNum }
            ],
            sc_rpc: gasEstimateSCArgs(
                GHOST_EXCHANGE_SCID,
                "AddLiquidity", [
                    { name: "u",  value: 1 },
                    { name: "t", value: pair },

            ]),
            ringsize: 2,
        });

        const [error, resultResponse] = to<'wallet', 'transfer'>(response);

        if (error) {
            setStatusMessage('Transaction failed. Please try again.');
            console.error(error);
            setButtonDisabled(false);
        } else {
            const txid = resultResponse?.txid;
            if (txid) {
                await isTransactionConfirmed(txid);
                setStatusMessage('Liquidity added successfully!');
            } else {
                setStatusMessage('Failed to retrieve transaction ID.');
            }
            setButtonDisabled(false);
        }
    };

    return (
        <div className="flex flex-col w-full justify-end h-max grow">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount of assets to deposit</label>
                <InputField
                    type="number"
                    additionalClasses = {'w-full pl-2 py-2'}
                    placeholder="Asset amount"
                    value={assetAmount}
                    onChange={handleAssetAmountChange}
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount of DERO to deposit</label>
                <InputField
                    type="number"
                    additionalClasses = {'w-full pl-2 mb-5 py-2'}
                    placeholder="Dero amount"
                    value={deroAmount}
                    onChange={handleDeroAmountChange}
                />
            </div>
            <PrimaryButton 
                disabled={buttonDisabled}
                additionalClasses ={"w-full"}
                onClick={handleAddLiquidity}
            >
                {buttonDisabled ? "Waiting for Tx" : "Add Liquidity"}
            </PrimaryButton>
        </div>
    );
};

export default AddLiquiditySection;
