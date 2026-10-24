import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, AlertCircle, Briefcase, Clock, Package, Navigation } from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';
import type { StaffDailyMovement } from '../visitorSecurity.types';

interface RecordStaffDutyTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    movement: StaffDailyMovement | null;
    unitId?: string | null;
}

export function RecordStaffDutyTripModal({
    isOpen,
    onClose,
    onSuccess,
    movement,
    unitId
}: RecordStaffDutyTripModalProps) {
    const [tripCategory, setTripCategory] = useState('Home Care Duty Visit');
    const [clientDestination, setClientDestination] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [expectedReturnAt, setExpectedReturnAt] = useState('');
    const [materials, setMaterials] = useState('');
    const [companionName, setCompanionName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize default return time to +2.5 hours from current time
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setTripCategory('Home Care Duty Visit');
            setClientDestination('');
            setCustomReason('');
            setMaterials('Homecare nursing bag & BP apparatus');
            setCompanionName('');

            const returnTime = new Date(Date.now() + 2.5 * 3600000);
            const tzOffset = returnTime.getTimezoneOffset() * 60000;
            const localISOTime = new Date(returnTime.getTime() - tzOffset).toISOString().slice(0, 16);
            setExpectedReturnAt(localISOTime);
        }
    }, [isOpen]);

    if (!isOpen || !movement) return null;

    const staffFullName = movement.staff
        ? `${movement.staff.firstName || ''} ${movement.staff.lastName || ''}`.trim()
        : 'Staff Member';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalReason = tripCategory;
        if (tripCategory === 'Other' && customReason.trim()) {
            finalReason = customReason.trim();
        } else if (customReason.trim()) {
            finalReason = `${tripCategory} (${customReason.trim()})`;
        }

        if (clientDestination.trim()) {
            finalReason += ` — Destination: ${clientDestination.trim()}`;
        }

        if (!finalReason.trim()) {
            setError('Please provide a reason or purpose for the duty trip.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await visitorSecurityService.recordStaffTempExit(
                movement.id,
                {
                    reason: finalReason,
                    expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt).toISOString() : null,
                    materials: materials.trim() ? { notes: materials.trim() } : null,
                    companionType: companionName.trim() ? 'STAFF' : null,
                    companionName: companionName.trim() || null
                },
                unitId
            );
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to record staff duty trip');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1050,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(3px)',
                padding: '1rem'
            }}
        >
            <div
                style={{
                    backgroundColor: 'var(--surface-color, #ffffff)',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '560px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    overflow: 'hidden',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border-color, #e2e8f0)',
                        backgroundColor: 'var(--header-bg, #f8fafc)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#d97706'
                            }}
                        >
                            <ArrowUpRight size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                                Log Staff Duty Trip / Home Care Exit
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                                Record interim gate exit for off-campus duty assignment
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary, #64748b)',
                            padding: '4px',
                            display: 'flex'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.1rem',
                        overflowY: 'auto'
                    }}
                >
                    {error && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#ef4444',
                                fontSize: '0.85rem'
                            }}
                        >
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Staff banner */}
                    <div
                        style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                {staffFullName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                ID: {movement.staff?.empId || '—'} • {movement.staff?.designation || 'Staff'} ({movement.staff?.department || 'Operations'})
                            </div>
                        </div>
                        <span
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 999,
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981'
                            }}
                        >
                            CURRENTLY INSIDE
                        </span>
                    </div>

                    {/* Purpose / Category */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Briefcase size={14} color="#d97706" /> Duty Type / Purpose <span style={{ color: '#ef4444' }}>*</span>
                            </span>
                        </label>
                        <select
                            className="erp-input"
                            value={tripCategory}
                            onChange={(e) => setTripCategory(e.target.value)}
                            style={{ width: '100%', fontSize: '0.875rem' }}
                            required
                        >
                            <option value="Home Care Duty Visit">Home Care Duty Visit (Patient Residence)</option>
                            <option value="Patient Transit / Hospital Escort">Patient Transit / Hospital Escort</option>
                            <option value="Medical Pharmacy / Lab Delivery">Medical Pharmacy / Lab Delivery</option>
                            <option value="Administrative / Official Errand">Administrative / Official Errand</option>
                            <option value="Emergency Care Call">Emergency Care Call</option>
                            <option value="Other">Other Duty Assignment</option>
                        </select>
                    </div>

                    {/* Destination / Patient Details */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Navigation size={14} color="#2563eb" /> Destination / Patient Details
                            </span>
                        </label>
                        <input
                            type="text"
                            className="erp-input"
                            placeholder="e.g. Patient: John Doe (Apt 4B, Greenwood Park)"
                            value={clientDestination}
                            onChange={(e) => setClientDestination(e.target.value)}
                            style={{ width: '100%', fontSize: '0.85rem' }}
                        />
                    </div>

                    {/* Additional Notes / Reason if needed */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                            Specific Task / Notes
                        </label>
                        <input
                            type="text"
                            className="erp-input"
                            placeholder="e.g. Wound dressing change & evening vitals inspection"
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            style={{ width: '100%', fontSize: '0.85rem' }}
                        />
                    </div>

                    {/* Expected Return & Materials grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Clock size={14} color="#10b981" /> Expected Return Time <span style={{ color: '#ef4444' }}>*</span>
                                </span>
                            </label>
                            <input
                                type="datetime-local"
                                className="erp-input"
                                value={expectedReturnAt}
                                onChange={(e) => setExpectedReturnAt(e.target.value)}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Package size={14} color="#6366f1" /> Equipment / Kits Carried
                                </span>
                            </label>
                            <input
                                type="text"
                                className="erp-input"
                                placeholder="e.g. Homecare Kit #3, Glucometer"
                                value={materials}
                                onChange={(e) => setMaterials(e.target.value)}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>

                    {/* Accompanying Colleague */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                            Accompanying Staff / Driver (Optional)
                        </label>
                        <input
                            type="text"
                            className="erp-input"
                            placeholder="e.g. Driver Ramesh / Nurse Priya"
                            value={companionName}
                            onChange={(e) => setCompanionName(e.target.value)}
                            style={{ width: '100%', fontSize: '0.85rem' }}
                        />
                    </div>

                    {/* Footer / Actions */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            marginTop: '0.5rem',
                            borderTop: '1px solid var(--border-color, #e2e8f0)',
                            paddingTop: '1rem'
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="erp-button erp-button-secondary"
                            disabled={isSubmitting}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="erp-button erp-button-primary"
                            disabled={isSubmitting}
                            style={{
                                padding: '0.5rem 1.25rem',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                backgroundColor: '#d97706',
                                borderColor: '#d97706',
                                color: '#ffffff'
                            }}
                        >
                            <ArrowUpRight size={15} />
                            {isSubmitting ? 'Logging Exit...' : 'Log Duty Exit (Record Departure)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
