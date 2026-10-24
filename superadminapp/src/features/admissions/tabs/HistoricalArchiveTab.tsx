import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Archive,
    Search,
    RefreshCw,
    AlertCircle,
    Eye,
    Bed,
    Clock,
    CheckCircle2,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { admissionsService } from '../admissions.service';
import type { AdmissionRecord } from '../admissions.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { AdmissionDetailsModal } from '../components/AdmissionDetailsModal';

interface HistoricalArchiveTabProps {
    onNavigateActiveRegister?: () => void;
}

export function HistoricalArchiveTab({ onNavigateActiveRegister }: HistoricalArchiveTabProps) {
    const { activeUnitId, activeUnitName } = useActiveUnit();

    const [dischargedRecords, setDischargedRecords] = useState<AdmissionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Inspection modal
    const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRecord | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchHistoricalRecords = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await admissionsService.listAdmissions({
                unitId: activeUnitId,
                allUnits: activeUnitId === null,
                status: 'DISCHARGED'
            });
            setDischargedRecords(data);
        } catch (err: unknown) {
            console.error('Failed to load historical discharge records:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load historical discharge archive';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchHistoricalRecords();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchHistoricalRecords]);

    const filteredRecords = useMemo(() => {
        if (!search.trim()) return dischargedRecords;
        const q = search.toLowerCase();
        return dischargedRecords.filter((rec) => {
            return (
                rec.patient?.name?.toLowerCase().includes(q) ||
                rec.patient?.elderId?.toLowerCase().includes(q) ||
                rec.patient?.phone?.includes(q) ||
                rec.id.toLowerCase().includes(q) ||
                rec.room?.toLowerCase().includes(q) ||
                rec.bed?.toLowerCase().includes(q) ||
                rec.serviceClosure?.closingRemarks?.toLowerCase().includes(q)
            );
        });
    }, [dischargedRecords, search]);

    const formatStayDuration = (admittedAt: string, dischargedAt?: string | null) => {
        if (!dischargedAt) return '-';
        const start = new Date(admittedAt).getTime();
        const end = new Date(dischargedAt).getTime();
        const diffMs = Math.max(0, end - start);
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
        if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
        return `${diffMins} mins`;
    };

    const handleInspect = (rec: AdmissionRecord) => {
        setSelectedAdmission(rec);
        setIsDetailsOpen(true);
    };

    return (
        <div className="adm-tab-container">
            {/* Top Toolbar / Subnav */}
            <div className="adm-subnav-bar">
                <div className="adm-subnav-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div 
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: 6, 
                                padding: '6px 12px', 
                                background: '#f1f5f9', 
                                borderRadius: 6, 
                                fontSize: '0.85rem', 
                                fontWeight: 600, 
                                color: '#1e293b' 
                            }}
                        >
                            <Archive size={15} style={{ color: '#475569' }} />
                            <span>Historical Discharges ({dischargedRecords.length})</span>
                        </div>
                        <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
                            Scoped to: <strong>{activeUnitName}</strong>
                        </span>
                    </div>
                </div>

                <div className="adm-subnav-actions">
                    <div className="adm-toolbar-search-wrap">
                        <Search size={15} className="adm-search-icon" />
                        <input
                            type="text"
                            className="adm-input adm-search-input"
                            placeholder="Search by resident name, elder ID, room, bed..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={fetchHistoricalRecords}
                        disabled={isLoading}
                        title="Reload archive records"
                    >
                        <RefreshCw size={14} className={isLoading ? 'adm-spin' : ''} />
                        <span>Refresh</span>
                    </button>

                    {onNavigateActiveRegister && (
                        <button
                            type="button"
                            className="adm-btn adm-btn--secondary"
                            onClick={onNavigateActiveRegister}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            <span>Active Inpatients</span>
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="adm-alert adm-alert--error" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    <div>
                        <strong>Failed to load historical discharge records</strong>
                        <p>{error}</p>
                    </div>
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={fetchHistoricalRecords}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Historical Table */}
            <div className="adm-table-wrapper">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Resident Details</th>
                            <th>Stay Allocation</th>
                            <th>Admission & Discharge</th>
                            <th>Length of Stay</th>
                            <th>Relieving Clearances</th>
                            <th>Final Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="adm-loading-state">
                                        <span className="adm-spinner" />
                                        <p>Loading historical discharge archive...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="adm-empty-state">
                                        <Archive size={36} className="adm-empty-icon" style={{ opacity: 0.6 }} />
                                        <h3>No Discharged Residents Found</h3>
                                        <p>
                                            {search
                                                ? `No historical discharge records match query "${search}".`
                                                : `No discharged resident records currently archived for ${activeUnitName}. Discharged records remain safely retrievable here once multi-department relieving is executed.`}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredRecords.map((rec) => {
                                const closure = rec.serviceClosure;
                                return (
                                    <tr key={rec.id} className="adm-table-row">
                                        {/* Resident Cell */}
                                        <td>
                                            <div className="adm-resident-cell">
                                                <span className="adm-resident-name">
                                                    {rec.patient?.name || 'Resident'}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                    {rec.patient?.elderId && (
                                                        <span 
                                                            style={{ 
                                                                fontSize: '11px', 
                                                                fontFamily: 'monospace', 
                                                                fontWeight: 600, 
                                                                color: '#2563eb',
                                                                background: '#eff6ff',
                                                                padding: '1px 5px',
                                                                borderRadius: 4
                                                            }}
                                                        >
                                                            {rec.patient.elderId}
                                                        </span>
                                                    )}
                                                    <span className="adm-resident-meta">
                                                        {rec.patient?.gender || '-'} · {rec.patient?.age ? `${rec.patient.age}y` : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Location / Stay */}
                                        <td>
                                            <div className="adm-location-cell">
                                                <span className="adm-location-badge">
                                                    <Bed size={13} />
                                                    <span>Room {rec.room || '-'} / {rec.bed || '-'}</span>
                                                </span>
                                                <span className="adm-location-floor">{rec.floor || 'Standard Floor'}</span>
                                            </div>
                                        </td>

                                        {/* Admission & Discharge Timestamps */}
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '12px' }}>
                                                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Calendar size={12} />
                                                    <span>Admitted: {new Date(rec.admittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </span>
                                                <span style={{ color: '#b91c1c', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Clock size={12} />
                                                    <span>
                                                        Discharged: {rec.dischargedAt ? new Date(rec.dischargedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                    </span>
                                                </span>
                                            </div>
                                        </td>

                                        {/* Length of Stay */}
                                        <td>
                                            <span 
                                                style={{ 
                                                    fontSize: '12px', 
                                                    fontWeight: 500, 
                                                    color: '#334155',
                                                    background: '#f8fafc',
                                                    padding: '3px 8px',
                                                    borderRadius: 4,
                                                    border: '1px solid #e2e8f0'
                                                }}
                                            >
                                                {formatStayDuration(rec.admittedAt, rec.dischargedAt)}
                                            </span>
                                        </td>

                                        {/* Relieving / Closure Clearances */}
                                        <td>
                                            {closure ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <div className="adm-clearance-badges-row">
                                                        <span className={`adm-pill ${closure.medicalCleared ? 'adm-pill--success' : 'adm-pill--pending'}`} title={closure.medicalCleared ? 'Medical Cleared' : 'Medical Pending'}>
                                                            Medical
                                                        </span>
                                                        <span className={`adm-pill ${closure.financeCleared ? 'adm-pill--success' : 'adm-pill--pending'}`} title={closure.financeCleared ? 'Finance Cleared' : 'Finance Pending'}>
                                                            Finance
                                                        </span>
                                                        <span className={`adm-pill ${closure.assetCleared ? 'adm-pill--success' : 'adm-pill--pending'}`} title={closure.assetCleared ? 'Asset Cleared' : 'Asset Pending'}>
                                                            Asset
                                                        </span>
                                                    </div>
                                                    {closure.closingRemarks && (
                                                        <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={closure.closingRemarks}>
                                                            "{closure.closingRemarks}"
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="adm-text-secondary" style={{ fontSize: '12px' }}>Standard Relieving</span>
                                            )}
                                        </td>

                                        {/* Final Status */}
                                        <td>
                                            <span 
                                                className="adm-badge adm-badge--neutral" 
                                                style={{ 
                                                    background: '#f1f5f9', 
                                                    color: '#475569', 
                                                    borderColor: '#cbd5e1',
                                                    fontWeight: 600,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4
                                                }}
                                            >
                                                <CheckCircle2 size={12} style={{ color: '#64748b' }} />
                                                <span>{rec.status}</span>
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--secondary"
                                                onClick={() => handleInspect(rec)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '5px 10px',
                                                    fontSize: '0.825rem'
                                                }}
                                                title="Inspect full admission & discharge record"
                                            >
                                                <Eye size={14} />
                                                <span>Inspect Record</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Record Inspection Modal */}
            {selectedAdmission && (
                <AdmissionDetailsModal
                    admission={selectedAdmission}
                    isOpen={isDetailsOpen}
                    onClose={() => {
                        setIsDetailsOpen(false);
                        setSelectedAdmission(null);
                    }}
                />
            )}
        </div>
    );
}

export default HistoricalArchiveTab;
