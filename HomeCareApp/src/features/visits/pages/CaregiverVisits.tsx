import { useState, useMemo } from 'react';
import { RefreshCw, AlertCircle, CheckSquare, Search, Filter } from 'lucide-react';
import { useVisits } from '../hooks/useVisits';
import { VisitCard } from '../components/VisitCard';

export default function CaregiverVisits() {
    const { visits, isLoading, error, refetch, updateStatus } = useVisits();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    let errorMessage = "Unable to load Home Care visits. Please try again.";
    if (error) {
        const anyError = error as any;
        const status = anyError.response?.status;
        const code = anyError.response?.data?.code;

        if (code === 'PASSWORD_CHANGE_REQUIRED') {
            errorMessage = "Password change required before accessing Home Care visits.";
        } else if (status === 401) {
            errorMessage = "Your session has expired. Please log in again.";
        } else if (status === 403) {
            errorMessage = "You do not have permission to access Home Care visits.";
        }
    }

    const filteredVisits = useMemo(() => {
        return visits.filter((v) => {
            const title = v.title || '';
            const clientName = v.enquiry?.patientName || v.enquiry?.clientName || '';
            const refNo = v.refNo || '';

            const matchesSearch =
                title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                refNo.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'ALL' ||
                String(v.status || '').toUpperCase() === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [visits, searchQuery, statusFilter]);

    const activeCount = visits.filter((v) => String(v.status || '').toUpperCase() === 'IN_PROGRESS').length;
    const pendingCount = visits.filter((v) => ['ASSIGNED', 'PENDING'].includes(String(v.status || '').toUpperCase())).length;
    const completedCount = visits.filter((v) => String(v.status || '').toUpperCase() === 'COMPLETED').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#072E33] p-6 rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                        <CheckSquare className="w-6 h-6 text-[#0F969C]" />
                        My Care Visits & Operational Tasks
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        View scheduled Home Care visit duties, check-in to start visit, record care delivery, and complete visit check-out.
                    </p>
                </div>

                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Visits
                </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#072E33] p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Pending / Scheduled</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white">{pendingCount}</span>
                </div>

                <div className="bg-white dark:bg-[#072E33] p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">In Progress (Active)</span>
                    <span className="text-xl font-black text-[#0F969C]">{activeCount}</span>
                </div>

                <div className="bg-white dark:bg-[#072E33] p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Completed</span>
                    <span className="text-xl font-black text-emerald-600">{completedCount}</span>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search visit title, client name, ref #..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-800 dark:text-gray-200"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ASSIGNED">Scheduled / Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Visits List */}
            {isLoading ? (
                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-8 border border-gray-100 dark:border-[#6DA5C0]/15 text-center">
                    <div className="w-8 h-8 border-4 border-[#0F969C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Loading your visits...</p>
                </div>
            ) : error ? (
                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-12 border border-red-100 dark:border-red-900/30 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">{errorMessage}</h3>
                </div>
            ) : filteredVisits.length === 0 ? (
                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-12 border border-gray-100 dark:border-[#6DA5C0]/15 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Care Visits Found</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                        No Home Care visit tasks match your current filter criteria.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredVisits.map((visit) => (
                        <VisitCard
                            key={visit.id}
                            visit={visit}
                            onUpdateStatus={(id, payload) => updateStatus({ id, payload })}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
