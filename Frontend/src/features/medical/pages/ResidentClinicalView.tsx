import { useMemo, useState } from 'react'
import { Stethoscope, FileText, ClipboardList } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { PatientSelector } from '../../../components/PatientSelector'
import { useDoctorVisits } from '../hooks/useMedical'
import { formatDateTime } from '../../healthcare/utils'
import { Modal } from '../../../components/Modal'

export function ResidentClinicalView() {
    const [patientId, setPatientId] = useState('')
    const [viewVisit, setViewVisit] = useState<any>(null)
    const { data: visits = [], isLoading } = useDoctorVisits(patientId ? { patientId } : undefined)

    const columns: Column<any>[] = [
        { key: 'date', header: 'Visit Date', cell: (v) => formatDateTime(v.visitDate), sortable: true },
        { key: 'doctor', header: 'Doctor', cell: (v) => `Dr. ${v.doctor?.firstName || ''} ${v.doctor?.lastName || ''}`.trim() || 'Assigned Doctor' },
        { key: 'complaint', header: 'Chief Complaint', cell: (v) => v.chiefComplaint || '-' },
        { key: 'followup', header: 'Follow-up Date', cell: (v) => v.nextFollowUp ? formatDateTime(v.nextFollowUp) : 'None scheduled' },
        {
            key: 'actions',
            header: 'View Details',
            cell: (v) => (
                <button
                    type="button"
                    onClick={() => setViewVisit(v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                    <FileText className="h-3.5 w-3.5" /> Full Record
                </button>
            )
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Resident Clinical View"
                subtitle="Review comprehensive clinical notes, orders, and visit history for a specific resident."
                breadcrumbs={[{ label: 'Medical' }, { label: 'Clinical View' }]}
            />

            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-gray-700">Select Resident</h3>
                <div className="max-w-md">
                    <PatientSelector
                        value={patientId}
                        onChange={setPatientId}
                        placeholder="Search resident to view clinical history..."
                    />
                </div>
            </div>

            {patientId ? (
                <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-indigo-600" />
                            Clinical History
                        </h3>
                    </div>
                    <DataTable
                        data={visits}
                        columns={columns}
                        keyExtractor={(v) => v.id}
                        isLoading={isLoading}
                        emptyStateMessage="No clinical visits found for this resident."
                    />
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                    <div className="text-center">
                        <Stethoscope className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-2 text-sm font-semibold text-gray-500">Please select a resident to view their clinical records.</p>
                    </div>
                </div>
            )}

            <Modal isOpen={!!viewVisit} onClose={() => setViewVisit(null)} title="Detailed Clinical Record" size="lg">
                {viewVisit && (
                    <div className="space-y-6 p-2">
                        <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Date</p>
                                <p className="font-semibold text-gray-900">{formatDateTime(viewVisit.visitDate)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Doctor</p>
                                <p className="font-semibold text-gray-900">Dr. {viewVisit.doctor?.firstName} {viewVisit.doctor?.lastName}</p>
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500 border-b pb-1">Chief Complaint</p>
                            <p className="text-gray-900">{viewVisit.chiefComplaint || 'No complaint specified.'}</p>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500 border-b pb-1">Clinical Notes (Observation)</p>
                            <div className="rounded-lg bg-indigo-50/50 p-4 text-sm leading-relaxed text-indigo-950 whitespace-pre-wrap border border-indigo-100/50">
                                {viewVisit.clinicalNotes || 'No clinical notes recorded.'}
                            </div>
                        </div>

                        {viewVisit.metadata?.medicalOrders && (
                            <div>
                                <p className="mb-2 text-sm font-bold uppercase tracking-wider text-amber-600 border-b border-amber-100 pb-1">Medical Orders & Instructions</p>
                                <div className="rounded-lg bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 whitespace-pre-wrap border border-amber-200">
                                    {viewVisit.metadata.medicalOrders}
                                </div>
                            </div>
                        )}
                        
                        {viewVisit.metadata?.chargeConsultation && (
                            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-800">
                                <span className="font-bold">Consultation Charge:</span>
                                <span>${viewVisit.metadata.consultationAmount}</span>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    )
}
