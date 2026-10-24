import { useEffect, useMemo, useState } from 'react'
import { FileText, HeartPulse, Send } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { Modal } from '../../../components/Modal'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useAdmissions } from '../../enquiry/hooks/useEnquiry'
import type { AdmissionRecord } from '../../enquiry/types'
import { useCreateAllocation } from '../../allocation/hooks/useAllocation'
import { useUnits } from '../../master/hooks/useUnit'
import { ServiceContractModal } from '../components/ServiceContractModal'

const careTypeOptions = [
    { value: 'HOME_CARE', label: 'Home Care' },
    { value: 'CLINICAL', label: 'Clinical Care' },
    { value: 'IN_HOUSE', label: 'In-House Care' },
    { value: 'OTHERS', label: 'Other / Ambulance Support' }
]

export function AdmissionTracking() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { data: admissions = [], isLoading } = useAdmissions()
    const { data: units = [] } = useUnits()
    const createAllocation = useCreateAllocation()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [handoffAdmission, setHandoffAdmission] = useState<AdmissionRecord | null>(null)
    const [careType, setCareType] = useState('HOME_CARE')
    const [handoffNotes, setHandoffNotes] = useState('')
    const [contractAdmission, setContractAdmission] = useState<AdmissionRecord | null>(null)

    const targetCareUnitId = useMemo(() => {
        const careUnit = units.find((unit) => (
            unit.unitId === 'UHC' ||
            unit.shortName === 'UHC' ||
            unit.name.toLowerCase().includes('health care')
        ))

        return careUnit?.id || null
    }, [units])

    useEffect(() => {
        setSearchQuery(searchParams.get('search') || '')
    }, [searchParams])

    const filteredAdmissions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return admissions

        return admissions.filter((admission) => (
            [
                admission.refNo,
                admission.patientName,
                admission.clientName,
                admission.mobile,
                admission.service,
                admission.status
            ].some((value) => String(value || '').toLowerCase().includes(query))
        ))
    }, [admissions, searchQuery])

    const openHandoff = (admission: AdmissionRecord) => {
        setHandoffAdmission(admission)
        setCareType('HOME_CARE')
        setHandoffNotes(admission.patientHealthCondition || admission.remarks || '')
    }

    const handleHandoff = () => {
        if (!handoffAdmission) return
        const allocationRoutes: Record<string, string> = {
            HOME_CARE: '/allocation/home-care',
            CLINICAL: '/allocation/clinical-care',
            IN_HOUSE: '/allocation/inhouse-care',
            OTHERS: '/allocation/others'
        }

        createAllocation.mutate(
            {
                enquiryId: handoffAdmission.enquiryId,
                targetUnitId: targetCareUnitId || undefined,
                staffId: null,
                type: careType,
                status: 'PENDING',
                startDate: new Date().toISOString(),
                metadata: {
                    admissionId: handoffAdmission.id,
                    patientName: handoffAdmission.patientName,
                    clientName: handoffAdmission.clientName,
                    service: handoffAdmission.service,
                    targetUnitId: targetCareUnitId || null,
                    healthCondition: handoffAdmission.patientHealthCondition || null,
                    notes: handoffNotes || null,
                    handoffSource: 'ADMISSION_TRACKING'
                }
            },
            {
                onSuccess: (allocation) => {
                    setHandoffAdmission(null)
                    navigate(allocationRoutes[careType] || '/allocation/home-care', {
                        state: {
                            createdAllocationId: allocation.id,
                            enquiryId: handoffAdmission.enquiryId,
                            patientName: handoffAdmission.patientName,
                            service: handoffAdmission.service
                        }
                    })
                }
            }
        )
    }

    const columns: Column<AdmissionRecord>[] = [
        {
            key: 'refNo',
            header: 'Admission / Ref',
            sortable: true,
            cell: (admission) => (
                <div className="flex flex-col">
                    <span className="font-bold">{admission.refNo}</span>
                    <span className="text-xs text-gray-500">Admitted {new Date(admission.admittedAt).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            key: 'patientName',
            header: 'Patient Name',
            sortable: true,
            cell: (admission) => (
                <div className="flex flex-col">
                    <span className="font-extrabold text-gray-900 dark:text-gray-100">{admission.patientName}</span>
                    <span className="text-xs text-gray-500">{admission.patientHealthCondition || 'Condition pending'}</span>
                </div>
            )
        },
        {
            key: 'clientName',
            header: 'Guardian / Contact',
            cell: (admission) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{admission.clientName}</span>
                    <span className="text-xs font-semibold text-primary-600">{admission.mobile}</span>
                </div>
            )
        },
        {
            key: 'service',
            header: 'Requested Care',
            cell: (admission) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{admission.service}</span>
                    <span className="text-xs text-gray-500">{admission.clientAddress || 'Address pending'}</span>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Admission Status',
            sortable: true,
            cell: (admission) => <StatusHighlighter value={admission.status} />
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (admission) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openHandoff(admission)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white hover:bg-primary-700"
                    >
                        <HeartPulse className="h-3.5 w-3.5" />
                        Allocate Care
                    </button>
                    <button
                        onClick={() => setContractAdmission(admission)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-200"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Contract
                    </button>
                </div>
            )
        }
    ]

    return (
        <div className="flex h-full min-w-0 flex-1 min-h-0 flex-col space-y-5 overflow-y-auto bg-transparent dark:bg-black">
            <PageHeader
                title="Resident Admission Tracking & Care Handoff"
                subtitle="Track converted resident admissions, launch clinical and home care allocations, and manage service agreements."
                breadcrumbs={[{ label: 'Resident Management' }, { label: 'Admission Tracking' }]}
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search ref, resident name, guardian, or care service..."
            />

            <DataTable
                data={filteredAdmissions}
                columns={columns}
                keyExtractor={(admission) => admission.id}
                isLoading={isLoading}
                showScrollbars
                minTableWidth="1200px"
                spreadColumns
                fullHeight={false}
            />

            <Modal
                isOpen={Boolean(handoffAdmission)}
                onClose={() => setHandoffAdmission(null)}
                title={`Care Handoff: ${handoffAdmission?.patientName || 'Resident'}`}
            >
                {handoffAdmission && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Transfer resident admission <span className="font-bold text-gray-900 dark:text-gray-100">{handoffAdmission.refNo}</span> directly into Care Allocation module.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Care Allocation Type *</label>
                                <select
                                    value={careType}
                                    onChange={(event) => setCareType(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-black dark:text-gray-100"
                                >
                                    {careTypeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Clinical / Operational Notes</label>
                                <textarea
                                    value={handoffNotes}
                                    onChange={(event) => setHandoffNotes(event.target.value)}
                                    rows={3}
                                    placeholder="Enter initial health condition, routine care notes, or allocation preferences..."
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-black dark:text-gray-100"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setHandoffAdmission(null)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleHandoff}
                                disabled={createAllocation.isPending}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
                            >
                                <Send className="h-4 w-4" />
                                {createAllocation.isPending ? 'Transferring...' : 'Complete Care Handoff'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <ServiceContractModal
                isOpen={Boolean(contractAdmission)}
                onClose={() => setContractAdmission(null)}
                admission={contractAdmission}
            />
        </div>
    )
}
