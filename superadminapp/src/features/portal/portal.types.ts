export interface PortalResident {
	id: string
	name: string
	gender?: string
	age?: number | null
	bloodGroup?: string
	primaryContact?: string
	room: string
	bed: string
	floor: string
	admittedAt?: string | null
	healthCondition?: string
	clinicalStatus?: string
	guardianName?: string
	guardianMobile?: string
	guardianEmail?: string
}

export interface PortalVitalSign {
	id: string
	bloodPressure?: string
	heartRate?: number
	temperature?: number
	sugarLevel?: number
	recordedAt: string
	recordedBy?: string
	notes?: string
}

export interface CaregiverVitalEntry {
	day: number
	tempMor?: string
	tempEve?: string
	bpMor?: string
	bpEve?: string
	spo2Mor?: string
	spo2Eve?: string
	pulseMor?: string
	pulseEve?: string
	sugarMor?: string
	sugarEve?: string
}

export interface CaregiverVitalChart {
	id: string
	patientId: string
	patientName: string
	month: string
	entries: CaregiverVitalEntry[]
	signatures?: Record<string, string>
}

export interface PortalMedication {
	id: string
	name: string
	dosage: string
	frequency?: string
	times?: string[]
	notes?: string
	createdAt?: string
}

export interface PortalPrescription {
	id: string
	doctorName?: string
	diagnosis?: string
	instructions?: string
	createdAt: string
}

export interface PortalNutrition {
	id: string
	mealType: string
	items: string
	date?: string
	notes?: string
	createdAt?: string
}

export interface PortalAdlRecord {
	id: string
	patientId?: string
	mobility?: string
	hygiene?: string
	feeding?: string
	notes?: string
	status?: string
	recordedBy?: string
	createdAt: string
}

export interface PortalDoctorVisit {
	id: string
	doctorName?: string
	chiefComplaint?: string
	clinicalNotes?: string
	visitDate: string
	chargeAmount?: number
}

export interface PortalDailyCost {
	id: string
	costNo: string
	category: string
	description: string
	quantity: number
	rate: number
	amount: number
	costDate: string
	status: string
	invoiceId?: string | null
	familyContact?: string | null
}

export interface PortalInvoice {
	id: string
	invoiceNo: string
	amount: number
	status: string
	createdAt: string
}

export interface PortalComplaint {
	id: string
	title: string
	category: string
	priority: string
	status: string
	description: string
	createdAt: string
}

export interface PortalAccount {
	id: string
	name: string
	mobile: string
	patientId: string
	patientName: string
	room: string
	bed: string
	floor: string
	admittedAt?: string | null
	clinicalStatus?: string
}

export interface PortalDashboardData {
	resident: PortalResident
	vitals: PortalVitalSign[]
	caregiverVitalCharts: CaregiverVitalChart[]
	medications: PortalMedication[]
	prescriptions: PortalPrescription[]
	nutritions: PortalNutrition[]
	doctorVisits: PortalDoctorVisit[]
	adlRecords: PortalAdlRecord[]
	dailyCosts: PortalDailyCost[]
	invoices: PortalInvoice[]
}

export interface AdmittedResidentListItem {
	admissionId: string
	patientId: string
	patientName: string
	room: string
	bed: string
	floor: string
	admittedAt: string
	healthCondition: string
	clinicalStatus: string
	guardianName: string
	guardianMobile: string
	guardianEmail: string
}
