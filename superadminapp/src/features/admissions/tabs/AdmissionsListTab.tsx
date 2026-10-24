import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users,
    Search,
    Filter,
    Plus,
    RefreshCw,
    AlertCircle,
    Eye,
    FileText,
    Bed,
    Activity,
    ShieldAlert,
    Archive
} from 'lucide-react';
import { admissionsService } from '../admissions.service';
import type { AdmissionRecord } from '../admissions.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { AdmissionDetailsModal } from '../components/AdmissionDetailsModal';
import { ClosureAgreementModal } from '../components/ClosureAgreementModal';

interface AdmissionsListTabProps {
    onNavigateNewAdmission: () => void;
    onNavigateArchive?: () => void;
}

export function AdmissionsListTab({ onNavigateNewAdmission, onNavigateArchive }: AdmissionsListTabProps) {
    const { activeUnitId, activeUnitName } = useActiveUnit();

    const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('ALL');

    // Modals
    const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRecord | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [closureTarget, setClosureTarget] = useState<AdmissionRecord | null>(null);
    const [isClosureOpen, setIsClosureOpen] = useState(false);

    const fetchAdmissions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await admissionsService.listAdmissions({
                unitId: activeUnitId,
                allUnits: activeUnitId === null
            });
            setAdmissions(data);
        } catch (err: unknown) {
            console.error('Failed to load admissions:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load admissions';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchAdmissions();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchAdmissions]);

    const filteredAdmissions = useMemo(() => {
        return admissions.filter((adm) => {
            const matchesSearch = !search ||
                adm.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
                adm.patient?.phone?.includes(search) ||
                adm.bed?.toLowerCase().includes(search.toLowerCase()) ||
                adm.room?.toLowerCase().includes(search.toLowerCase());

            const matchesPriority = priorityFilter === 'ALL' || adm.admissionPriority === priorityFilter;
            return matchesSearch && matchesPriority;
        });
    }, [admissions, search, priorityFilter]);

    // Metric Calculations
    const metrics = useMemo(() => {
        const total = admissions.length;
        const criticalOrHigh = admissions.filter(a => a.admissionPriority === 'CRITICAL' || a.admissionPriority === 'HIGH').length;
        const stable = admissions.filter(a => !a.admissionPriority || a.admissionPriority === 'NORMAL' || a.healthCondition === 'STABLE').length;
        return { total, criticalOrHigh, stable };
    }, [admissions]);

    const handleInspect = (adm: AdmissionRecord) => {
        setSelectedAdmission(adm);
        setIsDetailsOpen(true);
    };

    const handleStartClosure = (adm: AdmissionRecord) => {
        setClosureTarget(adm);
        setIsClosureOpen(true);
    };

    return (
        <div className="adm-tab-container">
            {/* KPI Metrics Strip */}
            <div className="adm-metrics-grid">
                <div className="adm-kpi-card">
                    <div className="adm-kpi-icon adm-kpi-icon--blue">
                        <Users size={18} />
                    </div>
                    <div className="adm-kpi-content">
                        <span className="adm-kpi-label">Active Inpatients</span>
                        <div className="adm-kpi-value">{metrics.total}</div>
                        <span className="adm-kpi-hint">Admitted in {activeUnitName}</span>
                    </div>
                </div>

                <div className="adm-kpi-card">
                    <div className="adm-kpi-icon adm-kpi-icon--emerald">
                        <Activity size={18} />
                    </div>
                    <div className="adm-kpi-content">
                        <span className="adm-kpi-label">Stable Condition</span>
                        <div className="adm-kpi-value">{metrics.stable}</div>
                        <span className="adm-kpi-hint">Routine care protocol</span>
                    </div>
                </div>

                <div className="adm-kpi-card">
                    <div className="adm-kpi-icon adm-kpi-icon--amber">
                        <ShieldAlert size={18} />
                    </div>
                    <div className="adm-kpi-content">
                        <span className="adm-kpi-label">High / Critical Priority</span>
                        <div className="adm-kpi-value">{metrics.criticalOrHigh}</div>
                        <span className="adm-kpi-hint">Clinical observation flag</span>
                    </div>
                </div>

                <div className="adm-kpi-card">
                    <div className="adm-kpi-icon adm-kpi-icon--purple">
                        <Bed size={18} />
                    </div>
                    <div className="adm-kpi-content">
                        <span className="adm-kpi-label">Allocated Beds</span>
                        <div className="adm-kpi-value">{metrics.total}</div>
                        <span className="adm-kpi-hint">Current room assignments</span>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="adm-alert adm-alert--error" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    <div>
                        <strong>Failed to load admission records</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Actions & Filters Bar */}
            <div className="adm-toolbar">
                <div className="adm-toolbar-search-wrap">
                    <Search size={15} className="adm-search-icon" />
                    <input
                        type="text"
                        className="adm-input adm-search-input"
                        placeholder="Search resident name, phone, room, bed..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="adm-toolbar-filter-wrap">
                    <Filter size={14} className="adm-filter-icon" />
                    <select
                        className="adm-select adm-filter-select"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        aria-label="Filter by priority"
                    >
                        <option value="ALL">All Priorities</option>
                        <option value="NORMAL">Normal Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="CRITICAL">Critical Priority</option>
                    </select>
                </div>

                <div className="adm-toolbar-actions">
                    {onNavigateArchive && (
                        <button
                            type="button"
                            className="adm-btn adm-btn--secondary"
                            onClick={onNavigateArchive}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            title="View discharged and historical admissions"
                        >
                            <Archive size={14} />
                            <span>Discharge Archive</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={fetchAdmissions}
                        disabled={isLoading}
                        title="Refresh admission register"
                    >
                        <RefreshCw size={14} className={isLoading ? 'adm-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={onNavigateNewAdmission}
                    >
                        <Plus size={15} />
                        <span>New Admission</span>
                    </button>
                </div>
            </div>

            {/* Admissions Table */}
            <div className="adm-table-wrapper">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Resident Name</th>
                            <th>Stay Location</th>
                            <th>Priority & Condition</th>
                            <th>Clinical Mobility</th>
                            <th>Admission Date</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="adm-loading-state">
                                        <span className="adm-spinner" />
                                        <p>Loading active admission records...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredAdmissions.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="adm-empty-state">
                                        <Users size={32} className="adm-empty-icon" />
                                        <h3>No Active Admissions Found</h3>
                                        <p>
                                            {search || priorityFilter !== 'ALL'
                                                ? 'No admission records match your filter criteria.'
                                                : `There are currently no active resident admissions in ${activeUnitName}.`}
                                        </p>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--primary"
                                            onClick={onNavigateNewAdmission}
                                            style={{ marginTop: 12 }}
                                        >
                                            <Plus size={14} />
                                            <span>Admit First Resident</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredAdmissions.map((adm) => (
                                <tr key={adm.id} className="adm-table-row">
                                    <td>
                                        <div className="adm-resident-cell">
                                            <span className="adm-resident-name">{adm.patient?.name || 'Unknown Patient'}</span>
                                            <span className="adm-resident-meta">
                                                {adm.patient?.phone || 'No phone'} · {adm.patient?.age ? `${adm.patient.age}y` : ''} {adm.patient?.gender ? `· ${adm.patient.gender}` : ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="adm-location-cell">
                                            <span className="adm-location-badge">
                                                <Bed size={13} />
                                                <span>Room {adm.room || '-'} / {adm.bed || '-'}</span>
                                            </span>
                                            <span className="adm-location-floor">{adm.floor || 'Standard Floor'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="adm-pill-stack">
                                            <span className={`adm-badge adm-badge--${adm.admissionPriority === 'CRITICAL' || adm.admissionPriority === 'HIGH' ? 'error' : 'info'}`}>
                                                {adm.admissionPriority || 'NORMAL'}
                                            </span>
                                            <span className="adm-badge adm-badge--neutral">
                                                {adm.healthCondition || 'STABLE'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="adm-text-secondary">
                                            {adm.clinicalStatus || 'AMBULATORY'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="adm-text-secondary">
                                            {new Date(adm.admittedAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="adm-badge adm-badge--success">
                                            {adm.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="adm-row-actions">
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--icon"
                                                onClick={() => handleInspect(adm)}
                                                title="View admission profile"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--sm adm-btn--secondary"
                                                onClick={() => handleStartClosure(adm)}
                                                title="Manage discharge / relieving"
                                            >
                                                <FileText size={13} />
                                                <span>Relieving</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Admission Details Modal */}
            <AdmissionDetailsModal
                admission={selectedAdmission}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                onManageClosure={handleStartClosure}
            />

            {/* Relieving / Closure Modal */}
            {closureTarget && (
                <ClosureAgreementModal
                    admission={closureTarget}
                    isOpen={isClosureOpen}
                    onClose={() => setIsClosureOpen(false)}
                    onSuccess={() => {
                        setIsClosureOpen(false);
                        void fetchAdmissions();
                    }}
                />
            )}
        </div>
    );
}
