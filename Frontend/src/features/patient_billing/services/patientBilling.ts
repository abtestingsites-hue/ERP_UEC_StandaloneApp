import { api } from '../../../lib/axios'

export type PatientService = {
    allocationId: string
    allocationRef: string
    admissionId?: string | null
    patientId?: string | null
    patientName: string
    clientName: string
    familyContact?: string
    serviceType: string
    serviceLabel: string
    serviceName: string
    status: string
}

export type PatientDailyCost = {
    id: string
    costNo: string
    allocationId: string
    admissionId?: string | null
    patientName: string
    clientName?: string | null
    serviceType: string
    costDate: string
    category: string
    description: string
    quantity: number
    rate: number
    amount: number
    sourceType?: string | null
    sourceId?: string | null
    status: 'DRAFT' | 'REVIEWED' | 'INVOICED' | 'PAID' | string
    invoiceId?: string | null
    invoiceRefNo?: string | null
    sentAt?: string | null
    sentVia?: string | null
    familyContact?: string | null
    createdAt?: string | null
    updatedAt?: string | null
    metadata?: {
        uploadedBill?: {
            fileName?: string
            originalName?: string
            fileUrl?: string
            mimeType?: string
            size?: number
            uploadedAt?: string
        }
        [key: string]: any
    } | null
}

export type CreatePatientDailyCostPayload = {
    allocationId: string
    costDate: string
    category: string
    description: string
    quantity: number
    rate: number
    sourceType?: string | null
    sourceId?: string | null
}

export type MedicineCatalogItem = {
    id: string
    productId?: string | null
    name: string
    category: string
    availableQty?: number | null
    suggestedRate: number
    rateSource: string
    unitId?: string
}

export type GenerateMonthlyPatientInvoicePayload = {
    allocationId?: string
    entryIds?: string[]
    periodFrom?: string
    periodTo?: string
    upiId?: string
    qrLabel?: string
    notes?: string
}

export type CaregiverRevenueItem = {
    key: string
    label: string
    category?: string | null
    unit?: string
    rate: number
    days: Record<string, number>
}

export type CaregiverRevenueSheet = {
    id: string
    allocationId?: string | null
    patientId?: string | null
    patientName: string
    clientName?: string | null
    month: string
    items: CaregiverRevenueItem[]
    signatures?: {
        caregiverDay?: string
        caregiverNight?: string
        nurse?: string
        manager?: string
    } | null
    totalAmount: number
    status: string
    tenantId: string
    unitId: string
    createdAt?: string
    updatedAt?: string
}

export type SaveCaregiverRevenueSheetPayload = {
    allocationId?: string | null
    patientId?: string | null
    patientName: string
    clientName?: string | null
    month: string
    items: CaregiverRevenueItem[]
    signatures?: CaregiverRevenueSheet['signatures']
    status?: string
}

export const patientBillingService = {
    getServices: async (): Promise<PatientService[]> => {
        const response = await api.get('/patient-billing/services', { params: { scope: 'all' } })
        return response.data?.data || []
    },

    getEntries: async (): Promise<PatientDailyCost[]> => {
        const response = await api.get('/patient-billing/entries', { params: { scope: 'all' } })
        return response.data?.data || []
    },

    getCaregiverRevenueSheets: async (month?: string): Promise<CaregiverRevenueSheet[]> => {
        const response = await api.get('/patient-billing/caregiver-revenue-sheets', { params: { month } })
        return response.data?.data || []
    },

    saveCaregiverRevenueSheet: async (payload: SaveCaregiverRevenueSheetPayload): Promise<CaregiverRevenueSheet> => {
        const response = await api.post('/patient-billing/caregiver-revenue-sheets', payload)
        return response.data?.data
    },

    getMedicineCatalog: async (): Promise<MedicineCatalogItem[]> => {
        const response = await api.get('/patient-billing/medicine-catalog', { params: { scope: 'all' } })
        return response.data?.data || []
    },

    createEntry: async (payload: CreatePatientDailyCostPayload): Promise<PatientDailyCost> => {
        const response = await api.post('/patient-billing/entries', payload)
        return response.data?.data
    },

    uploadBillEntry: async (payload: CreatePatientDailyCostPayload & { bill: File }): Promise<PatientDailyCost> => {
        const formData = new FormData()
        formData.append('allocationId', payload.allocationId)
        formData.append('costDate', payload.costDate)
        formData.append('category', payload.category)
        formData.append('description', payload.description)
        formData.append('quantity', String(payload.quantity))
        formData.append('rate', String(payload.rate))
        if (payload.sourceId) formData.append('sourceId', payload.sourceId)
        formData.append('bill', payload.bill)

        const response = await api.post('/patient-billing/entries/upload-bill', formData)
        return response.data?.data
    },

    generateInvoice: async (payload: GenerateMonthlyPatientInvoicePayload) => {
        const response = await api.post('/patient-billing/generate-invoice', payload)
        return response.data?.data
    },

    markSent: async (payload: { invoiceId: string, sentVia?: string, familyContact?: string }) => {
        const response = await api.post('/patient-billing/mark-sent', payload)
        return response.data?.data || []
    }
}
