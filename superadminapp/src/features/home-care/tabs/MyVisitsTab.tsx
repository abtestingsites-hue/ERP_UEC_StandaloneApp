import { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle2, HeartPulse, Search, RotateCw, Activity, MapPin, User, Calendar } from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { VisitTask } from '../homeCare.types';

interface MyVisitsTabProps {
    onCheckIn: (visit: VisitTask) => void;
    onCheckOut: (visit: VisitTask) => void;
    onCareDelivery: (patientId: string, patientName: string) => void;
    activeUnitId?: string | null;
}

export function MyVisitsTab({
    onCheckIn,
    onCheckOut,
    onCareDelivery,
    activeUnitId
}: MyVisitsTabProps) {
    const [visits, setVisits] = useState<VisitTask[]>([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        homeCareService
            .getMyVisits(activeUnitId)
            .then((list) => {
                if (!isMounted) return;
                setVisits(list);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load caregiver visits:', err);
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, refreshTrigger]);

    const filteredVisits = visits.filter((v) => {
        const query = searchQuery.toLowerCase();
        let rawMeta: Record<string, unknown> | null = null;
        try {
            const enquiryObj = v.enquiry as unknown as { rawMessage?: unknown };
            if (typeof enquiryObj?.rawMessage === 'string') {
                rawMeta = JSON.parse(enquiryObj.rawMessage);
            } else if (enquiryObj?.rawMessage && typeof enquiryObj.rawMessage === 'object') {
                rawMeta = enquiryObj.rawMessage as Record<string, unknown>;
            }
        } catch {
            rawMeta = null;
        }

        const enquiryAny = v.enquiry as unknown as {
            client?: { name?: string };
            admission?: { patient?: { name?: string } };
        };

        const clientName = enquiryAny?.client?.name || v.enquiry?.clientName || '';
        const patientName =
            enquiryAny?.admission?.patient?.name ||
            (rawMeta?.patientName as string) ||
            v.enquiry?.patientName ||
            clientName;
        const title = v.title || '';
        const refNo = v.refNo || '';

        const matchesSearch =
            title.toLowerCase().includes(query) ||
            clientName.toLowerCase().includes(query) ||
            patientName.toLowerCase().includes(query) ||
            refNo.toLowerCase().includes(query);

        const normStatus = String(v.status || '').toUpperCase();
        const matchesStatus =
            statusFilter === 'ALL' ||
            normStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const activeCount = visits.filter((v) => String(v.status || '').toUpperCase() === 'IN_PROGRESS').length;
    const pendingCount = visits.filter((v) => ['ASSIGNED', 'PENDING'].includes(String(v.status || '').toUpperCase())).length;
    const completedCount = visits.filter((v) => String(v.status || '').toUpperCase() === 'COMPLETED').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div className="adm-search-input-wrapper" style={{ minWidth: 260 }}>
                        <Search size={15} className="adm-search-icon" />
                        <input
                            type="text"
                            className="adm-search-input"
                            placeholder="Search visits by client, title, ref..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
                        {[
                            { id: 'ALL', label: `All (${visits.length})` },
                            { id: 'ASSIGNED', label: `Pending (${pendingCount})` },
                            { id: 'IN_PROGRESS', label: `In-Progress (${activeCount})` },
                            { id: 'COMPLETED', label: `Completed (${completedCount})` }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                type="button"
                                onClick={() => setStatusFilter(btn.id)}
                                style={{
                                    border: 'none',
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: statusFilter === btn.id ? 700 : 500,
                                    cursor: 'pointer',
                                    background: statusFilter === btn.id ? '#ffffff' : 'transparent',
                                    color: statusFilter === btn.id ? '#0f172a' : '#64748b',
                                    boxShadow: statusFilter === btn.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                                }}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button type="button" className="adm-btn adm-btn--secondary" onClick={handleRefresh} title="Refresh">
                    <RotateCw size={14} /> Refresh Visits
                </button>
            </div>

            {/* Visit Cards */}
            {isLoading ? (
                <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                    <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Loading visits schedule...</p>
                </div>
            ) : filteredVisits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>No visit tasks match the selected filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {filteredVisits.map((v) => {
                        const normStatus = String(v.status || '').toUpperCase();
                        let rawMeta: Record<string, unknown> | null = null;
                        try {
                            const enquiryObj = v.enquiry as unknown as { rawMessage?: unknown };
                            if (typeof enquiryObj?.rawMessage === 'string') {
                                rawMeta = JSON.parse(enquiryObj.rawMessage);
                            } else if (enquiryObj?.rawMessage && typeof enquiryObj.rawMessage === 'object') {
                                rawMeta = enquiryObj.rawMessage as Record<string, unknown>;
                            }
                        } catch {
                            rawMeta = null;
                        }

                        const enquiryAny = v.enquiry as unknown as {
                            client?: { name?: string; address?: string };
                            admission?: { patientId?: string; patient?: { id?: string; name?: string } };
                        };

                        const clientName = enquiryAny?.client?.name || v.enquiry?.clientName || 'Home Care Client';
                        const patientName =
                            enquiryAny?.admission?.patient?.name ||
                            (rawMeta?.patientName as string) ||
                            v.enquiry?.patientName ||
                            clientName;

                        const address = enquiryAny?.client?.address || v.enquiry?.address || (rawMeta?.clientLocation as string) || 'Address on record';
                        const resolvedPatientId =
                            enquiryAny?.admission?.patient?.id ||
                            enquiryAny?.admission?.patientId ||
                            v.metadata?.patientId ||
                            v.patientId ||
                            '';

                        return (
                            <div
                                key={v.id}
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 12,
                                    padding: 18,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                                    {v.title}
                                                </h4>
                                            </div>
                                            {v.refNo && (
                                                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                                                    {v.refNo}
                                                </span>
                                            )}
                                        </div>
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

                                    <div style={{ fontSize: 12, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4, margin: '8px 0 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <User size={13} color="#0f969c" />
                                            <span>Patient: <strong>{patientName}</strong> {clientName && clientName !== patientName ? <span style={{ color: '#64748b' }}>(Client: {clientName})</span> : null}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <MapPin size={13} color="#64748b" />
                                            <span>{address}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Calendar size={13} color="#64748b" />
                                            <span>Scheduled: {v.dueDate ? new Date(v.dueDate).toLocaleString() : 'Today'}</span>
                                        </div>
                                    </div>

                                    {v.description && (
                                        <div style={{ background: '#f8fafc', padding: 8, borderRadius: 6, fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                                            {v.description}
                                        </div>
                                    )}

                                    {v.remarks && (
                                        <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', padding: 8, borderRadius: 6, fontSize: 11, color: '#166534', marginBottom: 12 }}>
                                            <strong>Caregiver Remarks:</strong> {v.remarks}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    {['ASSIGNED', 'PENDING'].includes(normStatus) && (
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--primary"
                                            style={{ fontSize: 12, padding: '5px 12px' }}
                                            onClick={() => onCheckIn(v)}
                                        >
                                            <PlayCircle size={14} /> Check In
                                        </button>
                                    )}

                                    {normStatus === 'IN_PROGRESS' && (
                                        <>
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--secondary"
                                                style={{ fontSize: 12, padding: '5px 12px', color: '#e11d48', borderColor: '#fecdd3' }}
                                                onClick={() => onCareDelivery(resolvedPatientId, patientName)}
                                            >
                                                <HeartPulse size={14} /> Care Delivery
                                            </button>
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--primary"
                                                style={{ fontSize: 12, padding: '5px 12px', background: '#059669', borderColor: '#059669' }}
                                                onClick={() => onCheckOut(v)}
                                            >
                                                <CheckCircle2 size={14} /> Check Out
                                            </button>
                                        </>
                                    )}

                                    {normStatus === 'COMPLETED' && (
                                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CheckCircle2 size={14} /> Visit Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
