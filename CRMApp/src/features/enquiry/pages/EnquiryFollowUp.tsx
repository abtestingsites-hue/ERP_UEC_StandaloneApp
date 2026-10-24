import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { useEnquiries, useDeleteEnquiry } from '../hooks/useEnquiry';
import { EnquiryFollowUpModal } from '../components/EnquiryFollowUpModal';
import type { Enquiry } from '../types';
import {
  CalendarCheck,
  Search,
  PlusCircle,
  PhoneCall,
  Eye,
  Trash2,
  Filter,
  User,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const EnquiryFollowUp: React.FC = () => {
  const navigate = useNavigate();
  const { data: enquiries = [], isLoading } = useEnquiries();
  const deleteEnquiry = useDeleteEnquiry();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.refNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mobile?.includes(searchQuery) ||
        item.service?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'OPEN' && item.status === 'Open') ||
        (statusFilter === 'FOLLOW_UP' && item.status === 'Follow Up') ||
        (statusFilter === 'IN_PROGRESS' && item.status === 'In Progress') ||
        (statusFilter === 'CONVERTED' && item.status === 'Converted') ||
        (statusFilter === 'LOST' && item.status === 'Lost');

      return matchesSearch && matchesStatus;
    });
  }, [enquiries, searchQuery, statusFilter]);

  const handleOpenFollowUp = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsFollowUpModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete enquiry for ${name}?`)) {
      deleteEnquiry.mutate(id);
    }
  };

  const getStatusBadge = (status: Enquiry['status']) => {
    switch (status) {
      case 'Open':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Follow Up':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Converted':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Lost':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquiry Follow-up Queue"
        subtitle="Active inquiry queue, scheduled follow-up call tracking & call logging"
        icon={CalendarCheck}
        actions={
          <Button variant="primary" icon={PlusCircle} onClick={() => navigate('/crm/new-enquiry')}>
            New Enquiry
          </Button>
        }
      />

      {/* Filter & Search Bar */}
      <Card>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-96">
            <Input
              icon={Search}
              placeholder="Search by Client Name, Ref #, Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
            {[
              { id: 'ALL', label: 'All Enquiries' },
              { id: 'OPEN', label: 'Open' },
              { id: 'FOLLOW_UP', label: 'Follow Up' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'CONVERTED', label: 'Converted' },
              { id: 'LOST', label: 'Lost' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Data List / Table */}
      {isLoading ? (
        <LoadingState message="Fetching live enquiries from Shared Backend..." />
      ) : filteredEnquiries.length === 0 ? (
        <EmptyState
          title="No Enquiries Found"
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'No records match your active search and status filter criteria.'
              : 'There are no enquiry records logged in the system yet.'
          }
          action={
            <Button variant="primary" icon={PlusCircle} onClick={() => navigate('/crm/new-enquiry')}>
              Create First Enquiry
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEnquiries.map((enquiry) => (
            <div
              key={enquiry.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-2xl flex items-center justify-center shrink-0 text-sm">
                  {enquiry.clientName?.slice(0, 2).toUpperCase() || 'EQ'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      onClick={() => navigate(`/crm/enquiry-follow-up/${enquiry.id}`)}
                      className="text-base font-bold text-slate-100 hover:text-indigo-400 cursor-pointer transition-colors truncate"
                    >
                      {enquiry.clientName}
                    </h3>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                      {enquiry.refNo}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        enquiry.status
                      )}`}
                    >
                      {enquiry.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      Patient: {enquiry.patientName || 'Not specified'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                      {enquiry.mobile}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                      Service: {enquiry.service}
                    </span>
                  </div>

                  {enquiry.comments && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-2 italic">
                      "{enquiry.comments}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800/80 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  icon={PhoneCall}
                  onClick={() => handleOpenFollowUp(enquiry)}
                >
                  Log Call
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  onClick={() => navigate(`/crm/enquiry-follow-up/${enquiry.id}`)}
                >
                  View Log
                </Button>
                <button
                  onClick={() => handleDelete(enquiry.id, enquiry.clientName)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all"
                  title="Delete Enquiry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Follow Up Modal */}
      <EnquiryFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        enquiry={selectedEnquiry}
      />
    </div>
  );
};
