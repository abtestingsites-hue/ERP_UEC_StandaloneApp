import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, HeartPulse, FileText, CheckCircle2 } from 'lucide-react';
import { useCareDelivery } from '../hooks/useCareDelivery';
import { VitalsEntryForm } from '../components/VitalsEntryForm';
import { CareNotesForm } from '../components/CareNotesForm';

export default function CareDeliveryLog() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { recordVitals, isRecordingVitals, recordDailyNotes, isRecordingNotes } = useCareDelivery();

    const [activeTab, setActiveTab] = useState<'VITALS' | 'NOTES'>('VITALS');

    if (!patientId) {
        return (
            <div className="bg-white dark:bg-[#072E33] rounded-2xl p-12 border border-gray-100 dark:border-[#6DA5C0]/15 text-center max-w-xl mx-auto">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Patient Selected</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
                    Please select a patient from your roster or active visits to log care delivery.
                </p>
                <button
                    onClick={() => navigate('/my-visits')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F969C] text-white hover:bg-[#0C7B80] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to My Visits
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Navigation & Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/my-visits')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Active Visit Workflow
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#072E33] p-6 rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#0F969C]">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white">
                            Care Delivery Log
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Record vital signs and daily care delivery notes for patient <code className="font-mono text-[11px] text-[#0F969C] bg-teal-50 dark:bg-black/30 px-1.5 py-0.5 rounded">{patientId}</code>
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab('VITALS')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'VITALS'
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                    >
                        <HeartPulse className="w-4 h-4" />
                        1. Vitals Entry
                    </button>

                    <button
                        onClick={() => setActiveTab('NOTES')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'NOTES'
                                ? 'bg-[#0F969C] text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        2. Daily Care Notes
                    </button>
                </div>
            </div>

            {/* Forms Container */}
            {activeTab === 'VITALS' ? (
                <VitalsEntryForm
                    patientId={patientId}
                    onSubmitVitals={(payload) => recordVitals(payload)}
                    isSubmitting={isRecordingVitals}
                />
            ) : (
                <CareNotesForm
                    patientId={patientId}
                    onSubmitNotes={(payload) => recordDailyNotes(payload)}
                    isSubmitting={isRecordingNotes}
                />
            )}
        </div>
    );
}
