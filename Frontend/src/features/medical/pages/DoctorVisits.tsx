import { useMemo, useState } from 'react'
import { Stethoscope, Plus, Receipt, History } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { PatientSelector } from '../../../components/PatientSelector'
import { useDoctorVisits, useCreateDoctorVisit } from '../hooks/useMedical'
import { useAuthStore } from '../../../store/authStore'
import { formatDateTime } from '../../healthcare/utils'
import { Modal } from '../../../components/Modal'

export function DoctorVisits() {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [viewVisit, setViewVisit] = useState<any>(null)
    const user = useAuthStore((state) => state.user)
    
    // Only fetch visits if doctor, or all if admin
    const { data: visits = [], isLoading } = useDoctorVisits(user?.role === 'MEDICAL_DOCTOR' ? { doctorId: user?.id } : undefined)
    const createVisit = useCreateDoctorVisit()

    const [formData, setFormData] = useState({
        patientId: '',
        chiefComplaint: '',
        clinicalNotes: '',
        medicalOrders: '',
        nextFollowUp: '',
        chargeConsultation: false,
        consultationAmount: ''
    })

    const visibleVisits = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return visits.filter((v) => !query || [
            v.patient?.name,
            v.chiefComplaint,
            v.clinicalNotes
        ].some(val => String(val || '').toLowerCase().includes(query)))
    }, [visits, searchQuery])

    const columns: Column<any>[] = [
        { key: 'date', header: 'Date', cell: (v) => formatDateTime(v.visitDate), sortable: true },
        { 
            key: 'patient', 
            header: 'Resident / Patient', 
            cell: (v) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                        <Stethoscope className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{v.patient?.name}</p>
                        <p className="text-xs font-semibold text-slate-500">Medical Consultation</p>
                    </div>
                </div>
            ) 
        },
        { key: 'complaint', header: 'Chief Complaint', cell: (v) => v.chiefComplaint || '-' },
        { key: 'followup', header: 'Follow-up', cell: (v) => v.nextFollowUp ? formatDateTime(v.nextFollowUp) : 'Not scheduled' },
        { 
            key: 'charges', 
            header: 'Charges', 
            cell: (v) => v.metadata?.chargeConsultation ? <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">${v.metadata?.consultationAmount}</span> : '-' 
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (v) => (
                <button
                    type="button"
                    onClick={() => setViewVisit(v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                    <History className="h-3.5 w-3.5" /> View Notes
                </button>
            )
        }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.patientId) return

        await createVisit.mutateAsync({
            ...formData,
            doctorId: user?.id,
            consultationAmount: formData.consultationAmount ? Number(formData.consultationAmount) : 0,
            nextFollowUp: formData.nextFollowUp || undefined
        })
        
        setFormData({
            patientId: '',
            chiefComplaint: '',
            clinicalNotes: '',
            medicalOrders: '',
            nextFollowUp: '',
            chargeConsultation: false,
            consultationAmount: ''
        })
        setDrawerOpen(false)
    }

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Doctor Visits & Consultations"
                subtitle="Log clinical notes, medical orders, and consultation billing for residents."
                breadcrumbs={[{ label: 'Medical' }, { label: 'Doctor Visits' }]}
            />

            <ActionBar 
                onAdd={() => setDrawerOpen(true)} 
                addLabel="Log New Visit" 
                showAdd={user?.role === 'MEDICAL_DOCTOR' || user?.role === 'SUPER_ADMIN'}
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search by resident name or complaint..."
            />

            <DataTable
                data={visibleVisits}
                columns={columns}
                keyExtractor={(v) => v.id}
                isLoading={isLoading}
                emptyStateMessage="No visits recorded yet."
            />

            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Log Medical Visit" size="lg">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <PatientSelector
                        value={formData.patientId}
                        onChange={(id) => setFormData(prev => ({ ...prev, patientId: id }))}
                        required
                    />

                    <Input
                        label="Chief Complaint"
                        required
                        value={formData.chiefComplaint}
                        onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                        placeholder="e.g. Fever, Cough, Regular Checkup"
                    />

                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Clinical Notes</span>
                        <textarea
                            required
                            value={formData.clinicalNotes}
                            onChange={(e) => setFormData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                            className="min-h-32 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Detailed clinical observation..."
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Medical Orders (Diet, Diagnostics, Nursing instructions)</span>
                        <textarea
                            value={formData.medicalOrders}
                            onChange={(e) => setFormData(prev => ({ ...prev, medicalOrders: e.target.value }))}
                            className="min-h-24 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Orders for nursing or kitchen..."
                        />
                    </label>

                    <Input
                        type="datetime-local"
                        label="Schedule Next Follow-up (Optional)"
                        value={formData.nextFollowUp}
                        onChange={(e) => setFormData(prev => ({ ...prev, nextFollowUp: e.target.value }))}
                    />

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-4 flex items-center gap-3">
                            <Receipt className="h-5 w-5 text-gray-500" />
                            <h4 className="font-bold text-gray-800">Consultation Charges</h4>
                        </div>
                        <label className="mb-3 flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.chargeConsultation}
                                onChange={(e) => setFormData(prev => ({ ...prev, chargeConsultation: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-sm font-semibold text-slate-700">Apply Consultation Charge (Invoices via Finance)</span>
                        </label>
                        {formData.chargeConsultation && (
                            <Input
                                type="number"
                                label="Consultation Amount"
                                required
                                value={formData.consultationAmount}
                                onChange={(e) => setFormData(prev => ({ ...prev, consultationAmount: e.target.value }))}
                                placeholder="0.00"
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createVisit.isPending} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            <Plus className="h-4 w-4" />
                            {createVisit.isPending ? 'Saving...' : 'Save Visit Record'}
                        </button>
                    </div>
                </form>
            </Drawer>

            <Modal isOpen={!!viewVisit} onClose={() => setViewVisit(null)} title="Visit Details" size="md">
                {viewVisit && (
                    <div className="space-y-4 p-1">
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500">Date</p>
                            <p className="font-semibold text-gray-900">{formatDateTime(viewVisit.visitDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500">Resident</p>
                            <p className="font-semibold text-gray-900">{viewVisit.patient?.name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500">Chief Complaint</p>
                            <p className="font-semibold text-gray-900">{viewVisit.chiefComplaint}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500">Clinical Notes</p>
                            <div className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                                {viewVisit.clinicalNotes}
                            </div>
                        </div>
                        {viewVisit.metadata?.medicalOrders && (
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-500">Medical Orders</p>
                                <div className="mt-1 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900 whitespace-pre-wrap">
                                    {viewVisit.metadata.medicalOrders}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    )
}
