import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Eye,
    LogOut,
    Phone,
    Building2,
    Car
} from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';
import type { VisitorPass } from '../visitorSecurity.types';
import { formatVisitorPassNumber } from '../../../utils/idFormatters';

interface VisitorPassesTabProps {
    unitId?: string | null;
    unitName: string;
    onOpenNewPass: () => void;
    onViewPass: (pass: VisitorPass) => void;
    onCheckoutPass: (passId: string) => Promise<void>;
}

export function VisitorPassesTab({
    unitId,
    unitName,
    onOpenNewPass,
    onViewPass,
    onCheckoutPass
}: VisitorPassesTabProps) {
    const [passes, setPasses] = useState<VisitorPass[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'PENDING'>('ALL');
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        visitorSecurityService.getPasses(unitId)
            .then((res) => {
                if (!mounted) return;
                setPasses(res);
                setLoading(false);
            })
            .catch(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [unitId, refreshTrigger]);

    const handleCheckout = async (passId: string) => {
        setActionLoadingId(passId);
        try {
            await onCheckoutPass(passId);
            handleRefresh();
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredPasses = passes.filter((p) => {
        // Status filter
        if (statusFilter === 'ACTIVE' && !(p.status === 'ACTIVE' || p.status === 'APPROVED' || p.status === 'CHECKED_IN')) {
            return false;
        }
        if (statusFilter === 'COMPLETED' && !(p.status === 'COMPLETED' || p.status === 'CHECKED_OUT')) {
            return false;
        }
        if (statusFilter === 'PENDING' && !(p.status === 'PENDING' || p.status === 'EXPECTED')) {
            return false;
        }

        // Search query
        if (search) {
            const q = search.toLowerCase();
            const matchName = p.visitor?.name?.toLowerCase().includes(q);
            const matchMobile = p.visitor?.mobile?.includes(q);
            const matchHost = p.hostName?.toLowerCase().includes(q);
            const matchPurpose = p.purpose?.toLowerCase().includes(q);
            const matchId = p.id.toLowerCase().includes(q);
            if (!matchName && !matchMobile && !matchHost && !matchPurpose && !matchId) {
                return false;
            }
        }
        return true;
    });

    const activeCount = passes.filter((p) => p.status === 'ACTIVE' || p.status === 'APPROVED' || p.status === 'CHECKED_IN').length;
    const completedCount = passes.filter((p) => p.status === 'COMPLETED' || p.status === 'CHECKED_OUT').length;
    const pendingCount = passes.filter((p) => p.status === 'PENDING' || p.status === 'EXPECTED').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Filter Bar & Header */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}
            >
                {/* Search & Tabs */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    <div style={{ position: 'relative', minWidth: 260 }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)'
                            }}
                        />
                        <input
                            type="text"
                            className="erp-input"
                            placeholder="Search visitor, phone, host, ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('ALL')}
                            style={{
                                border: 'none',
                                background: statusFilter === 'ALL' ? 'var(--surface-color)' : 'transparent',
                                color: statusFilter === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: statusFilter === 'ALL' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            All ({passes.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('ACTIVE')}
                            style={{
                                border: 'none',
                                background: statusFilter === 'ACTIVE' ? 'var(--surface-color)' : 'transparent',
                                color: statusFilter === 'ACTIVE' ? '#10b981' : 'var(--text-secondary)',
                                fontWeight: statusFilter === 'ACTIVE' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'ACTIVE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Inside ({activeCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('PENDING')}
                            style={{
                                border: 'none',
                                background: statusFilter === 'PENDING' ? 'var(--surface-color)' : 'transparent',
                                color: statusFilter === 'PENDING' ? '#f59e0b' : 'var(--text-secondary)',
                                fontWeight: statusFilter === 'PENDING' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'PENDING' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Expected ({pendingCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('COMPLETED')}
                            style={{
                                border: 'none',
                                background: statusFilter === 'COMPLETED' ? 'var(--surface-color)' : 'transparent',
                                color: statusFilter === 'COMPLETED' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: statusFilter === 'COMPLETED' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'COMPLETED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Completed ({completedCount})
                        </button>
                    </div>
                </div>

                {/* Primary Action Button */}
                <button
                    type="button"
                    onClick={onOpenNewPass}
                    className="erp-button erp-button-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#d97706',
                        borderColor: '#d97706',
                        color: '#ffffff'
                    }}
                >
                    <Plus size={16} /> Issue Visitor Pass
                </button>
            </div>

            {/* Passes Table */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Showing <strong>{filteredPasses.length}</strong> visitor pass records for <strong>{unitName}</strong>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading passes...
                    </div>
                ) : filteredPasses.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No visitor passes matching criteria.
                    </div>
                ) : (
                    <div className="erp-table-responsive">
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem', width: '13%' }}>PASS ID</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '18%' }}>VISITOR DETAILS</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '14%', textAlign: 'center' }}>CATEGORY</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '17%' }}>HOST & DEPARTMENT</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '14%' }}>PURPOSE</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '8%', textAlign: 'center' }}>STATUS</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '8%', textAlign: 'center' }}>CHECK-IN</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '8%', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPasses.map((pass) => {
                                    const isInside = pass.status === 'ACTIVE' || pass.status === 'APPROVED' || pass.status === 'CHECKED_IN';
                                    const isCompleted = pass.status === 'COMPLETED' || pass.status === 'CHECKED_OUT';

                                    return (
                                        <tr key={pass.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                                <span style={{ fontFamily: 'monospace', color: '#d97706', whiteSpace: 'nowrap' }}>
                                                    {formatVisitorPassNumber(pass.passNumber, pass.id)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{pass.visitor?.name || 'Visitor'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Phone size={11} /> {pass.visitor?.mobile}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.05)', whiteSpace: 'nowrap' }}>
                                                    {pass.visitor?.category || 'GUEST'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 500 }}>{pass.hostName || 'Front Desk'}</div>
                                                {pass.department && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Building2 size={11} /> {pass.department}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div>{pass.purpose || 'Visit'}</div>
                                                {pass.vehicleNo && (
                                                    <div style={{ fontSize: '0.75rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Car size={11} /> {pass.vehicleNo}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                <span
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        padding: '2px 8px',
                                                        borderRadius: 999,
                                                        background: isInside
                                                            ? 'rgba(16, 185, 129, 0.15)'
                                                            : isCompleted
                                                            ? 'rgba(100, 116, 139, 0.15)'
                                                            : 'rgba(245, 158, 11, 0.15)',
                                                        color: isInside ? '#10b981' : isCompleted ? '#64748b' : '#f59e0b',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {pass.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                {pass.checkInAt
                                                    ? new Date(pass.checkInAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })
                                                    : pass.expectedAt
                                                    ? `Exp: ${new Date(pass.expectedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}`
                                                    : '—'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => onViewPass(pass)}
                                                        className="erp-button erp-button-secondary"
                                                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <Eye size={13} /> View
                                                    </button>
                                                    {isInside && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCheckout(pass.id)}
                                                            disabled={actionLoadingId === pass.id}
                                                            className="erp-button erp-button-secondary"
                                                            style={{
                                                                padding: '4px 8px',
                                                                fontSize: '0.75rem',
                                                                color: '#dc2626',
                                                                borderColor: '#dc2626',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <LogOut size={13} />
                                                            {actionLoadingId === pass.id ? 'Exiting...' : 'Check-Out'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
