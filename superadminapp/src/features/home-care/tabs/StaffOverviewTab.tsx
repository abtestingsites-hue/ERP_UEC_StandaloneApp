import { useState, useEffect } from 'react';
import { Home, Clock, CheckCircle2, HeartPulse, RotateCw, Activity } from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { VisitTask, HomeCareAllocation } from '../homeCare.types';

interface StaffOverviewTabProps {
    onNavigateTab: (tabId: string) => void;
    activeUnitId?: string | null;
}

export function StaffOverviewTab({ onNavigateTab, activeUnitId }: StaffOverviewTabProps) {
    const [tasks, setTasks] = useState<VisitTask[]>([]);
    const [allocations, setAllocations] = useState<HomeCareAllocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            homeCareService.getMyVisits(activeUnitId),
            homeCareService.getAllocations(activeUnitId)
        ])
            .then(([myTasks, allocList]) => {
                if (!isMounted) return;
                setTasks(myTasks);
                setAllocations(allocList);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load caregiver staff overview:', err);
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, refreshTrigger]);

    const activeVisits = tasks.filter((t) => ['ASSIGNED', 'PENDING', 'IN_PROGRESS'].includes(String(t.status || '').toUpperCase()));
    const completedVisits = tasks.filter((t) => String(t.status || '').toUpperCase() === 'COMPLETED');

    if (isLoading) {
        return (
            <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#64748b', fontSize: 13 }}>Loading caregiver dashboard...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPI Ribbon */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div className="adm-kpi-card">
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Active Home Care Clients</span>
                        <div className="adm-kpi-card__icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                            <Home size={18} />
                        </div>
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#059669' }}>
                        {allocations.length}
                    </div>
                    <div className="adm-kpi-card__meta">Clients receiving home care services</div>
                </div>

                <div className="adm-kpi-card">
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Assigned Visit Tasks</span>
                        <div className="adm-kpi-card__icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <Clock size={18} />
                        </div>
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#2563eb' }}>
                        {activeVisits.length}
                    </div>
                    <div className="adm-kpi-card__meta">Pending and in-progress duties</div>
                </div>

                <div className="adm-kpi-card">
                    <div className="adm-kpi-card__header">
                        <span className="adm-kpi-card__label">Completed Visits</span>
                        <div className="adm-kpi-card__icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="adm-kpi-card__value" style={{ color: '#16a34a' }}>
                        {completedVisits.length}
                    </div>
                    <div className="adm-kpi-card__meta">Concluded with caregiver remarks</div>
                </div>
            </div>

            {/* Caregiver Actions Banner */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    padding: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                }}
            >
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                        Caregiver Shift & Visit Duties
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        Check-in at patient homes, record clinical vitals, log daily care notes, and complete visits.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="adm-btn adm-btn--primary" onClick={() => onNavigateTab('my-visits')}>
                        <Clock size={14} /> My Scheduled Visits
                    </button>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={() => onNavigateTab('care-delivery')}>
                        <HeartPulse size={14} color="#e11d48" /> Log Vitals & Notes
                    </button>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={handleRefresh} title="Refresh">
                        <RotateCw size={14} />
                    </button>
                </div>
            </div>

            {/* Recent Duty Cards */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    Active Duty Schedule
                </h4>

                {tasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: 8, color: '#64748b' }}>
                        <Clock size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 600 }}>No scheduled visits found</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            Visits assigned to your care schedule will appear here.
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        {tasks.slice(0, 4).map((t) => {
                            let rawMeta: Record<string, unknown> | null = null;
                            try {
                                const enquiryObj = t.enquiry as unknown as { rawMessage?: unknown; client?: { name?: string } };
                                if (typeof enquiryObj?.rawMessage === 'string') {
                                    rawMeta = JSON.parse(enquiryObj.rawMessage);
                                } else if (enquiryObj?.rawMessage && typeof enquiryObj.rawMessage === 'object') {
                                    rawMeta = enquiryObj.rawMessage as Record<string, unknown>;
                                }
                            } catch {
                                rawMeta = null;
                            }

                            const enquiryAny = t.enquiry as unknown as { client?: { name?: string }; admission?: { patient?: { name?: string } } };
                            const clientName = enquiryAny?.client?.name || t.enquiry?.clientName || 'Client';
                            const patientName =
                                enquiryAny?.admission?.patient?.name ||
                                (rawMeta?.patientName as string) ||
                                t.enquiry?.patientName ||
                                clientName;
                            const normStatus = String(t.status || '').toUpperCase();

                            return (
                                <div
                                    key={t.id}
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 10,
                                        padding: 14,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#0f969c' }}>
                                                {t.refNo || t.id.slice(0, 8)}
                                            </span>
                                            <span
                                                className={`adm-badge ${
                                                    normStatus === 'COMPLETED'
                                                        ? 'adm-badge--success'
                                                        : normStatus === 'IN_PROGRESS'
                                                        ? 'adm-badge--warning'
                                                        : 'adm-badge--secondary'
                                                }`}
                                            >
                                                {normStatus}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{t.title}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                            Patient: <strong style={{ color: '#0f172a' }}>{patientName}</strong> {clientName && clientName !== patientName ? `(Client: ${clientName})` : ''}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, color: '#64748b' }}>
                                            {t.dueDate ? new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                                        </span>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            style={{ fontSize: 11, padding: '3px 8px' }}
                                            onClick={() => onNavigateTab('my-visits')}
                                        >
                                            Open Visits
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
