import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { useToast } from '../../../components/Toast'
import { useQueryClient } from '@tanstack/react-query'
import { hrService } from '../services/hr'
import { useStaff } from '../hooks/useHR'
import { useUnits } from '../../master/hooks/useUnit'

function CustomSwitch({ checked, onChange, onText = 'View Access Only', offText = 'View Access Only' }: { checked: boolean, onChange: () => void, onText?: string, offText?: string }) {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-green-500' : 'bg-red-500'}`}
                role="switch"
                aria-checked={checked}
                onClick={onChange}
            >
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                {checked ? onText : offText}
            </span>
        </div>
    )
}

const matrixStructure = [
    {
        category: 'Profile / Staff Self Service',
        items: [
            'My Profile', 'Daily Task', 'Profile Task Dashboard', 'Notifications'
        ]
    },
    {
        category: 'UNCF - Core Admin',
        items: [
            'City Master', 'Unit Master', 'Client Services', 'Department Master',
            'Designation Master', 'Labour Services', 'Payment Category', 'Vendor Master', 'Room Mgt',
            'Cashbox', 'Cashbox Pending', 'Income', 'Expense', 'Allowance Tracking', 'Invoice', 'Renewals',
            'HR Dashboard', 'Staff Management', 'Staff Privilege', 'Leave Management',
            'Shift Roster', 'Document Tracker', 'Training Compliance', 'Labour Mgt',
            'Recruitment', 'Attendance', 'Holiday Mapping', 'Payroll',
            'Gate Management', 'Visitor Management', 'Entry Logs', 'OTP Logs',
            'Blogs', 'FAQ', 'Events'
        ]
    },
    {
        category: 'UEC - Universal Elder Care Services',
        items: [
            'Revenue Form', 'Vital Form', 'ADL', 'Food Preparation', 'Nutrition Planning',
            'Laundry Management', 'Maintenance', 'Waste Management', 'Ration Products',
            'Stationary Products', 'Electrical & Plumbing', 'Low Stock Alerts',
            'Stock Issue Request', 'Stock Issue Approval',
            'In-House Expense', 'Assign Daily Task', 'Assign Schedule Task',
            'Daily Task Approval', 'Schedule Task Approval'
        ]
    },
    {
        category: 'UHC - Universal Health Care Services',
        items: [
            'Critical Patients', 'Patient Dashboard', 'Medical Monitor', 'Medication Management',
            'Nutrition & Diet', 'Clinical Care', 'Home Care', 'Others',
            'Stock', 'Products', 'Purchase Orders', 'Stock Issue Request', 'Stock Issue Approval'
        ]
    },
    {
        category: 'UA - Universal Ambulance Services',
        items: [
            'Ambulance Services', 'Ambulance Bookings', 'Dispatch Management',
            'Vehicle & Fleet', 'Driver & Staff Assignment', 'Trip Sheets',
            'Ambulance Maintenance', 'Ambulance Billing', 'Emergency Call Logs',
            'Field Duty'
        ]
    },
    {
        category: 'UEO - Universal Customer Relationship Management',
        items: [
            'Active Enquiries', 'Enquiry Follow-up', 'New Enquiry Form',
            'All Client Details', 'Admission Tracking', 'Admission Forms',
            'Welcome Call', 'Customer Care', 'Pending Feedbacks',
            'Customer Complaints', 'Feedback', 'Service History',
            'Conversations', 'Email', 'WhatsApp', 'SMS', 'Missed Calls',
            'Calls', 'Omnichannel'
        ]
    }
]

export function StaffMenuPrivilege() {
    const { id: paramId } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const { data: staffData = [], isLoading } = useStaff({ includeFormer: true, scope: 'all' })
    const [selectedStaffId, setSelectedStaffId] = useState<string>('')

    useEffect(() => {
        if (paramId) {
            setSelectedStaffId(paramId)
        } else if (staffData.length > 0 && !selectedStaffId) {
            setSelectedStaffId(staffData[0].id)
        }
    }, [paramId, staffData])

    const { data: unitsList = [] } = useUnits()

    const activeStaffId = selectedStaffId || paramId || (staffData.length > 0 ? staffData[0].id : '')
    const staff = staffData?.find(s => s.id === activeStaffId)
    const staffUnit = unitsList.find((unit) => unit.id === staff?.unitId)

    const [unitAccessMode, setUnitAccessMode] = useState<'all' | 'individual'>('individual')
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
    const [permissions, setPermissions] = useState<Record<string, { view: boolean, createUpdate: boolean }>>({})
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const menuPrivilege = staff?.metadata?.menuPrivilege
        if (!menuPrivilege) {
            setUnitAccessMode('individual')
            setSelectedUnitIds([])
            setPermissions({})
            return
        }

        setUnitAccessMode(menuPrivilege.unitAccessMode === 'all' ? 'all' : 'individual')
        setSelectedUnitIds(Array.isArray(menuPrivilege.selectedUnitIds) ? menuPrivilege.selectedUnitIds : [])
        setPermissions(menuPrivilege.permissions && typeof menuPrivilege.permissions === 'object' ? menuPrivilege.permissions : {})
    }, [staff])

    const togglePermission = (item: string, type: 'view' | 'createUpdate') => {
        setPermissions(prev => ({
            ...prev,
            [item]: {
                view: prev[item]?.view || false,
                createUpdate: prev[item]?.createUpdate || false,
                [type]: !(prev[item]?.[type])
            }
        }))
    }

    const toggleUnitSelection = (unitId: string) => {
        setSelectedUnitIds(prev => prev.includes(unitId)
            ? prev.filter(id => id !== unitId)
            : [...prev, unitId]
        )
    }

    const handleSave = async () => {
        if (!staff?.id) return

        setIsSaving(true)
        try {
            await hrService.updateStaffMenuPrivilege(staff.id, {
                unitAccessMode,
                selectedUnitIds: unitAccessMode === 'all' ? [] : selectedUnitIds,
                permissions
            })
            await queryClient.invalidateQueries({ queryKey: ['staff'] })
            toast({ type: 'success', title: 'Saved', message: 'Staff menu privilege map updated successfully' })
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to save staff menu privilege'
            toast({ type: 'error', title: 'Error', message })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading Staff Details...</div>
    }

    if (!staff) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="text-slate-400">No staff members found.</div>
            </div>
        )
    }

    return (
        <div className="flex min-h-full min-w-0 flex-col space-y-4 bg-transparent pb-4 dark:bg-black sm:space-y-6">
            <PageHeader title="Staff Menu Privilege" breadcrumbs={[{ label: 'Home' }, { label: 'Staff Login Privilege' }]} />

            <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-black">
                <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/50 px-4 py-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">Edit - Staff Menu Privilege</h2>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedStaffId || staff.id}
                            onChange={(e) => {
                                setSelectedStaffId(e.target.value)
                                navigate(`/hr/menu-privileges/${e.target.value}`)
                            }}
                            className="px-3 py-1.5 bg-white dark:bg-black border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-md text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition shadow-sm"
                        >
                            {staffData.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.empId})</option>
                            ))}
                        </select>
                        <button onClick={() => navigate('/hr/staff-privileges')} className="px-3 py-1.5 bg-white dark:bg-black border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-md text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition shadow-sm">
                            &lt; Back to Privileges
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    <div className="mx-auto mb-8 w-full max-w-none overflow-hidden rounded-md border border-gray-200 dark:border-white/10">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10 text-gray-900 dark:text-gray-100">
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10 text-sm">
                                <tr>
                                    <td className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 text-center w-1/2">Staff Ref. No. / Emp. ID</td>
                                    <td className="px-6 py-3 text-center w-1/2">{staff.empId}</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 text-center">Staff Name</td>
                                    <td className="px-6 py-3 text-center">{staff.name}</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 text-center">
                                        <div>Unit Name</div>
                                        <div className="text-xs text-gray-500 font-normal">Location</div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div>{staffUnit?.name || 'Unknown Unit'}</div>
                                        <div className="text-xs text-gray-500">{staffUnit?.location?.label || '-'}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 text-center">Department</td>
                                    <td className="px-6 py-3 text-center">{staff.department}</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 text-center">Designation</td>
                                    <td className="px-6 py-3 text-center">{staff.role}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mx-auto mb-10 w-full max-w-none">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Select the Unit for Access</h3>
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={unitAccessMode === 'all'} onChange={() => setUnitAccessMode('all')} className="translate-y-[1px] text-red-500 focus:ring-red-500" />
                                <span className={`text-sm font-medium ${unitAccessMode === 'all' ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-600'}`}>Assign All Unit Access</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={unitAccessMode === 'individual'} onChange={() => setUnitAccessMode('individual')} className="translate-y-[1px] text-red-500 focus:ring-red-500" />
                                <span className={`text-sm font-medium ${unitAccessMode === 'individual' ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-600'}`}>Assign Individual Unit Access</span>
                            </label>
                        </div>

                        {unitAccessMode === 'individual' && (
                            <div className="grid gap-2 pl-0 sm:pl-8 2xl:grid-cols-2">
                                {unitsList.map((u: any) => (
                                    <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-primary-600"
                                            checked={selectedUnitIds.includes(u.id)}
                                            onChange={() => toggleUnitSelection(u.id)}
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{u.name} <span className="font-normal text-xs text-gray-500">{u.location?.label || ''}</span></span>
                                    </label>
                                ))}
                                {unitsList.length === 0 && (
                                    <p className="text-xs text-gray-400 italic">No units registered in database</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mx-auto w-full max-w-none space-y-8">
                        {matrixStructure.map((category) => (
                            <div key={category.category}>
                                <h3 className="text-lg font-medium text-gray-100 mb-4">{category.category}</h3>
                                <div className="overflow-x-auto rounded-md border border-white/10 bg-black">
                                    <table className="min-w-full divide-y divide-white/10">
                                        <tbody className="divide-y divide-white/10">
                                            {category.items.map((item) => {
                                                const noCreate = item === 'All Client Details' || item === 'Service History'
                                                return (
                                                    <tr key={item} className="hover:bg-white/5 transition-colors">
                                                        <td className="w-1/3 whitespace-nowrap border-r border-white/10 px-4 py-4 text-sm font-medium text-gray-300 sm:px-6">
                                                            {item}
                                                        </td>
                                                        <td className="whitespace-nowrap border-r border-white/10 px-4 py-4 sm:px-6">
                                                            <div className="flex justify-center">
                                                                <CustomSwitch
                                                                    checked={permissions[item]?.view || false}
                                                                    onChange={() => togglePermission(item, 'view')}
                                                                    onText="View Access Only" offText="View Access Only"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                                                            {noCreate ? (
                                                                <div className="text-center text-gray-400 font-medium text-sm">NA</div>
                                                            ) : (
                                                                <div className="flex justify-center">
                                                                    <CustomSwitch
                                                                        checked={permissions[item]?.createUpdate || false}
                                                                        onChange={() => togglePermission(item, 'createUpdate')}
                                                                        onText="Create & Update Access" offText="Create & Update Access"
                                                                    />
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col justify-end gap-3 border-t border-gray-200 bg-white px-0 pt-6 pb-8 dark:border-white/10 dark:bg-black sm:flex-row sm:px-6">
                        <button onClick={() => navigate('/hr/staff-privilege')} className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-white/5 font-medium shadow-sm transition-colors text-sm">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm transition-colors disabled:opacity-50 text-sm">
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
