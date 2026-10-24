import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Phone,
    MessageSquare,
    User,
    ChevronLeft,
    MoreVertical,
    Send,
    Activity,
    ShieldAlert,
    Stethoscope,
    Edit3
} from 'lucide-react';
import { useEnquiry, useAddFollowUp, useStaff, useConvertToAdmission } from '../hooks/useEnquiry';
import { useAuthStore } from '../../../store/authStore';
import { LoadingState } from '../../../components/LoadingState';
import { StatusHighlighter } from '../../../components/StatusHighlighter';
import { Modal } from '../../../components/Modal';
import { Select } from '../../../components/Select';
import { Button } from '../../../components/Button';
import { ServiceRequirementModal } from '../components/ServiceRequirementModal';

export function FollowUpView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: enquiry, isLoading: isEnquiryLoading, error: enquiryError } = useEnquiry(id!);
    const { data: staffList = [] } = useStaff();
    const addFollowUp = useAddFollowUp();
    const convertMutation = useConvertToAdmission();
    const authorizedUnits = useAuthStore((state) => state.units);

    const [notes, setNotes] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [nextDate, setNextDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [outcome, setOutcome] = useState('Pending');
    const [clientInterest, setClientInterest] = useState('Neutral');
    const [hasAttachment, setHasAttachment] = useState(false);
    const [isServiceReqModalOpen, setIsServiceReqModalOpen] = useState(false);
    
    // Admission Conversion Modal State
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [selectedDestinationUnitId, setSelectedDestinationUnitId] = useState<string>('');

    const groupedStaff = useMemo(() => {
        const groups: Record<string, any[]> = {};
        staffList.forEach((s: any) => {
            const deptName = s.department?.name || s.department || 'Other';
            if (!groups[deptName]) groups[deptName] = [];
            groups[deptName].push(s);
        });
        return groups;
    }, [staffList]);

    const handleSubmit = () => {
        if (!notes) return;
        addFollowUp.mutate(
            {
                id: id!,
                data: {
                    notes,
                    nextDate: new Date(nextDate).toISOString(),
                    staffId: selectedStaffId || undefined,
                    outcome,
                    clientInterest,
                    attachmentName: hasAttachment ? 'PROCESSED_DOCUMENT' : undefined
                }
            },
            {
                onSuccess: () => navigate('/crm/enquiry-follow-up')
            }
        );
    };

    const handleConvert = () => {
        setIsConvertModalOpen(true);
    };

    const submitConversion = () => {
        if (!selectedDestinationUnitId) return;
        convertMutation.mutate({ id: id!, data: { unitId: selectedDestinationUnitId } }, {
            onSuccess: () => {
                setIsConvertModalOpen(false);
                navigate('/crm/enquiry-follow-up');
            }
        });
    };

    const careFacilities = useMemo(() => {
        return authorizedUnits.filter(u => ['ELDER_CARE', 'HEALTHCARE', 'HOSPITAL', 'CLINIC'].includes(u.unitType?.toUpperCase() || ''));
    }, [authorizedUnits]);

    if (isEnquiryLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <LoadingState message="Loading enquiry detail..." />
            </div>
        );
    }

    if (enquiryError || !enquiry) {
        return (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-lg font-semibold text-rose-500">Enquiry Not Found</p>
                <p className="text-sm mt-1">The requested enquiry could not be retrieved or does not exist.</p>
                <button
                    onClick={() => navigate('/crm/enquiry-follow-up')}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg"
                >
                    Back to Queue
                </button>
            </div>
        );
    }

    return (
        <div className="flex min-h-full min-w-0 flex-col bg-slate-50 text-left dark:bg-slate-950">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3.5 text-white shadow-md sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="hover:bg-white/10 p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
                        title="Go back"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center border border-indigo-400/30 shrink-0 text-sm font-bold uppercase text-white shadow-inner">
                            {enquiry.clientName?.slice(0, 2) || 'EN'}
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-bold leading-tight tracking-wide text-white">{enquiry.clientName}</h2>
                            <p className="text-[11px] text-slate-300 opacity-90 flex items-center gap-1.5 uppercase tracking-wider font-semibold mt-0.5">
                                <span className={`h-2 w-2 rounded-full ${enquiry.automationPriority === 'HOT' ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                                {enquiry.refNo || 'NO-REF'} • {enquiry.automationPriority || 'MEDIUM'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button className="hover:bg-white/10 p-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <Phone className="h-5 w-5" />
                    </button>
                    <button className="hover:bg-white/10 p-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <MessageSquare className="h-5 w-5" />
                    </button>
                    <button className="hover:bg-white/10 p-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <MoreVertical className="h-5 w-5" />
                    </button>
                    {!enquiry.isConverted && enquiry.status !== 'Converted' && enquiry.status !== 'Lost' && (enquiry.lastFollowUpOutcome === 'ADMISSION_PLANNED' || enquiry.lastFollowUpOutcome === 'READY_TO_CONVERT') && (
                        <button
                            onClick={handleConvert}
                            disabled={convertMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ml-2"
                        >
                            {convertMutation.isPending ? 'Converting...' : 'Convert to Admission'}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="mx-auto w-full max-w-none space-y-5 p-4 sm:p-6">
                {/* Lead Intelligence Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                    <div className="bg-slate-100/70 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-4 w-4 text-indigo-500" /> Lead Intelligence
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
                                Score: {enquiry.automationScore ?? 50}/100
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 2xl:grid-cols-4">
                        <div className="space-y-4 2xl:col-span-2">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                    Health Condition
                                </label>
                                <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-lg flex items-start gap-3">
                                    <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                    <span className="text-sm font-semibold text-rose-950 dark:text-rose-200 leading-relaxed italic">
                                        {enquiry.patientHealthCondition || 'Condition details not specified'}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                        Service Type
                                    </label>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{enquiry.service || 'N/A'}</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                        Status
                                    </label>
                                    <StatusHighlighter value={enquiry.status} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 2xl:col-span-2">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                    Contact Metadata
                                </label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                        <Phone className="h-4 w-4" /> {enquiry.mobile || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                                        <User className="h-4 w-4" /> {enquiry.patientName || 'Patient'} ({enquiry.patientAge || 'Age N/A'}, {enquiry.patientGender || 'Gender N/A'})
                                    </div>
                                </div>
                            </div>
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                <label className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                                    Agent Comments
                                </label>
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                    {enquiry.comments || 'No initial comments provided.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Requirements Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-emerald-100 dark:border-slate-800 overflow-hidden">
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 border-b border-emerald-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" /> Service Requirements
                        </span>
                        <button
                            onClick={() => setIsServiceReqModalOpen(true)}
                            className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/50 dark:hover:bg-emerald-800/70 px-3 py-1 rounded.lg flex items-center gap-1.5 transition-colors"
                        >
                            <Edit3 className="h-3.5 w-3.5" /> Edit Requirements
                        </button>
                    </div>
                    {enquiry.serviceRequirements ? (
                        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                    Staff Required
                                </label>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {enquiry.serviceRequirements.staffRequired} Staff
                                </span>
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                    Shift Timing
                                </label>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {enquiry.serviceRequirements.shift || 'N/A'}
                                </span>
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                    Start Date
                                </label>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {enquiry.serviceRequirements.startDate ? new Date(enquiry.serviceRequirements.startDate).toLocaleDateString() : 'TBD'}
                                </span>
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                    Frequency
                                </label>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {enquiry.serviceRequirements.frequency || 'N/A'}
                                </span>
                            </div>
                            {enquiry.serviceRequirements.careRequirements && enquiry.serviceRequirements.careRequirements.length > 0 && (
                                <div className="col-span-2 md:col-span-4 mt-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                                        Care Needs
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {enquiry.serviceRequirements.careRequirements.map((req: string) => (
                                            <span key={req} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-md">
                                                {req}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {enquiry.serviceRequirements.specialInstructions && (
                                <div className="col-span-2 md:col-span-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3.5 rounded-lg mt-2">
                                    <label className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider block mb-1">
                                        Special Instructions
                                    </label>
                                    <p className="text-xs text-amber-950 dark:text-amber-200 font-medium leading-relaxed">
                                        {enquiry.serviceRequirements.specialInstructions}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-3">No specific service requirements captured yet.</p>
                            <button
                                onClick={() => setIsServiceReqModalOpen(true)}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline underline-offset-2"
                            >
                                Setup requirements now
                            </button>
                        </div>
                    )}
                </div>

                {/* Follow-up Action Form */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="bg-indigo-50/60 dark:bg-indigo-950/20 px-5 py-4 border-b border-indigo-100 dark:border-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
                            <Send className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-sans text-base font-bold text-slate-800 dark:text-slate-100">Record Follow-up Discussion</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Add notes and assign staff for the next action</p>
                        </div>
                    </div>
                    <div className="space-y-6 p-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                    Allocate Follow-up Staff
                                </label>
                                <select
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none transition-all"
                                >
                                    <option value="">-- No Staff Assigned --</option>
                                    {Object.entries(groupedStaff).map(([dept, staff]) => (
                                        <optgroup key={dept} label={dept.toUpperCase()} className="font-bold text-slate-500">
                                            {staff.map((s: any) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.firstName} {s.lastName || ''} ({s.designation || s.role || 'Staff'})
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                    Client Interest Level
                                </label>
                                <select
                                    value={clientInterest}
                                    onChange={(e) => setClientInterest(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none transition-all"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Neutral">Neutral</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Hot">Hot</option>
                                    <option value="Very Interested">Very Interested</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                        Next Review
                                    </label>
                                    <input
                                        type="date"
                                        value={nextDate}
                                        onChange={(e) => setNextDate(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                        Call Outcome
                                    </label>
                                    <select
                                        value={outcome}
                                        onChange={(e) => setOutcome(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Interested">Interested</option>
                                        <option value="Not Interested">Not Interested</option>
                                        <option value="Admission Planned">Admission Planned</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 sm:flex-row sm:items-center">
                            <div className="flex flex-1 items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="hasAttachment"
                                    checked={hasAttachment}
                                    onChange={(e) => setHasAttachment(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="hasAttachment" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Document / Receipt Attached
                                </label>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">Adds +20 weight to lead conversion score</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                Discussion Timeline & Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={5}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none resize-none"
                                placeholder="Write down the patient's concerns, budget discussed, or specific care requirements..."
                            />
                        </div>

                        <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
                            <button
                                onClick={() => navigate(-1)}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={addFollowUp.isPending || !notes}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                            >
                                {addFollowUp.isPending ? 'Processing...' : (
                                    outcome === 'Not Interested' || outcome === 'Lost' ? 'Close as Lost' :
                                    outcome === 'Admission Planned' || outcome === 'Ready To Convert' ? 'Log & Mark Ready' :
                                    outcome === 'Pending' || outcome === 'Call Later' || outcome === 'Followup Required' ? 'Schedule Next Action' :
                                    'Log Follow-up'
                                )}
                                <ChevronLeft className="h-4 w-4 rotate-180" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Requirement Modal */}
            {isServiceReqModalOpen && (
                <ServiceRequirementModal enquiry={enquiry} onClose={() => setIsServiceReqModalOpen(false)} />
            )}

            {/* Conversion Modal */}
            <Modal isOpen={isConvertModalOpen} onClose={() => !convertMutation.isPending && setIsConvertModalOpen(false)} title="Convert to Admission">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Client</label>
                        <div className="px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200">
                            {enquiry.clientName || 'Unknown Client'}
                        </div>
                    </div>
                    
                    <Select
                        label="Destination Care Facility *"
                        value={selectedDestinationUnitId}
                        onChange={(e) => setSelectedDestinationUnitId(e.target.value)}
                        options={careFacilities.map(f => ({ value: f.id, label: `${f.name} ${f.code ? `(${f.code})` : ''}` }))}
                        disabled={convertMutation.isPending}
                    />
                    
                    <p className="text-xs text-slate-400">
                        This determines where the patient will receive care and where the admission will be managed.
                    </p>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsConvertModalOpen(false)}
                            disabled={convertMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={submitConversion}
                            disabled={!selectedDestinationUnitId || convertMutation.isPending}
                            isLoading={convertMutation.isPending}
                        >
                            {convertMutation.isPending ? 'Converting...' : 'Convert to Admission'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
