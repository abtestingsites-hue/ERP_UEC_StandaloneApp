import { useState, useEffect, useRef } from 'react';
import {
    X,
    HeartPulse,
    Pill,
    Activity,
    Apple,
    Play,
    CheckCircle2,
    Save,
    AlertCircle,
    User,
    Check,
    Camera,
    Upload,
    Trash2
} from 'lucide-react';
import { careService } from '../care.service';

const resolveErrorMessage = (err: unknown, fallback: string): string => {
    const raw =
        (err as { response?: { data?: { message?: unknown; error?: unknown } } })?.response?.data?.message ||
        (err as { response?: { data?: { message?: unknown; error?: unknown } } })?.response?.data?.error ||
        (err as Error)?.message ||
        fallback;

    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((e: { path?: string[]; message?: string }) => `${e.path?.join('.') || 'field'}: ${e.message || 'invalid'}`)
                    .join(', ');
            }
        } catch {
            return raw;
        }
        return raw;
    }
    if (Array.isArray(raw)) {
        return raw
            .map((e: { path?: string[]; message?: string }) => `${e.path?.join('.') || 'field'}: ${e.message || 'invalid'}`)
            .join(', ');
    }
    if (typeof raw === 'object' && raw !== null) {
        return JSON.stringify(raw);
    }
    return String(raw || fallback);
};
import type {
    MedicalAssignment,
    ChecklistCategory,
    ChecklistState,
    MedicationSchedule
} from '../care.types';

interface ClinicalDutyModalProps {
    isOpen: boolean;
    assignment: MedicalAssignment | null;
    onClose: () => void;
    onSuccess: () => void;
    activeUnitId?: string | null;
}

export function ClinicalDutyModal({
    isOpen,
    assignment,
    onClose,
    onSuccess,
    activeUnitId
}: ClinicalDutyModalProps) {
    const [activeSection, setActiveSection] = useState<'vitals' | 'medication' | 'adl' | 'nutrition'>('vitals');
    const [checklist, setChecklist] = useState<Record<ChecklistCategory, ChecklistState>>({
        vitals: 'NOT_REVIEWED',
        medication: 'NOT_REVIEWED',
        adl: 'NOT_REVIEWED',
        nutrition: 'NOT_REVIEWED'
    });

    // Vitals Form State
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    const [pulse, setPulse] = useState('');
    const [temperature, setTemperature] = useState('');
    const [spo2, setSpo2] = useState('');
    const [bloodSugar, setBloodSugar] = useState('');
    const [isFasting, setIsFasting] = useState(false);
    const [vitalNotes, setVitalNotes] = useState('');
    const [vitalSuccess, setVitalSuccess] = useState(false);

    // Vitals photo & live camera state
    const [vitalPhoto, setVitalPhoto] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);

    const startCamera = async () => {
        setCameraError(null);
        setIsCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            cameraStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: unknown) {
            console.error('Failed to open camera:', err);
            setCameraError('Could not access camera. Please check browser permissions or use the upload option.');
            stopCamera();
        }
    };

    const stopCamera = () => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setVitalPhoto(canvas.toDataURL('image/jpeg', 0.82));
        }
        stopCamera();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1000;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    setVitalPhoto(canvas.toDataURL('image/jpeg', 0.82));
                } else {
                    setVitalPhoto(event.target?.result as string);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        return () => {
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Medication State
    const [medSchedules, setMedSchedules] = useState<MedicationSchedule[]>([]);
    const [selectedMedId, setSelectedMedId] = useState('');
    const [medSlot, setMedSlot] = useState('MORNING');
    const [medRemarks, setMedRemarks] = useState('');
    const [medSuccess, setMedSuccess] = useState(false);

    // ADL State
    const [adlType, setAdlType] = useState('BATHING');
    const [adlStatus, setAdlStatus] = useState('COMPLETED');
    const [adlNotes, setAdlNotes] = useState('');
    const [adlSuccess, setAdlSuccess] = useState(false);

    // Nutrition State
    const [mealType, setMealType] = useState('LUNCH');
    const [consumedPct, setConsumedPct] = useState('100');
    const [fluidsMl, setFluidsMl] = useState('250');
    const [nutritionNotes, setNutritionNotes] = useState('');
    const [nutritionSuccess, setNutritionSuccess] = useState(false);
    const [prevAssignmentId, setPrevAssignmentId] = useState<string | undefined>(assignment?.id);
    const [statusOverride, setStatusOverride] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    if (assignment && assignment.id !== prevAssignmentId) {
        setPrevAssignmentId(assignment.id);
        setStatusOverride(null);
        setChecklist({
            vitals: assignment.metadata?.dailyCareChecklist?.vitals || 'NOT_REVIEWED',
            medication: assignment.metadata?.dailyCareChecklist?.medication || 'NOT_REVIEWED',
            adl: assignment.metadata?.dailyCareChecklist?.adl || 'NOT_REVIEWED',
            nutrition: assignment.metadata?.dailyCareChecklist?.nutrition || 'NOT_REVIEWED'
        });
    }

    const currentStatus = statusOverride ?? assignment?.status ?? 'ASSIGNED';

    useEffect(() => {
        if (!isOpen || !assignment || !assignment.patientId) return;
        let isMounted = true;

        // Fetch medication schedules if patient is attached
        careService.getMedicationSchedules(assignment.patientId, activeUnitId).then((res) => {
            if (!isMounted) return;
            setMedSchedules(res);
            if (res.length > 0) setSelectedMedId(res[0].id);
        });

        return () => {
            isMounted = false;
        };
    }, [isOpen, assignment, activeUnitId]);

    if (!isOpen || !assignment) return null;

    const handleChecklistChange = (cat: ChecklistCategory, state: ChecklistState) => {
        setChecklist((prev) => ({ ...prev, [cat]: state }));
    };

    const handleSaveDraftChecklist = async () => {
        setIsSubmitting(true);
        setFeedback(null);
        try {
            await careService.updateAssignmentMetadata(
                assignment.id,
                {
                    ...assignment.metadata,
                    dailyCareChecklist: checklist
                },
                activeUnitId
            );
            setFeedback({ type: 'success', message: 'Checklist draft saved successfully.' });
        } catch (err: unknown) {
            setFeedback({ type: 'error', message: resolveErrorMessage(err, 'Failed to save checklist.') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartDuty = async () => {
        setIsSubmitting(true);
        setFeedback(null);
        try {
            await careService.updateAssignmentStatus(assignment.id, 'IN_PROGRESS', undefined, activeUnitId);
            setStatusOverride('IN_PROGRESS');
            setFeedback({ type: 'success', message: 'Duty marked as IN_PROGRESS.' });
            onSuccess();
        } catch (err: unknown) {
            setFeedback({ type: 'error', message: resolveErrorMessage(err, 'Failed to start duty.') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordVital = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment.patientId) {
            setFeedback({ type: 'error', message: 'No patient associated with this duty.' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        setVitalSuccess(false);
        try {
            await careService.saveVital({
                patientId: assignment.patientId,
                systolic: systolic ? Number(systolic) : undefined,
                diastolic: diastolic ? Number(diastolic) : undefined,
                pulse: pulse ? Number(pulse) : undefined,
                temperature: temperature ? Number(temperature) : undefined,
                spo2: spo2 ? Number(spo2) : undefined,
                bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
                isFasting,
                notes: vitalNotes || undefined,
                photoUrl: vitalPhoto || undefined,
                unitId: activeUnitId || undefined,
                assignmentId: assignment.id
            });
            setVitalSuccess(true);
            setVitalPhoto(null);
            setChecklist((prev) => ({ ...prev, vitals: 'COMPLETED' }));
            setFeedback({ type: 'success', message: 'Vital sign recorded & Vitals checklist updated.' });
        } catch (err: unknown) {
            setFeedback({ type: 'error', message: resolveErrorMessage(err, 'Failed to record vitals.') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdministerMed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMedId) {
            setFeedback({ type: 'error', message: 'Please select a medication to administer.' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        setMedSuccess(false);
        try {
            await careService.administerMedicationDose({
                id: selectedMedId,
                slot: medSlot,
                remarks: medRemarks || undefined,
                assignmentId: assignment.id,
                unitId: activeUnitId
            });
            setMedSuccess(true);
            setChecklist((prev) => ({ ...prev, medication: 'COMPLETED' }));
            setFeedback({ type: 'success', message: 'Medication dose administered & checklist updated.' });
        } catch (err: unknown) {
            setFeedback({ type: 'error', message: resolveErrorMessage(err, 'Failed to administer medication.') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordAdl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment.patientId) {
            setFeedback({ type: 'error', message: 'No patient associated with this duty.' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        setAdlSuccess(false);
        try {
            await careService.createAdlRecord({
                patientId: assignment.patientId,
                activityType: adlType,
                status: adlStatus,
                notes: adlNotes || undefined,
                careDate: new Date().toISOString().split('T')[0],
                assignmentId: assignment.id,
                unitId: activeUnitId
            });
            setAdlSuccess(true);
            setChecklist((prev) => ({ ...prev, adl: 'COMPLETED' }));
            setFeedback({ type: 'success', message: 'ADL record saved & checklist updated.' });
        } catch (err: unknown) {
            setFeedback({ type: 'error', message: resolveErrorMessage(err, 'Failed to save ADL record.') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordNutrition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment.patientId) {
            setFeedback({ type: 'error', message: 'No patient associated with this duty.' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        setNutritionSuccess(false);
        try {
            await careService.createNutritionRecord({
                patientId: assignment.patientId,
                careDate: new Date().toISOString().split('T')[0],
                mealType,
                consumedPercentage: Number(consumedPct),
                fluidsMl: Number(fluidsMl),
                notes: nutritionNotes || undefined,
                unitId: activeUnitId
            });
            setNutritionSuccess(true);
            setChecklist((prev) => ({ ...prev, nutrition: 'COMPLETED' }));
            setFeedback({ type: 'success', message: 'Nutrition record saved & checklist updated.' });
        } catch (err: unknown) {
            setFeedback({ type: 'error', message: resolveErrorMessage(err, 'Failed to save nutrition record.') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteDuty = async () => {
        // Validate checklist
        const unresolved = Object.entries(checklist).filter(([, state]) => state === 'NOT_REVIEWED');
        if (unresolved.length > 0) {
            setFeedback({
                type: 'error',
                message: `Please resolve all checklist items before completing duty. Unresolved: ${unresolved.map(([k]) => k.toUpperCase()).join(', ')}`
            });
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);
        try {
            // Save checklist metadata
            await careService.updateAssignmentMetadata(
                assignment.id,
                {
                    ...assignment.metadata,
                    dailyCareChecklist: checklist
                },
                activeUnitId
            );

            // Transition status to WAITING_APPROVAL
            await careService.updateAssignmentStatus(
                assignment.id,
                'WAITING_APPROVAL',
                'Completed by Nurse staff and submitted for Nursing Manager approval',
                activeUnitId
            );

            setFeedback({ type: 'success', message: 'Duty completed and submitted for manager approval!' });
            onSuccess();
            setTimeout(() => onClose(), 1000);
        } catch (err: unknown) {
            setFeedback({ type: 'error', message: resolveErrorMessage(err, 'Failed to complete duty.') });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--lg" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
                <div className="adm-modal-header">
                    <div className="adm-modal-title-group">
                        <Activity className="adm-modal-icon" />
                        <div>
                            <h2 className="adm-modal-title">Clinical Duty Execution Workspace</h2>
                            <p className="adm-modal-subtitle">
                                Duty: {assignment.dutyType?.replace(/_/g, ' ')} · Staff: {assignment.staff?.firstName} {assignment.staff?.lastName}
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="adm-modal-body" style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
                    {feedback && (
                        <div
                            className={`adm-alert ${feedback.type === 'success' ? 'adm-alert--success' : 'adm-alert--error'}`}
                            style={{ marginBottom: 16 }}
                        >
                            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <span>{feedback.message}</span>
                        </div>
                    )}

                    {/* Patient Context & Status Header */}
                    <div className="adm-profile-strip" style={{ marginBottom: 16 }}>
                        <div className="adm-strip-col">
                            <span className="adm-strip-label">Resident Name</span>
                            <span className="adm-strip-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <User size={14} /> {assignment.patient?.name || 'General Facility'}
                            </span>
                        </div>
                        <div className="adm-strip-col">
                            <span className="adm-strip-label">Location / Bed</span>
                            <span className="adm-strip-value">{assignment.location || 'General Ward'}</span>
                        </div>
                        <div className="adm-strip-col">
                            <span className="adm-strip-label">Duty Status</span>
                            <span className="adm-strip-value">
                                <span className={`adm-badge ${
                                    currentStatus === 'IN_PROGRESS'
                                        ? 'adm-badge--primary'
                                        : currentStatus === 'WAITING_APPROVAL'
                                        ? 'adm-badge--warning'
                                        : currentStatus === 'APPROVED'
                                        ? 'adm-badge--success'
                                        : 'adm-badge--neutral'
                                }`}>
                                    {currentStatus.replace(/_/g, ' ')}
                                </span>
                            </span>
                        </div>
                        <div className="adm-strip-col">
                            <span className="adm-strip-label">Action</span>
                            <div>
                                {['ASSIGNED', 'PENDING'].includes(currentStatus) && (
                                    <button
                                        type="button"
                                        className="adm-btn adm-btn--primary"
                                        style={{ padding: '4px 10px', fontSize: 12 }}
                                        onClick={handleStartDuty}
                                        disabled={isSubmitting}
                                    >
                                        <Play size={12} /> Start Duty
                                    </button>
                                )}
                                {currentStatus === 'IN_PROGRESS' && (
                                    <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Active In-Progress</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Care Action Tabs */}
                    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16 }}>
                        <button
                            type="button"
                            className={`adm-tab-pill ${activeSection === 'vitals' ? 'adm-tab-pill--active' : ''}`}
                            onClick={() => setActiveSection('vitals')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <HeartPulse size={15} color="#e11d48" /> Vitals Recording
                        </button>
                        <button
                            type="button"
                            className={`adm-tab-pill ${activeSection === 'medication' ? 'adm-tab-pill--active' : ''}`}
                            onClick={() => setActiveSection('medication')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <Pill size={15} color="#2563eb" /> Medication Admin
                        </button>
                        <button
                            type="button"
                            className={`adm-tab-pill ${activeSection === 'adl' ? 'adm-tab-pill--active' : ''}`}
                            onClick={() => setActiveSection('adl')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <Activity size={15} color="#059669" /> ADL & Hygiene
                        </button>
                        <button
                            type="button"
                            className={`adm-tab-pill ${activeSection === 'nutrition' ? 'adm-tab-pill--active' : ''}`}
                            onClick={() => setActiveSection('nutrition')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <Apple size={15} color="#ea580c" /> Nutrition & Meals
                        </button>
                    </div>

                    {/* Section 1: Vitals Form */}
                    {activeSection === 'vitals' && (
                        <form onSubmit={handleRecordVital} style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Record Patient Vital Signs</h4>
                                {vitalSuccess && <span style={{ color: '#059669', fontSize: 12, fontWeight: 600 }}>✓ Vitals logged</span>}
                            </div>
                            <div className="adm-form-grid" style={{ gap: 12 }}>
                                <div className="adm-form-group">
                                    <label className="adm-label">Systolic BP (mmHg)</label>
                                    <input type="number" className="adm-input" value={systolic} onChange={(e) => setSystolic(e.target.value)} placeholder="e.g. 120" />
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">Diastolic BP (mmHg)</label>
                                    <input type="number" className="adm-input" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} placeholder="e.g. 80" />
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">Pulse (bpm)</label>
                                    <input type="number" className="adm-input" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="e.g. 72" />
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">Temperature (°F)</label>
                                    <input type="number" step="0.1" className="adm-input" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="e.g. 98.6" />
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">SpO2 (%)</label>
                                    <input type="number" className="adm-input" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="e.g. 98" />
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">Blood Sugar (mg/dL)</label>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <input type="number" className="adm-input" value={bloodSugar} onChange={(e) => setBloodSugar(e.target.value)} placeholder="e.g. 110" />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, whiteSpace: 'nowrap' }}>
                                            <input type="checkbox" checked={isFasting} onChange={(e) => setIsFasting(e.target.checked)} /> Fasting
                                        </label>
                                    </div>
                                </div>
                                <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="adm-label">Clinical Remarks / Symptoms</label>
                                    <input type="text" className="adm-input" value={vitalNotes} onChange={(e) => setVitalNotes(e.target.value)} placeholder="e.g. Alert, oriented, no distress" />
                                </div>

                                <div className="adm-form-group" style={{ gridColumn: '1 / -1', background: '#ffffff', padding: 12, borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Current Live Image / Monitor Photo</span>
                                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>(Optional)</span>
                                        </div>
                                        {vitalPhoto && (
                                            <span style={{ color: '#059669', fontSize: 11, fontWeight: 600 }}>✓ Photo Attached</span>
                                        )}
                                    </div>

                                    {/* Action buttons nearby each other */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            onClick={startCamera}
                                            disabled={isCameraActive}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}
                                        >
                                            <Camera size={15} color="#0284c7" />
                                            Open Camera
                                        </button>

                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}
                                        >
                                            <Upload size={15} color="#059669" />
                                            Upload Photo
                                        </button>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleFileUpload}
                                        />

                                        {vitalPhoto && (
                                            <button
                                                type="button"
                                                onClick={() => setVitalPhoto(null)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    fontSize: 12,
                                                    color: '#dc2626',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px 8px'
                                                }}
                                            >
                                                <Trash2 size={13} /> Remove
                                            </button>
                                        )}
                                    </div>

                                    {/* Camera Live Viewfinder */}
                                    {isCameraActive && (
                                        <div style={{ marginTop: 12, padding: 12, background: '#0f172a', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                            <video
                                                ref={(el) => {
                                                    videoRef.current = el;
                                                    if (el && cameraStreamRef.current && el.srcObject !== cameraStreamRef.current) {
                                                        el.srcObject = cameraStreamRef.current;
                                                    }
                                                }}
                                                autoPlay
                                                playsInline
                                                muted
                                                style={{ width: '100%', maxWidth: 360, borderRadius: 6, maxHeight: 240, objectFit: 'cover' }}
                                            />
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--primary"
                                                    onClick={capturePhoto}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#059669', borderColor: '#059669' }}
                                                >
                                                    <Camera size={14} /> Capture Snapshot
                                                </button>
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--secondary"
                                                    onClick={stopCamera}
                                                    style={{ fontSize: 12 }}
                                                >
                                                    Cancel Camera
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {cameraError && (
                                        <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
                                            {cameraError}
                                        </div>
                                    )}

                                    {/* Captured or Uploaded Photo Preview */}
                                    {vitalPhoto && !isCameraActive && (
                                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                            <img
                                                src={vitalPhoto}
                                                alt="Vital Observation Preview"
                                                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Live Vital Observation Photo Attached</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>Image ready to be submitted with this vital sign record.</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ marginTop: 12, textAlign: 'right' }}>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting} style={{ padding: '6px 14px', fontSize: 13 }}>
                                    Save Vitals Record
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Section 2: Medication Administration */}
                    {activeSection === 'medication' && (
                        <form onSubmit={handleAdministerMed} style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Administer Medication Dose</h4>
                                {medSuccess && <span style={{ color: '#059669', fontSize: 12, fontWeight: 600 }}>✓ Dose recorded</span>}
                            </div>
                            {medSchedules.length === 0 ? (
                                <p style={{ fontSize: 13, color: '#64748b' }}>No active medication schedules configured for this resident.</p>
                            ) : (
                                <div className="adm-form-grid" style={{ gap: 12 }}>
                                    <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="adm-label">Prescribed Medicine *</label>
                                        <select className="adm-select" value={selectedMedId} onChange={(e) => setSelectedMedId(e.target.value)} required>
                                            {medSchedules.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.medicineName} · {m.dosage || 'Standard'} ({m.frequency || 'Daily'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="adm-form-group">
                                        <label className="adm-label">Administration Slot *</label>
                                        <select className="adm-select" value={medSlot} onChange={(e) => setMedSlot(e.target.value)}>
                                            <option value="MORNING">Morning</option>
                                            <option value="AFTERNOON">Afternoon</option>
                                            <option value="EVENING">Evening</option>
                                            <option value="NIGHT">Night</option>
                                            <option value="PRN">PRN (As Needed)</option>
                                        </select>
                                    </div>
                                    <div className="adm-form-group">
                                        <label className="adm-label">Administration Remarks</label>
                                        <input type="text" className="adm-input" value={medRemarks} onChange={(e) => setMedRemarks(e.target.value)} placeholder="e.g. Administered after breakfast, tolerated well" />
                                    </div>
                                </div>
                            )}
                            <div style={{ marginTop: 12, textAlign: 'right' }}>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting || medSchedules.length === 0} style={{ padding: '6px 14px', fontSize: 13 }}>
                                    Record Dose Administration
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Section 3: ADL Form */}
                    {activeSection === 'adl' && (
                        <form onSubmit={handleRecordAdl} style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Activities of Daily Living (ADL)</h4>
                                {adlSuccess && <span style={{ color: '#059669', fontSize: 12, fontWeight: 600 }}>✓ ADL saved</span>}
                            </div>
                            <div className="adm-form-grid" style={{ gap: 12 }}>
                                <div className="adm-form-group">
                                    <label className="adm-label">Activity Category *</label>
                                    <select className="adm-select" value={adlType} onChange={(e) => setAdlType(e.target.value)}>
                                        <option value="BATHING">Bathing & Personal Hygiene</option>
                                        <option value="DRESSING">Dressing & Grooming</option>
                                        <option value="MOBILITY">Mobility & Transfer</option>
                                        <option value="TOILETING">Toileting & Continence</option>
                                        <option value="FEEDING">Feeding Assistance</option>
                                        <option value="ORAL_CARE">Oral & Dental Care</option>
                                    </select>
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">Assistance Level *</label>
                                    <select className="adm-select" value={adlStatus} onChange={(e) => setAdlStatus(e.target.value)}>
                                        <option value="COMPLETED">Completed Fully</option>
                                        <option value="INDEPENDENT">Independent</option>
                                        <option value="ASSISTANCE_REQUIRED">Assistance Required</option>
                                        <option value="DEPENDENT">Fully Dependent</option>
                                    </select>
                                </div>
                                <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="adm-label">Caregiver Observations</label>
                                    <input type="text" className="adm-input" value={adlNotes} onChange={(e) => setAdlNotes(e.target.value)} placeholder="e.g. Assisted with warm sponge bath, skin intact" />
                                </div>
                            </div>
                            <div style={{ marginTop: 12, textAlign: 'right' }}>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting} style={{ padding: '6px 14px', fontSize: 13 }}>
                                    Save ADL Activity
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Section 4: Nutrition Form */}
                    {activeSection === 'nutrition' && (
                        <form onSubmit={handleRecordNutrition} style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Nutrition & Meal Intake</h4>
                                {nutritionSuccess && <span style={{ color: '#059669', fontSize: 12, fontWeight: 600 }}>✓ Nutrition saved</span>}
                            </div>
                            <div className="adm-form-grid" style={{ gap: 12 }}>
                                <div className="adm-form-group">
                                    <label className="adm-label">Meal Type *</label>
                                    <select className="adm-select" value={mealType} onChange={(e) => setMealType(e.target.value)}>
                                        <option value="BREAKFAST">Breakfast</option>
                                        <option value="LUNCH">Lunch</option>
                                        <option value="SNACK">Evening Snack</option>
                                        <option value="DINNER">Dinner</option>
                                    </select>
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">Meal Consumed (%)</label>
                                    <select className="adm-select" value={consumedPct} onChange={(e) => setConsumedPct(e.target.value)}>
                                        <option value="100">100% (Entire Meal)</option>
                                        <option value="75">75% (Most of Meal)</option>
                                        <option value="50">50% (Half Consumed)</option>
                                        <option value="25">25% (Minimal)</option>
                                        <option value="0">0% (Refused / Nil)</option>
                                    </select>
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">Fluid Intake (mL)</label>
                                    <input type="number" className="adm-input" value={fluidsMl} onChange={(e) => setFluidsMl(e.target.value)} placeholder="e.g. 250" />
                                </div>
                                <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="adm-label">Diet Notes & Appetite</label>
                                    <input type="text" className="adm-input" value={nutritionNotes} onChange={(e) => setNutritionNotes(e.target.value)} placeholder="e.g. Soft diet, finished vegetable soup" />
                                </div>
                            </div>
                            <div style={{ marginTop: 12, textAlign: 'right' }}>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting} style={{ padding: '6px 14px', fontSize: 13 }}>
                                    Save Nutrition Record
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Interactive 4-Item Daily Care Checklist */}
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: 16, background: '#ffffff', marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                    Daily Care Duty Checklist
                                </h4>
                                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                                    All items must be resolved (Completed or N/A) before submitting duty to Nursing Manager
                                </p>
                            </div>
                            <button
                                type="button"
                                className="adm-btn adm-btn--secondary"
                                onClick={handleSaveDraftChecklist}
                                disabled={isSubmitting}
                                style={{ padding: '4px 10px', fontSize: 12 }}
                            >
                                <Save size={13} /> Save Draft
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            {(['vitals', 'medication', 'adl', 'nutrition'] as ChecklistCategory[]).map((cat) => {
                                const current = checklist[cat];
                                const labelMap: Record<ChecklistCategory, { label: string; icon: typeof HeartPulse }> = {
                                    vitals: { label: 'Vitals Monitoring', icon: HeartPulse },
                                    medication: { label: 'Medication Administration', icon: Pill },
                                    adl: { label: 'ADL & Hygiene Care', icon: Activity },
                                    nutrition: { label: 'Nutrition & Diet', icon: Apple }
                                };
                                const IconComp = labelMap[cat].icon;

                                return (
                                    <div
                                        key={cat}
                                        style={{
                                            border: `1px solid ${current === 'COMPLETED' ? '#86efac' : current === 'NOT_APPLICABLE' ? '#cbd5e1' : '#fca5a5'}`,
                                            borderRadius: 8,
                                            padding: 10,
                                            background: current === 'COMPLETED' ? '#f0fdf4' : current === 'NOT_APPLICABLE' ? '#f8fafc' : '#fff1f2'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                                                <IconComp size={15} /> {labelMap[cat].label}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: current === 'COMPLETED' ? '#15803d' : current === 'NOT_APPLICABLE' ? '#64748b' : '#b91c1c' }}>
                                                {current.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                type="button"
                                                onClick={() => handleChecklistChange(cat, 'COMPLETED')}
                                                style={{
                                                    flex: 1,
                                                    fontSize: 11,
                                                    padding: '4px 6px',
                                                    borderRadius: 4,
                                                    border: '1px solid #16a34a',
                                                    background: current === 'COMPLETED' ? '#16a34a' : '#ffffff',
                                                    color: current === 'COMPLETED' ? '#ffffff' : '#16a34a',
                                                    cursor: 'pointer',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Completed
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChecklistChange(cat, 'NOT_APPLICABLE')}
                                                style={{
                                                    flex: 1,
                                                    fontSize: 11,
                                                    padding: '4px 6px',
                                                    borderRadius: 4,
                                                    border: '1px solid #94a3b8',
                                                    background: current === 'NOT_APPLICABLE' ? '#64748b' : '#ffffff',
                                                    color: current === 'NOT_APPLICABLE' ? '#ffffff' : '#64748b',
                                                    cursor: 'pointer',
                                                    fontWeight: 600
                                                }}
                                            >
                                                N/A
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChecklistChange(cat, 'NOT_REVIEWED')}
                                                style={{
                                                    fontSize: 11,
                                                    padding: '4px 6px',
                                                    borderRadius: 4,
                                                    border: '1px solid #e2e8f0',
                                                    background: current === 'NOT_REVIEWED' ? '#fee2e2' : '#ffffff',
                                                    color: '#991b1b',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="adm-modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose}>
                        Close
                    </button>
                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={handleCompleteDuty}
                        disabled={isSubmitting}
                        style={{ background: '#0284c7', borderColor: '#0284c7' }}
                    >
                        <Check size={16} /> Complete Duty & Submit for Approval
                    </button>
                </div>
            </div>
        </div>
    );
}
