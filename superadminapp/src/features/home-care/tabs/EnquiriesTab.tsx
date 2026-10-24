import { useState, useEffect } from 'react';
import { UserPlus, Search, Phone, Eye, RotateCw, Activity } from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { HomeCareEnquiry } from '../homeCare.types';

interface EnquiriesTabProps {
    onOpenNewEnquiry: () => void;
    activeUnitId?: string | null;
}

export function EnquiriesTab({ onOpenNewEnquiry, activeUnitId }: EnquiriesTabProps) {
    const [enquiries, setEnquiries] = useState<HomeCareEnquiry[]>([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEnquiry, setSelectedEnquiry] = useState<HomeCareEnquiry | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        homeCareService
            .getEnquiries({
                status: statusFilter,
                search: searchQuery || undefined
            }, activeUnitId)
            .then((list) => {
                if (!isMounted) return;
                setEnquiries(list);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load enquiries:', err);
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [statusFilter, searchQuery, activeUnitId, refreshTrigger]);

    const statuses = ['ALL', 'Open', 'In Progress', 'Converted', 'Emergency', 'Important', 'Just Enquiry'];

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
                            placeholder="Search by client, mobile, ref..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
                        {statuses.map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setStatusFilter(st)}
                                style={{
                                    border: 'none',
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: statusFilter === st ? 700 : 500,
                                    cursor: 'pointer',
                                    background: statusFilter === st ? '#ffffff' : 'transparent',
                                    color: statusFilter === st ? '#0f172a' : '#64748b',
                                    boxShadow: statusFilter === st ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                                }}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="adm-btn adm-btn--primary" onClick={onOpenNewEnquiry}>
                        <UserPlus size={14} /> New Client Intake
                    </button>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={handleRefresh} title="Refresh">
                        <RotateCw size={14} />
                    </button>
                </div>
            </div>

            {/* Enquiries Table */}
            {isLoading ? (
                <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                    <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Loading client intake enquiries...</p>
                </div>
            ) : enquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>No enquiries match the current filter.</p>
                </div>
            ) : (
                <div className="adm-table-container">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Ref / Client</th>
                                <th>Patient Name</th>
                                <th>Contact Number</th>
                                <th>Intake Channel</th>
                                <th>Status</th>
                                <th>Care Requirements</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enquiries.map((enq) => {
                                const clientName = enq.client?.name || enq.clientName || 'Client';
                                const mobile = enq.client?.mobile || enq.mobile || '—';
                                const patient = enq.patientName || enq.serviceRequirements?.patientName || clientName;
                                const reqs = enq.serviceRequirements;

                                return (
                                    <tr key={enq.id}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{clientName}</div>
                                            {enq.refNo && (
                                                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                                                    {enq.refNo}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{patient}</div>
                                            {reqs?.patientAge && (
                                                <span style={{ fontSize: 11, color: '#64748b' }}>
                                                    {reqs.patientAge} yrs · {reqs.patientGender || '—'}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                                <Phone size={12} color="#64748b" />
                                                <span>{mobile}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                                                {enq.mode || 'Call'}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`adm-badge ${
                                                    enq.status === 'Converted'
                                                        ? 'adm-badge--success'
                                                        : enq.status === 'Emergency'
                                                        ? 'adm-badge--danger'
                                                        : enq.status === 'In Progress'
                                                        ? 'adm-badge--warning'
                                                        : 'adm-badge--secondary'
                                                }`}
                                            >
                                                {enq.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#475569' }}>
                                            {reqs ? (
                                                <div>
                                                    <strong>{reqs.shift || '12h'} ({reqs.frequency || 'Daily'})</strong> · {reqs.staffRequired || 1} staff
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>General enquiry</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--secondary"
                                                style={{ fontSize: 11, padding: '3px 8px' }}
                                                onClick={() => setSelectedEnquiry(enq)}
                                            >
                                                <Eye size={12} /> Inspect
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Inspect Modal/Drawer */}
            {selectedEnquiry && (
                <div className="adm-modal-overlay" role="dialog" aria-modal="true">
                    <div className="adm-modal-container adm-modal-container--sm" style={{ maxWidth: 460 }}>
                        <div className="adm-modal-header">
                            <div>
                                <h3 className="adm-modal-title">Enquiry Details</h3>
                                <p className="adm-modal-subtitle">Ref: {selectedEnquiry.refNo || selectedEnquiry.id.slice(0, 8)}</p>
                            </div>
                            <button type="button" className="adm-modal-close-btn" onClick={() => setSelectedEnquiry(null)}>
                                ×
                            </button>
                        </div>
                        <div className="adm-modal-body" style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                                <strong>Client Name:</strong> {selectedEnquiry.client?.name || selectedEnquiry.clientName}
                            </div>
                            <div>
                                <strong>Mobile:</strong> {selectedEnquiry.client?.mobile || selectedEnquiry.mobile}
                            </div>
                            <div>
                                <strong>Email:</strong> {selectedEnquiry.client?.email || '—'}
                            </div>
                            <div>
                                <strong>Patient:</strong> {selectedEnquiry.patientName || '—'}
                            </div>
                            {selectedEnquiry.serviceRequirements && (
                                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                                    <div><strong>Shift:</strong> {selectedEnquiry.serviceRequirements.shift}</div>
                                    <div><strong>Frequency:</strong> {selectedEnquiry.serviceRequirements.frequency}</div>
                                    <div><strong>Staff Count:</strong> {selectedEnquiry.serviceRequirements.staffRequired}</div>
                                    <div><strong>Care Needs:</strong> {selectedEnquiry.serviceRequirements.careRequirements || '—'}</div>
                                    <div><strong>Special Instructions:</strong> {selectedEnquiry.serviceRequirements.specialInstructions || '—'}</div>
                                </div>
                            )}
                            {selectedEnquiry.comments && (
                                <div>
                                    <strong>Notes / Comments:</strong>
                                    <p style={{ margin: '4px 0 0', color: '#64748b' }}>{selectedEnquiry.comments}</p>
                                </div>
                            )}
                        </div>
                        <div className="adm-modal-footer">
                            <button type="button" className="adm-btn adm-btn--secondary" onClick={() => setSelectedEnquiry(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
