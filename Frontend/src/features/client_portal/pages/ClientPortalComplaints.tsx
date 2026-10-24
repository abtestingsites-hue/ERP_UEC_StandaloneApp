import { useState } from 'react'
import type { ReactNode } from 'react'
import { Eye, Plus } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Modal } from '../../../components/Modal'
import { useClientPortalComplaintCreate, useClientPortalComplaints } from '../hooks/useClientPortal'
import type { ClientPortalComplaint } from '../services/clientPortal'

const formatDate = (value?: string) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-GB') : '-'
}

export function ClientPortalComplaints() {
    const { data = [], isLoading } = useClientPortalComplaints()
    const createComplaint = useClientPortalComplaintCreate()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedComplaint, setSelectedComplaint] = useState<ClientPortalComplaint | null>(null)
    const [category, setCategory] = useState('Service Feedback')
    const [priority, setPriority] = useState('Medium')
    const [description, setDescription] = useState('')

    const columns: Column<ClientPortalComplaint>[] = [
        { key: 'refNo', header: 'Complaint Ref', cell: (row) => row.refNo || row.id },
        { key: 'type', header: 'Category', cell: (row) => row.type || row.metadata?.category || '-' },
        { key: 'description', header: 'Details' },
        { key: 'priority', header: 'Priority', cell: (row) => <StatusHighlighter value={row.priority || 'Medium'} /> },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status || 'Open'} /> },
        { key: 'createdAt', header: 'Raised On', cell: (row) => formatDate(row.createdAt) }
    ]

    const submitComplaint = () => {
        createComplaint.mutate({ category, priority, description }, {
            onSuccess: () => {
                setIsOpen(false)
                setCategory('Service Feedback')
                setPriority('Medium')
                setDescription('')
            }
        })
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <PageHeader
                    title="My Complaints"
                    subtitle="Complaints raised from feedback or directly by this client login."
                    breadcrumbs={[{ label: 'Client Portal' }, { label: 'My Complaints' }]}
                />
                <button onClick={() => setIsOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm">
                    <Plus className="h-4 w-4" />
                    Raise Complaint
                </button>
            </div>

            <DataTable
                data={data}
                columns={columns}
                keyExtractor={(row) => row.id}
                isLoading={isLoading}
                emptyStateMessage="No live complaints are linked to this client login."
                actions={(row) => (
                    <button
                        onClick={() => setSelectedComplaint(row)}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-700 shadow-sm hover:border-primary-200 hover:text-primary-700"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Track
                    </button>
                )}
            />

            <Modal isOpen={Boolean(selectedComplaint)} onClose={() => setSelectedComplaint(null)} title="Complaint Tracking">
                {selectedComplaint && (
                    <ComplaintTracking complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
                )}
            </Modal>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Raise Complaint">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Category</label>
                        <input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Priority</label>
                        <select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Details</label>
                        <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-[120px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsOpen(false)} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold">Cancel</button>
                        <button onClick={submitComplaint} disabled={createComplaint.isPending || !description.trim()} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">Submit</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

const formatDateTime = (value?: string | null) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-'
}

const TrackingBox = ({ label, value, wide = false }: { label: string; value?: ReactNode; wide?: boolean }) => (
    <div className={`rounded-lg border border-gray-200 bg-white p-3 ${wide ? 'sm:col-span-2' : ''}`}>
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-400">{label}</p>
        <div className="mt-1 text-sm font-bold text-gray-900">{value || '-'}</div>
    </div>
)

function ComplaintTracking({ complaint, onClose }: { complaint: ClientPortalComplaint; onClose: () => void }) {
    const metadata = complaint.metadata || {}
    const assignedStaff = metadata.assignedStaffName || metadata.assignedTo || 'Not assigned yet'
    const resolutionNotes = metadata.resolutionNotes || metadata.notes || '-'
    const complaintStatus = String(complaint.status || 'OPEN').toUpperCase()
    const isClosed = complaintStatus === 'CLOSED' || complaintStatus === 'RESOLVED'

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-primary-700">{complaint.refNo || complaint.id}</p>
                <h3 className="mt-1 text-lg font-extrabold text-gray-900">{complaint.type || metadata.category || 'Complaint'}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                    <StatusHighlighter value={complaint.status || 'Open'} />
                    <StatusHighlighter value={complaint.priority || metadata.priority || 'Medium'} />
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <TrackingBox label="Raised On" value={formatDateTime(complaint.createdAt)} />
                <TrackingBox label="Last Updated" value={formatDateTime(complaint.updatedAt)} />
                <TrackingBox label="Assigned Staff" value={assignedStaff} />
                <TrackingBox label="Assigned On" value={formatDateTime(metadata.assignedAt)} />
                <TrackingBox label="Resolved On" value={formatDateTime(metadata.resolvedAt || metadata.closedAt)} />
                <TrackingBox label="Current Stage" value={isClosed ? 'Resolved by customer care' : complaintStatus === 'ASSIGNED' ? 'Assigned for follow-up' : 'Waiting for assignment'} />
                <TrackingBox label="Complaint Details" value={complaint.description} wide />
                <TrackingBox label="Resolution Notes" value={resolutionNotes} wide />
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Progress</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <ProgressStep label="Raised" done />
                    <ProgressStep label="Assigned" done={Boolean(metadata.assignedAt || metadata.assignedStaffName || complaintStatus !== 'OPEN')} />
                    <ProgressStep label="Resolved" done={isClosed || Boolean(metadata.resolvedAt || metadata.closedAt)} />
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold">Close</button>
            </div>
        </div>
    )
}

function ProgressStep({ label, done }: { label: string; done: boolean }) {
    return (
        <div className={`rounded-lg border px-3 py-2 text-center text-xs font-extrabold ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-400'}`}>
            {label}
        </div>
    )
}
