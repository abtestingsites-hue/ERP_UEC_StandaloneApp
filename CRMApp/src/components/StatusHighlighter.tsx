import React from 'react';

type StatusHighlighterProps = {
    value: string | number | boolean | null | undefined;
    className?: string;
};

const successStatuses = [
    'active', 'approved', 'archived', 'available', 'cleared', 'completed', 'confirmed',
    'converted', 'delivered', 'done', 'ok', 'paid', 'posted', 'present', 'processed',
    'published', 'read', 'received', 'sent', 'stable', 'verified', 'working'
];

const warningStatuses = [
    'assigned', 'callback due', 'checking', 'documents pending', 'due', 'due soon',
    'in progress', 'inside', 'open', 'partial', 'pending', 'pending approval',
    'payment pending', 'raised', 'review', 'scheduled', 'to be follow', 'transfer',
    'waiting', 'warm', 'watch'
];

const dangerStatuses = [
    'alert', 'absent', 'cancelled', 'critical', 'escalated', 'failed', 'hot',
    'inactive', 'lost', 'low', 'missed', 'overdue', 'rejected', 'reorder', 'unread'
];

function normalizeStatus(value: StatusHighlighterProps['value']) {
    if (typeof value === 'boolean') return value ? 'Active' : 'Inactive';
    if (value === null || value === undefined || value === '') return '-';

    return String(value)
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function getToneClasses(label: string) {
    const key = label.toLowerCase();

    if (successStatuses.includes(key)) {
        return 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-400/70 dark:bg-emerald-500/12 dark:text-emerald-200';
    }

    if (dangerStatuses.includes(key)) {
        return 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-400/70 dark:bg-rose-500/12 dark:text-rose-200';
    }

    if (warningStatuses.includes(key)) {
        return 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-400/70 dark:bg-amber-500/12 dark:text-amber-200';
    }

    return 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/70 dark:bg-indigo-500/12 dark:text-indigo-200';
}

export const StatusHighlighter: React.FC<StatusHighlighterProps> = ({ value, className = '' }) => {
    const label = normalizeStatus(value);
    const toneClasses = getToneClasses(label);

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${toneClasses} ${className}`}>
            {label}
        </span>
    );
};
