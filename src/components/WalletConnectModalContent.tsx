import { useEffect, useState, useRef } from 'react';
import Spinner from './Spinner';
import { useNetwork } from '../context/NetworkContext';

const WalletConnectModalContent: React.FC<{ hideModal: () => void }> = ({ hideModal })  => {
    const { xswd, initializeXswd, subscriptions } = useNetwork();
    const [statusMessage, setStatusMessage] = useState<string>('Waiting for XSWD connection...');
    const [loading, setLoading] = useState<boolean>(true);
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
                
                setLoading(false);
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
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md w-full">
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
            <button className={`w-full mt-5 p-3 bg-primary text-white rounded-md shadow transition-colors duration-200 ease-in-out 
                                ${statusMessage == "Wallet succesfully connected!" ? 'hover:bg-accent' : 'disabled bg-gray-400 text-black'} mr-2`}
                    onClick={hideModal}>
                Continue
            </button>
        </div>
    );
};

export default WalletConnectModalContent;