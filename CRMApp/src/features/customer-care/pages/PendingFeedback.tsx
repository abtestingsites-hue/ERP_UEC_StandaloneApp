import { useState } from 'react';
import { Search, MessageSquare, Star, CheckCircle2, History } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { StatusHighlighter } from '../../../components/StatusHighlighter';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { Modal } from '../../../components/Modal';
import { usePendingFeedback, useRecordServiceFeedback } from '../hooks/useCustomerCare';
import type { PendingFeedbackItem } from '../services/customerCareService';

export function PendingFeedback() {
    const { data: pendingFeedback = [], isLoading, error } = usePendingFeedback();
    const recordFeedback = useRecordServiceFeedback();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedService, setSelectedService] = useState<PendingFeedbackItem | null>(null);
    const [rating, setRating] = useState('5');
    const [comments, setComments] = useState('');
    const [closedClientName, setClosedClientName] = useState<string | null>(null);

    const filteredFeedback = pendingFeedback.filter((item) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return [item.ref, item.allocationRef, item.service, item.clientName, item.patientName, item.status, item.paymentStatus]
            .some((val) => String(val || '').toLowerCase().includes(query));
    });

    const handleOpenFeedbackModal = (item: PendingFeedbackItem) => {
        setSelectedService(item);
        setRating('5');
        setComments('');
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
                    setClosedClientName(selectedService.clientName || selectedService.ref);
                    setSelectedService(null);
                }
            }
        );
    };

    return (
        <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-5">
            <PageHeader
                title="Client Service Feedback Queue"
                subtitle="Collect feedback, ratings, and satisfaction reviews for active care allocations."
                icon={MessageSquare}
            />

            {/* Closure Alert Notification */}
            {closedClientName && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">Feedback Successfully Recorded</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                Feedback collected for <span className="font-bold">{closedClientName}</span>.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setClosedClientName(null)}
                        className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search feedback by Ref No, Client Name, Patient, Service..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Queue Table */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <LoadingState message="Loading pending feedback queue..." />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-rose-500 font-semibold">
                        Failed to fetch pending feedback items. Please retry.
                    </div>
                ) : filteredFeedback.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title="No Pending Feedback"
                            description="All allocated client services have feedback recorded."
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
                                    <th className="py-3.5 px-4">Payment</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredFeedback.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.ref || item.allocationRef || '-'}</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{item.service || '-'}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">{item.clientName || '-'}</td>
                                        <td className="py-3.5 px-4">
                                            <StatusHighlighter value={item.status} />
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <StatusHighlighter value={item.paymentStatus || 'PENDING'} />
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => handleOpenFeedbackModal(item)}
                                                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5" /> Collect Feedback
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Collect Feedback Modal */}
            {selectedService && (
                <Modal isOpen={Boolean(selectedService)} onClose={() => setSelectedService(null)} title="Collect Customer Feedback">
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
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Feedback Comments & Closure Notes</label>
                            <textarea
                                rows={4}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Record patient satisfaction comments or feedback..."
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none"
                            />
                        </div>
                        {Number(rating) <= 2 && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-300">
                                Warning: Ratings of 1 or 2 stars will automatically raise a customer complaint ticket for investigation.
                            </div>
                        )}
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
