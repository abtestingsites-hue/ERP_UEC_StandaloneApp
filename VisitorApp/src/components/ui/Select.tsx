import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
    hint?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, hint, options, placeholder, id, required, ...props }, ref) => {
        const selectId = id ?? props.name;

        return (
            <div className="w-full">
                <label htmlFor={selectId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {label}
                    {required && <span className="ml-1 text-rose-500">*</span>}
                </label>
                <select
                    id={selectId}
                    required={required}
                    aria-invalid={Boolean(error)}
                    className={cn(
                        "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all hover:border-indigo-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled className="bg-white text-slate-400">
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-white text-slate-900">
                            {option.label}
                        </option>
                    ))}
                </select>
                {hint && !error && (
                    <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>
                )}
                {error && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{error}</p>
                )}
            </div>
        );
    }
);
Select.displayName = "Select";
