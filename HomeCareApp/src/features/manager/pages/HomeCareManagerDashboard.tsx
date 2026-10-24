import { useQuery } from '@tanstack/react-query';
import { Users, Activity, UserPlus, CheckCircle, CalendarClock, Home, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { api } from '../../../lib/axios';

export default function HomeCareManagerDashboard() {
    // Query Home Care allocations
    const { data: homeCareAllocations = [], isLoading: isLoadingAllocations } = useQuery({
        queryKey: ['homecare-allocations-dashboard'],
        queryFn: async () => {
            const res = await api.get('/allocation/home-care');
            return res.data?.data || res.data || [];
        },
        retry: false
    });

    // Query medical staff
    const { data: staffList = [], isLoading: isLoadingStaff } = useQuery({
        queryKey: ['homecare-staff-dashboard'],
        queryFn: async () => {
            const res = await api.get('/medical/staff');
            return res.data?.data || res.data || [];
        },
        retry: false
    });

    // Query today's operational visit tasks
    const { data: taskList = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ['homecare-manager-dashboard-tasks'],
        queryFn: async () => {
            const res = await api.get('/tasks?homeCare=true&today=true');
            return res.data?.data || res.data || [];
        },
        retry: false
    });

    const activeAllocations = homeCareAllocations.filter((a: any) => a.status === 'ALLOCATED' || a.status === 'ACTIVE');
    const allocatedStaffCount = new Set(activeAllocations.map((a: any) => a.staffId).filter(Boolean)).size;

    // Operational Visit Task Counts
    const scheduledVisitsCount = taskList.length;
    const inProgressVisitsCount = taskList.filter((t: any) => String(t.status || '').toUpperCase() === 'IN_PROGRESS').length;
    const completedVisitsCount = taskList.filter((t: any) => String(t.status || '').toUpperCase() === 'COMPLETED').length;
    const pendingVisitsCount = taskList.filter((t: any) => ['ASSIGNED', 'PENDING'].includes(String(t.status || '').toUpperCase())).length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <PageHeader 
                title="Home Care Manager Dashboard" 
                subtitle="Real-time operational metrics for home care services, caregiver assignments, and daily visit task execution."
            />

            {/* SECTION 1: TODAY'S VISIT OPERATIONS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#0F969C]" />
                            Today's Operational Visit Execution
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">
                            Live tracking of daily home care visits, active caregiver check-ins, and visit completion.
                        </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0F969C]/10 text-[#0F969C] dark:bg-[#0F969C]/20 dark:text-[#6DA5C0]">
                        Operational Tasks
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-5 flex items-center space-x-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3.5 rounded-2xl text-blue-600 dark:text-blue-400">
                            <CalendarClock className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8] font-semibold uppercase tracking-wider">Scheduled Visits</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {isLoadingTasks ? '-' : scheduledVisitsCount}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-5 flex items-center space-x-4">
                        <div className="bg-amber-50 dark:bg-amber-900/30 p-3.5 rounded-2xl text-amber-600 dark:text-amber-400">
                            <AlertCircle className="w-7 h-7 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8] font-semibold uppercase tracking-wider">Pending / Scheduled</p>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                {isLoadingTasks ? '-' : pendingVisitsCount}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-5 flex items-center space-x-4">
                        <div className="bg-cyan-50 dark:bg-cyan-900/30 p-3.5 rounded-2xl text-cyan-600 dark:text-cyan-400">
                            <Activity className="w-7 h-7 animate-bounce" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8] font-semibold uppercase tracking-wider">In Progress Visits</p>
                            <p className="text-2xl font-black text-[#0F969C] dark:text-[#6DA5C0]">
                                {isLoadingTasks ? '-' : inProgressVisitsCount}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-5 flex items-center space-x-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3.5 rounded-2xl text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8] font-semibold uppercase tracking-wider">Completed Visits</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {isLoadingTasks ? '-' : completedVisitsCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: ACTIVE HOME CARE SERVICES */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        <Home className="w-5 h-5 text-[#0F969C]" />
                        Active Home Care Service Status
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">
                        Ongoing client allocations, active service relationships, and caregiver staffing capacity.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-5 flex items-center space-x-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3.5 rounded-2xl text-blue-600 dark:text-blue-400">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8] font-semibold uppercase tracking-wider">Active Client Allocations</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {isLoadingAllocations ? '-' : activeAllocations.length}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-5 flex items-center space-x-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3.5 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <UserPlus className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8] font-semibold uppercase tracking-wider">Total Caregiver Staff</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {isLoadingStaff ? '-' : staffList.length}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-5 flex items-center space-x-4">
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-3.5 rounded-2xl text-purple-600 dark:text-purple-400">
                            <CheckCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8] font-semibold uppercase tracking-wider">Assigned Caregivers</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {isLoadingAllocations ? '-' : allocatedStaffCount}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-5 flex items-center space-x-4">
                        <div className="bg-teal-50 dark:bg-teal-900/30 p-3.5 rounded-2xl text-teal-600 dark:text-teal-400">
                            <Home className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8] font-semibold uppercase tracking-wider">Total Client Services</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {isLoadingAllocations ? '-' : homeCareAllocations.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Task Execution Overview */}
            <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Today's Operational Visit Tasks</h2>
                        <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">Real-time status of visit execution by assigned caregivers</p>
                    </div>
                </div>
                <div className="p-0">
                    {!taskList.length ? (
                        <div className="p-8 text-center text-gray-500 dark:text-[#B8D9E8] text-xs">
                            No scheduled operational visit tasks found for today.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-[#6DA5C0]/15">
                            {taskList.slice(0, 6).map((item: any) => {
                                const statusNorm = String(item.status || '').toUpperCase();
                                const isCompleted = statusNorm === 'COMPLETED';
                                const isInProgress = statusNorm === 'IN_PROGRESS';
                                const clientName = item.enquiry?.patientName || item.enquiry?.clientName || item.enquiry?.client?.name || 'Home Care Patient';
                                const caregiverName = item.assignedStaff ? `${item.assignedStaff.firstName} ${item.assignedStaff.lastName || ''}`.trim() : 'Assigned Caregiver';

                                return (
                                    <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{item.title} — <span className="text-[#0F969C]">{clientName}</span></p>
                                            <p className="text-gray-500 dark:text-[#B8D9E8] text-[11px] mt-0.5">
                                                Caregiver: <strong>{caregiverName}</strong> • Ref: {item.refNo || item.id}
                                                {item.completedAt && (
                                                    <span className="text-emerald-600 font-semibold ml-2">
                                                        • Completed: {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                                            isCompleted 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40' 
                                                : isInProgress 
                                                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/40 animate-pulse'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'
                                        }`}>
                                            {isCompleted ? 'COMPLETED' : isInProgress ? 'IN PROGRESS' : statusNorm || 'SCHEDULED'}
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

