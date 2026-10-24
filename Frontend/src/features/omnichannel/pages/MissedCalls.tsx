import { useEffect, useMemo, useState } from 'react'
import { Phone } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { chatService } from '../../conversation/services/chat.service'
import { connectRealtimeSocket, realtimeSocket } from '../../../lib/realtimeSocket'

export function MissedCalls() {
    const [calls, setCalls] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const fetchCalls = async () => {
        setIsLoading(true)
        try {
            const history = await chatService.getCallHistory({ status: 'missed', limit: 200 })
            setCalls(Array.isArray(history) ? history : [])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCalls()
    }, [])

    useEffect(() => {
        connectRealtimeSocket()
        const refresh = () => fetchCalls()
        realtimeSocket.on('call:ended', refresh)
        return () => {
            realtimeSocket.off('call:ended', refresh)
        }
    }, [])

    const filteredCalls = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return calls
        return calls.filter((call) => [call.customerName, call.customerPhone, call.agentName, call.provider].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
    }, [calls, searchQuery])

    const columns: Column<any>[] = [
        { key: 'callSid', header: 'Call ID', cell: (call) => call.callSid || call.id },
        { key: 'customerPhone', header: 'Caller', cell: (call) => (
            <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-rose-500" />
                <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{call.customerName || call.customerPhone}</p>
                    <p className="text-xs text-slate-500">{call.customerPhone}</p>
                </div>
            </div>
        ) },
        { key: 'status', header: 'Status', cell: (call) => <StatusHighlighter value={call.status} /> },
        { key: 'provider', header: 'Provider' },
        { key: 'agentName', header: 'Callback Owner', cell: (call) => call.agentName || call.agentEmail || '-' },
        { key: 'startedAt', header: 'Missed At', cell: (call) => new Date(call.startedAt).toLocaleString(), sortable: true }
    ]

    return (
        <div className="flex flex-col h-full bg-transparent dark:bg-black">
            <PageHeader title="Missed Calls" breadcrumbs={[{ label: 'Omnichannel' }, { label: 'Missed Calls' }]} />
            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search missed calls..."
            />
            <DataTable
                data={filteredCalls}
                columns={columns}
                keyExtractor={(call) => call.id}
                isLoading={isLoading}
                emptyStateMessage="No missed calls found."
            />
        </div>
    )
}
