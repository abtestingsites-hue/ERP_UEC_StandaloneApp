import { useState, useEffect } from 'react';
import {
    Users,
    Shield,
    Clock,
    CheckCircle2,
    ArrowUpRight,
    Car,
    UserCheck,
    Search,
    Eye
} from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';
import type { PassAnalytics, VisitorPass } from '../visitorSecurity.types';

interface VisitorDashboardTabProps {
    unitId?: string | null;
    unitName: string;
    onOpenNewPass: () => void;
    onViewPass: (pass: VisitorPass) => void;
    onNavigateTab: (tabId: string) => void;
}

export function VisitorDashboardTab({
    unitId,
    unitName,
    onOpenNewPass,
    onViewPass,
    onNavigateTab
}: VisitorDashboardTabProps) {
    const [analytics, setAnalytics] = useState<PassAnalytics>({
        totalVisitorsToday: 0,
        pendingPasses: 0,
        approvedPasses: 0,
        guestCount: 0,
        vendorCount: 0,
        otherCount: 0,
        hourlyData: [],
        currentlyInside: 0,
        completedToday: 0,
        recentVisitors: []
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        let mounted = true;
        visitorSecurityService.getAnalytics(unitId)
            .then((data) => {
                if (mounted) {
                    setAnalytics(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [unitId]);

    const filteredRecent = (analytics.recentVisitors || []).filter((p) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            p.visitor?.name?.toLowerCase().includes(q) ||
            p.visitor?.mobile?.includes(q) ||
            p.purpose?.toLowerCase().includes(q) ||
            p.hostName?.toLowerCase().includes(q)
        );
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            TOTAL PASSES TODAY
                        </span>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {loading ? '—' : analytics.totalVisitorsToday}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Operational unit: <strong>{unitName}</strong>
                    </div>
                </div>

                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            CURRENTLY INSIDE
                        </span>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#10b981' }}>
                        {loading ? '—' : analytics.currentlyInside}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Active badges on premises
                    </div>
                </div>

                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            EXPECTED / PENDING
                        </span>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f59e0b' }}>
                        {loading ? '—' : analytics.pendingPasses}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Expected visitor arrivals
                    </div>
                </div>

                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            COMPLETED TODAY
                        </span>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(100, 116, 139, 0.12)', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {loading ? '—' : analytics.completedToday}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Normal gate departures logged
                    </div>
                </div>
            </div>

            {/* Quick Actions & Category Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* Reception & Security Quick Actions */}
                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 600 }}>
                        Front Desk & Security Shortcuts
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={onOpenNewPass}
                            className="erp-button erp-button-primary"
                            style={{
                                padding: '0.85rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.4rem',
                                background: '#d97706',
                                borderColor: '#d97706',
                                color: '#ffffff',
                                borderRadius: '8px',
                                textAlign: 'left'
                            }}
                        >
                            <UserCheck size={20} />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Issue Visitor Pass</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Register & Print Badge</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigateTab('gate-queue')}
                            className="erp-button erp-button-secondary"
                            style={{
                                padding: '0.85rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.4rem',
                                borderRadius: '8px',
                                textAlign: 'left'
                            }}
                        >
                            <Shield size={20} color="#10b981" />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Security Gate Queue</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Check-in & Departures</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigateTab('vehicle-gate')}
                            className="erp-button erp-button-secondary"
                            style={{
                                padding: '0.85rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.4rem',
                                borderRadius: '8px',
                                textAlign: 'left'
                            }}
                        >
                            <Car size={20} color="#6366f1" />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Vehicle Movements</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Entry & Logistics</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigateTab('resident-outings')}
                            className="erp-button erp-button-secondary"
                            style={{
                                padding: '0.85rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.4rem',
                                borderRadius: '8px',
                                textAlign: 'left'
                            }}
                        >
                            <ArrowUpRight size={20} color="#ec4899" />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Resident Outings</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Leave & Returns</span>
                        </button>
                    </div>
                </div>

                {/* Visitor Classification Breakdown */}
                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 600 }}>
                        Visitor Classification Today
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                <span>Guests & Family</span>
                                <strong>{analytics.guestCount}</strong>
                            </div>
                            <div style={{ width: '100%', height: 6, background: 'rgba(0, 0, 0, 0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                <div
                                    style={{
                                        width: `${analytics.totalVisitorsToday ? Math.min(100, (analytics.guestCount / analytics.totalVisitorsToday) * 100) : 0}%`,
                                        height: '100%',
                                        background: '#3b82f6',
                                        borderRadius: 3
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                <span>Vendors & Logistics</span>
                                <strong>{analytics.vendorCount}</strong>
                            </div>
                            <div style={{ width: '100%', height: 6, background: 'rgba(0, 0, 0, 0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                <div
                                    style={{
                                        width: `${analytics.totalVisitorsToday ? Math.min(100, (analytics.vendorCount / analytics.totalVisitorsToday) * 100) : 0}%`,
                                        height: '100%',
                                        background: '#10b981',
                                        borderRadius: 3
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                <span>Contractors & Maintenance</span>
                                <strong>{analytics.otherCount}</strong>
                            </div>
                            <div style={{ width: '100%', height: 6, background: 'rgba(0, 0, 0, 0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                <div
                                    style={{
                                        width: `${analytics.totalVisitorsToday ? Math.min(100, (analytics.otherCount / analytics.totalVisitorsToday) * 100) : 0}%`,
                                        height: '100%',
                                        background: '#f59e0b',
                                        borderRadius: 3
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Passes Table */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                            Recent Passes & Gate Entries
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Active and recent passes issued for {unitName}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', minWidth: 240 }}>
                            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="erp-input"
                                placeholder="Search by name, phone, host..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => onNavigateTab('passes')}
                            className="erp-button erp-button-secondary"
                            style={{ fontSize: '0.85rem' }}
                        >
                            View All Passes
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading visitor pass analytics...
                    </div>
                ) : filteredRecent.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No visitor passes found for this unit today.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>VISITOR</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>CATEGORY</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>HOST / RESIDENT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>PURPOSE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>TIME</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecent.slice(0, 10).map((pass) => (
                                    <tr key={pass.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{pass.visitor?.name || 'Visitor'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pass.visitor?.mobile}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.05)' }}>
                                                {pass.visitor?.category || 'GUEST'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div>{pass.hostName || 'Front Desk'}</div>
                                            {pass.department && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pass.department}</span>}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {pass.purpose || 'Visit'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    padding: '2px 8px',
                                                    borderRadius: 999,
                                                    background:
                                                        pass.status === 'ACTIVE' || pass.status === 'APPROVED'
                                                            ? 'rgba(16, 185, 129, 0.15)'
                                                            : pass.status === 'COMPLETED'
                                                            ? 'rgba(100, 116, 139, 0.15)'
                                                            : 'rgba(245, 158, 11, 0.15)',
                                                    color:
                                                        pass.status === 'ACTIVE' || pass.status === 'APPROVED'
                                                            ? '#10b981'
                                                            : pass.status === 'COMPLETED'
                                                            ? '#64748b'
                                                            : '#f59e0b'
                                                }}
                                            >
                                                {pass.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {pass.checkInAt ? new Date(pass.checkInAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : 'Pending'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                onClick={() => onViewPass(pass)}
                                                className="erp-button erp-button-secondary"
                                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Eye size={13} /> View Pass
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
