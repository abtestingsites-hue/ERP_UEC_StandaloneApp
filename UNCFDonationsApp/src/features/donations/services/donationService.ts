import { api } from '../../../lib/axios';
import type { Donation } from '../types/donation';

export const getDonations = async (): Promise<Donation[]> => {
    const { data } = await api.get('/uncf-donations');
    return data.data || [];
};

export const getDonation = async (id: string): Promise<Donation> => {
    const { data } = await api.get(`/uncf-donations/${id}`);
    return data.data;
};

export const createDonation = async (payload: any): Promise<Donation> => {
    const { data } = await api.post('/uncf-donations', payload);
    return data.data;
};

export const markDonationSent = async (id: string): Promise<any> => {
    const { data } = await api.patch(`/uncf-donations/${id}/mark-sent`);
    return data;
};
