import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function useClients() {
    const clientsQuery = useQuery({
        queryKey: ['homecare-clients'],
        queryFn: async () => {
            const [allocationsRes, admissionsRes] = await Promise.all([
                api.get('/allocation/home-care').catch(() => ({ data: [] })),
                api.get('/enquiry/admissions').catch(() => ({ data: [] }))
            ]);

            const allocations = allocationsRes.data?.data || allocationsRes.data || [];
            const admissions = admissionsRes.data?.data || admissionsRes.data || [];

            // Combine and format Home Care clients safely
            const clientMap = new Map<string, any>();

            if (Array.isArray(allocations)) {
                allocations.forEach((item: any) => {
                    const key = item.id || item.allocationRef || item.clientName;
                    clientMap.set(key, {
                        id: item.id || key,
                        clientName: item.clientName || 'Home Care Client',
                        mobile: item.mobile || '-',
                        patientName: item.patient || item.clientName,
                        service: item.service || 'Home Care Service',
                        contract: item.contract || '-',
                        staffName: item.staffName || 'Unassigned',
                        staffId: item.staffId || null,
                        status: item.status || 'ALLOCATED',
                        type: 'ALLOCATION',
                        raw: item
                    });
                });
            }

            if (Array.isArray(admissions)) {
                admissions.forEach((item: any) => {
                    const clientName = item.enquiry?.client?.name || item.patient?.name || 'Home Care Patient';
                    const key = item.id || item.enquiry?.refNo || clientName;

                    if (!clientMap.has(key)) {
                        clientMap.set(key, {
                            id: item.id,
                            clientName,
                            mobile: item.enquiry?.client?.mobile || '-',
                            patientName: item.patient?.name || clientName,
                            service: item.enquiry?.service?.name || 'Home Care Admission',
                            contract: 'Admission Active',
                            staffName: 'Assigned via Allocation',
                            staffId: null,
                            status: item.status || 'ADMITTED',
                            type: 'ADMISSION',
                            raw: item
                        });
                    }
                });
            }

            return Array.from(clientMap.values());
        }
    });

    return {
        clients: clientsQuery.data || [],
        isLoading: clientsQuery.isLoading,
        refetch: clientsQuery.refetch,
    };
}
