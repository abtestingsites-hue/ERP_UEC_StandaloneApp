import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

export const useMedicalStaff = () => {
    const { token, activeUnitId } = useAuthStore();
    return useQuery({
        queryKey: ['medical-staff', activeUnitId],
        queryFn: async () => {
            if (!token) return [];
            const res = await api.get('/medical/staff');
            return res.data.data || [];
        },
        enabled: !!token,
        retry: false
    });
};

export const useMedicalPatients = () => {
    const { token, activeUnitId } = useAuthStore();
    return useQuery({
        queryKey: ['medical-patients', activeUnitId],
        queryFn: async () => {
            if (!token) return [];
            const res = await api.get('/enquiry/admissions', {
                params: { 
                    status: 'ACTIVE',
                    unitId: activeUnitId !== 'ALL' ? activeUnitId : undefined,
                    scope: activeUnitId === 'ALL' ? 'all' : undefined
                }
            });
            const admissions = Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.data || [];
            const patientMap = new Map();

            for (const record of admissions) {
                if (record.status !== 'ACTIVE') continue;

                const patientId = record.patientId || record.patient?.id;
                if (!patientId) continue;
                if (patientMap.has(patientId)) continue;

                let meta: any = {};
                try {
                    meta = JSON.parse(record.enquiry?.rawMessage || '{}');
                } catch {
                    // ignore parse errors
                }

                const patientName = record.patient?.name || meta.patientName || record.enquiry?.client?.name || 'Unknown';
                const elderId = record.patient?.elderId || record.enquiry?.refNo || '';

                patientMap.set(patientId, {
                    id: patientId,
                    name: patientName,
                    elderId
                });
            }

            return Array.from(patientMap.values());
        },
        enabled: !!token,
        retry: false
    });
};
