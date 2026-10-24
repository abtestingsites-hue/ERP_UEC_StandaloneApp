import { useState, useEffect, useCallback } from 'react';
import { HeartPulse, FileText, CheckCircle2, User, Activity, Clock, RotateCcw, AlertCircle, History } from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { HomeCareAdmission } from '../homeCare.types';

interface CareDeliveryTabProps {
    activeUnitId?: string | null;
}

interface VitalRecord {
    id: string;
    patientId: string;
    bp?: string | null;
    pulse?: number | null;
    temp?: number | null;
    spO2?: number | null;
    bloodSugar?: string | null;
    notes?: string | null;
    shift?: string | null;
    recordedAt?: string | null;
    createdAt?: string;
    recordedByName?: string | null;
}

interface CareNoteRecord {
    id: string;
    patientId: string;
    activityCategory?: string;
    notes?: string | null;
    createdAt?: string;
    careDate?: string;
}

export function CareDeliveryTab({ activeUnitId }: CareDeliveryTabProps) {
    const [admissions, setAdmissions] = useState<HomeCareAdmission[]>([]);
    const [selectedAdmissionId, setSelectedAdmissionId] = useState('');
    const [activeSection, setActiveSection] = useState<'vitals' | 'notes'>('vitals');

    // Vitals Form State
    const [shift, setShift] = useState('MORNING');
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    const [pulse, setPulse] = useState('');
    const [temperature, setTemperature] = useState('');
    const [spo2, setSpo2] = useState('');
    const [bloodSugar, setBloodSugar] = useState('');
    const [vitalNotes, setVitalNotes] = useState('');

    // Notes Form State
    const [mobility, setMobility] = useState('INDEPENDENT');
    const [hygiene, setHygiene] = useState('ASSISTED');
    const [feeding, setFeeding] = useState('INDEPENDENT');
    const [careNotes, setCareNotes] = useState('');

    // Patient History & State
    const [patientVitals, setPatientVitals] = useState<VitalRecord[]>([]);
    const [patientCareNotes, setPatientCareNotes] = useState<CareNoteRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Initial admissions & allocations loading
    useEffect(() => {
        let isMounted = true;
        Promise.all([
            homeCareService.getAdmissions(activeUnitId),
            homeCareService.getAllocations(activeUnitId)
        ])
            .then(([list, allocs]) => {
                if (!isMounted) return;
                const admMap = new Map<string, HomeCareAdmission>();

                // 1. Direct admissions
                list.forEach((adm) => {
                    admMap.set(adm.id, adm);
                });

                // 2. Synthesize admission entries from allocations
                allocs.forEach((alloc) => {
                    let rawMeta: Record<string, unknown> | null = null;
                    try {
                        if (typeof alloc.enquiry?.rawMessage === 'string') {
                            rawMeta = JSON.parse(alloc.enquiry.rawMessage);
                        } else if (alloc.enquiry?.rawMessage && typeof alloc.enquiry.rawMessage === 'object') {
                            rawMeta = alloc.enquiry.rawMessage as Record<string, unknown>;
                        }
                    } catch {
                        rawMeta = null;
                    }

                    const patientName =
                        alloc.resolvedPatient?.name ||
                        alloc.enquiry?.admission?.patient?.name ||
                        alloc.admission?.patient?.name ||
                        (rawMeta?.patientName as string) ||
                        alloc.clientName ||
                        'Home Care Patient';

                    const patientId =
                        alloc.resolvedPatient?.id ||
                        alloc.enquiry?.admission?.patient?.id ||
                        alloc.enquiry?.admission?.patientId ||
                        alloc.admission?.patient?.id ||
                        alloc.admission?.patientId ||
                        alloc.patientId ||
                        '';

                    const admId = alloc.enquiry?.admission?.id || alloc.admission?.id || alloc.id;

                    if (!admMap.has(admId)) {
                        admMap.set(admId, {
                            id: admId,
                            unitId: alloc.unitId || '',
                            status: alloc.status || 'ACTIVE',
                            patientId,
                            enquiryId: alloc.enquiryId || alloc.enquiry?.id,
                            patient: {
                                id: patientId,
                                name: patientName,
                                phone: alloc.resolvedPatient?.phone || alloc.enquiry?.client?.mobile,
                                age: alloc.resolvedPatient?.age || (rawMeta?.patientAge ? Number(rawMeta.patientAge) : undefined),
                                gender: alloc.resolvedPatient?.gender || (rawMeta?.patientGender as string)
                            },
                            enquiry: {
                                ...alloc.enquiry,
                                client: alloc.enquiry?.client || { name: alloc.clientName },
                                service: alloc.enquiry?.service || { name: (alloc.metadata as { notes?: string })?.notes || alloc.service || 'Home Care Service' }
                            },
                            serviceContract: alloc.contract ? ({ contractNumber: alloc.contract } as unknown as null) : null
                        } as HomeCareAdmission);
                    }
                });

                const merged = Array.from(admMap.values());
                setAdmissions(merged);
                if (merged.length > 0) {
                    setSelectedAdmissionId((prev) => prev || merged[0].id);
                }
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load admissions for care delivery:', err);
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId]);

    const currentAdmission = admissions.find((a) => a.id === selectedAdmissionId) || (admissions.length > 0 ? admissions[0] : null);
    const patientId = currentAdmission?.patientId || currentAdmission?.patient?.id || '';
    const patientName = currentAdmission?.patient?.name || currentAdmission?.enquiry?.client?.name || 'Home Care Patient';

    // Load Patient's Recorded Vitals and Care Notes
    const loadPatientRecords = useCallback(async (pId: string) => {
        if (!pId) {
            setPatientVitals([]);
            setPatientCareNotes([]);
            return;
        }
        setIsLoadingHistory(true);
        try {
            const [vitals, notes] = await Promise.all([
                homeCareService.getPatientVitals(pId, activeUnitId),
                homeCareService.getPatientCareNotes(pId, activeUnitId)
            ]);
            setPatientVitals(vitals);
            setPatientCareNotes(notes);

            // Check if today's vital exists
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const todayV = vitals.find((v: VitalRecord) => {
                const d = new Date(v.recordedAt || v.createdAt || '');
                return d >= todayStart;
            });

            if (todayV) {
                if (todayV.bp && todayV.bp.includes('/')) {
                    const [sys, dia] = todayV.bp.split('/');
                    setSystolic(sys || '');
                    setDiastolic(dia || '');
                } else if (todayV.bp) {
                    setSystolic(todayV.bp);
                }
                if (todayV.pulse) setPulse(String(todayV.pulse));
                if (todayV.temp) setTemperature(String(todayV.temp));
                if (todayV.spO2) setSpo2(String(todayV.spO2));
                if (todayV.bloodSugar) setBloodSugar(String(todayV.bloodSugar));
                if (todayV.notes) setVitalNotes(todayV.notes);
                if (todayV.shift) setShift(todayV.shift);
            }
        } catch (err) {
            console.error('Failed to load patient records:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [activeUnitId]);

    useEffect(() => {
        if (patientId) {
            loadPatientRecords(patientId);
        }
    }, [patientId, loadPatientRecords]);

    // Check if vital sign has been recorded today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayVital = patientVitals.find((v) => {
        const d = new Date(v.recordedAt || v.createdAt || '');
        return d >= todayStart;
    });

    const todayNote = patientCareNotes.find((n) => {
        const d = new Date(n.careDate || n.createdAt || '');
        return d >= todayStart;
    });

    const handleClearVitalsForm = () => {
        setSystolic('');
        setDiastolic('');
        setPulse('');
        setTemperature('');
        setSpo2('');
        setBloodSugar('');
        setVitalNotes('');
        setFeedback(null);
    };

    const handleRecordVitals = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (!patientId) {
            setFeedback({ type: 'error', message: 'No registered patient profile found for this client.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await homeCareService.recordVitals({
                patientId,
                shift,
                systolic: systolic ? Number(systolic) : undefined,
                diastolic: diastolic ? Number(diastolic) : undefined,
                pulse: pulse ? Number(pulse) : undefined,
                temperature: temperature ? Number(temperature) : undefined,
                oxygenSaturation: spo2 ? Number(spo2) : undefined,
                bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
                notes: vitalNotes || undefined,
                unitId: activeUnitId
            });
            setFeedback({
                type: 'success',
                message: todayVital
                    ? `Vital signs updated successfully for ${patientName}.`
                    : `Vital signs recorded successfully for ${patientName}.`
            });
            await loadPatientRecords(patientId);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to record vitals.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordNotes = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (!patientId) {
            setFeedback({ type: 'error', message: 'No registered patient profile found for this client.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await homeCareService.recordCareNotes({
                patientId,
                activityCategory: 'DAILY_CARE_NOTES',
                notes: `Mobility: ${mobility} | Hygiene: ${hygiene} | Feeding: ${feeding}${careNotes ? ` | Notes: ${careNotes}` : ''}`,
                unitId: activeUnitId
            });
            setFeedback({ type: 'success', message: `Daily care notes recorded for ${patientName}.` });
            setCareNotes('');
            await loadPatientRecords(patientId);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to record care notes.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#64748b', fontSize: 13 }}>Loading care delivery workspace...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HeartPulse size={18} color="#e11d48" />
                    Care Delivery Execution Workspace
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                    Record clinical observations, vital signs monitoring, and daily care notes for assigned Home Care patients.
                </p>
            </div>

            {feedback && (
                <div className={`adm-alert adm-alert--${feedback.type === 'success' ? 'success' : 'error'}`}>
                    {feedback.message}
                </div>
            )}

            {/* Client / Patient Selector */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                <label className="adm-form-label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} color="#0f969c" /> Select Client / Patient Profile:
                </label>
                <select
                    className="adm-form-input"
                    value={selectedAdmissionId}
                    onChange={(e) => {
                        setSelectedAdmissionId(e.target.value);
                        setFeedback(null);
                    }}
                >
                    {admissions.map((adm) => {
                        const name = adm.patient?.name || adm.enquiry?.client?.name || 'Patient';
                        const clientName = adm.enquiry?.client?.name;
                        const label = clientName && clientName !== name ? `${name} (Client: ${clientName})` : name;
                        return (
                            <option key={adm.id} value={adm.id}>
                                {label} · {adm.enquiry?.service?.name || 'Home Care'} ({adm.enquiry?.refNo || adm.id.slice(0, 8)})
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Tab Pills */}
            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    type="button"
                    className={`adm-tab-pill ${activeSection === 'vitals' ? 'adm-tab-pill--active' : ''}`}
                    onClick={() => { setActiveSection('vitals'); setFeedback(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <HeartPulse size={14} color="#e11d48" /> Vital Signs Recording
                    {todayVital && (
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>
                            Logged Today
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    className={`adm-tab-pill ${activeSection === 'notes' ? 'adm-tab-pill--active' : ''}`}
                    onClick={() => { setActiveSection('notes'); setFeedback(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <FileText size={14} color="#0f969c" /> Daily Care Notes & ADL
                    {todayNote && (
                        <span style={{ background: '#ecfeff', color: '#0e7490', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>
                            Logged Today
                        </span>
                    )}
                </button>
            </div>

            {/* Vitals Form & Display */}
            {activeSection === 'vitals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Today's Recorded Vitals Card */}
                    {todayVital && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle2 size={18} color="#16a34a" />
                                    <span style={{ fontWeight: 700, color: '#166534', fontSize: 14 }}>
                                        Today's Vital Signs Logged ({todayVital.shift || 'MORNING'} Shift)
                                    </span>
                                </div>
                                <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} />
                                    Recorded by {todayVital.recordedByName || 'Caregiver'} · {new Date(todayVital.recordedAt || todayVital.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 12 }}>
                                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Blood Pressure</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{todayVital.bp || '—'} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>mmHg</span></div>
                                </div>
                                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Pulse</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{todayVital.pulse ? `${todayVital.pulse} bpm` : '—'}</div>
                                </div>
                                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Temperature</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{todayVital.temp ? `${todayVital.temp} °F` : '—'}</div>
                                </div>
                                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>SpO2</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{todayVital.spO2 ? `${todayVital.spO2}%` : '—'}</div>
                                </div>
                                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Blood Sugar</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{todayVital.bloodSugar ? `${todayVital.bloodSugar} mg/dL` : '—'}</div>
                                </div>
                            </div>

                            {todayVital.notes && (
                                <div style={{ fontSize: 12, color: '#166534', marginTop: 10, background: '#dcfce7', padding: '6px 10px', borderRadius: 6 }}>
                                    <strong>Caregiver Note:</strong> {todayVital.notes}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vitals Form */}
                    <form onSubmit={handleRecordVitals} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                        {todayVital && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <AlertCircle size={15} color="#2563eb" />
                                    Vitals are already recorded for today. Saving will <strong>update today's record</strong> without creating duplicates.
                                </span>
                                <button type="button" className="adm-btn adm-btn--secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={handleClearVitalsForm}>
                                    <RotateCcw size={12} /> Clear Fields
                                </button>
                            </div>
                        )}

                        <div className="adm-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Shift</label>
                                <select className="adm-form-input" value={shift} onChange={(e) => setShift(e.target.value)}>
                                    <option value="MORNING">Morning Shift</option>
                                    <option value="AFTERNOON">Afternoon Shift</option>
                                    <option value="EVENING">Evening Shift</option>
                                    <option value="NIGHT">Night Shift</option>
                                </select>
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Systolic BP (mmHg)</label>
                                <input
                                    type="number"
                                    className="adm-form-input"
                                    placeholder="120"
                                    value={systolic}
                                    onChange={(e) => setSystolic(e.target.value)}
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Diastolic BP (mmHg)</label>
                                <input
                                    type="number"
                                    className="adm-form-input"
                                    placeholder="80"
                                    value={diastolic}
                                    onChange={(e) => setDiastolic(e.target.value)}
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Pulse (bpm)</label>
                                <input
                                    type="number"
                                    className="adm-form-input"
                                    placeholder="72"
                                    value={pulse}
                                    onChange={(e) => setPulse(e.target.value)}
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Temperature (°F)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="adm-form-input"
                                    placeholder="98.6"
                                    value={temperature}
                                    onChange={(e) => setTemperature(e.target.value)}
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Oxygen Saturation - SpO2 (%)</label>
                                <input
                                    type="number"
                                    className="adm-form-input"
                                    placeholder="98"
                                    value={spo2}
                                    onChange={(e) => setSpo2(e.target.value)}
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Blood Sugar (mg/dL)</label>
                                <input
                                    type="number"
                                    className="adm-form-input"
                                    placeholder="110"
                                    value={bloodSugar}
                                    onChange={(e) => setBloodSugar(e.target.value)}
                                />
                            </div>

                            <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="adm-form-label">Clinical Observations / Notes</label>
                                <input
                                    type="text"
                                    className="adm-form-input"
                                    placeholder="Observation remarks..."
                                    value={vitalNotes}
                                    onChange={(e) => setVitalNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting}>
                                <CheckCircle2 size={14} />
                                {isSubmitting ? 'Saving Vitals...' : todayVital ? "Update Today's Vital Signs" : 'Save Vital Signs'}
                            </button>
                        </div>
                    </form>

                    {/* Vitals History Log */}
                    {patientVitals.length > 0 && (
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                <History size={16} color="#0f969c" />
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                    Recorded Vitals History ({patientName})
                                </h4>
                            </div>
                            <div className="adm-table-container">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>Date & Time</th>
                                            <th>Shift</th>
                                            <th>BP</th>
                                            <th>Pulse</th>
                                            <th>Temp</th>
                                            <th>SpO2</th>
                                            <th>Sugar</th>
                                            <th>Recorded By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patientVitals.map((v) => (
                                            <tr key={v.id}>
                                                <td style={{ fontSize: 12 }}>
                                                    {new Date(v.recordedAt || v.createdAt || '').toLocaleString()}
                                                </td>
                                                <td>
                                                    <span className="adm-badge adm-badge--secondary" style={{ fontSize: 10 }}>
                                                        {v.shift || 'MORNING'}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{v.bp || '—'}</td>
                                                <td>{v.pulse ? `${v.pulse} bpm` : '—'}</td>
                                                <td>{v.temp ? `${v.temp} °F` : '—'}</td>
                                                <td>{v.spO2 ? `${v.spO2}%` : '—'}</td>
                                                <td>{v.bloodSugar ? `${v.bloodSugar} mg/dL` : '—'}</td>
                                                <td style={{ fontSize: 12, color: '#64748b' }}>
                                                    {v.recordedByName || 'Staff'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Care Notes Form */}
            {activeSection === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {todayNote && (
                        <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <CheckCircle2 size={16} color="#0891b2" />
                                <span style={{ fontWeight: 700, color: '#155e75', fontSize: 14 }}>
                                    Daily Care Notes Logged for Today
                                </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#334155' }}>{todayNote.notes}</div>
                        </div>
                    )}

                    <form onSubmit={handleRecordNotes} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                        <div className="adm-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Mobility Assistance</label>
                                <select
                                    className="adm-form-input"
                                    value={mobility}
                                    onChange={(e) => setMobility(e.target.value)}
                                >
                                    <option value="INDEPENDENT">Independent</option>
                                    <option value="ASSISTED">Assisted Walking</option>
                                    <option value="WHEELCHAIR">Wheelchair Bound</option>
                                    <option value="BEDBOUND">Bedbound</option>
                                </select>
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Personal Hygiene & Bathing</label>
                                <select
                                    className="adm-form-input"
                                    value={hygiene}
                                    onChange={(e) => setHygiene(e.target.value)}
                                >
                                    <option value="INDEPENDENT">Independent</option>
                                    <option value="ASSISTED">Assisted</option>
                                    <option value="SPONGE_BATH">Sponge Bath</option>
                                    <option value="TOTAL_CARE">Total Hygiene Care</option>
                                </select>
                            </div>

                            <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="adm-form-label">Dietary Intake & Feeding</label>
                                <select
                                    className="adm-form-input"
                                    value={feeding}
                                    onChange={(e) => setFeeding(e.target.value)}
                                >
                                    <option value="INDEPENDENT">Independent Meal</option>
                                    <option value="ASSISTED">Assisted Feeding</option>
                                    <option value="TUBE_FEEDING">Ryles Tube / Clinical Feeding</option>
                                </select>
                            </div>

                            <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="adm-form-label">Daily Care Notes & Activities</label>
                                <textarea
                                    className="adm-form-input"
                                    rows={3}
                                    placeholder="Describe care activities delivered, client mood, medication compliance, hydration..."
                                    value={careNotes}
                                    onChange={(e) => setCareNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting}>
                                <CheckCircle2 size={14} />
                                {isSubmitting ? 'Saving Care Notes...' : todayNote ? 'Update Daily Care Notes' : 'Save Daily Care Notes'}
                            </button>
                        </div>
                    </form>

                    {/* Care Notes History */}
                    {patientCareNotes.length > 0 && (
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                <History size={16} color="#0f969c" />
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                    Recent Daily Care Notes History ({patientName})
                                </h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {patientCareNotes.map((n) => (
                                    <div key={n.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                                            Date: {n.careDate || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Today')}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#334155' }}>{n.notes}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
