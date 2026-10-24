export interface Patient {
    id: string;
    elderId?: string | null;
    name: string;
    dob?: string | null;
    age?: number | null;
    gender?: string | null;
    bloodGroup?: string | null;
    primaryContact?: string | null;
    emergencyContact?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    tenantId: string;
    unitId: string;
    createdAt: string;
    updatedAt?: string;
}

export interface AdmissionRecord {
    id: string;
    admissionNumber?: string | null;
    refNo?: string | null;
    enquiryId?: string | null;
    patientId: string;
    tenantId: string;
    unitId: string;
    status: 'ACTIVE' | 'DISCHARGED' | string;
    admissionPriority?: string | null;
    healthCondition?: string | null;
    clinicalStatus?: string | null;
    floor?: string | null;
    room?: string | null;
    bed?: string | null;
    admittedAt: string;
    dischargedAt?: string | null;
    createdAt: string;
    updatedAt?: string;
    patient?: {
        id?: string;
        name: string;
        elderId?: string | null;
        phone?: string | null;
        age?: number | null;
        gender?: string | null;
        bloodGroup?: string | null;
        emergencyContact?: string | null;
    };
    enquiry?: {
        id?: string;
        refNo?: string;
        clientName?: string;
        patientName?: string;
        serviceRequired?: string;
    } | null;
    serviceClosure?: ServiceClosure | null;
}

export interface ResidentConsentPayload {
    acknowledged: boolean;
    signedByName: string;
    signerRelation: string;
    consentType: string;
    version: string;
    title?: string;
    content?: string;
}

export interface GuardianPortalAccessPayload {
    enabled: boolean;
    guardianName: string;
    mobile: string;
    email?: string;
    password?: string;
}

export interface CreateAdmissionPayload {
    patientId: string;
    unitId: string;
    admissionPriority: string;
    healthCondition: string;
    clinicalStatus: string;
    floor?: string;
    room?: string;
    bed?: string;
    enquiryId?: string;
    consent?: ResidentConsentPayload;
    guardianPortalAccess?: GuardianPortalAccessPayload;
}

export interface CreatePatientPayload {
    name: string;
    unitId: string;
    dob?: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    primaryContact?: string;
    emergencyContact?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export interface ExistingPatientPayload {
    clientName: string;
    patientName: string;
    mobile: string;
    email?: string;
    address?: string;
    careType: string;
    admissionDate: string;
    serviceName?: string;
    serviceAmount?: number;
    roomNo?: string;
    healthCondition?: string;
    currentMedicines?: string;
    routineNotes?: string;
    openingBalance?: number;
}

export type ClosureStatus = 'IN_PROGRESS' | 'READY' | 'EXECUTED';

export interface ServiceClosure {
    id: string;
    admissionId: string;
    tenantId: string;
    unitId: string;
    status: ClosureStatus;
    medicalCleared: boolean;
    medicalClearedById?: string | null;
    medicalClearedAt?: string | null;
    financeCleared: boolean;
    financeClearedById?: string | null;
    financeClearedAt?: string | null;
    assetCleared: boolean;
    assetClearedById?: string | null;
    assetClearedAt?: string | null;
    closingRemarks?: string | null;
    createdAt: string;
    updatedAt: string;
    outstandingBalance?: number;
    admission?: AdmissionRecord;
}

export interface MasterOption {
    id: string;
    name: string;
    code?: string;
    shortName?: string;
    capacity?: number;
    floor?: string;
}
