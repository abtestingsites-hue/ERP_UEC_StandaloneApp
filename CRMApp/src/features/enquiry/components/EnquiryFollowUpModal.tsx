import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, PhoneCall, AlertCircle, FileText } from 'lucide-react';
import { useAddFollowUp } from '../hooks/useEnquiry';
import type { Enquiry } from '../types';

interface EnquiryFollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    enquiry: Enquiry | null;
}

export function EnquiryFollowUpModal({ isOpen, onClose, enquiry }: EnquiryFollowUpModalProps) {
    const addFollowUp = useAddFollowUp();

    const [form, setForm] = useState({
        followupMode: 'Call',
        followupStatus: 'Followup Required',
        leadValidity: 'Genuine',
        conversionReadiness: 'Discussion Stage',
        urgency: 'Normal',
        clientInterest: 'Neutral',
        readyToPayAmount: '',
        paymentMode: '',
        nextFollowupDate: new Date().toISOString().split('T')[0],
        comments: ''
    });

    useEffect(() => {
        if (isOpen) {
            setForm({
                followupMode: 'Call',
                followupStatus: 'Followup Required',
                leadValidity: 'Genuine',
                conversionReadiness: 'Discussion Stage',
                urgency: 'Normal',
                clientInterest: 'Neutral',
                readyToPayAmount: '',
                paymentMode: '',
                nextFollowupDate: new Date().toISOString().split('T')[0],
                comments: ''
            });
        }
    }, [isOpen]);

    if (!isOpen || !enquiry) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.comments.trim()) return;

        const noteParts = [
            `Mode: ${form.followupMode}`,
            `Status: ${form.followupStatus}`,
            `Lead Validity: ${form.leadValidity}`,
            `Conversion Readiness: ${form.conversionReadiness}`,
            `Urgency: ${form.urgency}`,
            `Client Interest: ${form.clientInterest}`,
            form.readyToPayAmount ? `Ready Amount: ${form.readyToPayAmount}` : '',
            form.paymentMode ? `Payment Mode: ${form.paymentMode}` : '',
            `Comments: ${form.comments.trim()}`
        ].filter(Boolean).join(' | ');

        addFollowUp.mutate({
            id: enquiry.id,
            data: {
                notes: noteParts,
                channel: form.followupMode,
                outcome: form.followupStatus,
                clientInterest: form.clientInterest,
                readyToPayAmount: form.readyToPayAmount ? parseFloat(form.readyToPayAmount) : undefined,
                paymentMode: form.paymentMode || undefined,
                nextFollowupStatus: form.followupStatus,
                nextDate: form.followupStatus !== 'Followup Not Required' && form.followupStatus !== 'Lost' && form.nextFollowupDate
                    ? new Date(form.nextFollowupDate).toISOString()
                    : new Date().toISOString()
            }
        }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-indigo-950/60 border-b border-indigo-900/50 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <PhoneCall className="h-5 w-5 text-indigo-400" />
                            Log Follow-up Call
                        </h2>
                        <p className="text-slate-400 text-xs mt-0.5">Record call outcome for {enquiry.clientName} ({enquiry.refNo})</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300">Call Mode</label>
                            <select
                                value={form.followupMode}
                                onChange={(e) => setForm({ ...form, followupMode: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="Call">Phone Call</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="In-Person">In-Person Visit</option>
                                <option value="Email">Email</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300">Follow-up Outcome Status</label>
                            <select
                                value={form.followupStatus}
                                onChange={(e) => setForm({ ...form, followupStatus: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="Followup Required">Followup Required</option>
                                <option value="Ready To Convert">Ready To Convert</option>
                                <option value="Call Later">Call Later / Postponed</option>
                                <option value="Followup Not Required">Followup Not Required</option>
                                <option value="Lost">Lost / Not Interested</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300">Client Interest Level</label>
                            <select
                                value={form.clientInterest}
                                onChange={(e) => setForm({ ...form, clientInterest: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="High Interest">High Interest</option>
                                <option value="Neutral">Neutral</option>
                                <option value="Low Interest">Low Interest</option>
                                <option value="Unresponsive">Unresponsive</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300">Next Follow-up Date</label>
                            <input
                                type="date"
                                value={form.nextFollowupDate}
                                onChange={(e) => setForm({ ...form, nextFollowupDate: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Discussion Notes / Remarks *</label>
                        <textarea
                            rows={4}
                            required
                            value={form.comments}
                            onChange={(e) => setForm({ ...form, comments: e.target.value })}
                            placeholder="Enter detailed call log notes, client concerns, or next action items..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={addFollowUp.isPending || !form.comments.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Send className="h-3.5 w-3.5" />
                            <span>{addFollowUp.isPending ? 'Saving Call...' : 'Save Follow-up Call'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
