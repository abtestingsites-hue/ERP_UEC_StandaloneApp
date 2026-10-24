import { useState } from 'react';
import { X, CheckCircle2, RotateCcw, XCircle, AlertCircle, ShieldCheck, HeartPulse, Pill, Apple, Activity } from 'lucide-react';
import { careService } from '../care.service';
import type { MedicalAssignment, ChecklistState } from '../care.types';

interface DutyApprovalModalProps {
    isOpen: boolean;
    assignment: MedicalAssignment | null;
    onClose: () => void;
    onSuccess: () => void;
    activeUnitId?: string | null;
}

export function DutyApprovalModal({ isOpen, assignment, onClose, onSuccess, activeUnitId }: DutyApprovalModalProps) {
    const [actionNotes, setActionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !assignment) return null;

    const checklist = assignment.metadata?.dailyCareChecklist || {};

    const getChecklistBadge = (state?: ChecklistState) => {
        switch (state) {
            case 'COMPLETED':
                return <span className="adm-badge adm-badge--success">Completed</span>;
            case 'NOT_APPLICABLE':
                return <span className="adm-badge adm-badge--neutral">Not Applicable</span>;
            default:
                return <span className="adm-badge adm-badge--warning">Not Reviewed</span>;
        }
    };

    const handleAction = async (targetStatus: string) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await careService.updateAssignmentStatus(
                assignment.id,
                targetStatus,
                actionNotes || undefined,
                activeUnitId
            );
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to update assignment status.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--md">
                <div className="adm-modal-header">
                    <div className="adm-modal-title-group">
                        <ShieldCheck className="adm-modal-icon" />
                        <div>
                            <h2 className="adm-modal-title">Review Submitted Nursing Duty</h2>
                            <p className="adm-modal-subtitle">
                                Nursing Manager Verification & Quality Audit
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="adm-modal-body">
                    {error && (
                        <div className="adm-alert adm-alert--error" style={{ marginBottom: 16 }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Duty Context Card */}
                    <div className="adm-profile-strip" style={{ marginBottom: 16 }}>
                        <div className="adm-strip-col">
                            <span className="adm-strip-label">Duty Ref</span>
                            <span className="adm-strip-value">{assignment.refNo || assignment.id.slice(0, 8)}</span>
                        </div>
                        <div className="adm-strip-col">
                            <span className="adm-strip-label">Staff Member</span>
                            <span className="adm-strip-value">
                                {assignment.staff?.firstName} {assignment.staff?.lastName} ({assignment.role || 'Nurse'})
                            </span>
                        </div>
                        <div className="adm-strip-col">
                            <span className="adm-strip-label">Resident</span>
                            <span className="adm-strip-value">{assignment.patient?.name || 'General Facility'}</span>
                        </div>
                        <div className="adm-strip-col">
                            <span className="adm-strip-label">Duty Type</span>
                            <span className="adm-strip-value">{assignment.dutyType?.replace(/_/g, ' ')}</span>
                        </div>
                    </div>

                    {/* Daily Care Checklist Audit */}
                    <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 10 }}>
                            Daily Care Checklist Audit
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                                    <HeartPulse size={16} color="#e11d48" /> Vitals Monitoring
                                </span>
                                {getChecklistBadge(checklist.vitals)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                                    <Pill size={16} color="#2563eb" /> Medication Admin
                                </span>
                                {getChecklistBadge(checklist.medication)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                                    <Activity size={16} color="#059669" /> ADL & Hygiene
                                </span>
                                {getChecklistBadge(checklist.adl)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                                    <Apple size={16} color="#ea580c" /> Nutrition & Diet
                                </span>
                                {getChecklistBadge(checklist.nutrition)}
                            </div>
                        </div>
                    </div>

                    {assignment.notes && (
                        <div style={{ marginBottom: 16, padding: 12, background: '#f1f5f9', borderRadius: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Duty Notes</span>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#1e293b' }}>{assignment.notes}</p>
                        </div>
                    )}

                    {/* Manager Notes / Correction Instructions */}
                    <div className="adm-form-group">
                        <label className="adm-label">Manager Audit & Review Notes</label>
                        <textarea
                            className="adm-input"
                            rows={3}
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            placeholder="Enter approval verification notes or instructions for correction if returning..."
                        />
                    </div>
                </div>

                <div className="adm-modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        type="button"
                        className="adm-btn adm-btn--danger"
                        onClick={() => handleAction('CANCELLED')}
                        disabled={isSubmitting}
                    >
                        <XCircle size={15} /> Cancel Duty
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            className="adm-btn adm-btn--secondary"
                            onClick={() => handleAction('IN_PROGRESS')}
                            disabled={isSubmitting}
                            title="Return duty back to nurse staff for corrections"
                        >
                            <RotateCcw size={15} /> Return for Correction
                        </button>
                        <button
                            type="button"
                            className="adm-btn adm-btn--primary"
                            onClick={() => handleAction('APPROVED')}
                            disabled={isSubmitting}
                            style={{ background: '#059669', borderColor: '#059669' }}
                        >
                            <CheckCircle2 size={15} /> {isSubmitting ? 'Approving...' : 'Approve Duty'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
