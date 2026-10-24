import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { useAllocations } from '../hooks/useAllocations';
import { AssignCaregiverModal } from '../components/AssignCaregiverModal';
import { Search, UserPlus, UserCheck, HeartHandshake, Home, Calendar, ShieldCheck, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function StaffAllocations() {
    const {
        allocations,
        unallocatedAdmissions,
        isLoadingAllocations,
        staff,
        createAllocation,
        updateAllocation
    } = useAllocations();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [selectedAllocation, setSelectedAllocation] = useState<any>(null);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    const filteredAllocations = allocations.filter((item: any) => {
        const clientName = item.resolvedPatient?.name || item.clientName || item.enquiry?.client?.name || '';
        const staffName = item.staff ? `${item.staff.firstName || ''} ${item.staff.lastName || ''}`.trim() : '';
        const query = searchQuery.toLowerCase();

        const matchesSearch = clientName.toLowerCase().includes(query) ||
            staffName.toLowerCase().includes(query) ||
            (item.refNo && item.refNo.toLowerCase().includes(query));

        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleAssignSubmit = async (payload: any) => {
        if (selectedAllocation && (selectedAllocation.staffId || selectedAllocation.staff?.id)) {
            // Reassign / Update
            await updateAllocation({
                id: selectedAllocation.id,
                payload: {
                    staffId: payload.staffId,
                    startDate: payload.startDate,
                    endDate: payload.endDate,
                    status: 'ALLOCATED',
                    metadata: payload.metadata
                }
            });
        } else {
            // Create new allocation
            await createAllocation(payload);
        }
    };

    const handleOpenInitialAssign = (target?: any) => {
        setSelectedAllocation(target || null);
        setIsAssignOpen(true);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Staff Allocations"
                    subtitle="Assign caregivers to home care clients and manage active staff duty allocations."
                />
                <button
                    onClick={() => handleOpenInitialAssign()}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#0F969C] hover:bg-[#0C7075] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>+ Assign Caregiver</span>
                </button>
            </div>

            {/* Unallocated Active Contracts Banner / Section */}
            {unallocatedAdmissions.length > 0 && (
                <div className="bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl p-5 border border-amber-500/20 space-y-4">
                    <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                        <AlertCircle className="w-5 h-5" />
                        <span>Active Contracts Awaiting Caregiver Staff Allocation ({unallocatedAdmissions.length})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unallocatedAdmissions.map((adm: any) => {
                            const pName = adm.patient?.name || adm.enquiry?.client?.name || 'Home Care Patient';
                            const contract = adm.serviceContract;
                            return (
                                <div key={adm.id} className="bg-white dark:bg-[#072E33] p-4 rounded-xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                {contract?.contractNumber || 'ACTIVE CONTRACT'}
                                            </span>
                                            <h4 className="font-bold text-gray-900 dark:text-white mt-1 text-base">
                                                {pName}
                                            </h4>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                            Awaiting Staff
                                        </span>
                                    </div>

                                    <div className="text-xs space-y-1 text-gray-600 dark:text-[#B8D9E8]">
                                        <p><span className="font-semibold text-gray-900 dark:text-white">Service:</span> {adm.enquiry?.service?.name || 'Home Care Service'}</p>
                                        <p><span className="font-semibold text-gray-900 dark:text-white">Shift:</span> {contract?.shift || '12 Hours Day'} ({contract?.frequency || 'Daily'})</p>
                                        <p><span className="font-semibold text-gray-900 dark:text-white">Staff Needed:</span> {contract?.staffRequired || 1} Caregiver</p>
                                        {contract?.servicePrice && (
                                            <p className="font-bold text-[#0F969C]">Price: ₹{contract.servicePrice.toLocaleString('en-IN')} / {contract.billingCycle || 'Monthly'}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleOpenInitialAssign(adm)}
                                        className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#0F969C] hover:bg-[#0C7075] text-white text-xs font-bold rounded-xl shadow transition-colors"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>Assign Caregiver</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-[#072E33] p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search client, caregiver, or ref..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-gray-50 dark:bg-[#0B2A30] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#0F969C]"
                    />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
                    {['ALL', 'ALLOCATED', 'ACTIVE', 'PENDING', 'COMPLETED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                                statusFilter === status
                                    ? 'bg-[#0F969C] text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-[#B8D9E8] hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            {status === 'ALL' ? 'All Statuses' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Allocations Table */}
            <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden">
                {isLoadingAllocations ? (
                    <div className="p-12 text-center text-[#0F969C] font-bold animate-pulse flex flex-col items-center">
                        <HeartHandshake className="w-10 h-10 mb-2 animate-bounce" />
                        <span>Loading Home Care staff allocations...</span>
                    </div>
                ) : !filteredAllocations.length ? (
                    <div className="p-12 text-center text-gray-500 dark:text-[#B8D9E8] space-y-2">
                        <p className="font-bold text-base">No active home care staff allocations found.</p>
                        <p className="text-xs text-gray-400">
                            {unallocatedAdmissions.length > 0
                                ? 'Use the "Assign Caregiver" button above to assign staff to active contracts.'
                                : 'All active home care service contracts currently have staff allocated.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 dark:bg-white/5 text-xs text-gray-500 dark:text-[#B8D9E8] uppercase font-bold border-b border-gray-100 dark:border-[#6DA5C0]/15">
                                <tr>
                                    <th className="p-4">Allocation Ref & Client</th>
                                    <th className="p-4">Home Care Service</th>
                                    <th className="p-4">Assigned Caregiver</th>
                                    <th className="p-4">Duty Schedule</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#6DA5C0]/15">
                                {filteredAllocations.map((item: any) => {
                                    const clientName = item.resolvedPatient?.name || item.clientName || item.enquiry?.client?.name || 'Home Care Prospect';
                                    const staffName = item.staff
                                        ? `${item.staff.firstName || ''} ${item.staff.lastName || ''}`.trim()
                                        : null;

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs font-mono font-bold text-[#0F969C] bg-[#0F969C]/10 px-2 py-0.5 rounded">
                                                        {item.refNo || item.id?.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-gray-900 dark:text-white mt-1">
                                                    {clientName}
                                                </p>
                                                {item.enquiry?.refNo && (
                                                    <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">
                                                        Enquiry Ref: {item.enquiry.refNo}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="p-4 text-xs text-gray-700 dark:text-gray-200">
                                                <div className="flex items-center space-x-1.5 font-bold">
                                                    <Home className="w-3.5 h-3.5 text-[#0F969C]" />
                                                    <span>{item.enquiry?.service?.name || item.service || 'Home Visit Duty'}</span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-xs font-semibold text-gray-900 dark:text-white">
                                                {staffName ? (
                                                    <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                                                        <ShieldCheck className="w-4 h-4" />
                                                        <span>{staffName} ({item.staff?.empId || 'Caregiver'})</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-amber-600 dark:text-amber-400 font-bold italic">Unassigned</span>
                                                )}
                                            </td>

                                            <td className="p-4 text-xs text-gray-500 dark:text-[#B8D9E8]">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{item.startDate ? format(new Date(item.startDate), 'MMM dd, yyyy') : 'Immediate'}</span>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    item.status === 'ALLOCATED' || item.status === 'ACTIVE'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : item.status === 'COMPLETED'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                    {item.status || 'PENDING'}
                                                </span>
                                            </td>

                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAllocation(item);
                                                        setIsAssignOpen(true);
                                                    }}
                                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0F969C] hover:bg-[#0C7075] text-white text-xs font-bold rounded-xl shadow transition-colors"
                                                >
                                                    {staffName ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                                                    <span>{staffName ? 'Reassign' : 'Assign Staff'}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AssignCaregiverModal
                isOpen={isAssignOpen}
                onClose={() => setIsAssignOpen(false)}
                allocation={selectedAllocation}
                unallocatedList={unallocatedAdmissions}
                staffList={staff}
                onAssign={handleAssignSubmit}
            />
        </div>
    );
}

