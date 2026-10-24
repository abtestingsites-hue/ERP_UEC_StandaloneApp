import React from 'react'
import { X, Send, Stethoscope, Edit3 } from 'lucide-react'
import { useAddFollowUp } from '../hooks/useEnquiry'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { ServiceRequirementModal } from './ServiceRequirementModal'

const extractQualificationValue = (comments: string | undefined, label: string) => {
    const match = String(comments || '').match(new RegExp(`${label}:\\s*([^\\n]+)`, 'i'))
    return match?.[1]?.trim() || ''
}

const getLeadQualification = (enquiry: any) => ({
    quality: extractQualificationValue(enquiry?.comments, 'Lead Quality') || enquiry?.automationPriority || 'Cold',
    intent: extractQualificationValue(enquiry?.comments, 'Intent') || 'Not qualified',
    followUpPriority: extractQualificationValue(enquiry?.comments, 'Follow-up Priority') || 'Not set'
})

interface EnquiryFollowUpModalProps {
    isOpen: boolean
    onClose: () => void
    enquiry: any
    staffOptions: { value: string, label: string }[]
}

export function EnquiryFollowUpModal({ isOpen, onClose, enquiry, staffOptions }: EnquiryFollowUpModalProps) {
    const addFollowUp = useAddFollowUp()
    const [isServiceReqModalOpen, setIsServiceReqModalOpen] = React.useState(false)
    const availableStaffOptions = React.useMemo(
        () => staffOptions.filter((option) => option.value),
        [staffOptions]
    )
    const requiresStaffSelection = availableStaffOptions.length > 0
    const [form, setForm] = React.useState({
        followupMode: '',
        followupStatus: 'Followup Required',
        leadValidity: 'Genuine',
        conversionReadiness: 'Discussion Stage',
        urgency: 'Normal',
        clientInterest: 'Neutral',
        readyToPayAmount: '',
        paymentMode: '',
        nextFollowupDate: new Date().toISOString().split('T')[0],
        staffId: '',
        attachmentName: '',
        comments: ''
    })

    const getDefaultStaffId = React.useCallback(() => {
        const latestOwner = String(enquiry?.lastFollowedBy || '').trim().toLowerCase()
        if (!latestOwner || latestOwner === 'agent' || latestOwner === 'unassigned') return ''

        const matchedStaff = availableStaffOptions.find((option) => (
            option.label.toLowerCase().includes(latestOwner)
        ))

        return matchedStaff?.value || ''
    }, [availableStaffOptions, enquiry?.lastFollowedBy])

    const resetForm = () => {
        setForm({
            followupMode: '',
            followupStatus: 'Followup Required',
            leadValidity: 'Genuine',
            conversionReadiness: 'Discussion Stage',
            urgency: 'Normal',
            clientInterest: 'Neutral',
            readyToPayAmount: '',
            paymentMode: '',
            nextFollowupDate: new Date().toISOString().split('T')[0],
            staffId: getDefaultStaffId(),
            attachmentName: '',
            comments: ''
        })
    }

    React.useEffect(() => {
        if (isOpen) resetForm()
    }, [isOpen, getDefaultStaffId])

    if (!isOpen || !enquiry) return null

    const qualification = getLeadQualification(enquiry)
    const missingStaff = requiresStaffSelection && !form.staffId
    const missingComments = !form.comments.trim()
    const submitBlockedReason = missingStaff
        ? 'Select the staff owner to continue this follow-up.'
        : missingComments
            ? 'Enter discussion notes to save this follow-up.'
            : ''

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.comments.trim() || (requiresStaffSelection && !form.staffId)) return

        const note = [
            `Mode: ${form.followupMode || 'N/A'}`,
            `Status: ${form.followupStatus || 'N/A'}`,
            `Lead Validity: ${form.leadValidity || 'N/A'}`,
            `Conversion Readiness: ${form.conversionReadiness || 'N/A'}`,
            `Urgency: ${form.urgency || 'Normal'}`,
            `Client Interest: ${form.clientInterest || 'Neutral'}`,
            form.readyToPayAmount ? `Ready Amount: ${form.readyToPayAmount}` : '',
            form.paymentMode ? `Payment Mode: ${form.paymentMode}` : '',
            `Lead Quality: ${qualification.quality}`,
            `Intent: ${qualification.intent}`,
            `Comments: ${form.comments.trim()}`
        ].filter(Boolean).join(' | ')

        addFollowUp.mutate(
            {
                id: enquiry.id,
                data: {
                    notes: note,
                    staffId: form.staffId || undefined,
                    channel: form.followupMode || undefined,
                    outcome: form.followupStatus || undefined,
                    attachmentName: form.attachmentName || undefined,
                    clientInterest: form.clientInterest || undefined,
                    readyToPayAmount: form.readyToPayAmount ? parseFloat(form.readyToPayAmount) : undefined,
                    paymentMode: form.paymentMode || undefined,
                    nextFollowupStatus: form.followupStatus || undefined,
                    nextDate: form.followupStatus !== 'Followup Not Required' && form.followupStatus !== 'Lost' && form.nextFollowupDate
                        ? new Date(form.nextFollowupDate).toISOString()
                        : new Date().toISOString()
                }
            },
            {
                onSuccess: () => {
                    onClose()
                    resetForm()
                }
            }
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <div className="relative z-10 max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-gray-200 bg-white p-4 text-left shadow-2xl scrollbar-hide dark:border-white/10 dark:bg-black sm:p-6 lg:rounded-[32px] 2xl:max-w-6xl 2xl:p-8">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <header className="mb-6 sm:mb-8">
                    <h2 className="mb-5 pr-10 text-lg font-bold text-gray-900 dark:text-gray-100 sm:mb-6 sm:text-xl font-sans">Client Follow-up - {enquiry.clientName}</h2>

                    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm dark:border-white/5 dark:bg-black sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="min-w-0">
                            <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">Client Reference No.</p>
                            <h3 className="truncate text-2xl font-extrabold tracking-tight text-[#ffc107] sm:text-3xl">{enquiry.refNo || `ENQ-${enquiry.id?.substring(0, 6).toUpperCase()}`}</h3>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-3 min-w-[140px] shadow-sm">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">CURRENT STATUS</p>
                                <StatusHighlighter value={enquiry.status} />
                            </div>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:gap-8">
                        {/* Enquiry Snapshot */}
                        <section>
                            <h4 className="text-[12px] font-extrabold text-[#ffc107] uppercase tracking-[0.2em] mb-4">ENQUIRY SNAPSHOT</h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="bg-amber-50/30 dark:bg-black border border-amber-100 dark:border-[#ffc107]/10 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">UNIT</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{enquiry.unitId || 'Sunrise Edlercare'}</p>
                                </div>
                                <div className="bg-amber-50/30 dark:bg-black border border-amber-100 dark:border-[#ffc107]/10 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">SERVICE</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{enquiry.service || 'Standard'}</p>
                                </div>
                                <div className="bg-amber-50/30 dark:bg-black border border-amber-100 dark:border-[#ffc107]/10 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">ENQUIRY MODE</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{enquiry.mode || 'Call'}</p>
                                </div>
                                <div className="bg-amber-50/30 dark:bg-black border border-amber-100 dark:border-[#ffc107]/10 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">SOURCE</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{enquiry.source || 'Website'}</p>
                                </div>
                                <div className="bg-amber-50/30 dark:bg-black border border-amber-100 dark:border-[#ffc107]/10 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">LEAD QUALITY</p>
                                    <StatusHighlighter value={qualification.quality} />
                                </div>
                                <div className="bg-amber-50/30 dark:bg-black border border-amber-100 dark:border-[#ffc107]/10 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">FOLLOW-UP PRIORITY</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{qualification.followUpPriority}</p>
                                </div>
                                <div className="bg-amber-50/30 dark:bg-black border border-amber-100 dark:border-[#ffc107]/10 rounded-xl p-4 sm:col-span-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">CONVERSION INTENT</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{qualification.intent}</p>
                                </div>
                            </div>
                        </section>

                        {/* Client Details */}
                        <section>
                            <h4 className="text-[12px] font-extrabold text-[#0F969C] uppercase tracking-[0.2em] mb-4">CLIENT DETAILS</h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="bg-primary-50/30 dark:bg-black border border-primary-100 dark:border-[#0F969C]/10 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">CLIENT NAME</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{enquiry.clientName}</p>
                                </div>
                                <div className="bg-primary-50/30 dark:bg-black border border-primary-100 dark:border-[#0F969C]/10 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">MOBILE</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{enquiry.mobile}</p>
                                </div>
                                <div className="bg-primary-50/30 dark:bg-[#010e0c] border border-primary-100 dark:border-[#0F969C]/10 rounded-xl p-4 col-span-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">EMAIL</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{enquiry.email || '--'}</p>
                                </div>
                                <div className="bg-primary-50/30 dark:bg-[#010e0c] border border-primary-100 dark:border-[#0F969C]/10 rounded-xl p-4 col-span-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">LAST COMMENTS</p>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 italic">"{enquiry.comments || 'No initial comments provided.'}"</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Service Requirements Summary Section */}
                    <div className="bg-white dark:bg-black rounded-xl shadow-sm border border-emerald-100/50 dark:border-white/10 overflow-hidden">
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 px-4 py-3 border-b border-emerald-100/50 dark:border-white/10 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <Stethoscope className="h-4 w-4" /> Service Requirements
                            </span>
                            <button 
                                type="button"
                                onClick={() => setIsServiceReqModalOpen(true)}
                                className="text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 px-3 py-1 rounded flex items-center gap-1.5 transition-colors"
                            >
                                <Edit3 className="h-3 w-3" /> Edit Requirements
                            </button>
                        </div>
                        {enquiry.serviceRequirements ? (
                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Staff Required</label>
                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{enquiry.serviceRequirements.staffRequired} Staff</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Shift Timing</label>
                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{enquiry.serviceRequirements.shift}</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Start Date</label>
                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{enquiry.serviceRequirements.startDate ? new Date(enquiry.serviceRequirements.startDate).toLocaleDateString() : 'TBD'}</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Frequency</label>
                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{enquiry.serviceRequirements.frequency}</span>
                                </div>
                                {enquiry.serviceRequirements.careRequirements && enquiry.serviceRequirements.careRequirements.length > 0 && (
                                    <div className="col-span-2 md:col-span-4">
                                        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">Care Needs</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {enquiry.serviceRequirements.careRequirements.map((req: string) => (
                                                <span key={req} className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-md">
                                                    {req}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {enquiry.serviceRequirements.specialInstructions && (
                                    <div className="col-span-2 md:col-span-4 bg-yellow-50/50 border border-yellow-100 p-3 rounded-lg">
                                        <label className="text-[10px] font-extrabold text-yellow-800/60 uppercase tracking-wider block mb-1">Special Instructions</label>
                                        <p className="text-xs text-yellow-900 font-medium">{enquiry.serviceRequirements.specialInstructions}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-500 font-medium mb-3">No specific service requirements captured yet.</p>
                                <button 
                                    type="button"
                                    onClick={() => setIsServiceReqModalOpen(true)}
                                    className="text-sm font-bold text-[#0F969C] hover:text-[#294D61] underline underline-offset-2"
                                >
                                    Setup requirements now
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Follow-up Form Section */}
                    <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/5 rounded-[24px] p-6 shadow-sm">
                        <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Discussion Record</h4>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4 2xl:gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Lead Filter</label>
                                <select
                                    value={form.leadValidity}
                                    onChange={(e) => setForm(prev => ({ ...prev, leadValidity: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                >
                                    <option value="Genuine">Genuine</option>
                                    <option value="Doubtful">Doubtful</option>
                                    <option value="Fake">Fake</option>
                                    <option value="Duplicate Enquiry">Duplicate Enquiry</option>
                                    <option value="Not Service Related">Not Service Related</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Followup Mode</label>
                                <select
                                    value={form.followupMode}
                                    onChange={(e) => setForm(prev => ({ ...prev, followupMode: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                >
                                    <option value="">-- Select Mode --</option>
                                    <option value="Phone Call">Phone Call</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Visit">Visit</option>
                                    <option value="Email">Email</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Conversion Readiness</label>
                                <select
                                    value={form.conversionReadiness}
                                    onChange={(e) => setForm(prev => ({ ...prev, conversionReadiness: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                >
                                    <option value="Discussion Stage">Discussion Stage</option>
                                    <option value="Price Discussed">Price Discussed</option>
                                    <option value="Family Approval Pending">Family Approval Pending</option>
                                    <option value="Ready To Convert">Ready To Convert</option>
                                    <option value="Converted">Converted</option>
                                    <option value="Not Convertible">Not Convertible</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Urgency</label>
                                <select
                                    value={form.urgency}
                                    onChange={(e) => setForm(prev => ({ ...prev, urgency: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                >
                                    <option value="Immediate">Immediate</option>
                                    <option value="Within 24 hours">Within 24 hours</option>
                                    <option value="This Week">This Week</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Staff Followup *</label>
                                <select
                                    value={form.staffId}
                                    onChange={(e) => setForm(prev => ({ ...prev, staffId: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                    required={requiresStaffSelection}
                                >
                                    <option value="">
                                        {requiresStaffSelection ? '-- Select Staff --' : '-- No staff available --'}
                                    </option>
                                    {availableStaffOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {!requiresStaffSelection && (
                                    <p className="ml-1 text-[11px] font-semibold text-amber-600">
                                        Staff list is unavailable. Follow-up will be saved without staff assignment.
                                    </p>
                                )}
                                {missingStaff && (
                                    <p className="ml-1 text-[11px] font-semibold text-rose-600">
                                        Staff owner is required before moving this enquiry forward.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Outcome / Status</label>
                                <select
                                    value={form.followupStatus}
                                    onChange={(e) => setForm(prev => ({ ...prev, followupStatus: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                >
                                    <option value="">-- Select Status --</option>
                                    <option value="Followup Required">Followup Required</option>
                                    <option value="Followup Not Required">Followup Not Required</option>
                                    <option value="Admission Planned">Admission Planned</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Not Interested">Not Interested</option>
                                    <option value="Converted">Converted</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Next Followup Date</label>
                                <input
                                    type="date"
                                    value={form.nextFollowupDate}
                                    onChange={(e) => setForm(prev => ({ ...prev, nextFollowupDate: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Client Interest</label>
                                <select
                                    value={form.clientInterest}
                                    onChange={(e) => setForm(prev => ({ ...prev, clientInterest: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                >
                                    <option value="Interested">Interested</option>
                                    <option value="Neutral">Neutral</option>
                                    <option value="Not Interested">Not Interested</option>
                                    <option value="Call Later">Call Later</option>
                                    <option value="Price Concern">Price Concern</option>
                                    <option value="Family Decision Pending">Family Decision Pending</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Ready To Pay Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.readyToPayAmount}
                                    onChange={(e) => setForm(prev => ({ ...prev, readyToPayAmount: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                    placeholder="Amount discussed"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Payment Mode</label>
                                <select
                                    value={form.paymentMode}
                                    onChange={(e) => setForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                >
                                    <option value="">-- Not discussed --</option>
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Card">Card</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Attachment / Proof Name</label>
                                <input
                                    value={form.attachmentName}
                                    onChange={(e) => setForm(prev => ({ ...prev, attachmentName: e.target.value }))}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all"
                                    placeholder="Quote, bill, call note..."
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2 2xl:col-span-4">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest ml-1">Discussion Timeline & Notes *</label>
                                <textarea
                                    value={form.comments}
                                    onChange={(e) => setForm(prev => ({ ...prev, comments: e.target.value }))}
                                    rows={4}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/20 focus:border-[#ffc107] transition-all placeholder:text-gray-400"
                                    placeholder="Enter client follow-up discussion points..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col justify-end gap-3 border-t border-gray-200 pt-6 dark:border-white/5 sm:flex-row sm:gap-4">
                            {submitBlockedReason && (
                                <p className="self-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 sm:mr-auto">
                                    {submitBlockedReason}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95 text-left"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={addFollowUp.isPending || missingComments || missingStaff}
                                className="px-8 py-3 rounded-xl bg-[#0F969C] text-white font-extrabold text-sm uppercase tracking-wider hover:bg-[#294D61] shadow-lg shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {addFollowUp.isPending ? 'Submitting...' : 'Submit Follow-up'}
                            </button>
                        </div>
                    </div>

                    {Array.isArray(enquiry.followUps) && enquiry.followUps.length > 0 && (
                        <section className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
                            <h4 className="mb-4 text-lg font-extrabold text-gray-900 dark:text-white">Follow-up History</h4>
                            <div className="space-y-3">
                                {enquiry.followUps.slice(0, 5).map((followUp: any, index: number) => (
                                    <div key={followUp.id || index} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <StatusHighlighter value={followUp.outcome || followUp.nextFollowupStatus || 'Recorded'} />
                                            {followUp.channel && <span className="font-bold text-gray-500">{followUp.channel}</span>}
                                            {followUp.scheduledAt && <span className="text-xs font-semibold text-gray-400">{new Date(followUp.scheduledAt).toLocaleString()}</span>}
                                        </div>
                                        <p className="font-medium text-gray-700 dark:text-gray-300">{followUp.notes || 'No notes added'}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </form>
            </div>

            {isServiceReqModalOpen && (
                <ServiceRequirementModal
                    isOpen={isServiceReqModalOpen}
                    onClose={() => setIsServiceReqModalOpen(false)}
                    enquiry={enquiry}
                />
            )}
        </div>
    )
}
