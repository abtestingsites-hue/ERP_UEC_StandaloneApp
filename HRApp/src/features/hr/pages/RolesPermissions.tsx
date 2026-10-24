import { useState } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { Select } from '../../../components/Select'
import { useToast } from '../../../components/Toast'

// Simulating RBAC Matrix
const modules = ['Master', 'Enquiry', 'Allocation', 'Accounts', 'HR', 'CMS', 'Profile']
const actions = ['create', 'read', 'update', 'delete'] as const

export function RolesPermissions() {
    const { toast } = useToast()
    const [selectedRole, setSelectedRole] = useState('Nurse')

    // Mock Matrix State
    const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
        Master: { create: false, read: true, update: false, delete: false },
        Enquiry: { create: true, read: true, update: true, delete: false },
        Allocation: { create: false, read: true, update: false, delete: false },
        Accounts: { create: false, read: false, update: false, delete: false },
        HR: { create: false, read: false, update: false, delete: false },
        CMS: { create: false, read: false, update: false, delete: false },
        Profile: { create: true, read: true, update: true, delete: false }
    })

    const togglePermission = (mod: string, action: string) => {
        setPermissions(prev => ({
            ...prev,
            [mod]: {
                ...prev[mod],
                [action]: !prev[mod][action]
            }
        }))
    }

    const handleSave = () => {
        toast({ type: 'success', title: 'Saved', message: `Permissions updated for ${selectedRole}` })
    }

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader title="Roles & Permissions (RBAC)" breadcrumbs={[{ label: 'HR' }, { label: 'RBAC' }]} />

            <div className="w-64">
                <Select
                    label="Select Role to Manage"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    options={[{ value: 'Admin', label: 'Admin' }, { value: 'Doctor', label: 'Doctor' }, { value: 'Nurse', label: 'Nurse' }, { value: 'Attendant', label: 'Attendant' }]}
                />
            </div>

            <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                                {actions.map(action => (
                                    <th key={action} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{action}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-white/10">
                            {modules.map(mod => (
                                <tr key={mod} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{mod}</td>
                                    {actions.map(action => (
                                        <td key={action} className="px-6 py-4 whitespace-nowrap text-center">
                                            <input
                                                type="checkbox"
                                                checked={permissions[mod]?.[action] || false}
                                                onChange={() => togglePermission(mod, action)}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded cursor-pointer"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex flex-col gap-6 bg-gray-50 dark:bg-white/5">
                    {/* Enhanced Unit Access Toggle */}
                    <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Unit Access Permission</h4>
                        <div className="grid border border-gray-200 dark:border-white/10 rounded-md divide-y divide-gray-200 dark:divide-white/10 bg-white dark:bg-black shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sunrise Unit 1</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sunrise Unit 2</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm transition-colors">
                        Save Permissions Matrix
                    </button>
                </div>
            </div>
        </div>
    )
}
