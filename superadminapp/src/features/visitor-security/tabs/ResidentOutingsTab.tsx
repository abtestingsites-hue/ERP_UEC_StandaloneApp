import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Clock,
    Search,
    AlertTriangle,
    RefreshCw,
    MapPin,
    Plus
} from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';
import type { ResidentOuting } from '../visitorSecurity.types';
import { LogResidentOutingModal } from '../components/LogResidentOutingModal';
import { formatElderId } from '../../../utils/idFormatters';

interface ResidentOutingsTabProps {
    unitId?: string | null;
    unitName: string;
    onRecordReturn: (outingId: string) => Promise<void>;
}

export function ResidentOutingsTab({
    unitId,
    unitName,
    onRecordReturn
}: ResidentOutingsTabProps) {
    const [outings, setOutings] = useState<ResidentOuting[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'OUTSIDE' | 'RETURNED'>('OUTSIDE');
    const [search, setSearch] = useState('');
    const [returningId, setReturningId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isOutingModalOpen, setIsOutingModalOpen] = useState(false);

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        visitorSecurityService.getResidentOutings(unitId)
            .then((res) => {
                if (!mounted) return;
                setOutings(res);
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

    const handleReturn = async (id: string) => {
        setReturningId(id);
        try {
            await onRecordReturn(id);
            handleRefresh();
        } finally {
            setReturningId(null);
        }
    };

    const outsideCount = outings.filter((o) => o.status === 'OUTSIDE' || o.status === 'ACTIVE' || !o.movements?.some((m) => m.actualReturnAt)).length;
    const returnedCount = outings.filter((o) => o.status === 'RETURNED' || o.movements?.some((m) => m.actualReturnAt)).length;

    const filteredOutings = outings.filter((item) => {
        const isReturned = item.status === 'RETURNED' || item.movements?.some((m) => m.actualReturnAt);
        if (filterStatus === 'OUTSIDE' && isReturned) return false;
        if (filterStatus === 'RETURNED' && !isReturned) return false;

        if (search) {
            const q = search.toLowerCase();
            return (
                item.patient?.name?.toLowerCase().includes(q) ||
                item.destination?.toLowerCase().includes(q) ||
                item.companionName?.toLowerCase().includes(q) ||
                item.reason?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header & Controls */}
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
                            placeholder="Search resident, destination, companion..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('OUTSIDE')}
                            style={{
                                border: 'none',
                                background: filterStatus === 'OUTSIDE' ? 'var(--surface-color)' : 'transparent',
                                color: filterStatus === 'OUTSIDE' ? '#f59e0b' : 'var(--text-secondary)',
                                fontWeight: filterStatus === 'OUTSIDE' ? 600 : 400,
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: filterStatus === 'OUTSIDE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Currently Out ({outsideCount})
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
                            All ({outings.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('RETURNED')}
                            style={{
                                border: 'none',
                                background: filterStatus === 'RETURNED' ? 'var(--surface-color)' : 'transparent',
                                color: filterStatus === 'RETURNED' ? '#10b981' : 'var(--text-secondary)',
                                fontWeight: filterStatus === 'RETURNED' ? 600 : 400,
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: filterStatus === 'RETURNED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Returned ({returnedCount})
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="erp-button erp-button-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Refresh Outings"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsOutingModalOpen(true)}
                        className="erp-button erp-button-primary"
                        style={{
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#d97706',
                            borderColor: '#d97706',
                            color: '#ffffff'
                        }}
                    >
                        <Plus size={14} /> Log Outing Leave
                    </button>
                </div>
            </div>

            {/* Outings Table */}
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
                    Resident gate leaves and safety movements for <strong>{unitName}</strong>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading resident outings...
                    </div>
                ) : filteredOutings.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No resident outing records matching current filter.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>RESIDENT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DESTINATION & REASON</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>COMPANION</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>EXPECTED RETURN</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>GATE ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOutings.map((item) => {
                                    const isReturned = item.status === 'RETURNED' || item.movements?.some((m) => m.actualReturnAt);
                                    const isOverdue = Boolean(item.isOverdue || (!isReturned && item.expectedReturnAt && new Date(item.expectedReturnAt) < new Date()));

                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{item.patient?.name || 'Resident'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    Elder ID: <strong style={{ color: '#0f172a' }}>{formatElderId(item.patient?.elderId, item.patientId || item.patient?.id)}</strong>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                                    <MapPin size={12} color="#d97706" /> {item.destination}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {item.reason}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div>{item.companionName || item.companionType || 'Unaccompanied'}</div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {item.companionType}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} />
                                                    {new Date(item.expectedReturnAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(item.expectedReturnAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {isOverdue ? (
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            padding: '2px 8px',
                                                            borderRadius: 999,
                                                            background: 'rgba(239, 68, 68, 0.15)',
                                                            color: '#ef4444',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px'
                                                        }}
                                                    >
                                                        <AlertTriangle size={11} /> OVERDUE
                                                    </span>
                                                ) : isReturned ? (
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            padding: '2px 8px',
                                                            borderRadius: 999,
                                                            background: 'rgba(16, 185, 129, 0.15)',
                                                            color: '#10b981'
                                                        }}
                                                    >
                                                        RETURNED
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            padding: '2px 8px',
                                                            borderRadius: 999,
                                                            background: 'rgba(245, 158, 11, 0.15)',
                                                            color: '#f59e0b'
                                                        }}
                                                    >
                                                        OUTSIDE
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                {!isReturned ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReturn(item.id)}
                                                        disabled={returningId === item.id}
                                                        className="erp-button erp-button-primary"
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '0.75rem',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            background: '#10b981',
                                                            borderColor: '#10b981',
                                                            color: '#ffffff'
                                                        }}
                                                    >
                                                        <CheckCircle2 size={13} />
                                                        {returningId === item.id ? 'Recording...' : 'Record Return'}
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                        <CheckCircle2 size={13} /> Safe Return
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

            <LogResidentOutingModal
                isOpen={isOutingModalOpen}
                onClose={() => setIsOutingModalOpen(false)}
                onSuccess={handleRefresh}
                unitId={unitId}
            />
        </div>
    );
}
