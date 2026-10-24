import { useState } from 'react';
import { Search, Plus, AlertCircle, Edit2, Eye, X, Filter } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { StatusHighlighter } from '../../../components/StatusHighlighter';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { Modal } from '../../../components/Modal';
import { useComplaints, useCreateComplaint, useUpdateComplaintWorkflow } from '../hooks/useCustomerCare';
import type { Complaint } from '../services/customerCareService';

export function Complaints() {
    const { data: complaints = [], isLoading, error } = useComplaints();
    const createComplaint = useCreateComplaint();
    const updateWorkflow = useUpdateComplaintWorkflow();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal states
    const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    // Form inputs for Raise Complaint
    const [clientName, setClientName] = useState('');
    const [category, setCategory] = useState('General Complaint');
    const [priority, setPriority] = useState('Medium');
    const [description, setDescription] = useState('');

    // Form inputs for Update Workflow
    const [workflowStatus, setWorkflowStatus] = useState<'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED'>('OPEN');
    const [assignedTo, setAssignedTo] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');

    const filteredComplaints = complaints.filter((c) => {
        const query = searchQuery.trim().toLowerCase();
        if (statusFilter && c.status !== statusFilter) return false;
        if (!query) return true;
        return [c.ticketNo, c.clientName, c.category, c.priority, c.status, c.description, c.assignedTo]
            .some((val) => String(val || '').toLowerCase().includes(query));
    });

    const handleOpenRaise = () => {
        setClientName('');
        setCategory('General Complaint');
        setPriority('Medium');
        setDescription('');
        setIsRaiseModalOpen(true);
    };

    const handleRaiseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName.trim() || !description.trim()) return;

        createComplaint.mutate(
            { clientName, category, priority, description },
            {
                onSuccess: () => {
                    setIsRaiseModalOpen(false);
                }
            }
        );
    };

    const handleOpenUpdate = (c: Complaint) => {
        setSelectedComplaint(c);
        const apiStatus = c.status === 'Closed' ? 'CLOSED' : c.status === 'Resolved' ? 'RESOLVED' : c.status === 'In Progress' ? 'ASSIGNED' : 'OPEN';
        setWorkflowStatus(apiStatus);
        setAssignedTo(c.assignedTo || '');
        setResolutionNotes(c.resolutionNotes || '');
        setIsUpdateModalOpen(true);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        updateWorkflow.mutate(
            {
                complaintId: selectedComplaint.id,
                data: {
                    status: workflowStatus,
                    assignedTo: assignedTo || undefined,
                    resolutionNotes: resolutionNotes || undefined
                }
            },
            {
                onSuccess: () => {
                    setIsUpdateModalOpen(false);
                    setSelectedComplaint(null);
                }
            }
        );
    };

    return (
        <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Customer Complaints Management"
                    subtitle="Track, assign, investigate, and resolve customer grievances and service issues."
                    icon={AlertCircle}
                />
                <button
                    onClick={handleOpenRaise}
                    className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors shrink-0"
                >
                    <Plus className="h-4 w-4" /> Raise Complaint
                </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search complaints by Ticket No, Client Name, Category, Staff..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <LoadingState message="Loading complaints..." />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-rose-500 font-semibold">
                        Failed to fetch customer complaints. Please retry.
                    </div>
                ) : filteredComplaints.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title="No Customer Complaints"
                            description="No complaints match the current filter or search criteria."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-4">Ticket No</th>
                                    <th className="py-3.5 px-4">Client Name</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Priority</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Assigned Staff</th>
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredComplaints.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-slate-100">{c.ticketNo}</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{c.clientName}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">{c.category}</td>
                                        <td className="py-3.5 px-4">
                                            <StatusHighlighter value={c.priority} />
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <StatusHighlighter value={c.status} />
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{c.assignedTo || 'Unassigned'}</td>
                                        <td className="py-3.5 px-4 text-xs font-medium text-slate-400">{c.date}</td>
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => handleOpenUpdate(c)}
                                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                                                title="Update Workflow"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Raise Complaint Modal */}
            {isRaiseModalOpen && (
                <Modal isOpen={isRaiseModalOpen} onClose={() => setIsRaiseModalOpen(false)} title="Raise New Customer Complaint">
                    <form onSubmit={handleRaiseSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Client Name *</label>
                            <input
                                type="text"
                                required
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Enter client or patient name"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                >
                                    <option value="General Complaint">General Complaint</option>
                                    <option value="Staff Conduct">Staff Conduct / Behavior</option>
                                    <option value="Service Delay">Service Delay</option>
                                    <option value="Billing Dispute">Billing / Charge Dispute</option>
                                    <option value="Care Quality">Care Quality Issue</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Complaint Details *</label>
                            <textarea
                                required
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the grievance or service issue..."
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsRaiseModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createComplaint.isPending}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow transition-colors disabled:opacity-50"
                            >
                                {createComplaint.isPending ? 'Raising...' : 'Raise Complaint'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Update Workflow Modal */}
            {isUpdateModalOpen && selectedComplaint && (
                <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title={`Update Complaint #${selectedComplaint.ticketNo}`}>
                    <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                            <p className="text-xs font-bold text-slate-400">CLIENT & CATEGORY</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedComplaint.clientName} - {selectedComplaint.category}</p>
                            <p className="text-xs text-slate-500 mt-1 italic">"{selectedComplaint.description}"</p>
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Workflow Status</label>
                            <select
                                value={workflowStatus}
                                onChange={(e: any) => setWorkflowStatus(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 font-bold"
                            >
                                <option value="OPEN">OPEN</option>
                                <option value="ASSIGNED">IN PROGRESS / ASSIGNED</option>
                                <option value="RESOLVED">RESOLVED</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Assigned Staff Name</label>
                            <input
                                type="text"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                placeholder="Enter assigned staff member"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Resolution / Action Notes</label>
                            <textarea
                                rows={4}
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="Record resolution actions, root cause analysis, or follow-up notes..."
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsUpdateModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updateWorkflow.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow transition-colors disabled:opacity-50"
                            >
                                {updateWorkflow.isPending ? 'Updating...' : 'Save Workflow'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
