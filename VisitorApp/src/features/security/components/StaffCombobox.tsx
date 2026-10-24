import { useState, useRef, useEffect, useMemo } from 'react';
import api from '../../../lib/axios';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface StaffComboboxProps {
    onSelect: (staff: any) => void;
    error?: string;
}

export function StaffCombobox({ onSelect, error }: StaffComboboxProps) {
    const [staffList, setStaffList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        api.get('/hr/staff', { params: { scope: 'all' } })
            .then((res) => {
                if (isMounted) {
                    setStaffList(res.data?.data || []);
                }
            })
            .catch((err) => {
                console.error('Failed to load staff list:', err);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

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
            const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
            const searchStr = `${name} ${s.empId || ''} ${s.department || ''}`.toLowerCase();
            return searchStr.includes(query.toLowerCase());
        });
    }, [staffList, query]);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Search Staff <span className="ml-1 text-rose-500">*</span>
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
                        "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500",
                        error && "border-rose-400 focus:border-rose-500"
                    )}
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            
            {error && (
                <p className="mt-1 text-xs font-semibold text-rose-500">{error}</p>
            )}

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
                    {filteredStaff.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500">
                            {isLoading ? 'Loading staff...' : 'No staff found.'}
                        </div>
                    ) : (
                        filteredStaff.map((staff: any) => {
                            const name = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim();
                            return (
                                <div
                                    key={staff.id}
                                    className="cursor-pointer px-4 py-2 hover:bg-indigo-50 transition-colors"
                                    onClick={() => {
                                        setQuery('');
                                        setIsOpen(false);
                                        onSelect(staff);
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">
                                            {name} <span className="text-slate-500 font-medium">({staff.empId})</span>
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {staff.department || 'No Dept'} • {staff.designation || 'No Role'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
