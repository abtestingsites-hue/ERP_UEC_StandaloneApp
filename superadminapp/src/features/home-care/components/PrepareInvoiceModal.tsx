import { useState } from 'react';
import {
    X,
    FileSpreadsheet,
    Receipt,
    CheckCircle2,
    Building2,
    DollarSign,
    Calendar,
    ArrowRight,
    MessageSquare
} from 'lucide-react';
import { UNCF_BRANDING } from '../../../constants/branding';
import { homeCareService } from '../homeCare.service';
import type { HomeCareAdmission, ServiceContract } from '../homeCare.types';

interface PrepareInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    admission: HomeCareAdmission | null;
    contract: ServiceContract | null;
    onInvoiceCreated: (invoiceRef: string) => Promise<void>;
    activeUnitId?: string | null;
}

export function PrepareInvoiceModal({
    isOpen,
    onClose,
    admission,
    contract,
    onInvoiceCreated,
    activeUnitId
}: PrepareInvoiceModalProps) {
    if (!isOpen || !contract) return null;

    return (
        <PrepareInvoiceModalContent
            isOpen={isOpen}
            onClose={onClose}
            admission={admission}
            contract={contract}
            onInvoiceCreated={onInvoiceCreated}
            activeUnitId={activeUnitId}
        />
    );
}

function PrepareInvoiceModalContent({
    onClose,
    admission,
    contract,
    onInvoiceCreated,
    activeUnitId
}: PrepareInvoiceModalProps) {
    const clientName = admission?.patient?.name || admission?.enquiry?.client?.name || 'Home Care Client';
    const initialAmount = contract?.servicePrice || 0;

    const [amount, setAmount] = useState<number>(initialAmount);
    const [billingPeriodFrom, setBillingPeriodFrom] = useState(() =>
        contract?.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    );
    const [billingPeriodTo, setBillingPeriodTo] = useState(() =>
        contract?.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    );
    const [paymentMode, setPaymentMode] = useState('Bank Transfer');
    const [invoiceNotes, setInvoiceNotes] = useState(
        `Home Care service fee for ${clientName} (${contract?.billingCycle || 'Monthly'}) under contract ${contract?.contractNumber}`
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; refNo?: string } | null>(null);
    const [sentWhatsApp, setSentWhatsApp] = useState(false);
    const clientMobile = admission?.enquiry?.client?.mobile || admission?.patient?.mobile || '';

    const formatHomeCareContractWhatsAppMessage = (refNo: string) => {
        const period = `${billingPeriodFrom} to ${billingPeriodTo}`;
        const recipient = admission?.enquiry?.client?.name || clientName;
        const total = Number(amount).toFixed(2);
        const shift = contract?.shift || 'Home Care Service';
        const service = admission?.enquiry?.service?.name || 'Home Care Domiciliary Service';
        const address = admission?.enquiry?.client?.address || '';

        return (
            `*Universal Nature Care & Cure Foundation (UNCF Trust)*\n` +
            `*Home Care Domiciliary Service Statement & Payment Advice*\n\n` +
            `Dear ${recipient},\n\n` +
            `Please find the official *Home Care Service* statement details for *${clientName}* (Ref: *${refNo}*):\n\n` +
            `📋 *Service & Care Details:*\n` +
            `• *Client / Patient:* ${clientName}\n` +
            `• *Service Package:* ${service}\n` +
            `• *Care Shift & Duty:* ${shift}\n` +
            (address ? `• *Care Delivery Address:* ${address}\n` : '') +
            `• *Billing Period:* ${period}\n` +
            `• *Total Due:* *₹${total}*\n\n` +
            `💳 *Payment Details / UPI:*\n` +
            `• *UPI ID:* ${UNCF_BRANDING.bankDetails.upiId}\n` +
            `• *Bank:* ${UNCF_BRANDING.bankDetails.bankName} | A/C: ${UNCF_BRANDING.bankDetails.accountNumber} | IFSC: ${UNCF_BRANDING.bankDetails.ifscCode}\n` +
            `_(Please quote Ref ${refNo} when transferring funds)_\n\n` +
            `🙏 _"${UNCF_BRANDING.gitaQuotes[0].quote} — ${UNCF_BRANDING.gitaQuotes[0].verse}"_\n\n` +
            `Thank you for entrusting Universal Health Care with your care.`
        );
    };

    const handleSendWhatsApp = () => {
        let raw = clientMobile.trim();
        if (!raw) {
            const promptPhone = window.prompt('Enter WhatsApp Mobile Number for Family / Client (10 digits):', clientMobile);
            if (!promptPhone) return;
            raw = promptPhone.trim();
        }
        let clean = raw.replace(/[^0-9]/g, '');
        if (clean.length === 10) clean = `91${clean}`;
        if (clean.length < 10) {
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }

        const msg = formatHomeCareContractWhatsAppMessage(feedback?.refNo || 'INV-SUCCESS');
        const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSentWhatsApp(true);
    };

    const handleGenerateInvoice = async () => {
        if (!amount || amount <= 0) {
            setFeedback({ type: 'error', message: 'Invoice amount must be greater than zero.' });
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        try {
            const result = await homeCareService.createContractInvoice({
                amount: Number(amount),
                clientName,
                category: admission?.enquiry?.service?.name || 'Home Care Domiciliary Service',
                allocationId: null,
                mode: paymentMode,
                remarks: invoiceNotes,
                date: new Date().toISOString(),
                unitId: activeUnitId || contract?.unitId
            });

            const refNo = result?.refNo || result?.data?.refNo || 'INV-SUCCESS';
            setFeedback({
                type: 'success',
                message: `Invoice generated successfully and handed off to Finance!`,
                refNo
            });

            await onInvoiceCreated(refNo);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to prepare billing invoice.';
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
                    maxWidth: 560,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div className="adm-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                    <div className="adm-modal-title-group">
                        <Receipt className="adm-modal-icon" size={20} color="#0f969c" />
                        <div>
                            <h3 className="adm-modal-title" style={{ margin: 0 }}>
                                Prepare Billing & Finance Handoff
                            </h3>
                            <p className="adm-modal-subtitle" style={{ margin: '2px 0 0' }}>
                                Contract: <strong>{contract?.contractNumber}</strong> · Client: <strong>{clientName}</strong>
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="adm-modal-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {feedback && (
                        <div className={`adm-alert adm-alert--${feedback.type === 'success' ? 'success' : 'error'}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{feedback.message}</div>
                                    {feedback.refNo && (
                                        <div style={{ marginTop: 2, fontWeight: 700, fontSize: 13, color: '#0f766e' }}>
                                            Traceable Ref: {feedback.refNo}
                                        </div>
                                    )}
                                </div>
                                {feedback.type === 'success' && (
                                    <button
                                        type="button"
                                        onClick={handleSendWhatsApp}
                                        style={{
                                            backgroundColor: '#25D366',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '7px 14px',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                        }}
                                    >
                                        <MessageSquare size={14} />
                                        {sentWhatsApp ? 'Dispatched to WhatsApp' : 'Send via WhatsApp'}
                                    </button>
                                )}
                            </div>

                            {feedback.type === 'success' && (
                                <div style={{ marginTop: 10, borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0f766e' }}>
                                            Prefilled WhatsApp Advice Message:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(formatHomeCareContractWhatsAppMessage(feedback.refNo || 'INV-SUCCESS'));
                                                alert('Prefilled WhatsApp message copied to clipboard!');
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#0f969c',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Copy Text
                                        </button>
                                    </div>
                                    <pre
                                        style={{
                                            margin: 0,
                                            padding: '8px 10px',
                                            backgroundColor: 'rgba(255,255,255,0.85)',
                                            borderRadius: 6,
                                            fontSize: 11,
                                            whiteSpace: 'pre-wrap',
                                            maxHeight: 120,
                                            overflowY: 'auto',
                                            fontFamily: 'inherit',
                                            color: '#334155',
                                            lineHeight: 1.45
                                        }}
                                    >
                                        {formatHomeCareContractWhatsAppMessage(feedback.refNo || 'INV-SUCCESS')}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rate & Contract Summary Card */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                            <div>
                                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Service Package</span>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{admission?.enquiry?.service?.name || 'Home Care'}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Caregiver Plan</span>
                                <div style={{ fontWeight: 600, color: '#0f969c' }}>{contract?.shift} ({contract?.frequency})</div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Agreed Contract Rate</span>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                                    ₹{Number(contract?.servicePrice || 0).toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>/ {contract?.billingCycle}</span>
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Billing Schedule</span>
                                <div style={{ fontWeight: 600, color: '#2563eb' }}>{contract?.billingCycle || 'Monthly'} Cycle</div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Inputs */}
                    <div className="adm-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Billing Period (From)</label>
                                <input
                                    type="date"
                                    className="adm-form-input"
                                    value={billingPeriodFrom}
                                    onChange={(e) => setBillingPeriodFrom(e.target.value)}
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Billing Period (To)</label>
                                <input
                                    type="date"
                                    className="adm-form-input"
                                    value={billingPeriodTo}
                                    onChange={(e) => setBillingPeriodTo(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Total Amount to Bill (₹) *</label>
                                <input
                                    type="number"
                                    className="adm-form-input"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Payment Mode</label>
                                <select
                                    className="adm-form-input"
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                >
                                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                    <option value="UPI">UPI / GPay / PhonePe</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Traceable Billing Description</label>
                            <textarea
                                className="adm-form-input"
                                rows={2}
                                value={invoiceNotes}
                                onChange={(e) => setInvoiceNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="adm-modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose} disabled={isSubmitting}>
                        {feedback?.type === 'success' ? 'Close' : 'Cancel'}
                    </button>
                    {feedback?.type === 'success' ? (
                        <button
                            type="button"
                            className="adm-btn adm-btn--primary"
                            onClick={onClose}
                        >
                            <CheckCircle2 size={14} />
                            Done & Close
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="adm-btn adm-btn--primary"
                            onClick={handleGenerateInvoice}
                            disabled={isSubmitting}
                        >
                            <Receipt size={14} />
                            {isSubmitting ? 'Handing off to Finance...' : 'Confirm & Hand Off to Finance'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
