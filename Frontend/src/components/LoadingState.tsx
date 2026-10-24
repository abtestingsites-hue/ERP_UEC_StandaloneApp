import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-[#6DA5C0] dark:text-[#8FB7C8] ${className}`}>
            <Loader2 className="h-8 w-8 animate-spin" />
            {message && <p className="mt-4 text-sm font-medium">{message}</p>}
        </div>
    );
}
