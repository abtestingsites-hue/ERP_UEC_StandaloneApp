import React, { useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { cn } from '../lib/utils'
import { StatusHighlighter } from './StatusHighlighter'

export interface Column<T> {
    key: string
    header: string
    cell?: (item: T, index: number) => React.ReactNode
    sortable?: boolean
}

export interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    keyExtractor?: (item: T) => string
    actions?: (item: T) => React.ReactNode
    onSort?: (key: string, direction: 'asc' | 'desc') => void
    pagination?: {
        currentPage: number
        totalPages: number
        onPageChange: (page: number) => void
    }
    emptyStateMessage?: string
    isLoading?: boolean
    actionsTitle?: string
    minTableWidth?: string
    showScrollbars?: boolean
    spreadColumns?: boolean
    fullHeight?: boolean
    className?: string
    filters?: React.ReactNode
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
    showScrollbars = false,
    spreadColumns = false,
    fullHeight = true,
    className,
    filters
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [internalPage, setInternalPage] = useState(1)
    const [entriesPerPage, setEntriesPerPage] = useState(10)

    const handleSort = (key: string) => {
        const isAsc = sortKey === key && sortDir === 'asc'
        const newDir = isAsc ? 'desc' : 'asc'
        setSortKey(key)
        setSortDir(newDir)
        if (onSort) onSort(key, newDir)
    }

    // Local Sorting Logic (Applies if onSort is not driving external sorting)
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

    // Local Pagination Logic (Applies if external pagination is not provided)
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
    }

    const handleEntriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEntriesPerPage(Number(e.target.value));
        setInternalPage(1); // Reset to first page
    }

    const shouldHighlightStatus = (column: Column<T>) => {
        const key = column.key.toLowerCase()
        const header = column.header.toLowerCase()
        return ['status', 'priority', 'movement', 'delivery', 'read', 'flag'].some((token) => (
            key.includes(token) || header.includes(token)
        ))
    }

    const renderCell = (item: T, column: Column<T>, index: number) => {
        if (column.cell) return column.cell(item, index)

        const value = (item as any)[column.key]
        if (shouldHighlightStatus(column)) return <StatusHighlighter value={value} />

        return String(value ?? '')
    }

    return (
        <div className={cn(
            "bg-white dark:bg-black border border-gray-100/80 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-3xl overflow-hidden flex flex-col p-2 2xl:p-3",
            fullHeight ? "h-full flex-1 min-h-0" : "w-full shrink-0",
            className
        )}>
            {filters && (
                <div className="flex-none p-3 sm:p-4 border-b border-gray-100/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 rounded-t-3xl">
                    {filters}
                </div>
            )}
            <div className={cn(
                fullHeight ? "flex-1" : "w-full",
                showScrollbars
                    ? "app-scrollbar overflow-auto"
                    : "overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            )}>
                <table
                    className={cn(
                        "w-full min-w-full divide-y divide-gray-200 dark:divide-white/10",
                        spreadColumns && "table-fixed"
                    )}
                    style={minTableWidth ? { minWidth: minTableWidth } : undefined}
                >
                    <thead className="bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm sticky top-0 z-10 rounded-2xl">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={cn(
                                        "px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-4 xl:px-6 2xl:py-4",
                                        col.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                    )}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{col.header}</span>
                                        {col.sortable && (
                                            <ArrowUpDown className={cn(
                                                "h-4 w-4 text-gray-400",
                                                sortKey === col.key && "text-[#0F969C]"
                                            )} />
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && (
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {actionsTitle}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-white/10">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-[#0F969C]">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4"></div>
                                        <p className="text-lg font-medium text-gray-500">Loading data...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Inbox className="h-12 w-12 text-gray-300 mb-4" />
                                        <p className="text-lg font-medium">{emptyStateMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => (
                                <tr
                                    key={keyExtractor(item)}
                                    className={cn(
                                        "hover:bg-[#0F969C]/5 transition-colors group border-b border-gray-50 dark:border-white/5",
                                        index % 2 === 0 ? "bg-white dark:bg-black" : "bg-gray-50/30 dark:bg-white/2"
                                    )}
                                >
                                    {columns.map(col => (
                                        <td key={col.key} className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap sm:px-4 xl:px-6 2xl:py-4">
                                            {renderCell(item, col, (currentPage - 1) * entriesPerPage + index)}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-3 py-3 text-sm text-right font-medium whitespace-nowrap sm:px-4 xl:px-6 2xl:py-4">
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

            {/* Pagination & Show Entries Footer */}
            {(data.length > 0 || !isLocalPagination) && (
                <div className="bg-gray-50/50 dark:bg-white/5 px-6 py-3 mt-2 rounded-2xl border border-gray-100/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="mr-2">Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={handleEntriesChange}
                            className="bg-white dark:bg-black border-gray-300 dark:border-white/10 rounded-md text-sm focus:ring-[#0F969C] focus:border-[#0F969C] py-1 pl-2 pr-8 text-gray-900 dark:text-gray-100"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="ml-2">entries</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                            Showing <span className="font-medium text-gray-900 dark:text-gray-100">{(currentPage - 1) * entriesPerPage + (paginatedData.length > 0 ? 1 : 0)}</span> to <span className="font-medium text-gray-900 dark:text-gray-100">{Math.min(currentPage * entriesPerPage, totalItems)}</span> of <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span> entries
                        </p>

                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-300 dark:border-white/10 bg-white dark:bg-black text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:bg-gray-100 dark:disabled:bg-white/2 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="sr-only">Previous</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <div className="px-4 py-1.5 bg-white dark:bg-black border-y border-gray-300 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {currentPage} / {totalPages || 1}
                            </div>
                            <button
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-300 dark:border-white/10 bg-white dark:bg-black text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:bg-gray-100 dark:disabled:bg-white/2 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    )
}
