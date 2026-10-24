import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStaff } from '../../../hooks/useHRData';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface StaffComboboxProps {
    onSelect: (staff: any) => void;
    error?: string;
}

export function StaffCombobox({ onSelect, error }: StaffComboboxProps) {
    const { data: staffList = [], isLoading } = useStaff({ scope: 'all' });
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredStaff = useMemo(() => {
        if (!query) return staffList;
        return staffList.filter((s: any) => {
            const searchStr = `${s.name || ''} ${s.empId || ''} ${s.department || ''}`.toLowerCase();
            return searchStr.includes(query.toLowerCase());
        });
    }, [staffList, query]);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-[#B8D9E8]">
                Search Staff <span className="ml-1 text-red-500">*</span>
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={isLoading ? "Loading staff..." : "Search by name, ID, or dept..."}
                    className={cn(
                        "flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] px-10 py-2 text-sm font-medium text-[#05161A] shadow-sm outline-none transition-all focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20",
                        error && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                    )}
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            
            {error && (
                <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>
            )}

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    {filteredStaff.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            {isLoading ? 'Loading staff...' : 'No staff found.'}
                        </div>
                    ) : (
                        filteredStaff.map((staff: any) => (
                            <div
                                key={staff.id}
                                className="cursor-pointer px-4 py-2 hover:bg-[#0F969C]/10 transition-colors"
                                onClick={() => {
                                    setQuery('');
                                    setIsOpen(false);
                                    onSelect(staff);
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">
                                        {staff.name} <span className="text-gray-500 font-medium">({staff.empId})</span>
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {staff.department || 'No Dept'} • {staff.designation || 'No Role'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
