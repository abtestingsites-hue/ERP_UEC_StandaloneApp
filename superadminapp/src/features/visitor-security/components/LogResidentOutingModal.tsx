import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, AlertCircle } from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';

interface LogResidentOutingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    unitId?: string | null;
}

export function LogResidentOutingModal({
    isOpen,
    onClose,
    onSuccess,
    unitId
}: LogResidentOutingModalProps) {
    const [residents, setResidents] = useState<Array<{ id: string; name: string; elderId?: string }>>([]);
    const [loadingResidents, setLoadingResidents] = useState(true);

    const [patientId, setPatientId] = useState('');
    const [destination, setDestination] = useState('');
    const [reason, setReason] = useState('Medical Consultation');
    const [expectedReturnAt, setExpectedReturnAt] = useState('');
    const [companionType, setCompanionType] = useState('STAFF');
    const [companionName, setCompanionName] = useState('');
    const [companionPhone, setCompanionPhone] = useState('');
    const [materials, setMaterials] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Set default expected return time to +3 hours from now
    useEffect(() => {
        if (isOpen) {
            const returnTime = new Date(Date.now() + 3 * 3600000);
            const tzOffset = returnTime.getTimezoneOffset() * 60000;
            const localISOTime = new Date(returnTime.getTime() - tzOffset).toISOString().slice(0, 16);
            setExpectedReturnAt(localISOTime);

            visitorSecurityService.getResidents(unitId).then((res) => {
                setResidents(res);
                if (res.length > 0) {
                    setPatientId(res[0].id);
                }
                setLoadingResidents(false);
            }).catch(() => {
                setLoadingResidents(false);
            });
        }
    }, [isOpen, unitId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) {
            setError('Please select a resident.');
            return;
        }
        if (!destination.trim()) {
            setError('Please specify destination.');
            return;
        }
        if (!expectedReturnAt) {
            setError('Please enter expected return date & time.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await visitorSecurityService.createResidentOuting({
                patientId,
                destination: destination.trim(),
                reason: reason.trim(),
                expectedReturnAt: new Date(expectedReturnAt).toISOString(),
                companionType,
                companionName: companionName.trim() || undefined,
                companionPhone: companionPhone.trim() || undefined,
                materials: materials.trim() || undefined
            }, unitId);
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err as Error)?.message || 'Failed to record resident outing.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="erp-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div
                className="erp-modal"
                style={{
                    maxWidth: 540,
                    width: '90vw',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowUpRight size={18} color="#d97706" />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                Record Resident Outing Leave
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Log resident physical exit with companion & safety telemetry
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && (
                        <div
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444',
                                borderRadius: '8px',
                                color: '#ef4444',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Resident Selection */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                            Resident / Patient *
                        </label>
                        {loadingResidents ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading residents...</div>
                        ) : (
                            <select
                                className="erp-input"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                required
                                style={{ width: '100%', fontSize: '0.85rem' }}
                            >
                                <option value="">Select Resident</option>
                                {residents.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} {r.elderId ? `(${r.elderId})` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Destination & Reason */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Destination *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="erp-input"
                                    placeholder="e.g. GKNM Hospital, Home"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    required
                                    style={{ width: '100%', fontSize: '0.85rem' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Outing Purpose *
                            </label>
                            <select
                                className="erp-input"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                            >
                                <option value="Medical Consultation">Medical Consultation / Doctor</option>
                                <option value="Hospital Treatment">Hospital Treatment / Therapy</option>
                                <option value="Family Outing">Family Outing / Relative Visit</option>
                                <option value="Temple / Religious Visit">Temple / Religious Visit</option>
                                <option value="Personal Errand">Personal Errand / Shopping</option>
                                <option value="Other Outing">Other Purpose</option>
                            </select>
                        </div>
                    </div>

                    {/* Expected Return Date & Time */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                            Expected Return Date & Time *
                        </label>
                        <input
                            type="datetime-local"
                            className="erp-input"
                            value={expectedReturnAt}
                            onChange={(e) => setExpectedReturnAt(e.target.value)}
                            required
                            style={{ width: '100%', fontSize: '0.85rem' }}
                        />
                    </div>

                    {/* Companion Type & Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Companion Type
                            </label>
                            <select
                                className="erp-input"
                                value={companionType}
                                onChange={(e) => setCompanionType(e.target.value)}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                            >
                                <option value="STAFF">Caregiver / Staff Accompanied</option>
                                <option value="VISITOR">Family Member / Relative / Visitor</option>
                                <option value="EXTERNAL">External Escort / Driver / Other</option>
                                <option value="">Unaccompanied (Independent)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Companion Name / Staff Name
                            </label>
                            <input
                                type="text"
                                className="erp-input"
                                placeholder="Caregiver / Companion Name"
                                value={companionName}
                                onChange={(e) => setCompanionName(e.target.value)}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Companion Contact Phone
                            </label>
                            <input
                                type="tel"
                                className="erp-input"
                                placeholder="Mobile number"
                                value={companionPhone}
                                onChange={(e) => setCompanionPhone(e.target.value)}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Equipment / Belongings Carried
                            </label>
                            <input
                                type="text"
                                className="erp-input"
                                placeholder="e.g. Wheelchair, Oxygen, Bag"
                                value={materials}
                                onChange={(e) => setMaterials(e.target.value)}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div
                        style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem'
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="erp-button erp-button-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="erp-button erp-button-primary"
                            style={{
                                padding: '0.5rem 1.25rem',
                                fontSize: '0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                background: '#d97706',
                                borderColor: '#d97706',
                                color: '#ffffff'
                            }}
                        >
                            <ArrowUpRight size={14} />
                            {isSubmitting ? 'Logging Exit...' : 'Log Physical Exit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default LogResidentOutingModal;
