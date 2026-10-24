import { api } from '../../../lib/axios'

export const customerCareService = {
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
    }
}
