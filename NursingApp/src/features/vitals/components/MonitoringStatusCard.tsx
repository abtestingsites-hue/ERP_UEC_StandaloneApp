import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle2, AlertTriangle, PlusCircle, ShieldAlert } from 'lucide-react';
import { usePatientMonitoringStatus } from '../hooks/useVitals';
import { AttentionModal } from './AttentionModal';

interface MonitoringStatusCardProps {
    patientId: string;
    patientName: string;
    onRecordVitals?: () => void;
}

export const MonitoringStatusCard: React.FC<MonitoringStatusCardProps> = ({
    patientId,
    patientName,
    onRecordVitals
}) => {
    const [isAttentionOpen, setIsAttentionOpen] = useState(false);
    const { data: monitoringData, isLoading } = usePatientMonitoringStatus(patientId);

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse flex items-center justify-between">
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
            </div>
        );
    }

    const requirement = monitoringData?.requirement;
    const frequency = requirement?.frequency || 'Configurable Care Plan';
    const isOverdue = (monitoringData?.overdueCount || 0) > 0;
    const isDue = (monitoringData?.dueCount || 0) > 0;
    const nextDueSlot = monitoringData?.nextDueSlot;

    const getStatusBadge = () => {
        if (isOverdue) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                    <ShieldAlert className="h-3.5 w-3.5" /> OVERDUE
                </span>
            );
        }
        if (isDue) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 border border-amber-200">
                    <AlertCircle className="h-3.5 w-3.5" /> DUE NOW
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> ON TRACK
            </span>
        );
    };

    return (
        <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-gray-900">Clinical Vitals Monitoring</h4>
                            {getStatusBadge()}
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            Care Plan Schedule: <span className="font-bold text-gray-800">{frequency.replace(/_/g, ' ')}</span>
                            {nextDueSlot && (
                                <>
                                    <span>&bull;</span>
                                    <span>Next Due: <strong className="text-gray-900">{nextDueSlot}</strong></span>
                                </>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAttentionOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-extrabold text-amber-700 hover:bg-amber-100 transition-colors shadow-sm"
                        >
                            <AlertTriangle className="h-3.5 w-3.5" /> Add Attention Flag
                        </button>
                        {onRecordVitals && (
                            <button
                                onClick={onRecordVitals}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F969C] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#0c7a7f] transition-colors shadow-sm"
                            >
                                <PlusCircle className="h-3.5 w-3.5" /> Record Vitals
                            </button>
                        )}
                    </div>
                </div>

                {/* Slots Breakdown */}
                {monitoringData?.slots && monitoringData.slots.length > 0 && (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Today's Scheduled Monitoring Slots
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {monitoringData.slots.map((slot: any) => {
                                let slotStyle = 'bg-gray-50 text-gray-500 border-gray-200';
                                if (slot.status === 'COMPLETED') slotStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
                                else if (slot.status === 'OVERDUE') slotStyle = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
                                else if (slot.status === 'DUE') slotStyle = 'bg-amber-50 text-amber-800 border-amber-400 font-bold animate-pulse';

                                return (
                                    <div
                                        key={slot.timeStr}
                                        className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 ${slotStyle}`}
                                    >
                                        <span>{slot.timeStr}</span>
                                        <span className="text-[10px] uppercase font-black">({slot.status})</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <AttentionModal
                isOpen={isAttentionOpen}
                onClose={() => setIsAttentionOpen(false)}
                patientId={patientId}
                patientName={patientName}
            />
        </>
    );
};
