import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Plus,
    X
} from 'lucide-react';
import { careService } from '../care.service';
import type { ADLRecord, NutritionRecord, CarePatient } from '../care.types';

interface AdlNutritionTabProps {
    activeUnitId?: string | null;
    isManager?: boolean;
}

export function AdlNutritionTab({ activeUnitId, isManager = false }: AdlNutritionTabProps) {
    const [patients, setPatients] = useState<CarePatient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [adlList, setAdlList] = useState<ADLRecord[]>([]);
    const [nutritionList, setNutritionList] = useState<NutritionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ADL Record Modal
    const [isAdlOpen, setIsAdlOpen] = useState(false);
    const [adlPatientId, setAdlPatientId] = useState('');
    const [adlType, setAdlType] = useState('BATHING');
    const [adlStatus, setAdlStatus] = useState('COMPLETED');
    const [adlNotes, setAdlNotes] = useState('');

    // Nutrition Record Modal
    const [isNutOpen, setIsNutOpen] = useState(false);
    const [nutPatientId, setNutPatientId] = useState('');
    const [mealType, setMealType] = useState('LUNCH');
    const [consumedPct, setConsumedPct] = useState('100');
    const [fluidsMl, setFluidsMl] = useState('250');
    const [nutNotes, setNutNotes] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Staff only sees their specifically assigned residents; Managers see all
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
                setAdlPatientId(pts[0].id);
                setNutPatientId(pts[0].id);
            } else {
                setSelectedPatientId('');
                setAdlPatientId('');
                setNutPatientId('');
            }
        });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, isManager]);

    const loadRecords = useCallback(async (patientId?: string) => {
        setIsLoading(true);
        try {
            const [adls, nuts] = await Promise.all([
                careService.getAdlRecords(patientId, activeUnitId),
                careService.getNutritionRecords(patientId || null, null, activeUnitId)
            ]);
            setAdlList(adls);
            setNutritionList(nuts);
        } catch {
            setAdlList([]);
            setNutritionList([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await loadRecords(selectedPatientId || undefined);
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [selectedPatientId, loadRecords]);

    const handleSaveAdl = async (e: React.FormEvent) => {
        e.preventDefault();
        const pId = adlPatientId || selectedPatientId;
        if (!pId) {
            setFeedback({ type: 'error', message: 'Please select a resident for the ADL record.' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        try {
            await careService.createAdlRecord({
                patientId: pId,
                activityType: adlType,
                status: adlStatus,
                notes: adlNotes.trim() || undefined,
                careDate: new Date().toISOString().split('T')[0],
                unitId: activeUnitId
            });
            setIsAdlOpen(false);
            setAdlNotes('');
            setFeedback({ type: 'success', message: 'ADL activity logged successfully.' });
            await loadRecords(selectedPatientId || undefined);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to record ADL.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveNut = async (e: React.FormEvent) => {
        e.preventDefault();
        const pId = nutPatientId || selectedPatientId;
        if (!pId) {
            setFeedback({ type: 'error', message: 'Please select a resident for the meal record.' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        try {
            await careService.createNutritionRecord({
                patientId: pId,
                careDate: new Date().toISOString().split('T')[0],
                mealType,
                consumedPercentage: Number(consumedPct) || 100,
                fluidsMl: Number(fluidsMl) || 0,
                notes: nutNotes.trim() || undefined,
                unitId: activeUnitId
            });
            setIsNutOpen(false);
            setNutNotes('');
            setFeedback({ type: 'success', message: 'Meal / nutrition record logged successfully.' });
            await loadRecords(selectedPatientId || undefined);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to record nutrition.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const activePatient = patients.find((p) => p.id === selectedPatientId);

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

            {/* Patient Selector Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#fef3c7', padding: 8, borderRadius: 8, color: '#d97706' }}>
                        <Activity size={20} />
                    </div>
                    <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                            {isManager ? 'Select Resident for ADL & Nutrition:' : 'Assigned Resident (Exclusive Shift Scope):'}
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
                                        setAdlPatientId(e.target.value);
                                        setNutPatientId(e.target.value);
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
                                {!isManager && activePatient && (
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
                        <span style={{ color: '#64748b', fontSize: 11 }}>ADL Logs:</span>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{adlList.length} Entries</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#64748b', fontSize: 11 }}>Meal Records:</span>
                        <div style={{ fontWeight: 700, color: '#059669' }}>{nutritionList.length} Logged</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            className="adm-btn adm-btn--secondary"
                            onClick={() => {
                                setFeedback(null);
                                setAdlPatientId(selectedPatientId || (patients[0]?.id ?? ''));
                                setIsAdlOpen(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13 }}
                        >
                            <Plus size={14} /> Record ADL
                        </button>
                        <button
                            type="button"
                            className="adm-btn adm-btn--primary"
                            onClick={() => {
                                setFeedback(null);
                                setNutPatientId(selectedPatientId || (patients[0]?.id ?? ''));
                                setIsNutOpen(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13 }}
                        >
                            <Plus size={14} /> Record Meal
                        </button>
                    </div>
                </div>
            </div>

            {/* Split: ADL Activities & Nutrition / Meals */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* ADL Section */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                            Activities of Daily Living (ADL) Log
                        </h4>
                        <span className="adm-badge adm-badge--primary">{adlList.length} Records</span>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading ADL records...</div>
                    ) : adlList.length === 0 ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                            No ADL records found for {activePatient ? activePatient.name : 'selected resident'}.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                            {adlList.map((a) => {
                                const rawType = a.activityType || a.activityCategory || '';
                                const subDetails = [
                                    a.hygiene ? `Hygiene: ${a.hygiene}` : '',
                                    a.mobility ? `Mobility: ${a.mobility}` : '',
                                    a.feeding ? `Feeding: ${a.feeding}` : ''
                                ].filter(Boolean).join(' · ');
                                const activityTitle = (rawType || subDetails || 'Daily Care Activity').replace(/_/g, ' ');
                                const adlDate = a.careDate || (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Today');

                                return (
                                    <div
                                        key={a.id}
                                        style={{
                                            padding: 12,
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 8,
                                            background: '#f8fafc',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                                                {activityTitle}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                {a.notes ? a.notes : 'Standard care assistance provided'} · {adlDate}
                                            </div>
                                        </div>
                                        <span className={`adm-badge ${
                                            a.status === 'COMPLETED' || a.status === 'VERIFIED'
                                                ? 'adm-badge--success'
                                                : a.status === 'ASSISTANCE_REQUIRED' || a.status === 'ASSIGNED'
                                                ? 'adm-badge--primary'
                                                : 'adm-badge--neutral'
                                        }`}>
                                            {a.status || 'LOGGED'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Nutrition Section */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                            Daily Nutrition & Hydration Intake
                        </h4>
                        <span className="adm-badge adm-badge--success">{nutritionList.length} Meals</span>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading meal records...</div>
                    ) : nutritionList.length === 0 ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                            No meal records logged for {activePatient ? activePatient.name : 'selected resident'}.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                            {nutritionList.map((n) => {
                                const mealLabel = (n.meal || n.mealType || 'Meal Intake').replace(/_/g, ' ');
                                const remarks = n.remarks || n.notes || (n.fluidsMl ? `Fluids: ${n.fluidsMl} mL` : 'Meal consumed');
                                const mealDate = n.careDate ? new Date(n.careDate).toLocaleDateString() : (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Today');
                                const statusLabel = n.status || (n.consumedPercentage !== undefined ? `${n.consumedPercentage}% Consumed` : 'COMPLETED');

                                return (
                                    <div
                                        key={n.id}
                                        style={{
                                            padding: 12,
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 8,
                                            background: '#f8fafc',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                                                {mealLabel} · {statusLabel}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                {remarks}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="adm-badge adm-badge--success" style={{ fontSize: 11 }}>
                                                {statusLabel}
                                            </span>
                                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{mealDate}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Record ADL Modal */}
            {isAdlOpen && (
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
                    <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                Record ADL & Hygiene Care
                            </h3>
                            <button type="button" onClick={() => setIsAdlOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAdl} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Resident:</label>
                                <select
                                    className="adm-select"
                                    value={adlPatientId}
                                    onChange={(e) => setAdlPatientId(e.target.value)}
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Activity Type</label>
                                    <select className="adm-select" value={adlType} onChange={(e) => setAdlType(e.target.value)} style={{ width: '100%' }}>
                                        <option value="BATHING">Bathing & Shower</option>
                                        <option value="DRESSING">Dressing & Grooming</option>
                                        <option value="ORAL_CARE">Oral Care</option>
                                        <option value="TOILETING">Toileting Assistance</option>
                                        <option value="MOBILITY">Mobility & Transfer</option>
                                        <option value="FEEDING">Feeding Assistance</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Completion Status</label>
                                    <select className="adm-select" value={adlStatus} onChange={(e) => setAdlStatus(e.target.value)} style={{ width: '100%' }}>
                                        <option value="COMPLETED">Completed Independently</option>
                                        <option value="ASSISTED">Assisted by Staff</option>
                                        <option value="REFUSED">Resident Refused</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Observations / Notes</label>
                                <textarea
                                    className="adm-textarea"
                                    rows={3}
                                    placeholder="e.g. Resident assisted with warm sponge bath, skin intact"
                                    value={adlNotes}
                                    onChange={(e) => setAdlNotes(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                                <button type="button" className="adm-btn adm-btn--secondary" onClick={() => setIsAdlOpen(false)} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save ADL Record'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Nutrition Modal */}
            {isNutOpen && (
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
                    <div style={{ background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                Record Resident Meal & Nutrition
                            </h3>
                            <button type="button" onClick={() => setIsNutOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveNut} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Resident:</label>
                                <select
                                    className="adm-select"
                                    value={nutPatientId}
                                    onChange={(e) => setNutPatientId(e.target.value)}
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Meal Type</label>
                                    <select className="adm-select" value={mealType} onChange={(e) => setMealType(e.target.value)} style={{ width: '100%' }}>
                                        <option value="BREAKFAST">Breakfast</option>
                                        <option value="LUNCH">Lunch</option>
                                        <option value="SNACK">Evening Snack</option>
                                        <option value="DINNER">Dinner</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Consumed Intake (%)</label>
                                    <select className="adm-select" value={consumedPct} onChange={(e) => setConsumedPct(e.target.value)} style={{ width: '100%' }}>
                                        <option value="100">100% (Finished Meal)</option>
                                        <option value="75">75% (Good Intake)</option>
                                        <option value="50">50% (Partial Intake)</option>
                                        <option value="25">25% (Poor Intake)</option>
                                        <option value="0">0% (Refused / Nil)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Fluids Consumed (mL)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="50"
                                    className="adm-input"
                                    value={fluidsMl}
                                    onChange={(e) => setFluidsMl(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Dietary Remarks</label>
                                <input
                                    type="text"
                                    className="adm-input"
                                    placeholder="e.g. Soft diet, finished vegetable soup"
                                    value={nutNotes}
                                    onChange={(e) => setNutNotes(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                                <button type="button" className="adm-btn adm-btn--secondary" onClick={() => setIsNutOpen(false)} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Meal Record'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
