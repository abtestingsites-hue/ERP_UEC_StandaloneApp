import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function useAssignment(assignmentId: string) {
    return useQuery({
        queryKey: ['medical-assignment', assignmentId],
        queryFn: async () => {
            const { data } = await api.get(`/medical/assignments/${assignmentId}`);
            return data.data;
        },
        enabled: !!assignmentId
    });
}

export function useUpdateAssignmentStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { data } = await api.patch(`/medical/assignments/${id}/status`, { status });
            return data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['medical-assignment', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['my-shift'] });
        }
    });
}

export function useUpdateAssignmentMetadata() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, metadata }: { id: string; metadata: any }) => {
            const { data } = await api.patch(`/medical/assignments/${id}`, { metadata });
            return data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['medical-assignment', variables.id] });
        }
    });
}
