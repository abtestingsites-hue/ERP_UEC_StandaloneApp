import { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle,
    Plus,
    X
} from 'lucide-react';
import { careService } from '../care.service';
import type { IncidentReport, CarePatient } from '../care.types';

interface IncidentsTabProps {
    activeUnitId?: string | null;
    isManager?: boolean;
}

export function IncidentsTab({ activeUnitId, isManager = false }: IncidentsTabProps) {
    const [incidents, setIncidents] = useState<IncidentReport[]>([]);
    const [patients, setPatients] = useState<CarePatient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [patientId, setPatientId] = useState('');
    const [incidentType, setIncidentType] = useState('FALL_INCIDENT');
    const [severity, setSeverity] = useState('MEDIUM');
    const [description, setDescription] = useState('');
    const [actionTaken, setActionTaken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [incs, pts] = await Promise.all([
                careService.getIncidents(undefined, activeUnitId),
                isManager ? careService.getActivePatients(activeUnitId) : careService.getStaffAssignedPatients(activeUnitId)
            ]);
            setIncidents(incs);
            setPatients(pts);
            if (pts.length > 0) {
                setPatientId((prev) => {
                    const exists = pts.some((p) => p.id === prev);
                    return exists ? prev : pts[0].id;
                });
            }
        } catch {
            setIncidents([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, isManager]);

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

    const handleCreateIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        const pId = patientId || patients[0]?.id;
        if (!pId) {
            setFeedback({ type: 'error', message: 'Please select a resident for the incident report.' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        try {
            await careService.createIncident({
                patientId: pId,
                incidentType,
                title: incidentType.replace(/_/g, ' '),
                severity,
                description: description.trim(),
                actionTaken: actionTaken.trim() || undefined,
                date: new Date().toISOString(),
                unitId: activeUnitId
            });
            setIsFormOpen(false);
            setDescription('');
            setActionTaken('');
            setFeedback({ type: 'success', message: 'Clinical incident reported successfully.' });
            await loadData();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to report incident.';
            setFeedback({ type: 'error', message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {feedback && (
                <div
                    style={{
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                        border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}
                >
                    {feedback.message}
                </div>
            )}
            {/* Header bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#fee2e2', padding: 8, borderRadius: 8, color: '#dc2626' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                            Clinical Incident & Adverse Event Register
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                            Report and monitor clinical incidents, resident falls, and adverse events
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="adm-btn adm-btn--primary"
                    onClick={() => setIsFormOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', borderColor: '#dc2626' }}
                >
                    <Plus size={16} /> Report Clinical Incident
                </button>
            </div>

            {/* Modal: Report Incident */}
            {isFormOpen && (
                <div className="adm-modal-overlay" role="dialog" aria-modal="true">
                    <div className="adm-modal-container adm-modal-container--md">
                        <div className="adm-modal-header">
                            <div className="adm-modal-title-group">
                                <AlertTriangle className="adm-modal-icon" color="#dc2626" />
                                <div>
                                    <h2 className="adm-modal-title">Report Clinical Adverse Incident</h2>
                                    <p className="adm-modal-subtitle">Log event details, severity, and immediate corrective action</p>
                                </div>
                            </div>
                            <button type="button" className="adm-modal-close" onClick={() => setIsFormOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateIncident} className="adm-modal-body">
                            <div className="adm-form-grid" style={{ gap: 14 }}>
                                <div className="adm-form-group">
                                    <label className="adm-label">Resident Involved *</label>
                                    <select
                                        className="adm-select"
                                        value={patientId}
                                        onChange={(e) => setPatientId(e.target.value)}
                                        required
                                        disabled={!isManager && patients.length === 1}
                                    >
                                        {patients.length === 0 && <option value="">No resident assigned</option>}
                                        {patients.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.elderId ? `(${p.elderId})` : ''} {p.room ? `· Room ${p.room}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="adm-form-group">
                                    <label className="adm-label">Incident Type *</label>
                                    <select className="adm-select" value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                                        <option value="FALL_INCIDENT">Resident Fall / Slip</option>
                                        <option value="MEDICATION_ERROR">Medication Variance</option>
                                        <option value="BEHAVIORAL_EPISODE">Behavioral Aggression / Wandering</option>
                                        <option value="SKIN_TEAR_INJURY">Skin Tear / Physical Injury</option>
                                        <option value="VITAL_ABNORMALITY">Severe Vital Abnormality</option>
                                        <option value="EQUIPMENT_FAILURE">Medical Device Issue</option>
                                    </select>
                                </div>

                                <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="adm-label">Severity Level</label>
                                    <select className="adm-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                                        <option value="LOW">Low (No harm or intervention)</option>
                                        <option value="MEDIUM">Medium (Minor treatment administered)</option>
                                        <option value="HIGH">High (Medical officer attention required)</option>
                                        <option value="CRITICAL">Critical (Hospitalization / Acute Emergency)</option>
                                    </select>
                                </div>

                                <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="adm-label">Incident Description *</label>
                                    <textarea
                                        className="adm-input"
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Detailed description of what occurred, time, environmental conditions..."
                                        required
                                    />
                                </div>

                                <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="adm-label">Immediate Clinical Action Taken</label>
                                    <textarea
                                        className="adm-input"
                                        rows={2}
                                        value={actionTaken}
                                        onChange={(e) => setActionTaken(e.target.value)}
                                        placeholder="Vitals checked, first aid rendered, doctor notified..."
                                    />
                                </div>
                            </div>

                            <div className="adm-modal-footer">
                                <button type="button" className="adm-btn adm-btn--secondary" onClick={() => setIsFormOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Incident Records Table */}
            <div className="adm-table-wrap">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Incident Type</th>
                            <th>Resident</th>
                            <th>Severity</th>
                            <th>Description & Action Taken</th>
                            <th>Status</th>
                            <th>Reported At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                                    Loading incident register...
                                </td>
                            </tr>
                        ) : incidents.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                                    No adverse clinical incidents reported for this operating unit.
                                </td>
                            </tr>
                        ) : (
                            incidents.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                            {(row.title || row.incidentType || 'Clinical Incident').replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 500 }}>{row.patientName || 'Facility'}</span>
                                    </td>
                                    <td>
                                        <span className={`adm-badge ${
                                            row.severity === 'CRITICAL'
                                                ? 'adm-badge--danger'
                                                : row.severity === 'HIGH'
                                                ? 'adm-badge--warning'
                                                : 'adm-badge--primary'
                                        }`}>
                                            {row.severity}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13, color: '#1e293b' }}>{row.description}</div>
                                        {row.actionTaken && (
                                            <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                                                <strong>Action:</strong> {row.actionTaken}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`adm-badge ${row.status === 'RESOLVED' || row.status === 'CLOSED' ? 'adm-badge--success' : 'adm-badge--warning'}`}>
                                            {row.status || 'OPEN'}
                                        </span>
                                    </td>
                                    <td>
                                        {(row.date || row.reportedAt || (row as unknown as { createdAt?: string }).createdAt)
                                            ? new Date((row.date || row.reportedAt || (row as unknown as { createdAt?: string }).createdAt)!).toLocaleDateString([], {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                              })
                                            : '-'}
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
