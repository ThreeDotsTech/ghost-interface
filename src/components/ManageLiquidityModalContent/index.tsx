import React, { useState } from 'react';
import AddLiquiditySection from '../AddLiquiditySection';
import RemoveLiquiditySection from '../RemoveLiquiditySection';

const ManageLiquidityModalContent: React.FC<{ pair: string, hideModal: () => void }> = ({ pair, hideModal }) => {
    const [statusMessage, setStatusMessage] = useState('Waiting for input...');
    const [loading, setLoading] = useState(false);
    const [succeed, setSucceed] = useState<boolean | undefined>(undefined);

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md w-full">
            <h1 className="text-xl font-bold mb-5">Manage Liquidity for {pair}</h1>
            <div className="flex flex-row w-full space-x-6">
                <div className="w-1/2">
                    <h2 className="text-lg font-semibold mb-4">Add Liquidity</h2>
                    <AddLiquiditySection
                        pair={pair}
                        setStatusMessage={setStatusMessage}
                        setLoading={setLoading}
                        setSucceed={setSucceed}
                    />
                </div>
                <div className="w-1/2 border-l border-gray-300 pl-6">
                    <h2 className="text-lg font-semibold mb-4">Remove Liquidity</h2>
                    <RemoveLiquiditySection
                        pair={pair}
                        setStatusMessage={setStatusMessage}
                        setLoading={setLoading}
                        setSucceed={setSucceed}
                    />
                </div>
            </div>
            {statusMessage && <p className="mt-4 text-sm text-gray-700">{statusMessage}</p>}
        </div>
    );
};

export default ManageLiquidityModalContent;
