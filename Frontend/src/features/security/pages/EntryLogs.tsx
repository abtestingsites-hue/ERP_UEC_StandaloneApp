import { useMemo, useState } from 'react'
import { Eye, Calendar } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useMovementTimeline } from '../hooks/useSecurity'
import { SecurityMovementDetailsModal } from '../components/SecurityMovementDetailsModal'
import type { UnifiedEntryEvent } from '../types'

const formatTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    })
}

const formatEventType = (type: string) => {
    const map: Record<string, string> = {
        'STAFF_ENTRY': 'Staff Entry',
        'TEMP_EXIT': 'Temporary Exit',
        'STAFF_RETURN': 'Returned',
        'STAFF_FINAL_EXIT': 'Final Exit',
        'VEHICLE_ENTRY': 'Vehicle Entry',
        'VEHICLE_EXIT': 'Vehicle Exit'
    }
    return map[type] || type
}

export function EntryLogs() {
    const [page, setPage] = useState(1)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    
    // Derived query params
    const queryParams = useMemo(() => {
        const params: any = { page, limit: 15 }
        // Pass strictly YYYY-MM-DD so backend parses and assigns local bounds correctly
        if (fromDate) params.from = fromDate
        if (toDate) params.to = toDate
        return params
    }, [page, fromDate, toDate])

    const { data: timelineData, isLoading, isError } = useMovementTimeline(queryParams)
    const entries = timelineData?.events || []
    const pagination = timelineData?.pagination

    const [searchQuery, setSearchQuery] = useState('')
    const [sourceTypeFilter, setSourceTypeFilter] = useState('ALL')
    const [eventTypeFilter, setEventTypeFilter] = useState('ALL')
    const [selectedEvent, setSelectedEvent] = useState<UnifiedEntryEvent | null>(null)

    // Frontend filters (Search, Source Type, Event Type) applied dynamically on top of the paginated backend window
    const filteredRows = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return entries.filter((entry) => {
            if (sourceTypeFilter !== 'ALL' && entry.sourceType !== sourceTypeFilter) return false
            if (eventTypeFilter !== 'ALL' && entry.eventType !== eventTypeFilter) return false
            
            if (query) {
                const searchable = [
                    entry.staff?.name,
                    entry.staff?.empId,
                    entry.staff?.department,
                    entry.vehicle?.vehicleNo,
                    entry.vehicle?.driverName,
                    entry.tripDetails?.reason,
                    entry.actor?.name
                ].filter(Boolean).map(s => String(s).toLowerCase())
                
                if (!searchable.some(s => s.includes(query))) return false
            }
            return true
        })
    }, [entries, searchQuery, sourceTypeFilter, eventTypeFilter])

    const columns: Column<UnifiedEntryEvent>[] = [
        { key: 'timestamp', header: 'Time', cell: (event) => formatTime(event.timestamp) },
        { 
            key: 'sourceType', 
            header: 'Type', 
            cell: (event) => event.sourceType === 'VEHICLE' ? 'Vehicle' : 'Staff' 
        },
        { 
            key: 'subject', 
            header: 'Staff / Vehicle', 
            cell: (event) => {
                if (event.sourceType === 'VEHICLE' && event.vehicle) {
                    return <span className="font-extrabold text-slate-900">{event.vehicle.vehicleNo}</span>
                }
                if (event.sourceType === 'STAFF' && event.staff) {
                    return <span className="font-extrabold text-slate-900">{event.staff.name} <span className="font-medium text-slate-500">({event.staff.empId})</span></span>
                }
                return '-'
            }
        },
        { 
            key: 'eventType', 
            header: 'Event', 
            cell: (event) => <StatusHighlighter value={formatEventType(event.eventType)} /> 
        },
        { 
            key: 'reason', 
            header: 'Context', 
            cell: (event) => event.tripDetails?.reason || '-' 
        },
        { 
            key: 'actor', 
            header: 'Recorded By', 
            cell: (event) => event.actor?.name || '-' 
        }
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent">
            <PageHeader
                title="Entry Logs"
                subtitle="Read-only physical movement timeline across the facility."
                breadcrumbs={[{ label: 'Security' }, { label: 'Entry Logs' }]}
            />

            <div className="rounded-3xl border border-gray-100/80 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
                <FilterSection
                    searchQuery={searchQuery}
                    onSearchChange={(event) => setSearchQuery(event.target.value)}
                    searchPlaceholder="Search timeline..."
                    filters={[
                        {
                            name: 'sourceType',
                            value: sourceTypeFilter,
                            onChange: (event) => setSourceTypeFilter(event.target.value),
                            options: [
                                { value: 'ALL', label: 'All Targets' },
                                { value: 'STAFF', label: 'Staff Only' },
                                { value: 'VEHICLE', label: 'Vehicles Only' }
                            ]
                        },
                        {
                            name: 'eventType',
                            value: eventTypeFilter,
                            onChange: (event) => setEventTypeFilter(event.target.value),
                            options: [
                                { value: 'ALL', label: 'All Events' },
                                { value: 'STAFF_ENTRY', label: 'Staff Entry' },
                                { value: 'TEMP_EXIT', label: 'Temporary Exit' },
                                { value: 'STAFF_RETURN', label: 'Returned' },
                                { value: 'STAFF_FINAL_EXIT', label: 'Final Exit' },
                                { value: 'VEHICLE_ENTRY', label: 'Vehicle Entry' },
                                { value: 'VEHICLE_EXIT', label: 'Vehicle Exit' }
                            ]
                        }
                    ]}
                />
                
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600">Date Range (Server bound):</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(event) => { setFromDate(event.target.value); setPage(1); }}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-primary-400"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(event) => { setToDate(event.target.value); setPage(1); }}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-primary-400"
                        />
                    </div>
                    {(fromDate || toDate) && (
                        <button 
                            type="button" 
                            onClick={() => { setFromDate(''); setToDate(''); setPage(1); }} 
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                        >
                            Clear Dates
                        </button>
                    )}
                </div>
            </div>

            <DataTable
                data={filteredRows}
                columns={columns}
                keyExtractor={(event) => event.id}
                isLoading={isLoading}
                emptyStateMessage={isError ? "Failed to load timeline." : (searchQuery || eventTypeFilter !== 'ALL' || sourceTypeFilter !== 'ALL') ? "No movements match the selected filters." : "No security movement records found."}
                pagination={{
                    currentPage: page,
                    totalPages: pagination?.total ? Math.ceil(pagination.total / pagination.limit) : 1,
                    onPageChange: (newPage) => setPage(newPage)
                }}
                actions={(event) => (
                    <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-200"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                    </button>
                )}
            />

            <SecurityMovementDetailsModal 
                event={selectedEvent} 
                onClose={() => setSelectedEvent(null)} 
            />
        </div>
    )
}
