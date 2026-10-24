import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../components/PageHeader';
import { api } from '../../../lib/axios';
import { Home, CalendarClock, Activity, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomeCareStaffDashboard() {
    const { data: homeCareAllocations = [], isLoading: isLoadingAllocations } = useQuery({
        queryKey: ['homecare-staff-allocations'],
        queryFn: async () => {
            const res = await api.get('/allocation/home-care');
            return res.data?.data || res.data || [];
        },
        retry: false
    });

    const { data: myTasks = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ['homecare-staff-dashboard-tasks'],
        queryFn: async () => {
            const res = await api.get('/tasks?scope=mine&homeCare=true');
            return res.data?.data || res.data || [];
        },
        retry: false
    });

    const isLoading = isLoadingAllocations || isLoadingTasks;

    if (isLoading) {
        return (
            <div className="flex flex-col h-full">
                <PageHeader title="Home Care Dashboard" subtitle="Overview of your home visits and caregiver duties." />
                <div className="flex flex-col items-center justify-center py-20 text-[#0F969C]">
                    <Activity className="h-10 w-10 animate-bounce mb-3" />
                    <p className="text-sm font-bold animate-pulse">Loading Home Care dashboard...</p>
                </div>
            </div>
        );
    }

    const assignedVisitsCount = myTasks.filter((t: any) => ['ASSIGNED', 'PENDING', 'IN_PROGRESS'].includes(String(t.status || '').toUpperCase())).length;
    const completedVisitsCount = myTasks.filter((t: any) => String(t.status || '').toUpperCase() === 'COMPLETED').length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <PageHeader 
                title="Home Care Dashboard" 
                subtitle="Overview of your home care visits, active client duties, and daily visit task completions."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#072E33] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Home className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Active Home Care Clients</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{homeCareAllocations.length}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <CalendarClock className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Active / Scheduled Visits</p>
                        <p className="text-3xl font-black text-[#0F969C]">
                            {assignedVisitsCount}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 flex items-center space-x-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Completed Visits</p>
                        <p className="text-3xl font-black text-emerald-600">
                            {completedVisitsCount}
                        </p>
                    </div>
                </div>
            </div>

            {/* Active Visits & Tasks Card */}
            <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Today's Visits & Client Duties</h2>
                        <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">Track visit progress, check-in, record care delivery, and check-out</p>
                    </div>
                    <Link to="/my-visits" className="text-xs font-bold text-[#0F969C] hover:underline">
                        View All Visits →
                    </Link>
                </div>
                <div className="p-0">
                    {!myTasks.length ? (
                        <div className="p-8 text-center text-gray-500 dark:text-[#B8D9E8] text-xs">
                            No active home care visit duties assigned today.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-[#6DA5C0]/15">
                            {myTasks.slice(0, 5).map((item: any) => {
                                const statusNorm = String(item.status || '').toUpperCase();
                                const isCompleted = statusNorm === 'COMPLETED';
                                const isInProgress = statusNorm === 'IN_PROGRESS';
                                const clientName = item.enquiry?.patientName || item.enquiry?.clientName || 'Home Care Patient';

                                return (
                                    <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{item.title} — <span className="text-[#0F969C]">{clientName}</span></p>
                                            <p className="text-gray-500 dark:text-[#B8D9E8] text-[11px] mt-0.5">
                                                Ref: {item.refNo || item.id}
                                                {item.completedAt && (
                                                    <span className="text-emerald-600 font-semibold ml-2">
                                                        • Completed at: {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                                                isCompleted 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40' 
                                                    : isInProgress 
                                                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/40 animate-pulse'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'
                                            }`}>
                                                {isCompleted ? 'COMPLETED' : isInProgress ? 'IN PROGRESS' : statusNorm || 'SCHEDULED'}
                                            </span>
                                            <Link
                                                to={`/visits/${item.id}`}
                                                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-[#0F969C] text-white hover:bg-[#0C7B80] transition-colors"
                                            >
                                                Open Visit
                                            </Link>
                                        </div>
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

