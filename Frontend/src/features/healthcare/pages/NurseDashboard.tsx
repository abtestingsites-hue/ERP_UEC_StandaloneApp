import { useMemo } from 'react'
import { Activity, ClipboardList, Pill, Users } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { useHealthcarePatients } from '../hooks/useHealthcare'
import { Link } from 'react-router-dom'

export function NurseDashboard() {
    const { data: patients = [], isLoading } = useHealthcarePatients()

    const kpis = useMemo(() => {
        const totalPatients = patients.length;
        const pendingVitals = patients.filter((p: any) => p.status === 'ADMITTED').length; // Mock metric for admitted patients
        
        return [
            { title: 'Total Residents', value: totalPatients, icon: Users, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100', link: '/healthcare/patient-dashboard' },
            { title: 'Pending Vitals Checks', value: pendingVitals, icon: Activity, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100', link: '/healthcare/vitals' },
            { title: 'ADL Monitoring', value: 'Live', icon: ClipboardList, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', link: '/healthcare/adl' },
            { title: 'Medications', value: 'Active', icon: Pill, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100', link: '/healthcare/medication-management' },
        ]
    }, [patients])

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Nurse Dashboard"
                subtitle="Centralized view for nursing duties, resident vitals, ADLs, and medication."
                breadcrumbs={[{ label: 'Healthcare' }, { label: 'Nurse Dashboard' }]}
            />

            {!isLoading && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpis.map((kpi, idx) => (
                        <Link to={kpi.link} key={idx} className={`block rounded-2xl border ${kpi.border} ${kpi.bg} p-5 shadow-sm hover:opacity-90 transition-opacity`}>
                            <div className="flex items-center gap-4">
                                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${kpi.color}`}>
                                    <kpi.icon className="h-6 w-6" />
                                </span>
                                <div>
                                    <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{kpi.title}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm p-8 text-center flex flex-col items-center justify-center">
                <ClipboardList className="h-16 w-16 text-emerald-600 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-gray-800">Nurse Daily Workflow</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                    Use the cards above to jump directly into your primary nursing duties. 
                    Remember to log all vitals and medications accurately for the Clinical View.
                </p>
                <div className="mt-6 flex gap-4">
                    <Link to="/healthcare/vitals" className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 shadow-sm">
                        Log Vitals
                    </Link>
                    <Link to="/medical/clinical-view" className="px-6 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold hover:bg-slate-200 shadow-sm transition-colors">
                        Open Clinical View
                    </Link>
                </div>
            </div>
        </div>
    )
}
