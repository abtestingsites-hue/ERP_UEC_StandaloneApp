import { useState, useEffect } from 'react'
import { X, Save, Activity, Calendar, Users, Clock, Stethoscope, AlertCircle } from 'lucide-react'
import type { Enquiry, ServiceRequirements } from '../types'
import { enquiryService } from '../services/enquiry'
import { useQueryClient, useMutation } from '@tanstack/react-query'

interface ServiceRequirementModalProps {
    enquiry: Enquiry
    onClose: () => void
}

const CARE_REQUIREMENTS_OPTIONS = [
    'Bathing', 'Dressing', 'Feeding', 'Mobility Assistance',
    'Medication Administration', 'Wound Care', 'Vital Monitoring',
    'Post-Op Care', 'Catheter Care', 'Dementia Care'
]

export function ServiceRequirementModal({ enquiry, onClose }: ServiceRequirementModalProps) {
    const queryClient = useQueryClient()
    const existingReq = enquiry.serviceRequirements || {}

    const [staffRequired, setStaffRequired] = useState(existingReq.staffRequired?.toString() || '1')
    const [shift, setShift] = useState(existingReq.shift || 'Day')
    const [startDate, setStartDate] = useState(existingReq.startDate ? new Date(existingReq.startDate).toISOString().split('T')[0] : '')
    const [frequency, setFrequency] = useState(existingReq.frequency || 'Daily')
    const [careRequirements, setCareRequirements] = useState<string[]>(existingReq.careRequirements || [])
    const [specialInstructions, setSpecialInstructions] = useState(existingReq.specialInstructions || '')

    const updateMutation = useMutation({
        mutationFn: async (reqData: ServiceRequirements) => {
            return enquiryService.updateEnquiry(enquiry.id, {
                ...enquiry, // We might not need the whole object, but the API handles partial updates if the controller supports it, actually the backend schema handles the full or partial, let's just send the requirements in the same way `FollowUpView` updates it? No, FollowUpView only updates follow up. The Enquiry update endpoint uses full EnquiryFormValues but handles partials if fields are missing? 
                // Wait, the backend controller expects full Enquiry schema.
                // It's safer to pass required fields. 
                clientName: enquiry.clientName,
                mobile: enquiry.mobile,
                serviceRequirements: reqData
            } as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            queryClient.invalidateQueries({ queryKey: ['enquiry', enquiry.id] })
            onClose()
        }
    })

    const handleToggleCareReq = (req: string) => {
        if (careRequirements.includes(req)) {
            setCareRequirements(careRequirements.filter(c => c !== req))
        } else {
            setCareRequirements([...careRequirements, req])
        }
    }

    const handleSave = () => {
        updateMutation.mutate({
            staffRequired: parseInt(staffRequired, 10) || 1,
            shift,
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            frequency,
            careRequirements,
            specialInstructions
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-[#294D61] px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-emerald-400" />
                            Service Requirements
                        </h2>
                        <p className="text-white/80 text-xs mt-1">Configure service needs for {enquiry.clientName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Staff Required</label>
                            <input type="number" min="1" max="10" value={staffRequired} onChange={e => setStaffRequired(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0F969C] outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Shift Timing</label>
                            <select value={shift} onChange={e => setShift(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0F969C] outline-none">
                                <option value="Day">Day (8H / 12H)</option>
                                <option value="Night">Night (8H / 12H)</option>
                                <option value="24 Hours">24 Hours (Live-in)</option>
                                <option value="Visit">Visit (Per hour/session)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0F969C] outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Frequency</label>
                            <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0F969C] outline-none">
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Weekdays">Weekdays Only</option>
                                <option value="Weekends">Weekends Only</option>
                                <option value="Custom">Custom / As Needed</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">Specific Care Requirements</label>
                        <div className="flex flex-wrap gap-2">
                            {CARE_REQUIREMENTS_OPTIONS.map(req => (
                                <button
                                    key={req}
                                    onClick={() => handleToggleCareReq(req)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                        careRequirements.includes(req) 
                                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {req}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Special Instructions</label>
                        <textarea 
                            value={specialInstructions} 
                            onChange={e => setSpecialInstructions(e.target.value)}
                            rows={3} 
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0F969C] outline-none resize-none"
                            placeholder="Add any specific allergies, patient preferences, or environment details..."
                        />
                    </div>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={updateMutation.isPending}
                        className="px-6 py-2.5 bg-[#0F969C] hover:bg-[#294D61] text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {updateMutation.isPending ? 'Saving...' : 'Save Requirements'}
                        <Save className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
