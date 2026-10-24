import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, User, Phone, AlertCircle } from 'lucide-react';
import { DutyStatusBadge } from './DutyStatusBadge';

interface ManagerRosterGridProps {
    assignments: any[];
    tasks: any[];
    allocations: any[];
    isLoading: boolean;
}

export const ManagerRosterGrid: React.FC<ManagerRosterGridProps> = ({
    assignments,
    tasks = [],
    allocations: _allocations,
    isLoading
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const filteredAssignments = useMemo(() => {
        return assignments.filter((item) => {
            const staffName =
                (item.staff?.firstName ? `${item.staff.firstName} ${item.staff.lastName || ''}`.trim() : null) ||
                item.staff?.fullName ||
                item.staff?.user?.name ||
                item.staffName ||
                '';
            const patientName = item.patient?.name || item.patientName || '';
            const assignmentNo = item.refNo || item.assignmentNo || '';
            const itemStatus = String(item.status || '').toUpperCase();

            const matchesSearch =
                staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                assignmentNo.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' && ['ACTIVE', 'ASSIGNED', 'IN_PROGRESS'].includes(itemStatus)) ||
                itemStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [assignments, searchQuery, statusFilter]);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-[#072E33] rounded-2xl p-8 border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm text-center">
                <div className="w-8 h-8 border-4 border-[#0F969C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Loading Manager Roster Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Filter by caregiver, client name, or assignment #..."
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
                        <option value="ALL">All Assignment Statuses</option>
                        <option value="ACTIVE">Active Duty</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>
            </div>

            {/* Roster Table / Grid */}
            {filteredAssignments.length === 0 ? (
                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-12 border border-gray-100 dark:border-[#6DA5C0]/15 text-center">
                    <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No Roster Assignments Found</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                        No active or scheduled caregiver assignments match your filter criteria.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#072E33] rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5">Caregiver / Staff</th>
                                    <th className="px-5 py-3.5">Client / Patient</th>
                                    <th className="px-5 py-3.5">Duty Period</th>
                                    <th className="px-5 py-3.5">Assignment Status</th>
                                    <th className="px-5 py-3.5">Today's Visit Task</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                {filteredAssignments.map((item) => {
                                    const staffName =
                                        (item.staff?.firstName ? `${item.staff.firstName} ${item.staff.lastName || ''}`.trim() : null) ||
                                        item.staff?.fullName ||
                                        item.staff?.user?.name ||
                                        item.staffName ||
                                        'Unassigned Staff';
                                    const staffDesig = item.staff?.designation || 'Caregiver';
                                    const patientName = item.patient?.name || item.patientName || 'Client';
                                    const patientMobile = item.patient?.mobile || item.mobile || '';
                                    const startDate = item.startAt ? new Date(item.startAt).toLocaleDateString() : item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A';
                                    const endDate = item.endAt ? new Date(item.endAt).toLocaleDateString() : item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Ongoing';

                                    // Find associated visit task for this caregiver/patient
                                    const relatedTask = tasks.find((t: any) => 
                                        (t.assignedStaffId && t.assignedStaffId === item.staffId) ||
                                        (t.enquiry?.admission?.patientId && t.enquiry?.admission?.patientId === item.patientId)
                                    );
                                    const taskStatus = relatedTask ? relatedTask.status : null;

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <User className="w-4 h-4 text-[#0F969C]" />
                                                    {staffName}
                                                </div>
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                                                    {staffDesig}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {patientName}
                                                </div>
                                                {patientMobile && (
                                                    <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        {patientMobile}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-[#0F969C]" />
                                                    {startDate} – {endDate}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <DutyStatusBadge status={item.status || 'ACTIVE'} />
                                            </td>

                                            <td className="px-5 py-4">
                                                {taskStatus ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <DutyStatusBadge status={taskStatus} />
                                                        {relatedTask?.completedAt && (
                                                            <span className="text-[10px] text-emerald-600 font-semibold block">
                                                                Done: {new Date(relatedTask.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-[11px]">No Visit Scheduled</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
