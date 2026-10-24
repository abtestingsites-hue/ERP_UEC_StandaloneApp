import React, { useEffect, useState } from 'react'
import { Modal } from '../../../components/Modal'
import { useMedicalAssignments } from '../../medical/hooks/useMedical'
import { useStaff } from '../hooks/useHR'
import { useToast } from '../../../components/Toast'

export interface AssignmentModalProps {
    isOpen: boolean
    onClose: () => void
    initialDate?: string
    initialStaffId?: string
    assignmentId?: string
    existingAssignment?: any
    allocations: any[]
}

export function AssignmentModal({
    isOpen,
    onClose,
    initialDate,
    initialStaffId,
    assignmentId,
    existingAssignment,
    allocations
}: AssignmentModalProps) {
    const { data: staffList = [] } = useStaff()
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        staffId: '',
        allocationId: '',
        dutyType: 'ROUND',
        startAt: '',
        endAt: '',
        status: 'ASSIGNED',
        priority: 'MEDIUM',
        notes: ''
    })

    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            if (existingAssignment) {
                setFormData({
                    staffId: existingAssignment.staffId || '',
                    allocationId: existingAssignment.allocationId || '',
                    dutyType: existingAssignment.dutyType || 'ROUND',
                    startAt: existingAssignment.startAt ? new Date(existingAssignment.startAt).toISOString().slice(0, 16) : '',
                    endAt: existingAssignment.endAt ? new Date(existingAssignment.endAt).toISOString().slice(0, 16) : '',
                    status: existingAssignment.status || 'ASSIGNED',
                    priority: existingAssignment.priority || 'MEDIUM',
                    notes: existingAssignment.notes || ''
                })
            } else {
                setFormData({
                    staffId: initialStaffId || '',
                    allocationId: '',
                    dutyType: 'ROUND',
                    startAt: initialDate ? `${initialDate}T09:00` : '',
                    endAt: initialDate ? `${initialDate}T17:00` : '',
                    status: 'ASSIGNED',
                    priority: 'MEDIUM',
                    notes: ''
                })
            }
            setError(null)
        }
    }, [isOpen, initialDate, initialStaffId, existingAssignment])

    const selectedStaff = staffList.find((s: any) => s.id === formData.staffId)

    const availableAllocations = React.useMemo(() => {
        if (!selectedStaff || !selectedStaff.unitId) return allocations
        return allocations.filter((alloc) => alloc.unitId === selectedStaff.unitId || !alloc.unitId)
    }, [allocations, selectedStaff])

    useEffect(() => {
        if (formData.allocationId && selectedStaff && selectedStaff.unitId) {
            const stillValid = availableAllocations.some(alloc => alloc.id === formData.allocationId)
            if (!stillValid) {
                setFormData(prev => ({ ...prev, allocationId: '' }))
            }
        }
    }, [formData.allocationId, availableAllocations, selectedStaff])

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setError(null)

        if (!formData.staffId || !formData.startAt || !formData.endAt) {
            setError('Staff, Start Time, and End Time are required.')
            return
        }

        toast({ type: 'info', title: 'Shift View Only', message: 'Shift assignments are managed via Nursing & Operations.' })
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={assignmentId ? 'View Assignment' : 'Assignment Details'}
            onConfirm={handleSubmit}
            confirmLabel="Close"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg">
                        {error}
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Staff</label>
                        <select
                            value={formData.staffId}
                            onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            required
                        >
                            <option value="">Select Staff...</option>
                            {staffList.map((staff: any) => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.name || `${staff.firstName} ${staff.lastName || ''}`} ({staff.empId})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Allocation / Client</label>
                        <select
                            value={formData.allocationId}
                            onChange={(e) => setFormData({ ...formData, allocationId: e.target.value })}
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            disabled={!formData.staffId}
                        >
                            <option value="">None (General Duty)</option>
                            {availableAllocations.map((alloc) => (
                                <option key={alloc.id} value={alloc.id}>
                                    {alloc.refNo || alloc.ref || 'ALC'} - {alloc.clientName || alloc.enquiry?.client?.name || 'Unknown Client'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                        <input
                            type="datetime-local"
                            value={formData.startAt}
                            onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                        <input
                            type="datetime-local"
                            value={formData.endAt}
                            onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            required
                        />
                    </div>
                </div>
            </form>
        </Modal>
    )
}
