import { api } from '../../../lib/axios';

export interface Project {
    id: string;
    name: string;
    description?: string;
    categoryId?: string;
    classificationId?: string;
    totalBudget: number;
    startDate?: string;
    endDate?: string;
    status: string;
    approvalStatus: string;
    createdAt: string;
    category?: { id: string; name: string };
    classification?: { id: string; name: string };
}

export const getProjects = async (): Promise<Project[]> => {
    const res = await api.get('/funding-projects/projects');
    return res.data?.data || [];
};

export const createProject = async (payload: { name: string; totalBudget: number; description?: string; status?: string }) => {
    const res = await api.post('/funding-projects/projects', payload);
    return res.data?.data;
};
