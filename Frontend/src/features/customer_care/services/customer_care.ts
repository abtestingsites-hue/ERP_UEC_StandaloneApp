import { api } from '../../../lib/axios'
import type { Complaint } from '../types'
import type { ComplaintFormValues } from '../schema'

const formatDate = (value?: string) => {
    const date = value ? new Date(value) : new Date()
    return Number.isNaN(date.getTime())
        ? new Date().toISOString().split('T')[0]
        : date.toISOString().split('T')[0]
}

const normalizePriority = (value?: string): Complaint['priority'] => {
    const normalized = String(value || '').toLowerCase()
    if (normalized === 'critical') return 'Critical'
    if (normalized === 'high') return 'High'
    if (normalized === 'medium') return 'Medium'
    return 'Low'
}

const normalizeStatus = (value?: string): Complaint['status'] => {
    const normalized = String(value || '').toUpperCase().replace(/[\s-]+/g, '_')
    if (normalized === 'ASSIGNED') return 'In Progress'
    if (normalized === 'IN_PROGRESS') return 'In Progress'
    if (normalized === 'RESOLVED') return 'Resolved'
    if (normalized === 'CLOSED') return 'Closed'
    return 'Open'
}

const mapComplaint = (c: any): Complaint => ({
    id: c.id,
    ticketNo: c.ticketNo || c.refNo || c.ref || String(c.id || '').split('-')[0],
    date: c.date || formatDate(c.createdAt),
    clientName: c.clientName || c.metadata?.clientName || 'Walk-in Client',
    category: c.category || c.type || c.metadata?.category || 'General Complaint',
    priority: normalizePriority(c.priority || c.metadata?.priority),
    status: normalizeStatus(c.status),
    description: c.description || '',
    assignedTo: c.assignedTo || c.staff || c.metadata?.assignedStaffName || c.metadata?.assignedTo || undefined,
    assignedStaffId: c.metadata?.assignedStaffId || undefined,
    complaintTaskId: c.metadata?.complaintTaskId || undefined,
    resolutionNotes: c.metadata?.resolutionNotes || undefined,
    resolvedAt: c.metadata?.resolvedAt || undefined,
    closedAt: c.metadata?.closedAt || undefined,
    unitId: c.unitId || 'U-001'
})

const isDemoOrSeedRecord = (row: any) => [
    row?.id,
    row?.ref,
    row?.refNo,
    row?.ticketNo,
    row?.allocationRef,
    row?.taskRefNo
].some((value) => /(^|[^a-z0-9])(DEMO|SEED)[-_]/i.test(String(value || '')))

export const customerCareService = {
    getComplaints: async (options?: { scope?: 'all' }): Promise<Complaint[]> => {
        const res = await api.get('/customer-care/complaints', {
            params: options?.scope === 'all' ? { scope: 'all' } : undefined
        })
        const complaints = Array.isArray(res.data.data)
            ? res.data.data.filter((row: any) => !isDemoOrSeedRecord(row))
            : []

        return complaints.map(mapComplaint)
    },
    createComplaint: async (data: ComplaintFormValues): Promise<Complaint> => {
        const res = await api.post('/customer-care/complaints', data)
        return mapComplaint(res.data.data)
    },
    updateComplaintWorkflow: async (
        complaintId: string,
        data: { status: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED'; assignedTo?: string; resolutionNotes?: string },
        options?: { scope?: 'all' }
    ): Promise<Complaint> => {
        const res = await api.patch(`/customer-care/complaints/${complaintId}/workflow`, data, {
            params: options?.scope === 'all' ? { scope: 'all' } : undefined
        })
        return mapComplaint(res.data.data)
    },
    getServiceHistory: async (options?: { scope?: 'all' }): Promise<any[]> => {
        const res = await api.get('/customer-care/service-history', {
            params: options?.scope === 'all' ? { scope: 'all' } : undefined
        })
        const history = Array.isArray(res.data.data)
            ? res.data.data.filter((row: any) => !isDemoOrSeedRecord(row))
            : []

        return history
    },
    getPendingFeedback: async (options?: { scope?: 'all', unitId?: string | null }): Promise<any[]> => {
        const res = await api.get('/customer-care/pending-feedback', {
            params: options?.scope === 'all' ? { scope: 'all' } : undefined,
            headers: options?.unitId ? { 'x-unit-id': options.unitId } : undefined
        })
        return Array.isArray(res.data.data)
            ? res.data.data.filter((row: any) => !isDemoOrSeedRecord(row))
            : []
    },
    getRenewalCandidates: async (options?: { scope?: 'all', unitId?: string | null }): Promise<any[]> => {
        const res = await api.get('/customer-care/service-history', {
            params: options?.scope === 'all' ? { scope: 'all' } : undefined,
            headers: options?.unitId ? { 'x-unit-id': options.unitId } : undefined
        })
        return Array.isArray(res.data.data) ? res.data.data : []
    },
    createRenewalFollowUp: async (
        allocationId: string,
        data: { nextDate?: string | null; notes?: string; channel?: string },
        options?: { scope?: 'all' }
    ): Promise<any> => {
        const res = await api.post(`/customer-care/renewals/${allocationId}/follow-up`, data, {
            params: options?.scope === 'all' ? { scope: 'all' } : undefined
        })
        return res.data.data
    },
    recordServiceFeedback: async (allocationId: string, data: { rating: number; comments?: string }, options?: { scope?: 'all' }): Promise<any> => {
        const res = await api.post(`/customer-care/service-history/${allocationId}/feedback`, data, {
            params: options?.scope === 'all' ? { scope: 'all' } : undefined
        })
        return res.data.data
    }
}
