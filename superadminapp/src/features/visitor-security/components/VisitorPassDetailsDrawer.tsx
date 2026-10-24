import { useState } from 'react';
import {
    X,
    Clock,
    Phone,
    Building2,
    Car,
    Package,
    Shield,
    LogOut,
    CheckCircle2,
    Calendar,
    Printer
} from 'lucide-react';
import type { VisitorPass } from '../visitorSecurity.types';
import { formatVisitorPassNumber } from '../../../utils/idFormatters';

interface VisitorPassDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    pass: VisitorPass | null;
    onCheckout?: (passId: string) => Promise<void>;
}

export function VisitorPassDetailsDrawer(props: VisitorPassDetailsDrawerProps) {
    if (!props.isOpen || !props.pass) return null;
    return <VisitorPassDetailsDrawerContent key={props.pass.id} {...props} />;
}

function VisitorPassDetailsDrawerContent({
    onClose,
    pass,
    onCheckout
}: VisitorPassDetailsDrawerProps) {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    if (!pass) return null;

    const visitor = pass.visitor;
    const isInside = pass.status === 'ACTIVE' || pass.status === 'APPROVED' || pass.status === 'CHECKED_IN';
    const isCompleted = pass.status === 'COMPLETED' || pass.status === 'CHECKED_OUT';

    const handleCheckout = async () => {
        if (!onCheckout) return;
        setIsCheckingOut(true);
        setActionFeedback(null);
        try {
            await onCheckout(pass.id);
            setActionFeedback({ type: 'success', message: 'Visitor successfully checked out!' });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to check out visitor';
            setActionFeedback({ type: 'error', message: msg });
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDateTime = (dt?: string | null) => {
        if (!dt) return '—';
        try {
            return new Date(dt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        } catch {
            return dt;
        }
    };

    return (
        <div className="erp-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div
                className="erp-modal"
                style={{
                    maxWidth: 620,
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
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                background: 'rgba(217, 119, 6, 0.12)',
                                color: '#d97706',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Shield size={22} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                                    Visitor Pass {formatVisitorPassNumber(pass.passNumber, pass.id)}
                                </h3>
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '999px',
                                        textTransform: 'uppercase',
                                        background: isInside
                                            ? 'rgba(16, 185, 129, 0.15)'
                                            : isCompleted
                                            ? 'rgba(100, 116, 139, 0.15)'
                                            : 'rgba(245, 158, 11, 0.15)',
                                        color: isInside ? '#10b981' : isCompleted ? '#64748b' : '#f59e0b'
                                    }}
                                >
                                    {pass.status}
                                </span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Pass Type: <strong>{pass.passType || 'STANDARD'}</strong>
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="erp-button erp-button-secondary"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Print Badge"
                        >
                            <Printer size={15} /> Print
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

                {/* Content */}
                <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
                    {feedbackBanner(actionFeedback)}

                    {/* Badge Preview Card */}
                    <div
                        style={{
                            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.03) 0%, rgba(245, 158, 11, 0.05) 100%)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            marginBottom: '1.25rem'
                        }}
                    >
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--surface-color)',
                                    border: '2px solid #d97706',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '1.5rem',
                                    color: '#d97706',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                }}
                            >
                                {visitor?.photoUrl ? (
                                    <img src={visitor.photoUrl} alt="Visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    visitor?.name ? visitor.name.slice(0, 2).toUpperCase() : 'VP'
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 600 }}>
                                        {visitor?.name || 'Visitor Name'}
                                    </h4>
                                    <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>
                                        {visitor?.category || 'GUEST'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                    <span><Phone size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{visitor?.mobile || 'No Mobile'}</span>
                                    {visitor?.company && <span><Building2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{visitor.company}</span>}
                                    {visitor?.bloodGroup && <span>Blood: <strong>{visitor.bloodGroup}</strong></span>}
                                </div>
                                {visitor?.residentialAddress && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                                        {visitor.residentialAddress} {visitor.pincode ? `(${visitor.pincode})` : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Visit Meta Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                Visit Purpose & Host
                            </div>
                            <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Purpose: </span>
                                <strong>{pass.purpose || 'General Visit'}</strong>
                            </div>
                            <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Host / Resident: </span>
                                <strong>{pass.hostName || 'Front Desk'}</strong>
                            </div>
                            {pass.hostMobile && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Host Phone: {pass.hostMobile}
                                </div>
                            )}
                            {pass.department && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                    Department: {pass.department}
                                </div>
                            )}
                        </div>

                        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                Security & Gate Timings
                            </div>
                            <div style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Clock size={14} color="#10b981" />
                                <span>Check-In: </span>
                                <strong>{formatDateTime(pass.checkInAt || pass.createdAt)}</strong>
                            </div>
                            <div style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Clock size={14} color="#64748b" />
                                <span>Check-Out: </span>
                                <strong>{formatDateTime(pass.checkOutAt)}</strong>
                            </div>
                            {pass.expectedAt && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Calendar size={14} />
                                    <span>Expected: {formatDateTime(pass.expectedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logistics / Material */}
                    {(pass.vehicleNo || pass.materialDetails) && (
                        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                Vehicle & Logistics Details
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                                {pass.vehicleNo && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <Car size={16} color="#d97706" />
                                        <span>Vehicle No: <strong>{pass.vehicleNo}</strong></span>
                                    </div>
                                )}
                                {pass.materialDetails && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <Package size={16} color="#6366f1" />
                                        <span>Material / Belongings: <strong>{pass.materialDetails}</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Authorization Footprint */}
                    <div style={{ background: 'rgba(0, 0, 0, 0.02)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>Recorded at Gate: {formatDateTime(pass.createdAt)}</div>
                        {pass.approvedByUser && (
                            <div style={{ marginTop: '0.2rem' }}>
                                Security Officer / Staff: {pass.approvedByUser.firstName} {pass.approvedByUser.lastName}
                                {pass.approvedByUser.staff?.designation ? ` (${pass.approvedByUser.staff.designation})` : ''}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
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

                    {isInside && onCheckout && (
                        <button
                            type="button"
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="erp-button erp-button-danger"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: '#dc2626',
                                color: '#ffffff'
                            }}
                        >
                            <LogOut size={16} />
                            {isCheckingOut ? 'Checking Out...' : 'Check-Out Visitor Now'}
                        </button>
                    )}

                    {isCompleted && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                            <CheckCircle2 size={16} />
                            Visit Cycle Complete
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function feedbackBanner(feedback: { type: 'success' | 'error'; message: string } | null) {
    if (!feedback) return null;
    const isSuccess = feedback.type === 'success';
    return (
        <div
            style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
                color: isSuccess ? '#10b981' : '#ef4444'
            }}
        >
            {isSuccess ? <CheckCircle2 size={16} /> : <X size={16} />}
            <span>{feedback.message}</span>
        </div>
    );
}
