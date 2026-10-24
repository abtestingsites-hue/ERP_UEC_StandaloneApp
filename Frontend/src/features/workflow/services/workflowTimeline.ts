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
    renewal?: {
        followUpId?: string | null;
        status?: string | null;
        outcome?: string | null;
        scheduledAt?: string | null;
        notes?: string | null;
        convertedEnquiryId?: string | null;
        convertedEnquiryRefNo?: string | null;
        convertedAt?: string | null;
    };
    closure?: {
        feedbackStatus?: string | null;
        feedbackRating?: number | null;
        feedbackComments?: string | null;
        feedbackAt?: string | null;
        complaintRefNo?: string | null;
        complaintStatus?: string | null;
        finalClosureStatus?: string | null;
    };
    auditTrail?: Array<{
        id: string;
        entityType: string;
        entityId: string;
        fromState: string | null;
        toState: string;
        actionBy: string | null;
        actionByName: string;
        notes: string | null;
        createdAt: string | null;
    }>;
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
