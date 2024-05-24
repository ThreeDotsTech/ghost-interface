import { useEffect, useState } from 'react';
import { ConnectionState, to } from 'dero-xswd-api';
import { useNetwork } from '../../context/NetworkContext';
import { useModal } from '../../context/ModalContext';
import WalletConnectModalContent from '../WalletConnectModalContent';
import { DERO_SCID } from '../../constants/addresses';
import { atomicUnitsToString } from '../../utils';

function Header() {
  const { xswd, connectionType, disconnectXswd, walletInfo } = useNetwork();
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const { showModal, hideModal } = useModal();

  useEffect(() => {
    const fetchAddress = async () => {
      if(address) return;
      if (!(xswd?.state.xswd == ConnectionState.Accepted)) return

      const response = await xswd.wallet.GetAddress();
      const [error, result] = to<"wallet", "GetAddress">(response);
      setAddress(result?.address);
      if (error) setAddress('???');
    };
    fetchAddress();
  }, [xswd, connectionType, address]);

  const handleConnectWallet = () => {
    if (connectionType !== 'XSWD') {
      showModal(<WalletConnectModalContent hideModal={hideModal}/>)
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleLogout = () => {
    if (xswd && xswd.connection) {
      disconnectXswd();
      setAddress(undefined);
      setIsDropdownOpen(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center pt-2 bg-background text-text">
      <div className="header-content">{/* Add header content */}</div>
      <div className="wallet-info flex items-center pr-3">
        {walletInfo.balances[DERO_SCID] !== undefined && (
          <div className="balance mr-2" style={{ color: 'var(--color-secondary)' }}>
            Balance: {typeof(walletInfo.balances[DERO_SCID]) === 'number' ? atomicUnitsToString(walletInfo.balances[DERO_SCID]) : walletInfo.balances[DERO_SCID]} DERO
          </div>
        )}
        <button className=' bg-primary text-background py-2 px-4'
          style={{
            
            
            borderRadius: '8px',
          }}
          onClick={handleConnectWallet}
        >
          {connectionType === 'XSWD'
            ? address
              ? truncateAddress(address!)
              : 'Waiting for address'
            : 'Connect Wallet'}
        </button>
        {isDropdownOpen && (
          <div className="dropdown absolute top-12 right-2 border" style={{ borderColor: 'var(--color-border)', padding: '8px', color: 'var(--color-accent)' }}>
            <button
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;