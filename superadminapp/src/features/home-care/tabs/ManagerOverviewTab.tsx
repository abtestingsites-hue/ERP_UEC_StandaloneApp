import { useState, useEffect } from 'react';
import {
    Users,
    Activity,
    UserPlus,
    CheckCircle2,
    Clock,
    FileSignature,
    UserCheck,
    Calendar,
    AlertCircle,
    RotateCw,
    Receipt,
    ShieldCheck,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type {
    HomeCareAllocation,
    VisitTask,
    CaregiverStaff,
    HomeCareAdmission,
    FinanceInvoiceItem
} from '../homeCare.types';

interface ManagerOverviewTabProps {
    onOpenNewEnquiry: () => void;
    onOpenNewContract: () => void;
    onOpenNewAllocation: () => void;
    onNavigateTab: (tabId: string) => void;
    activeUnitId?: string | null;
}

export function ManagerOverviewTab({
    onOpenNewEnquiry,
    onOpenNewContract,
    onOpenNewAllocation,
    onNavigateTab,
    activeUnitId
}: ManagerOverviewTabProps) {
    const [allocations, setAllocations] = useState<HomeCareAllocation[]>([]);
    const [staffList, setStaffList] = useState<CaregiverStaff[]>([]);
    const [todayTasks, setTodayTasks] = useState<VisitTask[]>([]);
    const [admissions, setAdmissions] = useState<HomeCareAdmission[]>([]);
    const [invoices, setInvoices] = useState<FinanceInvoiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            homeCareService.getAllocations(activeUnitId),
            homeCareService.getCaregiverStaff(activeUnitId),
            homeCareService.getTasks({ homeCare: true, today: true }, activeUnitId),
            homeCareService.getAdmissions(activeUnitId),
            homeCareService.getInvoices(activeUnitId)
        ])
            .then(([allocs, staff, tasks, adms, invs]) => {
                if (!isMounted) return;
                setAllocations(allocs);
                setStaffList(staff);
                setTodayTasks(tasks);
                setAdmissions(adms);
                setInvoices(invs);
                setError(null);
                setIsLoading(false);
            })
            .catch((err: unknown) => {
                if (!isMounted) return;
                const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load Home Care overview.';
                setError(msg);
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, refreshTrigger]);

    const activeAllocations = allocations.filter((a) => a.status === 'ALLOCATED' || a.status === 'ACTIVE');
    const allocatedStaffCount = new Set(activeAllocations.map((a) => a.staffId).filter(Boolean)).size;

    const scheduledVisitsCount = todayTasks.length;
    const inProgressVisitsCount = todayTasks.filter((t) => String(t.status || '').toUpperCase() === 'IN_PROGRESS').length;
    const completedVisitsCount = todayTasks.filter((t) => String(t.status || '').toUpperCase() === 'COMPLETED').length;
    const verifiedVisitsCount = todayTasks.filter((t) => String(t.status || '').toUpperCase() === 'APPROVED').length;

    // Overdue / SLA check
    const nowMs = Date.now();
    const overdueVisitsCount = todayTasks.filter((t) => {
        const norm = String(t.status || '').toUpperCase();
        if (norm === 'COMPLETED' || norm === 'APPROVED') return false;
        return t.dueDate && new Date(t.dueDate).getTime() < nowMs;
    }).length;

    // Financial KPIs
    const totalBilledRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

    if (isLoading) {
        return (
            <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                <Activity className="adm-spin" size={28} color="#0f969c" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Loading Home Care operations metrics...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {error && (
                <div className="adm-alert adm-alert--error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Operational & Financial KPI Ribbon */}
            <div className="adm-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
                <div className="adm-kpi-card" onClick={() => onNavigateTab('allocations')} style={{ cursor: 'pointer' }}>
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Active Client Allocations</span>
                        <div className="adm-kpi-card__icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                            <Users size={18} />
                        </div>
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#059669' }}>
                        {activeAllocations.length}
                    </div>
                    <div className="adm-kpi-card__meta">Caregivers deployed: {allocatedStaffCount}</div>
                </div>

                <div className="adm-kpi-card" onClick={() => onNavigateTab('contracts')} style={{ cursor: 'pointer' }}>
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Active Service Contracts</span>
                        <div className="adm-kpi-card__icon" style={{ background: '#f0fdfa', color: '#0f969c' }}>
                            <FileSignature size={18} />
                        </div>
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#0f969c' }}>
                        {admissions.length}
                    </div>
                    <div className="adm-kpi-card__meta">Agreed rate packages active</div>
                </div>

                <div className="adm-kpi-card" onClick={() => onNavigateTab('roster')} style={{ cursor: 'pointer' }}>
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Today's Visits Scheduled</span>
                        <div className="adm-kpi-card__header-right">
                            <Clock size={16} color="#2563eb" />
                        </div>
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#2563eb' }}>
                        {scheduledVisitsCount}
                    </div>
                    <div className="adm-kpi-card__meta">
                        {inProgressVisitsCount} in-progress · {completedVisitsCount} awaiting review
                    </div>
                </div>

                <div className="adm-kpi-card" onClick={() => onNavigateTab('roster')} style={{ cursor: 'pointer' }}>
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Supervisor Verified</span>
                        <div className="adm-kpi-card__icon" style={{ background: '#ecfdf5', color: '#16a34a' }}>
                            <ShieldCheck size={18} />
                        </div>
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#16a34a' }}>
                        {verifiedVisitsCount}
                    </div>
                    <div className="adm-kpi-card__meta">
                        Approved according to policy
                    </div>
                </div>

                <div className="adm-kpi-card" onClick={() => onNavigateTab('roster')} style={{ cursor: 'pointer' }}>
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">SLA Overdue Visits</span>
                        <div className="adm-kpi-card__icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                            <AlertTriangle size={18} />
                        </div>
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: overdueVisitsCount > 0 ? '#dc2626' : '#64748b' }}>
                        {overdueVisitsCount}
                    </div>
                    <div className="adm-kpi-card__meta">
                        {overdueVisitsCount > 0 ? 'Urgent attention required' : 'Zero SLA breaches'}
                    </div>
                </div>

                <div className="adm-kpi-card" onClick={() => onNavigateTab('contracts')} style={{ cursor: 'pointer' }}>
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Finance Billed Invoices</span>
                        <div className="adm-kpi-card__icon" style={{ background: '#f8fafc', color: '#2563eb' }}>
                            <Receipt size={18} />
                        </div>
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#0f172a' }}>
                        ₹{totalBilledRevenue.toLocaleString()}
                    </div>
                    <div className="adm-kpi-card__meta">
                        {invoices.length} invoices handed off to Finance
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Home Care Operations Shortcuts</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Quick workflows for intake, contract generation, and caregiver allocation.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onOpenNewEnquiry}>
                        <UserPlus size={14} /> New Client Intake
                    </button>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onOpenNewContract}>
                        <FileSignature size={14} /> Generate Contract
                    </button>
                    <button type="button" className="adm-btn adm-btn--primary" onClick={onOpenNewAllocation}>
                        <UserCheck size={14} /> Allocate Staff
                    </button>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={handleRefresh} title="Refresh Data">
                        <RotateCw size={14} />
                    </button>
                </div>
            </div>

            {/* Section: Today's Operational Visit Task Execution */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={18} color="#0f969c" />
                            Today's Operational Visit Execution
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                            Real-time monitoring of scheduled home visits, caregiver check-ins, and completions.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        style={{ fontSize: 12, padding: '4px 10px' }}
                        onClick={() => onNavigateTab('roster')}
                    >
                        <Calendar size={13} /> View Full Roster
                    </button>
                </div>

                {todayTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: 8, color: '#64748b' }}>
                        <Clock size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 600, fontSize: 14 }}>No visits scheduled for today</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            Allocated staff duties will populate here automatically.
                        </div>
                    </div>
                ) : (
                    <div className="adm-table-container">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Ref / Title</th>
                                    <th>Client / Patient</th>
                                    <th>Assigned Caregiver</th>
                                    <th>Scheduled Time</th>
                                    <th>Status</th>
                                    <th>Completed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayTasks.map((t) => {
                                    const clientName = t.enquiry?.patientName || t.enquiry?.clientName || 'Client';
                                    const caregiver = t.assignedStaff?.fullName || t.assignedStaff?.user?.name || 'Assigned Staff';
                                    const normStatus = String(t.status || '').toUpperCase();

                                    return (
                                        <tr key={t.id}>
                                            <td>
                                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.title}</div>
                                                {t.refNo && <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{t.refNo}</span>}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{clientName}</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>{t.enquiry?.address || 'On file'}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#0f969c' }}>{caregiver}</div>
                                            </td>
                                            <td>
                                                {t.dueDate ? new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                                            </td>
                                            <td>
                                                <span
                                                    className={`adm-badge ${
                                                        normStatus === 'APPROVED'
                                                            ? 'adm-badge--success'
                                                            : normStatus === 'COMPLETED'
                                                            ? 'adm-badge--info'
                                                            : normStatus === 'IN_PROGRESS'
                                                            ? 'adm-badge--warning'
                                                            : 'adm-badge--secondary'
                                                    }`}
                                                >
                                                    {normStatus === 'APPROVED' ? 'VERIFIED' : normStatus}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>
                                                {t.completedAt ? new Date(t.completedAt).toLocaleTimeString() : '—'}
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
