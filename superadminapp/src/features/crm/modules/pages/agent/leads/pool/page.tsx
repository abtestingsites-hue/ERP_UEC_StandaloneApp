"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useLeadStore } from '../../../../store/useLeadStore';
import { useCallStore } from '../../../../store/useCallStore';
import { CallIntakeFormModal } from '../../../../components/call-center/CallIntakeFormModal';
import { CustomerHistoryDrawer } from '../../../../components/call-center/CustomerHistoryDrawer';
import Link from '../../../../nextShim';
import {
  Phone,
  Users,
  Calendar,
  AlertCircle,
  Filter,
  Search,
  Plus,
  Globe,
  MessageCircle,
  ThumbsUp,
  Camera,
  Mail,
  UserPlus,
  Store,
  PhoneCall,
  FileText,
  History,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

export default function AgentLeadsPage() {
  const { leads, fetchLeads, claimLead, isLoading } = useLeadStore();
  const { setActiveCall } = useCallStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Privacy Unmasking State
  const [unmaskedLeads, setUnmaskedLeads] = useState<Record<string, boolean>>({});

  // Intake Form Modal (Manual Entry & Edit Details)
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [selectedLeadForIntake, setSelectedLeadForIntake] = useState<any | null>(null);

  // Customer History Intelligence Drawer
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Action notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleMask = (leadId: string) => {
    setUnmaskedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  const getMaskedPhone = (phone: string, isUnmasked: boolean) => {
    if (!phone) return '—';
    if (isUnmasked) return phone;
    if (phone.length <= 4) return phone;
    const visibleStart = phone.slice(0, 3);
    const visibleEnd = phone.slice(-2);
    const maskedLength = Math.max(phone.length - 5, 4);
    return `${visibleStart}${'*'.repeat(maskedLength)}${visibleEnd}`;
  };

  const getSourceIcon = (source?: string | null) => {
    const s = source?.toLowerCase() || '';
    if (s.includes('whatsapp')) return <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />;
    if (s.includes('facebook')) return <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />;
    if (s.includes('instagram')) return <Camera className="w-3.5 h-3.5 text-pink-600" />;
    if (s.includes('email')) return <Mail className="w-3.5 h-3.5 text-rose-600" />;
    if (s.includes('referral')) return <UserPlus className="w-3.5 h-3.5 text-purple-600" />;
    if (s.includes('walk-in') || s.includes('walkin')) return <Store className="w-3.5 h-3.5 text-amber-600" />;
    if (s.includes('inbound') || s.includes('incoming')) return <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />;
    if (s.includes('outbound') || s.includes('outgoing')) return <Phone className="w-3.5 h-3.5 text-blue-600" />;
    if (s.includes('manual')) return <FileText className="w-3.5 h-3.5 text-cyan-600" />;
    return <Globe className="w-3.5 h-3.5 text-[#5F6962]" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">NEW</span>;
      case 'CONTACTED':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">CONTACTED</span>;
      case 'QUALIFIED':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">QUALIFIED</span>;
      case 'CONVERTED':
        return <span className="px-2.5 py-0.5 rounded-full bg-[#E7F4E8] text-[#026601] text-xs font-semibold border border-[#C8E6CA]">CONVERTED</span>;
      case 'FOLLOWUP_REQUIRED':
        return <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-200">FOLLOW-UP</span>;
      case 'LOST':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">LOST</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-[#F5F7F5] text-[#5F6962] text-xs font-semibold border border-[#E1E6E1]">{status}</span>;
    }
  };

  const reloadLeads = () => {
    const token = localStorage.getItem('paramantra_access_token') || '';
    fetchLeads(token, '');
  };

  useEffect(() => {
    reloadLeads();
  }, [fetchLeads]);

  const handleClaim = async (leadId: string) => {
    let agentId = null;
    try {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        agentId = JSON.parse(stored).agentId;
      }
    } catch (e) {
      console.warn('[UI Exception Swallowed Fixed]:', e);
    }

    if (!agentId) {
      agentId = 'agent-active';
    }

    const success = await claimLead(leadId, agentId);
    if (success) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setActiveCall({
          callSid: `outbound-${Date.now()}`,
          phone: lead.phoneNumber,
          customerName: lead.customerName,
          category: 'Outbound',
          isCaller: true,
          status: 'RINGING',
          leadId: lead.id
        });
      }
      setToastMessage("Lead claimed! Outbound call initiated.");
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      alert("Failed to claim lead. It might be locked by another agent.");
    }
  };

  const handleCallLead = (lead: any) => {
    setActiveCall({
      callSid: `outbound-${Date.now()}`,
      phone: lead.phoneNumber,
      customerName: lead.customerName,
      category: 'Outbound',
      isCaller: true,
      status: 'RINGING',
      leadId: lead.id,
    });
    setToastMessage(`Initiating outbound call to ${lead.customerName}...`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEditIntake = (lead: any) => {
    setSelectedLeadForIntake(lead);
    setIsIntakeOpen(true);
  };

  const handleOpenManualEntry = () => {
    setSelectedLeadForIntake(null);
    setIsIntakeOpen(true);
  };

  const handleOpenCustomerHistory = (phone: string) => {
    setHistoryPhone(phone);
    setIsHistoryOpen(true);
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (!l) return false;
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;

      const q = searchTerm.toLowerCase();
      const name = (l.customerName || '').toLowerCase();
      const phone = (l.phoneNumber || '').toLowerCase();
      const service = (l.primaryService || l.serviceInterest || '').toLowerCase();
      const patient = (l.patientName || '').toLowerCase();
      const summary = (l.enquirySummary || '').toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        service.includes(q) ||
        patient.includes(q) ||
        summary.includes(q)
      );
    });
  }, [leads, searchTerm, statusFilter]);

  return (
    <div className="p-4 md:p-6 bg-[#F5F7F5] min-h-screen text-[#202020]">
      <div className="max-w-7xl mx-auto space-y-5">
        
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
                Agent Lead Pool
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#202020]">Lead Data</h1>
            </div>
            <p className="text-xs text-[#5F6962]">
              Active client enquiries, service requirements, and disposition logs assigned to telecallers.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={reloadLeads}
              className="p-2.5 bg-white hover:bg-[#F5F7F5] text-[#5F6962] hover:text-[#202020] border border-[#E1E6E1] rounded-xl transition-colors shadow-xs"
              title="Refresh Leads"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#039A01]' : ''}`} />
            </button>
            <button 
              onClick={handleOpenManualEntry}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#039A01] hover:bg-[#026601] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#039A01]/20"
            >
              <Plus className="w-4 h-4" />
              Manual Enquiry Entry
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white border border-[#E1E6E1] p-3 rounded-2xl shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6962]" />
            <input 
              aria-label="Search leads by name, phone, or service" 
              type="text"
              placeholder="Search enquiries by customer name, phone, service, or patient details..."
              className="w-full bg-[#FCFDFC] border border-[#E1E6E1] rounded-xl py-2 pl-9 pr-4 text-xs text-[#202020] placeholder-[#5F6962] focus:outline-none focus:border-[#039A01] transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#5F6962] shrink-0" />
            <select
              aria-label="Status filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#E1E6E1] text-xs text-[#202020] font-medium rounded-xl px-3 py-2 outline-none focus:border-[#039A01]"
            >
              <option value="ALL">All Statuses ({leads.length})</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONVERTED">Converted</option>
              <option value="FOLLOWUP_REQUIRED">Follow-up Required</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
        </div>

        {/* Primary Lead Data Table — 6 Columns */}
        <div className="hidden md:block bg-white border border-[#E1E6E1] rounded-2xl overflow-hidden shadow-xs">
          <table aria-label="Lead Data Table" className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F5] border-b border-[#E1E6E1] text-[11px] font-bold text-[#5F6962] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Enquiry / Client Details</th>
                <th className="px-5 py-3.5">Requirement / Patient</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Source</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6E1]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-[#5F6962]">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#039A01] mx-auto mb-2" />
                    Loading prospective enquiries...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-[#5F6962]">
                    <Users className="w-10 h-10 mx-auto mb-2 text-[#5F6962]/40" />
                    <p className="font-semibold text-sm text-[#202020]">No enquiries found in this view</p>
                    <p className="text-xs text-[#5F6962] mt-0.5">Try clearing filters or click "Manual Enquiry Entry" to add one.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const subServices = Array.isArray(lead.subServices) ? lead.subServices : [];
                  const isUnmasked = Boolean(unmaskedLeads[lead.id]);
                  const displayedPhone = getMaskedPhone(lead.phoneNumber, isUnmasked);

                  return (
                    <tr key={lead.id} className="hover:bg-[#F9FAF9] transition-colors">
                      {/* Enquiry & Patient */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[#202020]">{lead.customerName}</span>
                          {lead.patientName && (
                            <span className="text-[11px] text-[#5F6962] flex items-center gap-1 mt-0.5">
                              <HeartPulse className="w-3 h-3 text-rose-500" />
                              Patient: <strong className="text-[#202020]">{lead.patientName}</strong>
                              {lead.patientAge ? ` (${lead.patientAge}y)` : ''}
                            </span>
                          )}
                          <span className="text-[10px] text-[#5F6962] mt-0.5">
                            Created: {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Requirement & Service */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="space-y-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#E7F4E8] text-[#026601] text-[11px] font-semibold border border-[#C8E6CA]">
                            {lead.primaryService || lead.serviceInterest || 'Home Healthcare'}
                          </span>
                          {subServices.length > 0 && (
                            <p className="text-[11px] text-[#5F6962] truncate">
                              Req: <span className="text-[#202020] font-medium">{subServices.join(', ')}</span>
                            </p>
                          )}
                          {lead.patientConditions && (
                            <p className="text-[10px] text-[#5F6962] truncate">
                              Cond: {lead.patientConditions}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Contact with Privacy Toggle */}
                      <td className="px-5 py-4 font-mono">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#202020] font-semibold">{displayedPhone}</span>
                            <button
                              onClick={() => toggleMask(lead.id)}
                              className="text-[#5F6962] hover:text-[#039A01] p-0.5 rounded transition-colors"
                              title={isUnmasked ? 'Mask Phone' : 'Click to Unmask Authorized Contact'}
                            >
                              {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {lead.email && <span className="text-[10px] text-[#5F6962] font-sans truncate">{lead.email}</span>}
                          {lead.cityDistrict && (
                            <span className="text-[10px] text-[#5F6962] flex items-center gap-1 mt-0.5 font-sans">
                              <MapPin className="w-2.5 h-2.5 text-[#5F6962]" /> {lead.cityDistrict}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {getSourceIcon(lead.source)}
                          <span className="text-xs text-[#202020] font-medium">{lead.source || 'Website'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {getStatusBadge(lead.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Structured Intake */}
                          <button
                            onClick={() => handleOpenEditIntake(lead)}
                            className="p-1.5 rounded-lg bg-white hover:bg-[#F5F7F5] text-[#202020] border border-[#E1E6E1] transition-colors shadow-xs"
                            title="View / Edit Enquiry Details"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#039A01]" />
                          </button>

                          {/* Customer History */}
                          <button
                            onClick={() => handleOpenCustomerHistory(lead.phoneNumber)}
                            className="p-1.5 rounded-lg bg-white hover:bg-[#F5F7F5] text-[#202020] border border-[#E1E6E1] transition-colors shadow-xs"
                            title="Customer Call History & Messaging Timeline"
                          >
                            <History className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {/* Leads Timeline View */}
                          <Link
                            href={`/customers?id=${lead.id}`}
                            className="p-1.5 rounded-lg bg-white hover:bg-[#F5F7F5] text-[#202020] border border-[#E1E6E1] transition-colors shadow-xs no-underline flex items-center"
                            title="Inspect Leads Timeline"
                          >
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                          </Link>

                          {/* Call / Claim */}
                          {lead.status === 'NEW' ? (
                            <button
                              onClick={() => handleClaim(lead.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#039A01] hover:bg-[#026601] text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                              title="Claim and Call"
                            >
                              <Phone className="w-3 h-3" />
                              Claim
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCallLead(lead)}
                              className="p-1.5 rounded-lg bg-[#E7F4E8] hover:bg-[#C8E6CA] text-[#026601] border border-[#C8E6CA] transition-colors"
                              title="Call Lead"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-12 bg-white border border-[#E1E6E1] rounded-2xl text-[#5F6962] text-xs">
              Loading enquiries...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#E1E6E1] rounded-2xl text-[#5F6962] text-xs">
              No enquiries match this filter.
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-white border border-[#E1E6E1] rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#202020]">{lead.customerName}</h4>
                    <p className="text-xs font-mono text-[#5F6962]">{lead.phoneNumber}</p>
                  </div>
                  <div>{getStatusBadge(lead.status)}</div>
                </div>

                <div className="bg-[#F5F7F5] p-2.5 rounded-xl border border-[#E1E6E1] text-[11px] space-y-1">
                  <span className="text-[#5F6962] font-semibold block uppercase tracking-wider text-[10px]">
                    Requirement
                  </span>
                  <p className="text-[#202020] font-medium">
                    {lead.primaryService || lead.serviceInterest || 'Home Healthcare'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E1E6E1]">
                  <div className="flex items-center gap-1.5 text-xs text-[#5F6962]">
                    {getSourceIcon(lead.source)}
                    <span>{lead.source || 'Website'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditIntake(lead)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E1E6E1] text-xs text-[#202020] font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCallLead(lead)}
                      className="px-3 py-1 rounded-lg bg-[#039A01] hover:bg-[#026601] text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Structured Intake Form Modal (Manual Entry or Edit Lead) */}
      {isIntakeOpen && (
        <CallIntakeFormModal
          isOpen={isIntakeOpen}
          onClose={() => {
            setIsIntakeOpen(false);
            setSelectedLeadForIntake(null);
          }}
          leadId={selectedLeadForIntake?.id}
          customerName={selectedLeadForIntake?.customerName}
          phoneNumber={selectedLeadForIntake?.phoneNumber}
          initialData={selectedLeadForIntake}
          onSuccess={() => {
            reloadLeads();
            setToastMessage("Enquiry intake saved and persisted successfully.");
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* Customer History Drawer */}
      <CustomerHistoryDrawer
        identifier={historyPhone}
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryPhone(null);
        }}
      />
    </div>
  );
}
