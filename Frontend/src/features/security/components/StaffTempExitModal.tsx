import React, { useState, type FormEvent } from 'react'
import { Modal } from '../../../components/Modal'
import { Input } from '../../../components/Input'
import { useStaffTempExit } from '../hooks/useSecurity'
import type { StaffDailyMovement } from '../types'
import { StaffMaterialEntry } from './StaffMaterialEntry'

interface StaffTempExitModalProps {
    movement: StaffDailyMovement | null
    onClose: () => void
}

const REASONS = [
    'Lunch',
    'Official Work',
    'Medical',
    'Personal',
    'Emergency',
    'Other'
]

export function StaffTempExitModal({ movement, onClose }: StaffTempExitModalProps) {
    const tempExit = useStaffTempExit()
    const [reason, setReason] = useState('')
    const [customReason, setCustomReason] = useState('')
    const [expectedReturnDate, setExpectedReturnDate] = useState('')
    const [expectedReturnTime, setExpectedReturnTime] = useState('')
    
    // Optional fields
    const [companionName, setCompanionName] = useState('')
    const [companionPhone, setCompanionPhone] = useState('')
    const [materials, setMaterials] = useState<string | null>(null)
    const [isMaterialsValid, setIsMaterialsValid] = useState(true)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!movement) return

        let expectedReturnAt = null
        if (expectedReturnDate && expectedReturnTime) {
            expectedReturnAt = new Date(`${expectedReturnDate}T${expectedReturnTime}`).toISOString()
        }

        const finalReason = reason === 'Other' ? customReason : reason

        try {
            await tempExit.mutateAsync({
                id: movement.id,
                payload: {
                    reason: finalReason,
                    expectedReturnAt,
                    companionName: companionName || null,
                    companionPhone: companionPhone || null,
                    materials: materials ? { description: materials } : null
                }
            })
            // Reset and close
            setReason('')
            setCustomReason('')
            setExpectedReturnDate('')
            setExpectedReturnTime('')
            setCompanionName('')
            setCompanionPhone('')
            setMaterials(null)
            onClose()
        } catch {
            // Handled by hook
        }
    }

    if (!movement) return null

    return (
        <Modal isOpen={!!movement} onClose={onClose} title="Record Temporary Exit">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-3 mb-4 border border-slate-100">
                    <p className="text-sm text-slate-700">
                        <span className="font-bold">Staff:</span> {movement.staff?.firstName} {movement.staff?.lastName} ({movement.staff?.empId})
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Reason for Exit *</label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                    >
                        <option value="">Select a reason...</option>
                        {REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                {reason === 'Other' && (
                    <Input
                        label="Custom Reason *"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        required
                    />
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        type="date"
                        label="Expected Return Date *"
                        value={expectedReturnDate}
                        onChange={(e) => setExpectedReturnDate(e.target.value)}
                        required
                    />
                    <Input
                        type="time"
                        label="Expected Return Time *"
                        value={expectedReturnTime}
                        onChange={(e) => setExpectedReturnTime(e.target.value)}
                        required
                    />
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Optional Details</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <Input
                            label="Companion Name"
                            value={companionName}
                            onChange={(e) => setCompanionName(e.target.value)}
                            placeholder="Optional"
                        />
                        <Input
                            label="Companion Phone"
                            value={companionPhone}
                            onChange={(e) => setCompanionPhone(e.target.value)}
                            placeholder="Optional"
                        />
                    </div>
                    <div className="mt-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-2">Materials Taken <span className="text-slate-400 font-normal">(Optional)</span></h4>
                        <StaffMaterialEntry 
                            reason={reason} 
                            onChange={setMaterials} 
                            onValidityChange={setIsMaterialsValid} 
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={tempExit.isPending || !isMaterialsValid}
                        className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
                    >
                        {tempExit.isPending ? 'Recording...' : 'Record Exit'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
