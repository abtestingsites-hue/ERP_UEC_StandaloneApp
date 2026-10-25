import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, X, MessageSquare, PlusCircle } from 'lucide-react';
import { useAttentionLogs, useRecordPatientAttention, useResolvePatientAttention } from '../hooks/useVitals';

interface AttentionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    canResolve?: boolean;
}

const ATTENTION_CATEGORIES = [
    { label: 'General Observation', value: 'GENERAL_OBSERVATION' },
    { label: 'Behavior Change', value: 'BEHAVIOR_CHANGE' },
    { label: 'Pain', value: 'PAIN' },
    { label: 'Mobility Concern', value: 'MOBILITY_CONCERN' },
    { label: 'Fall Risk', value: 'FALL_RISK' },
    { label: 'Nutrition Concern', value: 'NUTRITION_CONCERN' },
    { label: 'Respiratory Concern', value: 'RESPIRATORY_CONCERN' },
    { label: 'Skin Concern', value: 'SKIN_CONCERN' },
    { label: 'Medication Concern', value: 'MEDICATION_CONCERN' },
    { label: 'Vital Abnormality', value: 'VITAL_ABNORMALITY' },
    { label: 'Family Concern', value: 'FAMILY_CONCERN' },
    { label: 'Other', value: 'OTHER' }
];

export const AttentionModal: React.FC<AttentionModalProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
    canResolve = true
}) => {
    const [activeTab, setActiveTab] = useState<'RECORD' | 'HISTORY'>('RECORD');
    const [category, setCategory] = useState('GENERAL_OBSERVATION');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [observation, setObservation] = useState('');
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');

    const { data: attentionLogs = [], isLoading } = useAttentionLogs(patientId, null, { enabled: isOpen });
    const recordMutation = useRecordPatientAttention();
    const resolveMutation = useResolvePatientAttention();

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!observation.trim()) {
            alert('Please enter an observation description');
            return;
        }

        recordMutation.mutate(
            {
                patientId,
                payload: { category, priority, observation }
            },
            {
                onSuccess: () => {
                    setObservation('');
                    setActiveTab('HISTORY');
                }
            }
        );
    };

    const handleResolve = (id: string) => {
        resolveMutation.mutate(
            { id, resolutionNotes },
            {
                onSuccess: () => {
                    setResolvingId(null);
                    setResolutionNotes('');
                }
            }
        );
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'HIGH':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'MEDIUM':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'LOW':
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case 'RESOLVED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'IN_PROGRESS':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'OPEN':
            default:
                return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                    <div>
                        <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Patient Attention & Observation
                        </h3>
                        <p className="text-xs font-semibold text-gray-500 mt-0.5">
                            Patient: <span className="font-bold text-gray-800">{patientName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 bg-white px-6">
                    <button
                        onClick={() => setActiveTab('RECORD')}
                        className={`flex items-center gap-2 py-3 px-4 text-xs font-extrabold border-b-2 transition-all ${
                            activeTab === 'RECORD'
                                ? 'border-[#0F969C] text-[#0F969C]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <PlusCircle className="h-4 w-4" /> Add Attention Flag
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`flex items-center gap-2 py-3 px-4 text-xs font-extrabold border-b-2 transition-all ${
                            activeTab === 'HISTORY'
                                ? 'border-[#0F969C] text-[#0F969C]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <MessageSquare className="h-4 w-4" /> Active Flags & History ({attentionLogs.length})
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'RECORD' ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Observation Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-800 focus:border-[#0F969C] focus:outline-none"
                                >
                                    {ATTENTION_CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Clinical Operational Priority
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                                        <button
                                            type="button"
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`rounded-xl py-2 px-3 text-xs font-extrabold border transition-all ${
                                                priority === p
                                                    ? p === 'HIGH'
                                                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                                        : p === 'MEDIUM'
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                                        : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {p} Priority
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Clinical Observation / Note
                                </label>
                                <textarea
                                    value={observation}
                                    onChange={(e) => setObservation(e.target.value)}
                                    placeholder="Describe the clinical observation, patient condition, or concern..."
                                    rows={4}
                                    className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-sm font-medium text-gray-800 focus:border-[#0F969C] focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={recordMutation.isPending}
                                    className="rounded-xl bg-[#0F969C] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#0c7a7f] transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {recordMutation.isPending ? 'Saving...' : 'Submit Attention Flag'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {isLoading ? (
                                <p className="text-center text-xs font-bold text-gray-400 py-8">Loading attention flags...</p>
                            ) : attentionLogs.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <CheckCircle2 className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                                    <p className="text-sm font-bold text-gray-700">No attention flags recorded for this patient.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {attentionLogs.map((item: any) => (
                                        <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getPriorityBadge(item.priority)}`}>
                                                        {item.priority}
                                                    </span>
                                                    <span className="text-xs font-extrabold text-gray-800">
                                                        {item.category.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadge(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-700 font-medium bg-gray-50 p-2.5 rounded-lg">
                                                {item.observation}
                                            </p>

                                            <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold pt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {new Date(item.createdAt).toLocaleString('en-GB')}
                                                </span>
                                                {item.status === 'RESOLVED' ? (
                                                    <span className="text-emerald-600 font-bold">
                                                        Resolved at {new Date(item.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                ) : canResolve && (
                                                    resolvingId === item.id ? (
                                                        <div className="flex items-center gap-2 mt-2 w-full">
                                                            <input
                                                                type="text"
                                                                placeholder="Resolution notes..."
                                                                value={resolutionNotes}
                                                                onChange={(e) => setResolutionNotes(e.target.value)}
                                                                className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-800"
                                                            />
                                                            <button
                                                                onClick={() => handleResolve(item.id)}
                                                                disabled={resolveMutation.isPending}
                                                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => setResolvingId(null)}
                                                                className="text-xs font-bold text-gray-500"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setResolvingId(item.id)}
                                                            className="text-xs font-bold text-[#0F969C] hover:underline"
                                                        >
                                                            Resolve Item
                                                        </button>
                                                    )
                                                )}
                                            </div>

                                            {item.resolutionNotes && (
                                                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100 font-medium">
                                                    <span className="font-bold">Resolution Note:</span> {item.resolutionNotes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
