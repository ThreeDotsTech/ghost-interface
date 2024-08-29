import { useEffect, useState, useRef } from 'react';
import Spinner from '../Spinner';
import { useNetwork } from '../../context/NetworkContext';
import PrimaryButton from '../PrimaryButton';

const WalletConnectModalContent: React.FC<{ hideModal: () => void }> = ({ hideModal })  => {
    const { xswd, initializeXswd, subscriptions } = useNetwork();
    const [statusMessage, setStatusMessage] = useState<string>('Waiting for XSWD connection...');
    const [succeed, setSucceed] = useState<boolean | undefined>(undefined);
    const [subscriptionStatus, setSubscriptionStatus] = useState<{ new_topoheight: boolean | undefined; new_balance: boolean | undefined; new_entry: boolean | undefined; }>({
        new_topoheight: undefined,
        new_balance: undefined,
        new_entry: undefined
    });

    //Used to make sure we only initialize once.
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            initializeXswd().then(() => {
                setSucceed(true);
                setStatusMessage('Waiting for required subscriptions...');
            }).catch((error) => {
                console.log();
                setSucceed(false);
                if(error=="connection refused: User has rejected the application"){
                    setStatusMessage('Failed to connect. User refused connection.');
                } else if(typeof(error)==='object') {
                    setStatusMessage('Failed to connect. Make sure XSWD is active.');
                } else{
                    setStatusMessage('Failed to connect. Please try again.');
                }
            });
        }
    }, [initializeXswd]);

    useEffect(() => {
        // Check if subscriptions have been approved
        const updatedStatus = {
            new_topoheight: subscriptions.new_topoheight,
            new_balance: subscriptions.new_balance,
            new_entry: subscriptions.new_entry
        };
        setSubscriptionStatus(updatedStatus);
        if ( updatedStatus.new_balance && updatedStatus.new_entry && updatedStatus.new_topoheight ) setStatusMessage("Wallet succesfully connected!")
    }, [xswd, subscriptions]);

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white border-4 border-black shadow-neu w-96 ">
            <h1 className="text-xl font-bold mb-5">{statusMessage}</h1>
            <Spinner succeed={succeed} />
            <h1 className="text-xl font-semibold mb-1">XSWD Approval</h1>
            <h1 className=" text-lg  mt-5 mb-1 self-start">Suscriptions:</h1>
            <div className="">
                {Object.keys(subscriptionStatus).map(key => (
                    <div key={key} className="flex items-start justify-start w-full p-2">
                        <div className={`${succeed ? '' : 'invisible'} mr-2`}>
                        <Spinner  succeed={subscriptionStatus[key as keyof typeof subscriptionStatus]} />
                        </div>
                        <span className={`${succeed ? 'text-black' : 'text-gray-400'}`}>{key}</span>
                    </div>
                ))}
            </div>
            <PrimaryButton 
                additionalClasses ={"w-full mt-5"}
                disabled={statusMessage != "Wallet succesfully connected!"}
                    onClick={hideModal}>
                {statusMessage != "Wallet succesfully connected!" ? 'Waiting for XSWD' : 'Continue'}
            </PrimaryButton>
        </div>
    );
};

export default WalletConnectModalContent;