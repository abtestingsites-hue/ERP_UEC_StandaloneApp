import { useState, useEffect } from 'react';
import { Phone, Eye, Search, RotateCw, Activity } from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { HomeCareClientItem } from '../homeCare.types';

interface MyClientsTabProps {
    onOpenClientDetails: (client: HomeCareClientItem) => void;
    activeUnitId?: string | null;
}

export function MyClientsTab({ onOpenClientDetails, activeUnitId }: MyClientsTabProps) {
    const [clients, setClients] = useState<HomeCareClientItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            homeCareService.getAllocations(activeUnitId),
            homeCareService.getAdmissions(activeUnitId)
        ])
            .then(([allocs, admissions]) => {
                if (!isMounted) return;
                const clientMap = new Map<string, HomeCareClientItem>();

                allocs.forEach((item) => {
                    let rawMeta: Record<string, unknown> | null = null;
                    try {
                        if (typeof item.enquiry?.rawMessage === 'string') {
                            rawMeta = JSON.parse(item.enquiry.rawMessage);
                        } else if (item.enquiry?.rawMessage && typeof item.enquiry.rawMessage === 'object') {
                            rawMeta = item.enquiry.rawMessage as Record<string, unknown>;
                        }
                    } catch {
                        rawMeta = null;
                    }

                    const clientName =
                        item.enquiry?.client?.name ||
                        item.clientName ||
                        'Home Care Client';

                    const patientName =
                        (item as { resolvedPatient?: { name?: string } }).resolvedPatient?.name ||
                        item.enquiry?.admission?.patient?.name ||
                        item.admission?.patient?.name ||
                        (rawMeta?.patientName as string) ||
                        item.patient ||
                        clientName;

                    const mobile =
                        item.enquiry?.client?.mobile ||
                        (item as { resolvedPatient?: { phone?: string } }).resolvedPatient?.phone ||
                        item.mobile ||
                        '—';

                    const service =
                        item.enquiry?.service?.name ||
                        (rawMeta?.patientHealthCondition as string) ||
                        (item.metadata as { notes?: string })?.notes ||
                        item.service ||
                        'Home Care Service';

                    const staffName =
                        item.staffName ||
                        (item.staff ? `${item.staff.firstName || ''} ${item.staff.lastName || ''}`.trim() : '') ||
                        'Unassigned';

                    const key = item.id || item.refNo || item.allocationRef || clientName;

                    clientMap.set(key, {
                        id: item.id || key,
                        clientName,
                        mobile,
                        patientName,
                        service,
                        contract: item.contract || 'Active Allocation',
                        staffName,
                        staffId: item.staffId || null,
                        status: item.status || 'ALLOCATED',
                        type: 'ALLOCATION',
                        raw: item
                    });
                });

                admissions.forEach((item) => {
                    let rawMeta: Record<string, unknown> | null = null;
                    try {
                        if (typeof item.enquiry?.rawMessage === 'string') {
                            rawMeta = JSON.parse(item.enquiry.rawMessage);
                        } else if (item.enquiry?.rawMessage && typeof item.enquiry.rawMessage === 'object') {
                            rawMeta = item.enquiry.rawMessage as Record<string, unknown>;
                        }
                    } catch {
                        rawMeta = null;
                    }

                    const clientName = item.enquiry?.client?.name || item.patient?.name || 'Home Care Client';
                    const patientName = item.patient?.name || (rawMeta?.patientName as string) || clientName;
                    const key = item.id || item.enquiry?.refNo || clientName;

                    if (!clientMap.has(key)) {
                        clientMap.set(key, {
                            id: item.id,
                            clientName,
                            mobile: item.enquiry?.client?.mobile || item.patient?.mobile || '—',
                            patientName,
                            service: item.enquiry?.service?.name || (rawMeta?.patientHealthCondition as string) || 'Home Care Admission',
                            contract: item.serviceContract ? item.serviceContract.contractNumber : 'Admission Active',
                            staffName: 'Assigned via Allocation',
                            staffId: null,
                            status: item.status || 'ADMITTED',
                            type: 'ADMISSION',
                            raw: item
                        });
                    }
                });

                setClients(Array.from(clientMap.values()));
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load clients:', err);
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, refreshTrigger]);

    const filteredClients = clients.filter((c) => {
        const query = searchQuery.toLowerCase();
        return (
            c.clientName.toLowerCase().includes(query) ||
            c.patientName.toLowerCase().includes(query) ||
            c.mobile.toLowerCase().includes(query) ||
            c.service.toLowerCase().includes(query)
        );
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div className="adm-search-input-wrapper" style={{ minWidth: 280 }}>
                    <Search size={15} className="adm-search-icon" />
                    <input
                        type="text"
                        className="adm-search-input"
                        placeholder="Search clients by name, patient, mobile, service..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <button type="button" className="adm-btn adm-btn--secondary" onClick={handleRefresh} title="Refresh">
                    <RotateCw size={14} /> Refresh Clients
                </button>
            </div>

            {/* Clients Table */}
            {isLoading ? (
                <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                    <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Loading clients...</p>
                </div>
            ) : filteredClients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>No clients found matching the query.</p>
                </div>
            ) : (
                <div className="adm-table-container">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Client Name</th>
                                <th>Patient Name</th>
                                <th>Contact Mobile</th>
                                <th>Service / Package</th>
                                <th>Contract Status</th>
                                <th>Assigned Staff</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.clientName}</div>
                                        <span className="adm-badge adm-badge--secondary" style={{ fontSize: 10 }}>
                                            {c.type}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{c.patientName}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                            <Phone size={12} color="#64748b" />
                                            <span>{c.mobile}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{c.service}</div>
                                    </td>
                                    <td>
                                        <span className="adm-badge adm-badge--success">{c.status}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#0f969c' }}>{c.staffName}</div>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            style={{ fontSize: 11, padding: '4px 8px' }}
                                            onClick={() => onOpenClientDetails(c)}
                                        >
                                            <Eye size={12} /> Inspect
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
