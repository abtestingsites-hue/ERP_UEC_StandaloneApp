import { useState } from 'react';
import {
    UserPlus,
    CheckCircle2,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { admissionsService } from '../admissions.service';
import type { CreatePatientPayload, Patient } from '../admissions.types';
import type { UnitInfo } from '../../inventory/inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';

interface PatientRegistrationTabProps {
    onPatientRegistered: (newPatient: Patient) => void;
    onProceedToAdmission?: (patient: Patient) => void;
}

export function PatientRegistrationTab({ onPatientRegistered, onProceedToAdmission }: PatientRegistrationTabProps) {
    const { activeUnitId, units } = useActiveUnit();

    const [unitId, setUnitId] = useState<string>(activeUnitId || units[0]?.id || '');
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [gender, setGender] = useState('Male');
    const [bloodGroup, setBloodGroup] = useState('O+');

    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [primaryContact, setPrimaryContact] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [address, setAddress] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Patient full name is required.');
            return;
        }

        if (!unitId) {
            setError('Please select an operating care unit.');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload: CreatePatientPayload = {
                name: name.trim(),
                unitId,
                dob: dob || undefined,
                age: age !== '' ? Number(age) : undefined,
                gender,
                bloodGroup,
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                primaryContact: primaryContact.trim() || undefined,
                emergencyContact: emergencyContact.trim() || undefined,
                address: address.trim() || undefined
            };

            const created = await admissionsService.createPatient(payload);
            setRegisteredPatient(created);
            onPatientRegistered(created);
        } catch (err: unknown) {
            console.error('Patient registration error:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to register patient';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (registeredPatient) {
        return (
            <div className="adm-success-card">
                <div className="adm-success-icon-wrap">
                    <CheckCircle2 size={40} className="adm-text-success" />
                </div>
                <h2>Patient Registered Successfully!</h2>
                <p>
                    Master patient record for <strong>{registeredPatient.name}</strong> is created in the facility directory.
                </p>
                <div className="adm-success-meta">
                    <div>
                        <span>Patient ID</span>
                        <code>{registeredPatient.id}</code>
                    </div>
                    <div>
                        <span>Phone</span>
                        <strong>{registeredPatient.phone || '-'}</strong>
                    </div>
                    <div>
                        <span>Facility</span>
                        <strong>{units.find((u: UnitInfo) => u.id === registeredPatient.unitId)?.name || 'Authorized Unit'}</strong>
                    </div>
                </div>
                <div className="adm-action-row" style={{ marginTop: 24, justifyContent: 'center', gap: 12 }}>
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={() => {
                            setRegisteredPatient(null);
                            setName('');
                            setPhone('');
                            setEmail('');
                            setPrimaryContact('');
                            setEmergencyContact('');
                            setAddress('');
                            setAge('');
                            setDob('');
                        }}
                    >
                        <span>Register Another Patient</span>
                    </button>

                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={() => {
                            if (onProceedToAdmission && registeredPatient) {
                                onProceedToAdmission(registeredPatient);
                            }
                        }}
                        style={{ background: '#028001' }}
                    >
                        <span>Admit This Patient Now</span>
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
                        <strong>Registration Failed</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="adm-form">
                {/* Demographics */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">01</div>
                        <div>
                            <h3>Resident Demographics</h3>
                            <p>Enter primary identification details of the resident.</p>
                        </div>
                    </div>

                    <div className="adm-grid-2">
                        <label className="adm-field">
                            <span className="adm-field-label">Full Name *</span>
                            <input
                                type="text"
                                className="adm-input"
                                placeholder="e.g. Jane Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Care Facility / Unit *</span>
                            <select
                                className="adm-select"
                                value={unitId}
                                onChange={(e) => setUnitId(e.target.value)}
                                required
                            >
                                {units.map((u: UnitInfo) => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                ))}
                            </select>
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Date of Birth</span>
                            <input
                                type="date"
                                className="adm-input"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                            />
                        </label>

                        <div className="adm-grid-2" style={{ gap: 12 }}>
                            <label className="adm-field">
                                <span className="adm-field-label">Age</span>
                                <input
                                    type="number"
                                    className="adm-input"
                                    placeholder="e.g. 72"
                                    min={0}
                                    max={120}
                                    value={age}
                                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                                />
                            </label>

                            <label className="adm-field">
                                <span className="adm-field-label">Gender</span>
                                <select
                                    className="adm-select"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </label>
                        </div>

                        <label className="adm-field">
                            <span className="adm-field-label">Blood Group</span>
                            <select
                                className="adm-select"
                                value={bloodGroup}
                                onChange={(e) => setBloodGroup(e.target.value)}
                            >
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </label>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">02</div>
                        <div>
                            <h3>Contact & Family Details</h3>
                            <p>Information for notification and emergency medical reach.</p>
                        </div>
                    </div>

                    <div className="adm-grid-2">
                        <label className="adm-field">
                            <span className="adm-field-label">Primary Phone</span>
                            <input
                                type="tel"
                                className="adm-input"
                                placeholder="e.g. +91 98765 43210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Email Address</span>
                            <input
                                type="email"
                                className="adm-input"
                                placeholder="e.g. resident@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Primary Contact / Guardian (Name & Relation)</span>
                            <input
                                type="text"
                                className="adm-input"
                                placeholder="e.g. Rajesh Doe (Son)"
                                value={primaryContact}
                                onChange={(e) => setPrimaryContact(e.target.value)}
                            />
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Emergency Contact Number</span>
                            <input
                                type="tel"
                                className="adm-input"
                                placeholder="e.g. +91 99887 76655"
                                value={emergencyContact}
                                onChange={(e) => setEmergencyContact(e.target.value)}
                            />
                        </label>

                        <label className="adm-field" style={{ gridColumn: '1 / -1' }}>
                            <span className="adm-field-label">Permanent Residential Address</span>
                            <textarea
                                className="adm-textarea"
                                rows={2}
                                placeholder="Complete residential address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
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
                        <UserPlus size={16} />
                        <span>{isSubmitting ? 'Registering Patient...' : 'Register Master Patient Record'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
