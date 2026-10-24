import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { VisitTask } from '../homeCare.types';

interface VisitCheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (remarks: string) => Promise<void>;
    visit: VisitTask | null;
    isSubmitting: boolean;
}

export function VisitCheckOutModal({
    isOpen,
    onClose,
    onConfirm,
    visit,
    isSubmitting
}: VisitCheckOutModalProps) {
    const [remarks, setRemarks] = useState('');

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

    const handleCheckOut = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onConfirm(remarks);
            setRemarks('');
            onClose();
        } catch (err) {
            console.error('Check-out error:', err);
        }
    };

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--sm" style={{ maxWidth: 460 }}>
                <div className="adm-modal-header">
                    <div className="adm-modal-title-group">
                        <CheckCircle2 className="adm-modal-icon" color="#059669" />
                        <div>
                            <h3 className="adm-modal-title">Complete Visit & Check-Out</h3>
                            <p className="adm-modal-subtitle">Conclude today's caregiver visit for this client.</p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleCheckOut}>
                    <div className="adm-modal-body">
                        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Visit Task</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{visit.title}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                Patient: <strong>{patientName}</strong> {clientName && clientName !== patientName ? `(Client: ${clientName})` : ''}
                            </div>
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Caregiver Summary / Handover Remarks</label>
                            <textarea
                                className="adm-form-input"
                                rows={3}
                                placeholder="Summary of care delivered, client condition, dietary intake, or issues to report..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>
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
                            type="submit"
                            className="adm-btn adm-btn--primary"
                            disabled={isSubmitting}
                            style={{ background: '#059669', borderColor: '#059669' }}
                        >
                            {isSubmitting ? 'Checking Out...' : 'Complete & Check Out'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
