import React, { useState } from 'react';
import { HeartPulse, CheckCircle2, AlertCircle } from 'lucide-react';
import type { SaveVitalsPayload } from '../api/careDeliveryApi';

interface VitalsEntryFormProps {
    patientId: string;
    onSubmitVitals: (payload: SaveVitalsPayload) => Promise<any>;
    isSubmitting: boolean;
}

export const VitalsEntryForm: React.FC<VitalsEntryFormProps> = ({
    patientId,
    onSubmitVitals,
    isSubmitting
}) => {
    const [bp, setBp] = useState('');
    const [pulse, setPulse] = useState('');
    const [temp, setTemp] = useState('');
    const [spO2, setSpO2] = useState('');
    const [bloodSugar, setBloodSugar] = useState('');
    const [notes, setNotes] = useState('');

    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');

        try {
            await onSubmitVitals({
                patientId,
                shift: 'MORNING',
                bp: bp || undefined,
                pulse: pulse ? Number(pulse) : undefined,
                temp: temp ? Number(temp) : undefined,
                spO2: spO2 ? Number(spO2) : undefined,
                bloodSugar: bloodSugar || undefined,
                notes: notes || undefined
            });

            setSuccessMsg('Vital signs recorded successfully.');
            setBp('');
            setPulse('');
            setTemp('');
            setSpO2('');
            setBloodSugar('');
            setNotes('');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to save vital signs.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#072E33] p-6 rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Record Vital Signs</h3>
            </div>

            {successMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 p-3.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {successMsg}
                </div>
            )}

            {errorMsg && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 p-3.5 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Blood Pressure (BP)
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. 120/80"
                        value={bp}
                        onChange={(e) => setBp(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Pulse Rate (bpm)
                    </label>
                    <input
                        type="number"
                        placeholder="e.g. 72"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Body Temperature (°F)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 98.6"
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Oxygen Saturation (SpO2 %)
                    </label>
                    <input
                        type="number"
                        placeholder="e.g. 98"
                        value={spO2}
                        onChange={(e) => setSpO2(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Blood Sugar Level (mg/dL)
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. 110 mg/dL (Fasting)"
                        value={bloodSugar}
                        onChange={(e) => setBloodSugar(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Clinical Vitals Observations / Remarks
                    </label>
                    <textarea
                        placeholder="Optional observations regarding vital signs..."
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving Vitals...
                        </>
                    ) : (
                        <>
                            <HeartPulse className="w-4 h-4" />
                            Save Vital Signs
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
