import React, { useState } from 'react';
import { CheckCircle2, X, FileText } from 'lucide-react';
import type { VisitTask } from '../api/visitsApi';

interface VisitCheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (remarks: string) => Promise<void>;
    visit: VisitTask | null;
    isSubmitting: boolean;
}

export const VisitCheckOutModal: React.FC<VisitCheckOutModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    visit,
    isSubmitting
}) => {
    const [remarks, setRemarks] = useState('');

    if (!isOpen || !visit) return null;

    const clientName = visit.enquiry?.patientName || visit.enquiry?.clientName || 'Client';

    const handleCheckOut = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onConfirm(remarks);
            setRemarks('');
            onClose();
        } catch (err) {
            console.error('Check-out error:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#072E33] rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/20 shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Complete & Check-Out Visit</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleCheckOut}>
                    <div className="p-6 space-y-4">
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-2xl">
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Completing Visit</span>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{visit.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Client: <strong>{clientName}</strong></p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#0F969C]" />
                                Visit Completion Remarks / Summary
                            </label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter summary of services delivered, caregiver notes, or observations during the visit..."
                                rows={4}
                                required
                                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 p-5 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Completing Visit...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Check-Out & Complete
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
