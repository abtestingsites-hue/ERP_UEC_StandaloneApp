import { api } from '../../../lib/axios';

export interface MedicalAssignmentItem {
    id: string;
    assignmentNo?: string;
    patientId: string;
    staffId: string;
    dutyType?: string;
    startDate: string;
    endDate?: string | null;
    status: string;
    notes?: string | null;
    patient?: {
        id: string;
        name: string;
        mobile?: string;
        address?: string;
        medicalRecordNo?: string;
        careRequirements?: string;
    };
    staff?: {
        id: string;
        fullName?: string;
        user?: {
            name?: string;
            email?: string;
        };
        designation?: string;
        mobile?: string;
    };
    allocation?: {
        id: string;
        type?: string;
        startDate?: string;
        endDate?: string | null;
        serviceRequirements?: string;
    };
    operationalTasks?: Array<{
        id: string;
        refNo?: string;
        title: string;
        status: string;
        dueDate?: string;
        completedAt?: string;
    }>;
}

export interface MyShiftResponse {
    staff?: {
        id: string;
        name?: string;
        designation?: string;
    };
    todayDate?: string;
    assignments: MedicalAssignmentItem[];
    tasks: Array<{
        id: string;
        refNo?: string;
        title: string;
        description?: string;
        type?: string;
        status: string;
        dueDate?: string;
        completedAt?: string;
        remarks?: string;
        enquiryId?: string;
    }>;
}

export const rosterApi = {
    async getManagerAssignments(): Promise<MedicalAssignmentItem[]> {
        try {
            const res = await api.get('/medical/assignments?homeCare=true');
            const data = res.data?.data || res.data || [];
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching manager assignments:', error);
            return [];
        }
    },

    async getScheduledTasks() {
        try {
            const res = await api.get('/tasks?type=SCHEDULED&homeCare=true');
            const data = res.data?.data || res.data || [];
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching scheduled tasks:', error);
            return [];
        }
    },

    async getHomeCareAllocations() {
        try {
            const res = await api.get('/allocation/home-care');
            const data = res.data?.data || res.data || [];
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching home care allocations:', error);
            return [];
        }
    },

    async getMyShift(): Promise<MyShiftResponse> {
        try {
            const res = await api.get('/medical/my-shift');
            const data = res.data?.data || res.data || {};
            return {
                staff: data.staff || undefined,
                todayDate: data.todayDate || new Date().toISOString(),
                assignments: Array.isArray(data.assignments) ? data.assignments : [],
                tasks: Array.isArray(data.tasks) ? data.tasks : []
            };
        } catch (error) {
            console.error('Error fetching my shift:', error);
            return { assignments: [], tasks: [] };
        }
    }
};
