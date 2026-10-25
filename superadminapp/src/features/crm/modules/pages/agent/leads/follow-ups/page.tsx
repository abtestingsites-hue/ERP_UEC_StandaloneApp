"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useLeadStore } from '../../../../store/useLeadStore';
import { 
  Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, 
  RefreshCw, Plus, Search, Filter, AlertCircle, ArrowRight, MapPin
} from 'lucide-react';
import { apiFetch } from '../../../../lib/api';
import Link from '../../../../nextShim';

interface FollowUpItem {
  id: string;
  leadId?: string;
  followupDate: string;
  meetingType: string;
  status: string;
  purpose?: string | null;
  notes?: string | null;
  assignedAgent?: { name: string } | null;
  lead?: {
    id?: string;
    customerName?: string;
    phoneNumber?: string;
    email?: string | null;
    primaryService?: string | null;
  } | null;
}

export default function LeadFollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUpItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'OVERDUE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const { leads, fetchLeads } = useLeadStore();

  // Form states for manual follow-up creation
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [meetingType, setMeetingType] = useState('CALLBACK');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchFollowups = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/v1/followups`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFollowups(data);
        } else if (data && Array.isArray(data.followups)) {
          setFollowups(data.followups);
        } else {
          setFollowups([]);
        }
      } else {
        setFollowups([]);
      }
    } catch (error) {
      console.warn('Failed to fetch followups:', error);
      setFollowups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
    const token = localStorage.getItem('paramantra_access_token') || '';
    fetchLeads(token);
  }, [fetchLeads]);

  const handleComplete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/v1/followups/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      if (res.ok) {
        setFollowups(followups.map(f => f.id === id ? { ...f, status: 'COMPLETED' } : f));
        setToastMessage('Follow-up marked as completed.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !scheduledDateTime) return;

    setIsSubmitting(true);
    try {
      const stored = localStorage.getItem('crm_user');
      let agentId = null;
      if (stored) agentId = JSON.parse(stored).agentId;

      const res = await apiFetch(`/api/v1/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          followupDate: scheduledDateTime,
          meetingType,
          purpose,
          notes,
          agentId
        })
      });

      if (res.ok) {
        setIsScheduleModalOpen(false);
        setSelectedLeadId('');
        setScheduledDateTime('');
        setPurpose('');
        setNotes('');
        setToastMessage('Follow-up scheduled successfully!');
        setTimeout(() => setToastMessage(null), 3000);
        fetchFollowups();
      } else {
        alert('Could not schedule follow-up. Please verify lead details.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered followups
  const filteredFollowups = useMemo(() => {
    const now = new Date();
    return followups.filter(f => {
      const isCompleted = f.status === 'COMPLETED';
      const isOverdue = !isCompleted && new Date(f.followupDate) < now;

      if (statusFilter === 'COMPLETED' && !isCompleted) return false;
      if (statusFilter === 'PENDING' && (isCompleted || isOverdue)) return false;
      if (statusFilter === 'OVERDUE' && !isOverdue) return false;

      const q = searchTerm.toLowerCase();
      const leadName = (f.lead?.customerName || '').toLowerCase();
      const phone = (f.lead?.phoneNumber || '').toLowerCase();
      const purposeText = (f.purpose || '').toLowerCase();

      return leadName.includes(q) || phone.includes(q) || purposeText.includes(q);
    });
  }, [followups, statusFilter, searchTerm]);

  return (
    <div className="p-4 md:p-6 bg-[#F5F7F5] min-h-screen md:min-h-0 text-[#202020] flex flex-col">
      <div className="max-w-5xl mx-auto w-full space-y-6">

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
                Scheduled Tasks
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#202020]">Follow Ups</h1>
            </div>
            <p className="text-xs text-[#5F6962]">
              Manage callbacks, family consultations, care assessments, and patient status updates.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchFollowups}
              className="p-2.5 bg-white hover:bg-[#F5F7F5] text-[#5F6962] hover:text-[#202020] border border-[#E1E6E1] rounded-xl transition-colors shadow-xs"
              title="Refresh Schedule"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#039A01]' : ''}`} />
            </button>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#039A01] hover:bg-[#026601] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#039A01]/20"
            >
              <Plus className="w-4 h-4" />
              Schedule Follow-up
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 bg-white border border-[#E1E6E1] rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6962]" />
            <input 
              aria-label="Search follow-ups" 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone, purpose..." 
              className="w-full bg-[#FCFDFC] border border-[#E1E6E1] focus:border-[#039A01] rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none text-[#202020] placeholder-[#5F6962]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#5F6962] shrink-0" />
            <div className="flex bg-[#F5F7F5] p-1 rounded-xl border border-[#E1E6E1]">
              {(['ALL', 'PENDING', 'OVERDUE', 'COMPLETED'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === tab 
                      ? 'bg-white text-[#039A01] shadow-xs' 
                      : 'text-[#5F6962] hover:text-[#202020]'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Follow-up Cards List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 bg-white border border-[#E1E6E1] rounded-2xl text-[#5F6962] text-xs font-semibold">
              <RefreshCw className="w-6 h-6 animate-spin text-[#039A01] mx-auto mb-2" />
              Loading schedule...
            </div>
          ) : filteredFollowups.length === 0 ? (
            <div className="text-center py-14 bg-white border border-[#E1E6E1] rounded-2xl text-[#5F6962] shadow-xs">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-[#5F6962]/40" />
              <h3 className="text-sm font-bold text-[#202020] mb-1">No Follow-ups Found</h3>
              <p className="text-xs text-[#5F6962] max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No scheduled activities match your filters. Reset search or switch filter tab.'
                  : 'You do not have any callbacks or appointments scheduled. Click "Schedule Follow-up" to plan an activity.'}
              </p>
            </div>
          ) : (
            filteredFollowups.map(followup => {
              const isCompleted = followup.status === 'COMPLETED';
              const date = new Date(followup.followupDate);
              const isOverdue = !isCompleted && date < new Date();

              return (
                <div
                  key={followup.id}
                  className={`flex flex-col sm:flex-row items-stretch sm:items-start gap-4 p-4 md:p-5 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-white border-[#E1E6E1] opacity-75'
                      : isOverdue
                      ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                      : 'bg-white border-[#E1E6E1] hover:border-[#039A01] shadow-xs'
                  }`}
                >
                  {/* Left: Date/Time Badge */}
                  <div className={`shrink-0 flex sm:flex-col items-center justify-between sm:justify-center w-full sm:w-20 p-3 rounded-xl border text-center ${
                    isCompleted
                      ? 'bg-[#F5F7F5] border-[#E1E6E1] text-[#5F6962]'
                      : isOverdue
                      ? 'bg-rose-100/50 border-rose-200 text-rose-700'
                      : 'bg-[#E7F4E8] border-[#C8E6CA] text-[#026601]'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {date.toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-black leading-none my-0.5">
                      {date.getDate()}
                    </span>
                    <span className="text-[11px] font-bold">
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Middle: Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-[#202020]">
                        {followup.lead?.customerName || 'Prospective Lead'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        followup.meetingType === 'CALLBACK'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-[#E7F4E8] text-[#026601] border-[#C8E6CA]'
                      }`}>
                        {followup.meetingType}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#5F6962] mb-3">
                      <div className="flex items-center gap-1 font-mono font-medium text-[#202020]">
                        <Phone className="w-3.5 h-3.5 text-[#039A01]" />
                        <span>{followup.lead?.phoneNumber || 'No phone recorded'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>Assigned: {followup.assignedAgent?.name || 'You'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {followup.purpose && (
                        <div className="bg-[#F5F7F5] p-2.5 rounded-xl border border-[#E1E6E1]">
                          <p className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider mb-0.5">Purpose</p>
                          <p className="text-xs font-semibold text-[#202020]">{followup.purpose}</p>
                        </div>
                      )}
                      {followup.notes && (
                        <div className="bg-[#F5F7F5] p-2.5 rounded-xl border border-[#E1E6E1]">
                          <p className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider mb-0.5">Notes</p>
                          <p className="text-xs text-[#5F6962]">{followup.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="shrink-0 flex sm:flex-col items-center justify-between gap-2 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-[#E1E6E1] sm:border-t-0">
                    {!isCompleted ? (
                      <button
                        onClick={() => handleComplete(followup.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#E7F4E8] hover:bg-[#C8E6CA] text-[#026601] border border-[#C8E6CA] rounded-xl text-xs font-bold transition-all w-full sm:w-auto"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#039A01]" />
                        Mark Complete
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[#026601] bg-[#E7F4E8] rounded-xl text-xs font-bold border border-[#C8E6CA]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#039A01]" />
                        Completed
                      </div>
                    )}

                    {followup.lead?.id && (
                      <Link
                        href={`/customers?id=${followup.lead.id}`}
                        className="text-xs text-[#039A01] font-semibold hover:underline flex items-center gap-1 no-underline"
                      >
                        Timeline <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Manual Schedule Follow-up Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E1E6E1] rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-[#202020] mb-1">Schedule New Follow-up</h3>
            <p className="text-xs text-[#5F6962] mb-5">Link a scheduled reminder or callback to an active lead.</p>

            <form onSubmit={handleCreateFollowup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#5F6962] uppercase tracking-wider block mb-1.5">
                  Select Lead
                </label>
                <select
                  required
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full bg-[#FCFDFC] border border-[#E1E6E1] focus:border-[#039A01] rounded-xl px-3 py-2 text-xs outline-none text-[#202020]"
                >
                  <option value="">-- Choose Lead --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.customerName} ({l.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5F6962] uppercase tracking-wider block mb-1.5">
                    Activity Type
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="w-full bg-[#FCFDFC] border border-[#E1E6E1] focus:border-[#039A01] rounded-xl px-3 py-2 text-xs outline-none text-[#202020]"
                  >
                    <option value="CALLBACK">Phone Callback</option>
                    <option value="MEETING">Family Meeting</option>
                    <option value="ASSESSMENT">Home Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5F6962] uppercase tracking-wider block mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full bg-[#FCFDFC] border border-[#E1E6E1] focus:border-[#039A01] rounded-xl px-3 py-2 text-xs outline-none text-[#202020]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#5F6962] uppercase tracking-wider block mb-1.5">
                  Purpose / Agenda
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Confirm 24-hr nursing availability and rates"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-[#FCFDFC] border border-[#E1E6E1] focus:border-[#039A01] rounded-xl px-3 py-2 text-xs outline-none text-[#202020] placeholder-[#5F6962]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5F6962] uppercase tracking-wider block mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions or customer preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#FCFDFC] border border-[#E1E6E1] focus:border-[#039A01] rounded-xl px-3 py-2 text-xs outline-none text-[#202020] placeholder-[#5F6962] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5F6962] hover:text-[#202020] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#039A01] hover:bg-[#026601] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Scheduling...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
