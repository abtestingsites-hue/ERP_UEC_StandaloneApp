import { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    CheckCircle2,
    RotateCcw,
    HeartPulse,
    Pill,
    Activity,
    Apple
} from 'lucide-react';
import { careService } from '../care.service';
import type { MedicalAssignment, ChecklistState } from '../care.types';

interface DutyApprovalTabProps {
    activeUnitId?: string | null;
    onOpenReviewModal: (assignment: MedicalAssignment) => void;
}

export function DutyApprovalTab({
    activeUnitId,
    onOpenReviewModal
}: DutyApprovalTabProps) {
    const [waitingDuties, setWaitingDuties] = useState<MedicalAssignment[]>([]);
    const [approvedDuties, setApprovedDuties] = useState<MedicalAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [waiting, approved] = await Promise.all([
                careService.getAssignments({ status: 'WAITING_APPROVAL', unitId: activeUnitId }),
                careService.getAssignments({ status: 'APPROVED', unitId: activeUnitId })
            ]);
            setWaitingDuties(waiting);
            setApprovedDuties(approved.slice(0, 10));
        } catch {
            setWaitingDuties([]);
            setApprovedDuties([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await loadData();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [loadData]);

    const handleQuickApprove = async (id: string) => {
        try {
            await careService.updateAssignmentStatus(id, 'APPROVED', 'Approved via manager queue', activeUnitId);
            const approved = waitingDuties.find((d) => d.id === id);
            setWaitingDuties((prev) => prev.filter((d) => d.id !== id));
            if (approved) {
                setApprovedDuties((prev) => [{ ...approved, status: 'APPROVED' }, ...prev]);
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to approve duty.';
            alert(message);
        }
    };

    const handleReturnForCorrection = async (id: string) => {
        const notes = window.prompt('Enter reason / correction instructions for nurse staff:');
        if (notes === null) return;
        try {
            await careService.updateAssignmentStatus(id, 'IN_PROGRESS', notes || 'Returned for correction', activeUnitId);
            setWaitingDuties((prev) => prev.filter((d) => d.id !== id));
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to return duty.';
            alert(message);
        }
    };

    const renderChecklistPill = (label: string, state?: ChecklistState, IconComp = HeartPulse) => {
        const isComp = state === 'COMPLETED';
        const isNA = state === 'NOT_APPLICABLE';
        return (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 12,
                    background: isComp ? '#dcfce7' : isNA ? '#f1f5f9' : '#fee2e2',
                    color: isComp ? '#15803d' : isNA ? '#64748b' : '#b91c1c',
                    fontWeight: 600
                }}
            >
                <IconComp size={12} />
                {label}: {isComp ? 'Done' : isNA ? 'N/A' : 'Pending'}
            </span>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header / Info Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                        Clinical Duty Manager Approval Queue
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                        Inspect Daily Care Checklist completion and verify clinical duties submitted by Nurse Staff
                    </p>
                </div>
                <span className="adm-badge adm-badge--warning" style={{ fontSize: 13, padding: '6px 12px' }}>
                    {waitingDuties.length} Duties Pending Review
                </span>
            </div>

            {/* Waiting Queue Cards */}
            {isLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                    Loading pending approval queue...
                </div>
            ) : waitingDuties.length === 0 ? (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 40, textAlign: 'center' }}>
                    <CheckCircle2 size={40} color="#059669" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                        No Duties Waiting for Approval
                    </h4>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
                        All submitted nursing duty checklists have been reviewed and approved.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {waitingDuties.map((duty) => {
                        const cl = duty.metadata?.dailyCareChecklist || {};
                        return (
                            <div
                                key={duty.id}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #fed7aa',
                                    borderRadius: 12,
                                    padding: 18,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                                {duty.patient?.name || 'General Facility Duty'}
                                            </span>
                                            <span className="adm-badge adm-badge--primary" style={{ fontSize: 11 }}>
                                                {duty.dutyType?.replace(/_/g, ' ')}
                                            </span>
                                            <span className="adm-badge adm-badge--warning" style={{ fontSize: 11 }}>
                                                Waiting Approval
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#475569', marginTop: 4 }}>
                                            <span>
                                                <strong>Staff:</strong> {duty.staff?.firstName} {duty.staff?.lastName} ({duty.role || 'Nurse'})
                                            </span>
                                            <span>
                                                <strong>Location:</strong> {duty.location || 'General Ward'}
                                            </span>
                                            <span>
                                                <strong>Submitted:</strong>{' '}
                                                {duty.updatedAt
                                                    ? new Date(duty.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Today'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            onClick={() => onOpenReviewModal(duty)}
                                            style={{ padding: '6px 12px', fontSize: 12 }}
                                        >
                                            <ShieldCheck size={14} /> Audit Details
                                        </button>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            onClick={() => handleReturnForCorrection(duty.id)}
                                            style={{ padding: '6px 12px', fontSize: 12, color: '#d97706', borderColor: '#fde68a' }}
                                        >
                                            <RotateCcw size={14} /> Return
                                        </button>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--primary"
                                            onClick={() => handleQuickApprove(duty.id)}
                                            style={{ padding: '6px 14px', fontSize: 12, background: '#059669', borderColor: '#059669' }}
                                        >
                                            <CheckCircle2 size={14} /> Approve Duty
                                        </button>
                                    </div>
                                </div>

                                {/* Checklist Audit Summary Strip */}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: '#f8fafc', padding: '8px 12px', borderRadius: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', alignSelf: 'center', marginRight: 4 }}>
                                        Checklist:
                                    </span>
                                    {renderChecklistPill('Vitals', cl.vitals, HeartPulse)}
                                    {renderChecklistPill('Medication', cl.medication, Pill)}
                                    {renderChecklistPill('ADL & Hygiene', cl.adl, Activity)}
                                    {renderChecklistPill('Nutrition', cl.nutrition, Apple)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Recently Approved Archive */}
            <div style={{ marginTop: 10 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
                    Recently Approved Duties ({approvedDuties.length})
                </h4>
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Staff Member</th>
                                <th>Resident</th>
                                <th>Duty Type</th>
                                <th>Checklist Verification</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedDuties.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                                        No approved duties recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                approvedDuties.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>
                                                {row.staff?.firstName} {row.staff?.lastName}
                                            </span>
                                        </td>
                                        <td>{row.patient?.name || 'General Facility'}</td>
                                        <td>{row.dutyType?.replace(/_/g, ' ')}</td>
                                        <td>
                                            <span style={{ color: '#059669', fontSize: 12, fontWeight: 600 }}>
                                                ✓ Verified & Approved
                                            </span>
                                        </td>
                                        <td>
                                            <span className="adm-badge adm-badge--success">Approved</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
