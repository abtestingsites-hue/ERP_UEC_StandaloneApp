import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitsApi } from '../api/visitsApi';

export function useVisits() {
    const queryClient = useQueryClient();

    const visitsQuery = useQuery({
        queryKey: ['homecare-my-visits'],
        queryFn: () => visitsApi.getMyVisits()
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, payload }: {
            id: string;
            payload: { status: string; completedAt?: string | null; remarks?: string | null }
        }) => {
            return await visitsApi.updateVisitStatus(id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('homecare-')
            });
        }
    });

    return {
        visits: visitsQuery.data || [],
        isLoading: visitsQuery.isLoading,
        error: visitsQuery.error,
        refetch: visitsQuery.refetch,
        updateStatus: updateStatusMutation.mutateAsync,
        isUpdating: updateStatusMutation.isPending
    };
}

export function useVisitDetails(id: string) {
    const visitQuery = useQuery({
        queryKey: ['homecare-visit-detail', id],
        queryFn: () => visitsApi.getVisitById(id),
        enabled: Boolean(id)
    });

    return {
        visit: visitQuery.data || null,
        isLoading: visitQuery.isLoading,
        refetch: visitQuery.refetch
    };
}
