import { useState } from 'react';
import { X, Save, Calendar, Users, Clock, Stethoscope } from 'lucide-react';
import type { Enquiry, ServiceRequirements } from '../types';
import { useUpdateEnquiry } from '../hooks/useEnquiry';

interface ServiceRequirementModalProps {
    enquiry: Enquiry;
    onClose: () => void;
}

const CARE_REQUIREMENTS_OPTIONS = [
    'Bathing', 'Dressing', 'Feeding', 'Mobility Assistance',
    'Medication Administration', 'Wound Care', 'Vital Monitoring',
    'Post-Op Care', 'Catheter Care', 'Dementia Care'
];

export function ServiceRequirementModal({ enquiry, onClose }: ServiceRequirementModalProps) {
    const updateEnquiry = useUpdateEnquiry();
    const existingReq = enquiry.serviceRequirements || {};

    const [staffRequired, setStaffRequired] = useState(existingReq.staffRequired?.toString() || '1');
    const [shift, setShift] = useState(existingReq.shift || 'Day');
    const [startDate, setStartDate] = useState(existingReq.startDate ? new Date(existingReq.startDate).toISOString().split('T')[0] : '');
    const [frequency, setFrequency] = useState(existingReq.frequency || 'Daily');
    const [careRequirements, setCareRequirements] = useState<string[]>(existingReq.careRequirements || []);
    const [specialInstructions, setSpecialInstructions] = useState(existingReq.specialInstructions || '');

    const handleToggleCareReq = (req: string) => {
        if (careRequirements.includes(req)) {
            setCareRequirements(careRequirements.filter(c => c !== req));
        } else {
            setCareRequirements([...careRequirements, req]);
        }
    };

    const handleSave = () => {
        const reqData: ServiceRequirements = {
            staffRequired: parseInt(staffRequired, 10) || 1,
            shift,
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            frequency,
            careRequirements,
            specialInstructions
        };

        updateEnquiry.mutate({
            id: enquiry.id,
            data: {
                clientName: enquiry.clientName,
                mobile: enquiry.mobile,
                serviceRequirements: reqData
            }
        }, {
            onSuccess: () => onClose()
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-indigo-950/60 border-b border-indigo-900/50 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-indigo-400" />
                            Service Requirements Configuration
                        </h2>
                        <p className="text-slate-400 text-xs mt-0.5">Configure care needs for client: {enquiry.clientName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-indigo-400" /> Staff Required
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={staffRequired}
                                onChange={(e) => setStaffRequired(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-indigo-400" /> Shift Timing
                            </label>
                            <select
                                value={shift}
                                onChange={(e) => setShift(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="Day">Day (8H / 12H)</option>
                                <option value="Night">Night (8H / 12H)</option>
                                <option value="24 Hours">24 Hours (Live-in)</option>
                                <option value="Visit">Visit (Per hour/session)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Preferred Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                Service Frequency
                            </label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Alternate Days">Alternate Days</option>
                                <option value="One Time">One Time Service</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 block">Care Requirements</label>
                        <div className="flex flex-wrap gap-2">
                            {CARE_REQUIREMENTS_OPTIONS.map((req) => {
                                const selected = careRequirements.includes(req);
                                return (
                                    <button
                                        key={req}
                                        type="button"
                                        onClick={() => handleToggleCareReq(req)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                            selected
                                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                    >
                                        {selected ? '✓ ' : ''}{req}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">Special Instructions / Notes</label>
                        <textarea
                            rows={3}
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Add specific medical instructions or preferences..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateEnquiry.isPending}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                        <Save className="h-4 w-4" />
                        <span>Save Requirements</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
