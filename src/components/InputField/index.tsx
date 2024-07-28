import React from 'react';

interface InputFieldProps {
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    additionalClasses?: string;
    disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
    type = 'text',
    placeholder = '',
    value,
    onChange,
    onFocus,
    additionalClasses = '',
    disabled = false,
}) => {
    const baseClasses = `
        border-4 border-black
        shadow-neu-black
        bg-white
        placeholder-gray-400
        disabled:bg-gray-200 disabled:text-gray-400
        ${type === 'number' ? 'hide-arrows' : ''}
    `;
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            className={`${baseClasses} ${additionalClasses}`}
            disabled={disabled}
        />
    );
};

export default InputField;
