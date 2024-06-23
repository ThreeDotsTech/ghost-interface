import React from 'react';
import { useModal } from '../../context/ModalContext';
import WalletConnectModalContent from '../WalletConnectModalContent';

interface ConnectWalletButtonProps {
    additionalClasses?: string;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
    additionalClasses
}) => {
    const { showModal, hideModal } = useModal();
    
    const handleConnectWallet = () => {
          showModal(<WalletConnectModalContent hideModal={hideModal}/>)
      };

    return (
        <button className={'shadow-neu-black border-4 border-black bg-secondary font-semibold text-background text-black '+additionalClasses}
            onClick={handleConnectWallet}
            >
            Connect Wallet
        </button>
    );
};

export default ConnectWalletButton;