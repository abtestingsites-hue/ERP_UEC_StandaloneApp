import { useMemo } from 'react'
import { ClipboardCheck, Apple, AlertTriangle } from 'lucide-react'
import { useAdlRecords, useNutritionPlans } from '../../healthcare/hooks/useHealthcare'
import { useUecIncidents } from '../../patient_care/pages/IncidentReports'

export function NursingPatientCareOverview() {
    const { data: adlRecords = [], isLoading: isAdlLoading, error: adlError } = useAdlRecords()
    const { data: nutritionPlans = [], isLoading: isNutritionLoading, error: nutritionError } = useNutritionPlans()
    const { data: incidents = [], isLoading: isIncidentsLoading, error: incidentsError } = useUecIncidents()

    const isLoading = isAdlLoading || isNutritionLoading || isIncidentsLoading
    const hasError = adlError || nutritionError || incidentsError

    // 1. ADL Logic (Exactly from Patient Care ADL Dashboard)
    const adlSummary = useMemo(() => {
        const total = adlRecords.length
        const needsSupport = adlRecords.filter((record) => record.status === 'NEEDS_SUPPORT').length
        const completed = adlRecords.filter((record) => record.status === 'COMPLETED').length
        return { total, needsSupport, completed }
    }, [adlRecords])

    // 2. Nutrition Logic (Exactly from Patient Care Nutrition Dashboard)
    const nutritionSummary = useMemo(() => {
        const totalPlans = nutritionPlans.length
        const averageCalories = nutritionPlans.length
            ? Math.round(nutritionPlans.reduce((sum, plan) => sum + Number(plan.calories || 0), 0) / nutritionPlans.length)
            : 0
        return { totalPlans, averageCalories }
    }, [nutritionPlans])

    // 3. Incidents Logic (Exactly from Patient Care Incidents Dashboard values)
    const incidentsSummary = useMemo(() => {
        const total = incidents.length
        const critical = incidents.filter((i: any) => i.severity === 'CRITICAL').length
        const high = incidents.filter((i: any) => i.severity === 'HIGH').length
        return { total, critical, high }
    }, [incidents])

    if (isLoading) {
        return (
            <div className="mb-6 rounded-[1.25rem] border border-slate-200/70 bg-white p-6 shadow-sm flex items-center justify-center min-h-[140px]">
                <div className="flex flex-col items-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600"></div>
                    <p className="text-sm font-bold text-slate-500">Loading Patient Care Overview...</p>
                </div>
            </div>
        )
    }

    if (hasError) {
        return (
            <div className="mb-6 rounded-[1.25rem] border border-rose-100 bg-rose-50 p-6 flex items-center justify-center min-h-[140px]">
                <div className="flex flex-col items-center space-y-2 text-rose-600">
                    <AlertTriangle className="h-8 w-8" />
                    <p className="text-sm font-bold">Failed to load patient care overview.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mb-6">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">Patient Care Overview (Read-Only)</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                
                {/* ADL Status */}
                <div className="rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">ADL Status</h3>
                    </div>
                    {adlSummary.total === 0 ? (
                        <p className="text-sm font-semibold text-slate-400">No active ADL records.</p>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-slate-600">Total Records</span>
                                <span className="font-extrabold text-slate-900">{adlSummary.total}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-amber-600">Needs Support</span>
                                <span className="font-extrabold text-amber-700">{adlSummary.needsSupport}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-emerald-600">Completed</span>
                                <span className="font-extrabold text-emerald-700">{adlSummary.completed}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nutrition Status */}
                <div className="rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <Apple className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Nutrition Status</h3>
                    </div>
                    {nutritionSummary.totalPlans === 0 ? (
                        <p className="text-sm font-semibold text-slate-400">No active diet plans.</p>
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-1">
                            <span className="text-3xl font-black text-emerald-700">{nutritionSummary.averageCalories}</span>
                            <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 mt-1 mb-3">Avg Calories / Day</span>
                            <div className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-100">
                                {nutritionSummary.totalPlans} Active Diet Plans
                            </div>
                        </div>
                    )}
                </div>

                {/* Incidents Status */}
                <div className="rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Recent Incidents</h3>
                    </div>
                    {incidentsSummary.total === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-2">
                            <span className="text-3xl font-black text-emerald-500">0</span>
                            <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 mt-1">No Incidents</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-slate-600">Total Logged</span>
                                <span className="font-extrabold text-slate-900">{incidentsSummary.total}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-orange-600">High Severity</span>
                                <span className="font-extrabold text-orange-700">{incidentsSummary.high}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-rose-600">Critical Severity</span>
                                <span className="font-extrabold text-rose-700">{incidentsSummary.critical}</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
