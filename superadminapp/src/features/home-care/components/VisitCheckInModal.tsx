import { PlayCircle, X } from 'lucide-react';
import type { VisitTask } from '../homeCare.types';

interface VisitCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    visit: VisitTask | null;
    isSubmitting: boolean;
}

export function VisitCheckInModal({
    isOpen,
    onClose,
    onConfirm,
    visit,
    isSubmitting
}: VisitCheckInModalProps) {
    if (!isOpen || !visit) return null;

    let rawMeta: Record<string, unknown> | null = null;
    try {
        const enquiryObj = visit.enquiry as unknown as { rawMessage?: unknown };
        if (typeof enquiryObj?.rawMessage === 'string') {
            rawMeta = JSON.parse(enquiryObj.rawMessage);
        } else if (enquiryObj?.rawMessage && typeof enquiryObj.rawMessage === 'object') {
            rawMeta = enquiryObj.rawMessage as Record<string, unknown>;
        }
    } catch {
        rawMeta = null;
    }

    const enquiryAny = visit.enquiry as unknown as {
        client?: { name?: string };
        admission?: { patient?: { name?: string } };
    };

    const clientName = enquiryAny?.client?.name || visit.enquiry?.clientName || 'Client';
    const patientName =
        enquiryAny?.admission?.patient?.name ||
        (rawMeta?.patientName as string) ||
        visit.enquiry?.patientName ||
        clientName;

    const handleCheckIn = async () => {
        try {
            await onConfirm();
            onClose();
        } catch (err) {
            console.error('Check-in error:', err);
        }
    };

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--sm" style={{ maxWidth: 440 }}>
                <div className="adm-modal-header">
                    <div className="adm-modal-title-group">
                        <PlayCircle className="adm-modal-icon" color="#0f969c" />
                        <div>
                            <h3 className="adm-modal-title">Confirm Visit Check-In</h3>
                            <p className="adm-modal-subtitle">Start your scheduled home care visit duty.</p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="adm-modal-body">
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Visit Task</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{visit.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                            Patient: <strong>{patientName}</strong> {clientName && clientName !== patientName ? `(Client: ${clientName}) ` : ''}{visit.refNo ? `· Ref: ${visit.refNo}` : ''}
                        </div>
                    </div>

                    <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                        Confirming check-in will mark this visit task as <strong>IN_PROGRESS</strong>.
                        You will then be able to log patient vitals, record daily care notes, and complete check-out.
                    </p>
                </div>

                <div className="adm-modal-footer">
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={handleCheckIn}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Checking In...' : 'Confirm Check-In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
