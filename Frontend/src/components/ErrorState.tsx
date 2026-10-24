import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({ 
    title = 'Something went wrong', 
    message = 'An error occurred while fetching data. Please try again.',
    onRetry,
    className = ''
}: ErrorStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 ${className}`}>
            <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-800 dark:text-red-400">{title}</h3>
            <p className="mt-2 max-w-md text-sm text-red-600 dark:text-red-300">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-6 flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                </button>
            )}
        </div>
    );
}
