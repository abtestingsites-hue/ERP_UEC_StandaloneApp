import { api } from '../../../lib/axios';

export interface SaveVitalsPayload {
    patientId: string;
    shift?: 'MORNING' | 'EVENING';
    bp?: string;
    pulse?: number;
    temp?: number;
    spO2?: number;
    bloodSugar?: string;
    notes?: string;
}

export interface SaveCareNotesPayload {
    patientId: string;
    activityCategory?: string;
    notes?: string;
    mobility?: string;
    hygiene?: string;
    feeding?: string;
}

export const careDeliveryApi = {
    async recordVitals(payload: SaveVitalsPayload) {
        const res = await api.post('/nursing-care/vitals', {
            shift: 'MORNING',
            ...payload
        });
        return res.data;
    },

    async recordDailyNotes(payload: SaveCareNotesPayload) {
        const res = await api.post('/patient-care/adl-records', {
            activityCategory: 'DAILY_CARE_NOTES',
            ...payload
        });
        return res.data;
    }
};
