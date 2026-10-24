import { Calendar, RefreshCw, AlertCircle, Clock, UserCheck } from 'lucide-react';
import { useMyRoster } from '../hooks/useRoster';
import { CaregiverShiftCard } from '../components/CaregiverShiftCard';
import { useAuthStore } from '../../../store/authStore';

export default function MyRoster() {
    const { user } = useAuthStore();
    const { myShift, isLoading, refetch } = useMyRoster();

    const staffName = user?.name || (user as any)?.email || myShift.staff?.name || 'Caregiver';
    const todayFormatted = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const assignments = myShift.assignments || [];
    const tasks = myShift.tasks || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#072E33] p-6 rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                        <Calendar className="w-6 h-6 text-[#0F969C]" />
                        Today's Duty Roster
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Welcome back, <strong className="text-[#0F969C]">{staffName}</strong>. Here are your assigned Home Care client duties for {todayFormatted}.
                    </p>
                </div>

                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Shift
                </button>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#072E33] p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#0F969C]">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Assigned Clients Today</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white">{assignments.length}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Associated Visit Tasks</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white">{tasks.length}</span>
                    </div>
                </div>
            </div>

            {/* Content List */}
            {isLoading ? (
                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-8 border border-gray-100 dark:border-[#6DA5C0]/15 text-center">
                    <div className="w-8 h-8 border-4 border-[#0F969C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Loading your shift roster...</p>
                </div>
            ) : assignments.length === 0 ? (
                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-12 border border-gray-100 dark:border-[#6DA5C0]/15 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Active Duty Assignments Today</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                        You currently have no Home Care client duty assignments scheduled for today. Check back later or contact your Care Manager.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {assignments.map((assignment) => (
                        <CaregiverShiftCard key={assignment.id} assignment={assignment} />
                    ))}
                </div>
            )}
        </div>
    );
}
