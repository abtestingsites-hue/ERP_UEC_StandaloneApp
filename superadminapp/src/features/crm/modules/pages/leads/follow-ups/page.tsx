"use client";

import React, { useEffect, useState } from 'react';
import { useLeadStore } from '../../../store/useLeadStore';
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../../lib/api';

export default function LeadFollowUpsPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFollowups = async () => {
      try {
        const res = await apiFetch(`/api/v1/followups`);
        if (!res.ok) throw new Error('Failed to fetch followups');
        const data = await res.json();
        if (Array.isArray(data)) {
          setFollowups(data);
        } else {
          console.error('Expected an array of followups but received:', data);
          setFollowups([]);
        }
      } catch (error) {
        console.error(error);
        setFollowups([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFollowups();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await apiFetch(`/api/v1/followups/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      setFollowups(followups.map(f => f.id === id ? { ...f, status: 'COMPLETED' } : f));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follow Ups</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your scheduled callbacks and meetings.</p>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading schedule...</div>
          ) : followups.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#E1E6E1] rounded-2xl text-[#5F6962] shadow-xs">
              <CalendarIcon className="w-8 h-8 mx-auto mb-3 text-[#5F6962]/40" />
              <h3 className="text-sm font-bold text-[#202020] mb-1">No upcoming followups scheduled</h3>
              <p className="text-xs text-[#5F6962]">You currently do not have any pending callbacks or follow-up tasks.</p>
            </div>
          ) : (
            followups.map(followup => {
              const isCompleted = followup.status === 'COMPLETED';
              const date = new Date(followup.followupDate);

              return (
                <div
                  key={followup.id}
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-colors shadow-xs ${isCompleted ? 'bg-[#FAFCFA] border-[#E1E6E1] opacity-60' : 'bg-white border-[#E1E6E1] hover:border-[#039A01]'
                    }`}
                >
                  {/* Left: Date/Time */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-20 p-3 bg-[#FAFCFA] rounded-xl border border-[#E1E6E1]">
                    <span className="text-xs text-[#5F6962] font-semibold uppercase tracking-wider">
                      {date.toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-bold text-[#202020]">
                      {date.getDate()}
                    </span>
                    <span className="text-xs text-[#026601] font-bold mt-1">
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Middle: Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-bold text-[#202020]">{followup.lead?.customerName || 'Unknown Lead'}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${followup.meetingType === 'CALLBACK' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA]'
                        }`}>
                        {followup.meetingType}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-[#5F6962] mb-3">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#849389]" />
                        {followup.lead?.phoneNumber}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#849389]" />
                        Assigned: {followup.assignedAgent?.name || 'You'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {followup.purpose && (
                        <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                          <p className="text-xs text-slate-500 mb-1">Appointment Purpose</p>
                          <p className="text-sm text-slate-300">{followup.purpose}</p>
                        </div>
                      )}
                      {followup.notes && (
                        <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                          <p className="text-xs text-slate-500 mb-1">Additional Notes</p>
                          <p className="text-sm text-slate-300">{followup.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="shrink-0 flex flex-col gap-2">
                    {!isCompleted ? (
                      <button
                        onClick={() => handleComplete(followup.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Complete
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 text-slate-500 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
