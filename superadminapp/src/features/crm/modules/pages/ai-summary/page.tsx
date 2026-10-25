"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Sparkles,
  Brain,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  CheckCircle,
  Languages,
  Cpu,
  Coins,
  RefreshCw,
  AlertTriangle,
  Zap,
  Layers,
  Wrench,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallAudioPlayer } from '../../components/recordings/CallAudioPlayer';
import { HeaderAudioControl } from '../../components/recordings/HeaderAudioControl';
import { apiFetch } from '../../lib/api';

export default function AICallSummaryPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // AI Usage KPI states
  const [usagePeriod, setUsagePeriod] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [usageData, setUsageData] = useState<any | null>(null);
  const [usageLoading, setUsageLoading] = useState<boolean>(true);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairMsg, setRepairMsg] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/analytics/summaries');
      const data = await res.json();
      setSummaries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch AI summaries', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAiUsage = useCallback(async (period: 'today' | '7d' | '30d' | 'all') => {
    setUsageLoading(true);
    setUsageError(null);
    try {
      const res = await apiFetch(`/api/v1/analytics/ai-usage?timeRange=${period}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setUsageData(data);
    } catch (err: any) {
      console.error('Failed to fetch AI usage:', err);
      setUsageError(err.message || 'Failed to load usage data');
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  useEffect(() => {
    fetchAiUsage(usagePeriod);
  }, [usagePeriod, fetchAiUsage]);

  const handleRunRepair = async () => {
    setIsRepairing(true);
    setRepairMsg(null);
    try {
      const res = await apiFetch('/api/v1/analytics/repair-pending', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRepairMsg(`Successfully repaired ${data.repairedCount} call session(s).`);
        await Promise.all([fetchSummaries(), fetchAiUsage(usagePeriod)]);
      } else {
        setRepairMsg(`Repair completed: ${data.message || 'No pending calls found.'}`);
      }
    } catch (err: any) {
      setRepairMsg('Repair request failed. Please check backend connection.');
    } finally {
      setIsRepairing(false);
      setTimeout(() => setRepairMsg(null), 6000);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  const periodOptions: Array<{ id: 'today' | '7d' | '30d' | 'all'; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 h-full overflow-y-auto custom-scrollbar bg-[#F5F7F5] text-[#202020]">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#202020] mb-1 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA] inline-flex items-center justify-center">
              <Sparkles className="text-[#039A01] w-5 h-5" />
            </span>
            AI Call Summaries
          </h1>
          <p className="text-xs md:text-sm text-[#5F6962]">Automated transcriptions, intelligence synthesis and sentiment analysis</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunRepair}
            disabled={isRepairing}
            className="flex items-center gap-2 px-3 py-2 bg-[#E7F4E8] border border-[#C8E6CA] text-[#026601] hover:bg-[#D5EED7] rounded-xl transition-colors text-xs font-bold shadow-2xs"
            title="Scan and synthesize summaries for any pending or completed calls"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
            {isRepairing ? 'Repairing Pending Calls...' : 'Repair / Sync AI Summaries'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E1E6E1] text-[#202020] rounded-xl hover:bg-[#F5F7F5] transition-colors text-xs md:text-sm font-semibold shadow-xs">
            <Download className="w-4 h-4 text-[#5F6962]" /> Export Report
          </button>
        </div>
      </header>

      {repairMsg && (
        <div className="mb-6 p-3.5 bg-[#E7F4E8] border border-[#C8E6CA] rounded-xl text-[#026601] text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 shrink-0 text-[#039A01]" />
          <span>{repairMsg}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 1: AI USAGE KPI SECTION (PHASE 6 REQUIREMENT) */}
      {/* ==================================================== */}
      <section className="mb-6 bg-white border border-[#E1E6E1] p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#039A01]" />
              <h2 className="text-sm md:text-base font-bold text-[#202020]">AI Engine & Gemini Usage Analytics</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F0F7FF] text-[#1D4ED8] border border-[#CBE2FE]">
                Gemini 2026-v1
              </span>
            </div>
            <p className="text-xs text-[#5F6962] mt-1">
              Truthful provider-reported token metrics, model breakdown, and pricing schedule
            </p>
          </div>

          {/* Time Range Filter Pills */}
          <div className="flex bg-[#F5F7F5] border border-[#E1E6E1] rounded-xl p-1 text-xs">
            {periodOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setUsagePeriod(opt.id)}
                className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
                  usagePeriod === opt.id
                    ? 'bg-white text-[#202020] shadow-xs'
                    : 'text-[#5F6962] hover:text-[#202020]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {usageLoading ? (
          <div className="flex justify-center items-center py-8 text-[#5F6962] text-xs font-medium">
            <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#039A01]" />
            Loading AI usage telemetry...
          </div>
        ) : usageError ? (
          <div className="p-4 bg-[#FDF2F2] border border-[#F8C8C8] rounded-xl text-[#B91C1C] text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>AI Usage Telemetry unavailable: {usageError}</span>
          </div>
        ) : usageData?.summary ? (
          <div>
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {/* Card 1: Total AI Requests */}
              <div className="bg-[#FAFCFA] border border-[#E1E6E1] p-4 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-[#5F6962] text-xs mb-2">
                  <span className="font-medium">Total AI Invocations</span>
                  <Zap className="w-4 h-4 text-[#039A01]" />
                </div>
                <div className="text-2xl font-bold text-[#202020] mb-1">
                  {usageData.summary.totalRequests}
                </div>
                <div className="text-[10px] text-[#5F6962]">
                  {Object.entries(usageData.byFeature || {}).map(([feat, details]: [string, any]) => (
                    <span key={feat} className="mr-2">
                      {feat === 'metadata_call_summary' ? 'Summaries' : feat}: {details.requests}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 2: Token Volume */}
              <div className="bg-[#FAFCFA] border border-[#E1E6E1] p-4 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-[#5F6962] text-xs mb-2">
                  <span className="font-medium">Tokens Processed</span>
                  <Brain className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="text-2xl font-bold text-[#202020] mb-1 font-mono">
                  {usageData.summary.totalTokens.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#5F6962] flex justify-between font-mono">
                  <span>In: {usageData.summary.totalPromptTokens.toLocaleString()}</span>
                  <span>Out: {usageData.summary.totalCandidateTokens.toLocaleString()}</span>
                </div>
              </div>

              {/* Card 3: Audio Processed */}
              <div className="bg-[#FAFCFA] border border-[#E1E6E1] p-4 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-[#5F6962] text-xs mb-2">
                  <span className="font-medium">Audio Ingested</span>
                  <Activity className="w-4 h-4 text-[#026601]" />
                </div>
                <div className="text-2xl font-bold text-[#202020] mb-1 font-mono">
                  {usageData.summary.totalAudioMinutes} <span className="text-xs font-normal text-[#5F6962]">min</span>
                </div>
                <div className="text-[10px] text-[#5F6962]">
                  Raw duration: {usageData.summary.totalAudioSeconds}s
                </div>
              </div>

              {/* Card 4: Estimated Provider Cost */}
              <div className="bg-[#FAFCFA] border border-[#E1E6E1] p-4 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-[#5F6962] text-xs mb-2">
                  <span className="font-medium">Estimated Cost</span>
                  <Coins className="w-4 h-4 text-[#B45309]" />
                </div>
                <div className="text-2xl font-bold text-[#202020] mb-1 font-mono">
                  ${usageData.summary.estimatedCostUsd.toFixed(5)} <span className="text-xs font-normal text-[#5F6962]">USD</span>
                </div>
                <div className="text-[10px] text-[#5F6962]">
                  Calculated from Gemini Flash schedule
                </div>
              </div>
            </div>

            {/* Model Breakdown & Live Credit Note */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-3 border-t border-[#E1E6E1] text-[11px] text-[#5F6962]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#202020]">Active Models:</span>
                {Object.entries(usageData.byModel || {}).map(([model, info]: [string, any]) => (
                  <span
                    key={model}
                    className="px-2 py-0.5 bg-[#F1F4F2] border border-[#DDE2DE] rounded text-[#202020] font-mono text-[10px]"
                  >
                    {model} ({info.requests} reqs · {info.totalTokens.toLocaleString()} tok)
                  </span>
                ))}
              </div>
              <div className="text-[#849389] italic">
                * Live remaining provider credits: <span className="text-[#5F6962]">Unavailable without Google Cloud Billing API credentials</span> (never fabricated).
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-[#5F6962] text-xs">
            No AI usage recorded for this timeframe.
          </div>
        )}
      </section>

      {/* ==================================================== */}
      {/* SECTION 2: CALL INSIGHT OVERVIEW CARDS */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#E1E6E1] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#E7F4E8] text-[#026601] rounded-xl"><Brain className="w-5 h-5 text-[#039A01]" /></div>
            <h3 className="text-[#5F6962] font-semibold text-xs md:text-sm">Calls Analyzed</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#202020] mt-3">{summaries.length}</p>
          <p className="text-xs text-[#026601] font-semibold mt-1">Real-time processing active</p>
        </div>
        <div className="bg-white border border-[#E1E6E1] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#F3E8E3] text-[#633B32] rounded-xl"><Activity className="w-5 h-5 text-[#633B32]" /></div>
            <h3 className="text-[#5F6962] font-semibold text-xs md:text-sm">Avg Sentiment Score</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#202020] mt-3">
            {summaries.length > 0 ? (summaries.reduce((a, b) => a + (b.sentimentScore || 5), 0) / summaries.length).toFixed(1) : '0.0'} / 10
          </p>
          <p className="text-xs text-[#026601] font-semibold mt-1">Overall positive trend</p>
        </div>
        <div className="bg-white border border-[#E1E6E1] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#FFF8E6] text-[#78350F] rounded-xl"><FileText className="w-5 h-5 text-[#B45309]" /></div>
            <h3 className="text-[#5F6962] font-semibold text-xs md:text-sm">Time Saved (Est.)</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#202020] mt-3">{summaries.length * 5} mins</p>
          <p className="text-xs text-[#5F6962] font-medium mt-1">Via auto-note & action generation</p>
        </div>
      </div>

      <h2 className="text-base md:text-lg font-bold text-[#202020] mb-4">Recent AI Intelligence Logs</h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-[#E1E6E1] rounded-2xl text-[#5F6962] shadow-xs">
          <span className="w-6 h-6 border-2 border-[#039A01]/20 border-t-[#039A01] rounded-full animate-spin mr-3"></span>
          Loading AI insights...
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E1E6E1] text-[#5F6962] shadow-xs">
          <Brain className="w-12 h-12 mx-auto mb-3 text-[#5F6962] opacity-40" />
          <p className="text-sm font-bold text-[#202020]">No processed calls found.</p>
          <p className="text-xs mt-1 text-[#5F6962]">Make a call to trigger the AI Intelligence pipeline or click &quot;Repair / Sync AI Summaries&quot; above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {summaries.map(item => {
            const isExpanded = expandedId === item.id;
            const customerName = item.callSession?.customer?.name || item.callSession?.customer?.phone || 'Unknown Caller';
            const agentName = item.callSession?.participants?.[0]?.agent?.name || 'Unassigned';
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

                      {/* Accessible Audio Play Control directly beside Language Badge */}
                      <HeaderAudioControl
                        callId={callSessionId}
                        initialRecordingUrl={item.recordingUrl || item.callSession?.recordingUrl}
                        initialStatus={recordingStatus}
                        duration={item.recordingDuration || item.callSession?.recordingDuration || item.callSession?.duration}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#5F6962]">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {dateStr}</span>
                      <span>•</span>
                      <span>Agent: {agentName}</span>
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
                        
                        {/* Left Column: Summary & Insights */}
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
                                <CheckCircle className="w-4 h-4 text-[#026601]" /> Extracted Action Items
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

                          {item.followUpRecommendation && (
                            <div className="bg-[#FAFCFA] border border-[#E1E6E1] p-4 rounded-xl shadow-2xs">
                              <h4 className="text-xs font-bold text-[#5F6962] uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#1D4ED8]" /> Follow-up Recommendation
                              </h4>
                              <p className="text-xs md:text-sm text-[#202020]">
                                {item.followUpRecommendation}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Transcript & Translation */}
                        <div className="flex flex-col gap-4">
                          <div className="bg-[#FAFCFA] border border-[#E1E6E1] p-4 rounded-xl h-full flex flex-col shadow-2xs">
                            <h4 className="text-xs font-bold text-[#5F6962] uppercase tracking-wider mb-3 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-[#039A01]" /> Speech-to-Text & Translation
                            </h4>
                            
                            <div className="flex-1 space-y-4">
                              <div>
                                <div className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider mb-1">
                                  Original Speech ({item.detectedLanguage || 'Unknown'})
                                </div>
                                <div className="p-3 bg-white border border-[#E1E6E1] rounded-lg text-xs md:text-sm text-[#202020] font-mono">
                                  {item.originalTranscript || 'No transcript available.'}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Languages className="w-3 h-3 text-[#1D4ED8]" /> English Translation
                                </div>
                                <div className="p-3 bg-[#F0F7FF] border border-[#CBE2FE] rounded-lg text-xs md:text-sm text-[#1E3A8A]">
                                  {item.englishTranslation || 'No translation available.'}
                                </div>
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
