import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export const useStaff = (departmentId?: string) => {
    return useQuery({
        queryKey: ['staff', departmentId],
        queryFn: async () => {
            const url = departmentId ? `/master/staff?departmentId=${departmentId}` : '/master/staff';
            const { data } = await api.get(url);
            return data?.data || data || [];
        }
    });
};
