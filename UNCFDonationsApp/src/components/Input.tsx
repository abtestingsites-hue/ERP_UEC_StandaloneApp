import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <div className="w-full">
            {label && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <input
                className={`w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:outline-none focus:ring-1 focus:ring-[#0F969C] transition-colors ${error ? 'border-rose-400 dark:border-rose-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>
    );
}
