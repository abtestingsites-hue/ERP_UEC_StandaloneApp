import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    RefreshCw,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    LogOut,
    Clock,
    Briefcase,
    Building2,
    Car,
    CheckCircle
} from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';
import type { StaffDailyMovement, StaffGateTrip } from '../visitorSecurity.types';
import { RecordStaffEntryModal } from '../components/RecordStaffEntryModal';
import { RecordStaffDutyTripModal } from '../components/RecordStaffDutyTripModal';

interface StaffMovementsTabProps {
    unitId?: string | null;
    unitName: string;
}

export function StaffMovementsTab({
    unitId,
    unitName
}: StaffMovementsTabProps) {
    const [staffMovements, setStaffMovements] = useState<StaffDailyMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'INSIDE' | 'OUTSIDE' | 'COMPLETED'>('ALL');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modal state
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isTripModalOpen, setIsTripModalOpen] = useState(false);
    const [selectedMovementForTrip, setSelectedMovementForTrip] = useState<StaffDailyMovement | null>(null);

    // Action loaders
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const handleRefresh = () => {
        setLoading(true);
        setActionError(null);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        visitorSecurityService.getStaffMovements(unitId)
            .then((res) => {
                if (!mounted) return;
                setStaffMovements(res);
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

    // Active staff IDs set (for preventing duplicate entry check-in)
    const activeStaffIds = useMemo(() => {
        const ids = new Set<string>();
        staffMovements.forEach((m) => {
            if (m.status === 'INSIDE' && !m.finalExitAt && m.staffId) {
                ids.add(m.staffId);
            }
        });
        return ids;
    }, [staffMovements]);

    // Helper to find currently active trip
    const getActiveTrip = (m: StaffDailyMovement): StaffGateTrip | undefined => {
        if (!m.trips || m.trips.length === 0) return undefined;
        return m.trips.find((t) => t.status === 'OUTSIDE' && !t.returnAt);
    };

    // Calculate overview statistics
    const stats = useMemo(() => {
        let onPremises = 0;
        let onDutyTrip = 0;
        let completed = 0;

        staffMovements.forEach((m) => {
            if (m.finalExitAt || m.status === 'COMPLETED') {
                completed++;
            } else {
                const activeTrip = getActiveTrip(m);
                if (activeTrip) {
                    onDutyTrip++;
                } else {
                    onPremises++;
                }
            }
        });

        return {
            total: staffMovements.length,
            onPremises,
            onDutyTrip,
            completed
        };
    }, [staffMovements]);

    // Filter staff movements
    const filtered = useMemo(() => {
        return staffMovements.filter((m) => {
            const activeTrip = getActiveTrip(m);
            const isCompleted = Boolean(m.finalExitAt || m.status === 'COMPLETED');
            const isOutside = !isCompleted && Boolean(activeTrip);
            const isInside = !isCompleted && !activeTrip;

            if (statusFilter === 'INSIDE' && !isInside) return false;
            if (statusFilter === 'OUTSIDE' && !isOutside) return false;
            if (statusFilter === 'COMPLETED' && !isCompleted) return false;

            if (!search) return true;
            const q = search.toLowerCase();
            return (
                m.staff?.firstName?.toLowerCase().includes(q) ||
                m.staff?.lastName?.toLowerCase().includes(q) ||
                m.staff?.empId?.toLowerCase().includes(q) ||
                m.staff?.department?.toLowerCase().includes(q) ||
                m.staff?.designation?.toLowerCase().includes(q) ||
                (activeTrip?.reason && activeTrip.reason.toLowerCase().includes(q))
            );
        });
    }, [staffMovements, search, statusFilter]);

    // Handle return from duty trip
    const handleReturn = async (movementId: string, tripId: string) => {
        setActionLoadingId(tripId);
        setActionError(null);
        try {
            await visitorSecurityService.recordStaffTempReturn(movementId, tripId, unitId);
            handleRefresh();
        } catch (err: any) {
            setActionError(err?.response?.data?.message || err?.message || 'Failed to record return');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle final shift exit
    const handleFinalExit = async (movementId: string) => {
        if (!window.confirm('Are you sure you want to clock out this staff member for the day? This will record final shift exit and sync with HR attendance.')) {
            return;
        }
        setActionLoadingId(movementId);
        setActionError(null);
        try {
            await visitorSecurityService.recordStaffFinalExit(movementId, unitId);
            handleRefresh();
        } catch (err: any) {
            setActionError(err?.response?.data?.message || err?.message || 'Failed to record final exit');
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem'
                    }}
                >
                    <div
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Building2 size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Gate Movements Today
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {stats.total}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem'
                    }}
                >
                    <div
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            On Premises
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#10b981' }}>
                            {stats.onPremises}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem'
                    }}
                >
                    <div
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Car size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Out on Duty / Homecare
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#d97706' }}>
                            {stats.onDutyTrip}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem'
                    }}
                >
                    <div
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: 'rgba(100, 116, 139, 0.12)',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <LogOut size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Shift Departed
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#64748b' }}>
                            {stats.completed}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Banner if any */}
            {actionError && (
                <div
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        fontSize: '0.85rem'
                    }}
                >
                    {actionError}
                </div>
            )}

            {/* Header, Search, Filter & Actions */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 260, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', minWidth: 240, flex: 1, maxWidth: 360 }}>
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
                            placeholder="Search staff, ID, duty reason..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {(['ALL', 'INSIDE', 'OUTSIDE', 'COMPLETED'] as const).map((filterVal) => (
                            <button
                                key={filterVal}
                                type="button"
                                onClick={() => setStatusFilter(filterVal)}
                                style={{
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.78rem',
                                    fontWeight: statusFilter === filterVal ? 600 : 500,
                                    cursor: 'pointer',
                                    backgroundColor: statusFilter === filterVal ? 'var(--primary-color, #10b981)' : 'var(--bg-secondary, #f1f5f9)',
                                    color: statusFilter === filterVal ? '#ffffff' : 'var(--text-secondary, #64748b)'
                                }}
                            >
                                {filterVal === 'ALL' && 'All'}
                                {filterVal === 'INSIDE' && 'On Premises'}
                                {filterVal === 'OUTSIDE' && 'On Duty Trip'}
                                {filterVal === 'COMPLETED' && 'Shift Ended'}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                        onClick={() => setIsEntryModalOpen(true)}
                        className="erp-button erp-button-primary"
                        style={{
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: '#10b981',
                            borderColor: '#10b981',
                            color: '#ffffff'
                        }}
                    >
                        <Plus size={15} /> Record Staff Entry
                    </button>
                </div>
            </div>

            {/* Staff Movements Table */}
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
                    Staff gate movements and interim duty logs for <strong>{unitName}</strong>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading staff movements...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {search || statusFilter !== 'ALL'
                            ? 'No staff gate movements match the selected filters.'
                            : 'No staff gate movements recorded today for this unit. Click "Record Staff Entry" to log arrivals.'}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>STAFF MEMBER</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>EMP ID</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DEPARTMENT & ROLE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>INITIAL ENTRY</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DUTY TRIPS & OUTINGS</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>FINAL EXIT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>GATE STATUS</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => {
                                    const isCompleted = Boolean(item.finalExitAt || item.status === 'COMPLETED');
                                    const activeTrip = getActiveTrip(item);
                                    const isOutside = !isCompleted && Boolean(activeTrip);
                                    const isInside = !isCompleted && !isOutside;
                                    const fullName = item.staff
                                        ? `${item.staff.firstName || ''} ${item.staff.lastName || ''}`.trim()
                                        : 'Staff Member';

                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                            {/* Staff Name */}
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fullName}</div>
                                            </td>

                                            {/* Employee ID */}
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                                                {item.staff?.empId || '—'}
                                            </td>

                                            {/* Department & Role */}
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div>{item.staff?.designation || 'Staff'}</div>
                                                {item.staff?.department && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {item.staff.department}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Initial Entry */}
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                                {item.entryAt ? (
                                                    <div>
                                                        {new Date(item.entryAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                                                    </div>
                                                ) : '—'}
                                            </td>

                                            {/* Duty Trips */}
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                                {activeTrip ? (
                                                    <div
                                                        style={{
                                                            padding: '0.35rem 0.6rem',
                                                            borderRadius: '6px',
                                                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                            border: '1px solid rgba(245, 158, 11, 0.25)',
                                                            maxWidth: '280px'
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <Briefcase size={13} /> {activeTrip.reason || 'Duty Assignment'}
                                                        </div>
                                                        {activeTrip.expectedReturnAt && (
                                                            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                <Clock size={11} /> Exp Return: {new Date(activeTrip.expectedReturnAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : item.trips && item.trips.length > 0 ? (
                                                    <div>
                                                        <span style={{ fontWeight: 500 }}>{item.trips.length} trip(s) completed</span>
                                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                                                            Last: {item.trips[item.trips.length - 1].reason || 'Duty visit'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)' }}>No trips taken</span>
                                                )}
                                            </td>

                                            {/* Final Exit */}
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                                {item.finalExitAt ? new Date(item.finalExitAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : '—'}
                                            </td>

                                            {/* Status Badge */}
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {isInside && (
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            padding: '3px 9px',
                                                            borderRadius: 999,
                                                            background: 'rgba(16, 185, 129, 0.15)',
                                                            color: '#10b981'
                                                        }}
                                                    >
                                                        ON PREMISES
                                                    </span>
                                                )}
                                                {isOutside && (
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            padding: '3px 9px',
                                                            borderRadius: 999,
                                                            background: 'rgba(245, 158, 11, 0.15)',
                                                            color: '#d97706'
                                                        }}
                                                    >
                                                        OUT ON DUTY
                                                    </span>
                                                )}
                                                {isCompleted && (
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            padding: '3px 9px',
                                                            borderRadius: 999,
                                                            background: 'rgba(100, 116, 139, 0.15)',
                                                            color: '#64748b'
                                                        }}
                                                    >
                                                        SHIFT ENDED
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                    {/* If Inside: can log Duty Trip or Final Exit */}
                                                    {isInside && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedMovementForTrip(item);
                                                                    setIsTripModalOpen(true);
                                                                }}
                                                                className="erp-button"
                                                                title="Log duty trip / Home Care visit exit"
                                                                style={{
                                                                    padding: '0.35rem 0.65rem',
                                                                    fontSize: '0.78rem',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.3rem',
                                                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                                    color: '#d97706',
                                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                                    borderRadius: '6px'
                                                                }}
                                                            >
                                                                <ArrowUpRight size={13} /> Log Duty Exit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleFinalExit(item.id)}
                                                                disabled={actionLoadingId === item.id}
                                                                className="erp-button"
                                                                title="Clock out and record final shift departure"
                                                                style={{
                                                                    padding: '0.35rem 0.65rem',
                                                                    fontSize: '0.78rem',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.3rem',
                                                                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                                                                    color: '#64748b',
                                                                    border: '1px solid rgba(100, 116, 139, 0.25)',
                                                                    borderRadius: '6px'
                                                                }}
                                                            >
                                                                <LogOut size={13} /> {actionLoadingId === item.id ? 'Exiting...' : 'Shift Exit'}
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* If Outside: can record safe return */}
                                                    {isOutside && activeTrip && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReturn(item.id, activeTrip.id)}
                                                            disabled={actionLoadingId === activeTrip.id}
                                                            className="erp-button"
                                                            title="Record caregiver/staff return to facility"
                                                            style={{
                                                                padding: '0.35rem 0.75rem',
                                                                fontSize: '0.78rem',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.3rem',
                                                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                                                color: '#10b981',
                                                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                                                borderRadius: '6px',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            <ArrowDownLeft size={13} /> {actionLoadingId === activeTrip.id ? 'Returning...' : 'Record Return'}
                                                        </button>
                                                    )}

                                                    {/* If Completed */}
                                                    {isCompleted && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            Completed
                                                        </span>
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

            {/* Modals */}
            <RecordStaffEntryModal
                isOpen={isEntryModalOpen}
                onClose={() => setIsEntryModalOpen(false)}
                onSuccess={() => handleRefresh()}
                unitId={unitId}
                activeStaffIds={activeStaffIds}
            />

            <RecordStaffDutyTripModal
                isOpen={isTripModalOpen}
                onClose={() => {
                    setIsTripModalOpen(false);
                    setSelectedMovementForTrip(null);
                }}
                onSuccess={() => handleRefresh()}
                movement={selectedMovementForTrip}
                unitId={unitId}
            />
        </div>
    );
}
