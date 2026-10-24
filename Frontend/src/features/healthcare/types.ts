export interface MedicationSchedule {
    id: string
    medicineIssueId: string
    medicineName: string
    patientName: string
    dose: string
    frequency: string
    times: string[]
    startDate: string
    notes?: string
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
    administeredSlots: string[]
    administeredHistory?: Array<{
        slot: string
        remarks?: string
        administeredBy?: string
        administeredAt?: string
    }>
    createdAt: string
    updatedAt: string
}

export interface CreateMedicationSchedulePayload {
    medicineIssueId: string
    medicineName: string
    patientName: string
    dose: string
    frequency: string
    times: string[]
    startDate: string
    notes?: string
}

export interface AdministerMedicationDosePayload {
    id: string
    slot: string
    remarks?: string
}

export interface HealthcareAdmission {
    id: string
    enquiryId?: string | null
    status?: string | null
    service?: string | null
    admittedAt?: string | null
    enquiry?: {
        rawMessage?: string | null
        patientName?: string | null
        patientAge?: string | null
        patientGender?: string | null
        service?: {
            name?: string | null
        } | null
    } | null
    createdAt?: string
}

export interface HealthcareMedication {
    id: string
    name: string
    dosage: string
    createdAt: string
    updatedAt: string
}

export interface HealthcareNutrition {
    id: string
    patientId: string
    calories: number
    dietPlan: string
    patient?: HealthcarePatient
    createdAt: string
    updatedAt: string
}

export interface AdlRecord {
    id: string
    patientId: string
    patient?: HealthcarePatient | null
    mobility: string
    hygiene: string
    feeding: string
    notes?: string
    status: 'RECORDED' | 'NEEDS_SUPPORT' | 'COMPLETED'
    recordedBy?: string
    tenantId: string
    unitId: string
    createdAt: string
    updatedAt: string
}

export interface HealthcarePatient {
    id: string
    name: string
    patientAge?: string | null
    patientGender?: string | null
    tenantId: string
    unitId: string
    admissions?: HealthcareAdmission[]
    medications?: HealthcareMedication[]
    nutritions?: HealthcareNutrition[]
    createdAt: string
    updatedAt: string
}

export interface VitalSign {
    id: string
    patientId: string
    bp?: string | null
    pulse?: number | null
    temp?: number | null
    spO2?: number | null
    notes?: string | null
    recordedById: string
    tenantId: string
    unitId: string
    createdAt: string
    updatedAt: string
}

export interface CreatePatientPayload {
    name: string
}

export interface CreateVitalSignPayload {
    patientId: string
    bp?: string
    pulse?: number
    temp?: number
    spO2?: number
    notes?: string
}

export interface CaregiverVitalEntry {
    day: number
    tempMor?: string
    tempEve?: string
    bpMor?: string
    bpEve?: string
    pulseMor?: string
    pulseEve?: string
    spo2Mor?: string
    spo2Eve?: string
    rrMor?: string
    rrEve?: string
    glucoseBf?: string
    glucoseAf?: string
    weight?: string
    intakeBf?: string
    intakeLunch?: string
    intakeDinner?: string
    urine?: string
    stool?: string
    sign?: string
    remarks?: string
}

export interface CaregiverVitalChart {
    id: string
    patientId: string
    patientName: string
    age?: string | null
    sex?: string | null
    month: string
    entries: CaregiverVitalEntry[]
    signatures?: {
        doctor?: string
        nurse?: string
        attender?: string
        manager?: string
    } | null
    status: string
    tenantId: string
    unitId: string
    createdAt?: string
    updatedAt?: string
}

export interface SaveCaregiverVitalChartPayload {
    patientId: string
    admissionId?: string
    enquiryId?: string
    allocationId?: string
    patientName?: string
    age?: string
    sex?: string
    month: string
    entries: CaregiverVitalEntry[]
    signatures?: CaregiverVitalChart['signatures']
    status?: string
    unitId?: string | null
}

export interface CreateNutritionPayload {
    patientId: string
    calories: number
    dietPlan: string
}

export interface CreateAdlPayload {
    patientId: string
    mobility: string
    hygiene: string
    feeding: string
    notes?: string
}

export interface UpdateAdlStatusPayload {
    id: string
    status: AdlRecord['status']
}
