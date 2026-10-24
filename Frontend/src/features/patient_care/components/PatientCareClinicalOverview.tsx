import { useMemo } from 'react'
import { Activity, Pill, HeartPulse, AlertTriangle } from 'lucide-react'
import {
    useMedicationSchedules,
    useVitalSigns,
    useHealthcarePatients
} from '../../healthcare/hooks/useHealthcare'
import { getVitalRisk, latestVitalForPatient } from '../../healthcare/utils'

export function PatientCareClinicalOverview() {
    const { data: schedules = [], isLoading: isSchedulesLoading, error: schedulesError } = useMedicationSchedules()
    const { data: vitals = [], isLoading: isVitalsLoading, error: vitalsError } = useVitalSigns()
    const { data: patients = [], isLoading: isPatientsLoading, error: patientsError } = useHealthcarePatients()

    const isLoading = isSchedulesLoading || isVitalsLoading || isPatientsLoading
    const hasError = schedulesError || vitalsError || patientsError

    // 1. Medication Status Logic
    const medicationSummary = useMemo(() => {
        const totalSchedules = schedules.length
        const pendingDoses = schedules.reduce((sum, item) => {
            const times = Array.isArray(item.times) ? item.times : []
            const administeredSlots = Array.isArray(item.administeredSlots) ? item.administeredSlots : []
            return sum + Math.max(0, times.length - administeredSlots.length)
        }, 0)
        const completedSchedules = schedules.filter((item) => item.status === 'COMPLETED').length
        return { totalSchedules, pendingDoses, completedSchedules }
    }, [schedules])

    // 2. Latest Vitals Logic
    const latestVital = useMemo(() => {
        if (!vitals.length) return null
        return [...vitals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    }, [vitals])

    // 3. Critical Patients Logic
    const criticalPatientsCount = useMemo(() => {
        if (!patients.length || !vitals.length) return 0
        return patients.filter((patient) => {
            const latest = latestVitalForPatient(patient.id, vitals)
            return getVitalRisk(latest).level === 'critical'
        }).length
    }, [patients, vitals])

    if (isLoading) {
        return (
            <div className="mb-6 rounded-[1.25rem] border border-slate-200/70 bg-white p-6 shadow-sm flex items-center justify-center min-h-[140px]">
                <div className="flex flex-col items-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600"></div>
                    <p className="text-sm font-bold text-slate-500">Loading Clinical Overview...</p>
                </div>
            </div>
        )
    }

    if (hasError) {
        return (
            <div className="mb-6 rounded-[1.25rem] border border-rose-100 bg-rose-50 p-6 flex items-center justify-center min-h-[140px]">
                <div className="flex flex-col items-center space-y-2 text-rose-600">
                    <AlertTriangle className="h-8 w-8" />
                    <p className="text-sm font-bold">Failed to load clinical overview.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mb-6">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">Clinical Overview (Read-Only)</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                
                {/* Medication Status */}
                <div className="rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Pill className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Medication Status</h3>
                    </div>
                    {medicationSummary.totalSchedules === 0 ? (
                        <p className="text-sm font-semibold text-slate-400">No active medications scheduled.</p>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-slate-600">Total Schedules</span>
                                <span className="font-extrabold text-slate-900">{medicationSummary.totalSchedules}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-amber-600">Pending Doses</span>
                                <span className="font-extrabold text-amber-700">{medicationSummary.pendingDoses}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-emerald-600">Completed Schedules</span>
                                <span className="font-extrabold text-emerald-700">{medicationSummary.completedSchedules}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Latest Vitals */}
                <div className="rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Activity className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Latest Unit Vitals</h3>
                    </div>
                    {!latestVital ? (
                        <p className="text-sm font-semibold text-slate-400">No recent vitals recorded.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">BP</p>
                                <p className="font-extrabold text-slate-800">{latestVital.bp || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pulse</p>
                                <p className="font-extrabold text-slate-800">{latestVital.pulse || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Temp</p>
                                <p className="font-extrabold text-slate-800">{latestVital.temp || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">SpO2</p>
                                <p className="font-extrabold text-slate-800">{latestVital.spO2 || '-'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Critical Patients */}
                <div className="rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                            <HeartPulse className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Critical Patients</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center pt-2">
                        {criticalPatientsCount === 0 ? (
                            <>
                                <span className="text-3xl font-black text-emerald-500">0</span>
                                <span className="text-xs font-bold uppercase tracking-wide text-emerald-600 mt-1">All Stable</span>
                            </>
                        ) : (
                            <>
                                <span className="text-4xl font-black text-rose-600">{criticalPatientsCount}</span>
                                <span className="text-xs font-bold uppercase tracking-wide text-rose-600 mt-2">Requires Attention</span>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
