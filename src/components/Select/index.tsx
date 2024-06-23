import React from 'react';

interface SelectProps {
    options: string[];
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    additionalClasses?: string;
    placeholder?: string;
    disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    additionalClasses = '',
    placeholder = 'Select an option',
    disabled = false,
}) => {
    const baseClasses = `
        w-full
        px-2
        py-4
        border-4 border-black
        shadow-neu-black
        bg-white
        transition-all duration-200
        ease-in-out

        disabled:bg-gray-200 disabled:text-gray-400
        appearance-none
        bg-no-repeat bg-right
        pr-10
    `;

    return (
        <div className="relative w-full ">
            <select
                value={value}
                onChange={onChange}
                className={`${baseClasses} ${additionalClasses}`}
                disabled={disabled}
            >
                <option disabled value="">
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option.substring(0, 6)}...{option.substring(option.length - 4)}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-black-500">
    <svg className="w-4 h-4 fill-current" viewBox="0 0 330 330" xmlns="http://www.w3.org/2000/svg">
        <path d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393
            c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393
            s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"/>
    </svg>
</div>
        </div>
    );
};


export default Select;
