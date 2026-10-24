import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ 
    title = 'No Data Found', 
    description = 'There are no records to display at this time.',
    icon = <PackageOpen className="h-12 w-12 text-[#6DA5C0]/50 dark:text-[#8FB7C8]/50" />,
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
            <div className="mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-[#05161A] dark:text-[#F7FAFC]">{title}</h3>
            <p className="mt-2 max-w-sm text-sm text-[#6DA5C0] dark:text-[#8FB7C8]">{description}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
