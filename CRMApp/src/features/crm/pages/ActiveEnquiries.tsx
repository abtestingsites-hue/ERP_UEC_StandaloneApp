import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Phone, User, Calendar, ShieldAlert, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { StatusHighlighter } from '../../../components/StatusHighlighter';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { useEnquiries } from '../../enquiry/hooks/useEnquiry';
import type { Enquiry } from '../../enquiry/types';

const extractQualificationValue = (comments: string | undefined, label: string) => {
    const match = String(comments || '').match(new RegExp(`${label}:\\s*([^\\n]+)`, 'i'));
    return match?.[1]?.trim() || '';
};

const extractNoteValue = (notes: string | undefined, label: string) => {
    const match = String(notes || '').match(new RegExp(`${label}:\\s*([^|\\n]+)`, 'i'));
    return match?.[1]?.trim() || '';
};

const getLatestFollowUpValue = (enquiry: Enquiry, label: string) => {
    const followUps = Array.isArray(enquiry.followUps) ? enquiry.followUps : [];

    for (const followUp of followUps) {
        const value = extractNoteValue(followUp.notes, label);
        if (value) return value;
    }

    return '';
};

const getLeadQualification = (enquiry: Enquiry) => {
    const quality = extractQualificationValue(enquiry.comments, 'Lead Quality') || enquiry.automationPriority || 'Cold';
    const intent = extractQualificationValue(enquiry.comments, 'Intent') || 'Not qualified';
    const followUpPriority = extractQualificationValue(enquiry.comments, 'Follow-up Priority') || 'Not set';
    const leadValidity = getLatestFollowUpValue(enquiry, 'Lead Validity') || 'Not filtered';
    const conversionReadiness = getLatestFollowUpValue(enquiry, 'Conversion Readiness') || 'Discussion Stage';
    const urgency = getLatestFollowUpValue(enquiry, 'Urgency') || followUpPriority;

    return {
        quality,
        intent,
        followUpPriority,
        leadValidity,
        conversionReadiness,
        urgency,
        isInvalid: [quality, intent, leadValidity, conversionReadiness].some((value) =>
            ['fake', 'duplicate', 'not service related', 'not convertible'].some((term) =>
                String(value || '').toLowerCase().includes(term)
            )
        ),
        isReadyToConvert: conversionReadiness === 'Ready To Convert' || conversionReadiness === 'Converted',
        isUrgent: ['Immediate', 'Within 24 hours'].includes(urgency)
    };
};

export function ActiveEnquiries() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { data: enquiries = [], isLoading } = useEnquiries();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [qualityFilter, setQualityFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const activeEnquiries = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return (enquiries as Enquiry[])
            .filter((enquiry) => !enquiry.admissionId)
            .filter((enquiry) => {
                const qualification = getLeadQualification(enquiry);
                if (qualityFilter === 'Valid' && (qualification.isInvalid || enquiry.status === 'Lost')) return false;
                if (qualityFilter === 'Fake / Invalid' && !qualification.isInvalid && enquiry.status !== 'Lost') return false;
                if (qualityFilter === 'Genuine' && qualification.leadValidity !== 'Genuine') return false;
                if (qualityFilter && !['Valid', 'Fake / Invalid', 'Genuine'].includes(qualityFilter) && qualification.quality !== qualityFilter) return false;
                if (actionFilter === 'Ready To Convert' && !qualification.isReadyToConvert) return false;
                if (actionFilter === 'Urgent' && !qualification.isUrgent) return false;
                if (actionFilter === 'Needs Filtering' && qualification.leadValidity !== 'Not filtered') return false;

                if (!query) return true;
                return [
                    enquiry.refNo,
                    enquiry.clientName,
                    enquiry.mobile,
                    enquiry.service,
                    enquiry.patientName,
                    qualification.quality,
                    qualification.intent,
                    qualification.leadValidity,
                    qualification.urgency
                ].some((value) => String(value || '').toLowerCase().includes(query));
            });
    }, [actionFilter, enquiries, qualityFilter, searchQuery]);

    return (
        <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-5">
            <PageHeader
                title="Active Lead Pipeline"
                subtitle="Live enquiry pipeline and qualification tracking prior to admission."
            />

            {/* Filters & Search Header */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Lead Ref, Client Name, Phone, Patient, or Quality..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                        <select
                            value={qualityFilter}
                            onChange={(e) => setQualityFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                        >
                            <option value="">All Quality Types</option>
                            <option value="Valid">Valid Leads</option>
                            <option value="Fake / Invalid">Fake / Invalid</option>
                            <option value="Genuine">Genuine Only</option>
                            <option value="HOT">HOT Priority</option>
                            <option value="WARM">WARM Priority</option>
                        </select>

                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                        >
                            <option value="">All Action States</option>
                            <option value="Urgent">Urgent Action</option>
                            <option value="Ready To Convert">Ready to Convert</option>
                            <option value="Needs Filtering">Needs Filtering</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Pipeline Table */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <LoadingState message="Loading active pipeline enquiries..." />
                    </div>
                ) : activeEnquiries.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title="No Active Pipeline Enquiries"
                            description="No enquiries match the current filter or search criteria."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-4">Lead ID</th>
                                    <th className="py-3.5 px-4">Client Name</th>
                                    <th className="py-3.5 px-4">Service Required</th>
                                    <th className="py-3.5 px-4">Patient Info</th>
                                    <th className="py-3.5 px-4">Quality & Validity</th>
                                    <th className="py-3.5 px-4">Stage / Conversion</th>
                                    <th className="py-3.5 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {activeEnquiries.map((enquiry) => {
                                    const qualification = getLeadQualification(enquiry);
                                    return (
                                        <tr
                                            key={enquiry.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/crm/enquiry-follow-up/${enquiry.id}`)}
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{enquiry.refNo || 'NO-REF'}</span>
                                                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar className="h-3 w-3" />
                                                        {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{enquiry.clientName}</span>
                                                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                                                        <Phone className="h-3 w-3" /> {enquiry.mobile}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{enquiry.service}</span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                                        {enquiry.patientName || 'Patient Not Set'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 truncate max-w-[180px]">
                                                        {enquiry.patientHealthCondition || 'No health condition noted'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <StatusHighlighter value={qualification.quality} />
                                                    <span className="text-[11px] font-semibold text-slate-500">
                                                        {qualification.leadValidity} • {qualification.urgency}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <StatusHighlighter value={enquiry.status} />
                                                    {qualification.isReadyToConvert && (
                                                        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                            Ready to Convert
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/crm/enquiry-follow-up/${enquiry.id}`);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 px-3 py-1.5 rounded-md transition-colors"
                                                >
                                                    Follow-up <ArrowRight className="h-3.5 w-3.5" />
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
        </div>
    );
}
