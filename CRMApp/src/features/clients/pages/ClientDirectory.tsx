import React, { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { StatusHighlighter } from '../../../components/StatusHighlighter';
import { Modal } from '../../../components/Modal';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  KeyRound,
  Eye,
  Building2,
  Clock,
  ShieldCheck,
  X
} from 'lucide-react';
import { useEnquiries } from '../../enquiry/hooks/useEnquiry';
import type { Enquiry } from '../../enquiry/types';

export const ClientDirectory: React.FC = () => {
  const { data: enquiries = [], isLoading, isError } = useEnquiries();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState<Enquiry | null>(null);

  const enquiryList = (enquiries || []) as Enquiry[];

  // Filter client data based on search and selected filters
  const filteredClients = useMemo(() => {
    return enquiryList.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        e.clientName.toLowerCase().includes(q) ||
        (e.mobile && e.mobile.includes(q)) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        e.refNo.toLowerCase().includes(q) ||
        `REF-${e.id.substring(0, 5).toUpperCase()}`.toLowerCase().includes(q) ||
        e.service.toLowerCase().includes(q);

      const matchStatus = !statusFilter || e.status === statusFilter;
      const matchService = !serviceFilter || e.service === serviceFilter;

      return matchSearch && matchStatus && matchService;
    });
  }, [enquiryList, searchQuery, statusFilter, serviceFilter]);

  // Extract unique services for dropdown filter
  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    enquiryList.forEach((e) => {
      if (e.service) set.add(e.service);
    });
    return Array.from(set);
  }, [enquiryList]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Master Directory"
        subtitle="Searchable directory of client profiles, contact information, and enquiry history."
        icon={Users}
      />

      {/* Search & Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client name, phone, email, client ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer md:w-48"
          >
            <option value="">All Enquiry Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer md:w-48"
          >
            <option value="">All Services</option>
            {uniqueServices.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
          <span>
            Showing <strong className="text-slate-200">{filteredClients.length}</strong> of{' '}
            <strong className="text-slate-200">{enquiryList.length}</strong> client records
          </span>
          {(searchQuery || statusFilter || serviceFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setServiceFilter('');
              }}
              className="text-indigo-400 hover:underline text-xs font-medium cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <LoadingState message="Loading live client directory records..." />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-400 font-medium text-sm">
            Unable to fetch client directory from Shared ERP Backend. Please verify server connection.
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Clients Found"
              description="No client profiles match your current search criteria or unit filter."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Client Ref</th>
                  <th className="py-3.5 px-4">Client Details</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Service Required</th>
                  <th className="py-3.5 px-4">Address / Location</th>
                  <th className="py-3.5 px-4">Enquiry Status</th>
                  <th className="py-3.5 px-4">Portal Access</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredClients.map((client) => {
                  const clientRef = `REF-${client.id.substring(0, 5).toUpperCase()}`;
                  const access = client.clientPortalAccess;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Client Ref */}
                      <td className="py-4 px-4 font-mono font-bold text-indigo-400">
                        {clientRef}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {client.refNo}
                        </span>
                      </td>

                      {/* Client Name & Created Date */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-100 text-sm block">
                          {client.clientName}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(client.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{client.mobile || 'N/A'}</span>
                        </div>
                        {client.email && client.email !== 'N/A' && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[160px]">{client.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Service Required */}
                      <td className="py-4 px-4 font-bold text-slate-200">
                        {client.service}
                        {client.serviceCategory && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            {client.serviceCategory}
                          </span>
                        )}
                      </td>

                      {/* Address / Location */}
                      <td className="py-4 px-4 text-slate-400">
                        {client.clientAddress || client.clientLocation ? (
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              {client.clientAddress || client.clientLocation}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Not provided</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <StatusHighlighter value={client.status} />
                      </td>

                      {/* Portal Access */}
                      <td className="py-4 px-4">
                        {access?.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Not Enabled
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Read-Only Client Detail & History Modal */}
      {selectedClient && (
        <Modal
          isOpen={Boolean(selectedClient)}
          onClose={() => setSelectedClient(null)}
          title={`Client Profile — ${selectedClient.clientName}`}
        >
          <div className="p-6 space-y-5 text-xs text-slate-200">
            {/* Header / Basic Info */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                  REF-{selectedClient.id.substring(0, 5).toUpperCase()}
                </span>
                <h3 className="text-lg font-extrabold text-slate-100 mt-0.5">
                  {selectedClient.clientName}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Primary Service: <strong className="text-slate-200">{selectedClient.service}</strong>
                </p>
              </div>
              <StatusHighlighter value={selectedClient.status} />
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Details Card */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" /> Contact Information
                </h4>
                <div className="space-y-1.5 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Mobile Phone</span>
                    <span className="font-semibold text-slate-200">{selectedClient.mobile || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Email Address</span>
                    <span className="font-semibold text-slate-200">{selectedClient.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Address / Location</span>
                    <span className="font-semibold text-slate-200">
                      {selectedClient.clientAddress || selectedClient.clientLocation || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Portal & Metadata Card */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Client Portal Access
                </h4>
                <div className="space-y-1.5 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Status</span>
                    <span className="font-semibold text-slate-200">
                      {selectedClient.clientPortalAccess?.isActive ? 'Active / Enabled' : 'Not Enabled'}
                    </span>
                  </div>
                  {selectedClient.clientPortalAccess?.email && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">Portal Login Email</span>
                      <span className="font-semibold text-slate-200">
                        {selectedClient.clientPortalAccess.email}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-500 block">First Onboarded Date</span>
                    <span className="font-semibold text-slate-200">
                      {new Date(selectedClient.createdAt || Date.now()).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Patient / Resident Info if present */}
            {(selectedClient.patientName || selectedClient.admittedPatientName) && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Associated Resident / Patient
                </h4>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-bold text-slate-100">
                    {selectedClient.admittedPatientName || selectedClient.patientName}
                  </span>
                  {selectedClient.admissionId && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Admitted Record #{selectedClient.admissionId}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Enquiry Timeline / History */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Enquiry History & Follow-ups
              </h4>

              {selectedClient.followUps && selectedClient.followUps.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {selectedClient.followUps.map((fu, idx) => (
                    <div
                      key={fu.id || idx}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-400">
                          Follow-up #{idx + 1}
                        </span>
                        <span className="text-slate-500">
                          {fu.createdAt ? new Date(fu.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-xs">{fu.notes}</p>
                      {fu.outcome && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-semibold">
                          Outcome: {fu.outcome}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-xs pt-1">
                  No previous follow-up entries recorded for this enquiry.
                </p>
              )}
            </div>

            {/* Close Action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
