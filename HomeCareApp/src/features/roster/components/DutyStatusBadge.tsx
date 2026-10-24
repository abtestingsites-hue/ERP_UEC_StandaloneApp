import React from 'react';
import { cn } from '../../../lib/utils';

interface DutyStatusBadgeProps {
    status?: string;
    className?: string;
}

export const DutyStatusBadge: React.FC<DutyStatusBadgeProps> = ({ status, className }) => {
    const norm = String(status || '').toUpperCase();

    let style = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    let label = status || 'UNKNOWN';

    if (['ACTIVE', 'SCHEDULED', 'ASSIGNED'].includes(norm)) {
        style = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40";
        label = norm === 'ACTIVE' ? 'Active Duty' : norm === 'ASSIGNED' ? 'Assigned' : 'Scheduled';
    } else if (['IN_PROGRESS', 'ON_GOING'].includes(norm)) {
        style = "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/40 animate-pulse";
        label = "In Progress";
    } else if (['COMPLETED', 'FINISHED'].includes(norm)) {
        style = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40";
        label = "Completed";
    } else if (['CANCELLED', 'REJECTED', 'EXPIRED'].includes(norm)) {
        style = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40";
        label = norm === 'CANCELLED' ? 'Cancelled' : 'Expired';
    }

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
            style,
            className
        )}>
            {label}
        </span>
    );
};
