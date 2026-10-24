import type { HealthcarePatient, VitalSign } from './types'

export const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-GB')
}

export const latestVitalForPatient = (patientId: string, vitals: VitalSign[]) => {
    return vitals
        .filter((item) => item.patientId === patientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
}

const parseSystolic = (bp?: string | null) => {
    const value = String(bp || '').split('/')[0]
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : null
}

export const getVitalRisk = (vital?: VitalSign) => {
    if (!vital) return { label: 'No Vitals', level: 'missing' as const, reasons: ['No vital signs recorded'] }

    const reasons: string[] = []
    const systolic = parseSystolic(vital.bp)
    const pulse = Number(vital.pulse || 0)
    const temp = Number(vital.temp || 0)
    const spO2 = Number(vital.spO2 || 0)

    if (systolic !== null && (systolic >= 180 || systolic < 90)) reasons.push(`BP ${vital.bp}`)
    if (pulse && (pulse >= 120 || pulse < 50)) reasons.push(`Pulse ${pulse}`)
    if (temp && (temp >= 100.4 || temp < 95)) reasons.push(`Temp ${temp}`)
    if (spO2 && spO2 < 92) reasons.push(`SpO2 ${spO2}`)

    if (reasons.length) return { label: 'Critical', level: 'critical' as const, reasons }
    return { label: 'Stable', level: 'stable' as const, reasons: ['Latest vitals within safe range'] }
}

export const patientServiceLabel = (patient: HealthcarePatient) => {
    const latestAdmission = patient.admissions?.[0]
    return latestAdmission?.service || latestAdmission?.status || 'Healthcare'
}
