import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingState } from '../components/LoadingState';
import {
  Headset,
  PhoneCall,
  CalendarCheck,
  Activity,
  Users,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEnquiries } from '../features/enquiry/hooks/useEnquiry';
import { useComplaints, usePendingFeedback, useWelcomeCalls } from '../features/customer-care/hooks/useCustomerCare';
import { usePartners, useCampaigns } from '../features/crm/hooks/useCrm';
import type { Enquiry } from '../features/enquiry/types';

export const Dashboard: React.FC = () => {
  const enquiriesQuery = useEnquiries();
  const complaintsQuery = useComplaints();
  const pendingFeedbackQuery = usePendingFeedback();
  const welcomeCallsQuery = useWelcomeCalls();
  const partnersQuery = usePartners();
  const campaignsQuery = useCampaigns();

  const enquiries = (enquiriesQuery.data || []) as Enquiry[];
  const complaints = complaintsQuery.data || [];
  const pendingFeedback = pendingFeedbackQuery.data || [];
  const welcomeCalls = welcomeCallsQuery.data || [];
  const partners = partnersQuery.data || [];
  const campaigns = campaignsQuery.data || [];

  const isLoading = enquiriesQuery.isLoading;
  const isError = enquiriesQuery.isError;

  // Derive live metrics from backend queries
  const totalEnquiries = enquiries.length;
  const activeLeads = enquiries.filter(
    (e) => e.status === 'Open' || e.status === 'Follow Up' || e.status === 'In Progress'
  ).length;
  const followUpsDue = enquiries.filter(
    (e) => e.lastFollowUp && e.status !== 'Converted' && e.status !== 'Lost'
  ).length;
  const conversions = enquiries.filter(
    (e) => e.status === 'Converted' || Boolean(e.admissionId)
  ).length;

  // Pipeline status breakdown
  const openCount = enquiries.filter((e) => e.status === 'Open').length;
  const followUpCount = enquiries.filter((e) => e.status === 'Follow Up').length;
  const inProgressCount = enquiries.filter((e) => e.status === 'In Progress').length;
  const convertedCount = conversions;
  const lostCount = enquiries.filter((e) => e.status === 'Lost').length;

  // Customer care metrics
  const openComplaints = complaints.filter(
    (c) => c.status === 'Open' || c.status === 'In Progress'
  ).length;
  const pendingFeedbackCount = pendingFeedback.length;
  const pendingWelcomeCalls = welcomeCalls.filter(
    (w) => w.status === 'PENDING' || !w.callDate
  ).length;

  // B2P & Marketing metrics
  const totalPartners = partners.length;
  const totalReferrals = partners.reduce(
    (sum, p) => sum + (p._count?.referrals || 0),
    0
  );
  const activeCampaigns = campaigns.filter(
    (c) =>
      String(c.status).toUpperCase() === 'ACTIVE' ||
      String(c.status).toUpperCase() === 'RUNNING'
  ).length;

  const statCards = [
    {
      title: 'Total Enquiries',
      value: isLoading ? '...' : totalEnquiries,
      desc: 'All recorded leads & inquiries',
      icon: PhoneCall,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'Active Leads',
      value: isLoading ? '...' : activeLeads,
      desc: 'Open & in-progress lead pipeline',
      icon: Activity,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Follow-ups Due',
      value: isLoading ? '...' : followUpsDue,
      desc: 'Active callbacks & follow-ups',
      icon: CalendarCheck,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Conversions',
      value: isLoading ? '...' : conversions,
      desc: 'Converted to admission/client',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  const quickLinks = [
    { title: 'Enquiry Desk', path: '/crm/dashboard', desc: 'Main CRM Command Center & Analytics' },
    { title: 'New Lead Capture', path: '/crm/new-enquiry', desc: 'Onboard & qualify new lead inquiry' },
    { title: 'Active Pipeline', path: '/crm/active-enquiries', desc: 'Scored active lead filter & priority' },
    { title: 'Follow-up Call Queue', path: '/crm/enquiry-follow-up', desc: 'Coordinator scheduled callbacks' },
    { title: 'B2P Referral Desk', path: '/crm/b2p', desc: 'Partner & physician referral tracking' },
    { title: 'Customer Care', path: '/crm/customer-care', desc: 'Support complaints & feedback queue' },
    { title: 'Marketing Analytics', path: '/crm/marketing', desc: 'Campaign ROI & lead channel performance' },
    { title: 'Client Directory', path: '/crm/clients', desc: 'Shared Client Master handoff list' }
  ];

  const recentEnquiries = enquiries.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Operational Dashboard"
        subtitle="Live standalone overview of lead capture, active pipeline, follow-up accountability, and customer care."
        icon={Headset}
      />

      {/* API Error Notice if backend connection fails */}
      {isError && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-start gap-3.5 text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-200">Unable to Fetch Live CRM Data</h4>
            <p className="text-xs text-rose-300/80 mt-1">
              Could not retrieve enquiry metrics from Shared ERP Backend. Please verify that backend is running on port 4000.
            </p>
          </div>
        </div>
      )}

      {/* Live KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <Card key={idx} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">{card.title}</p>
                <h3 className="text-2xl font-extrabold text-slate-100 mt-2">{card.value}</h3>
                <p className="text-[11px] text-slate-500 mt-1">{card.desc}</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Operational Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enquiry Pipeline Breakdown */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100">Enquiry Pipeline Overview</h3>
              <p className="text-xs text-slate-400">Live breakdown of enquiries by lifecycle stage</p>
            </div>
            <Link
              to="/crm/active-enquiries"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View Active Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8">
              <LoadingState message="Loading enquiry pipeline data..." />
            </div>
          ) : enquiries.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 italic">
              No live enquiry records found for the current unit.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-medium text-slate-400 block">Open Leads</span>
                <span className="text-xl font-bold text-slate-100 mt-1 block">{openCount}</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${totalEnquiries ? (openCount / totalEnquiries) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-medium text-cyan-400 block">Follow Up</span>
                <span className="text-xl font-bold text-cyan-300 mt-1 block">{followUpCount}</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${totalEnquiries ? (followUpCount / totalEnquiries) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-medium text-amber-400 block">In Progress</span>
                <span className="text-xl font-bold text-amber-300 mt-1 block">{inProgressCount}</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${totalEnquiries ? (inProgressCount / totalEnquiries) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-medium text-emerald-400 block">Converted</span>
                <span className="text-xl font-bold text-emerald-300 mt-1 block">{convertedCount}</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${totalEnquiries ? (convertedCount / totalEnquiries) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-medium text-rose-400 block">Closed / Lost</span>
                <span className="text-xl font-bold text-rose-300 mt-1 block">{lostCount}</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${totalEnquiries ? (lostCount / totalEnquiries) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recent Enquiries List */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
              Recent Lead Intake
            </h4>
            {isLoading ? (
              <p className="text-xs text-slate-500">Loading recent entries...</p>
            ) : recentEnquiries.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No recent enquiries.</p>
            ) : (
              <div className="space-y-2">
                {recentEnquiries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{e.refNo}</span>
                        <span className="text-slate-400 font-medium truncate">{e.clientName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {e.service} • {e.source}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          e.status === 'Converted'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : e.status === 'In Progress'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {e.status}
                      </span>
                      <Link
                        to={`/crm/enquiry-follow-up/${e.id}`}
                        className="text-slate-400 hover:text-indigo-400 p-1 transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Domain Metrics (Customer Care, B2P, Marketing) */}
        <div className="space-y-4">
          {/* Customer Care Summary */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-100">Customer Care Summary</h4>
              </div>
              <Link
                to="/crm/customer-care"
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Open Desk
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Open Complaints</span>
                <span className="text-base font-bold text-rose-400 mt-0.5 block">
                  {complaintsQuery.isLoading ? '...' : openComplaints}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Pending Feedback</span>
                <span className="text-base font-bold text-amber-400 mt-0.5 block">
                  {pendingFeedbackQuery.isLoading ? '...' : pendingFeedbackCount}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Welcome Calls</span>
                <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                  {welcomeCallsQuery.isLoading ? '...' : pendingWelcomeCalls}
                </span>
              </div>
            </div>
          </div>

          {/* B2P & Marketing Summary */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-100">B2P & Marketing</h4>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> B2P Partners
                </span>
                <span className="font-bold text-slate-200">
                  {partnersQuery.isLoading ? '...' : totalPartners}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Total Referrals
                </span>
                <span className="font-bold text-slate-200">
                  {partnersQuery.isLoading ? '...' : totalReferrals}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Active Campaigns
                </span>
                <span className="font-bold text-slate-200">
                  {campaignsQuery.isLoading ? '...' : activeCampaigns}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Navigation Matrix */}
      <div>
        <h3 className="text-base font-bold text-slate-100 mb-3">CRM Operational Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className="group p-4 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl transition-all flex flex-col justify-between hover:shadow-lg hover:shadow-indigo-600/5"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-indigo-400 border border-slate-700/60">
                    Live Operational
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors transform group-hover:translate-x-1" />
                </div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                {item.path}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

