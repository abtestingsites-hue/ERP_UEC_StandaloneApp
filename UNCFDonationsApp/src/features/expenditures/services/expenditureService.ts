import { api } from '../../../lib/axios';

export interface ProjectExpenditure {
    id: string;
    projectId: string;
    amount: number;
    description?: string;
    category?: string;
    date: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedById?: string;
    project?: { id: string; name: string };
    createdAt: string;
}

export const getProjectExpenditures = async (): Promise<ProjectExpenditure[]> => {
    const res = await api.get('/funding-projects/project-expenditures');
    return res.data?.data || [];
};

export const createProjectExpenditure = async (payload: { projectId: string; amount: number; description?: string; category?: string }) => {
    const res = await api.post('/funding-projects/project-expenditures', payload);
    return res.data?.data;
};

export const approveProjectExpenditure = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const res = await api.patch(`/funding-projects/project-expenditures/${id}/approve`, { status });
    return res.data?.data;
};
