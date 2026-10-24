import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { useServiceRequirements } from '../hooks/useServiceRequirements';
import { Edit2, Clock, User, HeartHandshake, FileText } from 'lucide-react';

export default function ServiceRequirements() {
    const { requirements, isLoading, updateRequirement } = useServiceRequirements();
    const [editingItem, setEditingItem] = useState<any>(null);

    const [staffRequired, setStaffRequired] = useState(1);
    const [shift, setShift] = useState('12 Hours Day');
    const [frequency, setFrequency] = useState('Daily');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenEdit = (item: any) => {
        setEditingItem(item);
        const reqs = item.serviceRequirements || {};
        setStaffRequired(reqs.staffRequired || 1);
        setShift(reqs.shift || '12 Hours Day');
        setFrequency(reqs.frequency || 'Daily');
        setSpecialInstructions(reqs.specialInstructions || '');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        setIsSubmitting(true);
        try {
            await updateRequirement({
                enquiryId: editingItem.id,
                payload: {
                    serviceRequirements: {
                        staffRequired: Number(staffRequired),
                        shift,
                        frequency,
                        specialInstructions
                    }
                }
            });
            setEditingItem(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <PageHeader
                title="Service Requirements"
                subtitle="Overview of home care staffing requirements, shift preferences, and special care instructions."
            />

            <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-[#6DA5C0]/15">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Home Care Demand & Care Specifications</h2>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-[#0F969C] font-bold animate-pulse flex flex-col items-center">
                        <HeartHandshake className="w-10 h-10 mb-2 animate-bounce" />
                        <span>Loading Service Requirements...</span>
                    </div>
                ) : !requirements.length ? (
                    <div className="p-12 text-center text-gray-500 dark:text-[#B8D9E8]">
                        No active service requirements recorded yet.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-[#6DA5C0]/15">
                        {requirements.map((item: any) => {
                            let meta: any = {};
                            if (typeof item.rawMessage === 'string') {
                                try { meta = JSON.parse(item.rawMessage); } catch {}
                            } else if (typeof item.rawMessage === 'object' && item.rawMessage !== null) {
                                meta = item.rawMessage;
                            }
                            const reqs = item.serviceRequirements || {};

                            return (
                                <div key={item.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs font-mono font-bold text-[#0F969C] bg-[#0F969C]/10 px-2 py-0.5 rounded">
                                                    {item.refNo || item.id?.slice(0, 8)}
                                                </span>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                                    {item.client?.name || item.clientName || 'Home Care Prospect'}
                                                </h3>
                                            </div>
                                            {meta.patientName && (
                                                <p className="text-xs text-gray-500 dark:text-[#B8D9E8] flex items-center space-x-1">
                                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>Patient: {meta.patientName} {meta.patientHealthCondition ? `(${meta.patientHealthCondition})` : ''}</span>
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleOpenEdit(item)}
                                            className="self-start md:self-auto flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0F969C]/10 hover:bg-[#0F969C]/20 text-[#0F969C] rounded-xl text-xs font-bold transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            <span>Edit Requirements</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-[#6DA5C0]/10 text-xs">
                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl flex items-center space-x-3">
                                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-[#B8D9E8] font-medium">Caregivers Required</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{reqs.staffRequired || 1} Staff</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl flex items-center space-x-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-[#B8D9E8] font-medium">Shift / Schedule</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{reqs.shift || '12 Hours Day'} ({reqs.frequency || 'Daily'})</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl flex items-center space-x-3">
                                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-[#B8D9E8] font-medium">Special Care Notes</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-[200px]">
                                                    {reqs.specialInstructions || 'None specified'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-white dark:bg-[#072E33] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#6DA5C0]/15 p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Service Requirements</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                    Caregivers Required
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={staffRequired}
                                    onChange={(e) => setStaffRequired(Number(e.target.value))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                    Shift / Hours
                                </label>
                                <select
                                    value={shift}
                                    onChange={(e) => setShift(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                                >
                                    <option value="12 Hours Day">12 Hours Day</option>
                                    <option value="12 Hours Night">12 Hours Night</option>
                                    <option value="24 Hours Resident">24 Hours Resident</option>
                                    <option value="Visit Based">Visit Based</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                    Frequency
                                </label>
                                <select
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Alternate Days">Alternate Days</option>
                                    <option value="Monthly Contract">Monthly Contract</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                    Special Instructions
                                </label>
                                <textarea
                                    rows={3}
                                    value={specialInstructions}
                                    onChange={(e) => setSpecialInstructions(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingItem(null)}
                                    className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-[#B8D9E8] hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 text-sm font-bold text-white bg-[#0F969C] hover:bg-[#0C7075] rounded-xl shadow-md disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Requirements'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
