import { useMemo, useState } from 'react'
import { AlertTriangle, HeartPulse } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { ResidentProfileDrawer } from '../components/ResidentProfileDrawer'
import { useHealthcarePatients, useVitalSigns } from '../hooks/useHealthcare'
import type { HealthcarePatient } from '../types'
import { formatDateTime, getVitalRisk, latestVitalForPatient, patientServiceLabel } from '../utils'

export function CriticalPatients() {
    const [searchQuery, setSearchQuery] = useState('')
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
    const [selectedPatientName, setSelectedPatientName] = useState('')
    const { data: patients = [], isLoading: patientsLoading } = useHealthcarePatients()
    const { data: vitals = [], isLoading: vitalsLoading } = useVitalSigns()

    const criticalPatients = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return patients
            .map((patient) => {
                const vital = latestVitalForPatient(patient.id, vitals)
                const risk = getVitalRisk(vital)
                return { patient, vital, risk }
            })
            .filter((item) => item.risk.level === 'critical')
            .filter((item) => !query || [
                item.patient.name,
                patientServiceLabel(item.patient),
                item.risk.reasons.join(' '),
                item.vital?.notes || ''
            ].some((value) => String(value).toLowerCase().includes(query)))
    }, [patients, searchQuery, vitals])

    const patientsWithoutVitals = patients.filter((patient) => !latestVitalForPatient(patient.id, vitals)).length

    const columns: Column<{ patient: HealthcarePatient; vital: any; risk: ReturnType<typeof getVitalRisk> }>[] = [
        { key: 'sno', header: 'S.No', cell: (_item, index) => index + 1, sortable: false },
        {
            key: 'patient',
            header: 'Patient',
            cell: (item) => (
                <div className="flex flex-col">
                    <span className="font-extrabold text-slate-950">{item.patient.name}</span>
                    <span className="text-xs font-semibold text-slate-500">{patientServiceLabel(item.patient)}</span>
                </div>
            )
        },
        {
            key: 'vitals',
            header: 'Critical Vitals',
            cell: (item) => (
                <div className="text-xs font-semibold text-slate-600">
                    <p>BP {item.vital?.bp || '-'} / Pulse {item.vital?.pulse || '-'}</p>
                    <p>Temp {item.vital?.temp || '-'} / SpO2 {item.vital?.spO2 || '-'}</p>
                </div>
            )
        },
        { key: 'reason', header: 'Reason', cell: (item) => item.risk.reasons.join(', ') },
        { key: 'status', header: 'Status', cell: () => <StatusHighlighter value="Critical" /> },
        { key: 'recordedAt', header: 'Recorded At', cell: (item) => formatDateTime(item.vital?.createdAt), sortable: true },
        {
            key: 'actions',
            header: 'Actions',
            cell: (item) => (
                <button
                    onClick={() => {
                        setSelectedPatientId(item.patient.id)
                        setSelectedPatientName(item.patient.name)
                        setProfileDrawerOpen(true)
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-900"
                >
                    View Profile
                </button>
            )
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Critical Patients"
                subtitle="Live critical list calculated from the latest recorded patient vitals."
                breadcrumbs={[{ label: 'Healthcare' }, { label: 'Critical Patients' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{criticalPatients.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Critical Now</p>
                </div>
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{patients.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Patients Tracked</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{patientsWithoutVitals}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Needs Vitals</p>
                </div>
            </div>

            <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                <AlertTriangle className="mr-2 inline h-4 w-4" />
                A patient becomes critical when BP, pulse, temperature, or SpO2 crosses the configured safe range.
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search critical patient, reason, notes..."
            />

            <DataTable
                data={criticalPatients}
                columns={columns}
                keyExtractor={(item) => item.patient.id}
                isLoading={patientsLoading || vitalsLoading}
                emptyStateMessage="No critical patients from live vitals. Record vitals in Patient Dashboard to update this list."
            />

            <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-xs font-semibold text-primary-800">
                <HeartPulse className="mr-1 inline h-4 w-4" />
                This page does not use demo data. It only reads patients and vital signs created in the selected unit.
            </div>
            <ResidentProfileDrawer
                isOpen={profileDrawerOpen}
                onClose={() => setProfileDrawerOpen(false)}
                patientId={selectedPatientId}
                patientName={selectedPatientName}
            />
        </div>
    )
}
