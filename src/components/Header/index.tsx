import { useNetwork } from '../../context/NetworkContext';
import ConnectWalletButton from '../ConnectWalletButton';
import WalletInfoSection from '../WalletInfoSection';

function Header() {
  const { connectionType } = useNetwork();

  return (
    <header className="fixed top-0 left-0 w-full p-8">
      <div className="relative min-h-10 w-full flex justify-between items-center bg-background text-text bg-white border-2 border-black rounded-xl px-5">
        <div className="absolute font-bold text-lg left-1/2 transform -translate-x-1/2 my-2">Ghost Exchange</div>
        <div className="absolute right-5 wallet-info flex items-center pr-3">
          { connectionType === 'XSWD' ? 
            <WalletInfoSection/>
            : <ConnectWalletButton additionalClasses='py-4 px-4 -my-4'/>
          }
        </div>
      </div>
    </header>
  );
}

export default Header;
