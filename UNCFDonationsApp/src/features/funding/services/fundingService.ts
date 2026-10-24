import { api } from '../../../lib/axios';

export interface FundingAllocation {
    id: string;
    projectId: string;
    amount: number;
    source?: string;
    notes?: string;
    date: string;
    project?: { id: string; name: string };
    createdAt: string;
}

export const getFundingAllocations = async (): Promise<FundingAllocation[]> => {
    const res = await api.get('/funding-projects/funding-allocations');
    return res.data?.data || [];
};

export const createFundingAllocation = async (payload: { projectId: string; amount: number; notes?: string; source?: string }) => {
    const res = await api.post('/funding-projects/funding-allocations', payload);
    return res.data?.data;
};
