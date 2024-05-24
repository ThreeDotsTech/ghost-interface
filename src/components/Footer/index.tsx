import { useNetwork } from "../../context/NetworkContext";
import { useTheme } from '../../context/ThemeContext'; 

function Footer() {
  const { isConnected, connectionType, blockInfo } = useNetwork();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'day' ? 'night' : 'day');
  };

  const getCircleColor = () => {
    if (!isConnected) {
      return 'bg-red-500';
    } else if (connectionType === 'DAEMON') {
      return 'bg-orange-500';
    } else if (connectionType === 'XSWD') {
      return 'bg-green-500';
    }
    return 'bg-gray-500';
  };

  const getTextColor = () => {
    if (!isConnected) {
      return 'text-red-500';
    } else if (connectionType === 'DAEMON') {
      return 'text-orange-500';
    } else if (connectionType === 'XSWD') {
      return 'text-green-500';
    }
    return 'text-gray-500';
  };

  const getBlockInfo = () => {
    if (isConnected && blockInfo) {
      return blockInfo.topoheight.toString();
    }
    return '';
  };

  const toggleIcon = theme === 'day' ? '🌙' : '☀️';

  return (
    <footer className="fixed bottom-0 left-0 w-full flex justify-between items-center pb-2 px-4 bg-background text-text">
      <button
        onClick={toggleTheme} // Toggles the theme between 'day' and 'night'
        className="p-2"
        title="Toggle theme"
      >
        {toggleIcon}
      </button>

      <div className="flex items-center">
        <div
          className={`w-3 h-3 rounded-full mr-2 ${getCircleColor()}`}
          title={connectionType || 'Not Connected'}
        />
        {isConnected && (
          <span className={`text-sm font-bold ml-1 mr-3 ${getTextColor()}`}>
            {getBlockInfo()}
          </span>
        )}
      </div>
    </footer>
  );
}

export default Footer;
