import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Activity,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Plus,
    RefreshCw,
    Calendar,
    ChevronLeft,
    ChevronRight,
    User,
    IndianRupee,
    X,
    Save,
    Sparkles
} from 'lucide-react';
import {
    dailyOperationsService,
    type DailyOperationTask,
    type DailyOperationStatus,
    type ChargeableExpensePayload
} from '../dailyOperations.service';
import { careService } from '../care.service';
import type { MedicalStaff } from '../care.types';

interface DailyOperationsTabProps {
    activeUnitId?: string | null;
}

const DEPARTMENTS = [
    'All',
    'Patient Care',
    'Nursing',
    'Housekeeping',
    'Kitchen',
    'Inventory',
    'Administration'
] as const;

const CHARGEABLE_CATEGORIES = [
    'Nursing Care',
    'Medical Supply',
    'Therapy',
    'Extra Meal',
    'Personal Hygiene',
    'Doctor Visit',
    'Other'
];

const PHASE_LABELS: Record<string, { label: string; time: string; badgeClass: string }> = {
    MORNING_OPERATIONS: {
        label: 'Morning Operations',
        time: '06:00 AM – 10:00 AM',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    DEPARTMENT_UPDATES: {
        label: 'Day Activities & Updates',
        time: '10:00 AM – 03:00 PM',
        badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    },
    ADMIN_REVIEW: {
        label: 'Evening Operations & Review',
        time: '03:00 PM – 07:00 PM',
        badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    END_OF_DAY_REPORT: {
        label: 'Night Rounds & End-of-Day',
        time: '07:00 PM – 10:00 PM',
        badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    }
};

const DEPARTMENT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
    'Patient Care': { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'Nursing': { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'Housekeeping': { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'Kitchen': { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'Inventory': { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'Administration': { text: 'text-slate-300', bg: 'bg-slate-700/30', border: 'border-slate-600/30' }
};

export function DailyOperationsTab({ activeUnitId }: DailyOperationsTabProps) {
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [selectedDept, setSelectedDept] = useState<string>('All');
    const [tasks, setTasks] = useState<DailyOperationTask[]>([]);
    const [staffList, setStaffList] = useState<MedicalStaff[]>([]);
    const [billingPatients, setBillingPatients] = useState<Array<{ allocationId: string; patientId: string; patientName: string; clientName?: string; serviceLabel: string }>>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSavingTask, setIsSavingTask] = useState<string | null>(null);

    // Modals
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Chargeable Expense Form State
    const [expenseForm, setExpenseForm] = useState<ChargeableExpensePayload>({
        allocationId: '',
        taskDate: selectedDate,
        department: 'Patient Care',
        category: 'Nursing Care',
        description: '',
        quantity: 1,
        rate: 0,
        notes: ''
    });
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

    // New Task Form State
    const [newTaskForm, setNewTaskForm] = useState({
        department: 'Patient Care' as string,
        title: '',
        assignedStaffId: '',
        assignedTo: '',
        remarks: ''
    });
    const [isSubmittingNewTask, setIsSubmittingNewTask] = useState(false);

    // Load Tasks & Support Data
    const loadTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await dailyOperationsService.getTasks(selectedDate, activeUnitId);
            setTasks(data);
        } catch (err: any) {
            console.error('Failed to load daily operations:', err);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, activeUnitId]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Load Staff and Patients once
    useEffect(() => {
        let isMounted = true;
        Promise.all([
            careService.getMedicalStaff(activeUnitId),
            careService.getPatientBillingServices(activeUnitId)
        ]).then(([staff, patients]) => {
            if (!isMounted) return;
            setStaffList(staff || []);
            setBillingPatients(patients || []);
            if (patients?.length > 0 && !expenseForm.allocationId) {
                setExpenseForm((prev) => ({ ...prev, allocationId: patients[0].allocationId }));
            }
        }).catch((err) => {
            console.error('Failed to load staff/patients for daily operations:', err);
        });
        return () => {
            isMounted = false;
        };
    }, [activeUnitId]);

    // Quick Date Shifters
    const handleShiftDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    // Task Status Update
    const handleUpdateStatus = async (taskId: string, newStatus: DailyOperationStatus) => {
        setIsSavingTask(taskId);
        try {
            const updated = await dailyOperationsService.updateTask(taskId, { status: newStatus }, activeUnitId);
            setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, completedAt: updated?.completedAt || t.completedAt } : t)));
            setFeedback({ type: 'success', message: `Task status updated to ${newStatus}` });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Failed to update task status' });
        } finally {
            setIsSavingTask(null);
        }
    };

    // Assign Staff
    const handleAssignStaff = async (taskId: string, staffId: string) => {
        const found = staffList.find((s) => s.id === staffId);
        const staffName = found ? `${found.firstName} ${found.lastName}`.trim() : null;
        try {
            await dailyOperationsService.updateTask(taskId, {
                assignedStaffId: staffId || null,
                assignedTo: staffName
            }, activeUnitId);
            setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assignedStaffId: staffId, assignedTo: staffName } : t)));
        } catch (err: any) {
            alert(err.message || 'Failed to assign staff');
        }
    };

    // Update Remarks
    const handleSaveRemarks = async (taskId: string, remarks: string) => {
        try {
            await dailyOperationsService.updateTask(taskId, { remarks }, activeUnitId);
            setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, remarks } : t)));
        } catch (err: any) {
            alert(err.message || 'Failed to update remarks');
        }
    };

    // Submit Chargeable Expense
    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.allocationId) {
            alert('Please select a resident.');
            return;
        }
        if (!expenseForm.description || expenseForm.rate <= 0) {
            alert('Please provide item description and a valid rate.');
            return;
        }

        setIsSubmittingExpense(true);
        try {
            await dailyOperationsService.postChargeableExpense({
                ...expenseForm,
                taskDate: selectedDate
            }, activeUnitId);
            setFeedback({
                type: 'success',
                message: `Charge of ₹${(Number(expenseForm.quantity || 1) * Number(expenseForm.rate || 0)).toFixed(2)} posted directly to patient billing ledger!`
            });
            setIsExpenseModalOpen(false);
            setExpenseForm({
                allocationId: billingPatients[0]?.allocationId || '',
                taskDate: selectedDate,
                department: 'Patient Care',
                category: 'Nursing Care',
                description: '',
                quantity: 1,
                rate: 0,
                notes: ''
            });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Failed to post patient expense' });
        } finally {
            setIsSubmittingExpense(false);
        }
    };

    // Submit New Custom Task
    const handleCreateCustomTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskForm.title.trim()) {
            alert('Please enter a task title.');
            return;
        }

        setIsSubmittingNewTask(true);
        try {
            const created = await dailyOperationsService.createTask({
                taskDate: selectedDate,
                department: newTaskForm.department,
                title: newTaskForm.title.trim(),
                assignedStaffId: newTaskForm.assignedStaffId || null,
                assignedTo: newTaskForm.assignedTo || null,
                remarks: newTaskForm.remarks || null
            }, activeUnitId);

            if (created) {
                setTasks((prev) => [...prev, created]);
            } else {
                await loadTasks();
            }

            setFeedback({ type: 'success', message: 'New routine task added to daily register!' });
            setIsNewTaskModalOpen(false);
            setNewTaskForm({
                department: 'Patient Care',
                title: '',
                assignedStaffId: '',
                assignedTo: '',
                remarks: ''
            });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Failed to create daily task' });
        } finally {
            setIsSubmittingNewTask(false);
        }
    };

    // Task Metrics
    const metrics = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
        const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
        const pending = tasks.filter((t) => t.status === 'PENDING').length;
        const missed = tasks.filter((t) => t.status === 'MISSED').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, inProgress, pending, missed, completionRate };
    }, [tasks]);

    // Filter Tasks by Department
    const filteredTasks = useMemo(() => {
        if (selectedDept === 'All') return tasks;
        return tasks.filter((t) => t.department === selectedDept);
    }, [tasks, selectedDept]);

    // Group Filtered Tasks by Phase
    const tasksByPhase = useMemo(() => {
        const phases = ['MORNING_OPERATIONS', 'DEPARTMENT_UPDATES', 'ADMIN_REVIEW', 'END_OF_DAY_REPORT'];
        const map: Record<string, DailyOperationTask[]> = {};
        for (const p of phases) map[p] = [];

        for (const t of filteredTasks) {
            const ph = t.phase || 'DEPARTMENT_UPDATES';
            if (!map[ph]) map[ph] = [];
            map[ph].push(t);
        }
        return map;
    }, [filteredTasks]);

    return (
        <div className="space-y-6">
            {/* Feedback Alert */}
            {feedback && (
                <div
                    className={`flex items-center justify-between p-4 rounded-xl border text-sm font-medium ${
                        feedback.type === 'success'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                            : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        <span>{feedback.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFeedback(null)}
                        className="text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Top Command Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-md">
                {/* Date Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleShiftDate(-1)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Previous Day"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-200">
                        <Calendar size={15} className="text-emerald-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => handleShiftDate(1)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Next Day"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedDate(todayStr)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            selectedDate === todayStr
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={loadTasks}
                        disabled={isLoading}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Reload Operations Register"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button
                        type="button"
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold rounded-xl text-xs shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
                    >
                        <IndianRupee size={15} />
                        <span>Charge Patient Expense</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsNewTaskModalOpen(true)}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>Add Task</span>
                    </button>
                </div>
            </div>

            {/* Department Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {DEPARTMENTS.map((dept) => {
                    const isSelected = selectedDept === dept;
                    const count = dept === 'All' ? tasks.length : tasks.filter((t) => t.department === dept).length;
                    return (
                        <button
                            key={dept}
                            type="button"
                            onClick={() => setSelectedDept(dept)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                isSelected
                                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                        >
                            <span>{dept}</span>
                            <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Metrics KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Total Operations</span>
                        <Activity size={14} className="text-slate-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-100 mt-1">{metrics.total}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Automated + Assigned</div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-800/40 p-3.5 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between text-emerald-400 text-xs">
                        <span>Completed</span>
                        <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold text-emerald-300 mt-1">
                        {metrics.completed}{' '}
                        <span className="text-xs font-normal text-emerald-400">({metrics.completionRate}%)</span>
                    </div>
                    <div className="text-[11px] text-emerald-400/70 mt-0.5">Execution verified</div>
                </div>

                <div className="bg-sky-950/20 border border-sky-800/40 p-3.5 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between text-sky-400 text-xs">
                        <span>In Progress</span>
                        <Clock size={14} className="text-sky-400" />
                    </div>
                    <div className="text-xl font-bold text-sky-300 mt-1">{metrics.inProgress}</div>
                    <div className="text-[11px] text-sky-400/70 mt-0.5">Being executed</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Pending</span>
                        <Sparkles size={14} className="text-amber-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-200 mt-1">{metrics.pending}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Scheduled for today</div>
                </div>

                <div className="bg-rose-950/20 border border-rose-800/40 p-3.5 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between text-rose-400 text-xs">
                        <span>Missed / Issues</span>
                        <AlertTriangle size={14} className="text-rose-400" />
                    </div>
                    <div className="text-xl font-bold text-rose-300 mt-1">{metrics.missed}</div>
                    <div className="text-[11px] text-rose-400/70 mt-0.5">Attention needed</div>
                </div>
            </div>

            {/* Phased Routine Task Cards */}
            {isLoading ? (
                <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800/60">
                    <RefreshCw className="animate-spin mx-auto mb-3 text-emerald-400" size={28} />
                    <p className="text-sm font-medium">Loading daily operations and routine care schedule...</p>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800/60">
                    <Calendar className="mx-auto mb-3 text-slate-600" size={32} />
                    <p className="text-sm font-semibold text-slate-300">No operations found for this date & department filter.</p>
                    <p className="text-xs text-slate-500 mt-1">Click "Add Task" to create a custom operation or reset your filter.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(tasksByPhase).map(([phaseKey, phaseTasks]) => {
                        if (phaseTasks.length === 0) return null;
                        const phaseMeta = PHASE_LABELS[phaseKey] || {
                            label: phaseKey.replace(/_/g, ' '),
                            time: 'Daily Schedule',
                            badgeClass: 'bg-slate-700/20 text-slate-300 border-slate-700'
                        };

                        return (
                            <div key={phaseKey} className="space-y-3">
                                {/* Phase Header */}
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <h3 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
                                            {phaseMeta.label}
                                        </h3>
                                        <span
                                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${phaseMeta.badgeClass}`}
                                        >
                                            {phaseMeta.time}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">
                                        {phaseTasks.filter((t) => t.status === 'COMPLETED').length} / {phaseTasks.length} Done
                                    </span>
                                </div>

                                {/* Task Rows Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {phaseTasks.map((task) => {
                                        const deptColor = DEPARTMENT_COLORS[task.department] || {
                                            text: 'text-slate-300',
                                            bg: 'bg-slate-800',
                                            border: 'border-slate-700'
                                        };
                                        const isCompleted = task.status === 'COMPLETED';
                                        const isMissed = task.status === 'MISSED';
                                        const isInProgress = task.status === 'IN_PROGRESS';

                                        return (
                                            <div
                                                key={task.id}
                                                className={`p-4 rounded-xl border transition-all ${
                                                    isCompleted
                                                        ? 'bg-slate-900/40 border-slate-800/60 opacity-90'
                                                        : isMissed
                                                        ? 'bg-rose-950/20 border-rose-800/40'
                                                        : isInProgress
                                                        ? 'bg-sky-950/20 border-sky-800/40'
                                                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                {/* Header & Department Tag */}
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span
                                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${deptColor.bg} ${deptColor.text} ${deptColor.border}`}
                                                            >
                                                                {task.department}
                                                            </span>
                                                            {task.taskNo && (
                                                                <span className="text-[10px] font-mono text-slate-500">
                                                                    {task.taskNo}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4
                                                            className={`text-sm font-semibold leading-snug ${
                                                                isCompleted ? 'text-slate-300 line-through' : 'text-slate-100'
                                                            }`}
                                                        >
                                                            {task.title}
                                                        </h4>
                                                    </div>

                                                    {/* Status Selector */}
                                                    <select
                                                        value={task.status}
                                                        disabled={isSavingTask === task.id}
                                                        onChange={(e) =>
                                                            handleUpdateStatus(task.id, e.target.value as DailyOperationStatus)
                                                        }
                                                        className={`text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer border ${
                                                            isCompleted
                                                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                                                                : isInProgress
                                                                ? 'bg-sky-950/60 text-sky-300 border-sky-700/60'
                                                                : isMissed
                                                                ? 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                                                                : 'bg-slate-800 text-slate-300 border-slate-700'
                                                        }`}
                                                    >
                                                        <option value="PENDING">PENDING</option>
                                                        <option value="IN_PROGRESS">IN PROGRESS</option>
                                                        <option value="COMPLETED">COMPLETED</option>
                                                        <option value="MISSED">MISSED</option>
                                                    </select>
                                                </div>

                                                {/* Assignee & Meta Bar */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <User size={13} className="text-slate-500" />
                                                        <select
                                                            value={task.assignedStaffId || ''}
                                                            onChange={(e) => handleAssignStaff(task.id, e.target.value)}
                                                            className="bg-slate-950/40 text-slate-300 border border-slate-800 rounded px-2 py-0.5 text-xs focus:outline-none cursor-pointer max-w-[160px]"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {staffList.map((st) => (
                                                                <option key={st.id} value={st.id}>
                                                                    {st.firstName} {st.lastName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Remarks Trigger or Completed At */}
                                                    <div className="text-[11px] text-slate-500">
                                                        {task.completedAt ? (
                                                            <span className="text-emerald-400 font-medium">
                                                                Done at{' '}
                                                                {new Date(task.completedAt).toLocaleTimeString('en-IN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                placeholder="Add notes..."
                                                                defaultValue={task.remarks || ''}
                                                                onBlur={(e) => handleSaveRemarks(task.id, e.target.value)}
                                                                className="bg-transparent text-slate-400 placeholder:text-slate-600 focus:text-slate-200 focus:outline-none border-b border-transparent focus:border-slate-600 text-right text-xs"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Chargeable Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                                    <IndianRupee size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-100">Charge Patient Expense</h3>
                                    <p className="text-xs text-slate-400">Post an extra service or consumable directly to the patient's bill</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExpenseModalOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateExpense} className="space-y-4">
                            {/* Resident Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Select Inhouse Resident *
                                </label>
                                <select
                                    value={expenseForm.allocationId}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, allocationId: e.target.value })}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="">-- Choose Resident --</option>
                                    {billingPatients.map((p) => (
                                        <option key={p.allocationId} value={p.allocationId}>
                                            {p.patientName} {p.clientName ? `(Family: ${p.clientName})` : ''} - {p.serviceLabel}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Category & Department */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Department
                                    </label>
                                    <select
                                        value={expenseForm.department}
                                        onChange={(e) =>
                                            setExpenseForm({
                                                ...expenseForm,
                                                department: e.target.value as 'Patient Care' | 'Nursing'
                                            })
                                        }
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                                    >
                                        <option value="Patient Care">Patient Care</option>
                                        <option value="Nursing">Nursing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        value={expenseForm.category}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                                    >
                                        {CHARGEABLE_CATEGORIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Item / Treatment Description *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Diapers Pack (10 pcs), Sponge Bath, IV Fluid Infusion"
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            {/* Quantity, Rate & Total Amount */}
                            <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={expenseForm.quantity}
                                        onChange={(e) =>
                                            setExpenseForm({ ...expenseForm, quantity: Number(e.target.value) || 1 })
                                        }
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                        Rate (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={expenseForm.rate || ''}
                                        onChange={(e) =>
                                            setExpenseForm({ ...expenseForm, rate: Number(e.target.value) || 0 })
                                        }
                                        placeholder="0.00"
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                        Total (₹)
                                    </label>
                                    <div className="h-9 flex items-center px-2.5 bg-slate-900 rounded-lg text-emerald-400 font-bold text-sm">
                                        ₹{(Number(expenseForm.quantity || 1) * Number(expenseForm.rate || 0)).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Notes / Doctor Remarks
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Optional doctor referral or nursing notes..."
                                    value={expenseForm.notes || ''}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none resize-none"
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsExpenseModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingExpense}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
                                >
                                    {isSubmittingExpense ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                        <Save size={14} />
                                    )}
                                    <span>Post to Patient Ledger</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Custom Task Modal */}
            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                    <Plus size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-100">Add Daily Operation Task</h3>
                                    <p className="text-xs text-slate-400">Add a custom operational task to today's schedule</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsNewTaskModalOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCustomTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Department *
                                </label>
                                <select
                                    value={newTaskForm.department}
                                    onChange={(e) => setNewTaskForm({ ...newTaskForm, department: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                                >
                                    {DEPARTMENTS.filter((d) => d !== 'All').map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Task Title / Activity *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Bhajan & Bhajan singing session, Wheelchair maintenance"
                                    value={newTaskForm.title}
                                    onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Assign to Staff Member (Optional)
                                </label>
                                <select
                                    value={newTaskForm.assignedStaffId}
                                    onChange={(e) => {
                                        const found = staffList.find((s) => s.id === e.target.value);
                                        setNewTaskForm({
                                            ...newTaskForm,
                                            assignedStaffId: e.target.value,
                                            assignedTo: found ? `${found.firstName} ${found.lastName}`.trim() : ''
                                        });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                                >
                                    <option value="">-- Leave Unassigned --</option>
                                    {staffList.map((st) => (
                                        <option key={st.id} value={st.id}>
                                            {st.firstName} {st.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Remarks / Instructions
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Optional instructions for executing staff..."
                                    value={newTaskForm.remarks}
                                    onChange={(e) => setNewTaskForm({ ...newTaskForm, remarks: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsNewTaskModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingNewTask}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
                                >
                                    {isSubmittingNewTask ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                        <Plus size={14} />
                                    )}
                                    <span>Add Task</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
