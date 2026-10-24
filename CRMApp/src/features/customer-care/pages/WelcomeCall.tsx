import { useState } from 'react';
import { Search, PhoneCall, Calendar, CheckCircle2, History, X } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { StatusHighlighter } from '../../../components/StatusHighlighter';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { Modal } from '../../../components/Modal';
import { useWelcomeCalls, useUpdateWelcomeCall } from '../hooks/useCustomerCare';
import type { WelcomeCall as WelcomeCallType } from '../services/customerCareService';

export function WelcomeCall() {
    const { data: calls = [], isLoading, error } = useWelcomeCalls();
    const updateCall = useUpdateWelcomeCall();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCall, setSelectedCall] = useState<WelcomeCallType | null>(null);
    const [actionType, setActionType] = useState<'schedule' | 'outcome' | 'history'>('schedule');

    // Modal Form States
    const [status, setStatus] = useState('COMPLETED');
    const [notes, setNotes] = useState('');
    const [callDate, setCallDate] = useState(new Date().toISOString().split('T')[0]);

    const filteredCalls = calls.filter((item: any) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return [item.ref, item.clientName, item.service, item.status, item.notes]
            .some((val) => String(val || '').toLowerCase().includes(query));
    });

    const handleOpenAction = (call: WelcomeCallType, type: 'schedule' | 'outcome' | 'history') => {
        setSelectedCall(call);
        setActionType(type);
        setStatus(call.status || 'COMPLETED');
        setNotes(call.notes || '');
        setCallDate(call.callDate || new Date().toISOString().split('T')[0]);
    };

    const handleSaveOutcome = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCall) return;

        updateCall.mutate(
            {
                id: selectedCall.id,
                data: {
                    status,
                    notes,
                    callDate
                }
            },
            {
                onSuccess: () => {
                    setSelectedCall(null);
                }
            }
        );
    };

    return (
        <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-5">
            <PageHeader
                title="Client Service Follow-up & Onboarding Welcome Calls"
                subtitle="Manage onboarding welcome calls and initial client verification post-allocation."
                icon={PhoneCall}
            />

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search welcome calls by Client Ref No, Name, Service, Notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Welcome Calls Table */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <LoadingState message="Loading welcome calls queue..." />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-rose-500 font-semibold">
                        Failed to load welcome call records. Please retry.
                    </div>
                ) : filteredCalls.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title="No Welcome Calls Scheduled"
                            description="No client onboarding welcome calls match your current search."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-4">S.No</th>
                                    <th className="py-3.5 px-4">Client Ref No</th>
                                    <th className="py-3.5 px-4">Service Looking for</th>
                                    <th className="py-3.5 px-4">Client Details</th>
                                    <th className="py-3.5 px-4">Allocated Status</th>
                                    <th className="py-3.5 px-4">Allocated Details</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredCalls.map((item: any, index: number) => (
                                    <tr key={item.id || index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4 text-slate-400 font-medium text-xs">{index + 1}</td>
                                        <td className="py-3.5 px-4 font-extrabold text-indigo-600 dark:text-indigo-400">{item.ref || item.clientRef || '-'}</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{item.service || '-'}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">{item.clientName || '-'}</td>
                                        <td className="py-3.5 px-4">
                                            <StatusHighlighter value={item.status} />
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                                            {item.notes || '-'}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenAction(item, 'schedule')}
                                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                                >
                                                    Schedule
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAction(item, 'outcome')}
                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                                >
                                                    Outcome
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAction(item, 'history')}
                                                    className="px-2.5 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                                >
                                                    History
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {selectedCall && (
                <Modal
                    isOpen={Boolean(selectedCall)}
                    onClose={() => setSelectedCall(null)}
                    title={
                        actionType === 'schedule'
                            ? 'Schedule Welcome Call'
                            : actionType === 'outcome'
                                ? 'Record Welcome Call Outcome'
                                : 'Welcome Call History'
                    }
                >
                    {actionType === 'history' ? (
                        <div className="space-y-4 pt-2">
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                                <p className="text-xs font-bold text-slate-400">CLIENT & SERVICE</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedCall.clientName || 'Client'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedCall.service || 'Service'}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-extrabold uppercase text-slate-500">Call Log History</p>
                                <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <p className="font-bold">Status: {selectedCall.status}</p>
                                    <p className="mt-1">Notes: {selectedCall.notes || 'No call history recorded.'}</p>
                                    <p className="mt-1 text-slate-400">Date: {selectedCall.callDate || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex justify-end pt-3">
                                <button
                                    onClick={() => setSelectedCall(null)}
                                    className="px-4 py-2 bg-slate-700 text-white text-xs font-bold rounded-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSaveOutcome} className="space-y-4 pt-2">
                            <div className="p-3.5 bg-indigo-50/50 dark:bg-slate-950 border border-indigo-100 dark:border-slate-800 rounded-lg">
                                <p className="text-xs font-bold text-slate-400">CLIENT ONBOARDING</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedCall.clientName || 'Client'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedCall.service || 'Service'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Call Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 font-bold outline-none focus:border-indigo-500"
                                    >
                                        <option value="PENDING">PENDING</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Call Date</label>
                                    <input
                                        type="date"
                                        value={callDate}
                                        onChange={(e) => setCallDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 font-bold outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Call Outcome & Agent Notes</label>
                                <textarea
                                    rows={4}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Record onboarding feedback, client satisfaction, or follow-up notes..."
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCall(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateCall.isPending}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow transition-colors disabled:opacity-50"
                                >
                                    {updateCall.isPending ? 'Saving...' : 'Save Call Log'}
                                </button>
                            </div>
                        </form>
                    )}
                </Modal>
            )}
        </div>
    );
}
