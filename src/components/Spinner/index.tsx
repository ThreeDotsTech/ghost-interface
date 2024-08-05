import React from 'react';

// Define the props interface
interface SpinnerProps {
  succeed?: boolean; 
}

const Spinner: React.FC<SpinnerProps> = ({ succeed }) => {
    return (
        <>
            {/* Conditional rendering based on 'succeed' prop */}
            {succeed === undefined && (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-live="polite"
                    aria-busy="true"
                    aria-labelledby="loading-svg"
                    className="w-6 h-6 animate-spin"
                >
                    <title id="loading-svg">Loading...</title>
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        className="stroke-slate-200"
                        strokeWidth="4"
                    />
                    <path
                        d="M12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12C22 9.34784 20.9464 6.8043 19.0711 4.92893C17.1957 3.05357 14.6522 2 12 2"
                        className="stroke-secondary"
                        strokeWidth="4"
                    />
                </svg>
            )}

            {succeed === true && (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-green-500 transition-all"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M21 6L9 18l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}

            {succeed === false && (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-red-500 transition-all"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6 6l12 12m0-12L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </>
    );
};

export default Spinner;

