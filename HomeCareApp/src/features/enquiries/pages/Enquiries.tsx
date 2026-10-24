import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { useEnquiries } from '../hooks/useEnquiries';
import { EnquiryFormModal } from '../components/EnquiryFormModal';
import { EnquiryDetailsDrawer } from '../components/EnquiryDetailsDrawer';
import { ConvertAdmissionModal } from '../../../components/ConvertAdmissionModal';
import { Plus, Search, Eye, Edit2, UserCheck, Phone, MapPin, Calendar, HeartHandshake } from 'lucide-react';
import { format } from 'date-fns';

export default function Enquiries() {
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const { enquiries, isLoading, createEnquiry, updateEnquiry, refetch } = useEnquiries(statusFilter, searchQuery);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isConvertOpen, setIsConvertOpen] = useState(false);

    const handleCreateSubmit = async (payload: any) => {
        await createEnquiry(payload);
    };

    const handleEditSubmit = async (payload: any) => {
        if (!selectedEnquiry) return;
        await updateEnquiry({ id: selectedEnquiry.id, payload });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <PageHeader
                title="Home Care Enquiries"
                subtitle="Manage incoming home care prospects, care needs, and intake pipeline."
                action={
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#0F969C] hover:bg-[#0C7075] text-white text-sm font-bold rounded-xl shadow-md transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Enquiry</span>
                    </button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-[#072E33] p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search client, mobile, or ref..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-gray-50 dark:bg-[#0B2A30] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#0F969C]"
                    />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
                    {['ALL', 'Open', 'In Progress', 'Converted', 'Lost'].map((status) => (
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

            {/* Table / List View */}
            <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-[#0F969C] font-bold animate-pulse flex flex-col items-center">
                        <HeartHandshake className="w-10 h-10 mb-2 animate-bounce" />
                        <span>Loading Home Care enquiries...</span>
                    </div>
                ) : !enquiries.length ? (
                    <div className="p-12 text-center text-gray-500 dark:text-[#B8D9E8]">
                        No home care enquiries found matching your search.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 dark:bg-white/5 text-xs text-gray-500 dark:text-[#B8D9E8] uppercase font-bold border-b border-gray-100 dark:border-[#6DA5C0]/15">
                                <tr>
                                    <th className="p-4">Ref & Client</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4">Care Requirements</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#6DA5C0]/15">
                                {enquiries.map((item: any) => {
                                    let meta: any = {};
                                    if (typeof item.rawMessage === 'string') {
                                        try { meta = JSON.parse(item.rawMessage); } catch {}
                                    } else if (typeof item.rawMessage === 'object' && item.rawMessage !== null) {
                                        meta = item.rawMessage;
                                    }
                                    const reqs = item.serviceRequirements || {};

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs font-mono font-bold text-[#0F969C] bg-[#0F969C]/10 px-2 py-0.5 rounded">
                                                        {item.refNo || item.id?.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-gray-900 dark:text-white mt-1">
                                                    {item.client?.name || item.clientName || 'Home Care Prospect'}
                                                </p>
                                                {meta.patientName && (
                                                    <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">
                                                        Patient: {meta.patientName} {meta.patientAge ? `(${meta.patientAge}y)` : ''}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="p-4">
                                                {item.client?.mobile && (
                                                    <p className="flex items-center space-x-1.5 text-xs text-gray-700 dark:text-gray-200">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{item.client.mobile}</span>
                                                    </p>
                                                )}
                                                {(item.client?.address || meta.clientLocation) && (
                                                    <p className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-[#B8D9E8] mt-1">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="truncate max-w-[150px]">{item.client?.address || meta.clientLocation}</span>
                                                    </p>
                                                )}
                                            </td>

                                            <td className="p-4">
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                                    {reqs.shift || '12 Hours Day'} • {reqs.staffRequired || 1} Caregiver(s)
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">
                                                    {reqs.frequency || 'Daily'}
                                                </p>
                                            </td>

                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    item.isConverted || item.status === 'Converted'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : item.status === 'In Progress'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                    {item.isConverted ? 'Converted' : (item.status || 'Open')}
                                                </span>
                                            </td>

                                            <td className="p-4 text-xs text-gray-500 dark:text-[#B8D9E8]">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : 'N/A'}</span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-right space-x-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedEnquiry(item);
                                                        setIsDetailsOpen(true);
                                                    }}
                                                    title="View Details"
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#0F969C] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedEnquiry(item);
                                                        setIsEditOpen(true);
                                                    }}
                                                    title="Edit Enquiry"
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {!item.isConverted && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedEnquiry(item);
                                                            setIsConvertOpen(true);
                                                        }}
                                                        title="Convert to Admission"
                                                        className="p-1.5 rounded-lg text-[#0F969C] hover:bg-[#0F969C]/10 transition-colors"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals & Drawers */}
            <EnquiryFormModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreateSubmit}
            />

            <EnquiryFormModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleEditSubmit}
                initialData={selectedEnquiry}
            />

            <EnquiryDetailsDrawer
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                enquiry={selectedEnquiry}
                onConvertClick={() => {
                    setIsDetailsOpen(false);
                    setIsConvertOpen(true);
                }}
            />

            <ConvertAdmissionModal
                isOpen={isConvertOpen}
                onClose={() => setIsConvertOpen(false)}
                enquiry={selectedEnquiry}
                onSuccess={() => {
                    refetch();
                }}
            />
        </div>
    );
}
