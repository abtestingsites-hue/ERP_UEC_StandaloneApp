// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { Plus, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, Info, Activity } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { Modal } from '../../../components/Modal'
import { useAdmissions } from '../../enquiry/hooks/useEnquiry'
import { useMedicalPatients } from '../../medical/hooks/useMedical'
import { useNursingCaregiverVitalCharts, useSaveNursingCareVital } from '../hooks/useNursingCare'
import { useAuthStore } from '../../../store/authStore'
import { useSearchParams, Link } from 'react-router-dom'
import { format, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns'

// Abnormal threshold logic (mimicking backend)
const isAbnormal = (temp: string, spo2: string, bp: string, pulse: string) => {
    let flag = false;
    if (temp) { const num = parseFloat(temp); if (!isNaN(num) && (num < 95 || num > 99)) flag = true; }
    if (spo2) { const num = parseFloat(spo2); if (!isNaN(num) && (num < 95 || num > 100)) flag = true; }
    if (bp) { const num = parseFloat(bp.split('/')[0]); if (!isNaN(num) && (num < 90 || num > 140)) flag = true; }
    if (pulse) { const num = parseFloat(pulse); if (!isNaN(num) && (num < 60 || num > 100)) flag = true; }
    return flag;
}

export function Vitals() {
    const { data: admissions = [], isLoading: loadingAdms } = useAdmissions()
    const { data: patients = [], isLoading: loadingPatients } = useMedicalPatients()
    const [selectedPatientId, setSelectedPatientId] = useState<string>('')
    const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date())
    
    const selectedMonth = format(selectedMonthDate, 'yyyy-MM')
    const today = new Date()
    
    // Edit Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingDay, setEditingDay] = useState<number>(today.getDate())
    const [editingShift, setEditingShift] = useState<'Mor' | 'Eve'>('Mor')
    const [temp, setTemp] = useState('')
    const [bp, setBp] = useState('')
    const [pulse, setPulse] = useState('')
    const [spO2, setSpO2] = useState('')
    
    const [searchParams] = useSearchParams()
    const urlPatientId = searchParams.get('patientId')
    const assignmentId = searchParams.get('assignmentId')
    const user = useAuthStore((state: any) => state.user)
    const userRoleStr = typeof user?.role === 'object' ? user?.role?.name : user?.role;
    const isRestrictedRole = !['SUPER_ADMIN', 'NURSING_MANAGER', 'NURSING_SUPER_HEAD', 'MEDICAL_MANAGER', 'ELDER_OPERATIONS_MANAGER', 'CARE_ALLOCATION_MANAGER'].includes(String(userRoleStr || '').trim().toUpperCase().replace(/\s+/g, '_'));

    useEffect(() => {
        if (urlPatientId) {
            setSelectedPatientId(urlPatientId)
        }
    }, [urlPatientId])

    const { data: charts = [], isLoading: loadingCharts, isError: errorCharts } = useNursingCaregiverVitalCharts(
        selectedMonth, 
        selectedPatientId, 
        null, 
        { enabled: Boolean(selectedPatientId && selectedMonth) }
    )
    
    // There should only be one chart per patient per month
    const activeChart = charts[0] || null
    const currentEntries = activeChart?.entries || []

    const saveVital = useSaveNursingCareVital()

    const selectedAdmission = useMemo(() => admissions.find(a => a.patientId === selectedPatientId), [admissions, selectedPatientId])
    const selectedPatient = patients.find((patient: any) => patient.id === selectedPatientId)
    const patientOptions = useMemo(() => {
        const options = admissions
            .filter(a => a.patientId)
            .map(a => ({ id: a.patientId, name: a.patientName }))
        if (urlPatientId && !options.some(option => option.id === urlPatientId)) {
            options.unshift({
                id: urlPatientId,
                name: selectedPatient?.name || selectedAdmission?.patientName || activeChart?.patientName || 'Selected patient'
            })
        }
        return options
    }, [admissions, selectedAdmission, selectedPatient, activeChart, urlPatientId])

    const handleOpenEdit = (day: number, shift: 'Mor' | 'Eve') => {
        const existingEntry = currentEntries.find((e: any) => e.day === day)
        setEditingDay(day)
        setEditingShift(shift)
        
        if (existingEntry) {
            setTemp(existingEntry[`temp${shift}`] || '')
            setBp(existingEntry[`bp${shift}`] || '')
            setPulse(existingEntry[`pulse${shift}`] || '')
            setSpO2(existingEntry[`spo2${shift}`] || '')
        } else {
            setTemp('')
            setBp('')
            setPulse('')
            setSpO2('')
        }
        setIsAddModalOpen(true)
    }

    const handleSave = () => {
        if (!selectedPatientId || !selectedMonth) return

        saveVital.mutate({
            patientId: selectedPatientId,
            assignmentId: assignmentId || undefined,
            shift: editingShift === 'Mor' ? 'MORNING' : 'EVENING',
            recordedAt: new Date().toISOString(),
            temp: temp || undefined,
            spO2: spO2 || undefined,
            bp: bp || undefined,
            pulse: pulse || undefined
        }, {
            onSuccess: () => {
                setIsAddModalOpen(false)
            }
        })
    }

    // Generate accurate days for the selected month
    const daysInMonth = useMemo(() => {
        return endOfMonth(selectedMonthDate).getDate();
    }, [selectedMonthDate])
    
    const flowsheetDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Today's values
    const todaysEntry = currentEntries.find((e: any) => e.day === today.getDate() && isSameMonth(selectedMonthDate, today))

    // Helper to render a cell
    const renderCell = (day: number, shift: 'Mor' | 'Eve') => {
        const entry = currentEntries.find((e: any) => e.day === day)
        const hasData = entry && (entry[`temp${shift}`] || entry[`bp${shift}`] || entry[`pulse${shift}`] || entry[`spo2${shift}`])
        const abnormal = hasData ? isAbnormal(entry[`temp${shift}`], entry[`spo2${shift}`], entry[`bp${shift}`], entry[`pulse${shift}`]) : false;

        return (
            <div 
                className={`group relative flex h-full min-h-[5.5rem] ${!hasData ? 'cursor-pointer' : ''} flex-col justify-center rounded-lg border transition-colors p-3 ${
                    hasData 
                        ? (abnormal ? 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20' : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5')
                        : 'border-dashed border-slate-200 hover:border-primary-300 hover:bg-primary-50 dark:border-white/10 dark:hover:bg-primary-900/20'
                }`}
                onClick={() => { if (!hasData) handleOpenEdit(day, shift) }}
            >
                {hasData ? (
                    <div className="flex flex-col gap-1.5 text-xs">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                            {entry[`temp${shift}`] && <div><span className="text-slate-500 block mb-0.5">Temp</span> <span className="font-bold text-sm">{entry[`temp${shift}`]}°F</span></div>}
                            {entry[`spo2${shift}`] && <div><span className="text-slate-500 block mb-0.5">SpO2</span> <span className="font-bold text-sm">{entry[`spo2${shift}`]}%</span></div>}
                            {entry[`bp${shift}`] && <div><span className="text-slate-500 block mb-0.5">BP</span> <span className="font-bold text-sm">{entry[`bp${shift}`]}</span></div>}
                            {entry[`pulse${shift}`] && <div><span className="text-slate-500 block mb-0.5">Pulse</span> <span className="font-bold text-sm">{entry[`pulse${shift}`]} bpm</span></div>}
                        </div>
                        {(entry[`recordedBy${shift}`] || entry[`department${shift}`]) && (
                            <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-200 dark:border-white/10 pt-1.5 flex flex-col gap-0.5">
                                {entry[`recordedBy${shift}`] && <span><span className="font-semibold">By:</span> {entry[`recordedBy${shift}`]}</span>}
                                {entry[`department${shift}`] && <span><span className="font-semibold">Dept:</span> {entry[`department${shift}`]}</span>}
                            </div>
                        )}
                        {abnormal && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Requires attention
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-primary-600 opacity-60 transition-opacity group-hover:opacity-100 dark:text-primary-400">
                        <Plus className="mb-1 h-5 w-5" />
                        <span className="text-sm font-semibold">Add Vitals</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Vitals Monitoring"
                subtitle="Track and monitor patient vital signs via Caregiver Monthly Chart"
                breadcrumbs={[{ label: 'Nursing Care' }, { label: 'Vitals' }]}
            />

            {isRestrictedRole && !urlPatientId && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <AlertTriangle className="mb-2 h-5 w-5 text-amber-600" />
                    <strong>Missing Assignment Context:</strong> You must select a patient from <Link to="/medical/my-shift" className="underline font-bold">My Shift</Link> to record Vitals.
                </div>
            )}

            {/* PATIENT SELECTION */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
                <div className="max-w-md mb-5">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Select Patient
                    </label>
                    <div className="relative mt-1">
                        <select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            disabled={isRestrictedRole || loadingAdms || loadingPatients}
                            className="w-full appearance-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-900 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 disabled:opacity-50"
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

                {/* PATIENT INFORMATION HEADER */}
                {selectedPatientId && (selectedAdmission || selectedPatient) ? (
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Patient Information</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-slate-500 mb-1">Patient Name</div>
                                <div className="font-bold text-slate-900 dark:text-white">{selectedAdmission?.patientName || selectedPatient?.name}</div>
                            </div>
                            <div>
                                <div className="text-slate-500 mb-1">Patient ID</div>
                                <div className="font-semibold text-slate-900 dark:text-white">PT-{selectedPatientId.substring(0, 4).toUpperCase()}</div>
                            </div>
                            <div>
                                <div className="text-slate-500 mb-1">Facility / Unit</div>
                                <div className="font-semibold text-slate-900 dark:text-white">Universal Health Care</div>
                            </div>
                            <div>
                                <div className="text-slate-500 mb-1">Status</div>
                                <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                        <Activity className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-sm font-medium">Select a patient to view their vital chart.</p>
                    </div>
                )}
            </div>

            {selectedPatientId && (
                <div className="space-y-6">
                    {/* MONTH NAVIGATION */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedMonthDate(subMonths(selectedMonthDate, 1))} disabled={isRestrictedRole} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeft className="h-4 w-4" /> Previous Month
                            </button>
                            <div className="flex w-44 items-center justify-center font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
                                {format(selectedMonthDate, 'MMMM yyyy')}
                            </div>
                            <button onClick={() => setSelectedMonthDate(addMonths(selectedMonthDate, 1))} disabled={isRestrictedRole} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
                                Next Month <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <button onClick={() => setSelectedMonthDate(new Date())} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20">
                            Today
                        </button>
                    </div>

                    {/* TODAY'S VITALS SUMMARY */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Today's Vitals ({format(today, 'dd MMM yyyy')})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['Mor', 'Eve'].map((shift) => {
                                const hasToday = todaysEntry && (todaysEntry[`temp${shift}`] || todaysEntry[`bp${shift}`] || todaysEntry[`pulse${shift}`] || todaysEntry[`spo2${shift}`]);
                                const sName = shift === 'Mor' ? 'Morning' : 'Evening';
                                
                                return (
                                    <div key={shift} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                                        <div className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">{sName}</div>
                                        {hasToday ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div>
                                                    <div className="text-xs text-slate-500">Temperature</div>
                                                    <div className="font-bold">{todaysEntry[`temp${shift}`] || '-'}°F</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">SpO2</div>
                                                    <div className="font-bold">{todaysEntry[`spo2${shift}`] || '-'}%</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">Blood Pressure</div>
                                                    <div className="font-bold">{todaysEntry[`bp${shift}`] || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">Pulse</div>
                                                    <div className="font-bold">{todaysEntry[`pulse${shift}`] || '-'} bpm</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm font-medium text-slate-400">Not Recorded</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* FLOWSHEET */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-white/10 dark:bg-black">
                        <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                            <div className="flex items-center gap-6">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                                    Caregiver Vital Flowsheet
                                </h3>
                                {/* LEGEND */}
                                <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Recorded</span>
                                    <span className="flex items-center gap-1"><Plus className="h-3.5 w-3.5 text-primary-500" /> Not Recorded</span>
                                    <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Abnormal</span>
                                </div>
                            </div>
                            
                            {loadingCharts && <span className="text-xs font-bold text-primary-600 animate-pulse">Loading vitals...</span>}
                        </div>
                        
                        {errorCharts ? (
                            <div className="p-8 text-center text-rose-600">
                                <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
                                <p className="font-bold">Unable to load vital records.</p>
                                <p className="text-sm opacity-80 mt-1">Please try again.</p>
                            </div>
                        ) : !loadingCharts && currentEntries.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Info className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                <p className="font-medium text-slate-700 dark:text-slate-300">No vitals recorded for this month.</p>
                                <p className="text-sm opacity-80 mt-1">Use the table below to start recording.</p>
                            </div>
                        ) : null}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 border-collapse">
                                <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    <tr>
                                        <th className="sticky left-0 z-20 w-16 border-b border-r border-slate-200 p-3 text-center bg-slate-100 dark:border-white/10 dark:bg-slate-800">Day</th>
                                        <th className="w-24 border-b border-r border-slate-200 p-3 text-center dark:border-white/10">Date</th>
                                        <th className="min-w-[250px] w-1/2 border-b border-r border-slate-200 p-3 text-center dark:border-white/10">Morning (AM)</th>
                                        <th className="min-w-[250px] w-1/2 border-b border-slate-200 p-3 text-center dark:border-white/10">Evening (PM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flowsheetDays.map(day => (
                                        <tr key={day} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5">
                                            <td className="sticky left-0 z-10 border-r border-slate-200 p-3 text-center font-bold text-slate-900 bg-white group-hover:bg-slate-50 dark:border-white/10 dark:text-slate-100 dark:bg-black dark:group-hover:bg-white/5">
                                                {String(day).padStart(2, '0')}
                                            </td>
                                            <td className="border-r border-slate-100 p-3 text-center font-medium whitespace-nowrap dark:border-white/5">
                                                {format(new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), day), 'MMM dd')}
                                            </td>
                                            <td className="border-r border-slate-100 p-1.5 align-top dark:border-white/5">
                                                {renderCell(day, 'Mor')}
                                            </td>
                                            <td className="p-1.5 align-top">
                                                {renderCell(day, 'Eve')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MANUAL ENTRY MODAL */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Record ${editingShift === 'Mor' ? 'Morning' : 'Evening'} Vitals`}
                confirmLabel="Save Vitals"
                onConfirm={handleSave}
                isConfirmDisabled={saveVital.isPending}
            >
                <div className="mt-2 mb-4 text-sm font-medium text-slate-500">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAdmission?.patientName || selectedPatient?.name}</span>
                    <span className="mx-2">•</span>
                    {editingDay} {format(selectedMonthDate, 'MMMM yyyy')} • {editingShift === 'Mor' ? 'Morning' : 'Evening'}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        Temperature (°F)
                        <div className="mt-1 flex items-center">
                            <input value={temp} onChange={e => setTemp(e.target.value)} type="number" step="0.1" className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:bg-black dark:border-white/10" placeholder="98.6" />
                        </div>
                    </label>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        SpO2 (%)
                        <div className="mt-1 flex items-center">
                            <input value={spO2} onChange={e => setSpO2(e.target.value)} type="number" className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:bg-black dark:border-white/10" placeholder="98" />
                        </div>
                    </label>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        Blood Pressure (mmHg)
                        <div className="mt-1 flex items-center">
                            <input value={bp} onChange={e => setBp(e.target.value)} className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:bg-black dark:border-white/10" placeholder="120/80" />
                        </div>
                    </label>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        Pulse (bpm)
                        <div className="mt-1 flex items-center">
                            <input value={pulse} onChange={e => setPulse(e.target.value)} type="number" className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:bg-black dark:border-white/10" placeholder="72" />
                        </div>
                    </label>
                </div>
            </Modal>
        </div>
    )
}
