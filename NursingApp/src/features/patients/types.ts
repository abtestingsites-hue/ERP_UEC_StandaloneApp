export interface NursingAdmission {
    id: string;
    status?: string | null;
    service?: string | null;
    admittedAt?: string | null;
    createdAt?: string;
}

export interface NursingMedication {
    id: string;
    name: string;
    dosage: string;
}

export interface NursingNutrition {
    id: string;
    calories: number;
    dietPlan: string;
}

export interface NursingPatient {
    id: string;
    name: string;
    patientAge?: string | null;
    patientGender?: string | null;
    elderId?: string | null;
    tenantId: string;
    unitId: string;
    admissions?: NursingAdmission[];
    medications?: NursingMedication[];
    nutritions?: NursingNutrition[];
    createdAt: string;
    updatedAt: string;
}
