import { zodResolver } from '@hookform/resolvers/zod'
import { Edit2, Plus, Trash2, UserCog } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { PageHeader } from '../../../components/PageHeader'
import { Select } from '../../../components/Select'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useRoles } from '../../../hooks/useHRData'
import { useUnits } from '../../master/hooks/useUnit'
import { useAdminUsers, useCreateAdminUser, useDeleteAdminUser, useUpdateAdminUser } from '../hooks/useSuperAdmin'
import type { AdminUser } from '../services/superAdmin'

const userTemplates = [
    {
        id: 'uncf-admin',
        organization: 'UNCF',
        label: 'UNCF Admin',
        roleName: 'UNCF Admin',
        firstName: 'UNCF',
        lastName: 'Admin',
        emailPrefix: 'uncf.admin',
        description: 'Overall UNCF monitoring, approvals, and core admin control'
    },
    {
        id: 'master-data-manager',
        organization: 'UNCF',
        label: 'Master Data Manager',
        roleName: 'Master Data Manager',
        firstName: 'Master',
        lastName: 'Manager',
        emailPrefix: 'uncf.master',
        description: 'City, unit, department, designation, vendor, room, and service masters'
    },
    {
        id: 'finance-manager',
        organization: 'UNCF',
        label: 'Finance Manager',
        roleName: 'Finance Manager',
        firstName: 'Finance',
        lastName: 'Manager',
        emailPrefix: 'uncf.finance',
        description: 'Cashbox, income, expense, invoices, renewals, and pending payments'
    },
    {
        id: 'hr-manager',
        organization: 'UNCF',
        label: 'HR Manager',
        roleName: 'HR Manager',
        firstName: 'HR',
        lastName: 'Manager',
        emailPrefix: 'uncf.hr',
        description: 'Staff, attendance, leave, roster, payroll, training, and recruitment'
    },
    {
        id: 'security-supervisor',
        organization: 'UNCF',
        label: 'Security Supervisor',
        roleName: 'Security Supervisor',
        firstName: 'Security',
        lastName: 'Supervisor',
        emailPrefix: 'uncf.security',
        description: 'Gate, visitor, entry log, and OTP log operations'
    },
    {
        id: 'cms-manager',
        organization: 'UNCF',
        label: 'CMS Manager',
        roleName: 'CMS Manager',
        firstName: 'CMS',
        lastName: 'Manager',
        emailPrefix: 'uncf.cms',
        description: 'Blogs, FAQ, and event publishing'
    },
    {
        id: 'admin-files-manager',
        organization: 'UNCF',
        label: 'Admin Files Manager',
        roleName: 'Admin Files Manager',
        firstName: 'Admin Files',
        lastName: 'Manager',
        emailPrefix: 'uncf.files',
        description: 'UNCF documents, licence files, record books, and staff file registers'
    },
    {
        id: 'profile-task-user',
        organization: 'UNCF',
        label: 'Profile / Task User',
        roleName: 'Profile Task User',
        firstName: 'Task',
        lastName: 'User',
        emailPrefix: 'uncf.task',
        description: 'Basic profile, notification, and task-log access'
    },
    {
        id: 'inventory-manager',
        organization: 'UNCF',
        label: 'Inventory Manager',
        roleName: 'Inventory Manager',
        firstName: 'Inventory',
        lastName: 'Manager',
        emailPrefix: 'uncf.inventory',
        description: 'Inventory products, stock balances, purchase orders, goods receipts, stock issues, movements, valuation, and physical audits'
    },
    {
        id: 'elder-care-admin',
        organization: 'UEC',
        label: 'Elder Care Admin',
        roleName: 'Elder Care Admin',
        firstName: 'Elder Care',
        lastName: 'Admin',
        emailPrefix: 'uec.admin',
        description: 'Overall UEC dashboard, in-house care, operations, inventory, task, and finance control'
    },
    {
        id: 'in-house-care-manager',
        organization: 'UEC',
        label: 'In-House Care Manager',
        roleName: 'In-House Care Manager',
        firstName: 'In-House Care',
        lastName: 'Manager',
        emailPrefix: 'uec.inhouse',
        description: 'In-house revenue, vitals, ADL, and care monitoring'
    },
    {
        id: 'elder-operations-manager',
        organization: 'UEC',
        label: 'Elder Operations Manager',
        roleName: 'Elder Operations Manager',
        firstName: 'Elder Operations',
        lastName: 'Manager',
        emailPrefix: 'uec.operations',
        description: 'Food preparation, nutrition planning, laundry, maintenance, and waste management'
    },
    {
        id: 'task-log-coordinator',
        organization: 'UEC',
        label: 'Task Log Coordinator',
        roleName: 'Task Log Coordinator',
        firstName: 'Task Log',
        lastName: 'Coordinator',
        emailPrefix: 'uec.tasklog',
        description: 'Daily and scheduled task assignment and approvals'
    },
    {
        id: 'elder-finance-manager',
        organization: 'UEC',
        label: 'Elder Finance Manager',
        roleName: 'Elder Finance Manager',
        firstName: 'Elder Finance',
        lastName: 'Manager',
        emailPrefix: 'uec.finance',
        description: 'In-house expense and UEC finance monitoring'
    },
    {
        id: 'uhc-admin',
        organization: 'UHC',
        label: 'UHC Admin',
        roleName: 'UHC Admin',
        firstName: 'UHC',
        lastName: 'Admin',
        emailPrefix: 'uhc.admin',
        description: 'Overall UHC dashboard, patient care, allocation, monitoring, and inventory control'
    },
    {
        id: 'patient-care-manager',
        organization: 'UHC',
        label: 'Patient Care Manager',
        roleName: 'Patient Care Manager',
        firstName: 'Patient Care',
        lastName: 'Manager',
        emailPrefix: 'uhc.patientcare',
        description: 'Critical patients, patient dashboard, vitals, medication, and nutrition monitoring'
    },
    {
        id: 'medical-monitor-coordinator',
        organization: 'UHC',
        label: 'Medical Monitor Coordinator',
        roleName: 'Medical Monitor Coordinator',
        firstName: 'Medical Monitor',
        lastName: 'Coordinator',
        emailPrefix: 'uhc.monitor',
        description: 'Medical monitor, critical patients, patient dashboard, and vitals tracking'
    },
    {
        id: 'nursing-manager',
        organization: 'UHC',
        label: 'Nursing Manager (Nurse)',
        roleName: 'Nursing Manager',
        firstName: 'Nurse',
        lastName: 'Staff',
        emailPrefix: 'uhc.nurse',
        description: 'Nursing dashboard, medication schedule, medicine requests, and vitals monitoring'
    },
    {
        id: 'caregiver',
        organization: 'UHC',
        label: 'Caregiver',
        roleName: 'Caregiver',
        firstName: 'Care',
        lastName: 'Giver',
        emailPrefix: 'uhc.caregiver',
        description: 'Patient care, daily living (ADL), and incident reporting'
    },
    {
        id: 'care-allocation-manager',
        organization: 'UHC',
        label: 'Care Allocation Manager',
        roleName: 'Care Allocation Manager',
        firstName: 'Care Allocation',
        lastName: 'Manager',
        emailPrefix: 'uhc.allocation',
        description: 'Clinical, home care, and other care allocation monitoring'
    },
    {
        id: 'home-care-manager',
        organization: 'UHC',
        label: 'Home Care Manager',
        roleName: 'HOME_CARE_MANAGER',
        firstName: 'Home Care',
        lastName: 'Manager',
        emailPrefix: 'uhc.homecare',
        description: 'Enquiries, clients, service contracts, staff allocations, rosters, and home care operations'
    },
    {
        id: 'ua-admin',
        organization: 'UA',
        label: 'UA Admin',
        roleName: 'UA Admin',
        firstName: 'UA',
        lastName: 'Admin',
        emailPrefix: 'ua.admin',
        description: 'Overall ambulance dashboard, bookings, dispatch, fleet, billing, and emergency operations'
    },
    {
        id: 'ambulance-booking-coordinator',
        organization: 'UA',
        label: 'Ambulance Booking Coordinator',
        roleName: 'Ambulance Booking Coordinator',
        firstName: 'Ambulance Booking',
        lastName: 'Coordinator',
        emailPrefix: 'ua.bookings',
        description: 'Ambulance bookings and trip sheet coordination'
    },
    {
        id: 'dispatch-manager',
        organization: 'UA',
        label: 'Dispatch Manager',
        roleName: 'Dispatch Manager',
        firstName: 'Dispatch',
        lastName: 'Manager',
        emailPrefix: 'ua.dispatch',
        description: 'Dispatch management, driver/staff assignment, and field duty control'
    },
    {
        id: 'fleet-manager',
        organization: 'UA',
        label: 'Fleet Manager',
        roleName: 'Fleet Manager',
        firstName: 'Fleet',
        lastName: 'Manager',
        emailPrefix: 'ua.fleet',
        description: 'Vehicle fleet and ambulance maintenance monitoring'
    },
    {
        id: 'ambulance-billing-manager',
        organization: 'UA',
        label: 'Ambulance Billing Manager',
        roleName: 'Ambulance Billing Manager',
        firstName: 'Ambulance Billing',
        lastName: 'Manager',
        emailPrefix: 'ua.billing',
        description: 'Ambulance billing and trip sheet finance follow-up'
    },
    {
        id: 'emergency-call-coordinator',
        organization: 'UA',
        label: 'Emergency Call Coordinator',
        roleName: 'Emergency Call Coordinator',
        firstName: 'Emergency Call',
        lastName: 'Coordinator',
        emailPrefix: 'ua.calls',
        description: 'Emergency call logs and dispatch coordination'
    },
    {
        id: 'ueo-admin',
        organization: 'UEO',
        label: 'UEO Admin',
        roleName: 'UEO Admin',
        firstName: 'UEO',
        lastName: 'Admin',
        emailPrefix: 'ueo.admin',
        description: 'Overall UEO dashboard, enquiry, customer care, admissions, and omnichannel control'
    },
    {
        id: 'enquiry-desk-manager',
        organization: 'UEO',
        label: 'Enquiry Desk Manager',
        roleName: 'Enquiry Desk Manager',
        firstName: 'Enquiry Desk',
        lastName: 'Manager',
        emailPrefix: 'ueo.enquiry',
        description: 'Active enquiries, new enquiry forms, client details, and admission tracking'
    },
    {
        id: 'follow-up-coordinator',
        organization: 'UEO',
        label: 'Follow-up Coordinator',
        roleName: 'Follow-up Coordinator',
        firstName: 'Follow-up',
        lastName: 'Coordinator',
        emailPrefix: 'ueo.followup',
        description: 'Enquiry follow-ups, welcome calls, customer care, and feedback tracking'
    },
    {
        id: 'customer-relations-manager',
        organization: 'UEO',
        label: 'Customer Relations Manager',
        roleName: 'Customer Relations Manager',
        firstName: 'Customer Relations',
        lastName: 'Manager',
        emailPrefix: 'ueo.customer',
        description: 'Customer care, complaints, pending feedback, service history, and feedback monitoring'
    },
    {
        id: 'omnichannel-coordinator',
        organization: 'UEO',
        label: 'Omnichannel Coordinator',
        roleName: 'Omnichannel Coordinator',
        firstName: 'Omnichannel',
        lastName: 'Coordinator',
        emailPrefix: 'ueo.omnichannel',
        description: 'Conversations, email, WhatsApp, SMS, missed calls, and call coordination'
    },
    {
        id: 'admissions-coordinator',
        organization: 'UEO',
        label: 'Admissions Coordinator',
        roleName: 'Admissions Coordinator',
        firstName: 'Admissions',
        lastName: 'Coordinator',
        emailPrefix: 'ueo.admissions',
        description: 'Admission tracking, admission forms, and client detail coordination'
    }
]

const booleanish = z.preprocess((value) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
}, z.boolean())

const userFormSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().optional(),
    email: z.string().email('Valid email is required'),
    mobile: z.string().optional(),
    password: z.string().optional(),
    roleId: z.string().min(1, 'Role is required'),
    unitId: z.string().min(1, 'Unit is required'),
    isActive: booleanish.default(true)
}).superRefine((data, ctx) => {
    if (data.password && data.password.length < 6) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must be at least 6 characters', path: ['password'] })
    }
})

type UserFormInput = z.input<typeof userFormSchema>
type UserFormValues = z.output<typeof userFormSchema>

const getUserName = (user: AdminUser) => `${user.firstName} ${user.lastName || ''}`.trim()
const normalizeEmail = (email: string) => email.trim().toLowerCase()
const normalizeRoleName = (name: string) => String(name || '').trim().toLowerCase().replace(/[_\s-]+/g, ' ')

const findMatchingRole = (templateRoleName: string, roleList: Array<{ id: string; name: string }>) => {
    const target = normalizeRoleName(templateRoleName)
    if (!target) return undefined
    return roleList.find((role) => normalizeRoleName(role.name) === target)
        || roleList.find((role) => role.name.toLowerCase() === templateRoleName.toLowerCase())
}

const organizationOptions = ['ALL', 'UNCF', 'UEC', 'UHC', 'UA', 'UEO'] as const
type OrganizationFilter = typeof organizationOptions[number]

const getTemplateOrganizationByRole = (roleName: string) => {
    const normalizedRole = normalizeRoleName(roleName)
    if (normalizedRole === 'elder inventory manager') return 'UEC'
    if (normalizedRole === 'medical inventory manager') return 'UHC'
    return userTemplates.find((template) => normalizeRoleName(template.roleName) === normalizedRole)?.organization || null
}

const getOrganizationFromUnit = (unit?: AdminUser['unit'] | null) => {
    const unitText = [
        unit?.code,
        unit?.name
    ].filter(Boolean).join(' ').toUpperCase()

    return organizationOptions.find((organization) =>
        organization !== 'ALL' &&
        unitText.includes(organization)
    ) || null
}

const getUserOrganization = (user: AdminUser) => {
    const roleName = String(user.role?.name || '')
    const roleOrganization = getTemplateOrganizationByRole(roleName)
    if (roleOrganization) return roleOrganization

    const unitOrganization = getOrganizationFromUnit(user.unit)
    if (unitOrganization) return unitOrganization

    const email = normalizeEmail(user.email || '')
    if (email.includes('client.') || ['family member', 'client', 'client family member'].includes(roleName.toLowerCase())) {
        return 'Client Portal'
    }

    return 'UNCF'
}

const getAvailableTemplateEmail = (emailPrefix: string, users: AdminUser[]) => {
    const existingEmails = new Set(users.map((user) => normalizeEmail(user.email || '')))
    const baseEmail = `${emailPrefix}@unisenth.local`

    if (!existingEmails.has(normalizeEmail(baseEmail))) return baseEmail

    for (let index = 2; index < 100; index += 1) {
        const email = `${emailPrefix}${index}@unisenth.local`
        if (!existingEmails.has(normalizeEmail(email))) return email
    }

    return `${emailPrefix}.${Date.now()}@unisenth.local`
}

export function UserManagement() {
    const { data: users = [] } = useAdminUsers()
    const { data: roles = [] } = useRoles()
    const { data: units = [] } = useUnits()
    const createUser = useCreateAdminUser()
    const updateUser = useUpdateAdminUser()
    const deleteUser = useDeleteAdminUser()

    const [searchQuery, setSearchQuery] = useState('')
    // Default to internal employee organizations to avoid showing client portal accounts by default
    const [selectedOrganization, setSelectedOrganization] = useState<OrganizationFilter>('UNCF')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
    const [selectedTemplateId, setSelectedTemplateId] = useState('')

    const roleOptions = useMemo(() => [
        { value: '', label: roles.length === 0 ? '-- Loading Roles... --' : '-- Select Role --' },
        ...roles.map((role: { id: string; name: string }) => ({ value: role.id, label: role.name }))
    ], [roles])

    const templateGroups = useMemo(() => {
        return userTemplates.reduce<Record<string, typeof userTemplates>>((groups, template) => {
            groups[template.organization] = groups[template.organization] || []
            groups[template.organization].push(template)
            return groups
        }, {})
    }, [])

    const unitOptions = useMemo(() => [
        { value: '', label: '-- Select Unit --' },
        ...units.map((unit) => ({ value: unit.id, label: unit.location?.label ? `${unit.name} - ${unit.location.label}` : unit.name }))
    ], [units])

    const { register, handleSubmit, reset, setError, setValue, getValues, formState: { errors } } = useForm<UserFormInput, any, UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            password: '',
            roleId: '',
            unitId: '',
            isActive: true
        }
    })

    const filteredUsers = users.filter((user) => {
        const roleName = String(user.role?.name || '').toLowerCase();
        if (roleName.includes('client') || roleName.includes('family member')) return false;
        
        const org = getUserOrganization(user);
        if (org === 'Client Portal') return false;

        const query = searchQuery.toLowerCase()
        const matchesOrganization = selectedOrganization === 'ALL' || org === selectedOrganization
        const matchesSearch = getUserName(user).toLowerCase().includes(query) ||
            String(user.email || '').toLowerCase().includes(query) ||
            roleName.includes(query)

        return matchesOrganization && matchesSearch
    })

    const openCreate = () => {
        setEditingUser(null)
        setSelectedTemplateId('')
        reset({ firstName: '', lastName: '', email: '', mobile: '', password: '', roleId: '', unitId: '', isActive: true })
        setIsDrawerOpen(true)
    }

    const openEdit = (user: AdminUser) => {
        setEditingUser(user)
        setSelectedTemplateId('')
        reset({
            firstName: user.firstName,
            lastName: user.lastName || '',
            email: user.email,
            mobile: user.mobile || '',
            password: '',
            roleId: user.roleId || user.role?.id || '',
            unitId: user.unitId || user.unit?.id || '',
            isActive: user.isActive
        })
        setIsDrawerOpen(true)
    }

    const applyTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId)
        const template = userTemplates.find((item) => item.id === templateId)
        if (!template) return

        const role = findMatchingRole(template.roleName, roles)
        if (role) {
            setValue('roleId', role.id, { shouldDirty: true, shouldValidate: true })
        }

        if (!getValues('firstName')) {
            setValue('firstName', template.firstName, { shouldDirty: true, shouldValidate: true })
        }

        if (!getValues('lastName')) {
            setValue('lastName', template.lastName, { shouldDirty: true })
        }

        setValue('email', getAvailableTemplateEmail(template.emailPrefix, users), { shouldDirty: true, shouldValidate: true })
    }

    useEffect(() => {
        if (!selectedTemplateId || roles.length === 0) return
        const template = userTemplates.find((item) => item.id === selectedTemplateId)
        if (!template) return

        const matchedRole = findMatchingRole(template.roleName, roles)
        if (matchedRole) {
            const currentRoleId = getValues('roleId')
            if (currentRoleId !== matchedRole.id) {
                setValue('roleId', matchedRole.id, { shouldDirty: true, shouldValidate: true })
            }
        }
    }, [selectedTemplateId, roles, setValue, getValues])

    const onSubmit = async (data: UserFormValues) => {
        const existingUser = users.find((user) =>
            normalizeEmail(user.email || '') === normalizeEmail(data.email) &&
            user.id !== editingUser?.id
        )

        if (existingUser) {
        setError('email', { type: 'manual', message: 'This email is already used by another employee account' })
            return
        }

        if (editingUser) {
            try {
                await updateUser.mutateAsync({ id: editingUser.id, data })
            } catch {
                return
            }
        } else {
            if (!data.password) {
                setError('password', { type: 'manual', message: 'Password is required' })
                return
            }
            try {
                await createUser.mutateAsync({ ...data, password: data.password })
            } catch (error: any) {
                if (String(error?.response?.data?.message || '').toLowerCase().includes('email')) {
                    setError('email', { type: 'server', message: 'This email is already in use' })
                }
                return
            }
        }
        setIsDrawerOpen(false)
    }

    const handleDelete = async (user: AdminUser) => {
        if (!window.confirm(`Delete employee account ${user.email}?`)) return
        await deleteUser.mutateAsync(user.id)
    }

    const columns: Column<AdminUser>[] = [
        {
            key: 'name',
            header: 'Employee',
            sortable: true,
            cell: (user) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                        <UserCog className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900 dark:text-gray-100">{getUserName(user)}</p>
                        <p className="truncate text-xs font-medium text-gray-500">{user.email}</p>
                    </div>
                </div>
            )
        },
        { key: 'mobile', header: 'Mobile', cell: (user) => user.mobile || '-' },
        { key: 'role', header: 'Role', cell: (user) => user.role?.name || '-' },
        { key: 'unit', header: 'Unit', cell: (user) => user.unit?.name || '-' },
        { key: 'linkedStaff', header: 'Linked Staff', cell: (user) => user.staff ? `${user.staff.firstName} ${user.staff.lastName || ''}`.trim() : 'Direct Account' },
        { key: 'status', header: 'Status', cell: (user) => <StatusHighlighter value={user.isActive ? 'Active' : 'Inactive'} /> },
        {
            key: 'actions',
            header: 'Actions',
            cell: (user) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(user)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title="Edit employee account">
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(user)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete employee account">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )
        }
    ]

    return (
        <div className="flex h-full min-w-0 flex-1 min-h-0 flex-col space-y-5 overflow-y-auto bg-transparent dark:bg-black">
            <PageHeader title="Employee Management" subtitle="Create employee login accounts, assign roles, choose unit access, and control login status." breadcrumbs={[{ label: 'Super Admin' }, { label: 'Employee Management' }]} />

            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-black">
                <div>
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">Employee Accounts</h2>
                    <p className="text-sm font-medium text-gray-500">Direct login accounts for admins, staff, and operators</p>
                </div>
                <button onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-primary-700">
                    <Plus className="h-4 w-4" />
                    Create Employee
                </button>
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search employees, email, or role..."
                filters={[
                    {
                        name: 'organization',
                        value: selectedOrganization,
                        onChange: (event) => setSelectedOrganization(event.target.value as OrganizationFilter),
                        options: organizationOptions.map((organization) => ({
                            value: organization,
                            label: organization === 'ALL' ? 'All Organizations' : organization
                        }))
                    }
                ]}
            />

            <DataTable 
                data={filteredUsers} 
                columns={columns} 
                keyExtractor={(user) => user.id} 
                showScrollbars
                minTableWidth="1200px"
                spreadColumns
                fullHeight={false}
            />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingUser ? 'Edit Employee Account' : 'Create Employee Account'} size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col gap-6">
                    {!editingUser && (
                        <div className="rounded-lg border border-primary-100 bg-primary-50/70 p-4 dark:border-primary-500/20 dark:bg-primary-500/10">
                            <label className="mb-2 block text-sm font-extrabold text-gray-900 dark:text-gray-100">Employee Account Template</label>
                            <select
                                value={selectedTemplateId}
                                onChange={(event) => applyTemplate(event.target.value)}
                                className="h-10 w-full rounded-lg border border-primary-200 bg-white px-3 text-sm font-bold text-gray-700 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-black dark:text-gray-100"
                            >
                                <option value="">Choose an organization role template</option>
                                {Object.entries(templateGroups).map(([organization, templates]) => (
                                    <optgroup key={organization} label={organization}>
                                        {templates.map((template) => (
                                            <option key={template.id} value={template.id}>{template.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {selectedTemplateId ? (
                                <p className="mt-2 text-xs font-semibold text-primary-700">
                                    {userTemplates.find((template) => template.id === selectedTemplateId)?.description}
                                </p>
                            ) : null}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <Input label="First Name *" {...register('firstName')} error={errors.firstName?.message} />
                        <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} />
                        <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} />
                        <Input label="Mobile" {...register('mobile')} error={errors.mobile?.message} />
                        <Input label={editingUser ? 'New Password' : 'Password *'} type="password" {...register('password')} error={errors.password?.message} />
                        <Select label="Role *" {...register('roleId')} error={errors.roleId?.message} options={roleOptions} />
                        <Select label="Unit *" {...register('unitId')} error={errors.unitId?.message} options={unitOptions} />
                        <Select
                            label="Login Status *"
                            {...register('isActive')}
                            error={errors.isActive?.message}
                            options={[
                                { value: 'true', label: 'Active' },
                                { value: 'false', label: 'Inactive' }
                            ]}
                        />
                    </div>

                    <div className="mt-auto flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-white/10">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={createUser.isPending || updateUser.isPending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60">
                            {createUser.isPending || updateUser.isPending ? 'Saving...' : 'Save Employee'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
