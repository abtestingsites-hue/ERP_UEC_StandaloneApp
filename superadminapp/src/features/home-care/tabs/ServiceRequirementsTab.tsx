import { useState, useEffect } from 'react';
import { ClipboardList, FileSignature, Activity, RotateCw } from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { HomeCareEnquiry } from '../homeCare.types';

interface ServiceRequirementsTabProps {
    onOpenNewContract: (enquiry?: HomeCareEnquiry) => void;
    activeUnitId?: string | null;
}

export function ServiceRequirementsTab({ onOpenNewContract, activeUnitId }: ServiceRequirementsTabProps) {
    const [requirements, setRequirements] = useState<HomeCareEnquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        homeCareService
            .getEnquiries({}, activeUnitId)
            .then((list) => {
                if (!isMounted) return;
                const filtered = list.filter((e) => e.serviceRequirements || e.rawMessage);
                setRequirements(filtered);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load service requirements:', err);
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, refreshTrigger]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClipboardList size={18} color="#0f969c" />
                        Client Service Requirements & Care Specifications
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        Specialized care packages, shift timings, frequency, and medical condition notes from client intake.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="adm-btn adm-btn--primary" onClick={() => onOpenNewContract()}>
                        <FileSignature size={14} /> Generate Service Contract
                    </button>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={handleRefresh} title="Refresh">
                        <RotateCw size={14} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                    <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Loading service requirements...</p>
                </div>
            ) : requirements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>No service requirements on record.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                    {requirements.map((req) => {
                        const clientName = req.client?.name || req.clientName || 'Client';
                        const reqs = req.serviceRequirements;
                        let parsedMeta: Record<string, unknown> = {};
                        if (typeof req.rawMessage === 'string') {
                            try { parsedMeta = JSON.parse(req.rawMessage); } catch { /* ignore */ }
                        } else if (req.rawMessage && typeof req.rawMessage === 'object') {
                            parsedMeta = req.rawMessage as Record<string, unknown>;
                        }

                        const patient = req.patientName || (parsedMeta.patientName as string) || clientName;
                        const address = (parsedMeta.clientAddress as string) || req.client?.address || 'On file';
                        const condition = (parsedMeta.patientHealthCondition as string) || reqs?.careRequirements || 'General care assistance';

                        return (
                            <div
                                key={req.id}
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 12,
                                    padding: 16,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#0f969c', textTransform: 'uppercase' }}>
                                                {req.refNo || req.id.slice(0, 8)}
                                            </span>
                                            <h4 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                                {patient}
                                            </h4>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Contact: {clientName} ({req.client?.mobile || req.mobile || '—'})</div>
                                        </div>
                                        <span className="adm-badge adm-badge--primary">
                                            {reqs?.staffRequired || 1} Caregiver(s)
                                        </span>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 12, color: '#334155', marginBottom: 10 }}>
                                        <div><strong>Shift:</strong> {reqs?.shift || '12 Hours Day'}</div>
                                        <div><strong>Frequency:</strong> {reqs?.frequency || 'Daily'}</div>
                                        <div style={{ marginTop: 4 }}><strong>Condition:</strong> {condition}</div>
                                    </div>

                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                        <strong>Location:</strong> {address}
                                    </div>
                                </div>

                                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="adm-btn adm-btn--primary"
                                        style={{ fontSize: 12, padding: '4px 10px' }}
                                        onClick={() => onOpenNewContract(req)}
                                    >
                                        <FileSignature size={12} /> Convert to Contract
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
