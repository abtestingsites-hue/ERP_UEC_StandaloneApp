import { useState } from 'react'
import { Plus, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { api } from '../../../lib/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { PatientSelector } from '../../../components/PatientSelector'
import { ApprovalDialog } from '../../../components/ApprovalDialog'
import { DataTable } from '../../../components/DataTable'

export const useUecIncidents = (patientId?: string | null, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['uec-incidents', patientId],
        queryFn: async () => {
            const config: any = {}
            if (patientId) config.params = { patientId }
            const res = await api.get('/uec/incidents', config)
            return res.data.data || []
        },
        enabled: options?.enabled
    })
}

const useReportIncident = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post('/uec/incidents', payload)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['uec-incidents'] })
            toast({ type: 'success', title: 'Reported', message: 'Incident reported successfully' })
        }
    })
}

const useUpdateIncidentStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: async ({ id, status, remarks }: { id: string, status: string, remarks?: string }) => {
            const res = await api.patch(`/uec/incidents/${id}/status`, { status, remarks })
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['uec-incidents'] })
            toast({ type: 'success', title: 'Updated', message: 'Incident status updated' })
        }
    })
}

export function IncidentReports() {
    const { data: incidents = [], isLoading } = useUecIncidents()
    const reportIncident = useReportIncident()
    const updateStatus = useUpdateIncidentStatus()
    
    // Form state
    const [patientId, setPatientId] = useState('') 
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().substring(0, 16))
    const [severity, setSeverity] = useState('MEDIUM')
    const [witnesses, setWitnesses] = useState('')
    const [actionTaken, setActionTaken] = useState('')

    const [isApprovalOpen, setIsApprovalOpen] = useState(false)
    const [selectedIncident, setSelectedIncident] = useState<any>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!patientId) return;

        reportIncident.mutate({
            patientId,
            title,
            description,
            date: new Date(date).toISOString(),
            severity,
            witnesses,
            actionTaken,
            status: 'OPEN'
        })
        
        setTitle('')
        setDescription('')
        setSeverity('MEDIUM')
        setWitnesses('')
        setActionTaken('')
        setPatientId('')
    }

    

    const STATUS_FLOW = ['OPEN', 'INVESTIGATING', 'CLOSED'];
    
    const getNextStatus = (currentStatus: string) => {
        const idx = STATUS_FLOW.indexOf(currentStatus);
        if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
        return null;
    }

    const handleApprove = (comments: string) => {
        if (!selectedIncident) return;
        const next = getNextStatus(selectedIncident.status || 'OPEN');
        if (next) {
            updateStatus.mutate({ id: selectedIncident.id, status: next, remarks: comments });
        }
        setIsApprovalOpen(false);
    }

    const columns = [
        {
            key: 'title',
            header: 'Incident',
            render: (row: any) => (
                <div>
                    <div className="font-bold text-gray-900 dark:text-gray-100">{row.title}</div>
                    <div className="text-xs text-gray-500">{row.patientName}</div>
                </div>
            )
        },
        {
            key: 'severity',
            header: 'Severity',
            render: (row: any) => (
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-extrabold">
                    {row.severity}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: any) => (
                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    {row.status || 'OPEN'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row: any) => {
                const next = getNextStatus(row.status || 'OPEN');
                if (!next) return <span className="text-xs text-gray-400">Closed</span>;
                return (
                    <button
                        onClick={() => { setSelectedIncident(row); setIsApprovalOpen(true); }}
                        className="flex items-center gap-1 rounded-md bg-[#0F969C] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0A7075]"
                    >
                        <CheckCircle2 className="h-3 w-3" />
                        Move to {next}
                    </button>
                )
            }
        }
    ]

    return (
        <div className="flex h-full flex-col bg-gray-50/50 p-6 dark:bg-[#0A2429]">
            <PageHeader
                title="Incident Reports"
                subtitle="Report and manage patient incidents or facility events."
                breadcrumbs={[{ label: 'Patient Care' }, { label: 'Incidents' }]}
                
            />

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
                <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Report New Incident</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Fill in the details below to log a new event.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <PatientSelector value={patientId} onChange={(id) => setPatientId(id)} required />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Incident Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white" required placeholder="e.g. Fall in hallway" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Date & Time</label>
                                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white" required />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Severity</label>
                                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Description of Event</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white" rows={3} required />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Immediate Action Taken</label>
                            <textarea value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white" rows={2} placeholder="e.g. First aid administered, vitals checked" />
                        </div>
                    </div>

                    <button type="submit" disabled={reportIncident.isPending} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:opacity-50">
                        <Plus className="h-4 w-4" />
                        Submit Report
                    </button>
                </form>

                <div className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Incident Log</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Manage reported incidents.</p>
                    </div>

                    <DataTable columns={columns} data={incidents} isLoading={isLoading} keyExtractor={(row: any) => row.id} />
                </div>
            </div>

            <ApprovalDialog
                isOpen={isApprovalOpen}
                onClose={() => setIsApprovalOpen(false)}
                title="Update Incident Status"
                entityName={selectedIncident ? `Incident ${selectedIncident.title}` : ''}
                onApprove={handleApprove}
                isProcessing={updateStatus.isPending}
            />
        </div>
    )
}





