import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../../components/Modal'
import { useStaff } from '../../../hooks/useHRData'

interface AssignStaffModalProps {
    isOpen: boolean
    allocation: any | null
    isSaving?: boolean
    onClose: () => void
    onAssign: (payload: { staffId: string; startDate: string; endDate?: string | null; notes?: string }) => void
}

export function AssignStaffModal({ isOpen, allocation, isSaving, onClose, onAssign }: AssignStaffModalProps) {
    const { data: staff = [] } = useStaff({ unitId: allocation?.unitId || null })
    const [staffId, setStaffId] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [notes, setNotes] = useState('')
    const [formError, setFormError] = useState('')

    useEffect(() => {
        if (!isOpen) return

        setStaffId(allocation?.staffId || '')
        setStartDate(new Date().toISOString().slice(0, 16))
        setEndDate('')
        setNotes(allocation?.notes || '')
        setFormError('')
    }, [allocation, isOpen])

    const staffOptions = useMemo(() => (
        staff.filter((item) => {
            const status = String(item.status || '').trim().toUpperCase()
            return !item.isDeleted && status !== 'TERMINATED' && status !== 'RESIGNED'
        })
    ), [staff])

    const handleConfirm = () => {
        if (!staffId) {
            setFormError('Please select a staff member before assigning this care duty.')
            return
        }

        if (!startDate) {
            setFormError('Please choose the duty start time.')
            return
        }

        setFormError('')
        onAssign({
            staffId,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : null,
            notes
        })
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Assign Staff"
            type="info"
            confirmLabel={isSaving ? 'Assigning...' : 'Assign Staff'}
            confirmDisabled={Boolean(isSaving)}
            onConfirm={handleConfirm}
        >
            <div className="mt-3 space-y-4 text-left">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-900">
                    <p className="font-extrabold">{allocation?.clientName || 'Client'}</p>
                    <p className="mt-1 text-xs font-medium">
                        {allocation?.ref || '-'} - {allocation?.service || 'Care allocation'} - {allocation?.patient || 'Patient pending'}
                    </p>
                </div>

                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                    Staff
                    <select
                        value={staffId}
                        onChange={(event) => {
                            setStaffId(event.target.value)
                            setFormError('')
                        }}
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-black dark:text-gray-100"
                    >
                        <option value="">Select staff</option>
                        {staffOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name} - {item.empId} - {item.role}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Start Time
                        <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-black dark:text-gray-100"
                        />
                    </label>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        End Time
                        <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-black dark:text-gray-100"
                        />
                    </label>
                </div>

                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                    Notes
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-black dark:text-gray-100"
                        placeholder="Duty notes, timing preference, or patient instructions"
                    />
                </label>

                {staffOptions.length === 0 && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                        No active staff found for this unit. Add staff first from HR.
                    </p>
                )}

                {formError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                        {formError}
                    </p>
                )}
            </div>
        </Modal>
    )
}
