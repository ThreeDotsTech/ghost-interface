import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { gasEstimateSCArgs, to } from 'dero-xswd-api';
import { GHOST_EXCHANGE_SCID } from '../../constants/addresses';
import InputField from '../InputField';
import PrimaryButton from '../PrimaryButton';

const CreateTradingPairModalContent: React.FC = () => {
    const { xswd, isTransactionConfirmed } = useNetwork();
    const [assetSCID, setAssetSCID] = useState('');
    const [assetAmount, setAssetAmount] = useState('');
    const [deroAmount, setDeroAmount] = useState('');
    const [initialPrice, setInitialPrice] = useState('0');
    const [statusMessage, setStatusMessage] = useState('Waiting for input...');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (assetAmount && deroAmount) {
            const assetAmountNum = parseFloat(assetAmount);
            const deroAmountNum = parseFloat(deroAmount);
            if (!isNaN(assetAmountNum) && !isNaN(deroAmountNum) && assetAmountNum !== 0) {
                setInitialPrice((deroAmountNum / assetAmountNum).toFixed(5));
            } else {
                setInitialPrice('0');
            }
        }
    }, [assetAmount, deroAmount]);

    const handleAddLiquidity = async () => {
        if (!xswd || !assetSCID || !assetAmount || !deroAmount) {
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
                // The "destination" parameter requires a valid DERO address DIFFERENT FROM THE SENDER'S but, in this context, it serves solely
                // to satisfy the RPC syntax. Rest assured, the DERO specified will be transferred to the Smart Contract, not the random address provided.
                // In this case, the random address used is Captain's address, as disclosed in the genesis block:
                // https://github.com/deroproject/derohe/blob/e9df1205b6603c62f0651d0e18e5e77a2584b15e/config/config.go#L103C28-L103C94
                { burn: deroAmountNum, destination: "dero1qykyta6ntpd27nl0yq4xtzaf4ls6p5e9pqu0k2x4x3pqq5xavjsdxqgny8270" },
                { scid: assetSCID, burn: assetAmountNum },
            ],
            sc_rpc: gasEstimateSCArgs(
                GHOST_EXCHANGE_SCID,
                "AddLiquidity", [
                    { name: "u",  value: 1 },
                    { name: "t", value: assetSCID },

            ]),
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
                setStatusMessage('Trading pair created successfully!');
            } else {
                setStatusMessage('Failed to retrieve transaction ID.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white border-4 border-black shadow-neu-black shadow-md w-full">
            <h1 className="text-xl font-bold mb-5">Create a trading pair on Ghost</h1>
            <div className="mb-4 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset SCID</label>
                <InputField
                    type="text"
                    additionalClasses = {'w-full p-2'}
                    placeholder="SCID"
                    value={assetSCID}
                    onChange={(e) => setAssetSCID(e.target.value)}
                />
            </div>
            <div className="mb-4 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount of assets to deposit</label>
                <InputField
                    type="number"
                    additionalClasses = {'w-full p-2'}
                    placeholder="0"
                    value={assetAmount}
                    onChange={(e) => setAssetAmount(e.target.value)}
                />
            </div>
            <div className="mb-4 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount of DERO to deposit</label>
                <InputField
                    type="number"
                    additionalClasses = {'w-full p-2'}
                    placeholder="0"
                    value={deroAmount}
                    onChange={(e) => setDeroAmount(e.target.value)}
                />
            </div>
            <div className="mb-4 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Price</label>
                <InputField
                    type="number"
                    additionalClasses = {'w-full p-2'}
                    placeholder="0"
                    value={initialPrice}
                    onChange={() => {}}
                    disabled
                />
            </div>
            <div className="mb-4 w-full text-sm text-gray-600">
                <p>Note: A trading pair on an Automated Market Maker (AMM) works by providing initial liquidity. The initial price is determined by the ratio of the amounts of assets and DERO you deposit. Ensure you understand how AMMs and liquidity pools function before proceeding.</p>
            </div>
            <PrimaryButton 
                disabled={loading}
                additionalClasses ={"w-full mt-5 p-3"}
                onClick={handleAddLiquidity}
            >
                {loading ? "Waiting for Tx" : "Create pair"}
            </PrimaryButton>
            {statusMessage && <p className="mt-4 text-sm text-gray-700">{statusMessage}</p>}
        </div>
    );
};

export default CreateTradingPairModalContent;
