import React, { useState } from 'react';
import AddLiquiditySection from '../AddLiquiditySection';
import RemoveLiquiditySection from '../RemoveLiquiditySection';
import { useSwap } from '../../context/SwapContext';
import { useNetwork } from '../../context/NetworkContext';

const ManageLiquidityModalContent: React.FC<{ pair: string }> = ({ pair }) => {
    const [statusMessage, setStatusMessage] = useState('Waiting for input...');
    const { getBooBalance } = useSwap();
    const { address } = useNetwork();

    if (!address) return <></>
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white border-4 border-black shadow-neu-black shadow-md w-full">
            <h1 className="text-xl font-bold mb-2">Manage Liquidity for {pair}</h1>
            <h1 className="text-xl font-bold mb-5">Your liquidity: {getBooBalance(address)} Boo</h1>
            <div className="flex flex-row w-full space-x-6">
                <div className="flex flex-col w-1/2">
                    <h2 className="flex justify-center text-lg font-semibold mb-4">Add Liquidity</h2>
                    <AddLiquiditySection
                        pair={pair}
                        setStatusMessage={setStatusMessage}
                    />
                </div>
                <div className="w-1/2 border-l border-gray-300 pl-6">
                    <h2 className="flex justify-center text-lg font-semibold mb-4">Remove Liquidity</h2>
                    <RemoveLiquiditySection
                        pair={pair}
                        setStatusMessage={setStatusMessage}
                    />
                </div>
            </div>
            {statusMessage && <p className="mt-4 text-sm text-gray-700">{statusMessage}</p>}
        </div>
    );
};

export default ManageLiquidityModalContent;
