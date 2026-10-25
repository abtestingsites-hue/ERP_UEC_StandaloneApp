"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  UserRound, Search, Filter, Phone, Mail, MapPin, 
  Clock, Calendar, History, ArrowRight, UserCheck, 
  ExternalLink, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../../lib/api';
import { CustomerHistoryDrawer } from '../../../components/call-center/CustomerHistoryDrawer';
import Link from '../../../nextShim';

interface CustomerProfile {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
  patientName?: string | null;
  patientAge?: number | null;
  patientConditions?: string | null;
  serviceInterest?: string | null;
  status?: string;
  createdAt?: string;
  lastContactedAt?: string | null;
  assignedAgentName?: string | null;
  source?: string | null;
  address?: string | null;
}

export default function AgentCustomers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Customer History Drawer
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const loadCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch from /api/v1/customers
      const res = await apiFetch(`/api/v1/customers`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.customers || []);
        if (list.length > 0) {
          setCustomers(list.map((c: any) => ({
            id: c.id,
            name: c.name || c.customerName || 'Customer',
            phoneNumber: c.phoneNumber || c.phone || '',
            email: c.email || null,
            patientName: c.patientName || c.patient?.name || null,
            patientAge: c.patientAge || c.patient?.age || null,
            patientConditions: c.patientConditions || c.patient?.conditions || null,
            serviceInterest: c.serviceInterest || c.primaryService || 'Comprehensive Care',
            status: c.status || 'ACTIVE',
            createdAt: c.createdAt || new Date().toISOString(),
            lastContactedAt: c.lastContactedAt || null,
            assignedAgentName: c.assignedAgent?.name || c.agentName || 'Agent',
            source: c.source || 'Lead Conversion',
            address: c.address || c.serviceAddress || null,
          })));
          return;
        }
      }

      // 2. If /api/v1/customers is empty or unpopulated, load converted leads from /api/v1/leads?status=CONVERTED
      const fallbackRes = await apiFetch(`/api/v1/leads?status=CONVERTED`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const leadsList = Array.isArray(data) ? data : [];
        setCustomers(leadsList.map((l: any) => ({
          id: l.id,
          name: l.customerName,
          phoneNumber: l.phoneNumber,
          email: l.email,
          patientName: l.patientName,
          patientAge: l.patientAge,
          patientConditions: l.patientConditions,
          serviceInterest: l.primaryService || l.serviceInterest || 'Home Healthcare',
          status: 'CONVERTED',
          createdAt: l.createdAt,
          lastContactedAt: l.updatedAt || l.createdAt,
          assignedAgentName: l.agentName || 'Assigned Agent',
          source: l.source || 'Website',
          address: l.serviceAddress || l.cityDistrict || null,
        })));
      } else {
        throw new Error('Unable to retrieve customer records');
      }
    } catch (err: any) {
      console.warn('Customer Directory fetch notice:', err);
      setError('Unable to load directory records. Please verify network or session state.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      const q = searchTerm.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.phoneNumber || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.patientName || '').toLowerCase().includes(q) ||
        (c.serviceInterest || '').toLowerCase().includes(q)
      );
    });
  }, [customers, searchTerm, statusFilter]);

  const handleOpenHistory = (phone: string) => {
    setHistoryPhone(phone);
    setIsHistoryOpen(true);
  };

  return (
    <div className="flex-1 p-4 md:p-6 h-full flex flex-col overflow-y-auto custom-scrollbar relative bg-[#F5F7F5] text-[#202020]">
      {/* Page Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1E6E1]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA]">
              Authorized Accounts
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#202020] flex items-center gap-2">
              <UserRound className="text-[#039A01] w-6 h-6" /> Customer Directory
            </h1>
          </div>
          <p className="text-xs text-[#5F6962]">
            Comprehensive client profiles, converted leads, service engagements, and permanent audit histories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomers}
            className="p-2.5 bg-white hover:bg-[#F5F7F5] text-[#5F6962] hover:text-[#202020] border border-[#E1E6E1] rounded-xl transition-colors shadow-xs"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#039A01]' : ''}`} />
          </button>
          <Link
            href="/customers"
            className="flex items-center gap-2 px-4 py-2 bg-[#039A01] hover:bg-[#026601] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#039A01]/20 no-underline"
          >
            <Clock className="w-4 h-4" />
            Audit Timelines
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="bg-white border border-[#E1E6E1] rounded-2xl flex-1 flex flex-col shadow-xs overflow-hidden">
        
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-[#E1E6E1] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FCFDFC]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6962]" />
            <input 
              aria-label="Search customers" 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone, patient, or service..." 
              className="w-full bg-white border border-[#E1E6E1] focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] rounded-xl pl-9 pr-4 py-2 text-xs outline-none text-[#202020] transition-all placeholder-[#5F6962]"
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
              <option value="ALL">All Profiles ({customers.length})</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="CONVERTED">Converted Leads</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 text-[#5F6962]">
              <RefreshCw className="w-8 h-8 animate-spin text-[#039A01] mb-3" />
              <p className="text-sm font-semibold">Loading customer records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-[#202020] mb-1">Failed to Load Customers</h3>
              <p className="text-xs text-[#5F6962] max-w-sm mb-4">{error}</p>
              <button
                onClick={loadCustomers}
                className="px-4 py-2 bg-white border border-[#E1E6E1] hover:bg-[#F5F7F5] rounded-xl text-xs font-semibold text-[#202020]"
              >
                Try Again
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#E7F4E8] flex items-center justify-center border border-[#C8E6CA] mb-4">
                <UserRound className="w-8 h-8 text-[#039A01]" />
              </div>
              <h3 className="text-base font-bold text-[#202020] mb-1">No Customer Profiles Found</h3>
              <p className="text-xs text-[#5F6962] max-w-md">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No customers match the current search filters. Clear filters to see all authorized profiles.'
                  : 'Converted leads and registered clients will appear here automatically with their complete interaction histories.'}
              </p>
              {(searchTerm || statusFilter !== 'ALL') && (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                  className="mt-4 px-3 py-1.5 text-xs font-semibold text-[#039A01] hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#E1E6E1]">
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-[#F5F7F5] text-[11px] font-bold text-[#5F6962] uppercase tracking-wider">
                <div className="col-span-4">Customer & Patient</div>
                <div className="col-span-3">Service & Requirement</div>
                <div className="col-span-2">Contact Details</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {filteredCustomers.map((customer) => (
                <div 
                  key={customer.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#F9FAF9] transition-colors"
                >
                  {/* Customer & Patient */}
                  <div className="lg:col-span-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E7F4E8] text-[#026601] font-bold flex items-center justify-center shrink-0 border border-[#C8E6CA] text-sm">
                      {customer.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#202020] leading-snug">{customer.name}</h4>
                      {customer.patientName && (
                        <p className="text-xs text-[#5F6962] flex items-center gap-1 mt-0.5">
                          <span className="font-semibold text-[#202020]">Patient:</span> {customer.patientName}
                          {customer.patientAge ? ` (${customer.patientAge} yrs)` : ''}
                        </p>
                      )}
                      <p className="text-[11px] text-[#5F6962] mt-0.5">
                        Client since {new Date(customer.createdAt || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Service & Requirement */}
                  <div className="lg:col-span-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#E7F4E8] text-[#026601] text-[11px] font-semibold border border-[#C8E6CA] mb-1">
                      {customer.serviceInterest}
                    </span>
                    {customer.patientConditions && (
                      <p className="text-xs text-[#5F6962] line-clamp-1">
                        <span className="font-medium text-[#202020]">Cond:</span> {customer.patientConditions}
                      </p>
                    )}
                    {customer.address && (
                      <p className="text-[11px] text-[#5F6962] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#5F6962] shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="lg:col-span-2 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-[#202020]">
                      <Phone className="w-3.5 h-3.5 text-[#039A01]" />
                      <span>{customer.phoneNumber}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-[#5F6962] truncate">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-1">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA]">
                      {customer.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenHistory(customer.phoneNumber)}
                      className="p-2 rounded-xl bg-white hover:bg-[#F5F7F5] text-[#202020] border border-[#E1E6E1] transition-colors"
                      title="Customer Call History & Omnichannel Audit"
                    >
                      <History className="w-3.5 h-3.5 text-[#039A01]" />
                    </button>
                    <Link
                      href={`/customers?id=${customer.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#F5F7F5] hover:bg-[#E7F4E8] text-[#026601] border border-[#E1E6E1] hover:border-[#C8E6CA] text-xs font-semibold flex items-center gap-1.5 transition-colors no-underline"
                    >
                      <span>Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Intelligence Drawer */}
      <CustomerHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        identifier={historyPhone}
      />
    </div>
  );
}
