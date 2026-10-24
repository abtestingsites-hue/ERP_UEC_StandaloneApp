import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function useAllocations() {
    const queryClient = useQueryClient();

    // 1. Fetch allocations list
    const allocationsQuery = useQuery({
        queryKey: ['homecare-allocations-list'],
        queryFn: async () => {
            const res = await api.get('/allocation/home-care').catch(() => ({ data: [] }));
            const list = res.data?.data || res.data || [];
            return Array.isArray(list) ? list : [];
        }
    });

    // 2. Fetch active admissions and enrich with service contracts to identify unallocated active contracts
    const unallocatedAdmissionsQuery = useQuery({
        queryKey: ['homecare-unallocated-admissions'],
        queryFn: async () => {
            const res = await api.get('/enquiry/admissions').catch(() => ({ data: [] }));
            const admissions = res.data?.data || res.data || [];
            if (!Array.isArray(admissions)) return [];

            const enriched = await Promise.all(
                admissions.map(async (adm: any) => {
                    const contractRes = await api.get(`/service-contracts/admission/${adm.id}`).catch(() => null);
                    let contract = null;
                    if (contractRes && contractRes.data) {
                        const payload = contractRes.data;
                        const c = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;
                        if (c && typeof c === 'object' && c.id) {
                            contract = c;
                        }
                    }
                    return {
                        ...adm,
                        serviceContract: contract
                    };
                })
            );
            return enriched;
        }
    });

    // 3. Fetch staff available for allocation (strictly filtered for canonical Caregiver designation)
    const staffQuery = useQuery({
        queryKey: ['homecare-caregiver-staff'],
        queryFn: async () => {
            const [hrRes, medRes] = await Promise.all([
                api.get('/hr/staff?scope=all').catch(() => null),
                api.get('/medical/staff').catch(() => null)
            ]);

            const hrList = Array.isArray(hrRes?.data?.data) ? hrRes.data.data : Array.isArray(hrRes?.data) ? hrRes.data : [];
            const medList = Array.isArray(medRes?.data?.data) ? medRes.data.data : Array.isArray(medRes?.data) ? medRes.data : [];

            const map = new Map<string, any>();
            for (const s of [...hrList, ...medList]) {
                if (s && s.id && !map.has(s.id)) {
                    map.set(s.id, s);
                }
            }
            const mergedStaff = Array.from(map.values());

            return mergedStaff.filter((st: any) => {
                const status = String(st.status || '').toUpperCase();
                if (status === 'TERMINATED' || status === 'RESIGNED') return false;

                const desig = String(st.designation || st.role?.name || st.role || '').trim().toLowerCase();
                return desig === 'caregiver';
            });
        }
    });

    const allocations = allocationsQuery.data || [];
    const allAdmissions = unallocatedAdmissionsQuery.data || [];

    // Set of enquiry IDs that currently have an allocated staff member
    const allocatedEnquiryIds = new Set(
        allocations
            .filter((a: any) => (a.status === 'ALLOCATED' || a.status === 'ACTIVE') && a.staffId)
            .map((a: any) => a.enquiryId || a.enquiry?.id)
            .filter(Boolean)
    );

    // Filter admissions with an ACTIVE service contract that are not yet allocated to staff
    const unallocatedAdmissions = allAdmissions.filter((adm: any) => {
        const hasActiveContract = adm.serviceContract?.status === 'ACTIVE';
        const enquiryId = adm.enquiryId || adm.enquiry?.id;
        const isAlreadyAllocated = Boolean(enquiryId && allocatedEnquiryIds.has(enquiryId));
        return hasActiveContract && !isAlreadyAllocated;
    });

    // 4. Create / Assign Allocation
    const createAllocationMutation = useMutation({
        mutationFn: async (payload: {
            enquiryId: string;
            staffId: string;
            type?: string;
            status?: string;
            startDate?: string;
            endDate?: string | null;
            metadata?: any;
        }) => {
            const res = await api.post('/allocation', {
                type: 'HOME_CARE',
                status: 'ALLOCATED',
                ...payload
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homecare-allocations-list'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-unallocated-admissions'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-contract-admissions'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-clients'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-staff-allocations'] });
        }
    });

    // 5. Reassign / Update Allocation
    const updateAllocationMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
            const res = await api.patch(`/allocation/${id}`, payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homecare-allocations-list'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-unallocated-admissions'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-contract-admissions'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-clients'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-staff-allocations'] });
        }
    });

    return {
        allocations,
        unallocatedAdmissions,
        isLoadingAllocations: allocationsQuery.isLoading || unallocatedAdmissionsQuery.isLoading,
        staff: staffQuery.data || [],
        isLoadingStaff: staffQuery.isLoading,
        createAllocation: createAllocationMutation.mutateAsync,
        isCreating: createAllocationMutation.isPending,
        updateAllocation: updateAllocationMutation.mutateAsync,
        isUpdating: updateAllocationMutation.isPending,
        refetch: () => {
            allocationsQuery.refetch();
            unallocatedAdmissionsQuery.refetch();
        }
    };
}

