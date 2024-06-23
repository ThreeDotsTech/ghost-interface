import React from 'react';

interface PrimaryButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    additionalClasses?: string;
    disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    children,
    onClick,
    additionalClasses = '',
    disabled = false,
}) => {
    const baseClasses = `
        px-4 py-2
        bg-primary text-white
        border-4 border-black
        shadow-neu-black
        transition-all duration-200
        ease-in-out
        hover:shadow-neu-hover
        active:shadow-neu-active
        disabled:bg-gray-400 disabled:text-black disabled:hover:cursor-wait
    `;

    return (
        <button
            className={`${baseClasses} ${additionalClasses}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default PrimaryButton;
