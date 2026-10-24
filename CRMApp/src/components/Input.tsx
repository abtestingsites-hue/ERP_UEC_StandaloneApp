import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-slate-950 border text-slate-100 placeholder-slate-500 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 transition-all',
              Icon ? 'pl-9' : 'pl-3',
              error
                ? 'border-rose-500/80 focus:ring-rose-500/30'
                : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
