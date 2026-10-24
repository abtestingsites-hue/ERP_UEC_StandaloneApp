import api from '../../../lib/axios';
import { offlineServiceAdapter } from '../../../offline/offlineServiceAdapter';
import type { 
    CreateVehicleEntryPayload, 
    GateEntry, 
    ResidentOuting, 
    StaffDailyMovement, 
    StaffTempExitPayload, 
    VehicleMovement 
} from '../types';

export const securityService = {
    getGateQueue: async (): Promise<GateEntry[]> => {
        const response = await api.get('/security/gate-queue');
        return response.data?.data || [];
    },

    getDashboardActionQueue: async (): Promise<GateEntry[]> => {
        const response = await api.get('/security/dashboard/action-queue');
        return response.data?.data || [];
    },

    getDailyMovementReport: async (date: string): Promise<GateEntry[]> => {
        const response = await api.get('/security/reports/daily-movement', { params: { date } });
        return response.data?.data || [];
    },

    checkInExpectedVisitor: async ({ id, remarks }: { id: string; remarks?: string }): Promise<GateEntry> => {
        return offlineServiceAdapter.checkInExpectedVisitor(id, remarks);
    },

    checkoutGateEntry: async ({ id, remarks }: { id: string; remarks?: string }): Promise<GateEntry> => {
        return offlineServiceAdapter.checkoutGateEntry(id, remarks);
    },

    getResidentOutings: async (): Promise<ResidentOuting[]> => {
        const response = await api.get('/security/resident-outings');
        return response.data?.data || [];
    },

    recordResidentExit: async (id: string): Promise<any> => {
        return offlineServiceAdapter.recordResidentExit(id);
    },

    recordResidentReturn: async (id: string): Promise<any> => {
        return offlineServiceAdapter.recordResidentReturn(id);
    },

    createResidentOuting: async (payload: Partial<ResidentOuting>): Promise<ResidentOuting> => {
        const response = await api.post('/security/resident-outings', payload);
        return response.data?.data;
    },

    getStaffMovements: async (params?: { status?: string; date?: string; staffId?: string }): Promise<StaffDailyMovement[]> => {
        const response = await api.get('/security/staff-movements', { params });
        return response.data?.data || [];
    },

    getStaffMovementById: async (id: string): Promise<StaffDailyMovement> => {
        const response = await api.get(`/security/staff-movements/${id}`);
        return response.data?.data;
    },

    recordStaffEntry: async (staffId: string): Promise<StaffDailyMovement> => {
        return offlineServiceAdapter.recordStaffEntry(staffId);
    },

    recordStaffTempExit: async ({ id, payload }: { id: string; payload: StaffTempExitPayload }) => {
        return offlineServiceAdapter.recordStaffTempExit(id, payload);
    },

    recordStaffReturn: async ({ id, tripId }: { id: string; tripId: string }) => {
        return offlineServiceAdapter.recordStaffReturn(id, tripId);
    },

    recordStaffFinalExit: async (id: string): Promise<StaffDailyMovement> => {
        return offlineServiceAdapter.recordStaffFinalExit(id);
    },

    getVehicleMovements: async (params?: { status?: string; date?: string; vehicleNo?: string }): Promise<VehicleMovement[]> => {
        const response = await api.get('/security/vehicle-movements', { params });
        return response.data?.data || [];
    },

    getVehicleMovementById: async (id: string): Promise<VehicleMovement> => {
        const response = await api.get(`/security/vehicle-movements/${id}`);
        return response.data?.data;
    },

    recordVehicleEntry: async (payload: CreateVehicleEntryPayload): Promise<VehicleMovement> => {
        return offlineServiceAdapter.recordVehicleEntry(payload);
    },

    recordVehicleExit: async (id: string): Promise<VehicleMovement> => {
        return offlineServiceAdapter.recordVehicleExit(id);
    },

    getMovementTimeline: async (params?: { from?: string; to?: string; page?: number; limit?: number }) => {
        const response = await api.get('/security/movement-timeline', { params });
        return response.data?.data;
    },

    getSecurityDashboardSummary: async (): Promise<{ activeVisitors: number; activeStaff: number; activeVehicles: number }> => {
        const response = await api.get('/security/dashboard-summary');
        return response.data?.data;
    }
};
