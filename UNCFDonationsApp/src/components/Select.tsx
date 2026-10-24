import React from 'react';

interface Option {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Option[];
    placeholder?: string;
    error?: string;
}

export function Select({ label, options, placeholder, error, className = '', ...props }: SelectProps) {
    return (
        <div className="w-full">
            {label && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <select
                className={`w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#0F969C] focus:outline-none focus:ring-1 focus:ring-[#0F969C] transition-colors ${error ? 'border-rose-400 dark:border-rose-500' : ''} ${className}`}
                {...props}
            >
                {placeholder && <option value="" className="dark:bg-[#072E33]">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="dark:bg-[#072E33]">
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>
    );
}
