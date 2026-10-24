import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

interface EnquiryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: Record<string, unknown>) => Promise<void>;
    activeUnitId?: string | null;
}

export function EnquiryFormModal({
    isOpen,
    onClose,
    onSubmit,
    activeUnitId
}: EnquiryFormModalProps) {
    const [clientName, setClientName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [mode, setMode] = useState('Call');
    const [comments, setComments] = useState('');

    // Patient & Requirements
    const [patientName, setPatientName] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [patientGender, setPatientGender] = useState('Male');
    const [patientHealthCondition, setPatientHealthCondition] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [staffRequired, setStaffRequired] = useState(1);
    const [shift, setShift] = useState('12 Hours Day');
    const [frequency, setFrequency] = useState('Daily');
    const [specialInstructions, setSpecialInstructions] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!clientName.trim() || !mobile.trim()) {
            setError('Client name and mobile number are required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const careRequirementsList = patientHealthCondition.trim()
                ? patientHealthCondition.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

            await onSubmit({
                clientName: clientName.trim(),
                mobile: mobile.trim(),
                email: email.trim() || undefined,
                mode,
                status: 'Open',
                comments: comments || undefined,
                patientName: patientName.trim() || clientName.trim(),
                patientAge: patientAge.trim() || undefined,
                patientGender: patientGender || 'Male',
                patientHealthCondition: patientHealthCondition.trim() || undefined,
                clientAddress: clientAddress.trim() || undefined,
                rawMessage: JSON.stringify({
                    patientName: patientName || clientName,
                    patientAge,
                    patientGender,
                    patientHealthCondition,
                    clientAddress,
                    staffRequired,
                    shift,
                    frequency,
                    specialInstructions
                }),
                serviceRequirements: {
                    staffRequired: Number(staffRequired) || 1,
                    shift,
                    frequency,
                    specialInstructions: specialInstructions.trim() || undefined,
                    careRequirements: careRequirementsList
                },
                unitId: activeUnitId || undefined
            });
            onClose();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to record enquiry.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--md" style={{ maxWidth: 600 }}>
                <div className="adm-modal-header">
                    <div className="adm-modal-title-group">
                        <UserPlus className="adm-modal-icon" />
                        <div>
                            <h3 className="adm-modal-title">New Home Care Client Intake</h3>
                            <p className="adm-modal-subtitle">
                                Record client enquiry, patient care requirements, and home visit logistics.
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

                    <div className="adm-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {/* Client Info */}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Client Name *</label>
                            <input
                                type="text"
                                className="adm-form-input"
                                placeholder="Primary Contact / Guardian"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Mobile Number *</label>
                            <input
                                type="tel"
                                className="adm-form-input"
                                placeholder="e.g. 9876543210"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                required
                            />
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Email Address</label>
                            <input
                                type="email"
                                className="adm-form-input"
                                placeholder="client@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Intake Channel</label>
                            <select
                                className="adm-form-input"
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                            >
                                <option value="Call">Phone Call</option>
                                <option value="Walk-in">Walk-in</option>
                                <option value="Website">Website / Portal</option>
                                <option value="Reference">Doctor / Hospital Referral</option>
                            </select>
                        </div>

                        {/* Patient Info */}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Patient Name</label>
                            <input
                                type="text"
                                className="adm-form-input"
                                placeholder="Leave blank if same as client"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Age</label>
                                <input
                                    type="number"
                                    className="adm-form-input"
                                    placeholder="e.g. 74"
                                    value={patientAge}
                                    onChange={(e) => setPatientAge(e.target.value)}
                                />
                            </div>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Gender</label>
                                <select
                                    className="adm-form-input"
                                    value={patientGender}
                                    onChange={(e) => setPatientGender(e.target.value)}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="adm-form-label">Home Address / Location</label>
                            <input
                                type="text"
                                className="adm-form-input"
                                placeholder="Full residential address for caregiver visits"
                                value={clientAddress}
                                onChange={(e) => setClientAddress(e.target.value)}
                            />
                        </div>

                        <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="adm-form-label">Health Condition / Medical Needs</label>
                            <input
                                type="text"
                                className="adm-form-input"
                                placeholder="e.g. Post-stroke rehabilitation, diabetic monitoring, bedridden care"
                                value={patientHealthCondition}
                                onChange={(e) => setPatientHealthCondition(e.target.value)}
                            />
                        </div>

                        {/* Requirements */}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Shift Requirement</label>
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
                                <option value="Alternate Days">Alternate Days</option>
                                <option value="Weekly">Weekly</option>
                                <option value="One-Time">One-Time</option>
                            </select>
                        </div>

                        <div className="adm-form-group">
                            <label className="adm-form-label">Caregivers Needed</label>
                            <input
                                type="number"
                                min={1}
                                className="adm-form-input"
                                value={staffRequired}
                                onChange={(e) => setStaffRequired(Number(e.target.value))}
                            />
                        </div>

                        <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="adm-form-label">Special Instructions & Comments</label>
                            <textarea
                                className="adm-form-input"
                                rows={2}
                                placeholder="Additional requirements or client requests..."
                                value={specialInstructions || comments}
                                onChange={(e) => {
                                    setSpecialInstructions(e.target.value);
                                    setComments(e.target.value);
                                }}
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
                            {isSubmitting ? 'Recording Enquiry...' : 'Record Intake Enquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
