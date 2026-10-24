import { api } from '../../lib/axios';
import type { VisitorPass, VisitorProfile, PassAnalytics, OTPResponse } from './types';

export const visitorService = {
    // 1. Profile Lookup
    getProfile: async (mobile: string): Promise<VisitorProfile | null> => {
        const { data } = await api.get(`/visitor/profile/${encodeURIComponent(mobile)}`);
        return data?.data || null;
    },

    // 2. Pass Operations
    createPass: async (payload: any): Promise<{ profile: VisitorProfile; pass: VisitorPass }> => {
        const { data } = await api.post('/visitor/pass', payload);
        return data?.data;
    },

    updatePass: async (id: string, payload: any): Promise<VisitorPass> => {
        const { data } = await api.put(`/visitor/pass/${id}`, payload);
        return data?.data;
    },

    checkoutPass: async (id: string): Promise<VisitorPass> => {
        const { data } = await api.patch(`/visitor/pass/${id}/checkout`);
        return data?.data;
    },

    deletePass: async (id: string): Promise<void> => {
        await api.delete(`/visitor/pass/${id}`);
    },

    // 3. OTP Operations
    requestOtp: async (mobile: string): Promise<OTPResponse> => {
        const { data } = await api.post('/visitor/otp/request', { mobile });
        return data?.data;
    },

    verifyOtp: async (referenceId: string, otp: string): Promise<void> => {
        const { data } = await api.post('/visitor/otp/verify', { referenceId, otp });
        if (!data?.success) {
            throw new Error('OTP verification failed');
        }
    },

    // 4. Listing & Analytics
    getPasses: async (): Promise<VisitorPass[]> => {
        const { data } = await api.get('/visitor/passes');
        return data?.data || [];
    },

    getAnalytics: async (): Promise<PassAnalytics> => {
        const { data } = await api.get('/visitor/analytics');
        return data?.data;
    },

    // 5. Public Verification
    publicVerify: async (id: string): Promise<VisitorPass> => {
        try {
            const { data } = await api.get(`/visitor/verify/${id}`);
            return data?.data;
        } catch {
            const { data } = await api.get(`/visitor/public/verify/${id}`);
            return data?.data;
        }
    }
};
