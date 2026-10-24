import { useState, useEffect, useCallback } from 'react';
import {
    Pill,
    CheckCircle2,
    Plus,
    X
} from 'lucide-react';
import { careService } from '../care.service';
import type { MedicationSchedule, MedicationLog, CarePatient } from '../care.types';

interface MedicationTabProps {
    activeUnitId?: string | null;
    isManager?: boolean;
}

export function MedicationTab({ activeUnitId, isManager = false }: MedicationTabProps) {
    const [patients, setPatients] = useState<CarePatient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
    const [logs, setLogs] = useState<MedicationLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Prescribe Modal State
    const [isPrescribeOpen, setIsPrescribeOpen] = useState(false);
    const [prescribePatientId, setPrescribePatientId] = useState('');
    const [medicineName, setMedicineName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('Once Daily');
    const [route, setRoute] = useState('Oral');
    const [morning, setMorning] = useState(true);
    const [afternoon, setAfternoon] = useState(false);
    const [evening, setEvening] = useState(false);
    const [night, setNight] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Load residents: Staff only sees their specifically assigned residents; Managers see all
    useEffect(() => {
        let isMounted = true;
        const fetchPatients = isManager
            ? careService.getActivePatients(activeUnitId)
            : careService.getStaffAssignedPatients(activeUnitId);

        fetchPatients.then((pts) => {
            if (!isMounted) return;
            setPatients(pts);
            if (pts.length > 0) {
                setSelectedPatientId((prev) => {
                    const exists = pts.some((p) => p.id === prev);
                    return exists ? prev : pts[0].id;
                });
                setPrescribePatientId(pts[0].id);
            } else {
                setSelectedPatientId('');
                setPrescribePatientId('');
            }
        });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, isManager]);

    const loadMedData = useCallback(async (patientId?: string) => {
        setIsLoading(true);
        try {
            const [sched, lg] = await Promise.all([
                careService.getMedicationSchedules(patientId, activeUnitId),
                careService.getMedicationLogs(patientId, activeUnitId)
            ]);
            setSchedules(sched);
            setLogs(lg);
        } catch {
            setSchedules([]);
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await loadMedData(selectedPatientId || undefined);
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [selectedPatientId, loadMedData]);

    const handleVerifyMedLog = async (id: string) => {
        try {
            await careService.verifyMedicationLog(id, 'Manager verified', activeUnitId);
            setLogs((prev) =>
                prev.map((l) => (l.id === id ? { ...l, isVerified: true } : l))
            );
        } catch {
            alert('Failed to verify medication administration log.');
        }
    };

    const handlePrescribeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetPatientId = prescribePatientId || selectedPatientId;
        if (!targetPatientId) {
            setFeedback({ type: 'error', message: 'Please select a resident to prescribe for.' });
            return;
        }
        if (!medicineName.trim()) {
            setFeedback({ type: 'error', message: 'Medicine name is required.' });
            return;
        }
        const selectedPatient = patients.find((p) => p.id === targetPatientId);
        const times: string[] = [];
        if (morning) times.push('MORNING');
        if (afternoon) times.push('AFTERNOON');
        if (evening) times.push('EVENING');
        if (night) times.push('NIGHT');

        if (times.length === 0) {
            setFeedback({ type: 'error', message: 'Please select at least one schedule slot (Morning, Afternoon, Evening, or Night).' });
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);
        try {
            await careService.createMedicationSchedule({
                patientId: targetPatientId,
                patientName: selectedPatient?.name || 'Assigned Resident',
                medicineName: medicineName.trim(),
                dose: dosage.trim() || 'Standard Dose',
                frequency,
                times,
                morning,
                afternoon,
                evening,
                night,
                startDate,
                notes: notes ? `${notes} (Route: ${route})` : `Route: ${route}`,
                unitId: activeUnitId
            });

            setIsPrescribeOpen(false);
            setMedicineName('');
            setDosage('');
            setNotes('');
            await loadMedData(selectedPatientId || undefined);
            setFeedback({ type: 'success', message: `Prescription for ${medicineName} created successfully.` });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to create medication schedule.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedPatient = patients.find((p) => p.id === selectedPatientId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {feedback && (
                <div
                    style={{
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                        border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}
                >
                    {feedback.message}
                </div>
            )}

            {/* Resident Scope & Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#dbeafe', padding: 8, borderRadius: 8, color: '#2563eb' }}>
                        <Pill size={20} />
                    </div>
                    <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                            {isManager ? 'Select Resident for Medication Plan:' : 'Assigned Resident (Exclusive Care Allocation):'}
                        </span>
                        {patients.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>
                                No residents currently assigned to your shift.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                <select
                                    className="adm-select"
                                    value={selectedPatientId}
                                    onChange={(e) => {
                                        setSelectedPatientId(e.target.value);
                                        setPrescribePatientId(e.target.value);
                                    }}
                                    style={{ fontWeight: 700, fontSize: 14, padding: '4px 10px', height: 'auto' }}
                                >
                                    {isManager && <option value="">All Residents</option>}
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.elderId ? `(${p.elderId})` : ''} {p.room ? `· Room ${p.room}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {!isManager && selectedPatient && (
                                    <span className="adm-badge adm-badge--primary" style={{ fontSize: 11 }}>
                                        Assigned to You
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#64748b', fontSize: 11 }}>Active Prescriptions:</span>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{schedules.length} Items</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#64748b', fontSize: 11 }}>Administered Doses:</span>
                        <div style={{ fontWeight: 700, color: '#059669' }}>{logs.length} Logged</div>
                    </div>
                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={() => {
                            setFeedback(null);
                            setPrescribePatientId(selectedPatientId || (patients[0]?.id ?? ''));
                            setIsPrescribeOpen(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
                    >
                        <Plus size={16} /> Prescribe Medication
                    </button>
                </div>
            </div>

            {/* Split: Active Medication Schedules & Administration History Logs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Active Schedules */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                        Prescribed Medication Schedules
                    </h4>

                    {isLoading ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading schedules...</div>
                    ) : schedules.length === 0 ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                            No active medication schedules for {selectedPatient ? selectedPatient.name : 'selected resident'}.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {schedules.map((s) => (
                                <div
                                    key={s.id}
                                    style={{
                                        padding: 14,
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 8,
                                        background: '#f8fafc'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                                            {s.medicineName}
                                        </span>
                                        <span className="adm-badge adm-badge--primary" style={{ fontSize: 11 }}>
                                            {s.dosage || 'Standard Dose'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                        Frequency: {s.frequency || 'Daily'} · Route: {s.route || 'Oral'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                        <span className={`adm-badge ${s.morning ? 'adm-badge--success' : 'adm-badge--neutral'}`} style={{ fontSize: 10 }}>
                                            Morning
                                        </span>
                                        <span className={`adm-badge ${s.afternoon ? 'adm-badge--success' : 'adm-badge--neutral'}`} style={{ fontSize: 10 }}>
                                            Afternoon
                                        </span>
                                        <span className={`adm-badge ${s.evening ? 'adm-badge--success' : 'adm-badge--neutral'}`} style={{ fontSize: 10 }}>
                                            Evening
                                        </span>
                                        <span className={`adm-badge ${s.night ? 'adm-badge--success' : 'adm-badge--neutral'}`} style={{ fontSize: 10 }}>
                                            Night
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Medication Administration Logs */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                        Dose Administration Logs & Verifications
                    </h4>

                    {isLoading ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                            No administered dose records found.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    style={{
                                        padding: 12,
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 8,
                                        background: '#ffffff',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                                            {log.medicineName} ({log.slot})
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                            {new Date(log.administeredAt).toLocaleString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}{' '}
                                            {log.remarks ? `· ${log.remarks}` : ''}
                                        </div>
                                    </div>
                                    <div>
                                        {log.isVerified ? (
                                            <span style={{ color: '#059669', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <CheckCircle2 size={13} /> Verified
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--secondary"
                                                style={{ padding: '2px 8px', fontSize: 11 }}
                                                onClick={() => handleVerifyMedLog(log.id)}
                                            >
                                                Verify
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Prescribe Medication Modal */}
            {isPrescribeOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 16
                    }}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            width: '100%',
                            maxWidth: 540,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '16px 20px',
                                borderBottom: '1px solid #e2e8f0',
                                background: '#f8fafc'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ background: '#dbeafe', color: '#2563eb', padding: 6, borderRadius: 6 }}>
                                    <Pill size={18} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                    Prescribe Resident Medication
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPrescribeOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePrescribeSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Resident Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                    Resident:
                                </label>
                                <select
                                    className="adm-select"
                                    value={prescribePatientId}
                                    onChange={(e) => setPrescribePatientId(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                    disabled={!isManager && patients.length === 1}
                                >
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.elderId ? `(${p.elderId})` : ''} {p.room ? `· Room ${p.room}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Medicine Name & Dosage */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                        Medicine Name *
                                    </label>
                                    <input
                                        type="text"
                                        className="adm-input"
                                        placeholder="e.g. Paracetamol, Metformin"
                                        value={medicineName}
                                        onChange={(e) => setMedicineName(e.target.value)}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                        Dosage *
                                    </label>
                                    <input
                                        type="text"
                                        className="adm-input"
                                        placeholder="e.g. 500mg, 1 tablet"
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* Frequency & Route */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                        Frequency
                                    </label>
                                    <select
                                        className="adm-select"
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Once Daily">Once Daily (OD)</option>
                                        <option value="Twice Daily">Twice Daily (BD)</option>
                                        <option value="Thrice Daily">Thrice Daily (TDS)</option>
                                        <option value="Four Times Daily">Four Times Daily (QDS)</option>
                                        <option value="SOS / As Needed">SOS / As Needed</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                        Administration Route
                                    </label>
                                    <select
                                        className="adm-select"
                                        value={route}
                                        onChange={(e) => setRoute(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Oral">Oral (PO)</option>
                                        <option value="IV">Intravenous (IV)</option>
                                        <option value="IM">Intramuscular (IM)</option>
                                        <option value="Sublingual">Sublingual (SL)</option>
                                        <option value="Topical">Topical</option>
                                        <option value="Inhalation">Inhalation</option>
                                    </select>
                                </div>
                            </div>

                            {/* Schedule Slots (Morning, Afternoon, Evening, Night) */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                                    Administration Timing Slots *
                                </label>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={morning}
                                            onChange={(e) => setMorning(e.target.checked)}
                                        />
                                        Morning
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={afternoon}
                                            onChange={(e) => setAfternoon(e.target.checked)}
                                        />
                                        Afternoon
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={evening}
                                            onChange={(e) => setEvening(e.target.checked)}
                                        />
                                        Evening
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={night}
                                            onChange={(e) => setNight(e.target.checked)}
                                        />
                                        Night
                                    </label>
                                </div>
                            </div>

                            {/* Start Date & Instructions */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        className="adm-input"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                        Special Instructions / Remarks
                                    </label>
                                    <input
                                        type="text"
                                        className="adm-input"
                                        placeholder="e.g. Take after meals, with water"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                                <button
                                    type="button"
                                    className="adm-btn adm-btn--secondary"
                                    onClick={() => setIsPrescribeOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="adm-btn adm-btn--primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save & Prescribe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
