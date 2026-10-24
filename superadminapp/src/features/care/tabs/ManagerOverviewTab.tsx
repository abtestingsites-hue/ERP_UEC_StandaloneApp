import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    ClipboardList,
    Clock,
    AlertTriangle,
    ShieldCheck,
    CheckCircle2,
    Plus,
    HeartPulse
} from 'lucide-react';
import { careService } from '../care.service';
import type {
    MedicalDashboardSummary,
    MedicalAssignment,
    AttentionLog
} from '../care.types';

interface ManagerOverviewTabProps {
    activeUnitId?: string | null;
    onAssignDuty: () => void;
    onReviewDuty: (assignment: MedicalAssignment) => void;
    onViewApprovalQueue: () => void;
}

export function ManagerOverviewTab({
    activeUnitId,
    onAssignDuty,
    onReviewDuty,
    onViewApprovalQueue
}: ManagerOverviewTabProps) {
    const [summary, setSummary] = useState<MedicalDashboardSummary>({
        activeStaffCount: 0,
        totalAssignments: 0,
        inProgressCount: 0,
        waitingApprovalCount: 0,
        approvedCount: 0,
        criticalAlertsCount: 0
    });
    const [pendingDuties, setPendingDuties] = useState<MedicalAssignment[]>([]);
    const [attentionLogs, setAttentionLogs] = useState<AttentionLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [dash, assignments, logs] = await Promise.all([
                careService.getMedicalDashboard(activeUnitId),
                careService.getAssignments({ status: 'WAITING_APPROVAL', unitId: activeUnitId }),
                careService.getAttentionLogs(activeUnitId)
            ]);
            setSummary(dash);
            setPendingDuties(assignments);
            setAttentionLogs(logs.filter((l) => l.status === 'OPEN').slice(0, 6));
        } catch {
            // keep default
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

    const handleResolveAlert = async (id: string) => {
        try {
            await careService.resolveAttention(id, 'Resolved by Nursing Manager', activeUnitId);
            setAttentionLogs((prev) => prev.filter((l) => l.id !== id));
        } catch {
            alert('Failed to resolve alert.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPI Metrics Strip */}
            <div className="adm-metrics-strip">
                <div className="adm-metric-card">
                    <div className="adm-metric-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                        <Users size={20} />
                    </div>
                    <div className="adm-metric-content">
                        <span className="adm-metric-label">Active Staff</span>
                        <span className="adm-metric-value">{isLoading ? '-' : summary.activeStaffCount}</span>
                    </div>
                </div>

                <div className="adm-metric-card">
                    <div className="adm-metric-icon-wrap" style={{ background: '#dbeafe', color: '#2563eb' }}>
                        <ClipboardList size={20} />
                    </div>
                    <div className="adm-metric-content">
                        <span className="adm-metric-label">Total Assignments</span>
                        <span className="adm-metric-value">{isLoading ? '-' : summary.totalAssignments}</span>
                    </div>
                </div>

                <div className="adm-metric-card">
                    <div className="adm-metric-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                        <Clock size={20} />
                    </div>
                    <div className="adm-metric-content">
                        <span className="adm-metric-label">Pending Approval</span>
                        <span className="adm-metric-value" style={{ color: '#d97706' }}>
                            {isLoading ? '-' : pendingDuties.length || summary.waitingApprovalCount}
                        </span>
                    </div>
                </div>

                <div className="adm-metric-card">
                    <div className="adm-metric-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div className="adm-metric-content">
                        <span className="adm-metric-label">Open Alerts</span>
                        <span className="adm-metric-value" style={{ color: '#dc2626' }}>
                            {isLoading ? '-' : attentionLogs.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Actions Ribbon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    Nursing Operations Command Center
                </h3>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={onViewApprovalQueue}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <ShieldCheck size={16} /> Approval Queue ({pendingDuties.length})
                    </button>
                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={onAssignDuty}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <Plus size={16} /> Assign Clinical Duty
                    </button>
                </div>
            </div>

            {/* Split Grid: Pending Duty Approvals & Attention Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
                {/* Panel 1: Pending Approvals */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShieldCheck size={18} color="#0284c7" />
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                Duties Waiting for Manager Approval
                            </h4>
                        </div>
                        <span className="adm-badge adm-badge--warning">{pendingDuties.length} Pending</span>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '30px 0', textAlign: 'center', color: '#64748b' }}>Loading approval queue...</div>
                    ) : pendingDuties.length === 0 ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                            <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>All submitted nursing duties are reviewed!</p>
                            <p style={{ margin: '4px 0 0', fontSize: 12 }}>New completions submitted by nurse staff will appear here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {pendingDuties.map((duty) => (
                                <div
                                    key={duty.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 8,
                                        background: '#f8fafc'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>
                                            {duty.patient?.name || 'General Clinical Duty'}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                            Staff: {duty.staff?.firstName} {duty.staff?.lastName} ({duty.role || 'Nurse'}) · {duty.dutyType?.replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#0284c7', marginTop: 4, fontWeight: 600 }}>
                                            Checklist: {Object.values(duty.metadata?.dailyCareChecklist || {}).filter((v) => v === 'COMPLETED').length}/4 Items Completed
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="adm-btn adm-btn--primary"
                                        style={{ padding: '6px 12px', fontSize: 12 }}
                                        onClick={() => onReviewDuty(duty)}
                                    >
                                        Review & Approve
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Panel 2: Urgent Clinical Attention & Alerts */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={18} color="#dc2626" />
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                Resident Attention Alerts
                            </h4>
                        </div>
                        <span className="adm-badge adm-badge--danger">{attentionLogs.length} Active</span>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '30px 0', textAlign: 'center', color: '#64748b' }}>Loading clinical alerts...</div>
                    ) : attentionLogs.length === 0 ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                            <HeartPulse size={36} color="#059669" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>No open attention alerts</p>
                            <p style={{ margin: '4px 0 0', fontSize: 12 }}>All patient monitoring parameters are currently stable.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {attentionLogs.map((alertItem) => (
                                <div
                                    key={alertItem.id}
                                    style={{
                                        padding: '12px 14px',
                                        border: '1px solid #fee2e2',
                                        borderRadius: 8,
                                        background: '#fff5f5'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: '#991b1b' }}>
                                            {alertItem.patientName || 'Patient Alert'}
                                        </span>
                                        <span className={`adm-badge ${alertItem.severity === 'CRITICAL' ? 'adm-badge--danger' : 'adm-badge--warning'}`} style={{ fontSize: 10 }}>
                                            {alertItem.severity}
                                        </span>
                                    </div>
                                    <p style={{ margin: '6px 0', fontSize: 12, color: '#475569' }}>
                                        {alertItem.message}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                            {new Date(alertItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            style={{ padding: '2px 8px', fontSize: 11 }}
                                            onClick={() => handleResolveAlert(alertItem.id)}
                                        >
                                            Resolve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
