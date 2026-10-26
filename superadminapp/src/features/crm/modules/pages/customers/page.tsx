"use client";

import { useEffect, useState } from 'react';
import { ClientTimeline } from '../../components/customers/ClientTimeline';
import { LeadNotesPanel } from '../../components/leads/LeadNotesPanel';
import { ReportPanel } from '../../components/reports/ReportPanel';
import { LeadHistoryPanel } from '../../components/leads/LeadHistoryPanel';
import { useSearchParams } from '../../nextShim';
import { useLeadStore } from '../../store/useLeadStore';
import Link from '../../nextShim';
import { FileText, Clock, FileEdit, ArrowLeft, History, UserRound, Phone, RefreshCw } from 'lucide-react';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('id');
  const { leads, fetchLeads, isLoading } = useLeadStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'reports' | 'history'>('timeline');

  useEffect(() => {
    if (!leadId) {
      const token = localStorage.getItem('paramantra_access_token') || '';
      fetchLeads(token, '');
    }
  }, [leadId, fetchLeads]);

  const activeLead = leads.find(l => l.id === leadId);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 text-[#202020] bg-[#F5F7F5] min-h-screen">
      {leadId ? (
        <div className="flex-1 flex flex-col h-full w-full space-y-4">
          {/* Header & Tab Navigation */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Link href="/customers" className="text-[#5F6962] hover:text-[#202020] flex items-center gap-1.5 transition text-xs font-semibold no-underline">
                <ArrowLeft className="w-4 h-4" /> Back to Leads Directory
              </Link>
              {activeLead && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#202020]">{activeLead.customerName}</span>
                  <span className="text-[#5F6962]">({activeLead.phoneNumber})</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA]">
                    {activeLead.status}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-1 border-b border-[#E1E6E1] bg-white p-1 rounded-xl shadow-xs">
              <button 
                onClick={() => setActiveTab('timeline')} 
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-xs transition ${
                  activeTab === 'timeline' 
                    ? 'bg-[#E7F4E8] text-[#026601] shadow-xs' 
                    : 'text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#039A01]" /> Timeline
              </button>
              <button 
                onClick={() => setActiveTab('notes')} 
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-xs transition ${
                  activeTab === 'notes' 
                    ? 'bg-[#E7F4E8] text-[#026601] shadow-xs' 
                    : 'text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5]'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5 text-[#039A01]" /> Notes
              </button>
              <button 
                onClick={() => setActiveTab('reports')} 
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-xs transition ${
                  activeTab === 'reports' 
                    ? 'bg-[#E7F4E8] text-[#026601] shadow-xs' 
                    : 'text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#039A01]" /> Reports
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-xs transition ${
                  activeTab === 'history' 
                    ? 'bg-[#E7F4E8] text-[#026601] shadow-xs' 
                    : 'text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5]'
                }`}
              >
                <History className="w-3.5 h-3.5 text-[#039A01]" /> Historical Log
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 bg-white border border-[#E1E6E1] rounded-2xl shadow-xs overflow-hidden">
            {activeTab === 'timeline' && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-[#E1E6E1] bg-[#FCFDFC]">
                  <h3 className="text-base font-bold text-[#202020]">Leads Timeline</h3>
                  <p className="text-xs text-[#5F6962]">Permanent chronological audit trail of calls, messages, status transitions, and agent touchpoints.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <ClientTimeline entityId={leadId} type="lead" />
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="h-full p-4 overflow-y-auto custom-scrollbar">
                <LeadNotesPanel leadId={leadId} />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="h-full p-4 overflow-y-auto custom-scrollbar">
                <ReportPanel leadId={leadId} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="h-full p-4 overflow-y-auto custom-scrollbar">
                <LeadHistoryPanel entityId={leadId} type="lead" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col bg-white border border-[#E1E6E1] rounded-2xl shadow-xs p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#E1E6E1] mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#202020] mb-0.5">Leads Timeline Directory</h2>
              <p className="text-xs text-[#5F6962]">Select any prospective client or converted account to inspect their historical interactions.</p>
            </div>
            <button
              onClick={() => {
                const token = localStorage.getItem('paramantra_access_token') || '';
                fetchLeads(token, '');
              }}
              className="p-2 bg-white hover:bg-[#F5F7F5] text-[#5F6962] hover:text-[#202020] border border-[#E1E6E1] rounded-xl transition-colors shadow-xs"
              title="Refresh Leads"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#039A01]' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#5F6962]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#039A01] mb-3" />
                <p className="text-xs font-semibold">Loading available leads...</p>
              </div>
            ) : leads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.map(lead => (
                  <Link href={`/customers?id=${lead.id}`} key={lead.id} className="no-underline">
                    <div className="bg-[#FCFDFC] p-4 rounded-xl border border-[#E1E6E1] hover:border-[#039A01] hover:shadow-xs transition-all cursor-pointer flex flex-col gap-2">
                      <div className="font-bold text-sm text-[#202020]">{lead.customerName}</div>
                      <div className="text-xs text-[#5F6962] flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#039A01]" />
                        {lead.phoneNumber}
                      </div>
                      {lead.primaryService && (
                        <div className="text-[11px] text-[#5F6962] font-medium truncate">
                          {lead.primaryService}
                        </div>
                      )}
                      <div className="mt-2 text-[10px] font-bold uppercase px-2 py-0.5 bg-[#E7F4E8] text-[#026601] rounded-full border border-[#C8E6CA] w-fit">
                        {lead.status}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-[#5F6962]">
                <UserRound className="w-10 h-10 mx-auto mb-2 text-[#5F6962]/40" />
                <p className="text-xs font-semibold">No leads available for timeline inspection.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
