import React, { forwardRef } from 'react'
import { cn } from '../lib/utils'
import { PasswordInput } from './PasswordInput'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
    hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, hint, id, required, ...props }, ref) => {
        const inputId = id ?? props.name

        return (
            <div className="w-full">
                <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-bold text-gray-700 dark:text-gray-300">
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </label>
                {type === 'password' ? (
                    <PasswordInput
                        id={inputId}
                        required={required}
                        aria-invalid={Boolean(error)}
                        className={cn(
                            "flex h-10 w-full rounded-xl border border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-slate-900 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 shadow-sm outline-none transition-all placeholder:text-gray-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                ) : (
                    <input
                        id={inputId}
                        type={type}
                        required={required}
                        aria-invalid={Boolean(error)}
                        className={cn(
                            "flex h-10 w-full rounded-xl border border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-slate-900 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 shadow-sm outline-none transition-all placeholder:text-gray-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                )}
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
Input.displayName = "Input"
