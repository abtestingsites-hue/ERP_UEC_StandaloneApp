import { useState } from 'react';
import { X, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { GateEntry } from '../visitorSecurity.types';

interface GateCheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: GateEntry | null;
    onConfirm: (id: string, remarks?: string) => Promise<void>;
}

export function GateCheckOutModal(props: GateCheckOutModalProps) {
    if (!props.isOpen || !props.entry) return null;
    return <GateCheckOutModalContent key={props.entry.id} {...props} />;
}

function GateCheckOutModalContent({
    onClose,
    entry,
    onConfirm
}: GateCheckOutModalProps) {
    const [remarks, setRemarks] = useState('');
    const [badgeCollected, setBadgeCollected] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!entry) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const finalRemarks = [
                badgeCollected ? 'Badge Returned' : 'Badge Pending',
                remarks
            ].filter(Boolean).join(' | ');
            await onConfirm(entry.id, finalRemarks);
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to record checkout';
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
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <LogOut size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                Record Gate Exit & Check-Out
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
                                Host / Visited: <strong>{entry.visitingPerson || 'Front Desk'}</strong>
                            </div>
                            {entry.checkInAt && (
                                <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.25rem' }}>
                                    Checked In: <strong>{new Date(entry.checkInAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</strong>
                                </div>
                            )}
                            {entry.vehicleNo && (
                                <div style={{ fontSize: '0.85rem', color: '#d97706', marginTop: '0.25rem' }}>
                                    Vehicle: <strong>{entry.vehicleNo}</strong>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={badgeCollected}
                                    onChange={(e) => setBadgeCollected(e.target.checked)}
                                    style={{ width: 16, height: 16 }}
                                />
                                <span>Physical Visitor Badge collected back at Gate</span>
                            </label>
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
                            <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                Departure Remarks
                            </label>
                            <textarea
                                className="erp-input"
                                rows={2}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Material inspected, normal exit recorded..."
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
                            className="erp-button erp-button-danger"
                            disabled={isSubmitting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: '#dc2626',
                                borderColor: '#dc2626',
                                color: '#ffffff'
                            }}
                        >
                            <CheckCircle2 size={16} />
                            {isSubmitting ? 'Recording...' : 'Confirm Check-Out'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
