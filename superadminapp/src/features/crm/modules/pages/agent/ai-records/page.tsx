"use client";

import React, { useEffect, useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Mic, Clock, Calendar as CalendarIcon, User, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '../../../lib/api';

export default function AiRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        let agentId = '';
        let role = '';
        try {
          const stored = localStorage.getItem('crm_user');
          if (stored) {
            const user = JSON.parse(stored);
            agentId = user.agentId;
            role = user.role;
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
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'ENDED':
      case 'COMPLETED':
        return 'text-[#026601] bg-[#E7F4E8] border-[#C8E6CA]';
      case 'MISSED':
        return 'text-[#B91C1C] bg-[#FDF2F2] border-[#F8C8C8]';
      case 'RINGING':
      case 'IN_PROGRESS':
        return 'text-[#78350F] bg-[#FFF8E6] border-[#FBE5AC]';
      default:
        return 'text-[#4A5650] bg-[#F1F4F2] border-[#DDE2DE]';
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#F5F7F5] text-[#202020]">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[#202020] tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E7F4E8] border border-[#C8E6CA] flex items-center justify-center shadow-xs">
            <Mic className="w-4 h-4 text-[#039A01]" />
          </div>
          AI Call Records
        </h1>
        <p className="text-xs md:text-sm text-[#5F6962] mt-1.5">Comprehensive log of all inbound and outbound interactions, augmented with AI summarization.</p>
      </div>

      <div className="bg-white border border-[#E1E6E1] rounded-2xl overflow-hidden shadow-xs flex-1 flex flex-col min-h-[400px]">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#F5F7F5] border-b border-[#E1E6E1] text-[11px] font-bold text-[#5F6962] uppercase tracking-wider sticky top-0 z-10">
          <div className="col-span-1">Dir</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Agent</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Date/Time</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#5F6962]">
              <span className="w-7 h-7 border-2 border-[#039A01]/20 border-t-[#039A01] rounded-full animate-spin"></span>
              <p className="text-xs mt-2 font-medium">Loading call records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#5F6962]">
              <div className="w-12 h-12 rounded-full bg-[#EFF3EF] flex items-center justify-center mb-3">
                <Mic className="w-6 h-6 text-[#5F6962]" />
              </div>
              <p className="text-sm font-bold text-[#202020] mb-1">No call records found</p>
              <p className="text-xs text-[#5F6962]">Call records will appear here as interactions occur.</p>
            </div>
          ) : (
            records.map((record) => {
              const customerDisplay = record.customerName || record.customerDetails?.name || record.callerName || 'Customer';
              const phoneDisplay = record.customerPhone || record.callerPhone || '';
              const agentDisplay = record.agentName || record.handlingAgent?.name || record.originalAgent?.name || 'Agent';
              const rawDate = record.date || record.timestamp || record.startedAt || record.createdAt;
              const dateObj = rawDate ? new Date(rawDate) : null;
              const isDateValid = dateObj && !isNaN(dateObj.getTime());
              const dateStr = isDateValid ? `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—';
              const isDirInbound = String(record.direction || '').toUpperCase().includes('IN');

              return (
              <div key={record.id} className="border-b border-[#E1E6E1] last:border-0 hover:bg-[#F9FAF9] transition-colors">
                <div 
                  className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-4 items-center cursor-pointer"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  {/* Direction */}
                  <div className="col-span-2 sm:col-span-1 flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      isDirInbound
                        ? 'bg-[#F0F7FF] border-[#CBE2FE] text-[#1D4ED8]' 
                        : 'bg-[#E7F4E8] border-[#C8E6CA] text-[#026601]'
                    }`}>
                      {isDirInbound ? <PhoneIncoming className="w-4 h-4" /> : <PhoneOutgoing className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="col-span-5 sm:col-span-3 min-w-0 flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-[#202020] truncate">{customerDisplay}</span>
                    {phoneDisplay && <span className="text-[11px] text-[#5F6962] font-mono truncate">{phoneDisplay}</span>}
                  </div>

                  {/* Agent */}
                  <div className="hidden sm:flex col-span-2 items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#EFF3EF] flex items-center justify-center text-[10px] text-[#5F6962]">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-[#5F6962] truncate">{agentDisplay}</span>
                  </div>

                  {/* Duration */}
                  <div className="hidden sm:flex col-span-2 items-center gap-2 text-xs sm:text-sm text-[#202020] font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#5F6962]" />
                    {formatDuration(record.duration || record.connectedDuration || 0)}
                  </div>

                  {/* Date */}
                  <div className="hidden sm:flex col-span-2 items-center gap-2 text-xs sm:text-sm text-[#5F6962]">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {dateStr}
                  </div>

                  {/* Status */}
                  <div className="col-span-3 sm:col-span-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
                    <button className="text-[#5F6962] hover:text-[#202020] p-1.5 rounded-lg hover:bg-[#F5F7F5] transition-colors" aria-label="Toggle details">
                      {expandedId === record.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details - AI Summary & Recording */}
                {expandedId === record.id && (
                  <div className="bg-[#FAFCFA] border-t border-[#E1E6E1] p-4 sm:p-6 text-xs sm:text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recording */}
                      <div>
                        <h4 className="font-bold text-[#202020] mb-2.5 flex items-center gap-2">
                          <Mic className="w-4 h-4 text-[#039A01]" /> Audio Recording
                        </h4>
                        {record.recordingStatus === 'READY' && record.recordingUrl ? (
                          <div className="bg-white border border-[#E1E6E1] rounded-xl p-3 shadow-2xs">
                            <audio src={record.recordingUrl} controls preload="metadata" crossOrigin="anonymous" className="w-full h-9 accent-[#039A01]" />
                          </div>
                        ) : record.recordingStatus === 'PROCESSING' ? (
                          <div className="bg-[#FFF8E6] border border-[#FBE5AC] rounded-xl p-3 text-[#78350F] font-semibold text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#B45309] animate-ping" />
                            Recording is being processed by LiveKit Egress...
                          </div>
                        ) : record.recordingStatus === 'FAILED' ? (
                          <div className="bg-[#FDF2F2] border border-[#F8C8C8] rounded-xl p-3 text-[#B91C1C] font-semibold text-xs">
                            Recording capture or upload failed.
                          </div>
                        ) : (
                          <div className="bg-white border border-[#E1E6E1] rounded-xl p-3 text-[#849389] italic text-xs">
                            No recording available for this call.
                          </div>
                        )}
                      </div>

                      {/* AI Summary */}
                      <div>
                        <h4 className="font-bold text-[#202020] mb-2.5 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#039A01] shadow-[0_0_8px_rgba(3,154,1,0.6)]"></div> 
                          AI Analysis
                        </h4>
                        {record.aiSummary ? (
                          <div className="bg-white border border-[#E1E6E1] rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
                            <div>
                              <span className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Summary</span>
                              <p className="text-[#202020] mt-1 text-xs sm:text-sm leading-relaxed">{record.aiSummary.summary || record.aiSummary.summaryText}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E1E6E1]">
                              <div>
                                <span className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Sentiment</span>
                                <p className={`mt-0.5 font-bold text-xs ${
                                  record.aiSummary.sentiment === 'POSITIVE' || record.aiSummary.sentimentScore === 'POSITIVE' ? 'text-[#026601]' :
                                  record.aiSummary.sentiment === 'NEGATIVE' || record.aiSummary.sentimentScore === 'NEGATIVE' ? 'text-[#B91C1C]' : 'text-[#78350F]'
                                }`}>
                                  {record.aiSummary.sentiment || record.aiSummary.sentimentScore || 'NEUTRAL'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Risk Level</span>
                                <p className={`mt-0.5 font-bold text-xs ${
                                  record.aiSummary.escalationRisk === 'HIGH' || record.aiSummary.riskLevel === 'HIGH' ? 'text-[#B91C1C]' :
                                  record.aiSummary.escalationRisk === 'MEDIUM' || record.aiSummary.riskLevel === 'MEDIUM' ? 'text-[#78350F]' : 'text-[#026601]'
                                }`}>
                                  {record.aiSummary.escalationRisk || record.aiSummary.riskLevel || 'LOW'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-[#E1E6E1] rounded-xl p-3 text-[#849389] italic text-xs">
                            No AI summary generated for this call.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
}
