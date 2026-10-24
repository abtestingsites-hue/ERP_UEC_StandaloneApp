// @ts-nocheck
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Search, FileText, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { api } from '../../../lib/axios';
import { DataTable } from '../../../components/DataTable';
import { ClosureDialog } from '../components/ClosureDialog';

export default function Discharge() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
    const [isClosureOpen, setIsClosureOpen] = useState(false);

    const { data: admissions, isLoading } = useQuery({
        queryKey: ['admissions'],
        queryFn: async () => {
            const res = await api.get('/operations/admissions');
            return res.data?.data || [];
        }
    });

    const filteredAdmissions = admissions?.filter((a: any) => {
        const patientName = a.patient?.name?.toLowerCase() ?? '';
        const status = a.status?.toLowerCase() ?? '';
        const search = searchTerm.toLowerCase();

        return patientName.includes(search) || status.includes(search);
    }) || [];

    const { data: historyClosures, isLoading: isLoadingHistory, isError: isHistoryError } = useQuery({
        queryKey: ['closures', 'history'],
        queryFn: async () => {
            const res = await api.get('/closing-agreements?status=EXECUTED');
            return res.data?.data || [];
        }
    });

    const filteredHistory = historyClosures?.filter((c: any) => {
        const patientName = c.admission?.patient?.name?.toLowerCase() ?? '';
        const search = searchTerm.toLowerCase();
        return patientName.includes(search);
    }) || [];

    const handleActionClick = (admission: any) => {
        setSelectedAdmission(admission);
        setIsClosureOpen(true);
    };

    const columns = [
        {
            key: 'patientName',
            header: 'Patient Name',
            cell: (row: any) => (
                <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{row.patient?.name}</div>
                    <div className="text-xs text-gray-500">{row.patient?.phone}</div>
                </div>
            )
        },
        {
            key: 'admittedAt',
            header: 'Admission Date',
            cell: (row: any) => new Date(row.admittedAt).toLocaleDateString()
        },
        {
            key: 'location',
            header: 'Location',
            cell: (row: any) => `${row.floor || '-'} / ${row.room || '-'} / ${row.bed || '-'}`
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row: any) => (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {row.status.replace(/_/g, ' ')}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (row: any) => {
                if (row.status === 'DISCHARGED') {
                    return <span className="text-gray-400 text-sm">Discharged</span>;
                }

                return (
                    <button
                        onClick={() => handleActionClick(row)}
                        className="flex items-center gap-1 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Manage Closure
                    </button>
                );
            }
        }
    ];

    const historyColumns = [
        {
            key: 'patientName',
            header: 'Patient Name',
            cell: (row: any) => (
                <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{row.admission?.patient?.name}</div>
                    <div className="text-xs text-gray-500">{row.admission?.patient?.phone}</div>
                </div>
            )
        },
        {
            key: 'executedAt',
            header: 'Discharge Date',
            cell: (row: any) => new Date(row.updatedAt).toLocaleDateString()
        },
        {
            key: 'closingRemarks',
            header: 'Closing Remarks',
            cell: (row: any) => row.closingRemarks || 'Closure executed successfully'
        },
        {
            key: 'status',
            header: 'Final Status',
            cell: () => (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle className="h-3 w-3" /> EXECUTED
                </span>
            )
        }
    ];

    return (
        <div className="flex-1 overflow-auto bg-gray-50/50 p-6 dark:bg-[#0A2429]">
            <PageHeader
                title="Resident Discharge & Service Closure"
                subtitle="Initiate, clear multi-department requirements, and execute resident discharge agreements."
                breadcrumbs={[{ label: 'Resident Management' }, { label: 'Discharge & Closure' }]}
            />

            {/* Navigation Tabs */}
            <div className="mt-6 flex items-center border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
                        activeTab === 'pending'
                            ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                >
                    Active Admissions ({filteredAdmissions.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
                        activeTab === 'history'
                            ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                >
                    Discharge History ({filteredHistory.length})
                </button>
            </div>

            {/* Filter */}
            <div className="mt-4 flex items-center justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search resident name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-teal-500 dark:bg-black dark:border-gray-700 dark:text-white"
                    />
                </div>
            </div>

            {/* Tables */}
            <div className="mt-6">
                {activeTab === 'pending' ? (
                    <DataTable
                        data={filteredAdmissions}
                        columns={columns}
                        keyExtractor={(row) => row.id}
                        isLoading={isLoading}
                    />
                ) : (
                    <DataTable
                        data={filteredHistory}
                        columns={historyColumns}
                        keyExtractor={(row) => row.id}
                        isLoading={isLoadingHistory}
                    />
                )}
            </div>

            {/* Service Closure Dialog Modal */}
            <ClosureDialog
                admission={selectedAdmission}
                isOpen={isClosureOpen}
                onClose={() => setIsClosureOpen(false)}
            />
        </div>
    );
}
