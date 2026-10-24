import { api } from '../../../lib/axios'
import type { Task } from '../types'
import type { TaskFormValues } from '../schema'

const isDemoTaskId = (id: string) => id.startsWith('DEMO-')

const formatStaffName = (staff?: any) => staff
    ? `${staff.firstName} ${staff.lastName || ''}`.trim()
    : ''

const mapTask = (t: any): Task => {
    const assigneeStaffName = formatStaffName(t.assignee?.staff)
    const assignedStaffName = formatStaffName(t.assignedStaff)

    return {
        id: t.id,
        refNo: t.refNo,
        title: t.title,
        description: t.description || '',
        createdAt: t.createdAt,
        assigneeId: t.assigneeId ?? t.assignedTo,
        assignedStaffId: t.assignedStaffId || t.assignee?.staff?.id || t.assignedStaff?.id,
        assignedTo: assigneeStaffName || assignedStaffName || (t.assigneeId ?? t.assignedTo),
        approvalAuthorityId: (t.approvalAuthorityId ?? t.assignedBy) || undefined,
        assignedBy: t.approvalAuthority?.staff
            ? `${t.approvalAuthority.staff.firstName} ${t.approvalAuthority.staff.lastName || ''}`.trim()
            : ((t.approvalAuthorityId ?? t.assignedBy) || 'System'),
        type: t.type || 'DAILY',
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
        status: t.status,
        priority: t.priority,
        completedAt: t.completedAt || null
    }
}

export const taskService = {
    getTasks: async (
        params?: { scope?: 'approval' | 'mine'; assigneeId?: string; assignedStaffId?: string },
        unitId?: string | null
    ): Promise<Task[]> => {
        const res = await api.get('/tasks', {
            params,
            headers: unitId ? { 'x-unit-id': unitId } : undefined
        })
        const tasks = Array.isArray(res.data.data) ? res.data.data : []

        return tasks.map(mapTask)
    },
    createTask: async (data: TaskFormValues): Promise<Task> => {
        const res = await api.post('/tasks', data)
        return mapTask(res.data.data)
    },
    updateTaskStatus: async (
        id: string,
        status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED',
        payload?: { completedAt?: string | null; remarks?: string | null }
    ): Promise<Task> => {
        if (isDemoTaskId(id)) {
            throw new Error('Demo task updates are disabled')
        }

        const res = await api.patch(`/tasks/${id}/status`, { status, ...(payload || {}) })
        return mapTask(res.data.data)
    }
}
