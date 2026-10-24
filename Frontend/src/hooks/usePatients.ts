import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export const usePatients = (searchTerm = '') => {
    return useQuery({
        queryKey: ['patients', searchTerm],
        queryFn: async () => {
            const url = searchTerm 
                ? `/patient-billing/patient-lookup?query=${encodeURIComponent(searchTerm)}`
                : '/operations/patients'; // Corrected endpoint for patient list
            const { data } = await api.get(url);
            // Adapt for both patient-lookup and standard patients endpoint array structures
            return data?.data || data || [];
        }
    });
};
