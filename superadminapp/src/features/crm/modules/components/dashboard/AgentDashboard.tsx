"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../../nextShim';
import { 
  Phone, PhoneIncoming, PhoneMissed, PhoneForwarded, MessageSquare, 
  Ticket, CheckCircle2, Clock, Users, ArrowUpRight, Shield, 
  AlertTriangle, Flame, Sparkles, Building, Calendar, Layers, 
  Volume2, Play, ChevronRight, RefreshCw, X, ShieldAlert, Target
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../providers/SocketProvider';
import { useCallStore } from '../../store/useCallStore';
import { NumericKeypad } from '../../components/call-center/NumericKeypad';

interface AgentDashboardProps {
  metrics?: any;
}

export function AgentDashboard({ metrics: initialMetrics }: AgentDashboardProps) {
  const router = useRouter();
  const { telephonySocket } = useSocket();
  const { activeCall, status: currentAgentStatus, setStatus } = useCallStore();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live elapsed shift timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Compact Dialpad modal state
  const [showDialpadModal, setShowDialpadModal] = useState(false);

  // Active call logs filter in chart
  const [chartOutcomeFilter, setChartOutcomeFilter] = useState<'all' | 'connected' | 'missed' | 'unanswered' | 'failed'>('all');

  // Load real agent dashboard metrics from backend
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/analytics/agent-dashboard');
      if (res) {
        setDashboardData(res);
        if (res.header?.shiftDurationSeconds) {
          setElapsedSeconds(res.header.shiftDurationSeconds);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch agent-dashboard endpoint:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to live WebSocket events to automatically refresh dashboard
  useEffect(() => {
    if (!telephonySocket) return;

    const handleCallEvent = () => {
      loadDashboardData();
    };

    telephonySocket.on('incoming_call', handleCallEvent);
    telephonySocket.on('callEnded', handleCallEvent);
    telephonySocket.on('callTransferCompleted', handleCallEvent);
    telephonySocket.on('agent_status_change', handleCallEvent);
    telephonySocket.on('ticketCreated', handleCallEvent);
    telephonySocket.on('ticketUpdated', handleCallEvent);

    return () => {
      telephonySocket.off('incoming_call', handleCallEvent);
      telephonySocket.off('callEnded', handleCallEvent);
      telephonySocket.off('callTransferCompleted', handleCallEvent);
      telephonySocket.off('agent_status_change', handleCallEvent);
      telephonySocket.off('ticketCreated', handleCallEvent);
      telephonySocket.off('ticketUpdated', handleCallEvent);
    };
  }, [telephonySocket, loadDashboardData]);

  // Time formatting helper
  const formatSeconds = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Data helpers with safe fallbacks
  const header = dashboardData?.header || {
    agentName: 'Care Coordinator',
    agentStatus: currentAgentStatus || 'AVAILABLE',
    callsHandledToday: initialMetrics?.totalCalls || 0,
    ticketsRaisedToday: initialMetrics?.assignedTickets || 0,
    ticketsResolvedToday: 0,
  };

  const kpis = dashboardData?.kpiCards || {
    callsConnected: initialMetrics?.callsConnected ?? initialMetrics?.totalCalls ?? 0,
    callsMissed: initialMetrics?.callsMissed ?? 0,
    notResponded: 0,
    unreadEnquiries: initialMetrics?.unreadMessages ?? 0,
    repliedEnquiries: 0,
    targetRemaining: 15,
    dailyTarget: 25,
    completedWork: initialMetrics?.totalCalls ?? 0,
    totalTicketsRaised: initialMetrics?.assignedTickets ?? 0,
    pendingTickets: 0,
  };

  const analytics = dashboardData?.analytics || {
    callLogsVolume: [],
    callLogsTotals: { connected: kpis.callsConnected, missed: kpis.callsMissed, unanswered: 0, failed: 0, total: kpis.callsConnected + kpis.callsMissed },
    queueCalls: { waiting: initialMetrics?.queueCalls ?? initialMetrics?.queuedCalls ?? 0, avgWaitTimeSec: 20, abandonmentRate: '0%' },
    transferCalls: { total: 0, completed: 0, cancelled: 0, byDepartment: [], recent: [] },
    newLeadsToday: { total: 0, byFoundation: [], bySource: [] },
    todayFollowups: { scheduled: 0, completed: 0, pending: 0, overdue: 0, list: [] },
    priorityLeads: [],
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 md:p-4 bg-[#F5F7F5] text-[#202020] min-h-screen">
      {/* 4.2 HEADER / AGENT WORK STATUS */}
      <div className="p-5 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Agent Info & Live Working Time */}
        <div className="flex items-center gap-4 z-10">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-[#E7F4E8] border border-[#C8E6CA] flex items-center justify-center font-bold text-lg text-[#026601] shadow-xs">
              {header.agentName.charAt(0)}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#FFFFFF] ${
              header.agentStatus === 'AVAILABLE'
                ? 'bg-emerald-500'
                : header.agentStatus === 'BUSY'
                ? 'bg-amber-500'
                : header.agentStatus === 'BREAK'
                ? 'bg-purple-500'
                : 'bg-slate-400'
            }`}></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#202020] tracking-tight">{header.agentName}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                header.agentStatus === 'AVAILABLE'
                  ? 'bg-[#E7F4E8] text-[#026601] border-[#C8E6CA]'
                  : header.agentStatus === 'BUSY'
                  ? 'bg-[#FFF8E6] text-[#8C5E05] border-[#FBE5AC]'
                  : 'bg-[#F1F4F2] text-[#4A5650] border-[#DDE2DE]'
              }`}>
                {header.agentStatus}
              </span>
            </div>
            
            {/* Shift working-time duration counter */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F6962] mt-1">
              <div className="flex items-center gap-1.5 font-mono text-[#026601] bg-[#E7F4E8] px-2 py-0.5 rounded border border-[#C8E6CA]">
                <Clock className="w-3.5 h-3.5" />
                <span>Shift Duration: <strong>{formatSeconds(elapsedSeconds)}</strong></span>
              </div>
              <span className="text-[#E1E6E1]">•</span>
              <span>Calls Today: <strong className="text-[#202020]">{header.callsHandledToday}</strong></span>
              <span className="text-[#E1E6E1]">•</span>
              <span>Tickets Raised: <strong className="text-[#202020]">{header.ticketsRaisedToday}</strong></span>
              <span className="text-[#E1E6E1]">•</span>
              <span>Resolved: <strong className="text-[#026601]">{header.ticketsResolvedToday}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls & Compact Dialpad Launcher */}
        <div className="flex items-center gap-3 z-10 self-start lg:self-auto">
          <button
            onClick={() => setShowDialpadModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[#FAFCFA] hover:bg-[#F5F7F5] border border-[#E1E6E1] hover:border-[#039A01] text-xs font-bold text-[#202020] flex items-center gap-2 transition-all shadow-xs active:scale-95"
          >
            <Phone className="w-3.5 h-3.5 text-[#039A01]" />
            <span>Open Dialpad</span>
          </button>

          <button
            onClick={() => router.push('/call-logs')}
            className="px-3.5 py-2 rounded-lg bg-[#039A01] hover:bg-[#028001] text-xs font-bold text-white flex items-center gap-2 transition-all shadow-xs active:scale-95"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Call Logs</span>
          </button>
        </div>
      </div>

      {/* 4.3 8 KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Calls Connected */}
        <div 
          onClick={() => router.push('/call-logs?status=CONNECTED&group=today')}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E1E6E1] hover:border-[#039A01] shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-[126px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5F6962]">Calls Connected</span>
            <div className="p-1.5 bg-[#E7F4E8] rounded-md text-[#026601]">
              <PhoneIncoming className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#202020] tracking-tight">{kpis.callsConnected}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#026601] mt-1 font-semibold">
              <span>Answered calls today</span>
              <ArrowUpRight className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        {/* 2. Total Calls Missed */}
        <div 
          onClick={() => router.push('/call-logs?status=MISSED&group=today')}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E1E6E1] hover:border-[#FBE5AC] shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-[126px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5F6962]">Calls Missed</span>
            <div className="p-1.5 bg-[#FFF8E6] rounded-md text-[#8C5E05]">
              <PhoneMissed className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#202020] tracking-tight">{kpis.callsMissed}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#8C5E05] mt-1 font-semibold">
              <span>Inbound missed calls</span>
              <ArrowUpRight className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        {/* 3. Not Responded */}
        <div 
          onClick={() => router.push('/omnichannel?filter=not_responded')}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E1E6E1] hover:border-[#F8C8C8] shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-[126px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5F6962]">Not Responded</span>
            <div className="p-1.5 bg-[#FDF2F2] rounded-md text-[#B91C1C]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#202020] tracking-tight">{kpis.notResponded}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#B91C1C] mt-1 font-semibold">
              <span>Over SLA response rule</span>
              <ArrowUpRight className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        {/* 4. Omnichannel Unread Enquiries */}
        <div 
          onClick={() => router.push('/omnichannel?filter=unread')}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E1E6E1] hover:border-[#CBE2FE] shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-[126px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5F6962]">Unread Enquiries</span>
            <div className="p-1.5 bg-[#F0F7FF] rounded-md text-[#1D4ED8]">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#202020] tracking-tight">{kpis.unreadEnquiries}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#1D4ED8] mt-1 font-semibold">
              <span>Awaiting agent read</span>
              <ArrowUpRight className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        {/* 5. Omnichannel Replied */}
        <div 
          onClick={() => router.push('/omnichannel?filter=replied')}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E1E6E1] hover:border-[#C8E6CA] shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-[126px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5F6962]">Replied Today</span>
            <div className="p-1.5 bg-[#E7F4E8] rounded-md text-[#026601]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#202020] tracking-tight">{kpis.repliedEnquiries}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#026601] mt-1 font-semibold">
              <span>Conversations responded</span>
              <ArrowUpRight className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        {/* 6. Today's Target Remaining */}
        <div 
          onClick={() => router.push('/targets')}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E1E6E1] hover:border-[#039A01] shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-[126px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5F6962]">Target Remaining</span>
            <div className="p-1.5 bg-[#E7F4E8] rounded-md text-[#026601]">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#202020] tracking-tight">{kpis.targetRemaining}</div>
            <div className="w-full bg-[#EFF3EF] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-[#039A01] h-full rounded-full transition-all" 
                style={{ width: `${Math.min(((kpis.completedWork || 0) / (kpis.dailyTarget || 25)) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] text-[#5F6962] mt-1 font-semibold">
              <span>{kpis.completedWork} completed</span>
              <span>{kpis.dailyTarget} goal</span>
            </div>
          </div>
        </div>

        {/* 7. Total Tickets Raised */}
        <div 
          onClick={() => router.push('/tickets')}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E1E6E1] hover:border-[#FBE5AC] shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-[126px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5F6962]">Total Tickets Raised</span>
            <div className="p-1.5 bg-[#FFF8E6] rounded-md text-[#8C5E05]">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#202020] tracking-tight">{kpis.totalTicketsRaised ?? 0}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#8C5E05] mt-1 font-semibold">
              <span>Created by agent</span>
              <ArrowUpRight className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        {/* 8. Pending Tickets */}
        <div 
          onClick={() => router.push('/agent/tickets')}
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E1E6E1] hover:border-[#FBE5AC] shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-[126px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5F6962]">Pending Tickets</span>
            <div className="p-1.5 bg-[#FFF8E6] rounded-md text-[#8C5E05]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#202020] tracking-tight">{kpis.pendingTickets ?? 0}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#8C5E05] mt-1 font-semibold">
              <span>Assigned awaiting resolution</span>
              <ArrowUpRight className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" />
            </div>
          </div>
        </div>
      </div>

      {/* 4.4 SIX SEPARATE ANALYTICAL CHARTS / VISUAL PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL A: CALL LOGS VOLUME OVER TIME */}
        <div className="p-6 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#202020] flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#039A01]" />
                Call Logs Volume (24 Hours)
              </h2>
              <p className="text-xs text-[#5F6962]">Distribution of today's call volume across outcome categories</p>
            </div>
            <button
              onClick={() => router.push('/call-logs')}
              className="text-xs text-[#026601] hover:underline font-bold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Full History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Outcome Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-4 text-[11px]">
            <button
              onClick={() => setChartOutcomeFilter('all')}
              className={`px-2.5 py-1 rounded-md border font-semibold transition-all ${
                chartOutcomeFilter === 'all'
                  ? 'bg-[#E7F4E8] text-[#026601] border-[#C8E6CA]'
                  : 'bg-[#FAFCFA] text-[#5F6962] border-[#E1E6E1]'
              }`}
            >
              Total: {analytics.callLogsTotals?.total || 0}
            </button>
            <button
              onClick={() => setChartOutcomeFilter('connected')}
              className={`px-2.5 py-1 rounded-md border font-semibold transition-all ${
                chartOutcomeFilter === 'connected'
                  ? 'bg-[#E7F4E8] text-[#026601] border-[#C8E6CA]'
                  : 'bg-[#FAFCFA] text-[#5F6962] border-[#E1E6E1]'
              }`}
            >
              Connected: {analytics.callLogsTotals?.connected || 0}
            </button>
            <button
              onClick={() => setChartOutcomeFilter('missed')}
              className={`px-2.5 py-1 rounded-md border font-semibold transition-all ${
                chartOutcomeFilter === 'missed'
                  ? 'bg-[#FFF8E6] text-[#8C5E05] border-[#FBE5AC]'
                  : 'bg-[#FAFCFA] text-[#5F6962] border-[#E1E6E1]'
              }`}
            >
              Missed: {analytics.callLogsTotals?.missed || 0}
            </button>
            <button
              onClick={() => setChartOutcomeFilter('unanswered')}
              className={`px-2.5 py-1 rounded-md border font-semibold transition-all ${
                chartOutcomeFilter === 'unanswered'
                  ? 'bg-[#F0F7FF] text-[#1D4ED8] border-[#CBE2FE]'
                  : 'bg-[#FAFCFA] text-[#5F6962] border-[#E1E6E1]'
              }`}
            >
              Unanswered: {analytics.callLogsTotals?.unanswered || 0}
            </button>
          </div>

          {/* Hourly Volume Bar Visualization */}
          <div className="flex-1 flex items-end gap-1.5 h-36 pt-6 pb-2 px-2 bg-[#FAFCFA] rounded-lg border border-[#E1E6E1]">
            {(analytics.callLogsVolume?.length ? analytics.callLogsVolume : Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, total: 0, connected: 0, missed: 0, unanswered: 0, failed: 0 }))).slice(8, 20).map((hourData: any, i: number) => {
              const val = chartOutcomeFilter === 'connected'
                ? hourData.connected
                : chartOutcomeFilter === 'missed'
                ? hourData.missed
                : chartOutcomeFilter === 'unanswered'
                ? hourData.unanswered
                : hourData.total;
              const maxVal = Math.max(...(analytics.callLogsVolume || []).map((h: any) => h.total || 0), 5);
              const heightPct = Math.max(Math.round((val / maxVal) * 100), 8);

              return (
                <div 
                  key={i} 
                  className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                  onClick={() => router.push(`/call-logs?group=today`)}
                >
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-[#202020] text-white px-2 py-0.5 rounded text-[9px] font-mono pointer-events-none transition-opacity whitespace-nowrap z-20">
                    {hourData.hour}: {val} calls
                  </div>

                  <div 
                    className={`w-full rounded-t-sm transition-all ${
                      chartOutcomeFilter === 'connected'
                        ? 'bg-[#039A01]'
                        : chartOutcomeFilter === 'missed'
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#633B32]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <span className="text-[9px] font-mono text-[#5F6962]">
                    {hourData.hour.split(':')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL B: LIVE QUEUE CALLS */}
        <div className="p-6 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#202020] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#039A01]" />
                  Live Queue Calls
                </h2>
                <p className="text-xs text-[#5F6962]">Incoming call traffic, wait times and SLA threshold</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#039A01] animate-pulse"></span> Live Sync
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3.5 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg text-center">
                <span className="text-[10px] text-[#5F6962] uppercase font-bold tracking-wider">In Queue</span>
                <div className="text-2xl font-extrabold text-[#039A01] mt-0.5">{analytics.queueCalls?.waiting || 0}</div>
              </div>
              <div className="p-3.5 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg text-center">
                <span className="text-[10px] text-[#5F6962] uppercase font-bold tracking-wider">Avg Wait Time</span>
                <div className="text-2xl font-extrabold text-[#202020] mt-0.5">{analytics.queueCalls?.avgWaitTimeSec || 0}s</div>
              </div>
              <div className="p-3.5 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg text-center">
                <span className="text-[10px] text-[#5F6962] uppercase font-bold tracking-wider">Abandon Rate</span>
                <div className="text-2xl font-extrabold text-[#8C5E05] mt-0.5">{analytics.queueCalls?.abandonmentRate || '0%'}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg flex items-center justify-between text-xs">
            <span className="text-[#5F6962] font-medium">Ready to accept queue calls?</span>
            <button
              onClick={() => setStatus('AVAILABLE')}
              className="px-3 py-1.5 rounded-md bg-[#039A01] hover:bg-[#028001] text-white font-bold text-xs transition-all shadow-xs"
            >
              Set Available
            </button>
          </div>
        </div>

        {/* PANEL C: TRANSFER CALLS DIRECTORY & RECENT AUDITS */}
        <div className="p-6 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#202020] flex items-center gap-2">
                  <PhoneForwarded className="w-4 h-4 text-[#039A01]" />
                  Transfer Calls Activity
                </h2>
                <p className="text-xs text-[#5F6962]">Department shifts, handoffs and outcomes</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-[#026601] font-semibold">{analytics.transferCalls?.completed || 0} Completed</span>
                <span className="text-[#E1E6E1]">•</span>
                <span className="text-[#5F6962] font-semibold">{analytics.transferCalls?.total || 0} Total</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {analytics.transferCalls?.byDepartment?.length > 0 ? (
                analytics.transferCalls.byDepartment.map((deptData: any, i: number) => (
                  <div key={i} className="p-2.5 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#202020]">{deptData.department}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#026601] font-mono">{deptData.completed} completed</span>
                      <span className="text-[#5F6962] font-mono">{deptData.total} requested</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg text-center text-xs text-[#5F6962]">
                  No inter-department call transfers recorded today
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push('/call-logs?transferStatus=TRANSFERRED')}
            className="w-full py-2 bg-[#FAFCFA] hover:bg-[#F5F7F5] border border-[#E1E6E1] rounded-lg text-xs font-bold text-[#202020] hover:text-[#039A01] transition-all text-center"
          >
            View Complete Transfer Logs
          </button>
        </div>

        {/* PANEL D: NEW LEADS TODAY BREAKDOWN */}
        <div className="p-6 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#202020] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#039A01]" />
                  New Leads Today
                </h2>
                <p className="text-xs text-[#5F6962]">Breakdown by foundation and service channel</p>
              </div>
              <button
                onClick={() => router.push('/leads/pool')}
                className="text-xs text-[#026601] hover:underline font-bold flex items-center gap-1"
              >
                <span>Lead Pool</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {analytics.newLeadsToday?.byFoundation?.length > 0 ? (
                analytics.newLeadsToday.byFoundation.map((f: any, i: number) => (
                  <div key={i} className="p-3 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg">
                    <span className="text-[10px] text-[#5F6962] uppercase font-bold tracking-wider">{f.name || 'Foundation'}</span>
                    <div className="text-xl font-bold text-[#202020] mt-0.5">{f.count} leads</div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-4 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg text-center text-xs text-[#5F6962]">
                  No new leads ingested yet today
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[#5F6962] pt-2 border-t border-[#E1E6E1]">
            <span className="text-[#202020] font-semibold">Sources:</span>
            {analytics.newLeadsToday?.bySource?.map((s: any, i: number) => (
              <span key={i} className="bg-[#FAFCFA] px-2 py-0.5 rounded border border-[#E1E6E1] text-[11px] text-[#202020]">
                {s.source}: {s.count}
              </span>
            ))}
          </div>
        </div>

        {/* PANEL E: TODAY'S FOLLOW-UPS QUEUE */}
        <div className="p-6 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#202020] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#039A01]" />
                  Today&apos;s Follow-ups Queue
                </h2>
                <p className="text-xs text-[#5F6962]">Scheduled, pending and overdue callbacks</p>
              </div>
              <div className="flex gap-2 text-[11px] font-semibold">
                <span className="text-[#8C5E05]">{analytics.todayFollowups?.pending || 0} Pending</span>
                <span className="text-[#E1E6E1]">•</span>
                <span className="text-[#026601]">{analytics.todayFollowups?.completed || 0} Done</span>
              </div>
            </div>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
              {analytics.todayFollowups?.list?.length > 0 ? (
                analytics.todayFollowups.list.map((item: any) => (
                  <div key={item.id} className="p-2.5 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#202020]">{item.leadName}</p>
                      <p className="text-[10px] text-[#5F6962] font-mono">{item.phoneNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'COMPLETED'
                          ? 'bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA]'
                          : 'bg-[#FFF8E6] text-[#8C5E05] border border-[#FBE5AC]'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg text-center text-xs text-[#5F6962]">
                  No callbacks scheduled for today
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push('/calendar')}
            className="w-full py-2 bg-[#FAFCFA] hover:bg-[#F5F7F5] border border-[#E1E6E1] rounded-lg text-xs font-bold text-[#202020] hover:text-[#039A01] transition-all text-center"
          >
            Open Full Calendar Log
          </button>
        </div>

        {/* PANEL F: PRIORITY-BASED NEW LEADS */}
        <div className="p-6 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#202020] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />
                  Priority-Based Leads Queue
                </h2>
                <p className="text-xs text-[#5F6962]">Emergency & High priority intake requests</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF2F2] text-[#B91C1C] border border-[#F8C8C8]">
                Critical First
              </span>
            </div>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
              {analytics.priorityLeads?.length > 0 ? (
                analytics.priorityLeads.map((lead: any) => (
                  <div 
                    key={lead.id}
                    onClick={() => router.push(`/leads/pool?leadId=${lead.id}`)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      lead.isEmergency || lead.priority === 'EMERGENCY'
                        ? 'bg-[#FDF2F2] border-[#F8C8C8] hover:border-[#B91C1C]'
                        : lead.priority === 'HIGH'
                        ? 'bg-[#FFF8E6] border-[#FBE5AC] hover:border-[#8C5E05]'
                        : 'bg-[#FAFCFA] border-[#E1E6E1] hover:border-[#039A01]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#202020]">{lead.name}</span>
                        {lead.isEmergency && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-[#B91C1C] text-white px-1.5 py-0.2 rounded">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#5F6962] mt-0.5">{lead.service} • {lead.foundation}</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lead.priority === 'EMERGENCY'
                          ? 'bg-[#FDF2F2] text-[#B91C1C]'
                          : lead.priority === 'HIGH'
                          ? 'bg-[#FFF8E6] text-[#8C5E05]'
                          : 'bg-[#F1F4F2] text-[#4A5650]'
                      }`}>
                        {lead.priority}
                      </span>
                      <span className="text-[9px] text-[#5F6962] block mt-0.5">{lead.phone}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-[#FAFCFA] border border-[#E1E6E1] rounded-lg text-center text-xs text-[#5F6962]">
                  No active priority leads in queue
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push('/leads/pool')}
            className="w-full py-2 bg-[#FAFCFA] hover:bg-[#F5F7F5] border border-[#E1E6E1] rounded-lg text-xs font-bold text-[#202020] hover:text-[#039A01] transition-all text-center"
          >
            Review All Ingested Leads
          </button>
        </div>
      </div>

      {/* 4.5 COMPACT DIALPAD MODAL */}
      {showDialpadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-[#FFFFFF] border border-[#E1E6E1] rounded-2xl overflow-hidden shadow-2xl relative text-[#202020]">
            <div className="p-3.5 border-b border-[#E1E6E1] flex items-center justify-between bg-[#FAFCFA]">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#039A01]" />
                <h3 className="font-bold text-xs text-[#202020]">Telephony Dialpad</h3>
              </div>
              <button
                onClick={() => setShowDialpadModal(false)}
                className="w-7 h-7 rounded-lg bg-[#FAFCFA] hover:bg-[#F5F7F5] border border-[#E1E6E1] flex items-center justify-center text-[#5F6962] hover:text-[#202020]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <NumericKeypad onCallInitiated={() => setShowDialpadModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
