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
                <label htmlFor={selectId} className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-[#B8D9E8]">
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </label>
                <select
                    id={selectId}
                    required={required}
                    aria-invalid={Boolean(error)}
                    className={cn(
                        "flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] px-3 py-2 text-sm font-medium text-[#05161A] shadow-sm outline-none transition-all hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:hover:border-[#6DA5C0]/45 dark:hover:bg-[#0A2429] dark:focus:bg-[#0B2A30]",
                        error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled className="bg-white text-gray-400 dark:bg-[#0B2A30]">
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-white text-gray-900 dark:bg-[#0B2A30] dark:text-[#F7FAFC]">
                            {option.label}
                        </option>
                    ))}
                </select>
                {hint && !error && (
                    <p className="mt-1 text-xs font-medium text-gray-500 dark:text-[#8FB7C8]">{hint}</p>
                )}
                {error && (
                    <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>
                )}
            </div>
        )
    }
)
Select.displayName = "Select"
