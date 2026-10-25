import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, Info, Activity, Camera, Upload, Image as ImageIcon, Calendar, Clock, User, X } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Modal } from '../../../components/Modal';
import { usePatients } from '../../patients/hooks/usePatients';
import { useNursingVitals, useNursingCaregiverVitalCharts, useSaveNursingCareVital, useUploadVitalPhoto } from '../hooks/useVitals';
import { MonitoringStatusCard } from '../components/MonitoringStatusCard';
import { useAuthStore } from '../../../store/authStore';
import { useSearchParams } from 'react-router-dom';
import { format, isSameDay, subDays, addDays } from 'date-fns';


const isAbnormal = (temp?: string | number | null, spo2?: string | number | null, bp?: string | null, pulse?: string | number | null) => {
    let flag = false;
    if (temp !== undefined && temp !== null && temp !== '') { const num = parseFloat(String(temp)); if (!isNaN(num) && (num < 95 || num > 99)) flag = true; }
    if (spo2 !== undefined && spo2 !== null && spo2 !== '') { const num = parseFloat(String(spo2)); if (!isNaN(num) && (num < 95 || num > 100)) flag = true; }
    if (bp) { const num = parseFloat(String(bp).split('/')[0]); if (!isNaN(num) && (num < 90 || num > 140)) flag = true; }
    if (pulse !== undefined && pulse !== null && pulse !== '') { const num = parseFloat(String(pulse)); if (!isNaN(num) && (num < 60 || num > 100)) flag = true; }
    return flag;
};

export default function Vitals() {
    const { data: patients = [], isLoading: loadingPatients } = usePatients();
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'24h' | 'monthly'>('24h');
    
    const today = new Date();
    const selectedMonth = format(selectedDate, 'yyyy-MM');

    // Entry Form Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [temp, setTemp] = useState('');
    const [bp, setBp] = useState('');
    const [pulse, setPulse] = useState('');
    const [spO2, setSpO2] = useState('');
    const [notes, setNotes] = useState('');
    const [photoUrl, setPhotoUrl] = useState<string>('');
    
    // Camera State
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Lightbox Modal State
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
    
    const [searchParams] = useSearchParams();
    const urlPatientId = searchParams.get('patientId');
    const assignmentIdFromUrl = searchParams.get('assignmentId');
    const user = useAuthStore((state: any) => state.user);
    const userRoleStr = typeof user?.role === 'object' ? user?.role?.name : user?.role;
    const isRestrictedRole = !['SUPER_ADMIN', 'NURSING_MANAGER', 'NURSING_SUPER_HEAD', 'MEDICAL_MANAGER', 'ELDER_OPERATIONS_MANAGER', 'CARE_ALLOCATION_MANAGER'].includes(String(userRoleStr || '').trim().toUpperCase().replace(/\s+/g, '_'));

    useEffect(() => {
        if (urlPatientId) {
            setSelectedPatientId(urlPatientId);
        }
    }, [urlPatientId]);

    // Fetch granular Vitals for 24-Hour Timeline
    const { data: vitalsList = [], isLoading: loadingVitals, isError: errorVitals } = useNursingVitals(
        selectedPatientId,
        null,
        { enabled: Boolean(selectedPatientId) }
    );

    // Fetch Monthly Flowsheet Virtual Chart (for Manager / legacy review)
    const { data: charts = [], isLoading: loadingCharts } = useNursingCaregiverVitalCharts(
        selectedMonth, 
        selectedPatientId, 
        null, 
        { enabled: Boolean(selectedPatientId && viewMode === 'monthly') }
    );
    
    const activeChart = charts[0] || null;
    const currentEntries = activeChart?.entries || [];

    const saveVital = useSaveNursingCareVital();
    const uploadPhoto = useUploadVitalPhoto();

    const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);
    
    const patientOptions = useMemo(() => {
        const options = patients.map(p => ({ id: p.id, name: p.name }));
        if (urlPatientId && !options.some(option => option.id === urlPatientId)) {
            options.unshift({
                id: urlPatientId,
                name: selectedPatient?.name || activeChart?.patientName || 'Selected patient'
            });
        }
        return options;
    }, [patients, selectedPatient, activeChart, urlPatientId]);

    // Group Vital Signs by hour for 24-Hour Timeline (00:00 to 23:00)
    const hourlyVitalsMap = useMemo(() => {
        const map: Record<number, any[]> = {};
        for (let h = 0; h < 24; h++) map[h] = [];

        vitalsList.forEach((v: any) => {
            const rawTime = v.recordedAt || v.createdAt;
            if (!rawTime) return;
            const recDate = new Date(rawTime);
            if (isSameDay(recDate, selectedDate)) {
                const hour = recDate.getHours();
                if (map[hour]) {
                    map[hour].push({
                        ...v,
                        recordedAt: rawTime
                    });
                }
            }
        });

        // Sort entries in each hour chronologically
        for (let h = 0; h < 24; h++) {
            map[h].sort((a: any, b: any) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
        }

        return map;
    }, [vitalsList, selectedDate]);

    const handleOpenAddModal = () => {
        setTemp('');
        setBp('');
        setPulse('');
        setSpO2('');
        setNotes('');
        setPhotoUrl('');
        setIsAddModalOpen(true);
    };

    // Camera Stream Handlers
    const startCamera = async () => {
        try {
            setIsCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.warn('Live camera stream not available, falling back to file picker:', err);
            setIsCameraActive(false);
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        }
    };

    const stopCamera = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const captureSnapshot = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `patient_vital_${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopCamera();
            await handleFileUpload(file);
        }, 'image/jpeg', 0.85);
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleFileUpload(file);
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            setIsUploadingPhoto(true);
            const url = await uploadPhoto.mutateAsync({ file });
            if (url) {
                setPhotoUrl(url);
            }
        } catch (err: any) {
            console.error('Photo upload error:', err);
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSave = () => {
        if (!selectedPatientId) return;

        saveVital.mutate({
            patientId: selectedPatientId,
            assignmentId: assignmentIdFromUrl || undefined,
            recordedAt: new Date().toISOString(),
            temp: temp || undefined,
            spO2: spO2 || undefined,
            bp: bp || undefined,
            pulse: pulse || undefined,
            notes: notes || undefined,
            photoUrl: photoUrl || undefined
        }, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                stopCamera();
            }
        });
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Vitals Monitoring"
                subtitle="Live 24-hour vital sign recording and observation tracking"
                breadcrumbs={[{ label: 'Nursing Care' }, { label: 'Vitals' }]}
            />

            {/* PATIENT SELECTION / CONTEXT */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#072E33]">
                {!isRestrictedRole && (
                    <div className="max-w-md mb-5">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                            Select Patient
                        </label>
                        <div className="relative mt-1">
                            <select
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                disabled={loadingPatients}
                                className="w-full appearance-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-50 dark:border-gray-700 dark:bg-[#0F969C]/10 dark:text-white"
                            >
                                <option value="">-- Search patient name / patient ID --</option>
                                {patientOptions.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.name} (PT-{patient.id.substring(0, 4).toUpperCase()})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                )}

                {selectedPatientId && selectedPatient ? (
                    <div className="rounded-xl bg-gray-50 p-4 border border-gray-200 flex flex-wrap items-center justify-between gap-4 dark:bg-[#051C1F] dark:border-gray-800">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm flex-1">
                            <div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Patient Name</div>
                                <div className="font-bold text-gray-900 dark:text-white">{selectedPatient.name}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Patient ID</div>
                                <div className="font-semibold text-gray-900 dark:text-white">PT-{selectedPatientId.substring(0, 4).toUpperCase()}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Age / Gender</div>
                                <div className="font-semibold text-gray-900 dark:text-white">{selectedPatient.patientAge || 'N/A'} / {selectedPatient.patientGender || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Status</div>
                                <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    ACTIVE CARE
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleOpenAddModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#0c7c81] transition-colors shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            Record Vitals
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 dark:text-gray-400">
                        <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm font-medium">Select a patient to view their vital chart.</p>
                    </div>
                )}
            </div>

            {selectedPatientId && (
                <div className="space-y-6">
                    <MonitoringStatusCard
                        patientId={selectedPatientId}
                        patientName={selectedPatient?.name || 'Patient'}
                        onRecordVitals={handleOpenAddModal}
                    />

                    {/* TOOLBAR: VIEW TOGGLE & DATE SELECTION */}

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#072E33]">
                        {/* VIEW MODE TOGGLE */}
                        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-[#051C1F]">
                            <button
                                onClick={() => setViewMode('24h')}
                                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                                    viewMode === '24h' 
                                        ? 'bg-white text-[#0F969C] shadow-sm dark:bg-[#0F969C] dark:text-white' 
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                <Clock className="h-3.5 w-3.5" />
                                24-Hour Monitoring
                            </button>
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                                    viewMode === 'monthly' 
                                        ? 'bg-white text-[#0F969C] shadow-sm dark:bg-[#0F969C] dark:text-white' 
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                Monthly Flowsheet
                            </button>
                        </div>

                        {/* DATE CONTROLS */}
                        <div className="flex items-center gap-2">
                            {!isRestrictedRole && viewMode === '24h' && (
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setSelectedDate(subDays(selectedDate, 1))} 
                                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                                        title="Previous Day"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <div className="px-3 text-sm font-bold text-gray-800 dark:text-white min-w-[130px] text-center">
                                        {isSameDay(selectedDate, today) ? `Today (${format(selectedDate, 'dd MMM')})` : format(selectedDate, 'dd MMM yyyy')}
                                    </div>
                                    <button 
                                        onClick={() => setSelectedDate(addDays(selectedDate, 1))} 
                                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                                        title="Next Day"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {viewMode === '24h' && (
                                <button 
                                    onClick={() => setSelectedDate(new Date())} 
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                        isSameDay(selectedDate, today)
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                    }`}
                                >
                                    Today
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 24-HOUR MONITORING TIMELINE VIEW */}
                    {viewMode === '24h' && (
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#072E33] overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#051C1F]">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-base">
                                        <Clock className="h-4 w-4 text-[#0F969C]" />
                                        24-Hour Vital Monitoring Chart
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {format(selectedDate, 'EEEE, MMMM dd, yyyy')} • Recorded timestamps in local time
                                    </p>
                                </div>
                                {loadingVitals && <span className="text-xs font-bold text-[#0F969C] animate-pulse">Loading vitals...</span>}
                            </div>

                            {errorVitals ? (
                                <div className="p-8 text-center text-red-600">
                                    <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
                                    <p className="font-bold">Unable to load vital records.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {Array.from({ length: 24 }, (_, hour) => {
                                        const entries = hourlyVitalsMap[hour] || [];
                                        const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                                        const hourPeriod = hour < 12 ? 'AM' : 'PM';
                                        const displayHourStr = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hourPeriod}`;

                                        return (
                                            <div key={hour} className="flex flex-col sm:flex-row items-start border-b border-gray-100 dark:border-gray-800/60 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors p-4 gap-4">
                                                {/* HOUR SLOT LABEL */}
                                                <div className="w-28 shrink-0 flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white font-mono">
                                                        {hourFormatted}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-gray-400">
                                                        {displayHourStr}
                                                    </span>
                                                </div>

                                                {/* HOUR ENTRIES */}
                                                <div className="flex-1 w-full min-w-0">
                                                    {entries.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {entries.map((entry: any) => {
                                                                const abnormal = isAbnormal(entry.temp, entry.spO2, entry.bp, entry.pulse);
                                                                const recTime = entry.recordedAt ? format(new Date(entry.recordedAt), 'hh:mm a') : 'N/A';
                                                                const staffName = entry.recordedByName || 'Staff';

                                                                return (
                                                                    <div 
                                                                        key={entry.id} 
                                                                        className={`rounded-xl border p-4 transition-all shadow-sm ${
                                                                            abnormal
                                                                                ? 'border-red-300 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/20'
                                                                                : 'border-gray-200 bg-white dark:border-gray-700/60 dark:bg-[#051C1F]'
                                                                        }`}
                                                                    >
                                                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5 mb-3">
                                                                            <div className="flex items-center gap-2 text-xs">
                                                                                <span className="inline-flex items-center gap-1 font-bold text-gray-800 dark:text-gray-200">
                                                                                    <User className="h-3.5 w-3.5 text-[#0F969C]" />
                                                                                    Recorded by {staffName}
                                                                                </span>
                                                                                <span className="text-gray-300 dark:text-gray-700">•</span>
                                                                                <span className="text-gray-500 dark:text-gray-400 font-medium">
                                                                                    {recTime}
                                                                                </span>
                                                                            </div>

                                                                            <div className="flex items-center gap-2">
                                                                                {entry.verified && (
                                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md dark:bg-emerald-950 dark:text-emerald-400">
                                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                                        Verified
                                                                                    </span>
                                                                                )}
                                                                                {abnormal && (
                                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md dark:bg-red-950 dark:text-red-300">
                                                                                        <AlertTriangle className="h-3 w-3" />
                                                                                        Abnormal
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* VITAL VALUES GRID */}
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                                            <div className="bg-gray-50 dark:bg-black/20 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                                                                <span className="text-gray-500 dark:text-gray-400 block text-[11px] mb-0.5">Temperature</span>
                                                                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                                                    {entry.temp ? `${entry.temp}°F` : '-'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="bg-gray-50 dark:bg-black/20 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                                                                <span className="text-gray-500 dark:text-gray-400 block text-[11px] mb-0.5">SpO2</span>
                                                                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                                                    {entry.spO2 ? `${entry.spO2}%` : '-'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="bg-gray-50 dark:bg-black/20 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                                                                <span className="text-gray-500 dark:text-gray-400 block text-[11px] mb-0.5">Blood Pressure</span>
                                                                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                                                    {entry.bp || '-'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="bg-gray-50 dark:bg-black/20 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                                                                <span className="text-gray-500 dark:text-gray-400 block text-[11px] mb-0.5">Pulse</span>
                                                                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                                                    {entry.pulse ? `${entry.pulse} bpm` : '-'}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* NOTES & PHOTO THUMBNAIL */}
                                                                        {(entry.notes || entry.photoUrl) && (
                                                                            <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                                                {entry.notes && (
                                                                                    <p className="text-gray-600 dark:text-gray-300 italic">
                                                                                        "{entry.notes}"
                                                                                    </p>
                                                                                )}
                                                                                {entry.photoUrl && (
                                                                                    <button
                                                                                        onClick={() => setPreviewPhotoUrl(entry.photoUrl)}
                                                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F969C] hover:underline bg-[#0F969C]/10 px-2.5 py-1 rounded-lg transition-colors"
                                                                                    >
                                                                                        <ImageIcon className="h-3.5 w-3.5" />
                                                                                        View Patient Photo
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs font-medium text-gray-400 dark:text-gray-600 py-1 italic">
                                                            No reading recorded
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* LEGACY MONTHLY CAREGIVER FLOWSHEET VIEW */}
                    {viewMode === 'monthly' && (
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-[#072E33]">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#051C1F]">
                                <h3 className="font-bold text-gray-800 dark:text-white">
                                    Caregiver Monthly Vital Flowsheet ({format(selectedDate, 'MMMM yyyy')})
                                </h3>
                                {loadingCharts && <span className="text-xs font-bold text-[#0F969C] animate-pulse">Loading charts...</span>}
                            </div>
                            
                            {!loadingCharts && currentEntries.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Info className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                    <p className="font-medium text-gray-700 dark:text-gray-300">No monthly caregiver flowsheets for this month.</p>
                                </div>
                            ) : (
                                <div className="p-4 text-xs text-gray-600 dark:text-gray-300">
                                    <p>Switch to <strong>24-Hour Monitoring</strong> view to record and inspect granular timestamps.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* RECORD VITALS ENTRY MODAL WITH OPTIONAL CAMERA / PHOTO CAPTURE */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { stopCamera(); setIsAddModalOpen(false); }}
                title="Record Patient Vitals"
                confirmLabel="Save Vitals"
                onConfirm={handleSave}
                confirmDisabled={saveVital.isPending || isUploadingPhoto}
            >
                <div className="mt-1 mb-4 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="font-bold text-gray-800 dark:text-white">{selectedPatient?.name}</span>
                    <span className="mx-2">•</span>
                    <span>{format(new Date(), 'EEEE, MMMM dd, yyyy • hh:mm a')}</span>
                </div>

                <div className="space-y-4">
                    {/* CLINICAL FIELDS */}
                    <div className="grid grid-cols-2 gap-4">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                            Temperature (°F)
                            <input
                                value={temp}
                                onChange={e => setTemp(e.target.value)}
                                type="number"
                                step="0.1"
                                className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm outline-none focus:border-[#0F969C] focus:bg-white dark:border-gray-700 dark:bg-[#051C1F] dark:text-white"
                                placeholder="98.6"
                            />
                        </label>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                            SpO2 (%)
                            <input
                                value={spO2}
                                onChange={e => setSpO2(e.target.value)}
                                type="number"
                                className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm outline-none focus:border-[#0F969C] focus:bg-white dark:border-gray-700 dark:bg-[#051C1F] dark:text-white"
                                placeholder="98"
                            />
                        </label>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                            Blood Pressure (mmHg)
                            <input
                                value={bp}
                                onChange={e => setBp(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm outline-none focus:border-[#0F969C] focus:bg-white dark:border-gray-700 dark:bg-[#051C1F] dark:text-white"
                                placeholder="120/80"
                            />
                        </label>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                            Pulse (bpm)
                            <input
                                value={pulse}
                                onChange={e => setPulse(e.target.value)}
                                type="number"
                                className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm outline-none focus:border-[#0F969C] focus:bg-white dark:border-gray-700 dark:bg-[#051C1F] dark:text-white"
                                placeholder="72"
                            />
                        </label>
                    </div>

                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                        Notes / Clinical Observations (Optional)
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm outline-none focus:border-[#0F969C] focus:bg-white dark:border-gray-700 dark:bg-[#051C1F] dark:text-white"
                            placeholder="Optional notes or remarks..."
                        />
                    </label>

                    {/* OPTIONAL PATIENT PHOTO CAPTURE / UPLOAD */}
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#051C1F]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                <Camera className="h-4 w-4 text-[#0F969C]" />
                                Patient Photo Attachment (Optional)
                            </span>
                            {photoUrl && (
                                <button
                                    type="button"
                                    onClick={() => setPhotoUrl('')}
                                    className="text-xs font-bold text-red-500 hover:underline"
                                >
                                    Remove Photo
                                </button>
                            )}
                        </div>

                        {/* LIVE CAMERA STREAM */}
                        {isCameraActive ? (
                            <div className="relative rounded-lg overflow-hidden bg-black flex flex-col items-center">
                                <video ref={videoRef} autoPlay playsInline className="w-full max-h-48 object-cover" />
                                <div className="p-2 flex gap-2 w-full justify-center bg-black/60">
                                    <button
                                        type="button"
                                        onClick={captureSnapshot}
                                        className="inline-flex items-center gap-1 bg-[#0F969C] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-[#0c7c81]"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                        Take Snapshot
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : photoUrl ? (
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border dark:bg-[#072E33] dark:border-gray-800">
                                <img src={photoUrl} alt="Patient vital photo" className="h-14 w-14 object-cover rounded-lg border" />
                                <div className="text-xs">
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Photo attached successfully</p>
                                    <p className="text-gray-400">Stored in secure storage</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    disabled={isUploadingPhoto}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-[#072E33] dark:text-white dark:hover:bg-white/10"
                                >
                                    <Camera className="h-3.5 w-3.5 text-[#0F969C]" />
                                    Capture via Camera
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingPhoto}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-[#072E33] dark:text-white dark:hover:bg-white/10"
                                >
                                    <Upload className="h-3.5 w-3.5 text-gray-500" />
                                    {isUploadingPhoto ? 'Uploading...' : 'Choose Image File'}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* LIGHTBOX PHOTO PREVIEW MODAL */}
            {previewPhotoUrl && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPreviewPhotoUrl(null)}
                >
                    <div className="relative max-w-xl w-full bg-white rounded-2xl p-4 dark:bg-[#072E33]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-2 border-b mb-3 dark:border-gray-800">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Patient Vital Attachment</h4>
                            <button onClick={() => setPreviewPhotoUrl(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <img src={previewPhotoUrl} alt="Enlarged vital attachment" className="max-h-[70vh] w-full object-contain rounded-xl border" />
                    </div>
                </div>
            )}
        </div>
    );
}
