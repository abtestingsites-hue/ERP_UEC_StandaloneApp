"use client";

import React, { useEffect, useState } from 'react';
import { Mic, Play, Download, Search, Filter, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function AIRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        let role = '';
        let agentId = '';
        try {
          const stored = localStorage.getItem('crm_user');
          if (stored) {
            const user = JSON.parse(stored);
            role = user.role;
            agentId = user.agentId || user.id;
          }
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

        const res = await apiFetch('/api/v1/telephony/history');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        const recordsList = Array.isArray(data) ? data : (data?.calls || []);
        setRecords(recordsList);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch call records", err);
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  let filteredRecords = records.filter(record => {
    if (activeTab === 'ALL') return true;
    return record.direction === activeTab;
  });

  if (activeTab === 'OUTBOUND') {
    const unique = new Map();
    filteredRecords.forEach(record => {
      const key = record.callSid || record.id;
      if (!unique.has(key)) {
        unique.set(key, record);
      }
    });
    filteredRecords = Array.from(unique.values());
  }

  return (
    <div className="flex-1 p-4 md:p-6 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#F5F7F5] text-[#202020]">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#202020] mb-1 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA] inline-flex items-center justify-center">
              <Mic className="w-5 h-5 text-[#039A01]" />
            </span>
            AI Auto Call Records
          </h1>
          <p className="text-xs md:text-sm text-[#5F6962]">Access, review, and audit automated WebRTC call recordings</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E1E6E1] text-[#202020] rounded-xl hover:bg-[#F5F7F5] transition-colors text-xs md:text-sm font-semibold shadow-xs">
          <Download className="w-4 h-4 text-[#5F6962]" /> Export Archive
        </button>
      </header>

      {/* TABS */}
      <div className="flex items-center gap-1.5 mb-6 bg-white p-1 rounded-xl w-fit border border-[#E1E6E1] shadow-2xs">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-colors ${activeTab === 'ALL' ? 'bg-[#039A01] text-white shadow-xs' : 'text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5]'}`}
        >
          All Calls
        </button>
        <button 
          onClick={() => setActiveTab('INBOUND')}
          className={`px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-colors ${activeTab === 'INBOUND' ? 'bg-[#039A01] text-white shadow-xs' : 'text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5]'}`}
        >
          <span className="flex items-center gap-1.5"><PhoneIncoming className="w-3.5 h-3.5" /> Inbound</span>
        </button>
        <button 
          onClick={() => setActiveTab('OUTBOUND')}
          className={`px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-colors ${activeTab === 'OUTBOUND' ? 'bg-[#039A01] text-white shadow-xs' : 'text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5]'}`}
        >
          <span className="flex items-center gap-1.5"><PhoneOutgoing className="w-3.5 h-3.5" /> Outbound</span>
        </button>
      </div>

      <div className="bg-white border border-[#E1E6E1] rounded-2xl shadow-xs flex-1 flex flex-col overflow-hidden min-h-[400px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#E1E6E1] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAFCFA]">
          <div className="relative group w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6962] group-focus-within:text-[#039A01] transition-colors" />
            <input 
              aria-label="Search call recordings" 
              type="text" 
              placeholder="Search recordings..." 
              className="w-full bg-white border border-[#E1E6E1] focus:border-[#039A01] focus:ring-2 focus:ring-[#039A01]/10 rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm outline-none transition-all text-[#202020] placeholder-[#849389]"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-2 border border-[#E1E6E1] bg-white text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5] rounded-xl transition-colors flex items-center gap-2 text-xs md:text-sm font-medium shadow-2xs">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table aria-label="Call recordings audit table" className="w-full text-left text-xs md:text-sm min-w-[700px]">
            <thead className="text-[11px] font-bold text-[#5F6962] bg-[#F5F7F5] uppercase tracking-wider border-b border-[#E1E6E1] sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3.5">Call ID / Type</th>
                <th scope="col" className="px-6 py-3.5">Customer</th>
                <th scope="col" className="px-6 py-3.5">Agent</th>
                <th scope="col" className="px-6 py-3.5">Duration</th>
                <th scope="col" className="px-6 py-3.5">Date & Time</th>
                <th scope="col" className="px-6 py-3.5 text-right">Playback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6E1]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <span className="w-7 h-7 border-2 border-[#039A01]/20 border-t-[#039A01] rounded-full animate-spin inline-block"></span>
                    <p className="text-xs text-[#5F6962] mt-2 font-medium">Loading call recordings...</p>
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record, idx) => {
                  const customerDisplay = record.customerName || record.customerDetails?.name || record.callerName || (record.customerPhone && record.customerPhone !== 'Unknown' ? record.customerPhone : (record.callerPhone && record.callerPhone !== 'Unknown' ? record.callerPhone : 'Customer'));
                  const agentDisplay = record.agentName || record.handlingAgent?.name || record.originalAgent?.name || 'Agent';
                  const rawDate = record.timestamp || record.startedAt || record.date || record.createdAt;
                  const dateObj = rawDate ? new Date(rawDate) : null;
                  const dateDisplay = dateObj && !isNaN(dateObj.getTime())
                    ? `${dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}, ${dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                    : '—';
                  const displayId = (record.callSid || record.id || '').replace(/^call_outbound_/, 'OUT-').replace(/^call_inbound_/, 'IN-');
                  const shortId = displayId.length > 12 ? `${displayId.substring(0, 10)}...` : displayId;
                  const durationVal = record.duration || record.connectedDuration || 0;

                  return (
                    <tr key={record.id || idx} className="hover:bg-[#F9FAF9] transition-colors group">
                      <td className="px-6 py-4 font-semibold text-[#202020]">
                        <div className="flex items-center gap-2">
                          {record.direction === 'INBOUND' ? (
                            <span className="p-1 rounded-md bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA] inline-flex">
                              <PhoneIncoming className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-md bg-[#F0F7FF] text-[#1D4ED8] border border-[#CBE2FE] inline-flex">
                              <PhoneOutgoing className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span title={record.callSid || record.id} className="font-mono text-xs">{shortId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#202020]">{customerDisplay}</td>
                      <td className="px-6 py-4 text-[#5F6962] font-medium">{agentDisplay}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[#202020] font-mono text-xs">
                          <Clock className="w-3.5 h-3.5 text-[#5F6962]" />
                          {formatDuration(durationVal)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#5F6962] text-xs">
                        {dateDisplay}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {record.recordingStatus === 'READY' && record.recordingUrl ? (
                          <div className="flex items-center justify-end gap-2">
                            <audio 
                              src={record.recordingUrl} 
                              controls 
                              className="w-48 h-8 rounded-lg outline-none accent-[#039A01]" 
                              preload="metadata"
                              crossOrigin="anonymous"
                              onLoadStart={(e) => console.log(`[RECORDING-PLAYER] event=loadStart callId=${record.id} srcPresent=${!!e.currentTarget.src}`)}
                              onLoadedMetadata={(e) => console.log(`[RECORDING-PLAYER] event=loadedMetadata callId=${record.id} duration=${e.currentTarget.duration}`)}
                              onCanPlay={(e) => console.log(`[RECORDING-PLAYER] event=canPlay callId=${record.id} readyState=${e.currentTarget.readyState}`)}
                              onError={(e) => console.error(`[RECORDING-PLAYER] event=error callId=${record.id} networkState=${e.currentTarget.networkState} errorCode=${e.currentTarget.error?.code} errorMessage=${e.currentTarget.error?.message}`)}
                            />
                          </div>
                        ) : record.recordingStatus === 'PROCESSING' ? (
                          <span className="text-xs text-[#78350F] bg-[#FFF8E6] border border-[#FBE5AC] px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-ping" />
                            Processing...
                          </span>
                        ) : record.recordingStatus === 'FAILED' ? (
                          <span className="text-xs text-[#B91C1C] bg-[#FDF2F2] border border-[#F8C8C8] px-2.5 py-1 rounded-lg font-semibold">
                            Recording Failed
                          </span>
                        ) : (
                          <span className="text-xs text-[#849389] italic">No Recording</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-[#5F6962]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#EFF3EF] flex items-center justify-center mb-3">
                        <Mic className="w-6 h-6 text-[#5F6962]" />
                      </div>
                      <p className="text-sm font-bold text-[#202020] mb-1">No recordings found</p>
                      <p className="text-xs text-[#5F6962]">Active WebRTC calls will be automatically recorded and archived here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
