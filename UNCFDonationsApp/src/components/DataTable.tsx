import React, { useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
    key: string;
    header: string;
    cell?: (item: T, index: number) => React.ReactNode;
    sortable?: boolean;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor?: (item: T) => string;
    actions?: (item: T) => React.ReactNode;
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
    emptyStateMessage?: string;
    isLoading?: boolean;
    actionsTitle?: string;
    minTableWidth?: string;
    className?: string;
    filters?: React.ReactNode;
}

export function DataTable<T>({
    data,
    columns,
    keyExtractor = (item: any) => item?.id || String(Math.random()),
    actions,
    onSort,
    pagination,
    emptyStateMessage = 'No data available',
    isLoading = false,
    actionsTitle = 'Actions',
    minTableWidth,
    className,
    filters
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [internalPage, setInternalPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    const handleSort = (key: string) => {
        const isAsc = sortKey === key && sortDir === 'asc';
        const newDir = isAsc ? 'desc' : 'asc';
        setSortKey(key);
        setSortDir(newDir);
        if (onSort) onSort(key, newDir);
    };

    const sortedData = React.useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            const valA = (a as any)[sortKey];
            const valB = (b as any)[sortKey];
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortDir]);

    const isLocalPagination = !pagination;
    const totalItems = sortedData.length;
    const totalPages = isLocalPagination ? Math.ceil(totalItems / entriesPerPage) : (pagination?.totalPages || 1);
    const currentPage = isLocalPagination ? internalPage : (pagination?.currentPage || 1);

    const paginatedData = isLocalPagination
        ? sortedData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
        : sortedData;

    const handlePageChange = (page: number) => {
        if (isLocalPagination) {
            setInternalPage(page);
        } else if (pagination) {
            pagination.onPageChange(page);
        }
    };

    const handleEntriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEntriesPerPage(Number(e.target.value));
        setInternalPage(1);
    };

    const renderCell = (item: T, column: Column<T>, index: number) => {
        if (column.cell) return column.cell(item, index);
        const value = (item as any)[column.key];
        return String(value ?? '');
    };

    return (
        <div className={`bg-white dark:bg-[#072E33]/60 border border-slate-200 dark:border-white/10 shadow-xs rounded-2xl overflow-hidden flex flex-col p-3 ${className || ''}`}>
            {filters && (
                <div className="p-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 rounded-t-xl mb-3">
                    {filters}
                </div>
            )}
            <div className="overflow-x-auto w-full">
                <table className="w-full min-w-full divide-y divide-slate-100 dark:divide-white/10 text-left text-sm" style={minTableWidth ? { minWidth: minTableWidth } : undefined}>
                    <thead className="bg-slate-50/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`px-4 py-3.5 whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10' : ''}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{col.header}</span>
                                        {col.sortable && (
                                            <ArrowUpDown className={`h-3.5 w-3.5 ${sortKey === col.key ? 'text-[#0F969C]' : 'text-slate-400'}`} />
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && (
                                <th scope="col" className="px-4 py-3.5 text-right whitespace-nowrap">
                                    {actionsTitle}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-transparent">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F969C] mb-3"></div>
                                        <p className="text-sm font-medium">Loading data...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="text-sm font-medium">{emptyStateMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => (
                                <tr key={keyExtractor(item)} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                                    {columns.map(col => (
                                        <td key={col.key} className="px-4 py-3.5 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                                            {renderCell(item, col, (currentPage - 1) * entriesPerPage + index)}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-4 py-3.5 text-right font-medium whitespace-nowrap">
                                            <div className="flex justify-end space-x-2">
                                                {actions(item)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {(data.length > 0 || !isLocalPagination) && (
                <div className="bg-slate-50/50 dark:bg-white/5 px-4 py-3 mt-3 rounded-xl border border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <span className="mr-2">Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={handleEntriesChange}
                            className="bg-white dark:bg-[#05161A] border border-slate-200 dark:border-white/10 rounded-md py-1 pl-2 pr-6 text-xs text-slate-800 dark:text-white"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="ml-2">entries</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="text-slate-500 dark:text-slate-400 hidden sm:block">
                            Showing <span className="font-semibold text-slate-800 dark:text-white">{(currentPage - 1) * entriesPerPage + (paginatedData.length > 0 ? 1 : 0)}</span> to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * entriesPerPage, totalItems)}</span> of <span className="font-semibold text-slate-800 dark:text-white">{totalItems}</span> entries
                        </p>

                        <div className="inline-flex rounded-md shadow-xs -space-x-px">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="inline-flex items-center p-1.5 rounded-l-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="px-3 py-1 bg-white dark:bg-[#05161A] border-y border-slate-200 dark:border-white/10 font-semibold text-slate-700 dark:text-slate-300">
                                {currentPage} / {totalPages || 1}
                            </div>
                            <button
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="inline-flex items-center p-1.5 rounded-r-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
