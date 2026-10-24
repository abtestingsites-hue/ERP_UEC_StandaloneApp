import { useState } from 'react'
import { Modal } from '../../../components/Modal'
import { useResetStaffPassword } from '../hooks/useHR'
import type { Staff } from '../types'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../../../components/Toast'

interface ResetStaffPasswordModalProps {
    isOpen: boolean
    onClose: () => void
    staff: Staff
    unitName: string
}

export function ResetStaffPasswordModal({ isOpen, onClose, staff, unitName }: ResetStaffPasswordModalProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [method, setMethod] = useState<'SEND_RESET_LINK' | 'HR_TEMPORARY'>('SEND_RESET_LINK')
    const [inputPassword, setInputPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [tempPassword, setTempPassword] = useState<string | null>(null)
    const [isCopied, setIsCopied] = useState(false)
    
    const { toast } = useToast()
    const resetPassword = useResetStaffPassword()

    const handleClose = () => {
        setStep(1)
        setMethod('SEND_RESET_LINK')
        setInputPassword('')
        setConfirmPassword('')
        setShowPassword(false)
        setTempPassword(null)
        setIsCopied(false)
        onClose()
    }

    const handleConfirmStep1 = () => {
        if (method === 'HR_TEMPORARY') {
            setStep(2)
        } else {
            resetPassword.mutate(
                { staffId: staff.id, data: { method: 'SEND_RESET_LINK' } },
                {
                    onSuccess: () => {
                        handleClose()
                    }
                }
            )
        }
    }

    const handleConfirmStep2 = () => {
        if (inputPassword.length < 8) {
            toast({ type: 'error', title: 'Error', message: 'Password must be at least 8 characters long.' })
            return
        }
        if (inputPassword !== confirmPassword) {
            toast({ type: 'error', title: 'Error', message: 'Passwords do not match.' })
            return
        }

        resetPassword.mutate(
            { staffId: staff.id, data: { method: 'HR_TEMPORARY', temporaryPassword: inputPassword } },
            {
                onSuccess: () => {
                    setTempPassword(inputPassword)
                }
            }
        )
    }

    const copyToClipboard = () => {
        if (!tempPassword) return
        navigator.clipboard.writeText(tempPassword)
        setIsCopied(true)
        toast({
            type: 'success',
            title: 'Copied',
            message: 'Temporary password copied to clipboard'
        })
        setTimeout(() => setIsCopied(false), 2000)
    }

    if (tempPassword) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Temporary Password Set Successfully">
                <div className="space-y-6 max-w-md w-full">
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">Staff:</p>
                            <p className="text-base font-bold text-gray-900">{staff.name}</p>
                            
                            <p className="text-sm font-medium text-gray-500 mt-3">Login Email:</p>
                            <p className="text-base font-bold text-gray-900">{staff.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Temporary Password:</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-lg font-bold tracking-wider text-gray-900">
                                {'•'.repeat(tempPassword.length)}
                            </div>
                            <button
                                type="button"
                                onClick={copyToClipboard}
                                className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm"
                                title="Copy to clipboard"
                            >
                                {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-medium text-amber-800 text-center font-bold mb-1">
                            IMPORTANT
                        </p>
                        <p className="text-sm font-medium text-amber-800 text-center">
                            This temporary password must be shared securely with the staff member.<br />
                            The staff member will be required to change it after first login.
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </Modal>
        )
    }

    if (step === 2) {
        return (
            <Modal 
                isOpen={isOpen} 
                onClose={() => setStep(1)} 
                title="Set Temporary Password"
                onConfirm={handleConfirmStep2}
                confirmDisabled={resetPassword.isPending || !inputPassword || !confirmPassword}
                confirmLabel={resetPassword.isPending ? 'Setting...' : 'Set Temporary Password'}
                cancelLabel="Back"
            >
                <div className="space-y-6 max-w-md w-full">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-gray-500">Staff</p>
                                <p className="text-base font-bold text-gray-900">{staff.name}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-gray-500">Login Email</p>
                                <p className="text-base font-bold text-gray-900">{staff.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Temporary Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={inputPassword}
                                    onChange={(e) => setInputPassword(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    placeholder="Enter temporary password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Confirm Temporary Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    placeholder="Confirm temporary password"
                                />
                            </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                            <p className="font-semibold text-gray-700">Password requirements:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>Minimum 8 characters long</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Modal>
        )
    }

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title="Reset Staff Password"
            onConfirm={handleConfirmStep1}
            confirmDisabled={resetPassword.isPending}
            confirmLabel={method === 'HR_TEMPORARY' ? 'Continue' : (resetPassword.isPending ? 'Sending...' : 'Send Reset Link')}
        >
            <div className="space-y-6 max-w-md w-full">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-500">Staff</p>
                            <p className="text-base font-bold text-gray-900">{staff.name}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="text-sm font-bold text-gray-900">{staff.email}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <p className="text-sm font-medium text-gray-500">Role</p>
                            <p className="text-sm font-bold text-gray-900">{staff.user?.role?.name || staff.role}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-500">Unit</p>
                            <p className="text-sm font-bold text-gray-900">{unitName}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-900">Password Recovery Method</p>
                    <div className="space-y-2">
                        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${method === 'SEND_RESET_LINK' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input
                                type="radio"
                                name="resetMethod"
                                value="SEND_RESET_LINK"
                                checked={method === 'SEND_RESET_LINK'}
                                onChange={(e) => setMethod(e.target.value as any)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">Send password reset link</span>
                                <span className="text-xs font-medium text-gray-500">Staff receives an email with a secure link to reset their password</span>
                            </div>
                        </label>
                        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${method === 'HR_TEMPORARY' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input
                                type="radio"
                                name="resetMethod"
                                value="HR_TEMPORARY"
                                checked={method === 'HR_TEMPORARY'}
                                onChange={(e) => setMethod(e.target.value as any)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">Set temporary password</span>
                                <span className="text-xs font-medium text-gray-500">Create a temporary password to give to the staff directly</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
