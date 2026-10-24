import { api } from '../../../lib/axios'

export type ClientPortalService = {
    id: string
    enquiryId?: string | null
    ref?: string
    allocationRef?: string
    service?: string
    clientName?: string
    patientName?: string | null
    status?: string
    allocatedDetails?: string
    careType?: string
    completedAt?: string | null
    taskRefNo?: string | null
    notes?: string | null
    invoiceNo?: string | null
    receiptNo?: string | null
    invoiceAmount?: number
    amountToPay?: number
    paidAmount?: number
    balanceAmount?: number
    paymentMode?: string | null
    paymentStatus?: string
    invoiceNotes?: string | null
    billingItems?: Array<{
        costNo?: string
        costDate?: string
        category?: string
        description?: string
        quantity?: number
        rate?: number
        amount?: number
    }>
    workflowClosedAt?: string | null
    feedbackId?: string | null
    feedbackStatus?: string
    feedbackRating?: number | null
    feedbackComments?: string | null
    feedbackAt?: string | null
    complaintId?: string | null
    complaintRefNo?: string | null
    renewalFollowUpId?: string | null
    renewalFollowUpStatus?: string | null
    renewalFollowUpOutcome?: string | null
    renewalFollowUpNotes?: string | null
    renewalFollowUpScheduledAt?: string | null
    renewalFollowUpAt?: string | null
    renewalConvertedEnquiryId?: string | null
    renewalConvertedEnquiryRefNo?: string | null
    finalClosureStatus?: string
}

export type ClientPortalComplaint = {
    id: string
    refNo?: string
    title?: string
    type?: string
    description?: string
    status?: string
    priority?: string
    createdAt?: string
    updatedAt?: string
    metadata?: Record<string, any>
}

export type ClientPortalSavedNotification = {
    id: string
    message: string
    type: string
    isRead?: boolean
    createdAt?: string
}

export type ClientPortalMedicineSchedule = {
    id: string
    medicineIssueId?: string
    medicineName: string
    patientName: string
    dose: string
    frequency: string
    times: string[]
    administeredSlots: string[]
    pendingSlots: string[]
    administeredHistory: Array<{
        slot: string
        remarks?: string
        administeredBy?: string
        administeredAt?: string
    }>
    status: string
    startDate?: string | null
    notes?: string | null
    issuedQuantity?: number | null
    approvedBy?: string | null
    approvedAt?: string | null
    createdAt?: string
    updatedAt?: string
}

export type ClientPortalSummary = {
    clients: Array<{ id: string; refNo: string; name: string; mobile: string; email?: string | null }>
    metrics: {
        services: number
        paidServices: number
        pendingFeedback: number
        openComplaints: number
    }
    recentServices: ClientPortalService[]
    recentComplaints: ClientPortalComplaint[]
}

export const clientPortalService = {
    getSummary: async (): Promise<ClientPortalSummary> => {
        const res = await api.get('/client-portal/summary')
        return res.data.data
    },
    getServices: async (): Promise<ClientPortalService[]> => {
        const res = await api.get('/client-portal/services')
        return Array.isArray(res.data.data) ? res.data.data : []
    },
    getComplaints: async (): Promise<ClientPortalComplaint[]> => {
        const res = await api.get('/client-portal/complaints')
        return Array.isArray(res.data.data) ? res.data.data : []
    },
    getNotifications: async (): Promise<ClientPortalSavedNotification[]> => {
        const res = await api.get('/notifications')
        return Array.isArray(res.data.data) ? res.data.data : []
    },
    getMedicines: async (): Promise<ClientPortalMedicineSchedule[]> => {
        const res = await api.get('/client-portal/medicines')
        return Array.isArray(res.data.data) ? res.data.data : []
    },
    recordFeedback: async (allocationId: string, data: { rating: number; comments?: string }) => {
        const res = await api.post(`/client-portal/services/${allocationId}/feedback`, data)
        return res.data.data
    },
    createComplaint: async (data: { category: string; priority: string; description: string }) => {
        const res = await api.post('/client-portal/complaints', data)
        return res.data.data
    },
    getVitals: async (month?: string): Promise<any[]> => {
        const res = await api.get('/client-portal/vitals', { params: { month } })
        return Array.isArray(res.data.data) ? res.data.data : []
    },
    getADL: async (): Promise<any[]> => {
        const res = await api.get('/client-portal/adl')
        return Array.isArray(res.data.data) ? res.data.data : []
    },
    getNutrition: async (): Promise<any[]> => {
        const res = await api.get('/client-portal/nutrition')
        return Array.isArray(res.data.data) ? res.data.data : []
    }
}
