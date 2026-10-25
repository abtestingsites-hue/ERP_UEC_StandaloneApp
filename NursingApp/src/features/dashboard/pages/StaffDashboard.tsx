import { useMemo } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { useMyShift } from '../../my-shift/hooks/useMyShift';
import { useNursingVitalsForPatients } from '../../vitals/hooks/useVitals';
import { getVitalRisk, latestVitalForPatient } from '../../critical-patients/utils';
import { UserCircle, CalendarClock, Activity, AlertCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StaffDashboard() {
    const { data: shiftData, isLoading: shiftLoading } = useMyShift();

    const activeAssignments = useMemo(() => {
        if (!shiftData?.assignments) return [];
        return shiftData.assignments.filter((a: any) => 
            ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(a.status)
        );
    }, [shiftData]);

    const patientIds = useMemo(() => {
        const ids = new Set<string>();
        activeAssignments.forEach((a: any) => { if (a.patientId) ids.add(a.patientId); });
        return Array.from(ids);
    }, [activeAssignments]);

    const vitalsQueries = useNursingVitalsForPatients(patientIds);
    const vitals = useMemo(() => vitalsQueries.flatMap(q => q.data || []), [vitalsQueries]);
    
    const criticalCount = useMemo(() => {
        let count = 0;
        for (const pid of patientIds) {
            const vital = latestVitalForPatient(pid, vitals);
            if (vital) {
                const risk = getVitalRisk(vital);
                if (risk.level === 'critical') count++;
            }
        }
        return count;
    }, [patientIds, vitals]);

    if (shiftLoading) {
        return (
            <div className="flex flex-col h-full">
                <PageHeader title="Nursing Dashboard" subtitle="Overview of your current shift and assignments." />
                <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
                    <Activity className="h-10 w-10 animate-bounce text-emerald-400 mb-3" />
                    <p className="text-sm font-bold animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <PageHeader 
                title="Nursing Dashboard" 
                subtitle="Overview of your current shift and assignments."
            />

            {criticalCount > 0 && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20 px-5 py-4 text-sm font-semibold text-rose-800 dark:text-rose-400 shadow-sm flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    <p>You have {criticalCount} assigned patient{criticalCount > 1 ? 's' : ''} with critical vitals. Please check My Shift for details.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#072E33] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <UserCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Assigned Patients</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{activeAssignments.length}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <CalendarClock className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Today's Duties</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{(shiftData?.assignments || []).length}</p>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-[#072E33] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${criticalCount > 0 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Action Needed</p>
                        <p className={`text-3xl font-black ${criticalCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>{criticalCount}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Assignments</h2>
                    <Link to="/my-shift" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
                        View My Shift &rarr;
                    </Link>
                </div>
                <div className="p-0">
                    {activeAssignments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-[#B8D9E8]">
                            No active assignments.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-[#6DA5C0]/15">
                            {activeAssignments.slice(0, 5).map((a: any) => {
                                const vital = latestVitalForPatient(a.patientId, vitals);
                                const isCritical = vital && getVitalRisk(vital).level === 'critical';
                                return (
                                    <div key={a.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {isCritical && <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />}
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{a.patient?.name || 'Unknown'}</p>
                                                <p className="text-sm text-gray-500 dark:text-[#B8D9E8]">{a.dutyType?.replace(/_/g, ' ')}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isCritical ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-800' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800'}`}>
                                            {isCritical ? 'CRITICAL' : a.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
