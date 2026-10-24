import { api } from '../../../lib/axios'

export const chatService = {
    getConversations: async (filters: any = {}) => {
        const response = await api.get('/conversation', { params: filters })
        return response.data.data
    },
    getConversation: async (id: string) => {
        const response = await api.get(`/conversation/${id}`)
        return response.data.data
    },
    sendMessage: async (data: {
        conversationId?: string;
        entityType?: string;
        entityId?: string;
        body: string;
        channel?: string;
        externalUserId?: string;
        subject?: string;
        retryMessageId?: string;
    }) => {
        const response = await api.post('/conversation/message', data)
        return response.data.data
    },
    sendSMS: async (data: {
        conversationId: string;
        to?: string;
        externalUserId?: string;
        message?: string;
        body?: string;
        text?: string;
    }) => {
        const response = await api.post('/twilio/sms/outbound', data)
        return response.data.data
    },
    retryMessage: async (data: {
        conversationId: string;
        retryMessageId: string;
        channel?: string;
        externalUserId?: string;
        subject?: string;
    }) => {
        const response = await api.post('/conversation/message', data)
        return response.data.data
    },
    startCall: async (data: {
        conversationId: string;
        to?: string;
        agentPhone?: string;
        body?: string;
    }) => {
        const response = await api.post('/exotel/call/outbound', data)
        return response.data.data
    },
    getCallHistory: async (params: {
        conversationId?: string;
        customerPhone?: string;
        phone?: string;
        status?: string;
        direction?: string;
        provider?: string;
        limit?: number;
    } = {}) => {
        const response = await api.get('/calls/history', { params })
        return response.data.data
    },
    getCallContext: async (params: {
        conversationId?: string;
        customerPhone?: string;
    } = {}) => {
        const response = await api.get('/exotel/call/context', { params })
        return response.data.data
    },
    getCallAnalytics: async (params: {
        conversationId?: string;
        customerPhone?: string;
    } = {}) => {
        const response = await api.get('/exotel/call/analytics', { params })
        return response.data.data
    },
    syncCalls: async (params: {
        conversationId?: string;
        customerPhone?: string;
        phone?: string;
        lastEventId?: string;
        limit?: number;
    } = {}) => {
        const response = await api.get('/calls/sync', { params })
        return response.data.data
    },
    getGlobalCallHistory: async (params: any = {}) => {
        const response = await api.get('/calls/history/global', { params })
        return response.data.data
    },
    getGlobalCallAnalytics: async (params: any = {}) => {
        const response = await api.get('/calls/analytics/global', { params })
        return response.data.data
    },
    syncGlobalCalls: async (params: any = {}) => {
        const response = await api.get('/calls/sync/global', { params })
        return response.data.data
    },
    getLeadScore: async (entityId: string, module: string = 'enquiry') => {
        const response = await api.get(`/automation/score/${entityId}`, {
            params: { module }
        })
        return response.data.data
    }
}
