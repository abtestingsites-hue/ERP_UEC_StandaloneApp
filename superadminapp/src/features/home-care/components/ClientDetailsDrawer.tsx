import { X, Phone, User, MapPin, HeartPulse } from 'lucide-react';
import type { HomeCareClientItem } from '../homeCare.types';

interface ClientDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    client: HomeCareClientItem | null;
}

export function ClientDetailsDrawer({ isOpen, onClose, client }: ClientDetailsDrawerProps) {
    if (!isOpen || !client) return null;

    const raw = (client.raw || {}) as Record<string, unknown>;
    const enquiry = (raw.enquiry || {}) as Record<string, unknown>;
    const clientData = (enquiry.client || {}) as Record<string, unknown>;
    const patientData = (raw.patient || enquiry.patient || {}) as Record<string, unknown>;
    const address = (clientData.address || raw.address || 'Address on record') as string;

    return (
        <div className="adm-modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }} role="dialog" aria-modal="true">
            <div
                className="adm-modal-container"
                style={{
                    width: '100%',
                    maxWidth: 440,
                    height: '100vh',
                    borderRadius: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideInRight 0.25s ease-out'
                }}
            >
                <div className="adm-modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
                    <div className="adm-modal-title-group">
                        <User className="adm-modal-icon" />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h3 className="adm-modal-title" style={{ margin: 0 }}>
                                    {client.clientName}
                                </h3>
                                <span className="adm-badge adm-badge--primary">
                                    {client.type}
                                </span>
                            </div>
                            <p className="adm-modal-subtitle" style={{ marginTop: 2 }}>
                                Patient: <strong>{client.patientName}</strong>
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="adm-modal-body" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {/* Status & Service Card */}
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Service Status</span>
                            <span className="adm-badge adm-badge--success">{client.status}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{client.service}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                            Contract: {client.contract}
                        </div>
                    </div>

                    {/* Contact & Location */}
                    <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f969c', textTransform: 'uppercase', marginBottom: 8 }}>
                            Contact & Location
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#334155' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Phone size={14} color="#64748b" />
                                <span>{client.mobile}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <MapPin size={14} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />
                                <span>{address}</span>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Caregiver Staff */}
                    <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f969c', textTransform: 'uppercase', marginBottom: 8 }}>
                            Assigned Staff
                        </h4>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{client.staffName}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                                {client.staffId ? `Staff ID: ${client.staffId.slice(0, 8)}` : 'No dedicated caregiver allocated'}
                            </div>
                        </div>
                    </div>

                    {/* Clinical Profile Summary */}
                    {Boolean(patientData?.id || raw.patient) && (
                        <div>
                            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f969c', textTransform: 'uppercase', marginBottom: 8 }}>
                                Clinical Profile
                            </h4>
                            <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#134e4a' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <HeartPulse size={14} />
                                    <strong>Resident Patient ID:</strong> {String(patientData?.id || raw.patientId || '').slice(0, 8)}
                                </div>
                                <div>Ready for home visit clinical observations, vitals recording, and daily ADL execution.</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="adm-modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '14px 20px' }}>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
