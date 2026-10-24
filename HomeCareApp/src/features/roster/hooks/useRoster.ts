import { useQuery } from '@tanstack/react-query';
import { rosterApi } from '../api/rosterApi';

export function useManagerRoster() {
    const assignmentsQuery = useQuery({
        queryKey: ['homecare-manager-assignments'],
        queryFn: () => rosterApi.getManagerAssignments()
    });

    const tasksQuery = useQuery({
        queryKey: ['homecare-manager-tasks'],
        queryFn: () => rosterApi.getScheduledTasks()
    });

    const allocationsQuery = useQuery({
        queryKey: ['homecare-manager-allocations'],
        queryFn: () => rosterApi.getHomeCareAllocations()
    });

    return {
        assignments: assignmentsQuery.data || [],
        isLoadingAssignments: assignmentsQuery.isLoading,
        tasks: tasksQuery.data || [],
        isLoadingTasks: tasksQuery.isLoading,
        allocations: allocationsQuery.data || [],
        isLoadingAllocations: allocationsQuery.isLoading,
        refetchAll: () => {
            assignmentsQuery.refetch();
            tasksQuery.refetch();
            allocationsQuery.refetch();
        }
    };
}

export function useMyRoster() {
    const myShiftQuery = useQuery({
        queryKey: ['homecare-my-shift'],
        queryFn: () => rosterApi.getMyShift()
    });

    return {
        myShift: myShiftQuery.data || { assignments: [], tasks: [] },
        isLoading: myShiftQuery.isLoading,
        error: myShiftQuery.error,
        refetch: myShiftQuery.refetch
    };
}
