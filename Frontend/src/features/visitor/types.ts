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
    pincode?: string;
    specialization?: string;
    whatsapp?: string;
    dob?: string;
}

export interface VisitorPass {
    id: string;
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

export interface OTPResponse {
    referenceId: string;
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
