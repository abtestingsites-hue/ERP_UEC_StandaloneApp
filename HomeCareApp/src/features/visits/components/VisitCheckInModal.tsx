import React from 'react';
import { PlayCircle, X, AlertCircle } from 'lucide-react';
import type { VisitTask } from '../api/visitsApi';

interface VisitCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    visit: VisitTask | null;
    isSubmitting: boolean;
}

export const VisitCheckInModal: React.FC<VisitCheckInModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    visit,
    isSubmitting
}) => {
    if (!isOpen || !visit) return null;

    const clientName = visit.enquiry?.patientName || visit.enquiry?.clientName || 'Client';

    const handleCheckIn = async () => {
        try {
            await onConfirm();
            onClose();
        } catch (err) {
            console.error('Check-in error:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#072E33] rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/20 shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-[#0F969C]">
                        <PlayCircle className="w-5 h-5" />
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Confirm Visit Check-In</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-800/30 p-4 rounded-2xl">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Target Client / Visit</span>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{visit.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Client: <strong>{clientName}</strong></p>
                    </div>

                    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3.5 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <p>
                            Checking in marks this visit as <strong>In Progress</strong>. You will be able to record care delivery vitals and daily notes.
                        </p>
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
                        type="button"
                        onClick={handleCheckIn}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#0F969C] text-white hover:bg-[#0C7B80] shadow-sm transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Checking In...
                            </>
                        ) : (
                            <>
                                <PlayCircle className="w-4 h-4" />
                                Start / Check-In Visit
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
