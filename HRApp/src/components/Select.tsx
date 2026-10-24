import React, { forwardRef } from 'react'
import { cn } from '../lib/utils'

export interface SelectOption {
    value: string
    label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string
    error?: string
    hint?: string
    options: SelectOption[]
    placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, hint, options, placeholder, id, required, ...props }, ref) => {
        const selectId = id ?? props.name

        return (
            <div className="w-full">
                <label htmlFor={selectId} className="mb-1.5 block text-[13px] font-bold text-gray-700 dark:text-gray-300">
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </label>
                <select
                    id={selectId}
                    required={required}
                    aria-invalid={Boolean(error)}
                    className={cn(
                        "flex h-10 w-full rounded-xl border border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-slate-900 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 shadow-sm outline-none transition-all hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled className="bg-white text-gray-400 dark:bg-slate-900">
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-white text-gray-900 dark:bg-slate-900 dark:text-gray-100">
                            {option.label}
                        </option>
                    ))}
                </select>
                {hint && !error && (
                    <p className="mt-1 text-xs font-medium text-gray-500">{hint}</p>
                )}
                {error && (
                    <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>
                )}
            </div>
        )
    }
)
Select.displayName = "Select"
