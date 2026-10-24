import { useState, useEffect } from 'react';
import {
    X,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    Coins,
    PackageCheck,
    FileCheck,
    Lock,
    Activity
} from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { HomeCareAdmission, ServiceContract, ServiceClosureRecord } from '../homeCare.types';

interface ServiceClosureModalProps {
    isOpen: boolean;
    onClose: () => void;
    admission: HomeCareAdmission | null;
    contract: ServiceContract | null;
    onClosureComplete: () => Promise<void>;
}

export function ServiceClosureModal({
    isOpen,
    onClose,
    admission,
    contract,
    onClosureComplete
}: ServiceClosureModalProps) {
    const [closure, setClosure] = useState<ServiceClosureRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [closingRemarks, setClosingRemarks] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const admissionId = admission?.id;

    const loadClosureStatus = () => {
        if (!admissionId) return;
        setIsLoading(true);
        homeCareService
            .getClosure(admissionId)
            .then((data) => {
                setClosure(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load service closure:', err);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        if (!isOpen || !admissionId) return;
        setClosingRemarks('');
        setFeedback(null);
        loadClosureStatus();
    }, [isOpen, admissionId]);

    if (!isOpen || !admission) return null;

    const clientName = admission.patient?.name || admission.enquiry?.client?.name || 'Home Care Patient';
    const contractNo = contract?.contractNumber || 'Contract on file';

    const handleClearRequirement = async (type: 'MEDICAL' | 'FINANCE' | 'ASSET') => {
        if (!closure?.id) return;
        setIsSubmitting(true);
        setFeedback(null);
        try {
            const updated = await homeCareService.clearClosureRequirement(closure.id, type, `Cleared by manager for ${clientName}`);
            setClosure(updated);
            setFeedback({ type: 'success', message: `${type} clearance granted successfully.` });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || `Failed to grant ${type} clearance`;
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExecuteClosure = async () => {
        if (!closure?.id) return;
        if (!closingRemarks.trim()) {
            setFeedback({ type: 'error', message: 'Please enter final closing remarks before completing service closure.' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        try {
            await homeCareService.executeServiceClosure(closure.id, closingRemarks.trim());
            setFeedback({ type: 'success', message: 'Service closure executed successfully! Contract completed and admission discharged.' });
            await onClosureComplete();
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to execute closure';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAllCleared = Boolean(closure?.medicalCleared && closure?.financeCleared && closure?.assetCleared);
    const isExecuted = closure?.status === 'EXECUTED';
    const outstanding = closure?.outstandingBalance ?? 0;

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div
                className="adm-modal-container"
                style={{
                    maxWidth: 600,
                    width: '100%',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div className="adm-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                    <div className="adm-modal-title-group">
                        <FileCheck className="adm-modal-icon" size={20} color="#0f969c" />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h3 className="adm-modal-title" style={{ margin: 0 }}>
                                    Service Closure & Discharge Clearance
                                </h3>
                                <span
                                    className={`adm-badge ${
                                        isExecuted
                                            ? 'adm-badge--secondary'
                                            : isAllCleared
                                            ? 'adm-badge--success'
                                            : 'adm-badge--warning'
                                    }`}
                                >
                                    {isExecuted ? 'CLOSED / DISCHARGED' : isAllCleared ? 'READY FOR CLOSURE' : 'CLEARANCE PENDING'}
                                </span>
                            </div>
                            <p className="adm-modal-subtitle" style={{ margin: '2px 0 0' }}>
                                Contract: <strong>{contractNo}</strong> · Client: <strong>{clientName}</strong>
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

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 12, color: '#475569' }}>
                        Operational and financial policy mandates all three stages must be cleared before service contract closure.
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: 32 }}>
                            <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                            <p style={{ color: '#64748b', fontSize: 13 }}>Verifying clearance registry...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {/* Checkpoint 1: Medical / Operational Clearance */}
                            <div
                                style={{
                                    border: '1px solid',
                                    borderColor: closure?.medicalCleared ? '#bbf7d0' : '#e2e8f0',
                                    background: closure?.medicalCleared ? '#f0fdf4' : '#fff',
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <ShieldCheck size={20} color={closure?.medicalCleared ? '#16a34a' : '#64748b'} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                            1. Operational & Care Delivery Check
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {closure?.medicalCleared
                                                ? `Cleared on ${new Date(closure.medicalClearedAt || '').toLocaleDateString()}`
                                                : 'Verify all scheduled caregiver duties are completed and handover finished.'}
                                        </div>
                                    </div>
                                </div>
                                {!closure?.medicalCleared && !isExecuted && (
                                    <button
                                        type="button"
                                        className="adm-btn adm-btn--secondary"
                                        style={{ fontSize: 11, padding: '4px 10px' }}
                                        onClick={() => handleClearRequirement('MEDICAL')}
                                        disabled={isSubmitting}
                                    >
                                        <CheckCircle2 size={12} /> Clear Operational
                                    </button>
                                )}
                                {closure?.medicalCleared && (
                                    <span className="adm-badge adm-badge--success" style={{ fontSize: 11 }}>CLEARED</span>
                                )}
                            </div>

                            {/* Checkpoint 2: Financial Clearance */}
                            <div
                                style={{
                                    border: '1px solid',
                                    borderColor: closure?.financeCleared ? '#bbf7d0' : '#e2e8f0',
                                    background: closure?.financeCleared ? '#f0fdf4' : '#fff',
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Coins size={20} color={closure?.financeCleared ? '#16a34a' : '#64748b'} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                            2. Financial Ledger & Settlement Check
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {closure?.financeCleared ? (
                                                `Cleared on ${new Date(closure.financeClearedAt || '').toLocaleDateString()}`
                                            ) : (
                                                <span>
                                                    Outstanding Balance: <strong>₹{outstanding.toFixed(2)}</strong> (Must be ₹0.00 to clear)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!closure?.financeCleared && !isExecuted && (
                                    <button
                                        type="button"
                                        className="adm-btn adm-btn--secondary"
                                        style={{ fontSize: 11, padding: '4px 10px' }}
                                        onClick={() => handleClearRequirement('FINANCE')}
                                        disabled={isSubmitting}
                                    >
                                        <CheckCircle2 size={12} /> Clear Financial
                                    </button>
                                )}
                                {closure?.financeCleared && (
                                    <span className="adm-badge adm-badge--success" style={{ fontSize: 11 }}>CLEARED</span>
                                )}
                            </div>

                            {/* Checkpoint 3: Asset & Equipment Clearance */}
                            <div
                                style={{
                                    border: '1px solid',
                                    borderColor: closure?.assetCleared ? '#bbf7d0' : '#e2e8f0',
                                    background: closure?.assetCleared ? '#f0fdf4' : '#fff',
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <PackageCheck size={20} color={closure?.assetCleared ? '#16a34a' : '#64748b'} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                            3. Asset & Equipment Return Check
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {closure?.assetCleared
                                                ? `Cleared on ${new Date(closure.assetClearedAt || '').toLocaleDateString()}`
                                                : 'Confirm return of all home care medical devices, kits, and supplies.'}
                                        </div>
                                    </div>
                                </div>
                                {!closure?.assetCleared && !isExecuted && (
                                    <button
                                        type="button"
                                        className="adm-btn adm-btn--secondary"
                                        style={{ fontSize: 11, padding: '4px 10px' }}
                                        onClick={() => handleClearRequirement('ASSET')}
                                        disabled={isSubmitting}
                                    >
                                        <CheckCircle2 size={12} /> Clear Assets
                                    </button>
                                )}
                                {closure?.assetCleared && (
                                    <span className="adm-badge adm-badge--success" style={{ fontSize: 11 }}>CLEARED</span>
                                )}
                            </div>

                            {/* Execution Remarks */}
                            {!isExecuted && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                                    <label className="adm-form-label" style={{ fontSize: 12, fontWeight: 600 }}>
                                        Final Closure Summary & Handover Remarks
                                    </label>
                                    <textarea
                                        className="adm-form-input"
                                        rows={2}
                                        placeholder="Record termination or completion notes, client satisfaction summary..."
                                        value={closingRemarks}
                                        onChange={(e) => setClosingRemarks(e.target.value)}
                                        disabled={!isAllCleared || isSubmitting}
                                    />
                                    {!isAllCleared && (
                                        <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                                            Closing remarks will unlock once all 3 operational checks are cleared.
                                        </span>
                                    )}
                                </div>
                            )}

                            {isExecuted && closure?.closingRemarks && (
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 12 }}>
                                    <strong>Closure Remarks on File:</strong>
                                    <p style={{ margin: '4px 0 0', color: '#334155' }}>{closure.closingRemarks}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="adm-modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose} disabled={isSubmitting}>
                        Close
                    </button>

                    {!isExecuted && (
                        <button
                            type="button"
                            className="adm-btn adm-btn--primary"
                            onClick={handleExecuteClosure}
                            disabled={!isAllCleared || isSubmitting}
                        >
                            <Lock size={14} />
                            {isSubmitting ? 'Executing Closure...' : 'Execute Final Service Closure'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
