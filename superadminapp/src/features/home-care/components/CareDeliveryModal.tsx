import { useState, useEffect } from 'react';
import { X, HeartPulse, FileText, CheckCircle2 } from 'lucide-react';
import { homeCareService } from '../homeCare.service';

interface CareDeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName?: string;
    activeUnitId?: string | null;
}

export function CareDeliveryModal({
    isOpen,
    onClose,
    patientId,
    patientName = 'Patient',
    activeUnitId
}: CareDeliveryModalProps) {
    const [activeSection, setActiveSection] = useState<'vitals' | 'notes'>('vitals');

    // Vitals Form State
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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [resolvedPatientId, setResolvedPatientId] = useState(patientId);

    useEffect(() => {
        if (patientId) {
            setResolvedPatientId(patientId);
            return;
        }
        if (!isOpen) return;
        homeCareService.getAllocations(activeUnitId).then((allocs) => {
            for (const alloc of allocs) {
                const pId =
                    (alloc as { resolvedPatient?: { id?: string } }).resolvedPatient?.id ||
                    alloc.enquiry?.admission?.patient?.id ||
                    alloc.enquiry?.admission?.patientId ||
                    (alloc as { admission?: { patient?: { id?: string } } }).admission?.patient?.id ||
                    (alloc as { patientId?: string }).patientId;
                if (pId) {
                    setResolvedPatientId(pId);
                    break;
                }
            }
        }).catch(() => {});
    }, [patientId, isOpen, activeUnitId]);

    const [patientVitals, setPatientVitals] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        const targetId = patientId || resolvedPatientId;
        if (!targetId) return;

        homeCareService.getPatientVitals(targetId, activeUnitId).then((vitals) => {
            setPatientVitals(vitals);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayV = vitals.find((v: any) => new Date(v.recordedAt || v.createdAt || '') >= todayStart);
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
            }
        }).catch(() => {});
    }, [isOpen, patientId, resolvedPatientId, activeUnitId]);

    if (!isOpen) return null;

    const effectivePatientId = patientId || resolvedPatientId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayVital = patientVitals.find((v: any) => new Date(v.recordedAt || v.createdAt || '') >= todayStart);

    const handleRecordVitals = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (!effectivePatientId) {
            setFeedback({ type: 'error', message: 'No patient ID associated with this record.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await homeCareService.recordVitals({
                patientId: effectivePatientId,
                shift: 'MORNING',
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
            // Reload vitals
            homeCareService.getPatientVitals(effectivePatientId, activeUnitId).then(setPatientVitals).catch(() => {});
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to record vitals.';
            setFeedback({ type: 'error', message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordNotes = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (!effectivePatientId) {
            setFeedback({ type: 'error', message: 'No patient ID associated with this record.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await homeCareService.recordCareNotes({
                patientId: effectivePatientId,
                activityCategory: 'DAILY_CARE_NOTES',
                notes: `Mobility: ${mobility} | Hygiene: ${hygiene} | Feeding: ${feeding}${careNotes ? ` | Notes: ${careNotes}` : ''}`,
                unitId: activeUnitId
            });
            setFeedback({ type: 'success', message: 'Care delivery notes logged successfully.' });
            setCareNotes('');
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to record care notes.';
            setFeedback({ type: 'error', message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--md" style={{ maxWidth: 540 }}>
                <div className="adm-modal-header">
                    <div className="adm-modal-title-group">
                        <HeartPulse className="adm-modal-icon" color="#e11d48" />
                        <div>
                            <h3 className="adm-modal-title">Care Delivery Workspace</h3>
                            <p className="adm-modal-subtitle">
                                Record observations, vitals, and care delivery notes for <strong>{patientName}</strong>.
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="adm-modal-body">
                    {feedback && (
                        <div
                            className={`adm-alert adm-alert--${feedback.type === 'success' ? 'success' : 'error'}`}
                            style={{ marginBottom: 14 }}
                        >
                            {feedback.message}
                        </div>
                    )}

                    {/* Section Switcher Tabs */}
                    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16 }}>
                        <button
                            type="button"
                            className={`adm-tab-pill ${activeSection === 'vitals' ? 'adm-tab-pill--active' : ''}`}
                            onClick={() => { setActiveSection('vitals'); setFeedback(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <HeartPulse size={14} color="#e11d48" /> Vital Signs Recording
                        </button>
                        <button
                            type="button"
                            className={`adm-tab-pill ${activeSection === 'notes' ? 'adm-tab-pill--active' : ''}`}
                            onClick={() => { setActiveSection('notes'); setFeedback(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <FileText size={14} color="#0f969c" /> Daily Care Notes & ADL
                        </button>
                    </div>

                    {/* Vitals Form */}
                    {activeSection === 'vitals' && (
                        <form onSubmit={handleRecordVitals}>
                            {todayVital && (
                                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#166534' }}>
                                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircle2 size={14} color="#16a34a" /> Today's Vitals Already Logged ({todayVital.shift || 'MORNING'} Shift)
                                    </div>
                                    <div style={{ marginTop: 2, fontSize: 11, color: '#15803d' }}>
                                        Saving will <strong>update today's record</strong> without creating duplicates.
                                    </div>
                                </div>
                            )}

                            <div className="adm-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                                    <label className="adm-form-label">SpO2 (%)</label>
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
                                    <label className="adm-form-label">Clinical Notes</label>
                                    <input
                                        type="text"
                                        className="adm-form-input"
                                        placeholder="Patient feeling well, good appetite..."
                                        value={vitalNotes}
                                        onChange={(e) => setVitalNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="adm-modal-footer" style={{ marginTop: 16 }}>
                                <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose}>
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    className="adm-btn adm-btn--primary"
                                    disabled={isSubmitting}
                                >
                                    <CheckCircle2 size={13} />
                                    {isSubmitting ? 'Saving Vitals...' : todayVital ? "Update Today's Vitals" : 'Record Vitals'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Care Notes Form */}
                    {activeSection === 'notes' && (
                        <form onSubmit={handleRecordNotes}>
                            <div className="adm-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div className="adm-form-group">
                                    <label className="adm-form-label">Mobility</label>
                                    <select
                                        className="adm-form-input"
                                        value={mobility}
                                        onChange={(e) => setMobility(e.target.value)}
                                    >
                                        <option value="INDEPENDENT">Independent</option>
                                        <option value="ASSISTED">Assisted</option>
                                        <option value="WHEELCHAIR">Wheelchair</option>
                                        <option value="BEDBOUND">Bedbound</option>
                                    </select>
                                </div>

                                <div className="adm-form-group">
                                    <label className="adm-form-label">Hygiene & Bathing</label>
                                    <select
                                        className="adm-form-input"
                                        value={hygiene}
                                        onChange={(e) => setHygiene(e.target.value)}
                                    >
                                        <option value="INDEPENDENT">Independent</option>
                                        <option value="ASSISTED">Assisted</option>
                                        <option value="SPONGE_BATH">Sponge Bath</option>
                                        <option value="TOTAL_CARE">Total Care</option>
                                    </select>
                                </div>

                                <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="adm-form-label">Feeding & Nutrition</label>
                                    <select
                                        className="adm-form-input"
                                        value={feeding}
                                        onChange={(e) => setFeeding(e.target.value)}
                                    >
                                        <option value="INDEPENDENT">Independent Meal</option>
                                        <option value="ASSISTED">Assisted Feeding</option>
                                        <option value="TUBE_FEEDING">Ryles Tube / Feeding</option>
                                    </select>
                                </div>

                                <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="adm-form-label">Daily Care Notes</label>
                                    <textarea
                                        className="adm-form-input"
                                        rows={3}
                                        placeholder="Record medication compliance, hydration, emotional wellbeing, caregiver activities..."
                                        value={careNotes}
                                        onChange={(e) => setCareNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="adm-modal-footer" style={{ marginTop: 16 }}>
                                <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose}>
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    className="adm-btn adm-btn--primary"
                                    disabled={isSubmitting}
                                >
                                    <CheckCircle2 size={13} />
                                    {isSubmitting ? 'Saving Care Notes...' : 'Save Care Notes'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
