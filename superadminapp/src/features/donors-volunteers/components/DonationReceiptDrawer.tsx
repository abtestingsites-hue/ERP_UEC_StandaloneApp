import { useState } from 'react';
import { X, Printer, Send, CheckCircle2, Award } from 'lucide-react';
import type { Donation } from '../donorsVolunteers.types';

interface DonationReceiptDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    donation: Donation | null;
    onMarkSent?: (donationId: string) => Promise<void>;
}

export function DonationReceiptDrawer(props: DonationReceiptDrawerProps) {
    if (!props.isOpen || !props.donation) return null;
    return <DonationReceiptDrawerContent key={props.donation.id} {...props} />;
}

function DonationReceiptDrawerContent({
    onClose,
    donation,
    onMarkSent
}: DonationReceiptDrawerProps) {
    const [isMarking, setIsMarking] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(Boolean(donation?.isReceiptSent));

    if (!donation) return null;

    const donor = donation.donor;

    const handlePrint = () => {
        window.print();
    };

    const handleMarkSent = async () => {
        if (!onMarkSent) return;
        setIsMarking(true);
        try {
            await onMarkSent(donation.id);
            setSentSuccess(true);
        } finally {
            setIsMarking(false);
        }
    };

    const formattedDate = donation.date
        ? new Date(donation.date).toLocaleDateString('en-IN', { dateStyle: 'long' })
        : new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

    return (
        <div className="erp-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div
                className="erp-modal"
                style={{
                    maxWidth: 680,
                    width: '95vw',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--surface-color)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Award size={20} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                                    Receipt #{donation.receiptNo}
                                </h3>
                                {donation.taxDeduction && (
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            color: '#10b981'
                                        }}
                                    >
                                        80G TAX EXEMPT
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                UNCF Foundation Charitable Contribution
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="erp-button erp-button-secondary"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                            <Printer size={14} /> Print
                        </button>
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
                </div>

                {/* Printable Receipt Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    <div
                        style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            backgroundColor: 'var(--surface-color)'
                        }}
                    >
                        {/* Foundation Header */}
                        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', color: '#10b981', fontWeight: 700 }}>
                                UNIVERSAL NATURE CARE AND CURE FOUNDATION
                            </h2>
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Public Charitable Trust & Community Healthcare Services
                            </p>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                All donations are eligible for tax deduction under Section 80G of the Income Tax Act
                            </span>
                        </div>

                        {/* Receipt Meta */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            <div>
                                <span style={{ color: 'var(--text-secondary)' }}>Receipt No: </span>
                                <strong style={{ fontFamily: 'monospace', color: '#10b981' }}>{donation.receiptNo}</strong>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-secondary)' }}>Date: </span>
                                <strong>{formattedDate}</strong>
                            </div>
                        </div>

                        {/* Donor Details Box */}
                        <div
                            style={{
                                background: 'rgba(0, 0, 0, 0.02)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '1.25rem',
                                marginBottom: '1.25rem',
                                fontSize: '0.9rem'
                            }}
                        >
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                                Received With Thanks From
                            </div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                                {donor?.name || 'Anonymous Donor'}
                            </div>
                            {donor?.fatherOrHusbandName && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                                    Relation / Care Of: <strong>{donor.fatherOrHusbandName}</strong>
                                </div>
                            )}
                            {donor?.residentialAddress && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                                    Address: {donor.residentialAddress}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.6rem', fontSize: '0.85rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.5rem' }}>
                                {donor?.panNumber && <span>PAN: <strong style={{ fontFamily: 'monospace', color: '#0f766e' }}>{donor.panNumber}</strong></span>}
                                {donor?.mobile && <span>Mobile: <strong>{donor.mobile}</strong></span>}
                                {donor?.isCorporate && <span style={{ color: '#0284c7', fontWeight: 700, background: 'rgba(2,132,199,0.1)', padding: '2px 8px', borderRadius: 4 }}>Corporate / CSR Contribution</span>}
                            </div>
                        </div>

                        {/* Amount & Purpose */}
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem', flexWrap: 'wrap', gap: 8 }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Amount Received:</span>
                                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                                    ₹{donation.amount.toLocaleString('en-IN')}
                                </span>
                            </div>
                            {donation.amountInWords && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.6rem' }}>
                                    In Words: <strong>{donation.amountInWords}</strong>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', background: '#f8fafc', padding: '10px 12px', borderRadius: 6 }}>
                                <div>Payment Mode: <strong style={{ color: '#0f172a' }}>{donation.paymentMode}</strong></div>
                                <div>Purpose: <strong style={{ color: '#0f172a' }}>{donation.purpose || 'General Charity'}</strong></div>
                            </div>
                            {donation.materialDetails && (
                                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Material Item / Description: <strong>{donation.materialDetails}</strong>
                                </div>
                            )}
                        </div>

                        {/* Occasion & Remarks */}
                        {donation.occasionName && (
                            <div style={{ marginBottom: '1rem', fontSize: '0.85rem', background: '#fffbeb', padding: '8px 12px', borderRadius: 6, border: '1px solid #fde68a' }}>
                                <span style={{ color: '#92400e' }}>Occasion / Memorial Dedication: </span>
                                <strong style={{ color: '#78350f' }}>{donation.occasionName}</strong>
                            </div>
                        )}

                        {/* Signature / Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', paddingTop: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <div>System Generated Electronic Receipt</div>
                                <div>Recorded by: {donation.receivedBy || 'UNCF Desk'}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: 140, borderBottom: '1px solid var(--text-secondary)', marginBottom: '0.25rem' }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Authorized Signatory</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div
                    style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--surface-color)'
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="erp-button erp-button-secondary"
                    >
                        Close
                    </button>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {sentSuccess ? (
                            <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                                <CheckCircle2 size={16} /> Receipt Dispatched
                            </span>
                        ) : onMarkSent && (
                            <button
                                type="button"
                                onClick={handleMarkSent}
                                disabled={isMarking}
                                className="erp-button erp-button-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    background: '#10b981',
                                    borderColor: '#10b981',
                                    color: '#ffffff'
                                }}
                            >
                                <Send size={15} />
                                {isMarking ? 'Marking...' : 'Mark Receipt Dispatched'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
