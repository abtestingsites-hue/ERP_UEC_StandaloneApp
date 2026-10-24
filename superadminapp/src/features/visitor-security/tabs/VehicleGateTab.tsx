import { useState, useEffect } from 'react';
import {
    Plus,
    LogOut,
    CheckCircle2,
    Search,
    Phone,
    Building2,
    Package,
    RefreshCw
} from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';
import type { VehicleMovement } from '../visitorSecurity.types';

interface VehicleGateTabProps {
    unitId?: string | null;
    unitName: string;
    onOpenVehicleEntry: () => void;
    onRecordExit: (movementId: string) => Promise<void>;
}

export function VehicleGateTab({
    unitId,
    unitName,
    onOpenVehicleEntry,
    onRecordExit
}: VehicleGateTabProps) {
    const [movements, setMovements] = useState<VehicleMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'INSIDE' | 'EXITED'>('INSIDE');
    const [search, setSearch] = useState('');
    const [exitingId, setExitingId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        visitorSecurityService.getVehicleMovements(unitId)
            .then((res) => {
                if (!mounted) return;
                setMovements(res);
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

    const handleExit = async (id: string) => {
        setExitingId(id);
        try {
            await onRecordExit(id);
            handleRefresh();
        } finally {
            setExitingId(null);
        }
    };

    const insideCount = movements.filter((m) => !m.exitAt).length;
    const exitedCount = movements.filter((m) => Boolean(m.exitAt)).length;

    const filteredMovements = movements.filter((m) => {
        if (filterStatus === 'INSIDE' && m.exitAt) return false;
        if (filterStatus === 'EXITED' && !m.exitAt) return false;

        if (search) {
            const q = search.toLowerCase();
            return (
                m.vehicleNo?.toLowerCase().includes(q) ||
                m.driverName?.toLowerCase().includes(q) ||
                m.companyName?.toLowerCase().includes(q) ||
                m.purpose?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header & Actions */}
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
                            placeholder="Search vehicle number, driver, company..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('INSIDE')}
                            style={{
                                border: 'none',
                                background: filterStatus === 'INSIDE' ? 'var(--surface-color)' : 'transparent',
                                color: filterStatus === 'INSIDE' ? '#10b981' : 'var(--text-secondary)',
                                fontWeight: filterStatus === 'INSIDE' ? 600 : 400,
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: filterStatus === 'INSIDE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Currently Inside ({insideCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('ALL')}
                            style={{
                                border: 'none',
                                background: filterStatus === 'ALL' ? 'var(--surface-color)' : 'transparent',
                                color: filterStatus === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: filterStatus === 'ALL' ? 600 : 400,
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: filterStatus === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            All ({movements.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('EXITED')}
                            style={{
                                border: 'none',
                                background: filterStatus === 'EXITED' ? 'var(--surface-color)' : 'transparent',
                                color: filterStatus === 'EXITED' ? 'var(--text-secondary)' : 'var(--text-secondary)',
                                fontWeight: filterStatus === 'EXITED' ? 600 : 400,
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: filterStatus === 'EXITED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Departed ({exitedCount})
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="erp-button erp-button-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Refresh Vehicle Register"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={onOpenVehicleEntry}
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
                        <Plus size={16} /> Record Vehicle Entry
                    </button>
                </div>
            </div>

            {/* Movements Table */}
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
                    Vehicles currently recorded in security log for <strong>{unitName}</strong>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading vehicle entries...
                    </div>
                ) : filteredMovements.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No vehicle records found for selected filter.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>VEHICLE NUMBER</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>TYPE & PURPOSE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DRIVER & MOBILE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>COMPANY / CARGO</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>ENTRY TIME</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>EXIT TIME</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMovements.map((item) => {
                                    const isInside = !item.exitAt;
                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                                <span style={{ color: '#d97706', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                                                    {item.vehicleNo}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 500 }}>{item.purpose}</div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {item.vehicleType || 'VEHICLE'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div>{item.driverName}</div>
                                                {item.driverMobile && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Phone size={11} /> {item.driverMobile}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {item.companyName && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Building2 size={12} color="var(--text-secondary)" />
                                                        <span>{item.companyName}</span>
                                                    </div>
                                                )}
                                                {item.materialDetails && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Package size={11} /> {item.materialDetails}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        padding: '2px 8px',
                                                        borderRadius: 999,
                                                        background: isInside ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                                        color: isInside ? '#10b981' : '#64748b'
                                                    }}
                                                >
                                                    {isInside ? 'INSIDE' : 'DEPARTED'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {new Date(item.entryAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {item.exitAt ? new Date(item.exitAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : '—'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                {isInside ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleExit(item.id)}
                                                        disabled={exitingId === item.id}
                                                        className="erp-button erp-button-danger"
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '0.75rem',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            background: '#dc2626',
                                                            color: '#ffffff'
                                                        }}
                                                    >
                                                        <LogOut size={13} />
                                                        {exitingId === item.id ? 'Recording...' : 'Record Exit'}
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                        <CheckCircle2 size={13} /> Cleared
                                                    </span>
                                                )}
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
