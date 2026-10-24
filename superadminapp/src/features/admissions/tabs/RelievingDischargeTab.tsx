import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    LogOut,
    CheckCircle,
    Search,
    RefreshCw,
    AlertCircle,
    FileText,
    Bed,
    Clock
} from 'lucide-react';
import { admissionsService } from '../admissions.service';
import type { AdmissionRecord, ServiceClosure } from '../admissions.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { ClosureAgreementModal } from '../components/ClosureAgreementModal';

export function RelievingDischargeTab() {
    const { activeUnitId, activeUnitName } = useActiveUnit();

    const [viewMode, setViewMode] = useState<'pending' | 'executed'>('pending');
    const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
    const [executedClosures, setExecutedClosures] = useState<ServiceClosure[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Modal
    const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRecord | null>(null);
    const [isClosureOpen, setIsClosureOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (viewMode === 'pending') {
                const data = await admissionsService.listAdmissions({
                    unitId: activeUnitId,
                    allUnits: activeUnitId === null
                });
                setAdmissions(data);
            } else {
                const closures = await admissionsService.listExecutedClosures();
                setExecutedClosures(closures);
            }
        } catch (err: unknown) {
            console.error('Failed to load relieving data:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load relieving data';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, viewMode]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchData();
        };
        void run();
        return () => { isMounted = false; };
    }, [fetchData]);

    const filteredAdmissions = useMemo(() => {
        if (!search.trim()) return admissions;
        const q = search.toLowerCase();
        return admissions.filter(a =>
            a.patient?.name?.toLowerCase().includes(q) ||
            a.room?.toLowerCase().includes(q) ||
            a.bed?.toLowerCase().includes(q) ||
            a.patient?.phone?.includes(q)
        );
    }, [admissions, search]);

    const filteredExecuted = useMemo(() => {
        if (!search.trim()) return executedClosures;
        const q = search.toLowerCase();
        return executedClosures.filter(c =>
            c.admission?.patient?.name?.toLowerCase().includes(q) ||
            c.closingRemarks?.toLowerCase().includes(q)
        );
    }, [executedClosures, search]);

    const handleManageClosure = (adm: AdmissionRecord) => {
        setSelectedAdmission(adm);
        setIsClosureOpen(true);
    };

    return (
        <div className="adm-tab-container">
            {/* View Mode Pill Switcher */}
            <div className="adm-subnav-bar">
                <div className="adm-subnav-group">
                    <button
                        type="button"
                        className={`adm-subnav-btn ${viewMode === 'pending' ? 'adm-subnav-btn--active' : ''}`}
                        onClick={() => setViewMode('pending')}
                    >
                        <Clock size={14} />
                        <span>Inpatients Pending Discharge ({admissions.length})</span>
                    </button>
                    <button
                        type="button"
                        className={`adm-subnav-btn ${viewMode === 'executed' ? 'adm-subnav-btn--active' : ''}`}
                        onClick={() => setViewMode('executed')}
                    >
                        <CheckCircle size={14} />
                        <span>Discharge Archive ({executedClosures.length})</span>
                    </button>
                </div>

                <div className="adm-subnav-actions">
                    <div className="adm-toolbar-search-wrap">
                        <Search size={15} className="adm-search-icon" />
                        <input
                            type="text"
                            className="adm-input adm-search-input"
                            placeholder="Filter by resident name, room, remarks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={fetchData}
                        disabled={isLoading}
                    >
                        <RefreshCw size={14} className={isLoading ? 'adm-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="adm-alert adm-alert--error" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    <div>
                        <strong>Failed to load relieving records</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Table Area */}
            {viewMode === 'pending' ? (
                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Resident Name</th>
                                <th>Location</th>
                                <th>Admission Date</th>
                                <th>Clinical Condition</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Relieving Workflow</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="adm-loading-state">
                                            <span className="adm-spinner" />
                                            <p>Loading active inpatients...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAdmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="adm-empty-state">
                                            <LogOut size={32} className="adm-empty-icon" />
                                            <h3>No Active Inpatients for Discharge</h3>
                                            <p>All resident admissions in {activeUnitName} are settled or none match your query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmissions.map((adm) => (
                                    <tr key={adm.id} className="adm-table-row">
                                        <td>
                                            <div className="adm-resident-cell">
                                                <span className="adm-resident-name">{adm.patient?.name || 'Inpatient'}</span>
                                                <span className="adm-resident-meta">{adm.patient?.phone || 'No phone'}</span>
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
                                            <span className="adm-text-secondary">
                                                {new Date(adm.admittedAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="adm-badge adm-badge--neutral">
                                                {adm.healthCondition || 'STABLE'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="adm-badge adm-badge--success">
                                                {adm.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--primary"
                                                onClick={() => handleManageClosure(adm)}
                                            >
                                                <FileText size={14} />
                                                <span>Manage Relieving Checklist</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Resident Name</th>
                                <th>Agreement Status</th>
                                <th>Clearance Checkmarks</th>
                                <th>Execution Date</th>
                                <th>Discharge Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="adm-loading-state">
                                            <span className="adm-spinner" />
                                            <p>Loading executed discharge history...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredExecuted.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="adm-empty-state">
                                            <CheckCircle size={32} className="adm-empty-icon" />
                                            <h3>No Executed Discharges Found</h3>
                                            <p>No executed service closures have been archived yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredExecuted.map((closure) => (
                                    <tr key={closure.id} className="adm-table-row">
                                        <td>
                                            <div className="adm-resident-cell">
                                                <span className="adm-resident-name">
                                                    {closure.admission?.patient?.name || 'Resident'}
                                                </span>
                                                <span className="adm-resident-meta">
                                                    Closure ID: {closure.id.slice(0, 8)}...
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="adm-badge adm-badge--neutral">
                                                {closure.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="adm-clearance-badges-row">
                                                <span className={`adm-pill ${closure.medicalCleared ? 'adm-pill--success' : 'adm-pill--pending'}`}>
                                                    Medical
                                                </span>
                                                <span className={`adm-pill ${closure.financeCleared ? 'adm-pill--success' : 'adm-pill--pending'}`}>
                                                    Finance
                                                </span>
                                                <span className={`adm-pill ${closure.assetCleared ? 'adm-pill--success' : 'adm-pill--pending'}`}>
                                                    Asset
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="adm-text-secondary">
                                                {new Date(closure.updatedAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="adm-text-secondary" style={{ fontStyle: 'italic' }}>
                                                {closure.closingRemarks || 'Discharge completed.'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Relieving Modal */}
            {selectedAdmission && (
                <ClosureAgreementModal
                    admission={selectedAdmission}
                    isOpen={isClosureOpen}
                    onClose={() => setIsClosureOpen(false)}
                    onSuccess={() => {
                        setIsClosureOpen(false);
                        void fetchData();
                    }}
                />
            )}
        </div>
    );
}
