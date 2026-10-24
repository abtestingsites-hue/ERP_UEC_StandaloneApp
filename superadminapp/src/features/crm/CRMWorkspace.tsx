import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Radio, Users, PhoneCall, MessageSquare, BarChart2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { readAuthSession } from '../auth/authStorage';

export function CRMWorkspace() {
    const rawCrmAppUrl = (import.meta as any).env?.VITE_CRM_APP_URL || 'http://127.0.0.1:5181';
    const liveBackendUrl = 'https://crm-uec-backend.onrender.com';
    const [iframeKey, setIframeKey] = useState(0);

    const session = readAuthSession();
    const token = session?.accessToken || '';
    const userPayload = session?.user
        ? encodeURIComponent(JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role ? (typeof session.user.role === 'string' ? session.user.role : session.user.role.name) : 'ADMIN',
        }))
        : '';

    const crmAppUrl = token
        ? `${rawCrmAppUrl}/dashboard?sso_token=${encodeURIComponent(token)}&sso_user=${userPayload}`
        : `${rawCrmAppUrl}/dashboard`;

    const handleReload = () => {
        setIframeKey((prev) => prev + 1);
    };

    const handleOpenStandalone = () => {
        window.open(crmAppUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="crm-workspace" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
            <PageHeader
                eyebrow="BUSINESS DOMAIN · CLIENT RELATIONS & TELEPHONY"
                title="CRM & Communications Command Center"
                description="Client relationship lifecycle, omnichannel communications, AI-assisted lead management, and telephony."
                action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#166534',
                            }}
                        >
                            <Radio size={14} className="animate-pulse" color="#16a34a" />
                            <span>Backend: {liveBackendUrl.replace('https://', '')}</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleReload}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: '#ffffff',
                                border: '1px solid #e1e6e1',
                                color: '#202020',
                                cursor: 'pointer',
                            }}
                            title="Reload CRM Workspace"
                        >
                            <RefreshCw size={14} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenStandalone}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: '#039A01',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                            }}
                            title="Open CRM App in dedicated window"
                        >
                            <ExternalLink size={14} />
                            <span>Open Standalone (Port 5181)</span>
                        </button>
                    </div>
                }
            />

            {/* Quick Feature Ribbon */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        padding: '12px 16px',
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <div style={{ padding: '8px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed' }}>
                        <Users size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Lead Funnel</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Active Inquiries</div>
                    </div>
                </div>

                <div
                    style={{
                        padding: '12px 16px',
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <div style={{ padding: '8px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                        <PhoneCall size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Telephony</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>LiveKit & Vobiz PBX</div>
                    </div>
                </div>

                <div
                    style={{
                        padding: '12px 16px',
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
                        <MessageSquare size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Omnichannel</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>WhatsApp & Calls</div>
                    </div>
                </div>

                <div
                    style={{
                        padding: '12px 16px',
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <div style={{ padding: '8px', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
                        <BarChart2 size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Live Backend</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Render Connected</div>
                    </div>
                </div>
            </div>

            {/* Embedded Live CRM App Iframe */}
            <div
                style={{
                    flex: 1,
                    minHeight: '720px',
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #e1e6e1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                }}
            >
                <iframe
                    key={iframeKey}
                    src={crmAppUrl}
                    title="CRM Application Workspace"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        minHeight: '720px',
                    }}
                    allow="microphone; camera; clipboard-read; clipboard-write;"
                />
            </div>
        </div>
    );
}

export default CRMWorkspace;
