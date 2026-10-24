export interface PatientPortalAccount {
    id: string;
    name: string;
    patientId: string;
}

export interface PatientPortalSession {
    token: string;
    account: PatientPortalAccount;
}

export interface VitalSign {
    id: string;
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    sugarLevel: number;
    recordedAt: string;
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    createdAt: string;
}

export interface Nutrition {
    id: string;
    mealType: string;
    items: string;
    date: string;
}

export interface Invoice {
    id: string;
    invoiceNo: string;
    amount: number;
    status: string;
    createdAt: string;
}
