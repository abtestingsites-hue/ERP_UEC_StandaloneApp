import { useState, useEffect } from 'react';
import {
    Shield,
    CheckCircle2,
    LogOut,
    Search,
    Phone,
    Building2,
    Car,
    RefreshCw
} from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';
import type { GateEntry } from '../visitorSecurity.types';

interface GateQueueTabProps {
    unitId?: string | null;
    unitName: string;
    onCheckIn: (entry: GateEntry) => void;
    onCheckOut: (entry: GateEntry) => void;
}

export function GateQueueTab({
    unitId,
    unitName,
    onCheckIn,
    onCheckOut
}: GateQueueTabProps) {
    const [entries, setEntries] = useState<GateEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'INSIDE' | 'EXPECTED'>('INSIDE');
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        visitorSecurityService.getGateQueue(unitId)
            .then((res) => {
                if (!mounted) return;
                setEntries(res);
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

    const insideVisitors = entries.filter((e) => e.status === 'INSIDE' || e.status === 'CHECKED_IN' || (!e.checkOutAt && Boolean(e.checkInAt)));
    const expectedVisitors = entries.filter((e) => e.status === 'EXPECTED' || e.status === 'PENDING' || (!e.checkInAt && Boolean(e.expectedAt)));

    const currentList = activeSection === 'INSIDE' ? insideVisitors : expectedVisitors;

    const filteredList = currentList.filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            item.visitorName?.toLowerCase().includes(q) ||
            item.mobile?.includes(q) ||
            item.visitingPerson?.toLowerCase().includes(q) ||
            item.purpose?.toLowerCase().includes(q) ||
            item.vehicleNo?.toLowerCase().includes(q)
        );
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Realtime Gate Operational Header */}
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
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={20} color="#10b981" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                            Security Gate Queue & Checkpoint
                        </h3>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Live booth operations for <strong>{unitName}</strong>
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Switcher */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setActiveSection('INSIDE')}
                            style={{
                                border: 'none',
                                background: activeSection === 'INSIDE' ? 'var(--surface-color)' : 'transparent',
                                color: activeSection === 'INSIDE' ? '#10b981' : 'var(--text-secondary)',
                                fontWeight: activeSection === 'INSIDE' ? 600 : 400,
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: activeSection === 'INSIDE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <span>Currently Inside Gate</span>
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '1px 6px',
                                    borderRadius: 999,
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981'
                                }}
                            >
                                {insideVisitors.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('EXPECTED')}
                            style={{
                                border: 'none',
                                background: activeSection === 'EXPECTED' ? 'var(--surface-color)' : 'transparent',
                                color: activeSection === 'EXPECTED' ? '#f59e0b' : 'var(--text-secondary)',
                                fontWeight: activeSection === 'EXPECTED' ? 600 : 400,
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: activeSection === 'EXPECTED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <span>Expected Arrivals</span>
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '1px 6px',
                                    borderRadius: 999,
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: '#f59e0b'
                                }}
                            >
                                {expectedVisitors.length}
                            </span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="erp-button erp-button-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Refresh Gate Queue"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
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
                        placeholder={`Search ${activeSection === 'INSIDE' ? 'inside visitors' : 'expected arrivals'} by name, mobile, host...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                    />
                </div>
            </div>

            {/* Content List */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading real-time gate queue...
                    </div>
                ) : filteredList.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No {activeSection === 'INSIDE' ? 'visitors currently inside the premises' : 'expected visitors awaiting arrival'}.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>VISITOR / PASS HOLDER</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>PURPOSE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>HOST / RESIDENT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>VEHICLE / LOGISTICS</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>
                                        {activeSection === 'INSIDE' ? 'ENTRY TIME' : 'EXPECTED AT'}
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.map((entry) => (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{entry.visitorName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={11} /> {entry.mobile}
                                            </div>
                                            {entry.companyName && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {entry.companyName}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div>{entry.purpose}</div>
                                            {entry.materialDetails && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    Cargo: {entry.materialDetails}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 500 }}>{entry.visitingPerson || 'Front Desk'}</div>
                                            {entry.department && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <Building2 size={11} /> {entry.department}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {entry.vehicleNo ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#d97706', fontWeight: 600 }}>
                                                    <Car size={13} /> {entry.vehicleNo}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Pedestrian</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {activeSection === 'INSIDE' ? (
                                                entry.checkInAt ? (
                                                    <span style={{ color: '#10b981', fontWeight: 500 }}>
                                                        {new Date(entry.checkInAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                                                    </span>
                                                ) : 'Inside'
                                            ) : (
                                                entry.expectedAt ? (
                                                    <span>
                                                        {new Date(entry.expectedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                                                    </span>
                                                ) : 'Today'
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            {activeSection === 'INSIDE' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onCheckOut(entry)}
                                                    className="erp-button erp-button-danger"
                                                    style={{
                                                        padding: '5px 10px',
                                                        fontSize: '0.75rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        background: '#dc2626',
                                                        color: '#ffffff'
                                                    }}
                                                >
                                                    <LogOut size={13} /> Check-Out
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => onCheckIn(entry)}
                                                    className="erp-button erp-button-primary"
                                                    style={{
                                                        padding: '5px 10px',
                                                        fontSize: '0.75rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        background: '#10b981',
                                                        borderColor: '#10b981',
                                                        color: '#ffffff'
                                                    }}
                                                >
                                                    <CheckCircle2 size={13} /> Check-In
                                                </button>
                                            )}
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
