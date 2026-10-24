import { useMemo, useState } from 'react'
import { ClipboardCheck, Plus, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useHealthcarePatients } from '../../healthcare/hooks/useHealthcare'
import { useCreatePatientCareAdlRecord, usePatientCareAdlRecords, useUpdatePatientCareAdlStatus } from '../hooks/usePatientCare'
import { formatDateTime } from '../../healthcare/utils'
import { PatientSelector } from '../../../components/PatientSelector'
import { StaffSelector } from '../../../components/StaffSelector'
import { Modal } from '../../../components/Modal'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { useEffect } from 'react'

export function ADLDailyLiving() {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [verificationModal, setVerificationModal] = useState<{ isOpen: boolean; recordId: string | null }>({ isOpen: false, recordId: null })
    const [verificationNotes, setVerificationNotes] = useState('')
    const [formData, setFormData] = useState({
        patientId: '',
        activityCategory: '',
        isMandatory: false,
        assignedStaffId: '',
        scheduledDate: '',
        mobility: '',
        hygiene: '',
        feeding: '',
        notes: ''
    })

    const [searchParams] = useSearchParams()
    const urlPatientId = searchParams.get('patientId')
    const urlAssignmentId = searchParams.get('assignmentId')
    const user = useAuthStore((state) => state.user)
    
    const isRestrictedRole = !['SUPER_ADMIN', 'NURSING_MANAGER', 'MEDICAL_MANAGER', 'ELDER_OPERATIONS_MANAGER', 'CARE_ALLOCATION_MANAGER'].includes(String(user?.role || '').trim().toUpperCase())

    useEffect(() => {
        if (urlPatientId) {
            setFormData(prev => ({ ...prev, patientId: urlPatientId }))
        }
    }, [urlPatientId])

    const { data: patients = [], isLoading: patientsLoading } = useHealthcarePatients()
    const { data: adlRecords = [], isLoading: adlLoading } = usePatientCareAdlRecords()
    const createAdl = useCreatePatientCareAdlRecord()
    const updateStatus = useUpdatePatientCareAdlStatus()

    const visibleRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return adlRecords.filter((record: any) => !query || [
            record.patient?.name,
            record.activityCategory,
            record.status
        ].some((value) => String(value || '').toLowerCase().includes(query)))
    }, [adlRecords, searchQuery])

    const statusCounts = useMemo(() => {
        return adlRecords.reduce((acc: any, record: any) => {
            acc[record.status] = (acc[record.status] || 0) + 1
            return acc
        }, {})
    }, [adlRecords])

    const columns: Column<any>[] = [
        {
            key: 'patient',
            header: 'Resident',
            cell: (record: any) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <ClipboardCheck className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.patient?.name || 'Unknown Resident'}</p>
                        <p className="text-xs font-semibold text-slate-500">{record.activityCategory}</p>
                    </div>
                </div>
            )
        },
        { key: 'scheduledDate', header: 'Schedule', cell: (record: any) => record.scheduledDate ? formatDateTime(record.scheduledDate) : '-' },
        { key: 'mandatory', header: 'Type', cell: (record: any) => record.isMandatory ? <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">Mandatory</span> : <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">Optional</span> },
        { key: 'notes', header: 'Notes', cell: (record: any) => record.notes || '-' },
        { key: 'status', header: 'Status', cell: (record: any) => <StatusHighlighter value={record.status.replace(/_/g, ' ')} /> },
        {
            key: 'actions',
            header: 'Actions',
            cell: (record: any) => (
                <div className="flex flex-wrap gap-2">
                    {record.status === 'ASSIGNED' && (
                        <>
                            <button
                                type="button"
                                onClick={() => updateStatus.mutate({ id: record.id, status: 'COMPLETED' })}
                                className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"
                                title="Mark Completed"
                            >
                                <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => updateStatus.mutate({ id: record.id, status: 'REFUSED' })}
                                className="rounded-lg bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                                title="Mark Refused"
                            >
                                <XCircle className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => updateStatus.mutate({ id: record.id, status: 'MISSED' })}
                                className="rounded-lg bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100"
                                title="Mark Missed"
                            >
                                <Clock className="h-4 w-4" />
                            </button>
                        </>
                    )}
                    {(record.status === 'COMPLETED' || record.status === 'REFUSED' || record.status === 'MISSED') && record.requiresVerification && (
                        <button
                            type="button"
                            onClick={() => updateStatus.mutate({ id: record.id, status: 'VERIFICATION_REQUIRED' })}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700"
                        >
                            Request Verification
                        </button>
                    )}
                    {record.status === 'VERIFICATION_REQUIRED' && (
                        <button
                            type="button"
                            onClick={() => setVerificationModal({ isOpen: true, recordId: record.id })}
                            className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 hover:bg-primary-100"
                        >
                            Verify
                        </button>
                    )}
                </div>
            )
        }
    ]

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!formData.patientId || !formData.activityCategory.trim()) return

        await createAdl.mutateAsync({
            ...formData,
            assignmentId: urlAssignmentId || undefined,
            scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined,
        })
        setFormData({ patientId: '', activityCategory: '', isMandatory: false, assignedStaffId: '', scheduledDate: '', mobility: '', hygiene: '', feeding: '', notes: '' })
        setDrawerOpen(false)
    }

    const handleVerify = async () => {
        if (!verificationModal.recordId) return
        await updateStatus.mutateAsync({
            id: verificationModal.recordId,
            status: 'VERIFIED',
            verificationNotes
        })
        setVerificationModal({ isOpen: false, recordId: null })
        setVerificationNotes('')
    }

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="ADL Daily Living"
                subtitle="Live activities of daily living (ADL) checks and workflows."
                breadcrumbs={[{ label: 'Patient Care' }, { label: 'ADL' }]}
            />
            {isRestrictedRole && !urlPatientId && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <AlertCircle className="mb-2 h-5 w-5 text-amber-600" />
                    <strong>Missing Assignment Context:</strong> You must select a patient from <Link to="/medical/my-shift" className="underline font-bold">My Shift</Link> to record ADLs.
                </div>
            )}

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-extrabold text-slate-800">{adlRecords.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Total Records</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{statusCounts['ASSIGNED'] || 0}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Assigned</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{statusCounts['COMPLETED'] || 0}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Completed</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{statusCounts['VERIFICATION_REQUIRED'] || 0}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Pending Verification</p>
                </div>
            </div>

            <ActionBar 
                onAdd={() => setDrawerOpen(true)} 
                addLabel="Assign ADL" 
                disabled={isRestrictedRole && !urlPatientId}
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search resident or category..."
            />

            <DataTable
                data={visibleRecords}
                columns={columns}
                keyExtractor={(record: any) => record.id}
                isLoading={patientsLoading || adlLoading}
                emptyStateMessage="No live ADL records found."
            />

            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Assign ADL" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <PatientSelector
                        value={formData.patientId}
                        onChange={(val) => setFormData((prev) => ({ ...prev, patientId: val }))}
                        required
                        disabled={isRestrictedRole}
                    />
                    <Input 
                        label="Activity Category" 
                        required 
                        value={formData.activityCategory} 
                        onChange={(event) => setFormData((prev) => ({ ...prev, activityCategory: event.target.value }))} 
                        placeholder="e.g. Morning Routine, Evening Walk" 
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isMandatory"
                            checked={formData.isMandatory}
                            onChange={(e) => setFormData((prev) => ({ ...prev, isMandatory: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                        />
                        <label htmlFor="isMandatory" className="text-sm font-semibold text-slate-700">Mandatory Activity</label>
                    </div>
                    <StaffSelector 
                        value={formData.assignedStaffId}
                        onChange={(val) => setFormData((prev) => ({ ...prev, assignedStaffId: val }))}
                        placeholder="Assign to Caregiver..."
                    />
                    <Input 
                        type="datetime-local"
                        label="Scheduled Date/Time" 
                        value={formData.scheduledDate} 
                        onChange={(event) => setFormData((prev) => ({ ...prev, scheduledDate: event.target.value }))} 
                    />
                    <div className="border-t border-slate-200 pt-4">
                        <p className="mb-2 text-sm font-bold text-slate-800">Optional Specifics</p>
                        <div className="space-y-3">
                            <Input label="Mobility Instructions" value={formData.mobility} onChange={(event) => setFormData((prev) => ({ ...prev, mobility: event.target.value }))} placeholder="Walked with support / bed rest" />
                            <Input label="Hygiene Instructions" value={formData.hygiene} onChange={(event) => setFormData((prev) => ({ ...prev, hygiene: event.target.value }))} placeholder="Bathing, grooming" />
                            <Input label="Feeding Instructions" value={formData.feeding} onChange={(event) => setFormData((prev) => ({ ...prev, feeding: event.target.value }))} placeholder="Self-fed / assisted" />
                        </div>
                    </div>
                    <label className="block border-t border-slate-200 pt-4">
                        <span className="mb-1 block text-sm font-bold text-slate-700">General Notes</span>
                        <textarea
                            value={formData.notes}
                            onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                            className="min-h-24 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            placeholder="Observation, discomfort..."
                        />
                    </label>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createAdl.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            <Plus className="h-4 w-4" />
                            {createAdl.isPending ? 'Assigning...' : 'Assign ADL'}
                        </button>
                    </div>
                </form>
            </Drawer>

            <Modal isOpen={verificationModal.isOpen} onClose={() => setVerificationModal({ isOpen: false, recordId: null })} title="Manager Verification">
                <div className="p-1">
                    <p className="mb-4 text-sm text-slate-600">Please provide verification notes to finalize this ADL.</p>
                    <label className="block mb-4">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Verification Notes</span>
                        <textarea
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            rows={4}
                            placeholder="Verified and checked by manager..."
                        />
                    </label>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setVerificationModal({ isOpen: false, recordId: null })} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Cancel</button>
                        <button onClick={handleVerify} disabled={updateStatus.isPending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">Confirm Verification</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
