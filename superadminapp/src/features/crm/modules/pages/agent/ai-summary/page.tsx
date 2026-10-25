"use client";

import React, { useEffect, useState } from 'react';
import { Activity, Sparkles, Brain, FileText, ChevronDown, ChevronUp, Clock, MessageSquare, CheckCircle, Languages, Mic, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallAudioPlayer } from '../../../components/recordings/CallAudioPlayer';

export default function AgentAISummary() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    import('../../../lib/api').then(({ apiFetch }) => {
      apiFetch('/api/v1/analytics/summaries')
        .then(res => res.json())
        .then(data => {
          setSummaries(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch agent AI summaries', err);
          setLoading(false);
        });
    });
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  const filteredSummaries = summaries.filter(s => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const customer = s.callSession?.customer?.name?.toLowerCase() || '';
    const phone = s.callSession?.customer?.phone || '';
    const summary = s.summary?.toLowerCase() || '';
    return customer.includes(query) || phone.includes(query) || summary.includes(query);
  });

  return (
    <div className="flex-1 p-4 md:p-6 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#F5F7F5] text-[#202020]">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#202020] mb-1 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA] inline-flex items-center justify-center">
              <Sparkles className="text-[#039A01] w-5 h-5" />
            </span>
            AI Call Summaries
          </h1>
          <p className="text-xs md:text-sm text-[#5F6962]">Auto-generated transcripts, audio recordings, and sentiment analysis for your calls.</p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="p-4 mb-6 bg-white border border-[#E1E6E1] rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6962]" />
          <input
            aria-label="Search call summaries"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, phone, or notes..."
            className="w-full bg-[#FAFCFA] border border-[#E1E6E1] focus:border-[#039A01] focus:ring-2 focus:ring-[#039A01]/10 rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm outline-none text-[#202020] transition-all placeholder-[#849389]"
          />
        </div>
        <div className="text-xs text-[#5F6962]">
          Showing <span className="text-[#202020] font-bold">{filteredSummaries.length}</span> calls
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-[#5F6962] bg-white border border-[#E1E6E1] rounded-2xl shadow-xs">
          <span className="w-6 h-6 border-2 border-[#039A01]/20 border-t-[#039A01] rounded-full animate-spin mr-3"></span>
          Loading your AI call insights...
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="bg-white border border-[#E1E6E1] rounded-2xl shadow-xs flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E7F4E8] flex items-center justify-center border border-[#C8E6CA] mb-4">
            <Brain className="w-8 h-8 text-[#039A01]" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-[#202020] mb-1">No Summaries Found</h3>
          <p className="text-[#5F6962] max-w-md text-xs md:text-sm">
            {searchQuery ? 'No calls match your search query.' : 'AI summaries will appear here automatically after you complete your calls.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSummaries.map(item => {
            const isExpanded = expandedId === item.id;
            const customerName = item.callSession?.customer?.name || item.callSession?.customer?.phone || 'Unknown Caller';
            const dateStr = new Date(item.createdAt).toLocaleString();
            const callSessionId = item.callSessionId || item.callSession?.id || item.callId;
            const recordingStatus = item.recordingStatus || item.callSession?.recordingStatus;

            return (
              <div key={item.id} className={`bg-white border ${isExpanded ? 'border-[#039A01]' : 'border-[#E1E6E1]'} p-5 rounded-2xl shadow-xs transition-colors`}>
                {/* Header Row */}
                <div
                  className="flex justify-between items-start cursor-pointer group"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm md:text-base font-bold text-[#202020]">{customerName}</h3>
                      <span className="px-2 py-0.5 bg-[#F1F4F2] text-[#4A5650] border border-[#DDE2DE] rounded text-[10px] font-bold uppercase tracking-wider">
                        {item.customerIntent || 'General Inquiry'}
                      </span>
                      {item.detectedLanguage && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F0F7FF] text-[#1D4ED8] border border-[#CBE2FE] rounded text-[10px] font-bold uppercase tracking-wider">
                          <Languages className="w-3 h-3" /> {item.detectedLanguage}
                        </span>
                      )}
                      {recordingStatus === 'READY' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA] rounded text-[10px] font-bold uppercase tracking-wider">
                          <Mic className="w-3 h-3" /> Audio Ready
                        </span>
                      )}
                      {recordingStatus === 'PROCESSING' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#FFF8E6] text-[#78350F] border border-[#FBE5AC] rounded text-[10px] font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3 animate-spin" /> Processing Audio
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#5F6962]">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {dateStr}</span>
                      <span>•</span>
                      <span>Duration: {item.callSession?.duration || 0}s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${
                      item.sentiment === 'Positive' ? 'bg-[#E7F4E8] text-[#026601] border-[#C8E6CA]' :
                      item.sentiment === 'Negative' ? 'bg-[#FDF2F2] text-[#B91C1C] border-[#F8C8C8]' :
                      'bg-[#FFF8E6] text-[#78350F] border-[#FBE5AC]'
                    }`}>
                      {item.sentiment || 'Neutral'}
                    </span>
                    <button className="p-1.5 text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5] rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* AI Summary Short */}
                {!isExpanded && (
                  <div className="mt-3 bg-[#FAFCFA] border border-[#E1E6E1] p-3 rounded-xl text-xs md:text-sm text-[#202020] line-clamp-2">
                    <strong className="text-[#039A01] mr-2">Summary:</strong>
                    {item.summary}
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 pt-5 border-t border-[#E1E6E1] flex flex-col gap-6">
                        {/* Audio Recording Player */}
                        <div className="p-3 bg-white border border-[#E1E6E1] rounded-xl shadow-2xs">
                          <CallAudioPlayer
                            callId={callSessionId}
                            initialRecordingUrl={item.recordingUrl || item.callSession?.recordingUrl}
                            initialStatus={recordingStatus}
                            duration={item.recordingDuration || item.callSession?.recordingDuration || item.callSession?.duration}
                            customerName={customerName}
                          />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column: Summary */}
                          <div className="flex flex-col gap-4">
                            <div className="bg-[#FAFCFA] border border-[#E1E6E1] p-4 rounded-xl shadow-2xs">
                              <h4 className="text-xs font-bold text-[#5F6962] uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#039A01]" /> AI Executive Summary
                              </h4>
                              <p className="text-xs md:text-sm text-[#202020] leading-relaxed">
                                {item.summary}
                              </p>
                            </div>

                            {item.actionItems && Array.isArray(item.actionItems) && item.actionItems.length > 0 && (
                              <div className="bg-[#FAFCFA] border border-[#E1E6E1] p-4 rounded-xl shadow-2xs">
                                <h4 className="text-xs font-bold text-[#5F6962] uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-[#026601]" /> Action Items
                                </h4>
                                <ul className="space-y-2">
                                  {item.actionItems.map((action: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-[#202020]">
                                      <span className="text-[#039A01] mt-0.5 font-bold">•</span> {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Transcript */}
                          <div className="flex flex-col gap-4">
                            <div className="bg-[#FAFCFA] border border-[#E1E6E1] p-4 rounded-xl h-full flex flex-col shadow-2xs">
                              <h4 className="text-xs font-bold text-[#5F6962] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-[#039A01]" /> Transcript
                              </h4>
                              <div className="flex-1 space-y-4">
                                <div className="p-3 bg-white border border-[#E1E6E1] rounded-lg text-xs md:text-sm text-[#202020] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                                  {item.originalTranscript || 'No transcript text available.'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
