import React, { useEffect, useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { atomicUnitsToString, truncateAddress } from '../../utils';
import { DERO_SCID } from '../../constants/addresses';
import { ConnectionState, to } from 'dero-xswd-api';

  

const WalletInfoSection: React.FC = () => {
    const [address, setAddress] = useState<string | undefined>(undefined);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const { xswd, disconnectXswd, connectionType, walletInfo } = useNetwork();

    useEffect(() => {
        const fetchAddress = async () => {
          if(address) return;
          if (!(xswd?.state.xswd === ConnectionState.Accepted)) return
    
          const response = await xswd.wallet.GetAddress();
          const [error, result] = to<"wallet", "GetAddress">(response);
          setAddress(result?.address);
          if (error) setAddress('???');
        };
        fetchAddress();
      }, [xswd, connectionType, address]);

    const handleLogout = () => {
        if (xswd && xswd.connection) {
          disconnectXswd();
          setAddress(undefined);
          setIsDropdownOpen(false);
        }
    };
    
    const handleClick = () => {
          setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <div className='flex items-center'>
            {walletInfo.balances[DERO_SCID] !== undefined && (
            <div className="balance mr-2 font-medium">
            {typeof(walletInfo.balances[DERO_SCID]) === 'number' ? atomicUnitsToString(walletInfo.balances[DERO_SCID]) : walletInfo.balances[DERO_SCID]} DERO
            </div>
            )}
            <div className='shadow-neu-black border-4 border-black bg-secondary font-semibold text-background py-4 px-4 -my-4 text-black'
            onClick={handleClick}
            >
            {
                address ?
                    truncateAddress(address!)
                    : 'Waiting for address'
            }
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
        </div>
        
    );
};

export default WalletInfoSection;