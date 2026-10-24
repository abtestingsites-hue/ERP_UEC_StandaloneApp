import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    HeartPulse,
    AlertTriangle,
    CheckCircle2,
    X,
    Camera
} from 'lucide-react';
import { careService } from '../care.service';
import type {
    MonitoringStatusItem,
    AttentionLog,
    VitalRecord
} from '../care.types';

interface MonitoringAlertsTabProps {
    activeUnitId?: string | null;
}

export function MonitoringAlertsTab({ activeUnitId }: MonitoringAlertsTabProps) {
    const [monitoringList, setMonitoringList] = useState<MonitoringStatusItem[]>([]);
    const [attentionLogs, setAttentionLogs] = useState<AttentionLog[]>([]);
    const [recentVitals, setRecentVitals] = useState<VitalRecord[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [monRes, logsRes, vtsRes] = await Promise.allSettled([
                careService.getAllMonitoringStatus(activeUnitId),
                careService.getAttentionLogs(activeUnitId),
                careService.getVitals(undefined, activeUnitId)
            ]);
            if (monRes.status === 'fulfilled') setMonitoringList(monRes.value);
            if (logsRes.status === 'fulfilled') setAttentionLogs(logsRes.value);
            if (vtsRes.status === 'fulfilled') setRecentVitals(vtsRes.value.slice(0, 15));
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
            setAttentionLogs((prev) =>
                prev.map((l) => (l.id === id ? { ...l, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : l))
            );
        } catch {
            alert('Failed to resolve alert.');
        }
    };

    const handleVerifyVital = async (id: string) => {
        try {
            await careService.verifyVital(id, 'Clinically verified by manager', activeUnitId);
            setRecentVitals((prev) =>
                prev.map((v) => (v.id === id ? { ...v, isVerified: true } : v))
            );
        } catch {
            alert('Failed to verify vital record.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Split: Patient Monitoring Matrix & Urgent Attention Feed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
                {/* Panel 1: Monitoring Status Matrix */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Activity size={18} color="#0284c7" />
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                Facility Resident Monitoring Matrix
                            </h4>
                        </div>
                        <span className="adm-badge adm-badge--primary">{monitoringList.length} Residents</span>
                    </div>

                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Resident</th>
                                    <th>Monitoring Status</th>
                                    <th>Open Alerts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                                            Loading monitoring matrix...
                                        </td>
                                    </tr>
                                ) : monitoringList.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                                            No resident monitoring records found for this unit.
                                        </td>
                                    </tr>
                                ) : (
                                    monitoringList.map((item) => (
                                        <tr key={item.patientId}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{item.patientName}</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                                    {item.elderId || 'Inpatient'}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`adm-badge ${
                                                        item.monitoringStatus === 'CRITICAL'
                                                            ? 'adm-badge--danger'
                                                            : item.monitoringStatus === 'NEEDS_ATTENTION'
                                                            ? 'adm-badge--warning'
                                                            : 'adm-badge--success'
                                                    }`}
                                                >
                                                    {item.monitoringStatus}
                                                </span>
                                            </td>
                                            <td>
                                                {item.openAttentionCount > 0 ? (
                                                    <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 13 }}>
                                                        {item.openAttentionCount} Alerts
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#059669', fontSize: 12 }}>None</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Panel 2: Clinical Attention Alerts */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={18} color="#dc2626" />
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                Attention Logs & Exceptions
                            </h4>
                        </div>
                        <span className="adm-badge adm-badge--danger">
                            {attentionLogs.filter((a) => a.status === 'OPEN').length} Open
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
                        {isLoading ? (
                            <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading alerts...</div>
                        ) : attentionLogs.length === 0 ? (
                            <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No clinical alerts found.</div>
                        ) : (
                            attentionLogs.map((log) => {
                                const isOpen = log.status === 'OPEN';
                                return (
                                    <div
                                        key={log.id}
                                        style={{
                                            padding: 12,
                                            border: `1px solid ${isOpen ? '#fee2e2' : '#e2e8f0'}`,
                                            borderRadius: 8,
                                            background: isOpen ? '#fff5f5' : '#f8fafc'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 700, fontSize: 13, color: isOpen ? '#991b1b' : '#475569' }}>
                                                {log.patientName || 'Clinical Alert'}
                                            </span>
                                            <span className={`adm-badge ${isOpen ? 'adm-badge--danger' : 'adm-badge--neutral'}`} style={{ fontSize: 10 }}>
                                                {log.severity} · {log.status}
                                            </span>
                                        </div>
                                        <p style={{ margin: '6px 0', fontSize: 12, color: '#334155' }}>{log.message}</p>
                                        {isOpen && (
                                            <div style={{ textAlign: 'right', marginTop: 6 }}>
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--secondary"
                                                    style={{ padding: '2px 8px', fontSize: 11 }}
                                                    onClick={() => handleResolveAlert(log.id)}
                                                >
                                                    Resolve Alert
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Vitals Recording & Verification Registry */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HeartPulse size={18} color="#e11d48" />
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                            Recent Patient Vital Signs Log & Verification
                        </h4>
                    </div>
                </div>

                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Resident</th>
                                <th>BP (Systolic / Diastolic)</th>
                                <th>Pulse</th>
                                <th>Temp (°F)</th>
                                <th>SpO2 (%)</th>
                                <th>Blood Sugar</th>
                                <th>Photo</th>
                                <th>Logged At</th>
                                <th>Verification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                                        Loading vitals...
                                    </td>
                                </tr>
                            ) : recentVitals.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                                        No recent vital records found.
                                    </td>
                                </tr>
                            ) : (
                                recentVitals.map((v) => (
                                    <tr key={v.id}>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>{v.patient?.name || v.patientId}</span>
                                        </td>
                                        <td>
                                            {v.systolic && v.diastolic ? `${v.systolic} / ${v.diastolic} mmHg` : (v.bp ? `${v.bp} mmHg` : '-')}
                                        </td>
                                        <td>{v.pulse ? `${v.pulse} bpm` : '-'}</td>
                                        <td>{(v.temperature ?? v.temp) ? `${v.temperature ?? v.temp} °F` : '-'}</td>
                                        <td>{(v.spo2 ?? v.spO2) ? `${v.spo2 ?? v.spO2} %` : '-'}</td>
                                        <td>
                                            {v.bloodSugar ? `${v.bloodSugar} mg/dL ${v.isFasting ? '(F)' : ''}` : '-'}
                                        </td>
                                        <td>
                                            {v.photoUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPhoto(v.photoUrl!)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                                                    title="Click to view live vital photo"
                                                >
                                                    <img
                                                        src={v.photoUrl}
                                                        alt="Vital"
                                                        style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }}
                                                    />
                                                </button>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: 11 }}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {new Date(v.recordedAt || v.createdAt || Date.now()).toLocaleTimeString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td>
                                            {v.isVerified ? (
                                                <span style={{ color: '#059669', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <CheckCircle2 size={13} /> Verified
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--secondary"
                                                    style={{ padding: '2px 8px', fontSize: 11 }}
                                                    onClick={() => handleVerifyVital(v.id)}
                                                >
                                                    Verify
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Photo Preview Modal */}
            {selectedPhoto && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 16
                    }}
                >
                    <div style={{ background: '#ffffff', borderRadius: 12, overflow: 'hidden', maxWidth: 540, width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Camera size={16} color="#0284c7" />
                                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Live Vital Observation Photo</h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPhoto(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: 16, display: 'flex', justifyContent: 'center', background: '#0f172a' }}>
                            <img
                                src={selectedPhoto}
                                alt="Vital observation full"
                                style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 6, objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
