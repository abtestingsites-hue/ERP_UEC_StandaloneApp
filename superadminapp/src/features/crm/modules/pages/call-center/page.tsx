"use client";

import React, { useState, useEffect } from 'react';
import { Users, Phone, PhoneOutgoing, Video, ShieldCheck, Activity } from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useSocket } from "../../providers/SocketProvider";
import { CallWidget } from "../../components/call-center/CallWidget";
import { NumericKeypad } from "../../components/call-center/NumericKeypad";
import { QueueOperationsView } from "../../components/call-center/QueueOperationsView";
import { apiFetch } from '../../lib/api';

interface Agent {
  id: string;
  userId?: string;
  name: string;
  role: string;
  email: string;
  status: string;
  department: string;
}

export default function CallCenterPage() {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound' | 'internal' | 'queue'>('inbound');
  const [dialNumber, setDialNumber] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setActiveCall, queuedCalls, missedCalls, fetchDashboardCalls } = useCallStore();
  const { mediaSocket, telephonySocket } = useSocket();

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await apiFetch(`/api/v1/agents`);
        if (res.ok) {
          const data = await res.json();
          const formattedAgents = (data.agents || []).map((a: any) => {
            let rawName = a.name || a.email || 'Agent';
            if (rawName.includes('@')) rawName = rawName.split('@')[0];
            return {
              ...a,
              name: rawName.charAt(0).toUpperCase() + rawName.slice(1)
            };
          });

          let currentAgentId = null;
          try {
            const stored = localStorage.getItem('crm_user');
            if (stored) currentAgentId = JSON.parse(stored).agentId;
          } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

          setAgents(formattedAgents.filter((a: any) => a.id !== currentAgentId));
        }
      } catch (err) {
        console.error("Failed to fetch agents", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgents();
  }, []);

  // Reconcile active call state on mount to prevent zombie/stale calls after page navigation
  useEffect(() => {
    const reconcileActiveCall = async () => {
      try {
        const { activeCall, setActiveCall, setStatus } = useCallStore.getState();
        if (activeCall) {
          const res = await apiFetch('/telephony/my-active-call');
          if (res.ok) {
            const data = await res.json();
            if (!data.activeCall) {
              console.log('[CALL-RECONCILIATION] Backend reports no active call. Clearing stale activeCall.');
              setActiveCall(null);
              setStatus('AVAILABLE');
            }
          }
        }
      } catch (err) {
        console.warn('[CALL-RECONCILIATION] Error during active call reconciliation:', err);
      }
    };
    reconcileActiveCall();
  }, []);

  useEffect(() => {
    const handleStatusChange = (data: any) => {
      if (!data || !data.agentId) return;
      setAgents(prev => {
        const target = prev.find(a => a.id === data.agentId || a.userId === data.agentId);
        if (!target || target.status === data.status) return prev;
        return prev.map(a =>
          a.id === data.agentId || a.userId === data.agentId
            ? { ...a, status: data.status }
            : a
        );
      });
    };

    const activeSocket = telephonySocket || mediaSocket;
    if (activeSocket) {
      activeSocket.on('agent_status_change', handleStatusChange);
    }

    return () => {
      if (activeSocket) {
        activeSocket.off('agent_status_change', handleStatusChange);
      }
    };
  }, [telephonySocket, mediaSocket]);

  const handleWebRtcCall = async (agent: Agent) => {
    try {
      const roomName = `room_${agent.id.substring(0, 8)}`;

      setActiveCall({
        callSid: roomName,
        customerName: agent.name,
        phone: 'Internal',
        urgency: 'NORMAL',
        category: agent.department,
        isCaller: true,
        accepted: false
      });

      if (mediaSocket) {
        let currentAgentName = 'Super Admin';
        try {
          const stored = localStorage.getItem('crm_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            let rawName = parsed.name || parsed.email || 'Super Admin';
            if (rawName.includes('@')) rawName = rawName.split('@')[0];
            currentAgentName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          }
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

        mediaSocket.emit('initiateCall', {
          targetAgentId: agent.id, // Ensure this matches what backend redis is storing
          callSid: roomName,
          customerName: currentAgentName
        });
      }
    } catch (e) {
      console.error('Failed to initiate WebRTC call:', e);
    }
  };

  const handleOutboundDial = async () => {
    if (!dialNumber) return;
    setIsDialing(true);
    try {
      let currentAgentId = null;
      try {
        const stored = localStorage.getItem('crm_user');
        if (stored) {
          currentAgentId = JSON.parse(stored).agentId;
        }
      } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

      const res = await apiFetch('/telephony/calls/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: dialNumber,
          agentId: currentAgentId
        })
      });

      if (res.ok) {
        const data = await res.json();
        const finalRoomName = data.roomName || data.callSid || `room_${Date.now()}`;
        setActiveCall({
          callSid: finalRoomName,
          roomName: finalRoomName,
          customerName: 'Customer',
          phone: dialNumber,
          urgency: 'NORMAL',
          category: 'Outbound',
          direction: 'OUTBOUND',
          status: 'DIALING',
          isCaller: true,
          accepted: true,
          token: data.token,
          serverUrl: data.serverUrl || data.wsUrl
        });
      } else {
        console.error('Failed to dial outbound');
        alert('Failed to initiate outbound call.');
      }
    } catch (e) {
      console.error('Error dialing out:', e);
      alert('Error initiating call.');
    } finally {
      setIsDialing(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-3 sm:p-5 lg:p-6 bg-[#F5F7F5] text-[#202020] min-h-0 overflow-y-auto lg:overflow-hidden">
      <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4 shrink-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202020]">Call Center</h1>
          <p className="text-xs sm:text-sm text-[#5F6962] mt-0.5 sm:mt-1">Manage active WebRTC calls, queue board, and live interactions.</p>
        </div>

        {/* Tabs: horizontal scrollable on mobile, compact pills */}
        <div className="flex bg-white border border-[#E1E6E1] rounded-xl p-1 shadow-xs overflow-x-auto max-w-full custom-scrollbar">
          <button
            onClick={() => setActiveTab('inbound')}
            className={`px-3 sm:px-5 lg:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'inbound' ? 'bg-[#E7F4E8] text-[#026601] shadow-xs' : 'text-[#5F6962] hover:text-[#202020]'}`}
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Inbound
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={`px-3 sm:px-5 lg:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'outbound' ? 'bg-[#E7F4E8] text-[#026601] shadow-xs' : 'text-[#5F6962] hover:text-[#202020]'}`}
          >
            <PhoneOutgoing className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Outbound
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-3 sm:px-5 lg:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'internal' ? 'bg-[#E7F4E8] text-[#026601] shadow-xs' : 'text-[#5F6962] hover:text-[#202020]'}`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Internal
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 sm:px-5 lg:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'queue' ? 'bg-[#E7F4E8] text-[#026601] shadow-xs' : 'text-[#5F6962] hover:text-[#202020]'}`}
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#039A01]" /> Queue Engine
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-0">

        {/* Left Side: Dynamic Content based on Tab */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white border border-[#E1E6E1] rounded-2xl shadow-sm overflow-hidden min-h-[380px] lg:min-h-0">
          {activeTab === 'queue' && (
            <QueueOperationsView />
          )}

          {activeTab === 'internal' && (
            <div className="flex flex-col h-full">
              <div className="p-3.5 sm:p-5 border-b border-[#E1E6E1] bg-[#F5F7F5]">
                <h2 className="text-base sm:text-lg font-bold text-[#202020] flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#039A01] shrink-0" /> Internal Directory
                </h2>
                <p className="text-[11px] sm:text-xs text-[#5F6962] mt-0.5">Staff, Admins, and Super Admins</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 custom-scrollbar">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full text-[#5F6962]">
                    <div className="w-5 h-5 border-2 border-[#C8E6CA] border-t-[#039A01] rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agents.map((agent) => (
                      <div key={agent.id} className="flex justify-between items-center p-3 sm:p-4 bg-[#F5F7F5] border border-[#E1E6E1] rounded-xl hover:border-[#039A01] transition-colors">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E7F4E8] text-[#026601] flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-[#202020] flex items-center gap-1.5 sm:gap-2 truncate">
                              {agent.name}
                              {(agent.role === 'ADMIN' || agent.role === 'SUPER_ADMIN') && (
                                <ShieldCheck className="w-3.5 h-3.5 text-[#039A01] shrink-0" />
                              )}
                            </h4>
                            <p className="text-[10px] text-[#5F6962] capitalize truncate">
                              {agent.role ? agent.role.replace('_', ' ') : 'Agent'} • {agent.department || 'General'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                          <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-[#5F6962]">
                            <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'AVAILABLE' ? 'bg-[#039A01]' : 'bg-rose-500'}`}></span>
                            {agent.status}
                          </span>
                          <button
                            onClick={() => handleWebRtcCall(agent)}
                            className="bg-[#E7F4E8] hover:bg-[#C8E6CA] text-[#026601] p-1.5 sm:p-2 rounded-lg transition-colors"
                            title="Call via WebRTC"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inbound' && (
            <div className="flex flex-col h-full">
              <div className="p-3.5 sm:p-5 border-b border-[#E1E6E1] bg-[#F5F7F5] flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-[#202020] flex items-center gap-2 truncate">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#039A01] shrink-0" /> Inbound Call Logs
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[#5F6962] mt-0.5 truncate">Recent queued and missed inbound calls</p>
                </div>
                <button onClick={() => fetchDashboardCalls()} className="bg-white hover:bg-[#E7F4E8] border border-[#E1E6E1] text-[#202020] hover:text-[#039A01] text-xs px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0">Refresh</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 custom-scrollbar space-y-4 sm:space-y-6">
                
                {/* Queued Calls */}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#5F6962] mb-2 sm:mb-3">Currently Ringing / Queued</h3>
                  {(!queuedCalls || queuedCalls.length === 0) ? (
                    <div className="text-center p-4 sm:p-6 bg-[#F5F7F5] border border-[#E1E6E1] rounded-xl text-[#5F6962] text-xs sm:text-sm">No active inbound calls</div>
                  ) : (
                    <div className="space-y-2.5 sm:space-y-3">
                      {queuedCalls.map((call: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 sm:p-4 bg-[#F5F7F5] border border-[#E1E6E1] rounded-xl hover:border-[#039A01] transition-colors cursor-pointer">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E7F4E8] text-[#026601] flex items-center justify-center shrink-0">
                              <Phone className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[#202020] truncate">{call.customer?.name || 'Unknown Caller'}</h4>
                              <p className="text-[11px] sm:text-xs text-[#5F6962] truncate">{call.customer?.phone || call.transferHistory?.phone || call.reason || 'Unknown Number'}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="px-2 py-0.5 sm:py-1 bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA] rounded text-[10px] sm:text-xs font-bold">RINGING</span>
                            <div className="text-[10px] sm:text-xs text-[#5F6962] mt-0.5 sm:mt-1">{new Date(call.startedAt || call.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Missed Calls */}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#5F6962] mb-2 sm:mb-3">Recent Missed Calls</h3>
                  {(!missedCalls || missedCalls.length === 0) ? (
                    <div className="text-center p-4 sm:p-6 bg-[#F5F7F5] border border-[#E1E6E1] rounded-xl text-[#5F6962] text-xs sm:text-sm">No recent missed calls</div>
                  ) : (
                    <div className="space-y-2.5 sm:space-y-3">
                      {missedCalls.map((call: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 sm:p-4 bg-rose-50/50 border border-rose-200 rounded-xl">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[#202020] truncate">{call.customer?.name || 'Unknown Caller'}</h4>
                              <p className="text-[11px] sm:text-xs text-[#5F6962] truncate">{call.customer?.phone || call.transferHistory?.phone || call.reason || 'Unknown Number'}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="px-2 py-0.5 sm:py-1 bg-rose-100 text-rose-700 rounded text-[10px] sm:text-xs font-bold">MISSED</span>
                            <div className="text-[10px] sm:text-xs text-[#5F6962] mt-0.5 sm:mt-1">{new Date(call.startedAt || call.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {activeTab === 'outbound' && (
            <div className="flex flex-col items-center justify-center h-full p-4 overflow-y-auto custom-scrollbar">
              <NumericKeypad
                onCallInitiated={(data) => {
                  const finalRoomName = data.roomName || data.callSid || `room_${Date.now()}`;
                  setActiveCall({
                    callSid: finalRoomName,
                    roomName: finalRoomName,
                    customerName: 'Customer',
                    phone: data.to || 'Customer',
                    urgency: 'NORMAL',
                    category: 'Outbound',
                    direction: 'OUTBOUND',
                    status: 'DIALING',
                    isCaller: true,
                    accepted: true,
                    token: data.token,
                    serverUrl: data.serverUrl || data.wsUrl
                  });
                }}
              />
            </div>
          )}
        </div>

        {/* Right Side: Active WebRTC Phone System */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white border border-[#E1E6E1] rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 items-center justify-center min-h-[320px] lg:min-h-0">
          <CallWidget />
        </div>
      </div>
    </div>
  );
}
