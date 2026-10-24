import { useState, useEffect } from 'react';
import { X, UserCheck, Calendar, Clock, AlertCircle, Phone, Mail, Building2, KeyRound } from 'lucide-react';
import { careService } from '../care.service';
import type { MedicalStaff, CarePatient, AssignmentPriority } from '../care.types';
import { useActiveUnit } from '../../../context/useActiveUnit';

interface NewAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    activeUnitId?: string | null;
}

const toDateTimeLocalValue = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
};

export function NewAssignmentModal({ isOpen, onClose, onSuccess, activeUnitId }: NewAssignmentModalProps) {
    const { units } = useActiveUnit();
    const [staffList, setStaffList] = useState<MedicalStaff[]>([]);
    const [patients, setPatients] = useState<CarePatient[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [staffId, setStaffId] = useState('');
    const [patientId, setPatientId] = useState('');
    const [dutyType, setDutyType] = useState('NURSING_CARE');
    const [role, setRole] = useState('Nurse');
    const [location, setLocation] = useState('');
    const [priority, setPriority] = useState<AssignmentPriority>('MEDIUM');
    const [startAt, setStartAt] = useState(toDateTimeLocalValue(new Date()));
    const [endAt, setEndAt] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;
        const fetchStaffAndPatients = async () => {
            try {
                const [staff, pts] = await Promise.all([
                    careService.getMedicalStaff(activeUnitId),
                    careService.getActivePatients(activeUnitId)
                ]);
                if (!isMounted) return;
                setStaffList(staff);
                setPatients(pts);
                if (staff.length > 0) {
                    setStaffId(staff[0].id);
                    setRole(staff[0].designation || 'Nurse');
                }
                if (pts.length > 0) {
                    setPatientId(pts[0].id);
                    if (pts[0].room) setLocation(`Room ${pts[0].room}${pts[0].bed ? `, Bed ${pts[0].bed}` : ''}`);
                }
            } catch {
                if (isMounted) setError('Failed to load staff or resident list.');
            } finally {
                if (isMounted) setIsLoadingData(false);
            }
        };
        void fetchStaffAndPatients();
        return () => {
            isMounted = false;
        };
    }, [isOpen, activeUnitId]);

    const handleStaffChange = (id: string) => {
        setStaffId(id);
        const selected = staffList.find((s) => s.id === id);
        if (selected?.designation) setRole(selected.designation);
    };

    const handlePatientChange = (id: string) => {
        setPatientId(id);
        const selected = patients.find((p) => p.id === id);
        if (selected?.room) {
            setLocation(`Room ${selected.room}${selected.bed ? `, Bed ${selected.bed}` : ''}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffId) {
            setError('Please select a nursing staff member.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const selectedPatient = patients.find((p) => p.id === patientId);
            await careService.createAssignment({
                staffId,
                patientId: patientId || undefined,
                admissionId: selectedPatient?.admissionId || undefined,
                dutyType,
                role,
                location: location || undefined,
                priority,
                startAt: startAt ? new Date(startAt).toISOString() : undefined,
                endAt: endAt ? new Date(endAt).toISOString() : undefined,
                notes: notes || undefined,
                status: 'ASSIGNED',
                unitId: activeUnitId || selectedPatient?.unitId || selectedStaff?.unitId || undefined
            });

            onSuccess();
            onClose();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to create assignment.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedStaff = staffList.find((s) => s.id === staffId);
    const selectedPatient = patients.find((p) => p.id === patientId);

    if (!isOpen) return null;

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--lg">
                <div className="adm-modal-header">
                    <div className="adm-modal-title-group">
                        <UserCheck className="adm-modal-icon" />
                        <div>
                            <h2 className="adm-modal-title">Assign Nursing Clinical Duty</h2>
                            <p className="adm-modal-subtitle">
                                Allocate resident care responsibility, shift time, and clinical tasks to staff
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="adm-modal-body">
                    {error && (
                        <div className="adm-alert adm-alert--error" style={{ marginBottom: 16 }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {isLoadingData ? (
                        <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
                            Loading medical staff and residents...
                        </div>
                    ) : (
                        <div className="adm-form-grid" style={{ gap: 16 }}>
                            <div className="adm-form-group">
                                <label className="adm-label">Assigned Staff Member *</label>
                                <select
                                    className="adm-select"
                                    value={staffId}
                                    onChange={(e) => handleStaffChange(e.target.value)}
                                    required
                                >
                                    <option value="">Select Staff Member</option>
                                    {staffList.map((s) => {
                                        const uCode = units.find((u) => u.id === s.unitId)?.code || units.find((u) => u.id === s.unitId)?.name;
                                        const availStatus = s.isAvailable ? 'Available' : 'Busy';
                                        const loginUser = s.user?.email || s.email;
                                        return (
                                            <option key={s.id} value={s.id}>
                                                {s.firstName} {s.lastName} ({s.designation || 'Staff'}{uCode ? ` · ${uCode}` : ''}) — {availStatus} {loginUser ? `[Login: ${loginUser}]` : ''}
                                            </option>
                                        );
                                    })}
                                </select>

                                {/* Staff Profile Preview Card */}
                                {selectedStaff && (() => {
                                    const staffUnit = units.find((u) => u.id === selectedStaff.unitId);
                                    const isAvailable = Boolean(selectedStaff.isAvailable);
                                    const loginEmail = selectedStaff.user?.email || selectedStaff.email;
                                    const roleName = selectedStaff.user?.role?.name;
                                    return (
                                        <div
                                            style={{
                                                marginTop: 8,
                                                padding: '10px 14px',
                                                borderRadius: 8,
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                fontSize: 12
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                                                        {selectedStaff.firstName} {selectedStaff.lastName}
                                                    </span>
                                                    <span className="adm-badge adm-badge--primary" style={{ fontSize: 10 }}>
                                                        {selectedStaff.designation || 'Clinical Staff'}
                                                    </span>
                                                    {staffUnit && (
                                                        <span className="adm-badge adm-badge--neutral" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                            <Building2 size={10} />
                                                            {staffUnit.name}
                                                        </span>
                                                    )}
                                                    {loginEmail && (
                                                        <span
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 3,
                                                                padding: '2px 7px',
                                                                borderRadius: 4,
                                                                fontSize: 10,
                                                                fontWeight: 600,
                                                                background: '#eff6ff',
                                                                color: '#1d4ed8',
                                                                border: '1px solid #bfdbfe'
                                                            }}
                                                            title={`Can log in to ERP as ${loginEmail}${roleName ? ` (${roleName})` : ''}`}
                                                        >
                                                            <KeyRound size={10} />
                                                            Login: {loginEmail}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Live Duty & Availability Status Badge */}
                                                {isAvailable ? (
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 5,
                                                            padding: '2px 8px',
                                                            borderRadius: 9999,
                                                            fontSize: 10,
                                                            fontWeight: 600,
                                                            background: '#dcfce7',
                                                            color: '#166534',
                                                            border: '1px solid #bbf7d0'
                                                        }}
                                                    >
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                                                        Active / Available ({selectedStaff.status || 'Working'})
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 5,
                                                            padding: '2px 8px',
                                                            borderRadius: 9999,
                                                            fontSize: 10,
                                                            fontWeight: 600,
                                                            background: '#fef3c7',
                                                            color: '#92400e',
                                                            border: '1px solid #fde68a'
                                                        }}
                                                    >
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                                                        Busy ({selectedStaff.status || 'On Duty'})
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: 14, color: '#64748b', fontSize: 11, flexWrap: 'wrap', marginBottom: 4 }}>
                                                <span>Emp ID: <strong>{selectedStaff.empId || '—'}</strong></span>
                                                <span>Department: <strong>{selectedStaff.department || 'Clinical Care'}</strong></span>
                                                <span>Active Duties: <strong style={{ color: (selectedStaff.currentWorkload ?? 0) > 2 ? '#b45309' : '#0f172a' }}>{selectedStaff.currentWorkload ?? 0}</strong></span>
                                                {selectedStaff.shiftStart && selectedStaff.shiftEnd && (
                                                    <span>Shift: <strong>{selectedStaff.shiftStart} - {selectedStaff.shiftEnd}</strong></span>
                                                )}
                                            </div>

                                            {(selectedStaff.phone || selectedStaff.email) && (
                                                <div style={{ display: 'flex', gap: 14, color: '#475569', fontSize: 11, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px dashed #e2e8f0' }}>
                                                    {selectedStaff.phone && (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <Phone size={11} style={{ color: '#0284c7' }} />
                                                            <strong>{selectedStaff.phone}</strong>
                                                        </span>
                                                    )}
                                                    {selectedStaff.email && (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <Mail size={11} style={{ color: '#0284c7' }} />
                                                            {selectedStaff.email}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-label">Resident / Patient *</label>
                                <select
                                    className="adm-select"
                                    value={patientId}
                                    onChange={(e) => handlePatientChange(e.target.value)}
                                >
                                    <option value="">None / General Duty</option>
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.elderId ? `(${p.elderId})` : ''} {p.room ? `· Room ${p.room}` : ''}
                                        </option>
                                    ))}
                                </select>

                                {/* Admitted Resident Context Card */}
                                {selectedPatient && (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            background: '#f0fdf4',
                                            border: '1px solid #bbf7d0',
                                            fontSize: 12
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontWeight: 700, color: '#166534' }}>
                                                {selectedPatient.name} {selectedPatient.elderId ? `(${selectedPatient.elderId})` : ''}
                                            </span>
                                            <span className="adm-badge adm-badge--success" style={{ fontSize: 10 }}>
                                                {selectedPatient.room ? `Room ${selectedPatient.room}` : 'Admitted Inpatient'}
                                                {selectedPatient.bed ? `, Bed ${selectedPatient.bed}` : ''}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, color: '#15803d', fontSize: 11, flexWrap: 'wrap' }}>
                                            {selectedPatient.age && <span>Age: <strong>{selectedPatient.age} yrs</strong></span>}
                                            {selectedPatient.gender && <span>Gender: <strong>{selectedPatient.gender}</strong></span>}
                                            {selectedPatient.bloodGroup && <span>Blood Group: <strong>{selectedPatient.bloodGroup}</strong></span>}
                                            {selectedPatient.emergencyContact && (
                                                <span>Emergency Contact: <strong>{selectedPatient.emergencyContact}</strong></span>
                                            )}
                                            {selectedPatient.admittedAt && (
                                                <span>Admitted: <strong>{new Date(selectedPatient.admittedAt).toLocaleDateString()}</strong></span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-label">Duty Type *</label>
                                <select
                                    className="adm-select"
                                    value={dutyType}
                                    onChange={(e) => setDutyType(e.target.value)}
                                    required
                                >
                                    <option value="NURSING_CARE">Nursing Clinical Care</option>
                                    <option value="ROUND">Clinical Round & Check</option>
                                    <option value="MEDICATION_ADMIN">Medication Administration</option>
                                    <option value="VITALS_MONITORING">Vitals Monitoring</option>
                                    <option value="EMERGENCY_CARE">Emergency Care</option>
                                </select>
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-label">Priority</label>
                                <select
                                    className="adm-select"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as AssignmentPriority)}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-label">Role Designation</label>
                                <input
                                    type="text"
                                    className="adm-input"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="e.g. Nurse, Caregiver"
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-label">Care Location / Room</label>
                                <input
                                    type="text"
                                    className="adm-input"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Ward A, Room 102"
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-label">
                                    <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                                    Start Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    className="adm-input"
                                    value={startAt}
                                    onChange={(e) => setStartAt(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-label">
                                    <Clock size={14} style={{ display: 'inline', marginRight: 4 }} />
                                    End Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    className="adm-input"
                                    value={endAt}
                                    onChange={(e) => setEndAt(e.target.value)}
                                />
                            </div>

                            <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="adm-label">Clinical Care Notes & Instructions</label>
                                <textarea
                                    className="adm-input"
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Instructions for vitals schedule, medication alerts, feeding precautions..."
                                />
                            </div>
                        </div>
                    )}

                    <div className="adm-modal-footer">
                        <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting || isLoadingData}>
                            {isSubmitting ? 'Assigning...' : 'Assign Duty'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
