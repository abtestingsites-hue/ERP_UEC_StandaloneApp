import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { useClients } from '../hooks/useClients';
import { useAuthStore } from '../../../store/authStore';
import { ClientDetailsDrawer } from '../components/ClientDetailsDrawer';
import { Search, Eye, Phone, Home, HeartHandshake, ShieldCheck } from 'lucide-react';

export default function MyClients() {
    const { user } = useAuthStore();
    const { clients, isLoading } = useClients();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Strict Caregiver Isolation Rule:
    // Filter allocations strictly matching the logged-in staff/user ID
    const myAssignedClients = clients.filter((c: any) => {
        const itemStaffId = c.staffId || c.raw?.staffId;
        const currentUserId = user?.staffId || user?.empId || user?.id;

        // If staff ID is available, match strictly. If user is super admin testing, allow.
        const isAssignedToMe = itemStaffId && currentUserId && (itemStaffId === currentUserId || itemStaffId === user?.id);
        const isSuperAdmin = user?.role === 'SUPER_ADMIN' || (typeof user?.role === 'object' && user?.role?.name === 'SUPER_ADMIN');

        return isAssignedToMe || isSuperAdmin;
    });

    const filteredClients = myAssignedClients.filter((c: any) => {
        const query = searchQuery.toLowerCase();
        return (
            (c.clientName && c.clientName.toLowerCase().includes(query)) ||
            (c.patientName && c.patientName.toLowerCase().includes(query)) ||
            (c.mobile && c.mobile.includes(query)) ||
            (c.service && c.service.toLowerCase().includes(query))
        );
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <PageHeader
                title="My Home Care Clients"
                subtitle="View clients and home care duties assigned directly to you."
            />

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-[#072E33] p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search my clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-gray-50 dark:bg-[#0B2A30] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#0F969C]"
                    />
                </div>

                <div className="flex items-center space-x-2 text-xs font-bold text-[#0F969C] bg-[#0F969C]/10 px-3 py-1.5 rounded-xl">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Assigned Clients: {filteredClients.length}</span>
                </div>
            </div>

            {/* Client List */}
            <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-[#0F969C] font-bold animate-pulse flex flex-col items-center">
                        <HeartHandshake className="w-10 h-10 mb-2 animate-bounce" />
                        <span>Loading your assigned clients...</span>
                    </div>
                ) : !filteredClients.length ? (
                    <div className="p-12 text-center text-gray-500 dark:text-[#B8D9E8]">
                        No home care clients currently assigned to your profile.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 dark:bg-white/5 text-xs text-gray-500 dark:text-[#B8D9E8] uppercase font-bold border-b border-gray-100 dark:border-[#6DA5C0]/15">
                                <tr>
                                    <th className="p-4">Client Details</th>
                                    <th className="p-4">Patient Name</th>
                                    <th className="p-4">Assigned Service</th>
                                    <th className="p-4">Duty Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#6DA5C0]/15">
                                {filteredClients.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900 dark:text-white">{item.clientName}</p>
                                            {item.mobile && item.mobile !== '-' && (
                                                <p className="flex items-center space-x-1 text-xs text-gray-500 dark:text-[#B8D9E8] mt-0.5">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    <span>{item.mobile}</span>
                                                </p>
                                            )}
                                        </td>

                                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                                            {item.patientName}
                                        </td>

                                        <td className="p-4 text-xs text-gray-700 dark:text-gray-200">
                                            <div className="flex items-center space-x-1.5 font-bold">
                                                <Home className="w-3.5 h-3.5 text-[#0F969C]" />
                                                <span>{item.service}</span>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                {item.status}
                                            </span>
                                        </td>

                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedClient(item);
                                                    setIsDetailsOpen(true);
                                                }}
                                                title="View Details"
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-[#0F969C] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ClientDetailsDrawer
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                client={selectedClient}
            />
        </div>
    );
}
