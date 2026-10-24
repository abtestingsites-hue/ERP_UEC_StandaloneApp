import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

export type WorkflowStage = {
    key: string;
    label: string;
    status: string;
    at: string | null;
    ref: string | null;
    owner: string | null;
    detail: string | null;
    complete: boolean;
    nextRoute?: string | null;
    actionLabel?: string | null;
};

export type WorkflowTimeline = {
    id: string;
    refNo: string;
    clientName: string;
    mobile: string | null;
    service: string;
    status: string;
    unitId: string;
    createdAt: string;
    updatedAt: string;
    currentStep: string;
    openItems: string[];
    nextAction?: {
        label: string;
        route: string | null;
        stageKey: string;
    } | null;
    summary: {
        followUps: number;
        tasks: number;
        invoices: number;
        receipts?: number;
        invoiceAmount: number;
        paidAmount?: number;
        balanceAmount?: number;
        auditEvents?: number;
        renewalFollowUps?: number;
        convertedRenewals?: number;
    };
    stages: WorkflowStage[];
};

export const workflowTimelineService = {
    list: async (options?: { search?: string; scope?: 'all' }): Promise<WorkflowTimeline[]> => {
        const res = await api.get('/workflow/timeline', {
            params: {
                ...(options?.search ? { search: options.search } : {}),
                ...(options?.scope === 'all' ? { scope: 'all' } : {})
            }
        });

        return Array.isArray(res.data.data) ? res.data.data : [];
    }
};

export const useWorkflowTimelines = (search: string) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || null);
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || false);

    return useQuery({
        queryKey: ['workflow-timeline', canReadAllUnits ? 'all' : activeUnitId, search],
        queryFn: () => workflowTimelineService.list({
            search,
            scope: canReadAllUnits ? 'all' : undefined
        })
    });
};
