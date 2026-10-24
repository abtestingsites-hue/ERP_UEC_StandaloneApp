import { useState } from 'react';
import {
    History,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    IndianRupee
} from 'lucide-react';
import { admissionsService } from '../admissions.service';
import type { ExistingPatientPayload } from '../admissions.types';

export function ExistingPatientTab() {
    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState<ExistingPatientPayload>({
        clientName: '',
        patientName: '',
        mobile: '',
        email: '',
        address: '',
        careType: 'CLINICAL',
        admissionDate: today,
        serviceName: '',
        serviceAmount: undefined,
        roomNo: '',
        healthCondition: '',
        currentMedicines: '',
        routineNotes: '',
        openingBalance: undefined
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdResult, setCreatedResult] = useState<Record<string, unknown> | null>(null);

    const updateField = (field: keyof ExistingPatientPayload, value: string | number | undefined) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.clientName.trim() || !form.patientName.trim()) {
            setError('Client and resident names are required.');
            return;
        }

        if (!form.mobile.trim() || form.mobile.trim().length < 10) {
            setError('A valid 10-digit mobile number is required.');
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await admissionsService.createExistingPatient(form);
            setCreatedResult(result);
        } catch (err: unknown) {
            console.error('Fast-track existing patient error:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to onboard existing resident';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalOpeningAmount = (Number(form.serviceAmount || 0) + Number(form.openingBalance || 0));

    if (createdResult) {
        return (
            <div className="adm-success-card">
                <div className="adm-success-icon-wrap">
                    <CheckCircle2 size={40} className="adm-text-success" />
                </div>
                <h2>Existing Resident Successfully Onboarded!</h2>
                <p>
                    Onboarded resident <strong>{form.patientName}</strong> has been integrated with the active ERP ledger, care timeline, and admission register.
                </p>
                <div className="adm-success-meta">
                    <div>
                        <span>Sponsor / Client</span>
                        <strong>{form.clientName}</strong>
                    </div>
                    <div>
                        <span>Care Domain</span>
                        <strong>{form.careType}</strong>
                    </div>
                    <div>
                        <span>Room Number</span>
                        <strong>{form.roomNo || 'Pending Room Allocation'}</strong>
                    </div>
                </div>
                <div className="adm-action-row" style={{ marginTop: 24, justifyContent: 'center' }}>
                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={() => {
                            setCreatedResult(null);
                            setForm({
                                clientName: '',
                                patientName: '',
                                mobile: '',
                                email: '',
                                address: '',
                                careType: 'CLINICAL',
                                admissionDate: today,
                                serviceName: '',
                                serviceAmount: undefined,
                                roomNo: '',
                                healthCondition: '',
                                currentMedicines: '',
                                routineNotes: '',
                                openingBalance: undefined
                            });
                        }}
                    >
                        <span>Onboard Another Resident</span>
                        <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="adm-form-layout">
            {error && (
                <div className="adm-alert adm-alert--error" style={{ marginBottom: 20 }}>
                    <AlertCircle size={16} />
                    <div>
                        <strong>Onboarding Failed</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="adm-form">
                {/* 1. Identification */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">01</div>
                        <div>
                            <h3>Client & Resident Identification</h3>
                            <p>Information for residents who were admitted prior to ERP deployment.</p>
                        </div>
                    </div>

                    <div className="adm-grid-2">
                        <label className="adm-field">
                            <span className="adm-field-label">Guardian / Client Name *</span>
                            <input
                                type="text"
                                className="adm-input"
                                placeholder="e.g. Ramesh Kumar (Guardian)"
                                value={form.clientName}
                                onChange={(e) => updateField('clientName', e.target.value)}
                                required
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Resident / Patient Name *</span>
                            <input
                                type="text"
                                className="adm-input"
                                placeholder="e.g. Meenakshi Ammal"
                                value={form.patientName}
                                onChange={(e) => updateField('patientName', e.target.value)}
                                required
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Primary Mobile Number *</span>
                            <input
                                type="tel"
                                className="adm-input"
                                placeholder="10-digit phone number"
                                value={form.mobile}
                                onChange={(e) => updateField('mobile', e.target.value)}
                                required
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Email Address</span>
                            <input
                                type="email"
                                className="adm-input"
                                placeholder="e.g. contact@example.com"
                                value={form.email || ''}
                                onChange={(e) => updateField('email', e.target.value)}
                            />
                        </label>
                    </div>
                </div>

                {/* 2. Care & Package */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">02</div>
                        <div>
                            <h3>Care Service & Historical Admission</h3>
                            <p>Specify care stream, original admission date, and agreed billing rate.</p>
                        </div>
                    </div>

                    <div className="adm-grid-2">
                        <label className="adm-field">
                            <span className="adm-field-label">Care Classification Stream</span>
                            <select
                                className="adm-select"
                                value={form.careType}
                                onChange={(e) => updateField('careType', e.target.value)}
                            >
                                <option value="CLINICAL">Clinical Care (Inpatient)</option>
                                <option value="IN_HOUSE">In-House Care Facility</option>
                                <option value="HOME_CARE">Home Care Assistance</option>
                                <option value="OTHERS">Other Care Protocol</option>
                            </select>
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Original Admission Date</span>
                            <input
                                type="date"
                                className="adm-input"
                                value={form.admissionDate}
                                onChange={(e) => updateField('admissionDate', e.target.value)}
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Agreed Service Package</span>
                            <input
                                type="text"
                                className="adm-input"
                                placeholder="e.g. Assisted Living Plan A"
                                value={form.serviceName || ''}
                                onChange={(e) => updateField('serviceName', e.target.value)}
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Allocated Room / Bed</span>
                            <input
                                type="text"
                                className="adm-input"
                                placeholder="e.g. Room 104"
                                value={form.roomNo || ''}
                                onChange={(e) => updateField('roomNo', e.target.value)}
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Agreed Service Rate (₹)</span>
                            <input
                                type="number"
                                className="adm-input"
                                placeholder="Monthly service fee"
                                value={form.serviceAmount !== undefined ? form.serviceAmount : ''}
                                onChange={(e) => updateField('serviceAmount', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Opening Balance / Dues (₹)</span>
                            <input
                                type="number"
                                className="adm-input"
                                placeholder="Unsettled pre-ERP dues"
                                value={form.openingBalance !== undefined ? form.openingBalance : ''}
                                onChange={(e) => updateField('openingBalance', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </label>
                    </div>

                    {totalOpeningAmount > 0 && (
                        <div className="adm-opening-amount-banner">
                            <IndianRupee size={16} />
                            <span>
                                Total Initial Ledger Commitment: <strong>₹{totalOpeningAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> (Package Rate + Opening Balance)
                            </span>
                        </div>
                    )}
                </div>

                {/* 3. Clinical & Medical Summary */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">03</div>
                        <div>
                            <h3>Clinical Notes & Routine</h3>
                            <p>Historical medical details for care staff.</p>
                        </div>
                    </div>

                    <div className="adm-grid-2">
                        <label className="adm-field" style={{ gridColumn: '1 / -1' }}>
                            <span className="adm-field-label">Known Health Conditions & Diagnoses</span>
                            <textarea
                                className="adm-textarea"
                                rows={2}
                                placeholder="e.g. Hypertension, Type 2 Diabetes, Mild dementia"
                                value={form.healthCondition || ''}
                                onChange={(e) => updateField('healthCondition', e.target.value)}
                            />
                        </label>

                        <label className="adm-field" style={{ gridColumn: '1 / -1' }}>
                            <span className="adm-field-label">Ongoing Routine & Medication Regimen</span>
                            <textarea
                                className="adm-textarea"
                                rows={2}
                                placeholder="e.g. Morning insulin 10 units, physio assistance daily at 10 AM"
                                value={form.currentMedicines || ''}
                                onChange={(e) => updateField('currentMedicines', e.target.value)}
                            />
                        </label>
                    </div>
                </div>

                {/* Submit Row */}
                <div className="adm-form-submit-row">
                    <button
                        type="submit"
                        className="adm-btn adm-btn--primary"
                        disabled={isSubmitting}
                    >
                        <History size={16} />
                        <span>{isSubmitting ? 'Onboarding Resident...' : 'Onboard Existing Resident'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
