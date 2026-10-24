import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    className = ''
}: SearchInputProps) {
    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[#6DA5C0]" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="block h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] py-2 pl-10 pr-3 text-sm font-medium leading-5 text-[#05161A] shadow-sm transition-all hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:hover:bg-[#0A2429] dark:focus:bg-[#0B2A30] placeholder:text-[#6DA5C0]/60"
            />
        </div>
    );
}
