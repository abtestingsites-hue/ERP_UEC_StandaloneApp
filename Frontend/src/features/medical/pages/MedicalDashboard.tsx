import { useMemo } from 'react'
import { Stethoscope, Activity, Users, FileText } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { useMedicalDashboard } from '../hooks/useMedical'
import { StatusHighlighter } from '../../../components/StatusHighlighter'

export function MedicalDashboard() {
    const { data: dashboard, isLoading } = useMedicalDashboard()

    const kpis = useMemo(() => {
        if (!dashboard) return []
        
        const activeStaff = (dashboard.medicalStaff || []).filter((s: any) => s.isAvailable).length
        const totalStaff = (dashboard.medicalStaff || []).length
        const inProgress = (dashboard.activeAssignments || []).filter((a: any) => a.status === 'IN_PROGRESS').length
        const pending = (dashboard.activeAssignments || []).filter((a: any) => a.status === 'ASSIGNED').length

        return [
            { title: 'Medical Staff Online', value: `${activeStaff} / ${totalStaff}`, icon: Users, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
            { title: 'Active Duties (In Progress)', value: inProgress, icon: Activity, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { title: 'Pending Assignments', value: pending, icon: FileText, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
        ]
    }, [dashboard])

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Doctor Dashboard"
                subtitle="Overview of medical staff, active duties, and clinical workloads."
                breadcrumbs={[{ label: 'Medical' }, { label: 'Dashboard' }]}
            />

            {!isLoading && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {kpis.map((kpi, idx) => (
                        <div key={idx} className={`rounded-2xl border ${kpi.border} ${kpi.bg} p-5 shadow-sm`}>
                            <div className="flex items-center gap-4">
                                <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ${kpi.color}`}>
                                    <kpi.icon className="h-6 w-6" />
                                </span>
                                <div>
                                    <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{kpi.title}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-blue-600" />
                        Live Medical Duties
                    </h3>
                </div>
                <div className="p-0">
                    {dashboard?.activeAssignments?.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No active medical assignments right now.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {dashboard?.activeAssignments?.map((a: any) => (
                                <div key={a.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                    <div>
                                        <p className="font-bold text-gray-900">Dr. {a.staff?.firstName} {a.staff?.lastName}</p>
                                        <p className="text-sm text-gray-500">Duty: {a.dutyType} {a.patient?.name ? `- Resident: ${a.patient.name}` : ''}</p>
                                    </div>
                                    <div>
                                        <StatusHighlighter value={a.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
