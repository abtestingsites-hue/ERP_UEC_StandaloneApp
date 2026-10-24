import { useState, useEffect } from 'react';
import {
    Calendar,
    Search,
    Printer,
    RefreshCw
} from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';
import type { GateEntry } from '../visitorSecurity.types';

interface DailyReportsTabProps {
    unitId?: string | null;
    unitName: string;
}

export function DailyReportsTab({
    unitId,
    unitName
}: DailyReportsTabProps) {
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [reportData, setReportData] = useState<GateEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        visitorSecurityService.getDailyMovementReport(selectedDate, unitId)
            .then((res) => {
                if (!mounted) return;
                setReportData(res);
                setLoading(false);
            })
            .catch(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [selectedDate, unitId, refreshTrigger]);

    const [typeFilter, setTypeFilter] = useState<'ALL' | 'VISITOR' | 'STAFF' | 'VEHICLE' | 'RESIDENT'>('ALL');

    const handlePrint = () => {
        window.print();
    };

    const filtered = reportData.filter((entry) => {
        const itemType = (entry.entryType || 'VISITOR').toUpperCase();
        if (typeFilter !== 'ALL' && itemType !== typeFilter) {
            return false;
        }

        if (!search) return true;
        const q = search.toLowerCase();
        return (
            entry.visitorName?.toLowerCase().includes(q) ||
            entry.staffName?.toLowerCase().includes(q) ||
            entry.empId?.toLowerCase().includes(q) ||
            entry.mobile?.includes(q) ||
            entry.driverMobile?.includes(q) ||
            entry.visitingPerson?.toLowerCase().includes(q) ||
            entry.purpose?.toLowerCase().includes(q) ||
            entry.vehicleNo?.toLowerCase().includes(q)
        );
    });

    const checkedInCount = reportData.filter((e) => Boolean(e.checkInAt)).length;
    const insideCount = reportData.filter((e) => Boolean(e.checkInAt) && !e.checkOutAt).length;
    const completedCount = reportData.filter((e) => Boolean(e.checkOutAt)).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Report Filter & Controls */}
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
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} color="#d97706" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Report Date:</span>
                        <input
                            type="date"
                            className="erp-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                        />
                    </div>

                    <div style={{ position: 'relative', minWidth: 240, flex: 1, maxWidth: 320 }}>
                        <Search
                            size={15}
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
                            placeholder="Filter report records..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 32, fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>

                    {/* Type Filter Buttons */}
                    <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
                        {(['ALL', 'VISITOR', 'STAFF', 'VEHICLE', 'RESIDENT'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setTypeFilter(type)}
                                style={{
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: typeFilter === type ? 600 : 400,
                                    cursor: 'pointer',
                                    background: typeFilter === type ? 'var(--surface-color)' : 'transparent',
                                    color: typeFilter === type ? '#d97706' : 'var(--text-secondary)',
                                    boxShadow: typeFilter === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                {type === 'ALL' && 'All Movements'}
                                {type === 'VISITOR' && 'Visitors'}
                                {type === 'STAFF' && 'Staff Logs'}
                                {type === 'VEHICLE' && 'Vehicles'}
                                {type === 'RESIDENT' && 'Outings'}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="erp-button erp-button-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="erp-button erp-button-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        <Printer size={15} /> Print Daily Log
                    </button>
                </div>
            </div>

            {/* Daily KPI Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL CHECK-INS</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.25rem' }}>{checkedInCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>For {selectedDate}</div>
                </div>
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CURRENTLY INSIDE</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>{insideCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Still on site</div>
                </div>
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>COMPLETED EXITS</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#64748b', marginTop: '0.25rem' }}>{completedCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Checkouts verified</div>
                </div>
            </div>

            {/* Report Table */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Gate movement entries for <strong>{unitName}</strong> on <strong>{selectedDate}</strong>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Compiling daily movement report...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No gate movement records found for this date.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>TYPE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>NAME / IDENTITY</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>HOST / PURPOSE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>VEHICLE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>ENTRY TIME</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>EXIT TIME</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>SECURITY REMARKS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => {
                                    const rawType = (item.entryType || 'VISITOR').toUpperCase();
                                    const displayName = item.visitorName || item.staffName || (item.vehicleNo ? `Vehicle ${item.vehicleNo}` : 'Movement Entry');
                                    const subtitle = item.mobile || item.driverMobile || (item.empId ? `Emp ID: ${item.empId}` : '');

                                    let badgeBg = 'rgba(59, 130, 246, 0.12)';
                                    let badgeColor = '#2563eb';
                                    if (rawType === 'STAFF') {
                                        badgeBg = 'rgba(245, 158, 11, 0.12)';
                                        badgeColor = '#d97706';
                                    } else if (rawType === 'VEHICLE') {
                                        badgeBg = 'rgba(99, 102, 241, 0.12)';
                                        badgeColor = '#6366f1';
                                    } else if (rawType === 'RESIDENT') {
                                        badgeBg = 'rgba(236, 72, 153, 0.12)';
                                        badgeColor = '#ec4899';
                                    }

                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span
                                                    style={{
                                                        fontSize: '0.72rem',
                                                        fontWeight: 600,
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        background: badgeBg,
                                                        color: badgeColor
                                                    }}
                                                >
                                                    {rawType}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{displayName}</div>
                                                {subtitle && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtitle}</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div>{item.visitingPerson ? `${item.visitingPerson}` : (rawType === 'STAFF' ? 'Internal Staff' : 'Front Desk')}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.purpose}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {item.vehicleNo ? (
                                                    <span style={{ color: '#d97706', fontWeight: 600 }}>{item.vehicleNo}</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)' }}>Pedestrian</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                                {item.checkInAt ? new Date(item.checkInAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : '—'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                                {item.checkOutAt ? new Date(item.checkOutAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : 'Inside'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        padding: '2px 8px',
                                                        borderRadius: 999,
                                                        background: !item.checkOutAt ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                                        color: !item.checkOutAt ? '#10b981' : '#64748b'
                                                    }}
                                                >
                                                    {!item.checkOutAt ? 'INSIDE' : 'CHECKED OUT'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {item.remarks || item.arrivalRemarks || item.checkoutRemarks || (rawType === 'STAFF' ? 'Daily gate log' : 'Normal movement')}
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
