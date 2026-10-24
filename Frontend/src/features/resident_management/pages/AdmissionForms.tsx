import { useMemo, useState } from 'react'
import { CheckCircle2, CircleDashed, ClipboardList, KeyRound } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { Modal } from '../../../components/Modal'
import { PasswordInput } from '../../../components/PasswordInput'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useAdmissions, useCreateAdmissionClientPortalAccess } from '../../enquiry/hooks/useEnquiry'
import type { AdmissionRecord } from '../../enquiry/types'

const getFormStatus = (admission: AdmissionRecord) => {
    const completed = [
        admission.patientName,
        admission.clientName,
        admission.mobile,
        admission.service,
        admission.patientHealthCondition,
        admission.clientAddress
    ].filter(Boolean).length

    if (completed >= 6) return 'COMPLETE'
    if (completed >= 4) return 'REVIEW'
    return 'PENDING'
}

export function AdmissionForms() {
    const { data: admissions = [], isLoading } = useAdmissions()
    const createPortalAccess = useCreateAdmissionClientPortalAccess()
    const [searchQuery, setSearchQuery] = useState('')
    const [portalAdmission, setPortalAdmission] = useState<AdmissionRecord | null>(null)
    const [portalEmail, setPortalEmail] = useState('')
    const [portalMobile, setPortalMobile] = useState('')
    const [portalPassword, setPortalPassword] = useState('')
    const [portalRoleName, setPortalRoleName] = useState<'Family Member' | 'Client Family Member'>('Family Member')

    const formRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        const rows = admissions.map((admission) => ({
            ...admission,
            formStatus: getFormStatus(admission)
        }))

        if (!query) return rows
        return rows.filter((admission) => (
            [
                admission.refNo,
                admission.patientName,
                admission.clientName,
                admission.mobile,
                admission.service,
                admission.formStatus
            ].some((value) => String(value || '').toLowerCase().includes(query))
        ))
    }, [admissions, searchQuery])

    const completeCount = formRows.filter((row) => row.formStatus === 'COMPLETE').length
    const pendingCount = formRows.filter((row) => row.formStatus !== 'COMPLETE').length

    const columns: Column<AdmissionRecord & { formStatus: string }>[] = [
        {
            key: 'refNo',
            header: 'Form ID',
            cell: (admission) => (
                <div className="flex flex-col">
                    <span className="font-extrabold text-gray-900 dark:text-gray-100">FORM-{admission.refNo}</span>
                    <span className="text-xs text-gray-500">Admission {admission.id.slice(0, 8)}</span>
                </div>
            )
        },
        {
            key: 'patientName',
            header: 'Patient',
            sortable: true,
            cell: (admission) => (
                <div className="flex flex-col">
                    <span className="font-bold">{admission.patientName}</span>
                    <span className="text-xs text-gray-500">{admission.patientHealthCondition || 'Health condition pending'}</span>
                </div>
            )
        },
        {
            key: 'clientName',
            header: 'Guardian / Client',
            cell: (admission) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{admission.clientName}</span>
                    <span className="text-xs font-semibold text-primary-600">{admission.mobile}</span>
                </div>
            )
        },
        {
            key: 'service',
            header: 'Care Requirement',
            cell: (admission) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{admission.service}</span>
                    <span className="text-xs text-gray-500">{admission.clientAddress || 'Address pending'}</span>
                </div>
            )
        },
        {
            key: 'clientPortalAccess',
            header: 'Client Portal Login',
            cell: (admission) => admission.clientPortalAccess ? (
                <div className="flex flex-col">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{admission.clientPortalAccess.email}</span>
                    <span className="text-xs text-gray-500">{admission.clientPortalAccess.roleName || 'Portal Access Active'}</span>
                </div>
            ) : (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Not Created</span>
            )
        },
        {
            key: 'formStatus',
            header: 'Form Status',
            sortable: true,
            cell: (admission) => <StatusHighlighter value={admission.formStatus} />
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (admission) => (
                <button
                    onClick={() => {
                        setPortalAdmission(admission)
                        setPortalEmail(admission.clientPortalAccess?.email || admission.email || '')
                        setPortalMobile(admission.mobile || '')
                        setPortalPassword('')
                        setPortalRoleName((admission.clientPortalAccess?.roleName as 'Family Member' | 'Client Family Member') || 'Family Member')
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 hover:bg-primary-100 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300"
                >
                    <KeyRound className="h-3.5 w-3.5" />
                    {admission.clientPortalAccess ? 'Update Portal Access' : 'Create Portal Access'}
                </button>
            )
        }
    ]

    const handleCreatePortalAccess = () => {
        if (!portalAdmission) return

        createPortalAccess.mutate(
            {
                admissionId: portalAdmission.id,
                email: portalEmail,
                mobile: portalMobile,
                password: portalPassword,
                roleName: portalRoleName
            },
            {
                onSuccess: () => {
                    setPortalAdmission(null)
                    setPortalPassword('')
                }
            }
        )
    }

    return (
        <div className="flex h-full min-w-0 flex-1 min-h-0 flex-col space-y-5 overflow-y-auto bg-transparent dark:bg-black">
            <PageHeader
                title="Admission Forms & Documentation"
                subtitle="Review intake documentation, completeness checks, and client portal login provisioning for residents."
                breadcrumbs={[{ label: 'Resident Management' }, { label: 'Admission Forms' }]}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Admission Forms</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{formRows.length}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Complete Forms</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completeCount}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                        <CircleDashed className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Pending Review</p>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
                    </div>
                </div>
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search form ref, patient, client, or status..."
            />

            <DataTable
                data={formRows}
                columns={columns}
                keyExtractor={(row) => row.id}
                isLoading={isLoading}
                showScrollbars
                minTableWidth="1200px"
                spreadColumns
                fullHeight={false}
            />

            <Modal
                isOpen={Boolean(portalAdmission)}
                onClose={() => setPortalAdmission(null)}
                title={`Client Portal Access: ${portalAdmission?.clientName || 'Client'}`}
            >
                {portalAdmission && (
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Create or update client portal login credentials for family members of <span className="font-bold text-gray-900 dark:text-gray-100">{portalAdmission.patientName}</span>.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Login Email *</label>
                                <input
                                    type="email"
                                    value={portalEmail}
                                    onChange={(e) => setPortalEmail(e.target.value)}
                                    placeholder="client.family@unisenth.local"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-black dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Mobile Number</label>
                                <input
                                    type="text"
                                    value={portalMobile}
                                    onChange={(e) => setPortalMobile(e.target.value)}
                                    placeholder="+91 9876543210"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-black dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Password {portalAdmission.clientPortalAccess ? '(Leave blank to keep existing)' : '*'}</label>
                                <PasswordInput
                                    value={portalPassword}
                                    onChange={(e) => setPortalPassword(e.target.value)}
                                    placeholder="Enter password"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Portal Role *</label>
                                <select
                                    value={portalRoleName}
                                    onChange={(e) => setPortalRoleName(e.target.value as 'Family Member' | 'Client Family Member')}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-black dark:text-gray-100"
                                >
                                    <option value="Family Member">Family Member</option>
                                    <option value="Client Family Member">Client Family Member</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setPortalAdmission(null)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCreatePortalAccess}
                                disabled={createPortalAccess.isPending || !portalEmail}
                                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
                            >
                                {createPortalAccess.isPending ? 'Saving Access...' : 'Save Portal Access'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
