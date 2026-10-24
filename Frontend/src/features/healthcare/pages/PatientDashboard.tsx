import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Activity, HeartPulse, Plus, UserRound } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { ResidentProfileDrawer } from '../components/ResidentProfileDrawer'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import {
    useCreateHealthcarePatient,
    useCreateVitalSign,
    useHealthcarePatients,
    useNutritionPlans,
    useVitalSigns
} from '../hooks/useHealthcare'
import type { HealthcarePatient } from '../types'
import { formatDateTime, getVitalRisk, latestVitalForPatient, patientServiceLabel } from '../utils'

export function PatientDashboard() {
    const [searchParams] = useSearchParams()
    const routeUnitId = searchParams.get('unitId')
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [vitalsRecordedFor, setVitalsRecordedFor] = useState('')
    const [patientDrawerOpen, setPatientDrawerOpen] = useState(false)
    const [vitalDrawerOpen, setVitalDrawerOpen] = useState(false)
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
    const [selectedPatientName, setSelectedPatientName] = useState('')
    const [patientName, setPatientName] = useState('')
    const [vitalForm, setVitalForm] = useState({ patientId: '', bp: '', pulse: '', temp: '', spO2: '', notes: '' })

    const { data: patients = [], isLoading: patientsLoading } = useHealthcarePatients(routeUnitId)
    const { data: vitals = [], isLoading: vitalsLoading } = useVitalSigns(routeUnitId)
    const { data: nutritionPlans = [], isLoading: nutritionLoading } = useNutritionPlans(routeUnitId)
    const createPatient = useCreateHealthcarePatient()
    const createVital = useCreateVitalSign()

    const visiblePatients = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return patients.filter((patient) => !query || [
            patient.name,
            patientServiceLabel(patient),
            latestVitalForPatient(patient.id, vitals)?.notes || ''
        ].some((value) => String(value).toLowerCase().includes(query)))
    }, [patients, searchQuery, vitals])

    const criticalCount = useMemo(() => (
        patients.filter((patient) => getVitalRisk(latestVitalForPatient(patient.id, vitals)).level === 'critical').length
    ), [patients, vitals])

    const activeAdmissions = patients.reduce((sum, patient) => sum + (patient.admissions?.length || 0), 0)

    const columns: Column<HealthcarePatient>[] = [
        { key: 'sno', header: 'S.No', cell: (_patient, index) => index + 1, sortable: false },
        {
            key: 'name',
            header: 'Patient',
            cell: (patient) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <UserRound className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">
                            {patient.name}
                            {patient.elderId && <span className="ml-2 text-xs font-normal text-slate-500">({patient.elderId})</span>}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">{patientServiceLabel(patient)}</p>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            key: 'latestVitals',
            header: 'Latest Vitals',
            cell: (patient) => {
                const vital = latestVitalForPatient(patient.id, vitals)
                if (!vital) return <span className="text-xs font-semibold text-slate-400">No vitals recorded</span>
                return (
                    <div className="text-xs font-semibold text-slate-600">
                        <p>BP {vital.bp || '-'} / Pulse {vital.pulse || '-'}</p>
                        <p>Temp {vital.temp || '-'} / SpO2 {vital.spO2 || '-'}</p>
                    </div>
                )
            }
        },
        {
            key: 'risk',
            header: 'Care Status',
            cell: (patient) => <StatusHighlighter value={getVitalRisk(latestVitalForPatient(patient.id, vitals)).label} />
        },
        { key: 'nutrition', header: 'Nutrition Plans', cell: (patient) => patient.nutritions?.length || 0 },
        { key: 'medications', header: 'Medications', cell: (patient) => patient.medications?.length || 0 },
        { key: 'createdAt', header: 'Created', cell: (patient) => formatDateTime(patient.createdAt), sortable: true },
        {
            key: 'actions',
            header: 'Actions',
            cell: (patient) => (
                <button
                    onClick={() => {
                        setSelectedPatientId(patient.id)
                        setSelectedPatientName(patient.name)
                        setProfileDrawerOpen(true)
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-900"
                >
                    View Profile
                </button>
            )
        }
    ]

    const handleCreatePatient = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!patientName.trim()) return
        await createPatient.mutateAsync({ name: patientName.trim() })
        setPatientName('')
        setPatientDrawerOpen(false)
    }

    const handleCreateVital = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!vitalForm.patientId) return
        await createVital.mutateAsync({
            patientId: vitalForm.patientId,
            bp: vitalForm.bp.trim() || undefined,
            pulse: vitalForm.pulse ? Math.trunc(Number(vitalForm.pulse)) : undefined,
            temp: vitalForm.temp ? Number(vitalForm.temp) : undefined,
            spO2: vitalForm.spO2 ? Math.trunc(Number(vitalForm.spO2)) : undefined,
            notes: vitalForm.notes.trim() || undefined
        })
        const patient = patients.find((item) => item.id === vitalForm.patientId)
        setVitalsRecordedFor(patient?.name || 'patient')
        setVitalForm({ patientId: '', bp: '', pulse: '', temp: '', spO2: '', notes: '' })
        setVitalDrawerOpen(false)
    }

    const summary = [
        { label: 'Patients', value: patients.length, tone: 'bg-primary-50 text-primary-700' },
        { label: 'Admissions Linked', value: activeAdmissions, tone: 'bg-sky-50 text-sky-700' },
        { label: 'Critical Patients', value: criticalCount, tone: 'bg-rose-50 text-rose-700' },
        { label: 'Nutrition Plans', value: nutritionPlans.length, tone: 'bg-emerald-50 text-emerald-700' }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Patient Dashboard"
                subtitle="Live patient care overview from registered patients, vitals, medication and nutrition records."
                breadcrumbs={[{ label: 'Healthcare' }, { label: 'Patient Dashboard' }]}
                action={(
                    <button
                        type="button"
                        onClick={() => setVitalDrawerOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-xs font-extrabold text-primary-700 hover:bg-primary-100"
                    >
                        <HeartPulse className="h-4 w-4" />
                        Record Vitals
                    </button>
                )}
            />

            {vitalsRecordedFor && (
                <div className="mb-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-extrabold text-emerald-900">Healthcare monitoring updated</p>
                        <p className="text-sm font-semibold text-emerald-700">
                            Continue to billing for {vitalsRecordedFor}.
                        </p>
                    </div>
                    <Link
                        to={`/finance/invoice?${new URLSearchParams({
                            ...(routeUnitId ? { unitId: routeUnitId } : {}),
                            search: vitalsRecordedFor
                        }).toString()}`}
                        className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-emerald-800"
                    >
                        Open Billing
                    </Link>
                </div>
            )}

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                {summary.map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 p-4 shadow-sm ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            <ActionBar
                onAdd={() => setPatientDrawerOpen(true)}
                addLabel="Add Patient"
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search patient, care service, notes..."
            />

            <DataTable
                data={visiblePatients}
                columns={columns}
                keyExtractor={(patient) => patient.id}
                isLoading={patientsLoading || vitalsLoading || nutritionLoading}
                emptyStateMessage="No live patients found. Create or admit a patient to start healthcare tracking."
            />

            <Drawer isOpen={patientDrawerOpen} onClose={() => setPatientDrawerOpen(false)} title="Add Patient" size="md">
                <form onSubmit={handleCreatePatient} className="space-y-4">
                    <Input label="Patient Name" required value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="Enter patient name" />
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setPatientDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createPatient.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            <Plus className="h-4 w-4" />
                            {createPatient.isPending ? 'Saving...' : 'Save Patient'}
                        </button>
                    </div>
                </form>
            </Drawer>

            <Drawer isOpen={vitalDrawerOpen} onClose={() => setVitalDrawerOpen(false)} title="Record Patient Vitals" size="md">
                <form onSubmit={handleCreateVital} className="space-y-4">
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Patient</span>
                        <select required value={vitalForm.patientId} onChange={(event) => setVitalForm((prev) => ({ ...prev, patientId: event.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
                            <option value="">Select patient</option>
                            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                        </select>
                    </label>
                    <Input label="Blood Pressure" value={vitalForm.bp} onChange={(event) => setVitalForm((prev) => ({ ...prev, bp: event.target.value }))} placeholder="120/80" />
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Input label="Pulse" type="number" value={vitalForm.pulse} onChange={(event) => setVitalForm((prev) => ({ ...prev, pulse: event.target.value }))} />
                        <Input label="Temp" type="number" step="0.1" value={vitalForm.temp} onChange={(event) => setVitalForm((prev) => ({ ...prev, temp: event.target.value }))} />
                        <Input label="SpO2" type="number" value={vitalForm.spO2} onChange={(event) => setVitalForm((prev) => ({ ...prev, spO2: event.target.value }))} />
                    </div>
                    <Input label="Notes" value={vitalForm.notes} onChange={(event) => setVitalForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Observation notes" />
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                        <Activity className="mr-1 inline h-4 w-4" />
                        These vitals decide whether the patient appears in Critical Patients.
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setVitalDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createVital.isPending || !patients.length} className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            <HeartPulse className="h-4 w-4" />
                            {createVital.isPending ? 'Saving...' : 'Save Vitals'}
                        </button>
                    </div>
                </form>
            </Drawer>
            <ResidentProfileDrawer
                isOpen={profileDrawerOpen}
                onClose={() => setProfileDrawerOpen(false)}
                patientId={selectedPatientId}
                patientName={selectedPatientName}
            />
        </div>
    )
}
