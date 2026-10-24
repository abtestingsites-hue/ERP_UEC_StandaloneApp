import { useState } from 'react';
import { X, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import type { GateEntry } from '../visitorSecurity.types';

interface GateCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: GateEntry | null;
    onConfirm: (id: string, remarks?: string) => Promise<void>;
}

export function GateCheckInModal(props: GateCheckInModalProps) {
    if (!props.isOpen || !props.entry) return null;
    return <GateCheckInModalContent key={props.entry.id} {...props} />;
}

function GateCheckInModalContent({
    onClose,
    entry,
    onConfirm
}: GateCheckInModalProps) {
    const [remarks, setRemarks] = useState('');
    const [badgeNo, setBadgeNo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!entry) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const combinedRemarks = [badgeNo ? `Badge: ${badgeNo}` : '', remarks].filter(Boolean).join(' | ');
            await onConfirm(entry.id, combinedRemarks);
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to record gate check-in';
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
                    maxWidth: 480,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <UserCheck size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                Gate Check-In Verification
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Security Gate Booth
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '4px'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        {error && (
                            <div
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    marginBottom: '1rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
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

                        <div
                            style={{
                                background: 'rgba(30, 41, 59, 0.03)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1.25rem'
                            }}
                        >
                            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                                {entry.visitorName}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Mobile: <strong>{entry.mobile}</strong>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Host: <strong>{entry.visitingPerson || 'Front Desk'}</strong>
                                {entry.department ? ` (${entry.department})` : ''}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Purpose: <strong>{entry.purpose}</strong>
                            </div>
                            {entry.vehicleNo && (
                                <div style={{ fontSize: '0.85rem', color: '#d97706', marginTop: '0.25rem' }}>
                                    Vehicle: <strong>{entry.vehicleNo}</strong>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                Physical Security Badge / Token ID
                            </label>
                            <input
                                type="text"
                                className="erp-input"
                                value={badgeNo}
                                onChange={(e) => setBadgeNo(e.target.value)}
                                placeholder="e.g. VIS-B-104"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
                            <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                Security Check Remarks
                            </label>
                            <textarea
                                className="erp-input"
                                rows={2}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="ID verified, thermal screen clear, baggage checked..."
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            backgroundColor: 'var(--surface-color)'
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="erp-button erp-button-secondary"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="erp-button erp-button-primary"
                            disabled={isSubmitting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: '#10b981',
                                borderColor: '#10b981',
                                color: '#ffffff'
                            }}
                        >
                            <CheckCircle2 size={16} />
                            {isSubmitting ? 'Recording...' : 'Confirm Gate Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
