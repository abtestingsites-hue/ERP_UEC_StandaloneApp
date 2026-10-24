import { useState } from 'react'
import { AlertCircle, CheckCircle2, KeyRound, Copy } from 'lucide-react'
import { Modal } from '../../../components/Modal'
import { Select } from '../../../components/Select'
import { useToast } from '../../../components/Toast'
import { useRoles, useProvisionStaffAccount } from '../hooks/useHR'
import type { Staff } from '../types'
import { useAuthStore } from '../../../store/authStore'

interface ProvisionAccountModalProps {
    isOpen: boolean
    onClose: () => void
    staff: Staff
    unitName?: string
}

export function ProvisionAccountModal({ isOpen, onClose, staff, unitName }: ProvisionAccountModalProps) {
    const { toast } = useToast()
    const { data: roles = [] } = useRoles()
    const provision = useProvisionStaffAccount()
    const sessionUser = useAuthStore((state) => state.user)
    const [selectedRole, setSelectedRole] = useState('')
    const [passwordMethod, setPasswordMethod] = useState<'SELF_ACTIVATION' | 'HR_TEMPORARY'>('SELF_ACTIVATION')
    const [successData, setSuccessData] = useState<{ method: string, tempPassword?: string } | null>(null)

    const normalizedActorRole = String(sessionUser?.role || '').trim().toLowerCase().replace(/_/g, ' ')
    const isHrManager = normalizedActorRole === 'hr manager'
    const HR_BLOCKED_ROLES = ['super admin', 'superadmin', 'admin', 'administrative']

    const filteredRoles = isHrManager 
        ? roles.filter(r => !HR_BLOCKED_ROLES.includes(String(r.name).trim().toLowerCase().replace(/_/g, ' ')))
        : roles

    const roleOptions = [
        { value: '', label: '-- Select Role --' },
        ...filteredRoles.map(r => ({ value: r.id, label: r.name }))
    ]

    const handleProvision = () => {
        if (!selectedRole) return
        provision.mutate(
            { staffId: staff.id, data: { roleId: selectedRole, passwordMethod } },
            {
                onSuccess: (data) => {
                    setSuccessData({ method: passwordMethod, tempPassword: data?.temporaryPassword })
                }
            }
        )
    }

    const handleConfirm = () => {
        if (successData) {
            handleClose()
            return
        }
        
        const msg = passwordMethod === 'SELF_ACTIVATION'
            ? `Provision ERP access for this staff member?\nThey will receive an activation link and create their own password.`
            : `Provision ERP access for this staff member?\nA temporary password will be generated and shown once after provisioning.`

        if (window.confirm(msg)) {
            handleProvision()
        }
    }

    const handleClose = () => {
        setSuccessData(null)
        setSelectedRole('')
        setPasswordMethod('SELF_ACTIVATION')
        onClose()
    }

    const handleCopyPassword = () => {
        if (successData?.tempPassword) {
            navigator.clipboard.writeText(successData.tempPassword)
                .then(() => toast({ type: 'success', title: 'Copied', message: 'Temporary password copied.' }))
                .catch(() => toast({ type: 'error', title: 'Error', message: 'Failed to copy to clipboard.' }))
        }
    }

    if (!isOpen) return null

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title="Provision Application Access"
            onConfirm={handleConfirm}
            confirmDisabled={(!selectedRole && !successData) || provision.isPending}
            confirmLabel={successData ? 'Done' : (provision.isPending ? 'Provisioning...' : 'Confirm & Provision')}
        >
            {successData ? (
                <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg border border-green-100">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                        <h3 className="text-lg font-semibold text-green-900">Account Provisioned Successfully</h3>
                    </div>

                    {successData.method === 'SELF_ACTIVATION' ? (
                        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-700 text-center">
                                An activation link has been sent to:
                            </p>
                            <p className="text-center font-semibold text-gray-900">{staff.email || 'No email associated'}</p>
                            <p className="text-sm text-gray-700 text-center">
                                The staff member can use the link to create their password.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-xs font-medium text-blue-800 uppercase tracking-wider mb-1">Login Email</span>
                                    <span className="text-sm font-semibold text-blue-900">{staff.email || 'No email associated'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-medium text-blue-800 uppercase tracking-wider mb-1">Temporary Password</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono font-bold text-blue-900 bg-white px-2 py-1 rounded border border-blue-200 select-all">
                                            {successData.tempPassword}
                                        </span>
                                        <button 
                                            onClick={handleCopyPassword}
                                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                                            title="Copy Password"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div className="text-sm text-amber-900">
                                    <span className="font-semibold block mb-1">WARNING: Shown only once</span>
                                    Share it securely with the staff member. The staff member must change it during first login.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50">
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">Staff Name</span>
                                <span className="font-semibold text-gray-900">{staff.name}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">Employee ID</span>
                                <span className="font-semibold text-gray-900">{staff.empId || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">Email</span>
                                <span className="font-semibold text-gray-900">{staff.email || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">Unit</span>
                                <span className="font-semibold text-gray-900">{unitName || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">Department</span>
                                <span className="font-semibold text-gray-900">{staff.department || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">Designation</span>
                                <span className="font-semibold text-gray-900">{staff.role || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Select
                            label="Application Role *"
                            options={roleOptions}
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Password Setup</label>
                        <div className="space-y-2">
                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${passwordMethod === 'SELF_ACTIVATION' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                <input 
                                    type="radio" 
                                    name="passwordMethod" 
                                    value="SELF_ACTIVATION"
                                    checked={passwordMethod === 'SELF_ACTIVATION'}
                                    onChange={() => setPasswordMethod('SELF_ACTIVATION')}
                                    className="mt-1 shrink-0"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">Staff sets password through activation link</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">An activation link will be sent to the staff member's email. The staff member creates their own password.</span>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${passwordMethod === 'HR_TEMPORARY' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                <input 
                                    type="radio" 
                                    name="passwordMethod" 
                                    value="HR_TEMPORARY"
                                    checked={passwordMethod === 'HR_TEMPORARY'}
                                    onChange={() => setPasswordMethod('HR_TEMPORARY')}
                                    className="mt-1 shrink-0"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">HR sets a temporary password</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">HR receives a temporary password once and shares it securely with the staff member. The staff member must change it during first login.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    )
}
