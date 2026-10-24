import { useEffect, useMemo, useState } from 'react'
import { Download, Play } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { chatService } from '../../conversation/services/chat.service'
import { connectRealtimeSocket, realtimeSocket } from '../../../lib/realtimeSocket'

const formatDuration = (seconds?: number | null) => {
    const total = Math.max(0, Number(seconds || 0))
    const minutes = Math.floor(total / 60)
    const remainder = total % 60
    return minutes ? `${minutes}m ${remainder.toString().padStart(2, '0')}s` : `${remainder}s`
}

const formatLabel = (value?: string) =>
    String(value || '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())

export function Calls() {
    const [calls, setCalls] = useState<any[]>([])
    const [analytics, setAnalytics] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const fetchCalls = async () => {
        setIsLoading(true)
        try {
            const [history, summary] = await Promise.all([
                chatService.getCallHistory({ limit: 200 }),
                chatService.getCallAnalytics()
            ])
            setCalls(Array.isArray(history) ? history : [])
            setAnalytics(summary || null)
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
        realtimeSocket.on('call:started', refresh)
        realtimeSocket.on('call:updated', refresh)
        realtimeSocket.on('call:ended', refresh)
        return () => {
            realtimeSocket.off('call:started', refresh)
            realtimeSocket.off('call:updated', refresh)
            realtimeSocket.off('call:ended', refresh)
        }
    }, [])

    const filteredCalls = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return calls

        return calls.filter((call) => [
            call.customerName,
            call.customerPhone,
            call.agentName,
            call.agentEmail,
            call.provider,
            call.status,
            call.direction
        ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
    }, [calls, searchQuery])

    const columns: Column<any>[] = [
        { key: 'callSid', header: 'Call ID', cell: (call) => call.callSid || call.id, sortable: true },
        { key: 'customerPhone', header: 'Customer', cell: (call) => (
            <div>
                <p className="font-semibold text-slate-900 dark:text-white">{call.customerName || call.customerPhone}</p>
                <p className="text-xs text-slate-500">{call.customerPhone}</p>
            </div>
        ) },
        { key: 'direction', header: 'Direction', cell: (call) => <StatusHighlighter value={call.direction} /> },
        { key: 'status', header: 'Status', cell: (call) => <StatusHighlighter value={call.status} /> },
        { key: 'duration', header: 'Duration', cell: (call) => formatDuration(call.duration), sortable: true },
        { key: 'provider', header: 'Provider', cell: (call) => formatLabel(call.provider) },
        { key: 'agentName', header: 'Agent', cell: (call) => call.agentName || call.agentEmail || '-' },
        { key: 'startedAt', header: 'Started At', cell: (call) => new Date(call.startedAt).toLocaleString(), sortable: true },
        { key: 'recordingUrl', header: 'Recording', cell: (call) => call.recordingUrl ? (
            <div className="flex items-center gap-2">
                <a href={call.recordingUrl} target="_blank" rel="noreferrer" className="p-1 text-amber-600 hover:bg-amber-50 rounded" title="Play Recording">
                    <Play className="h-4 w-4" />
                </a>
                <a href={call.recordingUrl} download className="p-1 text-slate-600 hover:bg-slate-50 rounded" title="Download Recording">
                    <Download className="h-4 w-4" />
                </a>
            </div>
        ) : '-' }
    ]

    return (
        <div className="flex flex-col h-full bg-transparent dark:bg-black">
            <PageHeader title="Calls" breadcrumbs={[{ label: 'Omnichannel' }, { label: 'Calls' }]} />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-4">
                {[
                    ['Total Calls', analytics?.totalCalls ?? calls.length],
                    ['Answered', analytics?.answeredCalls ?? 0],
                    ['Missed', analytics?.missedCalls ?? 0],
                    ['Avg Duration', formatDuration(analytics?.averageDuration ?? 0)]
                ].map(([label, value]) => (
                    <div key={label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                        <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">{value}</p>
                    </div>
                ))}
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search calls, phone, agent, provider..."
            />

            <DataTable
                data={filteredCalls}
                columns={columns}
                keyExtractor={(call) => call.id}
                isLoading={isLoading}
                emptyStateMessage="No call history found."
            />
        </div>
    )
}
