import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import type { NursingPatient } from '../types';

const parseMeta = (rawMessage?: string | null) => {
    if (!rawMessage) return {}
    try {
        const parsed = JSON.parse(rawMessage)
        return parsed && typeof parsed === 'object' ? parsed as Record<string, string> : {}
    } catch {
        return {}
    }
}

export const patientsService = {
    getPatients: async (): Promise<NursingPatient[]> => {
        // Fetch current admissions rather than the patient master table
        const res = await api.get('/enquiry/admissions');
        const admissions = res.data?.data || [];
        
        const patientMap = new Map<string, NursingPatient>();

        for (const record of admissions) {
            // Only include active/current admissions
            if (record.status !== 'ACTIVE') continue;

            const patientId = record.patientId || record.patient?.id;
            if (!patientId) continue;

            // Deduplicate by patient ID
            if (patientMap.has(patientId)) continue;

            const meta = parseMeta(record.enquiry?.rawMessage);
            const patientName = record.patient?.name || meta.patientName || record.enquiry?.client?.name || 'Unknown';
            const patientAge = meta.patientAge || '';
            const patientGender = meta.patientGender || '';
            const elderId = record.patient?.elderId || '';

            patientMap.set(patientId, {
                id: patientId,
                name: patientName,
                patientAge,
                patientGender,
                elderId,
                tenantId: record.tenantId || '',
                unitId: record.unitId || '',
                admissions: [{
                    id: record.id,
                    status: record.status,
                    service: record.enquiry?.service?.name || '',
                    admittedAt: record.admittedAt,
                    createdAt: record.createdAt,
                }],
                createdAt: record.createdAt || new Date().toISOString(),
                updatedAt: record.updatedAt || new Date().toISOString(),
            });
        }

        return Array.from(patientMap.values());
    }
};

export const usePatients = (options?: { enabled?: boolean }) => {
    // We only include activeUnitId in the queryKey to ensure reactivity when the unit changes
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    
    return useQuery({
        queryKey: ['nursing-patients', activeUnitId],
        queryFn: () => patientsService.getPatients(),
        enabled: options?.enabled !== false
    });
};
