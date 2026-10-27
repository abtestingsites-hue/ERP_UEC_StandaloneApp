import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Search,
    Plus,
    Play,
    Pause,
    CheckCircle2,
    XCircle,
    Trash2,
    Calendar,
    Stethoscope
} from 'lucide-react';
import { careService } from '../care.service';
import type { MedicalAssignment, MedicalStaff, AssignmentStatus } from '../care.types';

interface AssignmentsTabProps {
    activeUnitId?: string | null;
    onAssignDuty: () => void;
    onLaunchDutyWorkspace: (assignment: MedicalAssignment) => void;
    onReviewApproval: (assignment: MedicalAssignment) => void;
}

export function AssignmentsTab({
    activeUnitId,
    onAssignDuty,
    onLaunchDutyWorkspace,
    onReviewApproval
}: AssignmentsTabProps) {
    const [assignments, setAssignments] = useState<MedicalAssignment[]>([]);
    const [staffList, setStaffList] = useState<MedicalStaff[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [staffFilter, setStaffFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [assList, staff] = await Promise.all([
                careService.getAssignments({ unitId: activeUnitId }),
                careService.getMedicalStaff(activeUnitId)
            ]);
            setAssignments(assList);
            setStaffList(staff);
        } catch {
            setAssignments([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await loadData();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [loadData]);

    const filteredAssignments = useMemo(() => {
        return assignments.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
            if (staffFilter !== 'ALL' && item.staffId !== staffFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const staffName = `${item.staff?.firstName || ''} ${item.staff?.lastName || ''}`.toLowerCase();
                const patientName = (item.patient?.name || '').toLowerCase();
                const dutyType = (item.dutyType || '').toLowerCase();
                const location = (item.location || '').toLowerCase();
                if (!staffName.includes(q) && !patientName.includes(q) && !dutyType.includes(q) && !location.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [assignments, statusFilter, staffFilter, searchQuery]);

    const handleStatusTransition = async (id: string, targetStatus: string) => {
        try {
            await careService.updateAssignmentStatus(id, targetStatus, undefined, activeUnitId);
            setAssignments((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status: targetStatus as AssignmentStatus } : a))
            );
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to update assignment status.';
            alert(message);
        }
    };

    const handleDelete = async (id: string, refNo?: string | null) => {
        if (!window.confirm(`Delete clinical duty assignment ${refNo || id.slice(0, 8)}?`)) return;
        try {
            await careService.deleteAssignment(id, activeUnitId);
            setAssignments((prev) => prev.filter((a) => a.id !== id));
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to delete assignment.';
            alert(message);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ASSIGNED':
                return <span className="adm-badge adm-badge--neutral">Assigned</span>;
            case 'IN_PROGRESS':
                return <span className="adm-badge adm-badge--primary">In Progress</span>;
            case 'WAITING_APPROVAL':
                return <span className="adm-badge adm-badge--warning">Waiting Approval</span>;
            case 'APPROVED':
                return <span className="adm-badge adm-badge--success">Approved</span>;
            case 'ON_HOLD':
                return <span className="adm-badge adm-badge--warning">On Hold</span>;
            case 'COMPLETED':
                return <span className="adm-badge adm-badge--neutral">Completed</span>;
            case 'CANCELLED':
                return <span className="adm-badge adm-badge--danger">Cancelled</span>;
            default:
                return <span className="adm-badge adm-badge--neutral">{status}</span>;
        }
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'CRITICAL':
                return <span className="adm-badge adm-badge--danger" style={{ fontSize: 10 }}>CRITICAL</span>;
            case 'HIGH':
                return <span className="adm-badge adm-badge--warning" style={{ fontSize: 10 }}>HIGH</span>;
            case 'LOW':
                return <span className="adm-badge adm-badge--neutral" style={{ fontSize: 10 }}>LOW</span>;
            default:
                return <span className="adm-badge adm-badge--primary" style={{ fontSize: 10 }}>MED</span>;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter Section */}
            <div className="adm-filter-bar" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                    <input
                        type="text"
                        className="adm-input"
                        placeholder="Search by staff, resident, duty, or room..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                </div>

                <select
                    className="adm-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: 'auto', minWidth: 160 }}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_APPROVAL">Waiting Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>

                <select
                    className="adm-select"
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                    style={{ width: 'auto', minWidth: 180 }}
                >
                    <option value="ALL">All Staff Members</option>
                    {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.firstName} {s.lastName}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="adm-btn adm-btn--primary"
                    onClick={onAssignDuty}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                >
                    <Plus size={16} /> Assign Clinical Duty
                </button>
            </div>

            {/* Assignments Table */}
            <div className="adm-table-wrap">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th style={{ width: '22%' }}>Staff Member</th>
                            <th style={{ width: '22%' }}>Resident / Patient</th>
                            <th style={{ width: '16%' }}>Duty Type</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>Priority</th>
                            <th style={{ width: '12%', textAlign: 'center' }}>Shift Start</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                            <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                                    Loading clinical duty assignments...
                                </td>
                            </tr>
                        ) : filteredAssignments.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                                    No clinical duty assignments matching filters.
                                </td>
                            </tr>
                        ) : (
                            filteredAssignments.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                            {row.staff?.firstName} {row.staff?.lastName}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {row.role || row.staff?.designation || 'Nurse Staff'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                            {row.patient?.name || 'General Facility'}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {row.location || 'General Ward'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                                            {row.dutyType?.replace(/_/g, ' ')}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{getPriorityBadge(row.priority)}</td>
                                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569' }}>
                                            <Calendar size={13} color="#94a3b8" />
                                            {row.startAt
                                                ? new Date(row.startAt).toLocaleDateString([], {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                  })
                                                : '-'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{getStatusBadge(row.status)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                            {/* Launch duty execution modal */}
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--secondary"
                                                style={{ padding: '4px 8px', fontSize: 11 }}
                                                onClick={() => onLaunchDutyWorkspace(row)}
                                                title="Open clinical care workspace (Vitals, Meds, ADL, Checklist)"
                                            >
                                                <Stethoscope size={13} /> Care
                                            </button>

                                            {/* Status transitions */}
                                            {['ASSIGNED', 'PENDING'].includes(row.status) && (
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--secondary"
                                                    style={{ padding: '4px 8px', fontSize: 11, color: '#059669' }}
                                                    onClick={() => handleStatusTransition(row.id, 'IN_PROGRESS')}
                                                    title="Start duty"
                                                >
                                                    <Play size={13} />
                                                </button>
                                            )}

                                            {row.status === 'IN_PROGRESS' && (
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--secondary"
                                                    style={{ padding: '4px 8px', fontSize: 11, color: '#d97706' }}
                                                    onClick={() => handleStatusTransition(row.id, 'ON_HOLD')}
                                                    title="Put duty on hold"
                                                >
                                                    <Pause size={13} />
                                                </button>
                                            )}

                                            {row.status === 'ON_HOLD' && (
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--secondary"
                                                    style={{ padding: '4px 8px', fontSize: 11, color: '#059669' }}
                                                    onClick={() => handleStatusTransition(row.id, 'IN_PROGRESS')}
                                                    title="Resume duty"
                                                >
                                                    <Play size={13} />
                                                </button>
                                            )}

                                            {row.status === 'WAITING_APPROVAL' && (
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--primary"
                                                    style={{ padding: '4px 8px', fontSize: 11 }}
                                                    onClick={() => onReviewApproval(row)}
                                                    title="Review checklist and approve"
                                                >
                                                    <CheckCircle2 size={13} /> Review
                                                </button>
                                            )}

                                            {!['COMPLETED', 'CANCELLED', 'APPROVED'].includes(row.status) && (
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--secondary"
                                                    style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626' }}
                                                    onClick={() => handleStatusTransition(row.id, 'CANCELLED')}
                                                    title="Cancel duty"
                                                >
                                                    <XCircle size={13} />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--secondary"
                                                style={{ padding: '4px 8px', fontSize: 11, color: '#64748b' }}
                                                onClick={() => handleDelete(row.id, row.refNo)}
                                                title="Delete assignment"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
