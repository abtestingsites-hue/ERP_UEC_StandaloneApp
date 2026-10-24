import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    className?: string;
}

export function DateRangeFilter({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    className = ''
}: DateRangeFilterProps) {
    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-[#6DA5C0]" />
                </div>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] py-2 pl-10 pr-3 text-sm font-medium leading-5 text-[#05161A] shadow-sm transition-all hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:hover:bg-[#0A2429] dark:focus:bg-[#0B2A30]"
                />
            </div>
            <span className="text-sm font-semibold text-gray-500">to</span>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-[#6DA5C0]" />
                </div>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] py-2 pl-10 pr-3 text-sm font-medium leading-5 text-[#05161A] shadow-sm transition-all hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:hover:bg-[#0A2429] dark:focus:bg-[#0B2A30]"
                />
            </div>
        </div>
    );
}
