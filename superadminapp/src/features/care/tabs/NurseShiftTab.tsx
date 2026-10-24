import { useState, useEffect, useCallback } from 'react';
import {
    User,
    Play,
    Stethoscope,
    Calendar,
    MapPin,
    HeartPulse,
    RotateCcw
} from 'lucide-react';
import { careService } from '../care.service';
import { useAuth } from '../../auth/useAuth';
import type { MedicalAssignment, MedicalStaff } from '../care.types';

interface NurseShiftTabProps {
    activeUnitId?: string | null;
    onLaunchDutyWorkspace: (assignment: MedicalAssignment) => void;
    isManager?: boolean;
}

export function NurseShiftTab({
    activeUnitId,
    onLaunchDutyWorkspace,
    isManager = false
}: NurseShiftTabProps) {
    const { session } = useAuth();
    const currentUser = session?.user;
    const [staffList, setStaffList] = useState<MedicalStaff[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [duties, setDuties] = useState<MedicalAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        if (isManager) {
            careService.getMedicalStaff(activeUnitId).then((staff) => {
                if (!isMounted) return;
                setStaffList(staff);
                if (staff.length > 0) {
                    setSelectedStaffId(staff[0].id);
                }
            });
        }
        return () => {
            isMounted = false;
        };
    }, [activeUnitId, isManager]);

    const loadStaffDuties = useCallback(async () => {
        setIsLoading(true);
        try {
            if (!isManager) {
                // Real nursing staff: fetch strictly their authenticated shift assignments
                const res = await careService.getMyShift(activeUnitId);
                setDuties(res.assignments);
            } else if (selectedStaffId) {
                // Manager viewing specific staff duties
                const list = await careService.getAssignments({ staffId: selectedStaffId, unitId: activeUnitId });
                setDuties(list);
            } else {
                setDuties([]);
            }
        } catch {
            setDuties([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, isManager, selectedStaffId]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await loadStaffDuties();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [loadStaffDuties]);

    const handleStartDuty = async (dutyId: string) => {
        try {
            await careService.updateAssignmentStatus(dutyId, 'IN_PROGRESS', undefined, activeUnitId);
            setDuties((prev) =>
                prev.map((d) => (d.id === dutyId ? { ...d, status: 'IN_PROGRESS' } : d))
            );
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to start duty.';
            alert(message);
        }
    };

    const activeStaff = staffList.find((s) => s.id === selectedStaffId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Staff Selector Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#e0f2fe', padding: 8, borderRadius: 8, color: '#0284c7' }}>
                        <User size={20} />
                    </div>
                    <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Active Nurse Staff Context:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isManager ? (
                                <>
                                    <select
                                        className="adm-select"
                                        value={selectedStaffId}
                                        onChange={(e) => setSelectedStaffId(e.target.value)}
                                        style={{ fontWeight: 700, fontSize: 14, padding: '4px 10px', height: 'auto' }}
                                    >
                                        {staffList.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.firstName} {s.lastName} ({s.designation || 'Staff Nurse'})
                                            </option>
                                        ))}
                                    </select>
                                    {activeStaff && (
                                        <span className="adm-badge adm-badge--primary" style={{ fontSize: 11 }}>
                                            {activeStaff.department || 'Nursing Care'}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                                        {currentUser?.name || 'Staff Nurse'}
                                    </span>
                                    <span className="adm-badge adm-badge--neutral" style={{ fontSize: 11 }}>
                                        {typeof currentUser?.role === 'string'
                                            ? currentUser.role
                                            : currentUser?.role?.name || 'NURSING_CARE_STAFF'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13 }}>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#64748b', fontSize: 11 }}>Assigned Duties:</span>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{duties.length} Duties</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#64748b', fontSize: 11 }}>Active In-Progress:</span>
                        <div style={{ fontWeight: 700, color: '#0284c7' }}>
                            {duties.filter((d) => d.status === 'IN_PROGRESS').length} Duties
                        </div>
                    </div>
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={() => loadStaffDuties()}
                        style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                        title="Refresh Shift Duties"
                    >
                        <RotateCcw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Duties Grid */}
            {isLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                    Loading active shift duties...
                </div>
            ) : duties.length === 0 ? (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 40, textAlign: 'center' }}>
                    <HeartPulse size={40} color="#0284c7" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                        No Active Shift Duties Assigned
                    </h4>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
                        This nurse staff member currently has no active clinical duties scheduled for this operating unit.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                    {duties.map((duty) => {
                        const isAssigned = duty.status === 'ASSIGNED' || duty.status === 'PENDING';
                        const isInProgress = duty.status === 'IN_PROGRESS';
                        const isWaitingApproval = duty.status === 'WAITING_APPROVAL';
                        const isApproved = duty.status === 'APPROVED';

                        return (
                            <div
                                key={duty.id}
                                style={{
                                    background: '#ffffff',
                                    border: `1px solid ${
                                        isInProgress
                                            ? '#93c5fd'
                                            : isWaitingApproval
                                            ? '#fed7aa'
                                            : isApproved
                                            ? '#bbf7d0'
                                            : '#e2e8f0'
                                    }`,
                                    borderRadius: 12,
                                    padding: 18,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: 14
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <span className={`adm-badge ${
                                            isInProgress
                                                ? 'adm-badge--primary'
                                                : isWaitingApproval
                                                ? 'adm-badge--warning'
                                                : isApproved
                                                ? 'adm-badge--success'
                                                : 'adm-badge--neutral'
                                        }`}>
                                            {duty.status?.replace(/_/g, ' ')}
                                        </span>
                                        <span className="adm-badge adm-badge--primary" style={{ fontSize: 10 }}>
                                            {duty.priority} PRIORITY
                                        </span>
                                    </div>

                                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                        {duty.patient?.name || 'General Clinical Round'}
                                    </h4>
                                    <div style={{ fontSize: 13, color: '#0284c7', fontWeight: 600, marginTop: 2 }}>
                                        {duty.dutyType?.replace(/_/g, ' ')}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10, fontSize: 12, color: '#64748b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <MapPin size={13} color="#94a3b8" />
                                            <span>Location: {duty.location || 'General Ward'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Calendar size={13} color="#94a3b8" />
                                            <span>
                                                Shift Time:{' '}
                                                {duty.startAt
                                                    ? new Date(duty.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Standard Shift'}
                                            </span>
                                        </div>
                                    </div>

                                    {duty.notes && (
                                        <div style={{ marginTop: 10, padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: 12, color: '#475569' }}>
                                            <strong>Instructions:</strong> {duty.notes}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                                    {isAssigned && (
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            onClick={() => handleStartDuty(duty.id)}
                                            style={{ flex: 1, padding: '6px 10px', fontSize: 12, color: '#059669' }}
                                        >
                                            <Play size={13} /> Start Duty
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="adm-btn adm-btn--primary"
                                        onClick={() => onLaunchDutyWorkspace(duty)}
                                        style={{ flex: 2, padding: '6px 12px', fontSize: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
                                    >
                                        <Stethoscope size={14} /> Open Care Workspace
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
