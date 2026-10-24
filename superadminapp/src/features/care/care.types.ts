export type AssignmentStatus =
    | 'PENDING'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'ON_HOLD'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'WAITING_APPROVAL'
    | 'APPROVED';

export type AssignmentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ChecklistCategory = 'vitals' | 'medication' | 'adl' | 'nutrition';
export type ChecklistState = 'NOT_REVIEWED' | 'COMPLETED' | 'NOT_APPLICABLE';

export interface DailyCareChecklist {
    vitals?: ChecklistState;
    medication?: ChecklistState;
    adl?: ChecklistState;
    nutrition?: ChecklistState;
    [key: string]: ChecklistState | undefined;
}

export interface MedicalStaff {
    id: string;
    userId?: string | null;
    empId?: string | null;
    firstName?: string;
    lastName?: string;
    designation?: string | null;
    department?: string | null;
    unitId?: string | null;
    capacity?: number | null;
    currentWorkload?: number | null;
    phone?: string | null;
    email?: string | null;
    isAvailable?: boolean;
    status?: string | null;
    shiftStart?: string | null;
    shiftEnd?: string | null;
    user?: {
        id: string;
        email: string;
        isActive?: boolean;
        role?: { name: string };
    } | null;
}

export interface CarePatient {
    id: string;
    name: string;
    elderId?: string | null;
    unitId?: string | null;
    age?: number | null;
    gender?: string | null;
    room?: string | null;
    bed?: string | null;
    bloodGroup?: string | null;
    phone?: string | null;
    emergencyContact?: string | null;
    admittedAt?: string | null;
    admissionId?: string | null;
}

export interface MedicalAssignment {
    id: string;
    refNo?: string | null;
    tenantId: string;
    unitId: string;
    staffId: string;
    patientId?: string | null;
    admissionId?: string | null;
    enquiryId?: string | null;
    taskId?: string | null;
    allocationId?: string | null;
    dutyType: string;
    role?: string | null;
    location?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    status: AssignmentStatus;
    priority: AssignmentPriority;
    notes?: string | null;
    metadata?: {
        dailyCareChecklist?: DailyCareChecklist;
        verificationNotes?: string;
        completionNotes?: string;
        [key: string]: unknown;
    } | null;
    staff?: {
        id: string;
        firstName?: string;
        lastName?: string;
        designation?: string;
        department?: string;
    } | null;
    patient?: {
        id: string;
        name?: string;
        elderId?: string;
        unitId?: string;
    } | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAssignmentPayload {
    staffId: string;
    patientId?: string;
    admissionId?: string;
    dutyType: string;
    role?: string;
    location?: string;
    startAt?: string;
    endAt?: string;
    status?: AssignmentStatus;
    priority?: AssignmentPriority;
    notes?: string;
    unitId?: string;
}

export interface VitalRecord {
    id: string;
    patientId: string;
    systolic?: number | null;
    diastolic?: number | null;
    bp?: string | null;
    pulse?: number | null;
    temperature?: number | null;
    temp?: number | null;
    spo2?: number | null;
    spO2?: number | null;
    bloodSugar?: number | string | null;
    isFasting?: boolean;
    notes?: string | null;
    photoUrl?: string | null;
    isVerified?: boolean;
    verifiedBy?: string | null;
    verifiedAt?: string | null;
    createdAt?: string;
    recordedAt?: string;
    patient?: {
        id: string;
        name: string;
        elderId?: string;
    };
}

export interface CreateVitalPayload {
    patientId: string;
    systolic?: number | null;
    diastolic?: number | null;
    pulse?: number | null;
    temperature?: number | null;
    spo2?: number | null;
    bloodSugar?: number | null;
    isFasting?: boolean;
    notes?: string;
    photoUrl?: string | null;
    unitId?: string;
    assignmentId?: string;
}

export interface CaregiverVitalChart {
    id: string;
    patientId: string;
    date: string;
    time?: string;
    vitalType: string;
    value: string | number;
    notes?: string | null;
    unitId?: string | null;
}

export interface MonitoringStatusItem {
    patientId: string;
    patientName: string;
    elderId?: string;
    monitoringStatus: 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL';
    lastRecordedAt?: string;
    vitalsSummary?: string;
    openAttentionCount: number;
}

export interface CaregiverRevenueItem {
    key: string;
    label: string;
    category?: string | null;
    unit?: string;
    rate: number;
    days: Record<string, number>;
}

export interface CaregiverRevenueSheet {
    id?: string;
    allocationId?: string | null;
    patientId?: string | null;
    patientName: string;
    clientName?: string | null;
    month: string;
    items: CaregiverRevenueItem[];
    signatures?: {
        caregiverDay?: string;
        caregiverNight?: string;
        nurse?: string;
        manager?: string;
    } | null;
    totalAmount: number;
    status: string;
    tenantId?: string;
    unitId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AttentionLog {
    id: string;
    patientId: string;
    patientName?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category?: string;
    message: string;
    status: 'OPEN' | 'RESOLVED';
    createdAt: string;
    resolvedAt?: string | null;
    resolvedBy?: string | null;
    resolutionNotes?: string | null;
}

export interface MedicationSchedule {
    id: string;
    patientId: string;
    medicineName: string;
    dosage?: string;
    frequency?: string;
    route?: string;
    instructions?: string;
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
    night?: boolean;
    startDate?: string;
    endDate?: string;
    status?: string;
}

export interface MedicationLog {
    id: string;
    patientId: string;
    prescriptionId?: string | null;
    medicineName: string;
    dosage?: string;
    slot: string;
    administeredAt: string;
    administeredBy?: string | null;
    isVerified?: boolean;
    verifiedBy?: string | null;
    remarks?: string | null;
    patient?: {
        id: string;
        name: string;
    };
}

export interface ADLRecord {
    id: string;
    patientId: string;
    activityType?: string;
    activityCategory?: string;
    mobility?: string;
    hygiene?: string;
    feeding?: string;
    status: 'INDEPENDENT' | 'ASSISTANCE_REQUIRED' | 'DEPENDENT' | 'COMPLETED' | 'ASSIGNED' | 'VERIFIED' | 'REFUSED' | 'MISSED' | string;
    notes?: string | null;
    careDate?: string;
    scheduledDate?: string;
    createdAt?: string;
    patient?: {
        id: string;
        name: string;
    };
}

export interface NutritionPlan {
    id: string;
    patientId: string;
    dietType: string;
    calories?: number | null;
    waterIntakeTarget?: number | null;
    restrictions?: string | null;
    notes?: string | null;
}

export interface NutritionRecord {
    id: string;
    patientId: string;
    careDate?: string;
    meal?: string;
    mealType?: 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER' | string;
    status?: string;
    remarks?: string | null;
    consumedPercentage?: number;
    fluidsMl?: number;
    notes?: string | null;
    createdAt?: string;
    recordedAt?: string;
    recordedByName?: string;
}

export interface IncidentReport {
    id: string;
    refNo?: string;
    patientId?: string;
    patientName?: string;
    title?: string;
    incidentType?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
    description: string;
    actionTaken?: string;
    witnesses?: string;
    status?: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'OPEN' | 'CLOSED' | string;
    date?: string;
    reportedAt?: string;
    reportedBy?: string;
}

export interface StockIssueRequest {
    id: string;
    requestNumber?: string;
    patientId?: string;
    patientName?: string;
    productName: string;
    quantity: number;
    status: 'PENDING' | 'APPROVED' | 'ISSUED' | 'REJECTED';
    notes?: string;
    requestedAt?: string;
}

export interface MedicalDashboardSummary {
    activeStaffCount: number;
    totalAssignments: number;
    inProgressCount: number;
    waitingApprovalCount: number;
    approvedCount: number;
    criticalAlertsCount: number;
}
