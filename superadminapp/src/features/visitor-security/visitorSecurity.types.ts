// Visitor and Security Domain TypeScript Interfaces

export interface VisitorProfile {
    id: string;
    tenantId: string;
    mobile: string;
    name?: string;
    category?: string;
    company?: string;
    photoUrl?: string;
    email?: string;
    bloodGroup?: string;
    addressFlat?: string;
    addressBuilding?: string;
    addressStreet?: string;
    addressLocality?: string;
    addressCity?: string;
    addressState?: string;
    residentialAddress?: string;
    pincode?: string;
    specialization?: string;
    whatsapp?: string;
    dob?: string;
}

export interface VisitorPass {
    id: string;
    passNumber?: string | null;
    tenantId: string;
    unitId?: string;
    visitorId: string;
    passType: string;
    purpose?: string;
    department?: string;
    hostName?: string;
    hostMobile?: string;
    vehicleNo?: string;
    materialDetails?: string;
    status: string;
    checkInAt?: string;
    expectedAt?: string;
    checkOutAt?: string;
    recordedBy?: string;
    approvedByUserId?: string;
    createdAt: string;
    updatedAt: string;
    visitor?: VisitorProfile;
    approvedByUser?: {
        firstName?: string;
        lastName?: string;
        staff?: {
            empId?: string;
            designation?: string;
        };
    };
}

export interface GateEntry {
    id: string;
    entryType: string;
    visitorName: string;
    photoUrl?: string;
    category?: string;
    mobile: string;
    purpose: string;
    visitingPerson?: string;
    department?: string;
    vehicleNo?: string;
    vehicleType?: string;
    driverName?: string;
    driverMobile?: string;
    staffName?: string;
    empId?: string;
    designation?: string;
    companyName?: string;
    materialDetails?: string;
    remarks?: string;
    expectedAt?: string | null;
    arrivalRemarks?: string;
    checkoutRemarks?: string;
    status: string;
    checkInAt?: string;
    checkOutAt?: string | null;
    expectedReturnAt?: string | null;
    exitRecordedBy?: string;
    returnRecordedBy?: string;
    recordedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface HourlyData {
    hour: string;
    count: number;
}

export interface PassAnalytics {
    totalVisitorsToday: number;
    pendingPasses: number;
    approvedPasses: number;
    guestCount: number;
    vendorCount: number;
    otherCount: number;
    hourlyData: HourlyData[];
    currentlyInside: number;
    completedToday: number;
    recentVisitors: VisitorPass[];
}

export interface SecurityDashboardSummary {
    activeVisitors: number;
    activeStaff: number;
    activeVehicles: number;
    activeOutings: number;
}

export interface ResidentOuting {
    id: string;
    patientId: string;
    patient?: {
        id: string;
        name: string;
        elderId?: string | null;
    };
    reason: string;
    destination: string;
    expectedExitAt: string;
    expectedReturnAt: string;
    companionType: string;
    companionName?: string | null;
    status: string;
    displayStatus?: string;
    isOverdue?: boolean;
    movements?: {
        id: string;
        status: string;
        exitAt: string | null;
        actualReturnAt: string | null;
    }[];
}

export interface VehicleMovement {
    id: string;
    vehicleNo: string;
    vehicleType?: string;
    driverName: string;
    driverMobile?: string;
    purpose: string;
    companyName?: string;
    materialDetails?: string;
    status: string;
    entryAt: string;
    exitAt?: string | null;
    remarks?: string;
}

export interface StaffGateTrip {
    id: string;
    movementId: string;
    exitAt: string;
    returnAt: string | null;
    reason: string;
    expectedReturnAt: string | null;
    status: string;
}

export interface StaffDailyMovement {
    id: string;
    staffId: string;
    entryAt: string;
    finalExitAt: string | null;
    status: string;
    staff?: {
        id: string;
        empId: string;
        firstName: string;
        lastName: string;
        department?: string;
        designation?: string;
    };
    trips?: StaffGateTrip[];
}

export interface CreateVisitorPassPayload {
    mobile: string;
    name: string;
    category?: string;
    company?: string;
    email?: string;
    bloodGroup?: string;
    residentialAddress?: string;
    pincode?: string;
    whatsapp?: string;
    purpose: string;
    hostName: string;
    department?: string;
    vehicleNo?: string;
    materialDetails?: string;
    expectedAt?: string;
}

export interface CreateVehicleEntryPayload {
    vehicleNo: string;
    vehicleType?: string;
    driverName: string;
    driverMobile?: string;
    purpose: string;
    companyName?: string;
    materialDetails?: string;
    remarks?: string;
}

export interface CreateExpectedVisitorPayload {
    visitorName: string;
    mobile: string;
    purpose: string;
    visitingPerson?: string;
    department?: string;
    vehicleNo?: string;
    remarks?: string;
    expectedAt?: string;
}
