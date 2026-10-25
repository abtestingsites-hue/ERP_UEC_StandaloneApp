"use client";

import React, { useState, useEffect } from 'react';
import { Users, Phone, PhoneOutgoing, Video, ShieldCheck, PhoneCall, PhoneOff } from "lucide-react";
import { useCallStore } from "../../../store/useCallStore";
import { CallWidget } from "../../../components/call-center/CallWidget";
import { NumericKeypad } from "../../../components/call-center/NumericKeypad";

import { SocketContext } from '../../../providers/SocketProvider';
import { apiFetch } from '../../../lib/api';

interface Agent {
  id: string;
  userId: string;
  name: string;
  role: string;
  email: string;
  status: string;
  department: string;
}

export default function AgentCallCenter() {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setActiveCall, queuedCalls, missedCalls } = useCallStore();
  const { telephonySocket, mediaSocket } = React.useContext(SocketContext);

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
        const target = prev.find(a => a.userId === data.agentId || a.id === data.agentId);
        if (!target || target.status === data.status) return prev;
        return prev.map(a =>
          a.userId === data.agentId || a.id === data.agentId
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
        urgency: 'NORMAL',
        category: agent.department,
        isCaller: true,
        accepted: false
      } as any);

      if (mediaSocket) {
        let currentAgentName = 'Agent';
        try {
          const stored = localStorage.getItem('crm_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            let rawName = parsed.name || parsed.email || 'Agent';
            if (rawName.includes('@')) rawName = rawName.split('@')[0];
            currentAgentName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          }
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

        mediaSocket.emit('initiateCall', {
          targetAgentId: agent.id,
          callSid: roomName,
          customerName: currentAgentName
        });
      }
    } catch (e) {
      console.error('Failed to initiate WebRTC call:', e);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden bg-[#F5F7F5] text-[#202020]">
      <header className="mb-5 flex flex-col md:flex-row justify-between items-start md:items-end shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E7F4E8] border border-[#C8E6CA] flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-[#026601]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#202020]">Call Center</h1>
            <p className="text-[#5F6962] mt-0.5 text-xs md:text-sm">Agent Workspace & Communication Hub</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#FFFFFF] border border-[#E1E6E1] rounded-lg p-1 w-full md:w-auto shadow-xs">
          <button
            onClick={() => setActiveTab('inbound')}
            className={`flex-1 md:flex-none px-4 md:px-5 py-1.5 rounded-md text-xs font-bold flex justify-center items-center gap-2 transition-colors ${
              activeTab === 'inbound' ? 'bg-[#039A01] text-white shadow-xs' : 'text-[#5F6962] hover:text-[#202020]'
            }`}
          >
            <Phone className="w-3.5 h-3.5 hidden sm:block" /> Inbound
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={`flex-1 md:flex-none px-4 md:px-5 py-1.5 rounded-md text-xs font-bold flex justify-center items-center gap-2 transition-colors ${
              activeTab === 'outbound' ? 'bg-[#039A01] text-white shadow-xs' : 'text-[#5F6962] hover:text-[#202020]'
            }`}
          >
            <PhoneOutgoing className="w-3.5 h-3.5 hidden sm:block" /> Outbound
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">

        {/* Left Side: Dynamic Content based on Tab */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 shrink-0 lg:shrink min-h-[500px] lg:min-h-0">
          <div className="flex-1 flex flex-col bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-xs overflow-hidden">
            {activeTab === 'inbound' ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-[#E1E6E1] bg-[#FAFCFA]">
                  <h2 className="text-sm font-bold text-[#202020] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#039A01]" /> Internal Directory
                  </h2>
                  <p className="text-xs text-[#5F6962] mt-0.5">Staff, Admins, and Super Admins</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full text-[#5F6962]">
                      <div className="w-5 h-5 border-2 border-[#039A01]/20 border-t-[#039A01] rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {agents.map((agent) => (
                        <div key={agent.id} className="flex justify-between items-center p-3.5 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg hover:border-[#039A01] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#E7F4E8] text-[#026601] flex items-center justify-center font-bold text-xs shrink-0">
                              {agent.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#202020] flex items-center gap-2 truncate">
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
                          <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-[#5F6962]">
                              <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'AVAILABLE' ? 'bg-[#039A01]' : 'bg-[#B91C1C]'}`}></span>
                              {agent.status}
                            </span>
                            <button
                              onClick={() => handleWebRtcCall(agent)}
                              className="bg-[#E7F4E8] hover:bg-[#039A01] text-[#026601] hover:text-white p-2 rounded-lg transition-colors"
                              title="Call via WebRTC"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-[#FFFFFF]">
                {/* Dialer Section */}
                <div className="p-4 border-b border-[#E1E6E1]">
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
                      } as any);
                    }}
                  />
                </div>

                {/* Lists Section */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#5F6962] uppercase tracking-wider mb-2">Queued Calls ({queuedCalls.length})</h3>
                    {queuedCalls.length === 0 ? (
                      <p className="text-xs text-[#849389] py-2">No calls currently waiting</p>
                    ) : (
                      <div className="space-y-2">
                        {queuedCalls.map((c, i) => (
                          <div key={i} className="p-2.5 rounded-lg border border-[#E1E6E1] bg-[#FAFCFA] flex justify-between items-center text-xs">
                            <span className="font-semibold">{c.caller || c.from || 'Caller'}</span>
                            <span className="text-[10px] bg-[#E7F4E8] text-[#026601] px-2 py-0.5 rounded font-bold">{c.waitDuration || '0m'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Call Widget Panel */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 shrink-0 lg:shrink min-h-[400px] lg:min-h-0">
          <div className="flex-1 flex flex-col bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-xs p-4 overflow-hidden">
            <CallWidget />
          </div>
        </div>

      </div>
    </div>
  );
}
