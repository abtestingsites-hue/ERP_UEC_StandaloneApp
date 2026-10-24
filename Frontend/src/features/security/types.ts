export type GateEntry = {
    id: string
    entryType: string
    visitorName: string
    photoUrl?: string
    category?: string
    mobile: string
    purpose: string
    visitingPerson?: string
    department?: string
    vehicleNo?: string
    vehicleType?: string
    driverName?: string
    driverMobile?: string
    staffName?: string
    empId?: string
    designation?: string
    companyName?: string
    materialDetails?: string
    remarks?: string
    expectedAt?: string | null
    arrivalRemarks?: string
    checkoutRemarks?: string
    status: string
    checkInAt?: string
    checkOutAt?: string | null
    expectedReturnAt?: string | null
    exitRecordedBy?: string
    returnRecordedBy?: string
    recordedBy?: string
    approvedBy?: {
        name?: string
        empId?: string
        designation?: string
    }
    otpVerification?: Record<string, OTPLog>
    createdAt: string
    updatedAt: string
}

export type CreateVehicleEntryPayload = {
    vehicleNo: string
    vehicleType?: string
    driverName: string
    driverMobile?: string
    purpose: string
    companyName?: string
    materialDetails?: string
    remarks?: string
}

export type CreateStaffEntryPayload = {
    staffName: string
    empId: string
    department?: string
    designation?: string
    mobile?: string
    purpose: string
    remarks?: string
}

export type CreateGateEntryPayload = {
    visitorName: string
    mobile: string
    purpose: string
    visitingPerson?: string
    department?: string
    vehicleNo?: string
    remarks?: string
    expectedAt?: string
}

export type OTPLog = {
    id: string
    mobile: string
    purpose: string
    referenceId?: string | null
    status: string
    deliveryStatus: string
    attempts: number
    expiresAt?: string | null
    verifiedAt?: string | null
    requestedBy?: string
    createdAt: string
    unitId?: string
}

export type RequestOTPPayload = {
    mobile: string
    purpose: string
    referenceId?: string
}

export type ResidentOuting = {
    id: string
    patientId: string
    patient: {
        id: string
        name: string
        elderId: string | null
    }
    reason: string
    destination: string
    expectedExitAt: string
    expectedReturnAt: string
    companionType: string
    companionStaff?: { empId: string; user: { firstName: string; lastName: string } } | null
    companionVisitorProfile?: { name: string; mobile: string } | null
    materials?: any
    status: string
    displayStatus: string
    isOverdue: boolean
    movements: {
        id: string
        status: string
        exitAt: string | null
        actualReturnAt: string | null
    }[]
}

export type StaffGateTrip = {
    id: string
    movementId: string
    exitAt: string
    returnAt: string | null
    reason: string
    expectedReturnAt: string | null
    companionType: string | null
    companionStaffId: string | null
    companionVisitorProfileId: string | null
    companionName: string | null
    companionPhone: string | null
    companionRelation: string | null
    materials: any | null
    status: string
    exitRecordedByUser?: { firstName: string; lastName: string; email: string; staff?: { empId: string; designation: string } }
    returnRecordedByUser?: { firstName: string; lastName: string; email: string; staff?: { empId: string; designation: string } }
}

export type StaffDailyMovement = {
    id: string
    staffId: string
    entryAt: string
    finalExitAt: string | null
    status: string
    staff?: {
        id: string
        empId: string
        firstName: string
        lastName: string
        department: string
        designation: string
    }
    entryRecordedByUser?: { firstName: string; lastName: string; email: string; staff?: { empId: string; designation: string } }
    finalExitRecordedByUser?: { firstName: string; lastName: string; email: string; staff?: { empId: string; designation: string } }
    trips: StaffGateTrip[]
}

export type StaffTempExitPayload = {
    reason: string
    expectedReturnAt?: string | null
    companionType?: string | null
    companionStaffId?: string | null
    companionVisitorProfileId?: string | null
    companionName?: string | null
    companionPhone?: string | null
    companionRelation?: string | null
    materials?: any | null
}

export type VehicleMovementStatus = 'INSIDE' | 'COMPLETED'

export type VehicleMovement = {
    id: string
    tenantId?: string
    unitId?: string
    vehicleNo: string
    vehicleType?: string | null
    driverName: string
    driverMobile?: string | null
    companyName?: string | null
    purpose: string
    materialDetails?: string | null
    remarks?: string | null
    entryAt: string
    exitAt?: string | null
    status: VehicleMovementStatus
    entryUser?: { firstName: string; lastName: string; email: string; staff?: { empId: string; designation: string } }
    exitUser?: { firstName: string; lastName: string; email: string; staff?: { empId: string; designation: string } }
    createdAt: string
    updatedAt: string
}

export type UnifiedEntryEvent = {
    id: string;
    sourceType: 'STAFF' | 'VEHICLE';
    eventType:
        | 'STAFF_ENTRY'
        | 'TEMP_EXIT'
        | 'STAFF_RETURN'
        | 'STAFF_FINAL_EXIT'
        | 'VEHICLE_ENTRY'
        | 'VEHICLE_EXIT';

    sourceId: string;
    tripId?: string | null;
    timestamp: string;

    staff?: {
        id: string;
        empId: string;
        name: string;
        designation?: string | null;
        department?: string | null;
    } | null;

    vehicle?: {
        id: string;
        vehicleNo: string;
        vehicleType?: string | null;
        driverName?: string | null;
        companyName?: string | null;
    } | null;

    tripDetails?: {
        reason?: string | null;
        expectedReturnAt?: string | null;
        materials?: any;
        companion?: any;
    } | null;

    actor?: {
        id?: string;
        name?: string | null;
        email?: string | null;
        empId?: string | null;
        designation?: string | null;
    } | null;
};
