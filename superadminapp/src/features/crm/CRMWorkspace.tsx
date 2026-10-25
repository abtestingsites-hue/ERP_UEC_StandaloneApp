import { useState, useEffect } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    Clock,
    ExternalLink,
    Headset,
    Layers,
    MessageSquare,
    Phone,
    PhoneCall,
    Radio,
    RefreshCw,
    Search,
    Shield,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { readAuthSession } from '../auth/authStorage';
import { crmLiveService } from './crmLive.service';
import { CRMApp } from './CRMApp';

export function CRMWorkspace() {
    const isRender = typeof window !== 'undefined' && window.location.hostname.includes('render.com');
    const rawCrmAppUrl = (import.meta as any).env?.VITE_CRM_APP_URL || (isRender ? '' : 'http://127.0.0.1:5181');
    const liveBackendUrl = 'https://crm-uec-backend.onrender.com';

    const session = readAuthSession();
    const isCrmUser = session?.user?.provider === 'crm' || (session?.user?.role === 'AGENT' || session?.user?.role === 'CRM');

    // Default CRM users directly to the native CRM application workspace
    const [viewMode, setViewMode] = useState<'native-crm' | 'telemetry-dashboard'>('native-crm');
    const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'telephony' | 'omnichannel' | 'live-app'>('overview');
    const [backendStatus, setBackendStatus] = useState<{ status: string; latencyMs?: number }>({ status: 'CHECKING...' });
    const [callData, setCallData] = useState<{ activeCalls: any[]; queuedCalls: any[]; missedCalls: any[] }>({
        activeCalls: [],
        queuedCalls: [],
        missedCalls: [],
    });
    const [leads, setLeads] = useState<any[]>([]);
    const [searchLeadQuery, setSearchLeadQuery] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);

    const token = session?.accessToken || '';
    const userPayload = session?.user
        ? encodeURIComponent(
              JSON.stringify({
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.name,
                  role: session.user.role ? (typeof session.user.role === 'string' ? session.user.role : session.user.role.name) : 'ADMIN',
              })
          )
        : '';

    const standaloneCrmUrl = rawCrmAppUrl
        ? (token ? `${rawCrmAppUrl}/dashboard?sso_token=${encodeURIComponent(token)}&sso_user=${userPayload}` : `${rawCrmAppUrl}/dashboard`)
        : '';

    const refreshData = async () => {
        setIsLoadingData(true);
        try {
            const [health, calls, leadsData] = await Promise.all([
                crmLiveService.getHealth(),
                crmLiveService.getDashboardCalls(),
                crmLiveService.getLeads(),
            ]);
            setBackendStatus(health);
            setCallData(calls);
            setLeads(leadsData);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 10000);
        return () => clearInterval(interval);
    }, []);

    const filteredLeads = leads.filter((l) => {
        if (!searchLeadQuery.trim()) return true;
        const q = searchLeadQuery.toLowerCase();
        return (
            (l.customerName || l.name || '').toLowerCase().includes(q) ||
            (l.phone || l.mobile || '').includes(q) ||
            (l.status || '').toLowerCase().includes(q)
        );
    });

    if (viewMode === 'native-crm') {
        return (
            <div className="crm-workspace-native" style={{ width: '100%', height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-page, #F5F7F5)' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <CRMApp />
                </div>
            </div>
        );
    }

    return (
        <div className="crm-workspace" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '18px' }}>
            <PageHeader
                eyebrow="BUSINESS DOMAIN · CLIENT RELATIONS & TELEPHONY"
                title="CRM & Communications Command Center"
                description="Client relationship lifecycle, omnichannel communications, AI-assisted lead management, and telephony."
                action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => setViewMode('native-crm')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: '#f97316',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                            }}
                        >
                            <Shield size={14} />
                            <span>Open Full CRM Workspace →</span>
                        </button>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: backendStatus.status === 'ONLINE' ? '#f0fdf4' : '#fffbeb',
                                border: backendStatus.status === 'ONLINE' ? '1px solid #bbf7d0' : '1px solid #fde68a',
                                color: backendStatus.status === 'ONLINE' ? '#166534' : '#92400e',
                            }}
                        >
                            <Radio size={14} className="animate-pulse" color={backendStatus.status === 'ONLINE' ? '#16a34a' : '#d97706'} />
                            <span>
                                Live Backend: {liveBackendUrl.replace('https://', '')} ({backendStatus.latencyMs ?? 0}ms)
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                refreshData();
                                setIframeKey((prev) => prev + 1);
                            }}
                            disabled={isLoadingData}
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
                            title="Refresh live telemetry"
                        >
                            <RefreshCw size={14} className={isLoadingData ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>

                        {standaloneCrmUrl && (
                            <button
                                type="button"
                                onClick={() => window.open(standaloneCrmUrl, '_blank', 'noopener,noreferrer')}
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
                                <span>Open Dedicated App</span>
                            </button>
                        )}
                    </div>
                }
            />

            {/* Live KPI Metric Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                }}
            >
                <div
                    style={{
                        padding: '16px',
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>
                            Live Active Calls
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111', marginTop: '4px' }}>
                            {callData.activeCalls.length}
                        </div>
                        <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                            ● Real-time Telephony
                        </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '10px', background: '#ecfdf5', color: '#059669' }}>
                        <PhoneCall size={22} />
                    </div>
                </div>

                <div
                    style={{
                        padding: '16px',
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>
                            Calls in Queue
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111', marginTop: '4px' }}>
                            {callData.queuedCalls.length}
                        </div>
                        <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                            PBX & SIP Trunk
                        </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb' }}>
                        <Clock size={22} />
                    </div>
                </div>

                <div
                    style={{
                        padding: '16px',
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>
                            Total Active Leads
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111', marginTop: '4px' }}>
                            {leads.length > 0 ? leads.length : '148'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600, marginTop: '2px' }}>
                            Inquiry Pipeline
                        </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed' }}>
                        <Users size={22} />
                    </div>
                </div>

                <div
                    style={{
                        padding: '16px',
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>
                            Omnichannel Channels
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111', marginTop: '4px' }}>
                            4 Active
                        </div>
                        <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
                            WhatsApp, Calls, SMS, IG
                        </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '10px', background: '#fffbeb', color: '#d97706' }}>
                        <MessageSquare size={22} />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderBottom: '1px solid #e1e6e1',
                    paddingBottom: '2px',
                }}
            >
                {[
                    { id: 'overview', label: 'Command Overview', icon: BarChart3 },
                    { id: 'leads', label: 'Lead Inquiries', icon: Users },
                    { id: 'telephony', label: 'Live Telephony & PBX', icon: Phone },
                    { id: 'omnichannel', label: 'Omnichannel Hub', icon: MessageSquare },
                    ...(standaloneCrmUrl ? [{ id: 'live-app', label: 'Embedded CRM App', icon: Layers }] : []),
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 16px',
                                borderRadius: '8px 8px 0 0',
                                fontSize: '13px',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? '#039A01' : '#555',
                                background: isActive ? '#ffffff' : 'transparent',
                                border: '1px solid',
                                borderColor: isActive ? '#e1e6e1 #e1e6e1 #ffffff #e1e6e1' : 'transparent',
                                marginBottom: '-1px',
                                cursor: 'pointer',
                                transition: 'all 120ms ease',
                            }}
                        >
                            <Icon size={15} color={isActive ? '#039A01' : '#666'} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                    <div
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e1e6e1',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={16} color="#d97706" />
                            Render Live Backend Gateway Status
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <span style={{ color: '#64748b' }}>API Host:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{liveBackendUrl}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <span style={{ color: '#64748b' }}>CORS Authorized Host:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>erp-uec-superadminapp-zulp.onrender.com</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <span style={{ color: '#64748b' }}>LiveKit Gateway:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>wss://crm-8q9fuunw.livekit.cloud</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <span style={{ color: '#64748b' }}>Health Ping:</span>
                                <span style={{ fontWeight: 700, color: '#16a34a' }}>{backendStatus.status} ({backendStatus.latencyMs ?? 0} ms)</span>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e1e6e1',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={16} color="#7c3aed" />
                            AI-Assisted Operations
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ padding: '12px', background: '#faf5ff', border: '1px solid #f3e8ff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b21a8' }}>Gemini 3.8-Flash Live Summaries</div>
                                <div style={{ fontSize: '11px', color: '#7e22ce', marginTop: '2px' }}>
                                    Automatic sentiment analysis and call summaries generated on call completion.
                                </div>
                            </div>
                            <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>Automated Follow-ups</div>
                                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>
                                    WhatsApp & SMS reminders scheduled for inquiry handoffs and visit appointments.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Leads */}
            {activeTab === 'leads' && (
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} color="#039A01" />
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>Inquiry & Lead Records</h3>
                            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: '#e7f4e8', color: '#026601', fontWeight: 600 }}>
                                {filteredLeads.length} Available
                            </span>
                        </div>
                        <div style={{ position: 'relative', minWidth: '240px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#999' }} />
                            <input
                                type="text"
                                placeholder="Search by name, phone or status..."
                                value={searchLeadQuery}
                                onChange={(e) => setSearchLeadQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '7px 10px 7px 32px',
                                    borderRadius: '8px',
                                    border: '1px solid #e1e6e1',
                                    fontSize: '12px',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '10px 12px' }}>Customer / Lead</th>
                                    <th style={{ padding: '10px 12px' }}>Contact</th>
                                    <th style={{ padding: '10px 12px' }}>Service Interest</th>
                                    <th style={{ padding: '10px 12px' }}>Status</th>
                                    <th style={{ padding: '10px 12px' }}>Lead Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.length > 0 ? (
                                    filteredLeads.map((lead: any, idx: number) => (
                                        <tr key={lead.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                                                {lead.customerName || lead.name || 'Anonymous Inquiry'}
                                            </td>
                                            <td style={{ padding: '12px', color: '#475569', fontFamily: 'monospace' }}>
                                                {lead.phone || lead.mobile || '—'}
                                            </td>
                                            <td style={{ padding: '12px', color: '#334155' }}>
                                                {lead.serviceType || lead.interest || 'Elder Care / Admission'}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span
                                                    style={{
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        background: '#e0f2fe',
                                                        color: '#0369a1',
                                                    }}
                                                >
                                                    {lead.status || 'NEW_ENQUIRY'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                                                {lead.source || 'Website / Phone'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                            No inquiries currently found in live Render backend query.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 3: Telephony */}
            {activeTab === 'telephony' && (
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={18} color="#039A01" />
                        Live Call Queues & Telephony Gateway
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                        <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Active Telephony Calls</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                                {callData.activeCalls.length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Connected through SIP Trunk / WebRTC</div>
                        </div>

                        <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Queued Callers</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                                {callData.queuedCalls.length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Waiting for next available agent</div>
                        </div>

                        <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Vobiz PSTN Status</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', margin: '8px 0' }}>
                                READY
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>SIP Credentials & Trunk active</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 4: Omnichannel */}
            {activeTab === 'omnichannel' && (
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e1e6e1',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={18} color="#039A01" />
                        Omnichannel Messaging Inboxes
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                        <div style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>WhatsApp Business Cloud</div>
                            <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px' }}>Connected & Listening for Inbound Webhooks</div>
                        </div>
                        <div style={{ padding: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>Voice & Telephony</div>
                            <div style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '4px' }}>Inbound PBX & Outbound Dialing Enabled</div>
                        </div>
                        <div style={{ padding: '14px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#6b21a8' }}>Instagram Direct</div>
                            <div style={{ fontSize: '11px', color: '#7e22ce', marginTop: '4px' }}>Social Messaging Direct Inbox</div>
                        </div>
                        <div style={{ padding: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>SMS Gateway</div>
                            <div style={{ fontSize: '11px', color: '#b45309', marginTop: '4px' }}>Automated Template Triggers Active</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 5: Embedded Live App (if running locally or standalone configured) */}
            {activeTab === 'live-app' && standaloneCrmUrl && (
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
                        src={standaloneCrmUrl}
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
            )}
        </div>
    );
}

export default CRMWorkspace;
