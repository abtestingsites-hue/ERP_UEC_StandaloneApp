import { useState } from 'react';
import { X, FileSignature } from 'lucide-react';
import type { HomeCareAdmission, HomeCareEnquiry, CreateContractPayload } from '../homeCare.types';

interface CreateContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    admission?: HomeCareAdmission | null;
    enquiry?: HomeCareEnquiry | null;
    onSubmit: (payload: CreateContractPayload) => Promise<void>;
    activeUnitId?: string | null;
}

export function CreateContractModal(props: CreateContractModalProps) {
    if (!props.isOpen || (!props.admission && !props.enquiry)) return null;
    const key = props.admission?.id || props.enquiry?.id || 'new-contract';
    return <CreateContractModalContent key={key} {...props} />;
}

function CreateContractModalContent({
    onClose,
    admission,
    enquiry,
    onSubmit,
    activeUnitId
}: CreateContractModalProps) {
    const enquiryReqs = enquiry?.serviceRequirements || admission?.enquiry?.serviceRequirements || {};

    let parsedMeta: Record<string, unknown> = {};
    const rawMsg = enquiry?.rawMessage || admission?.enquiry?.rawMessage;
    if (typeof rawMsg === 'string') {
        try { parsedMeta = JSON.parse(rawMsg); } catch { /* ignore */ }
    } else if (rawMsg && typeof rawMsg === 'object') {
        parsedMeta = rawMsg as Record<string, unknown>;
    }

    const patientName =
        enquiry?.patientName ||
        (parsedMeta.patientName as string) ||
        admission?.patient?.name ||
        admission?.enquiry?.client?.name ||
        enquiry?.client?.name ||
        enquiry?.clientName ||
        'Client';

    const clientName =
        enquiry?.client?.name ||
        enquiry?.clientName ||
        admission?.enquiry?.client?.name ||
        'Client';

    const serviceName =
        (enquiry as { service?: { name?: string } })?.service?.name ||
        admission?.enquiry?.service?.name ||
        'Home Care Service';

    const condition =
        (parsedMeta.patientHealthCondition as string) ||
        enquiryReqs.careRequirements ||
        'General care assistance';

    const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState('');
    const [staffRequired, setStaffRequired] = useState<number>(() => enquiryReqs.staffRequired || 1);
    const [shift, setShift] = useState(() => enquiryReqs.shift || '12 Hours Day');
    const [frequency, setFrequency] = useState(() => enquiryReqs.frequency || 'Daily');
    const [servicePrice, setServicePrice] = useState<number | ''>(() => (enquiry as { service?: { price?: number } })?.service?.price || admission?.enquiry?.service?.price || '');
    const [billingCycle, setBillingCycle] = useState('Monthly');
    const [specialInstructions, setSpecialInstructions] = useState(() => enquiryReqs.specialInstructions || (condition !== 'General care assistance' ? condition : ''));

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!startDate) {
            setError('Please select a contract start date.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                admissionId: admission?.id,
                enquiryId: enquiry?.id || admission?.enquiry?.id,
                startDate: new Date(startDate).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null,
                staffRequired: Number(staffRequired),
                shift,
                frequency,
                servicePrice: servicePrice !== '' ? Number(servicePrice) : null,
                billingCycle,
                specialInstructions: specialInstructions || undefined,
                unitId: activeUnitId
            });
            onClose();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to create contract.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--md" style={{ maxWidth: 580 }}>
                <div className="adm-modal-header">
                    <div className="adm-modal-title-group">
                        <FileSignature className="adm-modal-icon" />
                        <div>
                            <h3 className="adm-modal-title">Generate Service Contract</h3>
                            <p className="adm-modal-subtitle">
                                Create an agreed service contract with pricing, caregiver requirements, and schedule.
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="adm-modal-body">
                    {error && (
                        <div className="adm-alert adm-alert--error" style={{ marginBottom: 14 }}>
                            {error}
                        </div>
                    )}

                    {/* Patient Context Summary */}
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Client / Patient</span>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{patientName}</div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                    Contact: {clientName} · Service: {serviceName}
                                    {enquiry?.refNo ? ` · Ref: ${enquiry.refNo}` : admission ? ` · Admission ID: ${admission.id.slice(0, 8)}` : ''}
                                </div>
                            </div>
                            {condition && (
                                <span className="adm-badge adm-badge--primary" style={{ fontSize: 11 }}>
                                    {condition}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="adm-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Contract Start Date *</label>
                            <input
                                type="date"
                                className="adm-form-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Contract End Date (Optional)</label>
                            <input
                                type="date"
                                className="adm-form-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Caregivers Required</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                className="adm-form-input"
                                value={staffRequired}
                                onChange={(e) => setStaffRequired(Number(e.target.value))}
                            />
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Duty Shift</label>
                            <select
                                className="adm-form-input"
                                value={shift}
                                onChange={(e) => setShift(e.target.value)}
                            >
                                <option value="12 Hours Day">12 Hours Day</option>
                                <option value="12 Hours Night">12 Hours Night</option>
                                <option value="24 Hours Live-In">24 Hours Live-In</option>
                                <option value="8 Hours Day">8 Hours Day</option>
                                <option value="Part-Time Visit">Part-Time Visit</option>
                            </select>
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Frequency</label>
                            <select
                                className="adm-form-input"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                            >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Alternate Days">Alternate Days</option>
                                <option value="Weekdays Only">Weekdays Only</option>
                                <option value="Weekends Only">Weekends Only</option>
                            </select>
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Agreed Service Rate (₹)</label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                className="adm-form-input"
                                placeholder="e.g. 25000"
                                value={servicePrice}
                                onChange={(e) => setServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </div>

                        <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="adm-form-label">Billing Cycle</label>
                            <select
                                className="adm-form-input"
                                value={billingCycle}
                                onChange={(e) => setBillingCycle(e.target.value)}
                            >
                                <option value="Monthly">Monthly</option>
                                <option value="Bi-Weekly">Bi-Weekly</option>
                                <option value="Weekly">Weekly</option>
                                <option value="One-Time / Advance">One-Time / Advance</option>
                            </select>
                        </div>

                        <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="adm-form-label">Special Care Instructions</label>
                            <textarea
                                className="adm-form-input"
                                rows={3}
                                placeholder="Specify specific medical conditions, emergency contacts, diet preferences..."
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="adm-modal-footer" style={{ marginTop: 20 }}>
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
                        >
                            {isSubmitting ? 'Creating Draft Contract...' : 'Create Draft Contract'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
