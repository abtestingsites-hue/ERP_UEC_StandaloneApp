// TypeScript definitions for Home Care Domain (SuperAdminApp Integration)

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'COMPLETED' | 'CANCELLED';
export type AllocationStatus = 'PENDING' | 'ALLOCATED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type VisitStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type EnquiryStatus = 'Open' | 'In Progress' | 'Converted' | 'Lost' | 'Emergency' | 'Important' | 'Just Enquiry';

export interface ServiceContract {
    id: string;
    contractNumber: string;
    admissionId: string;
    tenantId: string;
    unitId: string;
    startDate: string;
    endDate?: string | null;
    status: ContractStatus;
    staffRequired?: number | null;
    shift?: string | null;
    frequency?: string | null;
    servicePrice?: number | null;
    billingCycle?: string | null;
    careRequirements?: string | Record<string, unknown> | null;
    specialInstructions?: string | null;
    termsSnapshot?: Record<string, unknown> | null;
    termsAcceptedAt?: string | null;
    termsAcceptedById?: string | null;
    termsAcceptedBy?: {
        id: string;
        firstName?: string;
        lastName?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface HomeCareAdmission {
    id: string;
    unitId: string;
    status: string;
    patientId?: string;
    enquiryId?: string;
    patient?: {
        id: string;
        name: string;
        mobile?: string;
        gender?: string;
        age?: number;
    };
    enquiry?: {
        id: string;
        refNo?: string;
        rawMessage?: string | Record<string, unknown>;
        client?: {
            id?: string;
            name?: string;
            mobile?: string;
            address?: string;
        };
        service?: {
            id?: string;
            name?: string;
            price?: number;
        };
        serviceRequirements?: {
            staffRequired?: number;
            shift?: string;
            frequency?: string;
            careRequirements?: string;
            specialInstructions?: string;
        };
    };
    serviceContract?: ServiceContract | null;
}

export interface HomeCareAllocation {
    id: string;
    unitId?: string;
    allocationRef?: string;
    refNo?: string;
    type: 'HOME_CARE';
    status: AllocationStatus;
    enquiryId?: string;
    staffId?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string | null;
    clientName?: string;
    patient?: string;
    mobile?: string;
    service?: string;
    contract?: string;
    staffName?: string;
    staff?: {
        id: string;
        firstName?: string;
        lastName?: string;
        designation?: string;
        department?: string;
        mobile?: string;
        user?: {
            name?: string;
            email?: string;
        };
    };
    enquiry?: {
        id: string;
        refNo?: string;
        rawMessage?: string | Record<string, unknown>;
        client?: {
            id?: string;
            name?: string;
            mobile?: string;
            address?: string;
        };
        service?: {
            id?: string;
            name?: string;
        };
        admission?: {
            id?: string;
            patientId?: string;
            patient?: {
                id?: string;
                name?: string;
            };
        };
    };
    admission?: {
        id?: string;
        patientId?: string;
        patient?: {
            id?: string;
            name?: string;
            phone?: string;
            age?: number;
            gender?: string;
        };
    };
    resolvedPatient?: {
        id?: string | null;
        name?: string;
        phone?: string | null;
        age?: number | null;
        gender?: string | null;
    };
    metadata?: {
        notes?: string;
        priority?: string;
        patientName?: string;
        [key: string]: unknown;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface HomeCareEnquiry {
    id: string;
    refNo?: string;
    status: EnquiryStatus | string;
    mode?: string;
    comments?: string;
    description?: string;
    client?: {
        id?: string;
        name?: string;
        mobile?: string;
        email?: string;
        address?: string;
    };
    patientName?: string;
    clientName?: string;
    mobile?: string;
    serviceRequirements?: {
        staffRequired?: number;
        shift?: string;
        frequency?: string;
        careRequirements?: string;
        specialInstructions?: string;
        patientName?: string;
        patientAge?: string;
        patientGender?: string;
        patientHealthCondition?: string;
        clientAddress?: string;
        clientLocation?: string;
    };
    rawMessage?: string | Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
}

export interface HomeCareClientItem {
    id: string;
    clientName: string;
    patientName: string;
    mobile: string;
    service: string;
    contract: string;
    staffName: string;
    staffId: string | null;
    status: string;
    type: 'ALLOCATION' | 'ADMISSION';
    raw: unknown;
}

export interface VisitTask {
    id: string;
    refNo?: string;
    title: string;
    description?: string;
    type?: string;
    status: VisitStatus | string;
    dueDate?: string;
    completedAt?: string | null;
    remarks?: string | null;
    assignedStaffId?: string;
    enquiryId?: string;
    patientId?: string;
    metadata?: {
        patientId?: string;
        notes?: string;
        [key: string]: unknown;
    };
    assignedStaff?: {
        id: string;
        fullName?: string;
        user?: { name?: string; email?: string };
    };
    enquiry?: {
        id: string;
        clientName?: string;
        client?: {
            id?: string;
            name?: string;
            mobile?: string;
            address?: string;
        };
        patientName?: string;
        mobile?: string;
        address?: string;
        careRequirements?: string;
        admission?: {
            id: string;
            patientId?: string;
            patient?: {
                id: string;
                name?: string;
            };
        };
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface CaregiverStaff {
    id: string;
    firstName: string;
    lastName?: string;
    designation?: string;
    department?: string;
    status?: string;
    mobile?: string;
    unitId?: string;
    user?: {
        id?: string;
        name?: string;
        email?: string;
    };
}

export interface SaveVitalsPayload {
    patientId: string;
    shift?: 'MORNING' | 'EVENING' | 'AFTERNOON' | 'NIGHT' | string;
    systolic?: number;
    diastolic?: number;
    pulse?: number;
    temperature?: number;
    oxygenSaturation?: number;
    bloodSugar?: number;
    isFasting?: boolean;
    notes?: string;
    unitId?: string | null;
}

export interface SaveCareNotesPayload {
    patientId: string;
    activityCategory?: string;
    activityType?: string;
    status?: string;
    notes?: string;
    careDate?: string;
    unitId?: string | null;
}

export interface CreateContractPayload {
    admissionId?: string;
    enquiryId?: string;
    startDate: string;
    endDate?: string | null;
    staffRequired?: number | null;
    shift?: string | null;
    frequency?: string | null;
    servicePrice?: number | null;
    billingCycle?: string | null;
    careRequirements?: string | Record<string, unknown> | null;
    specialInstructions?: string | null;
    unitId?: string | null;
}

export interface UpdateContractPayload {
    startDate?: string;
    endDate?: string | null;
    staffRequired?: number | null;
    shift?: string | null;
    frequency?: string | null;
    servicePrice?: number | null;
    billingCycle?: string | null;
    careRequirements?: string | Record<string, unknown> | null;
    specialInstructions?: string | null;
    status?: 'DRAFT' | 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
    amendmentReason?: string;
    reason?: string;
}

export interface CreateAllocationPayload {
    enquiryId: string;
    staffId: string;
    startDate?: string;
    endDate?: string | null;
    metadata?: Record<string, unknown>;
    unitId?: string | null;
}

export interface ServiceClosureRecord {
    id: string;
    admissionId: string;
    tenantId?: string;
    unitId?: string;
    medicalCleared: boolean;
    medicalClearedById?: string;
    medicalClearedAt?: string;
    financeCleared: boolean;
    financeClearedById?: string;
    financeClearedAt?: string;
    assetCleared: boolean;
    assetClearedById?: string;
    assetClearedAt?: string;
    status: 'IN_PROGRESS' | 'READY' | 'EXECUTED';
    closingRemarks?: string;
    outstandingBalance?: number;
}

export interface FinanceInvoiceItem {
    id: string;
    refNo: string;
    amount: number;
    status: string;
    category?: string;
    clientName?: string;
    notes?: string;
    date?: string;
    createdAt?: string;
    allocationId?: string;
}

