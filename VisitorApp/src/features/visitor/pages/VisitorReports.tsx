import { useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable } from '../../../components/ui/DataTable';
import { Toast } from '../../../components/ui/Toast';
import type { ToastType } from '../../../components/ui/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorService } from '../services';
import { VisitorDetailsModal } from '../components/VisitorDetailsModal';

export function VisitorReports() {
    const queryClient = useQueryClient();
    const [viewingPass, setViewingPass] = useState<any>(null);

    // Toast State
    const [toastMessage, setToastMessage] = useState<{ message: string; type: ToastType } | null>(null);
    const showToast = (message: string, type: ToastType = 'info') => setToastMessage({ message, type });

    const { data: passes = [], isLoading } = useQuery({
        queryKey: ['visitor-passes'],
        queryFn: visitorService.getPasses
    });

    const checkoutMutation = useMutation({
        mutationFn: visitorService.checkoutPass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['visitor-passes'] });
            queryClient.invalidateQueries({ queryKey: ['visitorAnalytics'] });
            showToast('Visitor checked out successfully', 'success');
        },
        onError: (err: any) => showToast(err?.response?.data?.error || 'Failed to check out visitor', 'error')
    });

    const handleCheckout = (id: string) => {
        if (window.confirm("Are you sure you want to check out this visitor?")) {
            checkoutMutation.mutate(id);
        }
    };

    const columns = [
        { key: 'createdAt', header: 'Check-In', cell: (row: any) => row.checkInAt ? new Date(row.checkInAt).toLocaleString('en-GB') : new Date(row.createdAt).toLocaleString('en-GB') },
        { key: 'visitorName', header: 'Visitor Name', cell: (row: any) => row.visitor?.name || '-' },
        { key: 'contact', header: 'Contact', cell: (row: any) => row.visitor?.mobile || '-' },
        { key: 'patient', header: 'Visiting', cell: (row: any) => row.hostName || '-' },
        { key: 'purpose', header: 'Purpose', cell: (row: any) => row.purpose || '-' },
        { key: 'checkout', header: 'Check-Out', cell: (row: any) => row.checkOutAt ? new Date(row.checkOutAt).toLocaleString('en-GB') : 'Active' },
    ];

    const currentlyInside = passes.filter((p: any) => !p.checkOutAt);
    const exited = passes.filter((p: any) => p.checkOutAt);

    return (
        <div className="flex h-full flex-col overflow-y-auto pb-12 space-y-6">
            {toastMessage && (
                <Toast
                    message={toastMessage.message}
                    type={toastMessage.type}
                    onClose={() => setToastMessage(null)}
                />
            )}

            <PageHeader 
                title="Visitor Reports" 
                subtitle="Track and report on facility visits and traffic patterns."
            />
            <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">Currently Inside</h2>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Active</span>
                    </div>
                    <div className="p-0">
                        <DataTable
                            columns={columns}
                            data={currentlyInside}
                            isLoading={isLoading}
                            keyExtractor={(item: any) => item.id}
                            fullHeight={false}
                            actionsTitle="Actions"
                            actions={(row: any) => (
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setViewingPass(row)}
                                        className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors whitespace-nowrap"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleCheckout(row.id)}
                                        className="text-amber-600 hover:text-amber-900 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 transition-colors whitespace-nowrap"
                                    >
                                        Check Out
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">Exited / Checked Out</h2>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Completed</span>
                    </div>
                    <div className="p-0">
                        <DataTable
                            columns={columns}
                            data={exited}
                            isLoading={isLoading}
                            keyExtractor={(item: any) => item.id}
                            fullHeight={false}
                            actionsTitle="Actions"
                            actions={(row: any) => (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setViewingPass(row)}
                                        className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors whitespace-nowrap"
                                    >
                                        View
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                </div>

            </div>

            <VisitorDetailsModal viewingPass={viewingPass} onClose={() => setViewingPass(null)} />
        </div>
    );
}
