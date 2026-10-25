"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useLeadStore } from '../../../../store/useLeadStore';
import { 
  Calendar, Phone, Activity, MoreVertical, RefreshCw, 
  Search, Filter, ArrowRight, User, CheckCircle2, AlertCircle, FileText 
} from 'lucide-react';
import { CallIntakeFormModal } from '../../../../components/call-center/CallIntakeFormModal';
import Link from '../../../../nextShim';

// Comprehensive Kanban statuses covering the complete pipeline
const KANBAN_COLUMNS = [
  { id: 'NEW', label: 'New Enquiries', badgeClass: 'bg-[#EFF3EF] text-[#5F6962] border-[#E1E6E1]' },
  { id: 'CONTACTED', label: 'Contacted / In Progress', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'FOLLOWUP_REQUIRED', label: 'Follow Up Required', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'QUALIFIED', label: 'Qualified', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'POSITIVE', label: 'Positive', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'CONVERTED', label: 'Converted Client', badgeClass: 'bg-[#E7F4E8] text-[#026601] border-[#C8E6CA]' },
  { id: 'LOST', label: 'Lost / Closed', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function LeadConversionBoard() {
  const { leads, fetchLeads, updateLeadStatus, isLoading } = useLeadStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuLeadId, setActiveMenuLeadId] = useState<string | null>(null);
  const [selectedLeadForIntake, setSelectedLeadForIntake] = useState<any | null>(null);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reloadLeads = () => {
    const token = localStorage.getItem('paramantra_access_token') || '';
    fetchLeads(token);
  };

  useEffect(() => {
    reloadLeads();
  }, [fetchLeads]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      await changeStatus(leadId, targetStatus);
    }
  };

  const changeStatus = async (leadId: string, newStatus: string) => {
    const token = localStorage.getItem('paramantra_access_token') || '';
    await updateLeadStatus(leadId, newStatus, `Status updated to ${newStatus} via Board`, token);
    setActiveMenuLeadId(null);
    setToastMessage(`Lead status updated to ${newStatus}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered leads by search query
  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return leads;
    const q = searchTerm.toLowerCase();
    return leads.filter(l => 
      (l.customerName || '').toLowerCase().includes(q) ||
      (l.phoneNumber || '').toLowerCase().includes(q) ||
      (l.serviceInterest || l.primaryService || '').toLowerCase().includes(q) ||
      (l.patientName || '').toLowerCase().includes(q)
    );
  }, [leads, searchTerm]);

  // Status mapping helper: if lead has legacy 'IN_PROGRESS', show under CONTACTED
  const getLeadsForColumn = (columnId: string) => {
    return filteredLeads.filter(l => {
      if (!l) return false;
      if (columnId === 'CONTACTED') {
        return l.status === 'CONTACTED' || l.status === 'IN_PROGRESS';
      }
      return l.status === columnId;
    });
  };

  return (
    <div className="p-4 md:p-6 bg-[#F5F7F5] min-h-screen md:min-h-0 text-[#202020] flex flex-col">
      <div className="h-full flex flex-col space-y-5">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3 px-4 bg-[#E7F4E8] border border-[#C8E6CA] rounded-xl text-[#026601] text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#039A01]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1E6E1]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA]">
                Pipeline Workflow
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#202020]">Conversion Board</h1>
            </div>
            <p className="text-xs text-[#5F6962]">
              Track and advance prospective clients across lifecycle stages with synchronized drag-and-drop or status controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6962]" />
              <input 
                aria-label="Filter board cards" 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter cards by name, phone..." 
                className="w-full bg-white border border-[#E1E6E1] focus:border-[#039A01] rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none text-[#202020] placeholder-[#5F6962] shadow-xs"
              />
            </div>
            <button
              onClick={reloadLeads}
              className="p-2 bg-white hover:bg-[#F5F7F5] text-[#5F6962] hover:text-[#202020] border border-[#E1E6E1] rounded-xl transition-colors shadow-xs"
              title="Refresh Board"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#039A01]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory items-start">
          {KANBAN_COLUMNS.map(column => {
            const columnLeads = getLeadsForColumn(column.id);

            return (
              <div 
                key={column.id}
                className="w-76 shrink-0 flex flex-col bg-white border border-[#E1E6E1] rounded-2xl shadow-xs snap-center transition-all min-h-[500px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-[#E1E6E1] flex items-center justify-between bg-[#FCFDFC] rounded-t-2xl">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${column.badgeClass}`}>
                    {column.label}
                  </div>
                  <span className="text-xs text-[#5F6962] font-bold px-2 py-0.5 rounded-full bg-[#F5F7F5] border border-[#E1E6E1]">
                    {columnLeads.length}
                  </span>
                </div>
                
                {/* Column Body */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar max-h-[72vh]">
                  {columnLeads.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-[#E1E6E1] rounded-xl flex items-center justify-center text-center p-4 text-[#5F6962] text-xs">
                      Drop leads here to mark as {column.label}
                    </div>
                  ) : (
                    columnLeads.map(lead => (
                      <div 
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-white border border-[#E1E6E1] hover:border-[#039A01] rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all shadow-xs hover:shadow-sm relative text-[#202020] group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-[#202020] truncate">{lead.customerName}</h4>
                            <p className="text-[11px] text-[#5F6962] truncate mt-0.5 font-medium">
                              {lead.primaryService || lead.serviceInterest || 'Home Healthcare'}
                            </p>
                          </div>
                          
                          <div className="relative">
                            <button 
                              onClick={() => setActiveMenuLeadId(activeMenuLeadId === lead.id ? null : lead.id)}
                              aria-label="View actions" 
                              className="text-[#5F6962] hover:text-[#202020] p-1 rounded hover:bg-[#F5F7F5]"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Status Change Dropdown Menu */}
                            {activeMenuLeadId === lead.id && (
                              <div className="absolute right-0 top-6 z-30 w-44 bg-white border border-[#E1E6E1] rounded-xl shadow-lg p-1.5 text-xs space-y-1 animate-in fade-in zoom-in-95">
                                <p className="px-2 py-1 text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">
                                  Move to Status:
                                </p>
                                {KANBAN_COLUMNS.map(col => (
                                  <button
                                    key={col.id}
                                    onClick={() => changeStatus(lead.id, col.id)}
                                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium hover:bg-[#E7F4E8] hover:text-[#026601] transition-colors ${
                                      lead.status === col.id ? 'bg-[#EFF3EF] font-bold text-[#039A01]' : 'text-[#202020]'
                                    }`}
                                  >
                                    {col.label}
                                  </button>
                                ))}
                                <div className="border-t border-[#E1E6E1] my-1 pt-1">
                                  <button
                                    onClick={() => {
                                      setSelectedLeadForIntake(lead);
                                      setIsIntakeOpen(true);
                                      setActiveMenuLeadId(null);
                                    }}
                                    className="w-full text-left px-2 py-1 rounded text-xs text-[#039A01] font-semibold hover:bg-[#E7F4E8] flex items-center gap-1.5"
                                  >
                                    <FileText className="w-3 h-3" />
                                    View Full Details
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Patient info if present */}
                        {lead.patientName && (
                          <div className="mb-2 text-[11px] text-[#5F6962] bg-[#F5F7F5] px-2 py-1 rounded border border-[#E1E6E1] truncate">
                            <span className="font-semibold text-[#202020]">Patient:</span> {lead.patientName}
                            {lead.patientAge ? ` (${lead.patientAge}y)` : ''}
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#F5F7F5]">
                          <div className="flex items-center gap-1.5 text-xs text-[#202020] font-mono">
                            <Phone className="w-3 h-3 text-[#039A01]" />
                            <span>{lead.phoneNumber}</span>
                          </div>
                          
                          {lead.email && (
                            <div className="text-[11px] text-[#5F6962] truncate">
                              {lead.email}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-[#5F6962] mt-1 pt-1 border-t border-[#E1E6E1]/60">
                            <span className="font-medium">
                              By {lead.agentName || 'Agent'}
                            </span>
                            <Link
                              href={`/customers?id=${lead.id}`}
                              className="text-[#039A01] font-bold hover:underline flex items-center gap-0.5 no-underline"
                            >
                              Timeline <ArrowRight className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Structured Intake Modal */}
      {selectedLeadForIntake && (
        <CallIntakeFormModal
          isOpen={isIntakeOpen}
          onClose={() => {
            setIsIntakeOpen(false);
            setSelectedLeadForIntake(null);
          }}
          initialData={{
            leadId: selectedLeadForIntake.id,
            customerName: selectedLeadForIntake.customerName,
            phoneNumber: selectedLeadForIntake.phoneNumber,
            patientName: selectedLeadForIntake.patientName,
            patientAge: selectedLeadForIntake.patientAge,
            primaryService: selectedLeadForIntake.primaryService || selectedLeadForIntake.serviceInterest,
            serviceAddress: selectedLeadForIntake.serviceAddress,
          }}
          phoneNumber={selectedLeadForIntake.phoneNumber}
          onSaved={() => {
            reloadLeads();
          }}
        />
      )}
    </div>
  );
}
