// @ts-nocheck
import { useState } from 'react'
import { CalendarClock, CheckCircle2, Pill, Plus, ClipboardList } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { Modal } from '../../../components/Modal'
import { useAdmissions } from '../../enquiry/hooks/useEnquiry'
import { usePrescriptions, useCreatePrescription, useMedicationLogs, useAdministerMedicationLog, useVerifyMedicationLog } from '../hooks/useNursingCare'
import { useInventoryProducts } from '../../inventory/hooks/useInventory'
import { useAuthStore } from '../../../store/authStore'
import { formatDateTime } from '../../healthcare/utils'
import { useSearchParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export function MedicationSchedule() {
    const { data: admissions = [], isLoading } = useAdmissions()
    const [selectedPatientId, setSelectedPatientId] = useState<string>('')
    const [activeTab, setActiveTab] = useState<'prescriptions' | 'logs'>('prescriptions')

    // Modals
    const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false)
    const [administeringPrescription, setAdministeringPrescription] = useState<any>(null)
    const [verifyingLogId, setVerifyingLogId] = useState<string | null>(null)

    // Form states
    const [productId, setProductId] = useState('')
    const [medication, setMedication] = useState('')
    const [dosage, setDosage] = useState('')
    const [frequency, setFrequency] = useState('Once Daily')
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
    const [endDate, setEndDate] = useState('')
    const [instructions, setInstructions] = useState('')

    const [dosageGiven, setDosageGiven] = useState('')
    const [administerNotes, setAdministerNotes] = useState('')
    const [verifyNotes, setVerifyNotes] = useState('')

    const user = useAuthStore((state) => state.user)
    const canPrescribe = user?.role === 'SUPER_ADMIN' || user?.role === 'MEDICAL_DOCTOR' || user?.role === 'MEDICAL_MANAGER'
    const canAdminister = user?.role === 'SUPER_ADMIN' || user?.role === 'NURSING_CARE_STAFF' || user?.role === 'NURSING_MANAGER'
    const canVerify = user?.role === 'SUPER_ADMIN' || user?.role === 'NURSING_MANAGER' || user?.role === 'MEDICAL_MANAGER'

    const [searchParams] = useSearchParams()
    const urlPatientId = searchParams.get('patientId')
    const isRestrictedRole = !['SUPER_ADMIN', 'NURSING_MANAGER', 'MEDICAL_MANAGER', 'ELDER_OPERATIONS_MANAGER', 'CARE_ALLOCATION_MANAGER'].includes(String(user?.role || '').trim().toUpperCase())

    useEffect(() => {
        if (urlPatientId) {
            setSelectedPatientId(urlPatientId)
        }
    }, [urlPatientId])

    const { data: prescriptions = [], isLoading: loadingPrescriptions } = usePrescriptions(selectedPatientId, null, { enabled: Boolean(selectedPatientId) })
    const { data: logs = [], isLoading: loadingLogs } = useMedicationLogs(selectedPatientId, null, { enabled: Boolean(selectedPatientId) })

    const createPrescription = useCreatePrescription()
    const administerLog = useAdministerMedicationLog()
    const verifyLog = useVerifyMedicationLog()

    const { data: allProducts = [] } = useInventoryProducts()
    const medicineProducts = allProducts.filter((p: any) => 
        String(p.category || '').toLowerCase().includes('medicine') || 
        String(p.category || '').toLowerCase().includes('pharmacy')
    )

    const handleSavePrescription = () => {
        if (!selectedPatientId) return
        createPrescription.mutate({
            patientId: selectedPatientId,
            productId: productId || undefined,
            medication,
            dosage,
            frequency,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
            instructions
        }, {
            onSuccess: () => {
                setIsAddPrescriptionOpen(false)
                setProductId('')
                setMedication('')
                setDosage('')
                setInstructions('')
            }
        })
    }

    const handleAdminister = () => {
        if (!administeringPrescription) return
        administerLog.mutate({
            patientId: selectedPatientId,
            prescriptionId: administeringPrescription.id,
            medication: administeringPrescription.medication,
            dosageGiven,
            notes: administerNotes
        }, {
            onSuccess: () => {
                setAdministeringPrescription(null)
                setDosageGiven('')
                setAdministerNotes('')
                setActiveTab('logs')
            }
        })
    }

    const handleVerify = () => {
        if (!verifyingLogId) return
        verifyLog.mutate({ id: verifyingLogId, notes: verifyNotes }, {
            onSuccess: () => {
                setVerifyingLogId(null)
                setVerifyNotes('')
            }
        })
    }

    const prescriptionColumns: Column<any>[] = [
        { header: 'Medication', key: 'col', cell: (row: any) => row.medication, className: 'font-semibold text-gray-900 dark:text-gray-100' },
        { header: 'Dosage', key: 'col', cell: (row: any) => row.dosage },
        { header: 'Frequency', key: 'col', cell: (row: any) => row.frequency },
        { header: 'Start Date', key: 'col', cell: (row: any) => formatDateTime(row.startDate) },
        { header: 'End Date', key: 'col', cell: (row: any) => row.endDate ? formatDateTime(row.endDate) : 'Ongoing' }
    ]

    const logColumns: Column<any>[] = [
        { header: 'Time', key: 'col', cell: (row: any) => formatDateTime(row.administeredAt), className: 'font-medium' },
        { header: 'Medication', key: 'col', cell: (row: any) => row.medication },
        { header: 'Dosage Given', key: 'col', cell: (row: any) => row.dosageGiven },
        { header: 'Administered By', key: 'col', cell: (row: any) => row.administeredBy },
        {
            header: 'Status',
            key: 'col', cell: (row: any) => (
                row.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                        Pending Verification
                    </span>
                )
            )
        }
    ]

    return (
        <div className="space-y-6">
            <PageHeader
                title="Medication Schedule"
                subtitle="Track and administer patient medications"
                breadcrumbs={[{ label: 'Nursing Care' }, { label: 'Medications' }]}
                actions={
                    canPrescribe && (
                        <button
                            onClick={() => setIsAddPrescriptionOpen(true)}
                            disabled={!selectedPatientId}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            New Prescription
                        </button>
                    )
                }
            />

            {isRestrictedRole && !urlPatientId && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <AlertCircle className="mb-2 h-5 w-5 text-amber-600" />
                    <strong>Missing Assignment Context:</strong> You must select a patient from <Link to="/medical/my-shift" className="underline font-bold">My Shift</Link> to administer medication.
                </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
                <div className="max-w-md">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Select Patient
                    </label>
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        disabled={isRestrictedRole}
                        className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
                    >
                        <option value="">-- Choose Admitted Patient --</option>
                        {admissions.filter(a => a.patientId).map((a) => (
                            <option key={a.id} value={a.patientId}>{a.patientName} ({a.refNo})</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedPatientId && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-white/10 dark:bg-black">
                    <div className="flex border-b border-gray-200 dark:border-white/10">
                        <button
                            onClick={() => setActiveTab('prescriptions')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                                activeTab === 'prescriptions' ? 'border-[#0F969C] text-[#0F969C]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <CalendarClock className="h-4 w-4" />
                            Active Prescriptions
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                                activeTab === 'logs' ? 'border-[#0F969C] text-[#0F969C]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <ClipboardList className="h-4 w-4" />
                            Medication Logs
                        </button>
                    </div>

                    <div className="p-4">
                        {activeTab === 'prescriptions' ? (
                            <DataTable
                                data={prescriptions}
                                columns={prescriptionColumns}
                                keyExtractor={(item) => item.id}
                                isLoading={loadingPrescriptions}
                                actionsTitle="Action"
                                actions={(row: any) => (
                                    canAdminister && row.isApproved ? (
                                        <button
                                            onClick={() => {
                                                setAdministeringPrescription(row)
                                                setDosageGiven(row.dosage)
                                            }}
                                            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100"
                                        >
                                            Administer Dose
                                        </button>
                                    ) : null
                                )}
                            />
                        ) : (
                            <DataTable
                                data={logs}
                                columns={logColumns}
                                keyExtractor={(item) => item.id}
                                isLoading={loadingLogs}
                                actionsTitle="Action"
                                actions={(row: any) => (
                                    !row.isVerified && canVerify ? (
                                        <button
                                            onClick={() => setVerifyingLogId(row.id)}
                                            className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-100"
                                        >
                                            Verify Log
                                        </button>
                                    ) : null
                                )}
                            />
                        )}
                    </div>
                </div>
            )}

            <Modal isOpen={isAddPrescriptionOpen} onClose={() => setIsAddPrescriptionOpen(false)} title="New Prescription" confirmLabel="Create Prescription" onConfirm={handleSavePrescription}>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium">Link Catalog Product (Optional)
                            <select value={productId} onChange={e => {
                                setProductId(e.target.value);
                                if (e.target.value) {
                                    const prod = medicineProducts.find((p: any) => p.id === e.target.value);
                                    if (prod && !medication) setMedication(prod.name);
                                }
                            }} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10">
                                <option value="">-- No Product Linked (Legacy Mode) --</option>
                                {medicineProducts.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label className="block text-sm font-medium">Medication<input value={medication} onChange={e => setMedication(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10" placeholder="e.g. Paracetamol 500mg" /></label>
                    <label className="block text-sm font-medium">Dosage<input value={dosage} onChange={e => setDosage(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10" placeholder="1 tablet" /></label>
                    <label className="block text-sm font-medium">Frequency
                        <select value={frequency} onChange={e => setFrequency(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10">
                            <option>Once Daily</option><option>Twice Daily</option><option>Three Times Daily</option><option>As Needed (PRN)</option>
                        </select>
                    </label>
                    <label className="block text-sm font-medium">Start Date<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10" /></label>
                    <label className="block text-sm font-medium">End Date (Optional)<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10" /></label>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium">Instructions (Optional)<textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10" placeholder="Take after food" /></label>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={Boolean(administeringPrescription)} onClose={() => setAdministeringPrescription(null)} title="Administer Medication" confirmLabel="Log Dose" onConfirm={handleAdminister}>
                <div className="mt-4 space-y-4">
                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{administeringPrescription?.medication}</p>
                        <p className="text-sm text-gray-500">Prescribed: {administeringPrescription?.dosage} - {administeringPrescription?.frequency}</p>
                    </div>
                    <label className="block text-sm font-medium">Dosage Given<input value={dosageGiven} onChange={e => setDosageGiven(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10" /></label>
                    <label className="block text-sm font-medium">Administration Notes (Optional)<textarea value={administerNotes} onChange={e => setAdministerNotes(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10" placeholder="Patient responded well" /></label>
                </div>
            </Modal>

            <Modal isOpen={Boolean(verifyingLogId)} onClose={() => setVerifyingLogId(null)} title="Verify Administration" confirmLabel="Approve Log" onConfirm={handleVerify}>
                <div className="mt-4"><label className="block text-sm font-medium">Verification Notes (Optional)<textarea value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm dark:bg-black dark:border-white/10" placeholder="Looks good" /></label></div>
            </Modal>
        </div>
    )
}



