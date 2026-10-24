import { api } from '../../services/api';
import type {
    VisitorProfile,
    VisitorPass,
    GateEntry,
    PassAnalytics,
    SecurityDashboardSummary,
    ResidentOuting,
    VehicleMovement,
    StaffDailyMovement,
    StaffGateTrip,
    CreateVisitorPassPayload,
    CreateVehicleEntryPayload,
    CreateExpectedVisitorPayload
} from './visitorSecurity.types';

export const visitorSecurityService = {
    // --- 1. Visitor Profile & Intake ---
    getProfile: async (mobile: string, unitId?: string | null): Promise<VisitorProfile | null> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const res = await api.get<{ success: boolean; data: VisitorProfile | null }>(
                `/visitor/profile/${encodeURIComponent(mobile)}`,
                { headers }
            );
            return res.data?.data || null;
        } catch {
            return null;
        }
    },

    requestOtp: async (mobile: string, unitId?: string | null): Promise<{ referenceId: string }> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: { referenceId: string } }>(
            '/visitor/otp/request',
            { mobile },
            { headers }
        );
        return res.data?.data || { referenceId: `otp_ref_${Date.now()}` };
    },

    verifyOtp: async (referenceId: string, otp: string, unitId?: string | null): Promise<boolean> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean }>(
            '/visitor/otp/verify',
            { referenceId, otp },
            { headers }
        );
        return Boolean(res.data?.success);
    },

    // --- 2. Visitor Passes & Lifecycle ---
    createPass: async (payload: CreateVisitorPassPayload, unitId?: string | null): Promise<{ profile: VisitorProfile; pass: VisitorPass }> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: { profile: VisitorProfile; pass: VisitorPass } }>(
            '/visitor/pass',
            payload,
            { headers }
        );
        return res.data?.data;
    },

    getPasses: async (unitId?: string | null): Promise<VisitorPass[]> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: VisitorPass[] }>(
            '/visitor/passes',
            { headers }
        );
        return res.data?.data || [];
    },

    checkoutPass: async (id: string, unitId?: string | null): Promise<VisitorPass> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.patch<{ success: boolean; data: VisitorPass }>(
            `/visitor/pass/${id}/checkout`,
            {},
            { headers }
        );
        return res.data?.data;
    },

    getAnalytics: async (unitId?: string | null): Promise<PassAnalytics> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: PassAnalytics }>(
            '/visitor/analytics',
            { headers }
        );
        return res.data?.data || {
            totalVisitorsToday: 0,
            pendingPasses: 0,
            approvedPasses: 0,
            guestCount: 0,
            vendorCount: 0,
            otherCount: 0,
            hourlyData: [],
            currentlyInside: 0,
            completedToday: 0,
            recentVisitors: []
        };
    },

    // --- 3. Security Gate & Queues ---
    getGateQueue: async (unitId?: string | null): Promise<GateEntry[]> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: GateEntry[] }>(
            '/security/gate-queue',
            { headers }
        );
        return res.data?.data || [];
    },

    getDashboardActionQueue: async (unitId?: string | null): Promise<GateEntry[]> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: GateEntry[] }>(
            '/security/dashboard/action-queue',
            { headers }
        );
        return res.data?.data || [];
    },

    getDashboardSummary: async (unitId?: string | null): Promise<SecurityDashboardSummary> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const res = await api.get<{ success: boolean; data: SecurityDashboardSummary }>(
                '/security/dashboard-summary',
                { headers }
            );
            return res.data?.data || { activeVisitors: 0, activeStaff: 0, activeVehicles: 0, activeOutings: 0 };
        } catch {
            return { activeVisitors: 0, activeStaff: 0, activeVehicles: 0, activeOutings: 0 };
        }
    },

    checkInExpectedVisitor: async (id: string, remarks?: string, unitId?: string | null): Promise<GateEntry> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.patch<{ success: boolean; data: GateEntry }>(
            `/security/expected-visitors/${id}/check-in`,
            { remarks },
            { headers }
        );
        return res.data?.data;
    },

    checkoutGateEntry: async (id: string, remarks?: string, unitId?: string | null): Promise<GateEntry> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.patch<{ success: boolean; data: GateEntry }>(
            `/security/gate-entries/${id}/checkout`,
            { remarks },
            { headers }
        );
        return res.data?.data;
    },

    createExpectedVisitor: async (payload: CreateExpectedVisitorPayload, unitId?: string | null): Promise<GateEntry> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: GateEntry }>(
            '/security/expected-visitors',
            payload,
            { headers }
        );
        return res.data?.data;
    },

    // --- 4. Vehicles & Staff & Outings ---
    getVehicleMovements: async (unitId?: string | null): Promise<VehicleMovement[]> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: VehicleMovement[] }>(
            '/security/vehicle-movements',
            { headers }
        );
        return res.data?.data || [];
    },

    recordVehicleEntry: async (payload: CreateVehicleEntryPayload, unitId?: string | null): Promise<VehicleMovement> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: VehicleMovement }>(
            '/security/vehicle-entries',
            payload,
            { headers }
        );
        return res.data?.data;
    },

    recordVehicleExit: async (id: string, unitId?: string | null): Promise<VehicleMovement> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: VehicleMovement }>(
            `/security/vehicle-movements/${id}/exit`,
            {},
            { headers }
        );
        return res.data?.data;
    },

    getStaffMovements: async (unitId?: string | null): Promise<StaffDailyMovement[]> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: StaffDailyMovement[] }>(
            '/security/staff-movements',
            { headers }
        );
        return res.data?.data || [];
    },

    recordStaffEntry: async (payload: { staffId: string }, unitId?: string | null): Promise<StaffDailyMovement> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: StaffDailyMovement }>(
            '/security/staff-movements/entry',
            payload,
            { headers }
        );
        return res.data?.data;
    },

    recordStaffTempExit: async (
        movementId: string,
        payload: {
            reason: string;
            expectedReturnAt?: string | null;
            materials?: any;
            companionType?: string | null;
            companionStaffId?: string | null;
            companionName?: string | null;
            companionPhone?: string | null;
        },
        unitId?: string | null
    ): Promise<StaffGateTrip> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: StaffGateTrip }>(
            `/security/staff-movements/${movementId}/temp-exit`,
            payload,
            { headers }
        );
        return res.data?.data;
    },

    recordStaffTempReturn: async (
        movementId: string,
        tripId: string,
        unitId?: string | null
    ): Promise<StaffGateTrip> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: StaffGateTrip }>(
            `/security/staff-movements/${movementId}/return`,
            { tripId },
            { headers }
        );
        return res.data?.data;
    },

    recordStaffFinalExit: async (movementId: string, unitId?: string | null): Promise<StaffDailyMovement> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: StaffDailyMovement }>(
            `/security/staff-movements/${movementId}/final-exit`,
            {},
            { headers }
        );
        return res.data?.data;
    },

    getStaffList: async (unitId?: string | null): Promise<Array<{
        id: string;
        empId?: string;
        firstName: string;
        lastName?: string;
        department?: string;
        designation?: string;
    }>> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const res = await api.get<{
                success: boolean;
                data: Array<{
                    id: string;
                    empId?: string;
                    firstName: string;
                    lastName?: string;
                    department?: string;
                    designation?: string;
                }>;
            }>('/hr/staff?scope=all', { headers });
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    getResidentOutings: async (unitId?: string | null): Promise<ResidentOuting[]> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: ResidentOuting[] }>(
            '/security/resident-outings',
            { headers }
        );
        return res.data?.data || [];
    },

    createResidentOuting: async (payload: {
        patientId: string;
        reason: string;
        destination: string;
        expectedReturnAt: string;
        companionType?: string;
        companionStaffId?: string;
        companionName?: string;
        companionPhone?: string;
        companionRelation?: string;
        materials?: string;
    }, unitId?: string | null): Promise<ResidentOuting> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: ResidentOuting }>(
            '/security/resident-outings',
            payload,
            { headers }
        );
        return res.data?.data;
    },

    getResidents: async (unitId?: string | null): Promise<Array<{ id: string; name: string; elderId?: string }>> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const res = await api.get<{ success: boolean; data: Array<{ id: string; name: string; elderId?: string }> }>(
                '/operations/patients',
                { headers }
            );
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    recordResidentReturn: async (id: string, unitId?: string | null): Promise<unknown> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: unknown }>(
            `/security/resident-outings/${id}/return`,
            {},
            { headers }
        );
        return res.data?.data;
    },

    getDailyMovementReport: async (date: string, unitId?: string | null): Promise<GateEntry[]> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: GateEntry[] }>(
            '/security/reports/daily-movement',
            { params: { date }, headers }
        );
        return res.data?.data || [];
    }
};
