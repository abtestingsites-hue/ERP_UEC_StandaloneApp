import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { useClients } from '../hooks/useClients';
import { ClientDetailsDrawer } from '../components/ClientDetailsDrawer';
import { Search, Eye, Phone, HeartHandshake, Home } from 'lucide-react';

export default function Clients() {
    const { clients, isLoading } = useClients();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const filteredClients = clients.filter((c: any) => {
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
                title="Home Care Clients"
                subtitle="Directory of active home care clients, care assignments, and service admissions."
            />

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-[#072E33] p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search client, patient, or mobile..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-gray-50 dark:bg-[#0B2A30] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#0F969C]"
                    />
                </div>

                <div className="text-xs text-gray-500 dark:text-[#B8D9E8] font-bold">
                    Total Active Home Care Clients: {filteredClients.length}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-[#0F969C] font-bold animate-pulse flex flex-col items-center">
                        <HeartHandshake className="w-10 h-10 mb-2 animate-bounce" />
                        <span>Loading Home Care clients...</span>
                    </div>
                ) : !filteredClients.length ? (
                    <div className="p-12 text-center text-gray-500 dark:text-[#B8D9E8]">
                        No home care clients found matching your search.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 dark:bg-white/5 text-xs text-gray-500 dark:text-[#B8D9E8] uppercase font-bold border-b border-gray-100 dark:border-[#6DA5C0]/15">
                                <tr>
                                    <th className="p-4">Client Details</th>
                                    <th className="p-4">Patient Name</th>
                                    <th className="p-4">Home Care Service</th>
                                    <th className="p-4">Assigned Caregiver</th>
                                    <th className="p-4">Status</th>
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
                                            <p className="text-gray-400 text-[11px] mt-0.5">{item.contract}</p>
                                        </td>

                                        <td className="p-4 text-xs font-semibold text-gray-900 dark:text-white">
                                            {item.staffName}
                                        </td>

                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#0F969C]/15 text-[#0F969C]">
                                                {item.status}
                                            </span>
                                        </td>

                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedClient(item);
                                                    setIsDetailsOpen(true);
                                                }}
                                                title="View Client Details"
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
