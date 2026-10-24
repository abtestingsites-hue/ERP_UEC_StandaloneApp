import { useState, useEffect } from 'react';
import {
    X,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Clock,
    User,
    HeartPulse,
    Activity,
    FileText,
    Calendar
} from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { VisitTask } from '../homeCare.types';

interface VisitAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: VisitTask | null;
    onVerify: (visitId: string, notes: string) => Promise<void>;
    onRequestCorrection: (visitId: string, notes: string) => Promise<void>;
}

export function VisitAuditModal({
    isOpen,
    onClose,
    visit,
    onVerify,
    onRequestCorrection
}: VisitAuditModalProps) {
    const [patientVitals, setPatientVitals] = useState<any[]>([]);
    const [patientNotes, setPatientNotes] = useState<any[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [supervisorNotes, setSupervisorNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showCorrectionInput, setShowCorrectionInput] = useState(false);

    const patientId =
        visit?.patientId ||
        (visit?.enquiry?.admission as any)?.patient?.id ||
        visit?.enquiry?.admission?.patientId ||
        visit?.metadata?.patientId;

    useEffect(() => {
        if (!isOpen || !visit) return;
        setSupervisorNotes('');
        setFeedback(null);
        setShowCorrectionInput(false);

        if (patientId) {
            setIsLoadingRecords(true);
            Promise.all([
                homeCareService.getPatientVitals(patientId),
                homeCareService.getPatientCareNotes(patientId)
            ])
                .then(([vitals, notes]) => {
                    setPatientVitals(vitals);
                    setPatientNotes(notes);
                    setIsLoadingRecords(false);
                })
                .catch(() => {
                    setIsLoadingRecords(false);
                });
        }
    }, [isOpen, visit, patientId]);

    if (!isOpen || !visit) return null;

    const normStatus = String(visit.status || '').toUpperCase();
    const isApproved = normStatus === 'APPROVED';
    const isCompleted = normStatus === 'COMPLETED';
    const clientName = visit.enquiry?.patientName || visit.enquiry?.clientName || 'Client';
    const caregiverName = visit.assignedStaff?.fullName || visit.assignedStaff?.user?.name || 'Assigned Caregiver';

    const latestVital = patientVitals[0] || null;

    const handleVerify = async () => {
        setIsSubmitting(true);
        setFeedback(null);
        try {
            await onVerify(visit.id, supervisorNotes.trim() || 'Verified service delivery according to policy');
            setFeedback({ type: 'success', message: 'Visit verified and approved! Auto-reconciliation completed.' });
            setTimeout(() => {
                onClose();
            }, 900);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to verify visit';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCorrection = async () => {
        if (!supervisorNotes.trim()) {
            setFeedback({ type: 'error', message: 'Please provide exception or correction instructions.' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        try {
            await onRequestCorrection(visit.id, supervisorNotes.trim());
            setFeedback({ type: 'success', message: 'Exception recorded and correction requested.' });
            setTimeout(() => {
                onClose();
            }, 900);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to record exception';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div
                className="adm-modal-container"
                style={{
                    maxWidth: 620,
                    width: '100%',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div className="adm-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                    <div className="adm-modal-title-group">
                        <ShieldCheck className="adm-modal-icon" size={20} color="#0f969c" />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h3 className="adm-modal-title" style={{ margin: 0 }}>
                                    Visit Verification & Supervision
                                </h3>
                                <span
                                    className={`adm-badge ${
                                        isApproved
                                            ? 'adm-badge--success'
                                            : isCompleted
                                            ? 'adm-badge--warning'
                                            : 'adm-badge--secondary'
                                    }`}
                                >
                                    {isApproved ? 'VERIFIED / APPROVED' : normStatus}
                                </span>
                            </div>
                            <p className="adm-modal-subtitle" style={{ margin: '2px 0 0' }}>
                                Ref: <strong>{visit.refNo || visit.id.slice(0, 8)}</strong> · {visit.title}
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="adm-modal-body" style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {feedback && (
                        <div className={`adm-alert adm-alert--${feedback.type === 'success' ? 'success' : 'error'}`}>
                            {feedback.message}
                        </div>
                    )}

                    {/* Metadata Overview Card */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                            <div>
                                <span style={{ color: '#64748b', fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Client / Patient</span>
                                <strong style={{ color: '#0f172a' }}>{clientName}</strong>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{visit.enquiry?.address || 'Address on file'}</div>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Assigned Caregiver</span>
                                <strong style={{ color: '#0f969c' }}>{caregiverName}</strong>
                                <div style={{ fontSize: 11, color: '#64748b' }}>Mobile: {visit.enquiry?.mobile || 'N/A'}</div>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Scheduled Time</span>
                                <span style={{ color: '#334155' }}>
                                    {visit.dueDate ? new Date(visit.dueDate).toLocaleString() : 'Scheduled Duty'}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Completed Time</span>
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                    {visit.completedAt ? new Date(visit.completedAt).toLocaleString() : 'Pending Completion'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Caregiver Visit Notes / Departure Remarks */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <FileText size={15} color="#2563eb" />
                            <strong style={{ fontSize: 13, color: '#0f172a' }}>Caregiver Visit Remarks</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: '#334155', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, fontStyle: visit.remarks ? 'normal' : 'italic' }}>
                            {visit.remarks || 'No specific checkout remarks logged by caregiver.'}
                        </p>
                    </div>

                    {/* Recorded Vitals Snapshot */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <HeartPulse size={16} color="#e11d48" />
                                <strong style={{ fontSize: 13, color: '#0f172a' }}>Vital Signs & Clinical Snapshot</strong>
                            </div>
                            {latestVital && (
                                <span style={{ fontSize: 11, color: '#64748b' }}>
                                    Logged: {new Date(latestVital.createdAt || latestVital.date).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {isLoadingRecords ? (
                            <div style={{ textAlign: 'center', padding: 16 }}>
                                <Activity className="adm-spin" size={18} color="#0f969c" style={{ margin: '0 auto 4px' }} />
                                <span style={{ fontSize: 12, color: '#64748b' }}>Fetching vitals...</span>
                            </div>
                        ) : latestVital ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 6, border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>BP (mmHg)</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                        {latestVital.systolic && latestVital.diastolic ? `${latestVital.systolic}/${latestVital.diastolic}` : '—'}
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 6, border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Pulse (bpm)</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                        {latestVital.pulse || '—'}
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 6, border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>SpO2 (%)</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                        {latestVital.oxygenSaturation ? `${latestVital.oxygenSaturation}%` : '—'}
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 6, border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Temp (°F)</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                        {latestVital.temperature || '—'}
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 6, border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Sugar (mg/dL)</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                        {latestVital.bloodSugar || '—'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                                No specific vitals record found for this patient shift.
                            </div>
                        )}
                    </div>

                    {/* Supervisor Verification / Exception Input */}
                    {isApproved ? (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <CheckCircle2 size={20} color="#16a34a" />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                                    Service Delivery Verified & Approved
                                </div>
                                <div style={{ fontSize: 11, color: '#15803d' }}>
                                    This visit meets operational standards according to policy. Auto-reconciliation to billing is active.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label className="adm-form-label" style={{ fontSize: 12, fontWeight: 600 }}>
                                Supervisor Verification Remarks / Exception Notes
                            </label>
                            <textarea
                                className="adm-form-input"
                                rows={2}
                                placeholder="Enter supervisor review notes, policy compliance remarks, or correction instructions..."
                                value={supervisorNotes}
                                onChange={(e) => setSupervisorNotes(e.target.value)}
                            />

                            {showCorrectionInput && (
                                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#92400e' }}>
                                    Note: Flagging an exception will mark the visit for correction and notify the caregiver.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="adm-modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose} disabled={isSubmitting}>
                        Close
                    </button>

                    {!isApproved && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            {!showCorrectionInput ? (
                                <button
                                    type="button"
                                    className="adm-btn adm-btn--secondary"
                                    style={{ color: '#d97706', borderColor: '#fde68a' }}
                                    onClick={() => setShowCorrectionInput(true)}
                                    disabled={isSubmitting}
                                >
                                    <AlertTriangle size={14} /> Request Correction
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="adm-btn adm-btn--warning"
                                    onClick={handleCorrection}
                                    disabled={isSubmitting}
                                >
                                    <AlertTriangle size={14} /> Confirm Exception
                                </button>
                            )}

                            <button
                                type="button"
                                className="adm-btn adm-btn--primary"
                                onClick={handleVerify}
                                disabled={isSubmitting}
                            >
                                <CheckCircle2 size={14} />
                                {isSubmitting ? 'Verifying...' : 'Verify & Approve Delivery'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
