import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import type { SaveCareNotesPayload } from '../api/careDeliveryApi';

interface CareNotesFormProps {
    patientId: string;
    onSubmitNotes: (payload: SaveCareNotesPayload) => Promise<any>;
    isSubmitting: boolean;
}

export const CareNotesForm: React.FC<CareNotesFormProps> = ({
    patientId,
    onSubmitNotes,
    isSubmitting
}) => {
    const [mobility, setMobility] = useState('INDEPENDENT');
    const [hygiene, setHygiene] = useState('ASSISTED');
    const [feeding, setFeeding] = useState('INDEPENDENT');
    const [notes, setNotes] = useState('');

    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');

        try {
            await onSubmitNotes({
                patientId,
                activityCategory: 'DAILY_CARE_NOTES',
                mobility,
                hygiene,
                feeding,
                notes
            });

            setSuccessMsg('Daily care delivery note recorded successfully.');
            setNotes('');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to save care notes.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#072E33] p-6 rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                <FileText className="w-5 h-5 text-[#0F969C]" />
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Record Daily Care Delivery Notes</h3>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Mobility Status
                    </label>
                    <select
                        value={mobility}
                        onChange={(e) => setMobility(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                    >
                        <option value="INDEPENDENT">Independent</option>
                        <option value="ASSISTED">Assisted</option>
                        <option value="BEDRIDDEN">Bedridden</option>
                        <option value="WHEELCHAIR">Wheelchair</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Hygiene & Personal Care
                    </label>
                    <select
                        value={hygiene}
                        onChange={(e) => setHygiene(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                    >
                        <option value="INDEPENDENT">Independent</option>
                        <option value="ASSISTED">Assisted Care</option>
                        <option value="TOTAL_CARE">Total Hygiene Care</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Nutrition & Feeding
                    </label>
                    <select
                        value={feeding}
                        onChange={(e) => setFeeding(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                    >
                        <option value="INDEPENDENT">Independent</option>
                        <option value="ASSISTED">Assisted Feeding</option>
                        <option value="TUBE_FEEDING">Tube / Special Care</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Detailed Care Delivery Notes
                </label>
                <textarea
                    rows={4}
                    required
                    placeholder="Enter detailed notes regarding care rendered, patient status, medication given, emotional wellbeing, etc..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/40 text-gray-900 dark:text-gray-100"
                />
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F969C] text-white hover:bg-[#0C7B80] shadow-sm transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving Care Note...
                        </>
                    ) : (
                        <>
                            <FileText className="w-4 h-4" />
                            Save Daily Care Note
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
