import { Calendar, RefreshCw, Users, CheckCircle2, Clock } from 'lucide-react';
import { useManagerRoster } from '../hooks/useRoster';
import { ManagerRosterGrid } from '../components/ManagerRosterGrid';

export default function ManagerRoster() {
    const { assignments, tasks, allocations, isLoadingAssignments, refetchAll } = useManagerRoster();

    const totalAssigned = assignments.length;
    const inProgressVisits = tasks.filter((t) => String(t.status || '').toUpperCase() === 'IN_PROGRESS').length;
    const completedVisits = tasks.filter((t) => String(t.status || '').toUpperCase() === 'COMPLETED').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#072E33] p-6 rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                        <Calendar className="w-6 h-6 text-[#0F969C]" />
                        Home Care Staff Roster
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Monitor ongoing caregiver assignments, duty schedules, and real-time operational visit task execution.
                    </p>
                </div>

                <button
                    onClick={refetchAll}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Roster
                </button>
            </div>

            {/* Metric Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#072E33] p-5 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#0F969C] shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Ongoing Staff Assignments</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{totalAssigned}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] p-5 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 shrink-0">
                        <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">In Progress Visits</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{inProgressVisits}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] p-5 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Completed Visit Tasks</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedVisits}</span>
                    </div>
                </div>
            </div>

            {/* Roster Grid */}
            <ManagerRosterGrid
                assignments={assignments}
                tasks={tasks}
                allocations={allocations}
                isLoading={isLoadingAssignments}
            />
        </div>
    );
}
