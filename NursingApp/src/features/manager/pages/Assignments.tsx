import React, { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { useAssignments, useCreateAssignment, useUpdateAssignmentStatus, useDeleteAssignment } from '../hooks/useAssignments';
import { useMedicalStaff, useMedicalPatients } from '../hooks/useNursingManager';
import { PlayCircle, PauseCircle, Activity, CheckCircle2, XCircle, Trash2, Plus } from 'lucide-react';

const toDateTimeLocalValue = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
};

const createDefaultForm = () => ({
    staffId: '',
    patientId: '',
    dutyType: 'NURSING_CARE',
    role: 'Nurse',
    location: '',
    startAt: toDateTimeLocalValue(new Date()),
    endAt: '',
    status: 'ASSIGNED',
    priority: 'MEDIUM',
    notes: ''
});

const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const Assignments = () => {
    const { data: assignments = [], isLoading } = useAssignments();
    const { data: staff = [] } = useMedicalStaff();
    const { data: patients = [] } = useMedicalPatients();
    
    const createAssignment = useCreateAssignment();
    const updateStatus = useUpdateAssignmentStatus();
    const deleteAssignment = useDeleteAssignment();

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [formData, setFormData] = useState(createDefaultForm());

    const handleStaffChange = (staffId: string) => {
        const selectedStaff = staff.find((member: any) => member.id === staffId);
        setFormData(curr => ({
            ...curr,
            staffId,
            role: selectedStaff?.designation || selectedStaff?.department || curr.role
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.dutyType === 'NURSING_CARE' && !formData.patientId) {
            alert("Patient is required for a Nursing Clinical Duty.");
            return;
        }

        createAssignment.mutate(formData, {
            onSuccess: () => {
                setIsDrawerOpen(false);
                setFormData(createDefaultForm());
            }
        });
    };

    const handleStatusChange = (id: string, status: string) => {
        updateStatus.mutate({ id, status });
    };

    const handleDelete = (id: string, refNo: string) => {
        if (window.confirm(`Remove assignment ${refNo}?`)) {
            deleteAssignment.mutate(id);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ASSIGNED': return 'bg-blue-100 text-blue-700';
            case 'IN_PROGRESS': return 'bg-emerald-100 text-emerald-700';
            case 'WAITING_APPROVAL': return 'bg-purple-100 text-purple-700';
            case 'APPROVED': return 'bg-teal-100 text-teal-700';
            case 'ON_HOLD': return 'bg-amber-100 text-amber-700';
            case 'COMPLETED': return 'bg-gray-100 text-gray-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const statusActionClass = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:border-blue-600 hover:text-blue-600 transition-colors';

    const activeAssignments = assignments.filter((a: any) => !['COMPLETED', 'CANCELLED', 'APPROVED', 'WAITING_APPROVAL'].includes(a.status));
    const historyAssignments = assignments.filter((a: any) => ['COMPLETED', 'CANCELLED', 'APPROVED', 'WAITING_APPROVAL'].includes(a.status));

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex justify-between items-start">
                <PageHeader 
                    title="Assignment Management" 
                    subtitle="Manage nursing staff assignments and patient allocation."
                />
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Assign Duty</span>
                </button>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mt-6">Active Assignments</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading assignments...</td>
                                </tr>
                            ) : activeAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No active assignments.</td>
                                </tr>
                            ) : (
                                activeAssignments.map((row: any) => {
                                    const isTerminal = ['COMPLETED', 'CANCELLED', 'APPROVED', 'WAITING_APPROVAL'].includes(row.status);
                                    return (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{row.staff?.firstName} {row.staff?.lastName}</div>
                                                <div className="text-xs text-gray-500">{row.role || row.staff?.designation || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {row.patient?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {row.dutyType?.replace(/_/g, ' ') || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDateTime(row.startAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
                                                    {row.status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    {['PENDING', 'ASSIGNED'].includes(row.status) && (
                                                        <button title="Start" className={statusActionClass} onClick={() => handleStatusChange(row.id, 'IN_PROGRESS')}>
                                                            <PlayCircle className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {row.status === 'IN_PROGRESS' && (
                                                        <button title="Hold" className={statusActionClass} onClick={() => handleStatusChange(row.id, 'ON_HOLD')}>
                                                            <PauseCircle className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {row.status === 'ON_HOLD' && (
                                                        <button title="Resume" className={statusActionClass} onClick={() => handleStatusChange(row.id, 'IN_PROGRESS')}>
                                                            <Activity className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {!isTerminal && (
                                                        <button title="Complete" className={statusActionClass} onClick={() => handleStatusChange(row.id, 'COMPLETED')}>
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                        </button>
                                                    )}
                                                    {row.status === 'WAITING_APPROVAL' && (
                                                        <button title="Approve" className={statusActionClass} onClick={() => handleStatusChange(row.id, 'APPROVED')}>
                                                            <CheckCircle2 className="h-4 w-4 text-teal-600" />
                                                        </button>
                                                    )}
                                                    {!isTerminal && (
                                                        <button title="Cancel" className={statusActionClass} onClick={() => handleStatusChange(row.id, 'CANCELLED')}>
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        </button>
                                                    )}
                                                    <button title="Remove" className={statusActionClass} onClick={() => handleDelete(row.id, row.refNo)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mt-8">Duty History (Waiting Approval / Completed)</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading history...</td>
                                </tr>
                            ) : historyAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No history found.</td>
                                </tr>
                            ) : (
                                historyAssignments.map((row: any) => {

                                    return (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{row.staff?.firstName} {row.staff?.lastName}</div>
                                                <div className="text-xs text-gray-500">{row.role || row.staff?.designation || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {row.patient?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {row.dutyType?.replace(/_/g, ' ') || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDateTime(row.startAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
                                                    {row.status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    {row.status === 'WAITING_APPROVAL' && (
                                                        <button title="Approve" className={statusActionClass} onClick={() => handleStatusChange(row.id, 'APPROVED')}>
                                                            <CheckCircle2 className="h-4 w-4 text-teal-600" />
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
            </div>


            {/* Create Drawer/Modal */}
            {isDrawerOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-end">
                    <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Assign Medical Duty</h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="assignment-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nurse / Staff *</label>
                                    <select 
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        value={formData.staffId}
                                        onChange={e => handleStaffChange(e.target.value)}
                                    >
                                        <option value="">Select staff</option>
                                        {staff.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.designation})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                                    <select 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        value={formData.patientId}
                                        onChange={e => setFormData(c => ({...c, patientId: e.target.value}))}
                                    >
                                        <option value="">No patient linked</option>
                                        {patients.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.elderId || 'New'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duty Type</label>
                                    <select 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        value={formData.dutyType}
                                        onChange={e => setFormData(c => ({...c, dutyType: e.target.value}))}
                                    >
                                        <option value="NURSING_CARE">Nursing Care</option>
                                        <option value="VITALS_REVIEW">Vitals Review</option>
                                        <option value="MEDICATION">Medication</option>
                                        <option value="ROUND">Medical Round</option>
                                        <option value="CONSULTATION">Consultation</option>
                                        <option value="EMERGENCY">Emergency</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <input 
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        placeholder="e.g. Duty Nurse"
                                        value={formData.role}
                                        onChange={e => setFormData(c => ({...c, role: e.target.value}))}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                        <input 
                                            type="datetime-local" required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                            value={formData.startAt}
                                            onChange={e => setFormData(c => ({...c, startAt: e.target.value}))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                        <input 
                                            type="datetime-local" 
                                            min={formData.startAt}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                            value={formData.endAt}
                                            onChange={e => setFormData(c => ({...c, endAt: e.target.value}))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        value={formData.priority}
                                        onChange={e => setFormData(c => ({...c, priority: e.target.value}))}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea 
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        placeholder="Clinical notes, handoff details..."
                                        value={formData.notes}
                                        onChange={e => setFormData(c => ({...c, notes: e.target.value}))}
                                    />
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
                            <button 
                                type="button" 
                                onClick={() => setIsDrawerOpen(false)}
                                className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="assignment-form"
                                disabled={createAssignment.isPending}
                                className="px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {createAssignment.isPending ? 'Saving...' : 'Save Duty'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assignments;
