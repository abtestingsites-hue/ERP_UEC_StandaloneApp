import { useState } from 'react';
import { Search, History as HistoryIcon, MessageSquare, Star, DollarSign } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { StatusHighlighter } from '../../../components/StatusHighlighter';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { Modal } from '../../../components/Modal';
import { useServiceHistory, useRecordServiceFeedback } from '../hooks/useCustomerCare';
import type { ServiceHistoryItem } from '../services/customerCareService';

export function ServiceHistory() {
    const { data: history = [], isLoading, error } = useServiceHistory();
    const recordFeedback = useRecordServiceFeedback();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedService, setSelectedService] = useState<ServiceHistoryItem | null>(null);
    const [rating, setRating] = useState('5');
    const [comments, setComments] = useState('');

    const filteredHistory = history.filter((item) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return [
            item.ref,
            item.allocationRef,
            item.service,
            item.clientName,
            item.patientName,
            item.status,
            item.paymentStatus,
            item.invoiceNo,
            item.receiptNo,
            item.feedbackStatus
        ].some((val) => String(val || '').toLowerCase().includes(query));
    });

    const handleOpenFeedbackModal = (item: ServiceHistoryItem) => {
        setSelectedService(item);
        setRating(String(item.feedbackRating || 5));
        setComments(item.feedbackComments || '');
    };

    const handleFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService) return;

        recordFeedback.mutate(
            {
                allocationId: selectedService.id,
                data: {
                    rating: Number(rating),
                    comments
                }
            },
            {
                onSuccess: () => {
                    setSelectedService(null);
                }
            }
        );
    };

    return (
        <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-5">
            <PageHeader
                title="Client Service History & Care Audit"
                subtitle="View historical patient care allocations, billing references, and satisfaction ratings."
                icon={HistoryIcon}
            />

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search service history by Ref No, Client Name, Service, Invoice..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Service History Table */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <LoadingState message="Loading client service history..." />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-rose-500 font-semibold">
                        Failed to fetch service history records. Please retry.
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title="No Service History Found"
                            description="No historical care allocation records match your search query."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-4">Client Ref No</th>
                                    <th className="py-3.5 px-4">Service</th>
                                    <th className="py-3.5 px-4">Client Name</th>
                                    <th className="py-3.5 px-4">Allocated Status</th>
                                    <th className="py-3.5 px-4">Billing & Receipt</th>
                                    <th className="py-3.5 px-4">Payment</th>
                                    <th className="py-3.5 px-4">Feedback Rating</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.ref || item.allocationRef || '-'}</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{item.service || '-'}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">{item.clientName || '-'}</td>
                                        <td className="py-3.5 px-4">
                                            <StatusHighlighter value={item.status} />
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            <div>Invoice: {item.invoiceNo || '-'}</div>
                                            <div className="text-slate-400">Receipt: {item.receiptNo || '-'}</div>
                                            {item.paidAmount !== undefined && (
                                                <div className="text-emerald-600 font-bold mt-0.5">${Number(item.paidAmount).toFixed(2)} paid</div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <StatusHighlighter value={item.paymentStatus || 'PENDING'} />
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-1">
                                                <StatusHighlighter value={item.feedbackStatus || 'PENDING'} />
                                                {item.feedbackRating && (
                                                    <div className="flex items-center gap-1 text-xs font-extrabold text-amber-500">
                                                        <Star className="h-3.5 w-3.5 fill-amber-400" /> {item.feedbackRating} / 5
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {item.feedbackStatus === 'COLLECTED' ? (
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Recorded</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleOpenFeedbackModal(item)}
                                                    disabled={item.paymentStatus !== 'PAID'}
                                                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" /> Feedback
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Feedback Modal */}
            {selectedService && (
                <Modal isOpen={Boolean(selectedService)} onClose={() => setSelectedService(null)} title="Final Customer Closure Feedback">
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-2">
                        <div className="rounded-xl border border-indigo-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-slate-950 p-3.5">
                            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{selectedService.clientName || 'Client'}</p>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedService.ref} - {selectedService.service}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Service Rating (1 to 5 Stars)</label>
                            <select
                                value={rating}
                                onChange={(e) => setRating(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 font-bold outline-none focus:border-indigo-500"
                            >
                                <option value="5">5 Stars - Excellent Service</option>
                                <option value="4">4 Stars - Good Service</option>
                                <option value="3">3 Stars - Average Service</option>
                                <option value="2">2 Stars - Poor (Will Trigger Complaint)</option>
                                <option value="1">1 Star - Critical (Will Trigger Complaint)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Closure Notes & Comments</label>
                            <textarea
                                rows={4}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Record final customer satisfaction and closure notes..."
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setSelectedService(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={recordFeedback.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow transition-colors disabled:opacity-50"
                            >
                                {recordFeedback.isPending ? 'Saving...' : 'Save Feedback'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
