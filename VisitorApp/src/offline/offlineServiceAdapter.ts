import api from '../lib/axios';
import { enqueueOfflineMutation } from './idb';
import { useAuthStore } from '../store/authStore';

export const offlineServiceAdapter = {
  // 1. Vehicle Entry Recording
  recordVehicleEntry: async (payload: any): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.post('/security/vehicle-movements/entry', payload);
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'VEHICLE_ENTRY',
      endpoint: '/security/vehicle-movements/entry',
      method: 'POST',
      payload,
      unitId: activeUnitId,
      description: `Vehicle Entry: ${payload.vehicleNo}`
    });

    return {
      id: `opt_veh_${Date.now()}`,
      vehicleNo: payload.vehicleNo,
      vehicleType: payload.vehicleType || 'Car',
      driverName: payload.driverName,
      purpose: payload.purpose,
      status: 'INSIDE',
      entryAt: new Date().toISOString(),
      isOfflineQueued: true
    };
  },

  // 2. Vehicle Exit Recording
  recordVehicleExit: async (id: string): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.post(`/security/vehicle-movements/${id}/exit`);
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'VEHICLE_EXIT',
      endpoint: `/security/vehicle-movements/${id}/exit`,
      method: 'POST',
      payload: {},
      unitId: activeUnitId,
      description: `Vehicle Exit (ID: ${id.slice(0, 8)})`
    });

    return {
      id,
      status: 'COMPLETED',
      exitAt: new Date().toISOString(),
      isOfflineQueued: true
    };
  },

  // 3. Staff Entry Recording
  recordStaffEntry: async (staffId: string): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.post('/security/staff-movements/entry', { staffId });
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'STAFF_ENTRY',
      endpoint: '/security/staff-movements/entry',
      method: 'POST',
      payload: { staffId },
      unitId: activeUnitId,
      description: `Staff Initial Entry`
    });

    return {
      id: `opt_staff_${Date.now()}`,
      staffId,
      status: 'INSIDE',
      entryAt: new Date().toISOString(),
      trips: [],
      isOfflineQueued: true
    };
  },

  // 4. Staff Temp Exit Recording
  recordStaffTempExit: async (id: string, payload: any): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.post(`/security/staff-movements/${id}/temp-exit`, payload);
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'STAFF_TEMP_EXIT',
      endpoint: `/security/staff-movements/${id}/temp-exit`,
      method: 'POST',
      payload,
      unitId: activeUnitId,
      description: `Staff Temp Exit: ${payload.reason || 'Official'}`
    });

    return {
      id,
      status: 'OUTSIDE',
      isOfflineQueued: true
    };
  },

  // 5. Staff Return Recording
  recordStaffReturn: async (id: string, tripId: string): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.post(`/security/staff-movements/${id}/return`, { tripId });
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'STAFF_RETURN',
      endpoint: `/security/staff-movements/${id}/return`,
      method: 'POST',
      payload: { tripId },
      unitId: activeUnitId,
      description: `Staff Return from Temp Exit`
    });

    return {
      id,
      status: 'INSIDE',
      isOfflineQueued: true
    };
  },

  // 6. Staff Final Exit Recording
  recordStaffFinalExit: async (id: string): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.post(`/security/staff-movements/${id}/final-exit`);
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'STAFF_FINAL_EXIT',
      endpoint: `/security/staff-movements/${id}/final-exit`,
      method: 'POST',
      payload: {},
      unitId: activeUnitId,
      description: `Staff Final Exit`
    });

    return {
      id,
      status: 'COMPLETED',
      exitAt: new Date().toISOString(),
      isOfflineQueued: true
    };
  },

  // 7. Gate Visitor Checkout
  checkoutGateEntry: async (id: string, remarks?: string): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.patch(`/security/gate-entries/${id}/checkout`, { remarks });
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'GATE_ENTRY_CHECKOUT',
      endpoint: `/security/gate-entries/${id}/checkout`,
      method: 'PATCH',
      payload: { remarks },
      unitId: activeUnitId,
      description: `Visitor Check-Out (ID: ${id.slice(0, 8)})`
    });

    return {
      id,
      status: 'Checked Out',
      checkOutAt: new Date().toISOString(),
      isOfflineQueued: true
    };
  },

  // 8. Expected Visitor Check-In
  checkInExpectedVisitor: async (id: string, remarks?: string): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.patch(`/security/expected-visitors/${id}/check-in`, { remarks });
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'EXPECTED_VISITOR_CHECK_IN',
      endpoint: `/security/expected-visitors/${id}/check-in`,
      method: 'PATCH',
      payload: { remarks },
      unitId: activeUnitId,
      description: `Expected Visitor Check-In`
    });

    return {
      id,
      status: 'Checked In',
      checkInAt: new Date().toISOString(),
      isOfflineQueued: true
    };
  },

  // 9. Resident Outing Exit & Return
  recordResidentExit: async (id: string): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.post(`/security/resident-outings/${id}/exit`);
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'RESIDENT_OUTING_EXIT',
      endpoint: `/security/resident-outings/${id}/exit`,
      method: 'POST',
      payload: {},
      unitId: activeUnitId,
      description: `Resident Outing Gate Exit`
    });

    return { id, displayStatus: 'OUTSIDE', isOfflineQueued: true };
  },

  recordResidentReturn: async (id: string): Promise<any> => {
    if (navigator.onLine) {
      const response = await api.post(`/security/resident-outings/${id}/return`);
      return response.data?.data;
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    await enqueueOfflineMutation({
      operationType: 'RESIDENT_OUTING_RETURN',
      endpoint: `/security/resident-outings/${id}/return`,
      method: 'POST',
      payload: {},
      unitId: activeUnitId,
      description: `Resident Outing Gate Return`
    });

    return { id, displayStatus: 'RETURNED', isOfflineQueued: true };
  }
};
