import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Activity, HeartPulse, Plus, UserRound } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { ResidentProfileDrawer } from '../../healthcare/components/ResidentProfileDrawer'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import {
    useCreateHealthcarePatient,
    useCreateVitalSign,
    useHealthcarePatients,
    useNutritionPlans,
    useVitalSigns
} from '../../healthcare/hooks/useHealthcare'
import type { HealthcarePatient } from '../../healthcare/types'
import { formatDateTime, getVitalRisk, latestVitalForPatient, patientServiceLabel } from '../../healthcare/utils'

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
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedPatientId(patient.id)
                            setSelectedPatientName(patient.name)
                            setProfileDrawerOpen(true)
                        }}
                        className="rounded-full bg-[#0F969C]/10 px-3 py-1 text-xs font-bold text-[#0F969C] hover:bg-[#0F969C]/20"
                    >
                        View Profile
                    </button>
                    <button
                        onClick={() => {
                            setVitalForm({ patientId: patient.id, bp: '', pulse: '', temp: '', spO2: '', notes: '' })
                            setVitalsRecordedFor(patient.name)
                            setVitalDrawerOpen(true)
                        }}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                    >
                        Record Vitals
                    </button>
                </div>
            )
        }
    ]

    const handleCreatePatient = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!patientName.trim()) return
        await createPatient.mutateAsync({ name: patientName.trim(), unitId: routeUnitId || undefined })
        setPatientName('')
        setPatientDrawerOpen(false)
    }

    const handleCreateVital = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!vitalForm.patientId) return
        await createVital.mutateAsync({
            patientId: vitalForm.patientId,
            bp: vitalForm.bp || undefined,
            pulse: vitalForm.pulse ? Number(vitalForm.pulse) : undefined,
            temp: vitalForm.temp ? Number(vitalForm.temp) : undefined,
            spO2: vitalForm.spO2 ? Number(vitalForm.spO2) : undefined,
            notes: vitalForm.notes || undefined
        })
        setVitalDrawerOpen(false)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Resident & Patient Profile Management"
                subtitle="Centralized dashboard monitoring active resident profiles, clinical status, and vitals."
                breadcrumbs={[{ label: 'Resident Management' }, { label: 'Resident Profile Overview' }]}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[8px] border border-[#6DA5C0]/40 bg-white p-4 shadow-sm dark:bg-black dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Patients</span>
                        <UserRound className="h-5 w-5 text-[#0F969C]" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-gray-100">{patients.length}</p>
                </div>

                <div className="rounded-[8px] border border-[#6DA5C0]/40 bg-white p-4 shadow-sm dark:bg-black dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Admissions</span>
                        <Activity className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-gray-100">{activeAdmissions}</p>
                </div>

                <div className="rounded-[8px] border border-[#6DA5C0]/40 bg-white p-4 shadow-sm dark:bg-black dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Critical Alerts</span>
                        <HeartPulse className="h-5 w-5 text-rose-600" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-rose-600">{criticalCount}</p>
                </div>

                <div className="rounded-[8px] border border-[#6DA5C0]/40 bg-white p-4 shadow-sm dark:bg-black dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nutrition Plans</span>
                        <Activity className="h-5 w-5 text-[#0F969C]" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-gray-100">{nutritionPlans.length}</p>
                </div>
            </div>

            <ActionBar
                actions={[
                    {
                        label: 'Register Resident',
                        icon: Plus,
                        onClick: () => setPatientDrawerOpen(true),
                        variant: 'primary'
                    },
                    {
                        label: 'Record Vitals',
                        icon: HeartPulse,
                        onClick: () => {
                            setVitalsRecordedFor('')
                            setVitalForm({ patientId: patients[0]?.id || '', bp: '', pulse: '', temp: '', spO2: '', notes: '' })
                            setVitalDrawerOpen(true)
                        },
                        variant: 'secondary'
                    }
                ]}
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search patient, service, or vital notes..."
            />

            <DataTable
                data={visiblePatients}
                columns={columns}
                keyExtractor={(patient) => patient.id}
                isLoading={patientsLoading || vitalsLoading || nutritionLoading}
                showScrollbars
                minTableWidth="1100px"
                spreadColumns
                fullHeight={false}
            />

            {/* Create Patient Drawer */}
            <Drawer
                isOpen={patientDrawerOpen}
                onClose={() => setPatientDrawerOpen(false)}
                title="Quick Add Resident Profile"
            >
                <form onSubmit={handleCreatePatient} className="space-y-4 p-4">
                    <Input
                        label="Patient / Resident Name *"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Smt. Lakshmi Ammal"
                        required
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setPatientDrawerOpen(false)}
                            className="rounded-lg border px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createPatient.isPending || !patientName.trim()}
                            className="rounded-lg bg-[#0F969C] px-4 py-2 text-sm font-bold text-white hover:bg-[#0A7075] disabled:opacity-50"
                        >
                            {createPatient.isPending ? 'Saving...' : 'Create Resident'}
                        </button>
                    </div>
                </form>
            </Drawer>

            {/* Record Vitals Drawer */}
            <Drawer
                isOpen={vitalDrawerOpen}
                onClose={() => setVitalDrawerOpen(false)}
                title={`Record Vitals ${vitalsRecordedFor ? `for ${vitalsRecordedFor}` : ''}`}
            >
                <form onSubmit={handleCreateVital} className="space-y-4 p-4">
                    {!vitalsRecordedFor && (
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Select Resident *</label>
                            <select
                                value={vitalForm.patientId}
                                onChange={(e) => setVitalForm((prev) => ({ ...prev, patientId: e.target.value }))}
                                className="w-full rounded-lg border p-2.5 text-sm font-semibold dark:bg-black dark:border-gray-700"
                                required
                            >
                                <option value="">Select resident</option>
                                {patients.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Blood Pressure (BP)"
                            value={vitalForm.bp}
                            onChange={(e) => setVitalForm((prev) => ({ ...prev, bp: e.target.value }))}
                            placeholder="120/80"
                        />
                        <Input
                            label="Pulse (bpm)"
                            type="number"
                            value={vitalForm.pulse}
                            onChange={(e) => setVitalForm((prev) => ({ ...prev, pulse: e.target.value }))}
                            placeholder="72"
                        />
                        <Input
                            label="Temperature (°F)"
                            type="number"
                            step="0.1"
                            value={vitalForm.temp}
                            onChange={(e) => setVitalForm((prev) => ({ ...prev, temp: e.target.value }))}
                            placeholder="98.6"
                        />
                        <Input
                            label="SpO2 (%)"
                            type="number"
                            value={vitalForm.spO2}
                            onChange={(e) => setVitalForm((prev) => ({ ...prev, spO2: e.target.value }))}
                            placeholder="98"
                        />
                    </div>

                    <Input
                        label="Clinical Notes / Observation"
                        value={vitalForm.notes}
                        onChange={(e) => setVitalForm((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="e.g. Resident feels well, resting in bed"
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setVitalDrawerOpen(false)}
                            className="rounded-lg border px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createVital.isPending || !vitalForm.patientId}
                            className="rounded-lg bg-[#0F969C] px-4 py-2 text-sm font-bold text-white hover:bg-[#0A7075] disabled:opacity-50"
                        >
                            {createVital.isPending ? 'Recording...' : 'Save Vitals'}
                        </button>
                    </div>
                </form>
            </Drawer>

            {/* Resident Profile Drawer */}
            <ResidentProfileDrawer
                isOpen={profileDrawerOpen}
                onClose={() => setProfileDrawerOpen(false)}
                patientId={selectedPatientId}
                patientName={selectedPatientName}
            />
        </div>
    )
}
