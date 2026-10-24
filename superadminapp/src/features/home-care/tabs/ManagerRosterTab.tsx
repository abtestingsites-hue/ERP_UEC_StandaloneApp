import { useState, useEffect, useMemo } from 'react';
import {
    Calendar,
    Users,
    Clock,
    CheckCircle2,
    RotateCw,
    Activity,
    AlertTriangle,
    ShieldCheck,
    Search,
    Eye
} from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { VisitTask, HomeCareAllocation } from '../homeCare.types';
import { VisitAuditModal } from '../components/VisitAuditModal';

interface ManagerRosterTabProps {
    activeUnitId?: string | null;
}

export function ManagerRosterTab({ activeUnitId }: ManagerRosterTabProps) {
    const [tasks, setTasks] = useState<VisitTask[]>([]);
    const [allocations, setAllocations] = useState<HomeCareAllocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Audit Modal
    const [selectedAuditVisit, setSelectedAuditVisit] = useState<VisitTask | null>(null);

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            homeCareService.getTasks({ homeCare: true }, activeUnitId),
            homeCareService.getAllocations(activeUnitId)
        ])
            .then(([taskList, allocList]) => {
                if (!isMounted) return;
                setTasks(taskList);
                setAllocations(allocList);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load roster:', err);
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, refreshTrigger]);

    // Handle supervisor verification
    const handleVerifyVisit = async (visitId: string, notes: string) => {
        await homeCareService.updateVisitStatus(visitId, {
            status: 'APPROVED',
            remarks: notes
        }, activeUnitId);
        handleRefresh();
    };

    // Handle supervisor exception / correction request
    const handleRequestCorrection = async (visitId: string, notes: string) => {
        await homeCareService.updateVisitStatus(visitId, {
            status: 'IN_PROGRESS',
            remarks: `[CORRECTION REQUESTED]: ${notes}`
        }, activeUnitId);
        handleRefresh();
    };

    // Metrics calculations
    const nowMs = Date.now();
    const isTaskOverdue = (t: VisitTask) => {
        const norm = String(t.status || '').toUpperCase();
        if (norm === 'COMPLETED' || norm === 'APPROVED') return false;
        if (!t.dueDate) return false;
        return new Date(t.dueDate).getTime() < nowMs;
    };

    const inProgressCount = tasks.filter((t) => String(t.status || '').toUpperCase() === 'IN_PROGRESS').length;
    const completedCount = tasks.filter((t) => String(t.status || '').toUpperCase() === 'COMPLETED').length;
    const approvedCount = tasks.filter((t) => String(t.status || '').toUpperCase() === 'APPROVED').length;
    const overdueCount = tasks.filter(isTaskOverdue).length;
    const totalAssigned = allocations.length;

    // Filtered list
    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            const normStatus = String(t.status || '').toUpperCase();
            const overdue = isTaskOverdue(t);

            if (statusFilter === 'OVERDUE' && !overdue) return false;
            if (statusFilter !== 'ALL' && statusFilter !== 'OVERDUE' && normStatus !== statusFilter) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const clientName = (t.enquiry?.patientName || t.enquiry?.clientName || '').toLowerCase();
                const caregiver = (t.assignedStaff?.fullName || t.assignedStaff?.user?.name || '').toLowerCase();
                const ref = (t.refNo || '').toLowerCase();
                const title = (t.title || '').toLowerCase();
                if (!clientName.includes(q) && !caregiver.includes(q) && !ref.includes(q) && !title.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [tasks, statusFilter, searchQuery, nowMs]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={18} color="#0f969c" />
                        Verification & Supervision Roster
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        Track scheduled visits, audit clinical records, flag exceptions, and verify service delivery according to policy.
                    </p>
                </div>
                <button type="button" className="adm-btn adm-btn--secondary" onClick={handleRefresh} title="Refresh">
                    <RotateCw size={14} /> Refresh Roster
                </button>
            </div>

            {/* Metric KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                <div className="adm-kpi-card">
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Active Duties</span>
                        <Users size={16} color="#0f969c" />
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#0f969c' }}>{totalAssigned}</div>
                </div>

                <div className="adm-kpi-card">
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">In Progress</span>
                        <Clock size={16} color="#f59e0b" />
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#f59e0b' }}>{inProgressCount}</div>
                </div>

                <div className="adm-kpi-card">
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Awaiting Verification</span>
                        <CheckCircle2 size={16} color="#2563eb" />
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#2563eb' }}>{completedCount}</div>
                </div>

                <div className="adm-kpi-card">
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Supervisor Verified</span>
                        <ShieldCheck size={16} color="#16a34a" />
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#16a34a' }}>{approvedCount}</div>
                </div>

                <div className="adm-kpi-card">
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Missed / Overdue SLA</span>
                        <AlertTriangle size={16} color="#ef4444" />
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: overdueCount > 0 ? '#ef4444' : '#64748b' }}>
                        {overdueCount}
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 240 }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search client, staff, ref..."
                            className="adm-form-input"
                            style={{ paddingLeft: 30, fontSize: 12 }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                        {[
                            { id: 'ALL', label: 'All Statuses' },
                            { id: 'OVERDUE', label: `Overdue (${overdueCount})` },
                            { id: 'IN_PROGRESS', label: 'In Progress' },
                            { id: 'COMPLETED', label: `Needs Review (${completedCount})` },
                            { id: 'APPROVED', label: 'Verified' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                type="button"
                                className={`adm-btn ${statusFilter === btn.id ? 'adm-btn--primary' : 'adm-btn--secondary'}`}
                                style={{ fontSize: 11, padding: '4px 10px' }}
                                onClick={() => setStatusFilter(btn.id)}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tasks & Visits Table */}
            {isLoading ? (
                <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                    <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Loading roster schedule...</p>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>No visit tasks match the selected criteria.</p>
                </div>
            ) : (
                <div className="adm-table-container">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Task / Ref</th>
                                <th>Client / Patient</th>
                                <th>Assigned Caregiver</th>
                                <th>Schedule & SLA</th>
                                <th>Delivery Status</th>
                                <th>Remarks & Exceptions</th>
                                <th>Supervisor Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map((t) => {
                                const parsedDescPatient = t.description?.match(/Patient:\s*([^\n\r]+)/i)?.[1]?.trim();
                                const parsedDescClient = t.description?.match(/Client:\s*([^\n\r]+)/i)?.[1]?.trim();
                                const patientName =
                                    t.enquiry?.admission?.patient?.name ||
                                    t.enquiry?.patientName ||
                                    parsedDescPatient ||
                                    t.enquiry?.client?.name ||
                                    t.enquiry?.clientName ||
                                    'Home Care Patient';
                                const clientName =
                                    t.enquiry?.client?.name ||
                                    t.enquiry?.clientName ||
                                    parsedDescClient ||
                                    patientName;
                                const caregiver = t.assignedStaff?.fullName || t.assignedStaff?.user?.name || 'Assigned Staff';
                                const normStatus = String(t.status || '').toUpperCase();
                                const isOverdue = isTaskOverdue(t);
                                const isApproved = normStatus === 'APPROVED';
                                const isCompleted = normStatus === 'COMPLETED';

                                return (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.title}</div>
                                            {t.refNo && <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{t.refNo}</span>}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{patientName}</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Client: {clientName}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.enquiry?.address || 'On file'}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#0f969c' }}>{caregiver}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 12 }}>
                                                {t.dueDate ? new Date(t.dueDate).toLocaleString() : 'Scheduled'}
                                            </div>
                                            {isOverdue && (
                                                <span
                                                    className="adm-badge adm-badge--error"
                                                    style={{ fontSize: 10, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <AlertTriangle size={10} /> SLA OVERDUE
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`adm-badge ${
                                                    isApproved
                                                        ? 'adm-badge--success'
                                                        : isCompleted
                                                        ? 'adm-badge--warning'
                                                        : normStatus === 'IN_PROGRESS'
                                                        ? 'adm-badge--info'
                                                        : 'adm-badge--secondary'
                                                }`}
                                            >
                                                {isApproved ? 'VERIFIED' : normStatus}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#475569', maxWidth: 200 }}>
                                            {t.remarks ? (
                                                <span title={t.remarks} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {t.remarks}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className={`adm-btn ${isCompleted ? 'adm-btn--primary' : 'adm-btn--secondary'}`}
                                                style={{ fontSize: 11, padding: '4px 10px' }}
                                                onClick={() => setSelectedAuditVisit(t)}
                                            >
                                                {isApproved ? (
                                                    <>
                                                        <ShieldCheck size={12} color="#16a34a" /> Audit Log
                                                    </>
                                                ) : isCompleted ? (
                                                    <>
                                                        <CheckCircle2 size={12} /> Verify & Review
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye size={12} /> Audit Visit
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Visit Audit & Verification Modal */}
            <VisitAuditModal
                isOpen={Boolean(selectedAuditVisit)}
                onClose={() => setSelectedAuditVisit(null)}
                visit={selectedAuditVisit}
                onVerify={handleVerifyVisit}
                onRequestCorrection={handleRequestCorrection}
            />
        </div>
    );
}
