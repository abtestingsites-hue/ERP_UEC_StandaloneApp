import React from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
    onExport: () => void;
    isExporting?: boolean;
    label?: string;
    className?: string;
}

export function ExportButton({
    onExport,
    isExporting = false,
    label = 'Export',
    className = ''
}: ExportButtonProps) {
    return (
        <button
            onClick={onExport}
            disabled={isExporting}
            className={`flex items-center gap-2 rounded-xl bg-white border border-[#6DA5C0]/30 px-4 py-2 text-sm font-semibold text-[#05161A] shadow-sm hover:bg-[#F7FAFC] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 disabled:opacity-50 dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:hover:bg-[#0A2429] ${className}`}
        >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : label}
        </button>
    );
}
