import { api } from '../../../lib/axios';
import type { Enquiry, AdmissionRecord } from '../types';
import type { EnquiryFormValues } from '../schema';

const mapBackendStatusToUi = (status: string, isConverted?: boolean): Enquiry['status'] => {
    if (status === 'FOLLOW_UP') return 'Follow Up';
    if (status === 'IN_PROGRESS') return 'In Progress';
    if (status === 'CLOSED') return isConverted ? 'Converted' : 'Lost';
    return 'Open';
};

const parseMeta = (rawMessage?: string | null) => {
    if (!rawMessage) return {};
    try {
        const parsed = JSON.parse(rawMessage);
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
    } catch {
        return {};
    }
};

const mapBackendEnquiry = (e: any): Enquiry => {
    const meta = parseMeta(e.rawMessage);
    const followUps = Array.isArray(e.followUps) ? e.followUps : [];
    const latestFollowUp = followUps[0];
    const renewalFollowUp = followUps.find((followUp: any) => (
        String(followUp?.nextFollowupStatus || '').startsWith('RENEWAL') ||
        String(followUp?.clientInterest || '').toLowerCase() === 'renewal follow-up'
    ));
    const displayFollowUp = renewalFollowUp || latestFollowUp;

    return {
        id: e.id,
        refNo: e.refNo,
        createdAt: e.createdAt,
        unitId: e.unitId,
        serviceId: e.serviceId || e.service?.id || '',
        service: e.service?.name || 'Standard',
        serviceCategory: e.service?.category || '',
        mode: e.mode || 'Digital',
        source: e.source || 'Website',
        clientName: e.client?.name || 'Unknown',
        mobile: e.client?.mobile || 'N/A',
        email: e.client?.email || 'N/A',
        comments: e.description || '',
        status: mapBackendStatusToUi(e.status, e.isConverted),
        patientName: meta.patientName || e.patientName || e.admission?.patient?.name || '',
        patientAge: meta.patientAge || e.patientAge || '',
        patientGender: meta.patientGender || e.patientGender || '',
        patientHealthCondition: meta.patientHealthCondition || e.patientHealthCondition || '',
        clientAddress: e.clientAddress || e.client?.address || '',
        clientLocation: meta.clientLocation || e.clientLocation || '',
        remarks: meta.remarks || e.remarks || '',
        lastFollowUp: displayFollowUp?.scheduledAt || null,
        lastFollowUpId: displayFollowUp?.id || undefined,
        lastFollowUpOutcome: displayFollowUp?.outcome || undefined,
        lastFollowUpStatus: displayFollowUp?.nextFollowupStatus || latestFollowUp?.nextFollowupStatus || undefined,
        isRenewalFollowUp: Boolean(renewalFollowUp),
        lastFollowedBy: e.allocation?.staff
            ? `${e.allocation.staff.firstName} ${e.allocation.staff.lastName || ''}`.trim()
            : (latestFollowUp?.user?.firstName || 'Agent'),
        followUps: followUps.map((followUp: any) => ({
            id: followUp.id,
            notes: followUp.notes || '',
            scheduledAt: followUp.scheduledAt || null,
            channel: followUp.channel || '',
            outcome: followUp.outcome || '',
            clientInterest: followUp.clientInterest || '',
            readyToPayAmount: followUp.readyToPayAmount,
            paymentMode: followUp.paymentMode || '',
            nextFollowupStatus: followUp.nextFollowupStatus || '',
            createdAt: followUp.createdAt
        })),
        automationScore: typeof e.automationScore === 'number' ? e.automationScore : 0,
        automationPriority: e.automationPriority || 'COLD',
        admissionId: e.admission?.id || null,
        admittedAt: e.admission?.admittedAt || null,
        admittedPatientName: e.admission?.patient?.name || null,
        clientPortalAccess: e.clientPortalAccess || null,
        serviceRequirements: e.serviceRequirements || undefined
    };
};

export const enquiryService = {
    getEnquiries: async (options?: { scope?: 'all' }): Promise<Enquiry[]> => {
        const response = await api.get('/enquiry', {
            params: options?.scope === 'all' ? { scope: 'all' } : undefined
        });
        const records = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
        return records.map(mapBackendEnquiry);
    },

    getEnquiryDetail: async (id: string): Promise<Enquiry> => {
        const response = await api.get(`/enquiry/${id}`);
        const data = response.data?.data || response.data;
        return mapBackendEnquiry(data);
    },

    addEnquiry: async (data: EnquiryFormValues): Promise<Enquiry> => {
        const response = await api.post('/enquiry', data);
        return response.data?.data || response.data;
    },

    updateEnquiry: async (id: string, data: EnquiryFormValues | any): Promise<Enquiry> => {
        const response = await api.put(`/enquiry/${id}`, data);
        return response.data?.data || response.data;
    },

    deleteEnquiry: async (id: string): Promise<void> => {
        await api.delete(`/enquiry/${id}`);
    },

    addFollowUp: async (
        id: string,
        data: {
            notes: string;
            nextDate: string;
            staffId?: string;
            channel?: string;
            outcome?: string;
            attachmentName?: string;
            clientInterest?: string;
            readyToPayAmount?: number;
            paymentMode?: string;
            nextFollowupStatus?: string;
        }
    ): Promise<Enquiry> => {
        const response = await api.post(`/enquiry/${id}/follow-up`, data);
        return response.data?.data || response.data;
    },

    recordRenewalOutcome: async (
        id: string,
        data: {
            followUpId?: string;
            outcome: 'INTERESTED' | 'NOT_INTERESTED' | 'CALL_LATER' | 'CONVERTED_TO_NEW_SERVICE' | 'CLOSED';
            notes?: string;
            nextDate?: string;
            service?: string;
        }
    ): Promise<any> => {
        const response = await api.post(`/enquiry/${id}/renewal-outcome`, data);
        return response.data?.data || response.data;
    },

    convertToAdmission: async (id: string, data: any): Promise<any> => {
        const response = await api.post(`/enquiry/${id}/convert-to-admission`, data);
        return response.data?.data || response.data;
    }
};
