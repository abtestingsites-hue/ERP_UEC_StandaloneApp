import { useState, useEffect, useMemo } from 'react';
import {
    FileSignature,
    Plus,
    Eye,
    RotateCw,
    Activity,
    Receipt,
    Lock,
    Search,
    CheckCircle2
} from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { HomeCareAdmission, ServiceContract } from '../homeCare.types';

interface ServiceContractsTabProps {
    onOpenCreateContract: (admission: HomeCareAdmission) => void;
    onOpenContractDetails: (admission: HomeCareAdmission, contract: ServiceContract | null) => void;
    onOpenPrepareInvoice: (admission: HomeCareAdmission, contract: ServiceContract) => void;
    onOpenClosure: (admission: HomeCareAdmission, contract: ServiceContract) => void;
    activeUnitId?: string | null;
}

export function ServiceContractsTab({
    onOpenCreateContract,
    onOpenContractDetails,
    onOpenPrepareInvoice,
    onOpenClosure,
    activeUnitId
}: ServiceContractsTabProps) {
    const [admissions, setAdmissions] = useState<HomeCareAdmission[]>([]);
    const [contractMap, setContractMap] = useState<Record<string, ServiceContract | null>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'COMPLETED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        homeCareService
            .getAdmissions(activeUnitId)
            .then(async (list) => {
                if (!isMounted) return;
                setAdmissions(list);

                const map: Record<string, ServiceContract | null> = {};
                await Promise.all(
                    list.map(async (adm) => {
                        const c = await homeCareService.getAdmissionContract(adm.id, activeUnitId);
                        map[adm.id] = c;
                    })
                );
                if (!isMounted) return;
                setContractMap(map);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load service contracts:', err);
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, refreshTrigger]);

    // Filter admissions
    const filteredAdmissions = useMemo(() => {
        return admissions.filter((adm) => {
            const contract = contractMap[adm.id] || adm.serviceContract || null;
            const status = contract?.status || 'UNCONTRACTED';

            if (statusFilter === 'ACTIVE' && status !== 'ACTIVE') return false;
            if (statusFilter === 'DRAFT' && status !== 'DRAFT') return false;
            if (statusFilter === 'COMPLETED' && (status !== 'COMPLETED' && status !== 'CANCELLED')) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const clientName = (adm.patient?.name || adm.enquiry?.client?.name || '').toLowerCase();
                const contractNo = (contract?.contractNumber || '').toLowerCase();
                const ref = (adm.enquiry?.refNo || adm.id).toLowerCase();
                if (!clientName.includes(q) && !contractNo.includes(q) && !ref.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [admissions, contractMap, statusFilter, searchQuery]);

    const activeCount = admissions.filter((adm) => (contractMap[adm.id] || adm.serviceContract)?.status === 'ACTIVE').length;
    const draftCount = admissions.filter((adm) => (contractMap[adm.id] || adm.serviceContract)?.status === 'DRAFT').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileSignature size={18} color="#0f969c" />
                        Service Contracts, Amendments & Operational Closure
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        Manage active contracts, term amendments, rate renewals, finance billing handoff, and service closures.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={handleRefresh} title="Refresh">
                        <RotateCw size={14} /> Refresh Contracts
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 240 }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search client, contract..."
                            className="adm-form-input"
                            style={{ paddingLeft: 30, fontSize: 12 }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                        {[
                            { id: 'ALL', label: `All (${admissions.length})` },
                            { id: 'ACTIVE', label: `Active (${activeCount})` },
                            { id: 'DRAFT', label: `Drafts (${draftCount})` },
                            { id: 'COMPLETED', label: 'Closed / Inactive' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                type="button"
                                className={`adm-btn ${statusFilter === btn.id ? 'adm-btn--primary' : 'adm-btn--secondary'}`}
                                style={{ fontSize: 11, padding: '4px 10px' }}
                                onClick={() => setStatusFilter(btn.id as any)}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                    <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Loading service contracts...</p>
                </div>
            ) : filteredAdmissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>No service contracts found on record.</p>
                </div>
            ) : (
                <div className="adm-table-container">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Contract / Client</th>
                                <th>Service Package</th>
                                <th>Caregiver Plan</th>
                                <th>Agreed Rate (₹)</th>
                                <th>Contract Status</th>
                                <th>Validity Period</th>
                                <th>Actions & Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmissions.map((adm) => {
                                const contract = contractMap[adm.id] || adm.serviceContract || null;
                                const hasContract = Boolean(contract && contract.id);
                                const clientName = adm.patient?.name || adm.enquiry?.client?.name || 'Home Care Patient';
                                const refNo = adm.enquiry?.refNo || adm.id.slice(0, 8);
                                const isActive = hasContract && contract?.status === 'ACTIVE';

                                return (
                                    <tr key={adm.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span
                                                    className={`adm-badge ${
                                                        isActive
                                                            ? 'adm-badge--success'
                                                            : hasContract && contract?.status === 'DRAFT'
                                                            ? 'adm-badge--warning'
                                                            : hasContract && contract?.status === 'CANCELLED'
                                                            ? 'adm-badge--error'
                                                            : 'adm-badge--secondary'
                                                    }`}
                                                >
                                                    {hasContract ? contract?.contractNumber : 'NO CONTRACT'}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                                                {clientName}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>
                                                Ref: {refNo}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{adm.enquiry?.service?.name || 'Home Care Service'}</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Unit: {adm.unitId ? adm.unitId.slice(0, 8) : 'Facility'}</div>
                                        </td>
                                        <td>
                                            {hasContract ? (
                                                <div style={{ fontSize: 12 }}>
                                                    <strong>{contract?.shift || '12h Day'} ({contract?.frequency || 'Daily'})</strong>
                                                    <div style={{ color: '#64748b' }}>{contract?.staffRequired || 1} Caregiver(s)</div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                                                    Pending contract creation
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {hasContract && contract?.servicePrice ? (
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                                    ₹{contract.servicePrice.toLocaleString()}
                                                    <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginLeft: 4 }}>
                                                        / {contract.billingCycle || 'Month'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            {hasContract ? (
                                                <span
                                                    className={`adm-badge ${
                                                        isActive
                                                            ? 'adm-badge--success'
                                                            : contract?.status === 'DRAFT'
                                                            ? 'adm-badge--warning'
                                                            : contract?.status === 'CANCELLED'
                                                            ? 'adm-badge--error'
                                                            : 'adm-badge--secondary'
                                                    }`}
                                                >
                                                    {contract?.status}
                                                </span>
                                            ) : (
                                                <span className="adm-badge adm-badge--secondary">Uncontracted</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 12, color: '#475569' }}>
                                            {hasContract && contract?.startDate ? (
                                                <div>
                                                    <div>From: {new Date(contract.startDate).toLocaleDateString()}</div>
                                                    <div>To: {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Ongoing'}</div>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {hasContract ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="adm-btn adm-btn--secondary"
                                                            style={{ fontSize: 11, padding: '4px 8px' }}
                                                            onClick={() => onOpenContractDetails(adm, contract)}
                                                        >
                                                            <Eye size={12} /> {contract?.status === 'DRAFT' ? 'Review & Activate' : 'Terms & Amend'}
                                                        </button>

                                                        {isActive && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="adm-btn adm-btn--primary"
                                                                    style={{ fontSize: 11, padding: '4px 8px' }}
                                                                    onClick={() => onOpenPrepareInvoice(adm, contract)}
                                                                >
                                                                    <Receipt size={12} /> Bill Client
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="adm-btn adm-btn--secondary"
                                                                    style={{ fontSize: 11, padding: '4px 8px', color: '#0f969c', borderColor: '#ccfbf1' }}
                                                                    onClick={() => onOpenClosure(adm, contract)}
                                                                >
                                                                    <Lock size={12} /> Close
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="adm-btn adm-btn--primary"
                                                        style={{ fontSize: 11, padding: '4px 10px' }}
                                                        onClick={() => onOpenCreateContract(adm)}
                                                    >
                                                        <Plus size={12} /> Generate Draft
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
