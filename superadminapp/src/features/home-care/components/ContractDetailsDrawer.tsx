import { useState } from 'react';
import {
    X,
    CheckCircle2,
    FileSignature,
    Save,
    AlertOctagon,
    RotateCw,
    Lock,
    Edit3
} from 'lucide-react';
import type { ServiceContract, HomeCareAdmission, UpdateContractPayload } from '../homeCare.types';

interface ContractDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    contract: ServiceContract | null;
    admission: HomeCareAdmission | null;
    onActivate: (contractId: string) => Promise<void>;
    onUpdate: (id: string, payload: UpdateContractPayload) => Promise<void>;
    onOpenClosure?: (admission: HomeCareAdmission, contract: ServiceContract) => void;
}

export function ContractDetailsDrawer(props: ContractDetailsDrawerProps) {
    if (!props.isOpen || !props.contract) return null;
    return <ContractDetailsDrawerContent key={props.contract.id || 'none'} {...props} />;
}

function ContractDetailsDrawerContent({
    onClose,
    contract,
    admission,
    onActivate,
    onUpdate,
    onOpenClosure
}: ContractDetailsDrawerProps) {
    const [isActivating, setIsActivating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Editing mode for active contracts
    const [isAmendmentMode, setIsAmendmentMode] = useState(false);
    const [amendmentReason, setAmendmentReason] = useState('');
    const [showCancelPrompt, setShowCancelPrompt] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    // Form state initialized directly from contract prop
    const [startDate, setStartDate] = useState(() =>
        contract?.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    );
    const [endDate, setEndDate] = useState(() =>
        contract?.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : ''
    );
    const [servicePrice, setServicePrice] = useState<number | ''>(() => contract?.servicePrice ?? '');
    const [billingCycle, setBillingCycle] = useState(() => contract?.billingCycle || 'Monthly');
    const [staffRequired, setStaffRequired] = useState<number>(() => contract?.staffRequired ?? 1);
    const [shift, setShift] = useState(() => contract?.shift || '12 Hours Day');
    const [frequency, setFrequency] = useState(() => contract?.frequency || 'Daily');
    const [specialInstructions, setSpecialInstructions] = useState(() => contract?.specialInstructions || '');

    const hasContract = Boolean(contract && contract.id);
    const isDraft = hasContract && contract?.status === 'DRAFT';
    const isActive = hasContract && contract?.status === 'ACTIVE';
    const isCancelled = hasContract && contract?.status === 'CANCELLED';
    const isCompleted = hasContract && contract?.status === 'COMPLETED';

    const isEditable = isDraft || (isActive && isAmendmentMode);

    const handleSaveUpdates = async () => {
        if (!contract?.id) return;

        if (isActive && !amendmentReason.trim()) {
            setFeedback({ type: 'error', message: 'Please provide an amendment/renewal reason for auditing.' });
            return;
        }

        setIsSaving(true);
        setFeedback(null);
        try {
            await onUpdate(contract.id, {
                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                endDate: endDate ? new Date(endDate).toISOString() : null,
                servicePrice: servicePrice !== '' ? Number(servicePrice) : null,
                billingCycle,
                staffRequired: Number(staffRequired),
                shift,
                frequency,
                specialInstructions,
                amendmentReason: amendmentReason.trim() || undefined
            });
            setIsAmendmentMode(false);
            setAmendmentReason('');
            setFeedback({ type: 'success', message: 'Contract terms and validity dates updated successfully.' });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to update contract.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSaving(false);
        }
    };

    const handleActivateContract = async () => {
        if (!contract?.id) return;
        setIsActivating(true);
        setFeedback(null);
        try {
            await onActivate(contract.id);
            setFeedback({ type: 'success', message: 'Contract successfully activated! Staff can now be allocated.' });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to activate contract.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsActivating(false);
        }
    };

    const handleCancelOrTerminate = async () => {
        if (!contract?.id) return;
        if (!cancelReason.trim()) {
            setFeedback({ type: 'error', message: 'Please enter a termination or suspension reason.' });
            return;
        }

        setIsSaving(true);
        setFeedback(null);
        try {
            await onUpdate(contract.id, {
                status: 'CANCELLED',
                reason: cancelReason.trim()
            });
            setShowCancelPrompt(false);
            setFeedback({ type: 'success', message: 'Contract suspended / terminated on file.' });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to terminate contract.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSaving(false);
        }
    };

    const patientName = admission?.patient?.name || admission?.enquiry?.client?.name || 'Home Care Patient';

    // Parse amendments audit history
    let amendments: any[] = [];
    if (contract?.termsSnapshot && typeof contract.termsSnapshot === 'object' && 'amendments' in contract.termsSnapshot) {
        amendments = Array.isArray((contract.termsSnapshot as any).amendments) ? (contract.termsSnapshot as any).amendments : [];
    }

    return (
        <div className="adm-modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }} role="dialog" aria-modal="true">
            <div
                className="adm-modal-container"
                style={{
                    width: '100%',
                    maxWidth: 520,
                    height: '100vh',
                    borderRadius: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideInRight 0.25s ease-out'
                }}
            >
                {/* Header */}
                <div className="adm-modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
                    <div className="adm-modal-title-group">
                        <FileSignature className="adm-modal-icon" />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h3 className="adm-modal-title" style={{ margin: 0 }}>
                                    {hasContract ? contract?.contractNumber : 'No Contract Generated'}
                                </h3>
                                {hasContract && (
                                    <span
                                        className={`adm-badge ${
                                            isActive
                                                ? 'adm-badge--success'
                                                : isDraft
                                                ? 'adm-badge--warning'
                                                : isCancelled
                                                ? 'adm-badge--error'
                                                : 'adm-badge--secondary'
                                        }`}
                                    >
                                        {contract?.status}
                                    </span>
                                )}
                            </div>
                            <p className="adm-modal-subtitle" style={{ marginTop: 2 }}>
                                Client: <strong>{patientName}</strong>
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="adm-modal-body" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {feedback && (
                        <div
                            className={`adm-alert adm-alert--${feedback.type === 'success' ? 'success' : 'error'}`}
                            style={{ marginBottom: 14 }}
                        >
                            {feedback.message}
                        </div>
                    )}

                    {/* Activation Banner for Drafts */}
                    {isDraft && (
                        <div
                            style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: 8,
                                padding: '12px 14px',
                                marginBottom: 16
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
                                        Ready for Activation
                                    </div>
                                    <div style={{ fontSize: 11, color: '#3b82f6' }}>
                                        Activate this contract to accept terms and enable caregiver allocation.
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="adm-btn adm-btn--primary"
                                    style={{ fontSize: 12, padding: '5px 12px' }}
                                    onClick={handleActivateContract}
                                    disabled={isActivating || isSaving}
                                >
                                    <CheckCircle2 size={13} />
                                    {isActivating ? 'Activating...' : 'Activate Contract'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Contract Status & Operations Toolbar */}
                    {isActive && (
                        <div
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '12px 14px',
                                marginBottom: 16,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
                                        ● Active Contract Ongoing
                                    </span>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                        Accepted: {contract?.termsAcceptedAt ? new Date(contract.termsAcceptedAt).toLocaleDateString() : 'Active'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 6 }}>
                                    {!isAmendmentMode ? (
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            style={{ fontSize: 11, padding: '4px 10px' }}
                                            onClick={() => setIsAmendmentMode(true)}
                                        >
                                            <Edit3 size={12} /> Renew / Extend Terms
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            style={{ fontSize: 11, padding: '4px 10px' }}
                                            onClick={() => setIsAmendmentMode(false)}
                                        >
                                            Cancel Editing
                                        </button>
                                    )}

                                    {admission && onOpenClosure && (
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            style={{ fontSize: 11, padding: '4px 10px', color: '#0f969c', borderColor: '#ccfbf1' }}
                                            onClick={() => {
                                                onClose();
                                                onOpenClosure(admission, contract);
                                            }}
                                        >
                                            <Lock size={12} /> Close Service
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Termination / Suspension Action */}
                            {!showCancelPrompt ? (
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="adm-btn adm-btn--secondary"
                                        style={{ fontSize: 10, padding: '3px 8px', color: '#dc2626', borderColor: '#fecaca' }}
                                        onClick={() => setShowCancelPrompt(true)}
                                    >
                                        <AlertOctagon size={11} /> Suspend / Terminate
                                    </button>
                                </div>
                            ) : (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>Record Contract Suspension or Termination</span>
                                    <input
                                        type="text"
                                        placeholder="Reason for suspension or termination (client request, hospital admission, etc.)..."
                                        className="adm-form-input"
                                        style={{ fontSize: 12 }}
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                        <button type="button" className="adm-btn adm-btn--secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setShowCancelPrompt(false)}>
                                            Cancel
                                        </button>
                                        <button type="button" className="adm-btn adm-btn--warning" style={{ fontSize: 11, padding: '3px 8px' }} onClick={handleCancelOrTerminate} disabled={isSaving}>
                                            Confirm Termination
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Amendment Reason Box (When active terms are edited) */}
                    {isAmendmentMode && (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                            <label className="adm-form-label" style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>
                                Reason for Contract Extension / Term Amendment *
                            </label>
                            <input
                                type="text"
                                placeholder="E.g., Client renewed for 3 months, or adjusted shift timing..."
                                className="adm-form-input"
                                style={{ fontSize: 12, marginTop: 4 }}
                                value={amendmentReason}
                                onChange={(e) => setAmendmentReason(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Contract Details Form */}
                    <div className="adm-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Start Date</label>
                            <input
                                type="date"
                                className="adm-form-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                disabled={!isEditable}
                            />
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">End Date (Validity / Renewal)</label>
                            <input
                                type="date"
                                className="adm-form-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                disabled={!isEditable}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Staff Required</label>
                                <input
                                    type="number"
                                    className="adm-form-input"
                                    value={staffRequired}
                                    onChange={(e) => setStaffRequired(Number(e.target.value))}
                                    disabled={!isEditable}
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Shift</label>
                                <select
                                    className="adm-form-input"
                                    value={shift}
                                    onChange={(e) => setShift(e.target.value)}
                                    disabled={!isEditable}
                                >
                                    <option value="12 Hours Day">12 Hours Day</option>
                                    <option value="12 Hours Night">12 Hours Night</option>
                                    <option value="24 Hours Live-In">24 Hours Live-In</option>
                                    <option value="8 Hours Day">8 Hours Day</option>
                                    <option value="Part-Time Visit">Part-Time Visit</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Frequency</label>
                                <select
                                    className="adm-form-input"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                    disabled={!isEditable}
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Alternate Days">Alternate Days</option>
                                    <option value="Weekdays Only">Weekdays Only</option>
                                </select>
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Agreed Rate (₹)</label>
                                <input
                                    type="number"
                                    className="adm-form-input"
                                    value={servicePrice}
                                    onChange={(e) => setServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                    disabled={!isEditable}
                                />
                            </div>
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Billing Cycle</label>
                            <select
                                className="adm-form-input"
                                value={billingCycle}
                                onChange={(e) => setBillingCycle(e.target.value)}
                                disabled={!isEditable}
                            >
                                <option value="Monthly">Monthly</option>
                                <option value="Bi-Weekly">Bi-Weekly</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Per-Visit">Per-Visit</option>
                                <option value="One-Time / Advance">One-Time / Advance</option>
                            </select>
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Special Instructions</label>
                            <textarea
                                className="adm-form-input"
                                rows={2}
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                disabled={!isEditable}
                            />
                        </div>

                        {/* Amendment Audit History */}
                        {amendments.length > 0 && (
                            <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <RotateCw size={13} /> Contract Amendment Audit Trail ({amendments.length})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {amendments.map((a, idx) => (
                                        <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                <span>{a.modifiedByName || 'Supervisor'}</span>
                                                <span>{new Date(a.modifiedAt).toLocaleString()}</span>
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                                                {a.changes?.reason || 'Terms modified'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="adm-modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose}>
                        Close
                    </button>
                    {isEditable && (
                        <button
                            type="button"
                            className="adm-btn adm-btn--primary"
                            onClick={handleSaveUpdates}
                            disabled={isSaving || isActivating}
                        >
                            <Save size={14} />
                            {isSaving ? 'Saving Changes...' : isDraft ? 'Save Draft Updates' : 'Save Amendment / Renewal'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
