import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Modal } from '../../../components/Modal'
import { PasswordInput } from '../../../components/PasswordInput'
import { useEnquiries, useUpsertClientPortalAccess } from '../hooks/useEnquiry'
import { useStaff } from '../../../hooks/useHRData'
import { EnquiryFollowUpModal } from '../components/EnquiryFollowUpModal'
import type { Enquiry } from '../types'
import type { Staff } from '../../../types/staff'

const isActiveStaff = (staff: Staff) =>
    !staff.isDeleted &&
    !['terminated', 'resigned'].includes(String(staff.status || '').trim().toLowerCase())

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const cleanEmail = (value?: string | null) => {
    const email = String(value || '').trim()
    return email && email !== 'N/A' ? email : ''
}

const buildStaffOptions = (staffList: Staff[]) => {
    const activeStaff = staffList
        .filter(isActiveStaff)
        .sort((a, b) => a.name.localeCompare(b.name))

    return activeStaff.map((staff) => ({
        value: staff.id,
        label: `${staff.name} (ID: ${staff.empId || staff.id})`
    }))
}

export function AllClients() {
    // We map over Enquiries here because the requested layout acts as an aggregated Enquiry view.
    const { data: enquiries = [], isLoading } = useEnquiries()
    const { data: staffList = [] } = useStaff({ scope: 'all' })
    const upsertPortalAccess = useUpsertClientPortalAccess()
    const [searchParams, setSearchParams] = useSearchParams()
    const viewFilter = searchParams.get('view') || 'all'
    const [searchQuery, setSearchQuery] = useState('')
    const [unitFilter, setUnitFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
    const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
    const [loginEnquiry, setLoginEnquiry] = useState<Enquiry | null>(null)
    const [portalEmail, setPortalEmail] = useState('')
    const [portalMobile, setPortalMobile] = useState('')
    const [portalPassword, setPortalPassword] = useState('')
    const [portalRoleName, setPortalRoleName] = useState<'Family Member' | 'Client Family Member'>('Family Member')
    const [loginError, setLoginError] = useState('')

    const filteredData = useMemo(() => {
        return enquiries.filter(e => {
            const matchSearch = e.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.mobile && e.mobile.includes(searchQuery))
            const matchUnit = unitFilter ? e.unitId === unitFilter : true
            const matchStatus = statusFilter ? e.status === statusFilter : true
            let matchView = true
            if (viewFilter === 'active') {
                matchView = e.status === 'Open' || e.status === 'In Progress'
            } else if (viewFilter === 'pending-followups') {
                matchView = (e.status === 'Open' || e.status === 'In Progress') && e.lastFollowUpStatus !== 'Completed'
            }
            return matchSearch && matchUnit && matchStatus && matchView
        })
    }, [enquiries, searchQuery, unitFilter, statusFilter, viewFilter])


    const openFollowUp = (enquiry: Enquiry) => {
        setSelectedEnquiry(enquiry)
        setIsFollowUpOpen(true)
    }

    const openLoginCredentials = (enquiry: Enquiry) => {
        const access = enquiry.clientPortalAccess
        setLoginEnquiry(enquiry)
        setPortalEmail(cleanEmail(access?.email || enquiry.email))
        setPortalMobile(String(access?.mobile || enquiry.mobile || '').trim())
        setPortalPassword('')
        setPortalRoleName(access?.roleName === 'Client Family Member' ? 'Client Family Member' : 'Family Member')
        setLoginError('')
    }

    const closeLoginCredentials = () => {
        setLoginEnquiry(null)
        setPortalEmail('')
        setPortalMobile('')
        setPortalPassword('')
        setPortalRoleName('Family Member')
        setLoginError('')
    }

    const passwordRequired = !loginEnquiry?.clientPortalAccess
    const emailInvalid = portalEmail.trim().length > 0 && !EMAIL_PATTERN.test(portalEmail.trim())
    const passwordInvalid = portalPassword.length > 0 && portalPassword.length < 6
    const loginConfirmDisabled =
        upsertPortalAccess.isPending ||
        !portalEmail.trim() ||
        emailInvalid ||
        passwordInvalid ||
        (passwordRequired && portalPassword.length < 6)

    const handleSaveLoginCredentials = () => {
        if (!loginEnquiry || loginConfirmDisabled) {
            setLoginError(emailInvalid ? 'Enter a valid login email.' : 'Email and password are required.')
            return
        }

        upsertPortalAccess.mutate(
            {
                enquiryId: loginEnquiry.id,
                data: {
                    email: portalEmail.trim(),
                    mobile: portalMobile.trim() || undefined,
                    password: portalPassword || undefined,
                    roleName: portalRoleName
                }
            },
            {
                onSuccess: closeLoginCredentials
            }
        )
    }

    const followUpStaffOptions = useMemo(
        () => buildStaffOptions(staffList),
        [staffList]
    )

    const columns: Column<any>[] = [
        {
            key: 'sno',
            header: 'S.No',
            cell: (_, index) => <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">{index + 1}</span>
        },
        {
            key: 'clientRef',
            header: 'Client Ref. No.',
            cell: (row) => <span className="text-sm font-semibold text-primary-600">REF-{row.id?.substring(0, 5).toUpperCase() || 'N/A'}</span>
        },
        {
            key: 'createdDetails',
            header: 'Created Details',
            cell: (row) => (
                <div className="flex flex-col text-sm">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{new Date(row.createdAt || Date.now()).toLocaleDateString()}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(row.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        },
        {
            key: 'serviceLookingFor',
            header: 'Service Looking for',
            cell: (row) => <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{row.service}</span>
        },
        {
            key: 'clientDetails',
            header: 'Client Details',
            cell: (row) => (
                <div className="flex flex-col text-sm">
                    <span className="font-bold text-gray-900 dark:text-white">{row.clientName}</span>
                    <span className="text-xs text-gray-500">{row.mobile}</span>
                </div>
            )
        },
        {
            key: 'enquiryMode',
            header: 'Enquiry Mode',
            cell: (row) => (
                <span className="rounded-full border border-[#6DA5C0]/25 bg-[#D8EEF5] px-2.5 py-1 text-[11px] font-bold uppercase text-[#294D61] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
                    {row.mode}
                </span>
            )
        },
        { key: 'followupStatus', header: 'Followup Status', cell: (row) => <StatusHighlighter value={row.status} /> },
        {
            key: 'lastFollowedBy',
            header: 'Last Followed By',
            cell: () => <span className="text-sm text-gray-600 dark:text-gray-400">Agent</span>
        },
        {
            key: 'portalLogin',
            header: 'Portal Login',
            cell: (row) => {
                const access = row.clientPortalAccess

                return (
                    <div className="flex min-w-[230px] flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${access?.isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                                }`}>
                                {access?.isActive ? 'Enabled' : 'Not Enabled'}
                            </span>
                            {access?.email ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    {access.email}
                                </span>
                            ) : null}
                        </div>
                        <button
                            onClick={() => openLoginCredentials(row)}
                            className="inline-flex w-fit items-center rounded-xl bg-[#0F969C] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#294D61]"
                        >
                            <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                            {access ? 'Update Login' : 'Enable Login'}
                        </button>
                    </div>
                )
            }
        },
        {
            key: 'followUpAction',
            header: 'Follow-Up',
            cell: (row) => (
                <button
                    onClick={() => openFollowUp(row)}
                    className="rounded-xl bg-[#0F969C] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#294D61]"
                >
                    Follow-Up
                </button>
            )
        }
    ]

    return (
        <div className="flex min-h-full w-full min-w-0 flex-1 flex-col bg-transparent pb-4 overflow-y-auto dark:bg-black">
            <PageHeader
                title="Client Management"
                subtitle="Track client enquiries, follow-up status, and service requirements."
                breadcrumbs={[
                    { label: 'Home' },
                    { label: 'Client Management' }
                ]}
            />

            <div className="mt-4 overflow-hidden rounded-2xl border border-[#6DA5C0]/20 bg-white shadow-sm dark:border-white/10 dark:bg-black">
                <div className="border-b border-[#6DA5C0]/15 bg-[#F7FAFC] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="mb-4 ml-1 text-sm font-extrabold text-[#294D61] dark:text-gray-200">List of enquiry and follow-up details</p>
                    <FilterSection
                        searchQuery={searchQuery}
                        onSearchChange={(e) => setSearchQuery(e.target.value)}
                        searchPlaceholder="Search..."
                        filters={[
                            {
                                name: 'unitFilter',
                                options: [
                                    { value: '', label: 'Universal Elder Care' }, // Defaulting to acting like 'All' or base unit based on screenshot Dropdown 1
                                    { value: 'U-001', label: 'Sunrise Unit' }
                                ],
                                value: unitFilter,
                                onChange: (e) => setUnitFilter(e.target.value)
                            },
                            {
                                name: 'statusFilter',
                                options: [
                                    { value: '', label: 'All Status' },
                                    { value: 'Open', label: 'Open' },
                                    { value: 'In Progress', label: 'In Progress' },
                                    { value: 'Converted', label: 'Converted' },
                                    { value: 'Lost', label: 'Lost' }
                                ],
                                value: statusFilter,
                                onChange: (e) => setStatusFilter(e.target.value)
                            },
                            {
                                name: 'viewFilter',
                                options: [
                                    { value: 'all', label: 'All Enquiries' },
                                    { value: 'active', label: 'Active Enquiries' },
                                    { value: 'pending-followups', label: 'Pending Follow-ups' }
                                ],
                                value: viewFilter,
                                onChange: (e) => setSearchParams(prev => { prev.set('view', e.target.value); return prev })
                            }
                        ]}
                    />
                </div>

                <div className="p-4">
                    {isLoading ? (
                        <div className="h-64 animate-pulse rounded-2xl border border-[#6DA5C0]/20 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black" />
                    ) : (
                        <DataTable
                            data={filteredData}
                            columns={columns}
                            keyExtractor={(c) => c.id || Math.random().toString()}
                            emptyStateMessage="No data available in table"
                            minTableWidth="1480px"
                            showScrollbars
                            spreadColumns
                            fullHeight={false}
                        />
                    )}
                </div>
            </div>

            <EnquiryFollowUpModal
                isOpen={isFollowUpOpen}
                onClose={() => { setIsFollowUpOpen(false); setSelectedEnquiry(null); }}
                enquiry={selectedEnquiry}
                staffOptions={followUpStaffOptions}
            />

            <Modal
                isOpen={Boolean(loginEnquiry)}
                onClose={closeLoginCredentials}
                title={loginEnquiry?.clientPortalAccess ? 'Update Login Credentials' : 'Enable Login Credentials'}
                type="info"
                size="lg"
                confirmLabel={upsertPortalAccess.isPending ? 'Saving...' : 'Save Access'}
                confirmDisabled={loginConfirmDisabled}
                onConfirm={handleSaveLoginCredentials}
            >
                <div className="mt-5 grid gap-4 text-left text-sm text-gray-700 dark:text-gray-200">
                    <div className="rounded-2xl border border-[#6DA5C0]/20 bg-[#F7FAFC] p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-[#294D61] dark:text-gray-300">Client</p>
                        <p className="mt-1 text-base font-extrabold text-gray-900 dark:text-white">{loginEnquiry?.clientName}</p>
                        <p className="text-xs font-semibold text-gray-500">{loginEnquiry?.mobile}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Login Email</span>
                            <input
                                type="email"
                                value={portalEmail}
                                onChange={(event) => {
                                    setPortalEmail(event.target.value)
                                    setLoginError('')
                                }}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/15 dark:border-white/10 dark:bg-black dark:text-white"
                                placeholder="client@example.com"
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Mobile</span>
                            <input
                                type="tel"
                                value={portalMobile}
                                onChange={(event) => setPortalMobile(event.target.value)}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/15 dark:border-white/10 dark:bg-black dark:text-white"
                                placeholder="Mobile number"
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Role</span>
                            <select
                                value={portalRoleName}
                                onChange={(event) => setPortalRoleName(event.target.value as 'Family Member' | 'Client Family Member')}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/15 dark:border-white/10 dark:bg-black dark:text-white"
                            >
                                <option value="Family Member">Family Member</option>
                                <option value="Client Family Member">Client Family Member</option>
                            </select>
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                                {passwordRequired ? 'Temporary Password' : 'New Password'}
                            </span>
                            <PasswordInput
                                value={portalPassword}
                                onChange={(event) => {
                                    setPortalPassword(event.target.value)
                                    setLoginError('')
                                }}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/15 dark:border-white/10 dark:bg-black dark:text-white"
                                placeholder={passwordRequired ? 'Minimum 6 characters' : 'Leave blank to keep current'}
                            />
                        </label>
                    </div>

                    {(emailInvalid || passwordInvalid || loginError) && (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                            {loginError || (emailInvalid ? 'Enter a valid login email.' : 'Password must be at least 6 characters.')}
                        </p>
                    )}
                </div>
            </Modal>

        </div>
    )
}
