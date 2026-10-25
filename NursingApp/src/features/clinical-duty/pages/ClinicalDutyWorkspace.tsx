import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { useAssignment, useUpdateAssignmentStatus, useUpdateAssignmentMetadata } from '../hooks/useClinicalDuty';
import { Activity, HeartPulse, Pill, Apple, Receipt, CheckCircle2, Circle, HelpCircle, ArrowRight, Save, Play } from 'lucide-react';

type ChecklistCategory = 'vitals' | 'medication' | 'adl' | 'nutrition';
type ChecklistState = 'NOT_REVIEWED' | 'COMPLETED' | 'NOT_APPLICABLE';

export default function ClinicalDutyWorkspace() {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();
    const { data: assignment, isLoading } = useAssignment(assignmentId!);
    const updateStatus = useUpdateAssignmentStatus();
    const updateMetadata = useUpdateAssignmentMetadata();

    const [checklist, setChecklist] = useState<Record<ChecklistCategory, ChecklistState>>({
        vitals: 'NOT_REVIEWED',
        medication: 'NOT_REVIEWED',
        adl: 'NOT_REVIEWED',
        nutrition: 'NOT_REVIEWED'
    });

    useEffect(() => {
        if (assignment?.metadata?.dailyCareChecklist) {
            setChecklist({
                vitals: assignment.metadata.dailyCareChecklist.vitals || 'NOT_REVIEWED',
                medication: assignment.metadata.dailyCareChecklist.medication || 'NOT_REVIEWED',
                adl: assignment.metadata.dailyCareChecklist.adl || 'NOT_REVIEWED',
                nutrition: assignment.metadata.dailyCareChecklist.nutrition || 'NOT_REVIEWED'
            });
        }
    }, [assignment]);

    const handleChecklistChange = (category: ChecklistCategory, state: ChecklistState) => {
        setChecklist(prev => ({ ...prev, [category]: state }));
    };

    const handleSaveChecklist = async () => {
        try {
            await updateMetadata.mutateAsync({
                id: assignmentId!,
                metadata: {
                    ...assignment?.metadata,
                    dailyCareChecklist: checklist
                }
            });
            alert('Checklist saved successfully');
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Failed to save checklist');
        }
    };

    const handleStartDuty = async () => {
        try {
            await updateStatus.mutateAsync({ id: assignmentId!, status: 'IN_PROGRESS' });
            alert('Duty started successfully');
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Failed to start duty');
        }
    };

    const handleCompleteDuty = async () => {
        // Validate checklist
        const unresolved = Object.entries(checklist).filter(([_, state]) => state === 'NOT_REVIEWED');
        if (unresolved.length > 0) {
            alert(`Please resolve all checklist items before completing duty. Unresolved: ${unresolved.map(([k]) => k).join(', ')}`);
            return;
        }

        try {
            // First save checklist just in case it wasn't saved
            await updateMetadata.mutateAsync({
                id: assignmentId!,
                metadata: {
                    ...assignment?.metadata,
                    dailyCareChecklist: checklist
                }
            });

            await updateStatus.mutateAsync({ id: assignmentId!, status: 'WAITING_APPROVAL' });
            alert('Duty completed and sent for approval');
            navigate('/my-shift');
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Failed to complete duty');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full flex-col">
                <PageHeader title="Clinical Duty Workspace" subtitle="Loading..." />
                <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
                    <Activity className="h-10 w-10 animate-bounce text-emerald-400 mb-3" />
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="p-8 text-center text-rose-600 font-bold">Assignment not found.</div>
        );
    }

    const isAssigned = assignment.status === 'ASSIGNED';
    const isInProgress = assignment.status === 'IN_PROGRESS';
    const isCompleted = ['WAITING_APPROVAL', 'APPROVED', 'COMPLETED'].includes(assignment.status);

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <PageHeader 
                title="Clinical Duty Workspace" 
                subtitle={`Manage care for ${assignment.patient?.name || 'Patient'}`}
                breadcrumbs={[
                    { label: 'Nursing Care', path: '/' },
                    { label: 'My Shift', path: '/my-shift' },
                    { label: 'Workspace' }
                ]}
            />

            {/* Header Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">{assignment.patient?.name || 'Unknown Patient'}</h2>
                    <p className="text-sm font-semibold text-gray-500 mt-1">
                        Patient ID: PT-{assignment.patientId?.substring(0, 4).toUpperCase()} | {assignment.dutyType?.replace(/_/g, ' ')}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold border bg-blue-50 text-blue-800 border-blue-200">
                        STATUS: {assignment.status.replace(/_/g, ' ')}
                    </span>
                    {isAssigned && (
                        <button 
                            onClick={handleStartDuty}
                            disabled={updateStatus.isPending}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors"
                        >
                            <Play className="w-4 h-4" /> Start Duty
                        </button>
                    )}
                </div>
            </div>

            {isAssigned && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-800 text-center font-semibold">
                    You must start the duty to access clinical documentation modules.
                </div>
            )}

            {(isInProgress || isCompleted) && (
                <>
                    {/* Clinical Modules */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link to={`/vitals?patientId=${assignment.patientId}&assignmentId=${assignment.id}`} className="bg-white hover:bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 transition-colors group">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
                                <HeartPulse className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-gray-700 text-sm">Vitals</span>
                        </Link>
                        <Link to={`/medication?patientId=${assignment.patientId}&assignmentId=${assignment.id}`} className="bg-white hover:bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 transition-colors group">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                                <Pill className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-gray-700 text-sm">Medication</span>
                        </Link>
                        <Link to={`/adl?patientId=${assignment.patientId}&assignmentId=${assignment.id}`} className="bg-white hover:bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 transition-colors group">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                                <Activity className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-gray-700 text-sm">ADL</span>
                        </Link>
                        <Link to={`/nutrition?patientId=${assignment.patientId}&assignmentId=${assignment.id}`} className="bg-white hover:bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 transition-colors group">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                                <Apple className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-gray-700 text-sm">Nutrition</span>
                        </Link>
                    </div>

                    {/* Medicine Request */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                                <Receipt className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Medicine Request & Usage</h3>
                                <p className="text-sm text-gray-500">Request pharmacy issues or view past requests.</p>
                            </div>
                        </div>
                        <Link to={`/revenue?patientId=${assignment.patientId}&assignmentId=${assignment.id}`} className="flex items-center gap-2 text-teal-600 font-bold hover:text-teal-700 text-sm bg-teal-50 px-4 py-2 rounded-lg transition-colors">
                            Open <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Checklist */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Daily Care Checklist</h3>
                                <p className="text-sm text-gray-500">Explicitly mark the required care for this specific duty.</p>
                            </div>
                            {isInProgress && (
                                <button 
                                    onClick={handleSaveChecklist}
                                    disabled={updateMetadata.isPending}
                                    className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors text-sm border border-blue-200 bg-white"
                                >
                                    <Save className="w-4 h-4" /> Save Draft
                                </button>
                            )}
                        </div>
                        <div className="p-6 space-y-6">
                            {(['vitals', 'medication', 'adl', 'nutrition'] as ChecklistCategory[]).map((cat) => (
                                <div key={cat} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {checklist[cat] === 'COMPLETED' ? <CheckCircle2 className="text-emerald-500" /> :
                                         checklist[cat] === 'NOT_APPLICABLE' ? <Circle className="text-gray-400" /> :
                                         <HelpCircle className="text-amber-500" />}
                                        <span className="font-bold text-gray-800 capitalize text-lg">{cat}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button 
                                            disabled={!isInProgress}
                                            onClick={() => handleChecklistChange(cat, 'NOT_REVIEWED')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${checklist[cat] === 'NOT_REVIEWED' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-gray-500 border-gray-200'}`}
                                        >
                                            Not Reviewed
                                        </button>
                                        <button 
                                            disabled={!isInProgress}
                                            onClick={() => handleChecklistChange(cat, 'COMPLETED')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${checklist[cat] === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-gray-500 border-gray-200'}`}
                                        >
                                            Completed / Documented
                                        </button>
                                        <button 
                                            disabled={!isInProgress}
                                            onClick={() => handleChecklistChange(cat, 'NOT_APPLICABLE')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${checklist[cat] === 'NOT_APPLICABLE' ? 'bg-gray-200 text-gray-800 border-gray-300' : 'bg-white text-gray-500 border-gray-200'}`}
                                        >
                                            Not Applicable for This Duty
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {isInProgress && (
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                <div className="text-sm font-semibold text-gray-500">
                                    {Object.values(checklist).includes('NOT_REVIEWED') ? (
                                        <span className="text-amber-600">Please resolve all checklist items to complete duty.</span>
                                    ) : (
                                        <span className="text-emerald-600">All items resolved. Ready to complete.</span>
                                    )}
                                </div>
                                <button 
                                    onClick={handleCompleteDuty}
                                    disabled={updateStatus.isPending || updateMetadata.isPending || Object.values(checklist).includes('NOT_REVIEWED')}
                                    className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Complete Duty
                                </button>
                            </div>
                        )}
                        {isCompleted && (
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-gray-700 font-bold">
                                    {assignment.status === 'WAITING_APPROVAL' 
                                        ? '⏳ Waiting for Supervisor Approval' 
                                        : '✅ This duty is finalized and read-only.'}
                                </div>
                                <Link to="/my-shift" className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors">
                                    Back to My Shift
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
