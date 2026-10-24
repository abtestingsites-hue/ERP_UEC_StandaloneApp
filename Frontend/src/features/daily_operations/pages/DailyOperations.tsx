import { useMemo, useState } from 'react'
import { Activity, ClipboardCheck, Clock, FileText, Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { MasterDataSelector } from '../../../components/MasterDataSelector'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useStaff } from '../../../hooks/useHRData'
import { usePatientBillingServices } from '../../patient_billing/hooks/usePatientBilling'
import type { PatientService } from '../../patient_billing/services/patientBilling'
import { useCreateDailyOperationTask, useDailyOperationTasks, usePostChargeableExpense, useUpdateDailyOperationTask } from '../hooks/useDailyOperations'
import type { DailyOperationStatus, DailyOperationTask } from '../services/dailyOperations'


const departments = ['Patient Care', 'Nursing', 'Housekeeping', 'Kitchen', 'Inventory', 'Administration']
const chargeableCategories = ['Nursing Care', 'Medical Supply', 'Therapy', 'Extra Meal', 'Other']
const statuses: DailyOperationStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED']
const sections = ['Department Updates', 'Patient Care Register', 'Nursing Register', 'Operational Alerts', 'End-of-Day Report'] as const
type DailyOperationSection = typeof sections[number]
type ChargeableExpenseForm = { allocationId: string; department: 'Patient Care' | 'Nursing'; category: string; description: string; quantity: string; rate: string; notes: string }

const phaseLabels: Record<string, string> = {
    MORNING_OPERATIONS: 'Morning Operations',
    DEPARTMENT_UPDATES: 'Department Updates',
    ADMIN_REVIEW: 'Admin Review',
    END_OF_DAY_REPORT: 'End-of-Day Report'
}
const today = () => new Date().toISOString().split('T')[0]

const formatTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const isActiveStaff = (staff: any) => !staff.isDeleted && !['resigned', 'terminated'].includes(String(staff.status || '').toLowerCase())

export function DailyOperations() {
    const [date, setDate] = useState(today())
    const [departmentFilter, setDepartmentFilter] = useState('All')
    const [selectedPatientAllocationId, setSelectedPatientAllocationId] = useState('')
    const [activeSection, setActiveSection] = useState<DailyOperationSection>('Department Updates')
    const [manualDepartment, setManualDepartment] = useState('Patient Care')
    const [manualTitle, setManualTitle] = useState('')
    const [manualStaffId, setManualStaffId] = useState('')
    const [manualRemarks, setManualRemarks] = useState('')
    const [chargeableForm, setChargeableForm] = useState<ChargeableExpenseForm>({
        allocationId: '',
        department: 'Patient Care',
        category: '',
        description: '',
        quantity: '1',
        rate: '',
        notes: ''
    })

    const { data: tasks = [], isLoading } = useDailyOperationTasks(date)
    const { data: staff = [] } = useStaff({ scope: 'all' })
    const { data: patientServices = [], isLoading: patientsLoading } = usePatientBillingServices()
    const createTask = useCreateDailyOperationTask(date)
    const updateTask = useUpdateDailyOperationTask(date)
    const postChargeableExpense = usePostChargeableExpense(date)

    const activeStaff = useMemo(() => staff.filter(isActiveStaff), [staff])
    const staffById = useMemo(() => new Map(activeStaff.map((item: any) => [item.id, item])), [activeStaff])
    const patientFilterVisible = departmentFilter === 'Nursing'
        || departmentFilter === 'Patient Care'
        || activeSection === 'Nursing Register'
        || activeSection === 'Patient Care Register'
    const activePatientServices = useMemo(() => (
        patientServices.filter((service: PatientService) => !['CLOSED', 'CANCELLED', 'REJECTED', 'DELETED'].includes(String(service.status || '').toUpperCase()))
    ), [patientServices])
    const selectedPatient = useMemo(() => (
        activePatientServices.find((service) => service.allocationId === selectedPatientAllocationId) || null
    ), [activePatientServices, selectedPatientAllocationId])
    const selectedChargeablePatient = useMemo(() => (
        activePatientServices.find((service) => service.allocationId === chargeableForm.allocationId) || null
    ), [activePatientServices, chargeableForm.allocationId])

    const visibleTasks = useMemo(() => (
        departmentFilter === 'All' ? tasks : tasks.filter((task) => task.department === departmentFilter)
    ), [departmentFilter, tasks])
    const patientCareTasks = useMemo(() => tasks.filter((task) => task.department === 'Patient Care'), [tasks])
    const nursingTasks = useMemo(() => tasks.filter((task) => task.department === 'Nursing'), [tasks])
    const summary = useMemo(() => {
        const byDepartment = departments.map((department) => {
            const departmentTasks = tasks.filter((task) => task.department === department)
            return {
                department,
                total: departmentTasks.length,
                completed: departmentTasks.filter((task) => task.status === 'COMPLETED').length,
                pending: departmentTasks.filter((task) => task.status === 'PENDING').length,
                inProgress: departmentTasks.filter((task) => task.status === 'IN_PROGRESS').length,
                missed: departmentTasks.filter((task) => task.status === 'MISSED').length
            }
        })

        return {
            total: tasks.length,
            completed: tasks.filter((task) => task.status === 'COMPLETED').length,
            pending: tasks.filter((task) => task.status === 'PENDING').length,
            inProgress: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
            missed: tasks.filter((task) => task.status === 'MISSED').length,
            byDepartment,
            issues: tasks.filter((task) => task.status === 'MISSED' || String(task.remarks || '').trim())
        }
    }, [tasks])

    const completionRate = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0

    const createManualTask = (event: React.FormEvent) => {
        event.preventDefault()
        const selectedStaff = staffById.get(manualStaffId) as any
        if (!manualTitle.trim()) return

        createTask.mutate({
            taskDate: date,
            department: manualDepartment,
            title: manualTitle.trim(),
            assignedStaffId: manualStaffId || null,
            assignedTo: selectedStaff?.name || null,
            remarks: manualRemarks.trim() || null
        }, {
            onSuccess: () => {
                setManualTitle('')
                setManualStaffId('')
                setManualRemarks('')
            }
        })
    }

    const patchTask = (task: DailyOperationTask, payload: any) => {
        updateTask.mutate({ taskId: task.id, payload })
    }

    const updateAssignedStaff = (task: DailyOperationTask, staffId: string) => {
        const selectedStaff = staffById.get(staffId) as any
        patchTask(task, {
            assignedStaffId: staffId || null,
            assignedTo: selectedStaff?.name || null
        })
    }

    const postChargeable = (event: React.FormEvent) => {
        event.preventDefault()
        const quantity = Number(chargeableForm.quantity || 0)
        const rate = Number(chargeableForm.rate || 0)
        if (!chargeableForm.allocationId || !chargeableForm.category || !chargeableForm.description.trim() || quantity <= 0 || rate < 0) return

        postChargeableExpense.mutate({
            allocationId: chargeableForm.allocationId,
            taskDate: date,
            department: chargeableForm.department,
            category: chargeableForm.category,
            description: chargeableForm.description.trim(),
            quantity,
            rate,
            notes: chargeableForm.notes || null
        }, {
            onSuccess: () => {
                setChargeableForm((prev) => ({
                    ...prev,
                    description: '',
                    quantity: '1',
                    rate: '',
                    notes: ''
                }))
            }
        })
    }

    return (
        <div className="flex h-full min-w-0 flex-col space-y-5">
            <PageHeader
                title="Daily Operations"
                subtitle="Morning operations, department updates, admin review, and end-of-day reporting."
                breadcrumbs={[{ label: 'Home' }, { label: 'Daily Operations' }]}
            />

            <div className={`grid gap-3 ${patientFilterVisible ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
                <label className="min-w-0 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Date</span>
                    <input
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-primary-500"
                    />
                </label>
                <label className="min-w-0 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Department</span>
                    <select
                        value={departmentFilter}
                        onChange={(event) => {
                            const nextDepartment = event.target.value
                            setDepartmentFilter(nextDepartment)
                            if (nextDepartment !== 'Nursing' && nextDepartment !== 'Patient Care') setSelectedPatientAllocationId('')
                            if (nextDepartment === 'Nursing') setActiveSection('Nursing Register')
                            if (nextDepartment === 'Patient Care') setActiveSection('Patient Care Register')
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-primary-500"
                    >
                        <option value="All">All Departments</option>
                        {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                    </select>
                </label>
                {patientFilterVisible ? (
                    <label className="min-w-0 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Patient</span>
                        <select
                            value={selectedPatientAllocationId}
                            onChange={(event) => setSelectedPatientAllocationId(event.target.value)}
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-primary-500"
                            disabled={patientsLoading || !activePatientServices.length}
                        >
                            <option value="">{patientsLoading ? 'Loading patients...' : 'All active patients'}</option>
                            {activePatientServices.map((service) => (
                                <option key={service.allocationId} value={service.allocationId}>
                                    {service.patientName} - {service.serviceLabel} - {service.allocationRef}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-5">
                <Metric label="Total Tasks" value={summary.total} tone="slate" />
                <Metric label="Completed" value={summary.completed} tone="emerald" />
                <Metric label="In Progress" value={summary.inProgress} tone="blue" />
                <Metric label="Pending" value={summary.pending} tone="amber" />
                <Metric label="Missed / Issue" value={summary.missed} tone="rose" />
            </div>

            <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                    <button
                        key={section}
                        type="button"
                        onClick={() => setActiveSection(section)}
                        className={`rounded-xl px-4 py-2 text-sm font-extrabold shadow-sm transition ${activeSection === section ? 'bg-primary-700 text-white' : 'bg-white text-slate-700 hover:bg-primary-50'}`}
                    >
                        {section}
                    </button>
                ))}
            </div>

            {(activeSection === 'Patient Care Register' || activeSection === 'Nursing Register') && (
                <form onSubmit={postChargeable} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-1">
                        <h2 className="text-base font-extrabold text-slate-900">Patient Chargeable Expenses</h2>
                        <p className="text-xs font-semibold text-slate-500">
                            Add only billable patient items such as medicine, doctor fees, consumables, lab, equipment, external bills, or approved extra care.
                        </p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.2fr)_minmax(150px,180px)_minmax(190px,230px)_minmax(240px,1fr)]">
                        <label className="block min-w-0">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Patient / Service</span>
                            <select
                                value={chargeableForm.allocationId}
                                onChange={(event) => setChargeableForm((prev) => ({ ...prev, allocationId: event.target.value }))}
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary-500"
                                disabled={patientsLoading || !activePatientServices.length}
                            >
                                <option value="">{patientsLoading ? 'Loading patients...' : '-- Select patient --'}</option>
                                {activePatientServices.map((service) => (
                                    <option key={service.allocationId} value={service.allocationId}>
                                        {service.patientName} - {service.serviceLabel} - {service.allocationRef}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block min-w-0">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Department</span>
                            <select
                                value={chargeableForm.department}
                                onChange={(event) => setChargeableForm((prev) => ({ ...prev, department: event.target.value as 'Patient Care' | 'Nursing' }))}
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary-500"
                            >
                                <option value="Patient Care">Patient Care</option>
                                <option value="Nursing">Nursing</option>
                            </select>
                        </label>
                        <label className="block min-w-0">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Charge Category</span>
                            <select
                                value={chargeableForm.category}
                                onChange={(event) => setChargeableForm((prev) => ({ ...prev, category: event.target.value }))}
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary-500"
                            >
                                {chargeableCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                        </label>
                        <TextField
                            label="Item / Service"
                            value={chargeableForm.description}
                            onChange={(value) => setChargeableForm((prev) => ({ ...prev, description: value }))}
                            placeholder="Diaper, BP tablet, doctor visit, lab test..."
                        />
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(110px,150px)_minmax(110px,150px)_minmax(150px,180px)_minmax(260px,1fr)_minmax(170px,220px)]">
                        <TextField
                            label="Quantity"
                            value={chargeableForm.quantity}
                            onChange={(value) => setChargeableForm((prev) => ({ ...prev, quantity: value }))}
                            placeholder="Qty"
                        />
                        <TextField
                            label="Unit Rate"
                            value={chargeableForm.rate}
                            onChange={(value) => setChargeableForm((prev) => ({ ...prev, rate: value }))}
                            placeholder="Rate"
                        />
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">Amount</p>
                            <p className="mt-1 text-sm font-extrabold text-emerald-900">
                                Rs {(Number(chargeableForm.quantity || 0) * Number(chargeableForm.rate || 0)).toFixed(2)}
                            </p>
                        </div>
                        <TextField
                            label="Notes / Reason"
                            value={chargeableForm.notes}
                            onChange={(value) => setChargeableForm((prev) => ({ ...prev, notes: value }))}
                            placeholder="Optional approval or bill note"
                        />
                        <button
                            type="submit"
                            disabled={
                                postChargeableExpense.isPending
                                || !selectedChargeablePatient
                                || !chargeableForm.description.trim()
                                || Number(chargeableForm.quantity || 0) <= 0
                                || Number(chargeableForm.rate || 0) < 0
                            }
                            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 lg:mt-[21px]"
                        >
                            <Plus className="h-4 w-4" />
                            {postChargeableExpense.isPending ? 'Posting...' : 'Post Charge'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900">{activeSection}</h2>
                            <p className="text-xs font-semibold text-slate-500">
                                {selectedPatient ? `${selectedPatient.patientName} - ${selectedPatient.serviceLabel}` : `${completionRate}% completed today`}
                            </p>
                        </div>
                        {isLoading ? <RefreshCw className="h-5 w-5 animate-spin text-slate-400" /> : null}
                    </div>

                    {activeSection === 'Department Updates' && (
                        <>
                            {departmentFilter === 'All' ? <DepartmentSummaryTable rows={summary.byDepartment || []} /> : null}
                            <TaskUpdateTable
                                tasks={visibleTasks}
                                activeStaff={activeStaff}
                                updateAssignedStaff={updateAssignedStaff}
                                patchTask={patchTask}
                            />
                        </>
                    )}
                    {activeSection === 'Patient Care Register' && (
                        <RegisterTable
                            tasks={patientCareTasks}
                            activeStaff={activeStaff}
                            selectedPatient={selectedPatient}
                            updateAssignedStaff={updateAssignedStaff}
                            patchTask={patchTask}
                        />
                    )}
                    {activeSection === 'Nursing Register' && (
                        <RegisterTable
                            tasks={nursingTasks}
                            activeStaff={activeStaff}
                            selectedPatient={selectedPatient}
                            updateAssignedStaff={updateAssignedStaff}
                            patchTask={patchTask}
                        />
                    )}
                    {activeSection === 'Operational Alerts' && (
                        <OperationalAlerts tasks={tasks} issues={summary.issues} />
                    )}
                    {activeSection === 'End-of-Day Report' && (
                        <EndOfDaySummary summary={summary} />
                    )}
                </div>

                <form onSubmit={createManualTask} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary-600" />
                        <h2 className="text-base font-extrabold text-slate-900">Manual Extra Task</h2>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[minmax(170px,220px)_minmax(260px,1fr)_minmax(220px,280px)_minmax(240px,1fr)_minmax(170px,220px)]">
                        <SelectField label="Department" value={manualDepartment} onChange={setManualDepartment} options={departments} />
                        <TextField label="Task" value={manualTitle} onChange={setManualTitle} placeholder="Repair room TV, extra cleaning, stock verification..." />
                        <label className="block min-w-0">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Assigned To</span>
                            <select
                                value={manualStaffId}
                                onChange={(event) => setManualStaffId(event.target.value)}
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary-500"
                            >
                                <option value="">-- Assign Later --</option>
                                {activeStaff.map((item: any) => <option key={item.id} value={item.id}>{item.name} - {item.department || item.role}</option>)}
                            </select>
                        </label>
                        <TextField label="Remarks" value={manualRemarks} onChange={setManualRemarks} placeholder="Optional note" />
                        <button
                            type="submit"
                            disabled={createTask.isPending || !manualTitle.trim()}
                            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 text-sm font-extrabold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 lg:mt-[21px]"
                        >
                            <Plus className="h-4 w-4" />
                            {createTask.isPending ? 'Adding...' : 'Add Extra Task'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-emerald-700" />
                        <h2 className="text-base font-extrabold text-slate-900">Admin Review</h2>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                        {summary.byDepartment.map((item) => (
                            <div key={item.department} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                <p className="font-extrabold text-slate-900">{item.department}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{item.completed}/{item.total} completed · {item.pending} pending · {item.missed} issue</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-700" />
                        <h2 className="text-base font-extrabold text-slate-900">End-of-Day Report</h2>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <p className="text-sm font-extrabold text-blue-900">{summary.completed} of {summary.total} tasks completed</p>
                        <p className="mt-1 text-xs font-semibold text-blue-800">{summary.missed} missed/issues and {summary.pending} pending tasks need follow-up.</p>
                    </div>
                    <div className="mt-3 max-h-36 space-y-2 overflow-auto">
                        {summary.issues.slice(0, 8).map((issue: any) => (
                            <div key={issue.id} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                                {issue.department}: {issue.title} {issue.remarks ? `- ${issue.remarks}` : ''}
                            </div>
                        ))}
                        {!summary.issues.length ? (
                            <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">No remarks or missed tasks recorded.</p>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DepartmentSummaryTable({ rows }: { rows: Array<{ department: string; total: number; completed: number; pending: number; inProgress: number; missed: number }> }) {
    return (
        <div className="mb-4 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-3 py-3">Department</th>
                        <th className="px-3 py-3">Total Activities</th>
                        <th className="px-3 py-3">Completed</th>
                        <th className="px-3 py-3">Pending</th>
                        <th className="px-3 py-3">In Progress</th>
                        <th className="px-3 py-3">Issues</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.department} className="border-t border-slate-100">
                            <td className="px-3 py-3 font-extrabold text-slate-900">{row.department}</td>
                            <td className="px-3 py-3 font-bold">{row.total}</td>
                            <td className="px-3 py-3 font-bold text-emerald-700">{row.completed}</td>
                            <td className="px-3 py-3 font-bold text-amber-700">{row.pending}</td>
                            <td className="px-3 py-3 font-bold text-blue-700">{row.inProgress}</td>
                            <td className="px-3 py-3 font-bold text-rose-700">{row.missed}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function TaskUpdateTable({
    tasks,
    activeStaff,
    updateAssignedStaff,
    patchTask
}: {
    tasks: DailyOperationTask[]
    activeStaff: any[]
    updateAssignedStaff: (task: DailyOperationTask, staffId: string) => void
    patchTask: (task: DailyOperationTask, payload: any) => void
}) {
    return (
        <div className="max-h-[620px] max-w-full overflow-auto rounded-2xl border border-slate-100">
            <table className="min-w-[980px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-3 py-3">Department / Task</th>
                        <th className="px-3 py-3">Assigned To</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Completed Time</th>
                        <th className="px-3 py-3">Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task) => (
                        <tr key={task.id} className="border-b border-slate-100 align-top">
                            <td className="px-3 py-3">
                                <p className="font-extrabold text-slate-900">{task.title}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {task.department} - {phaseLabels[task.phase] || 'Department Updates'} - {task.source === 'DEFAULT' ? 'Routine' : 'Manual'}
                                </p>
                            </td>
                            <td className="px-3 py-3">
                                <StaffSelect task={task} activeStaff={activeStaff} updateAssignedStaff={updateAssignedStaff} />
                            </td>
                            <td className="px-3 py-3">
                                <StatusSelect task={task} patchTask={patchTask} />
                            </td>
                            <td className="px-3 py-3 text-xs font-semibold text-slate-600">{formatTime(task.completedAt)}</td>
                            <td className="px-3 py-3">
                                <RemarksBox task={task} patchTask={patchTask} />
                            </td>
                        </tr>
                    ))}
                    {!tasks.length ? (
                        <tr>
                            <td colSpan={5} className="px-3 py-16 text-center text-sm font-semibold text-slate-500">No daily operation tasks found.</td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    )
}

function RegisterTable({
    tasks,
    activeStaff,
    selectedPatient,
    updateAssignedStaff,
    patchTask
}: {
    tasks: DailyOperationTask[]
    activeStaff: any[]
    selectedPatient: PatientService | null
    updateAssignedStaff: (task: DailyOperationTask, staffId: string) => void
    patchTask: (task: DailyOperationTask, payload: any) => void
}) {
    return (
        <div className="space-y-3">
            <div className="max-h-[620px] max-w-full overflow-auto rounded-2xl border border-slate-100">
                <table className="min-w-[1040px] w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="w-[130px] px-3 py-3">Patient</th>
                            <th className="w-[220px] px-3 py-3">Activity</th>
                            <th className="w-[210px] px-3 py-3">Assigned Staff</th>
                            <th className="w-[170px] px-3 py-3">Status</th>
                            <th className="w-[120px] px-3 py-3">Completed Time</th>
                            <th className="w-[260px] px-3 py-3">Notes</th>
                            <th className="w-[150px] px-3 py-3">Verification</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr key={task.id} className="border-b border-slate-100 align-top">
                                <td className="px-3 py-3">
                                    <p className="font-extrabold text-slate-900">{selectedPatient?.patientName || 'All patients'}</p>
                                    <p className="text-xs font-semibold text-slate-500">{selectedPatient?.allocationRef || 'Routine scope'}</p>
                                </td>
                                <td className="px-3 py-3">
                                    <p className="font-extrabold text-slate-900">{task.title}</p>
                                    <p className="text-xs font-semibold text-slate-500">{phaseLabels[task.phase] || 'Department Updates'}</p>
                                </td>
                                <td className="px-3 py-3"><StaffSelect task={task} activeStaff={activeStaff} updateAssignedStaff={updateAssignedStaff} /></td>
                                <td className="px-3 py-3"><StatusSelect task={task} patchTask={patchTask} /></td>
                                <td className="px-3 py-3 text-xs font-semibold text-slate-600">{formatTime(task.completedAt)}</td>
                                <td className="px-3 py-3"><RemarksBox task={task} patchTask={patchTask} /></td>
                                <td className="px-3 py-3">
                                    {task.status === 'COMPLETED' ? (
                                        <div>
                                            <StatusHighlighter value="Verified" />
                                            <p className="mt-1 text-xs font-semibold text-slate-500">By operations review</p>
                                        </div>
                                    ) : (
                                        <StatusHighlighter value="Pending Verification" />
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!tasks.length ? (
                            <tr>
                                <td colSpan={8} className="px-3 py-16 text-center text-sm font-semibold text-slate-500">No register tasks found.</td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function OperationalAlerts({ tasks, issues }: { tasks: DailyOperationTask[]; issues: DailyOperationTask[] }) {
    const nursingIssues = tasks.filter((task) => task.department === 'Nursing' && (task.status === 'MISSED' || /medicine|doctor|refill/i.test(task.remarks || task.title)))
    const inventoryIssues = tasks.filter((task) => task.department === 'Inventory' && (task.status === 'MISSED' || /short|stock|refill/i.test(task.remarks || task.title)))
    const otherIssues = issues.filter((task) => task.department !== 'Nursing' && task.department !== 'Inventory')
    return (
        <div className="grid gap-3 md:grid-cols-2">
            <AlertCard title="Medicine Refill Required" items={nursingIssues.filter((task) => /medicine|refill/i.test(task.remarks || task.title))} />
            <AlertCard title="Doctor Consultation Required" items={nursingIssues.filter((task) => /doctor/i.test(task.remarks || task.title))} />
            <AlertCard title="Inventory Shortage" items={inventoryIssues} />
            <AlertCard title="Other Issues" items={otherIssues} />
        </div>
    )
}

function AlertCard({ title, items }: { title: string; items: DailyOperationTask[] }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary-700" />
                <p className="text-sm font-extrabold text-slate-900">{title}</p>
            </div>
            <div className="max-h-44 space-y-2 overflow-auto">
                {items.slice(0, 8).map((item) => (
                    <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                        {item.department}: {item.title}{item.remarks ? ` - ${item.remarks}` : ''}
                    </div>
                ))}
                {!items.length ? <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">No alert recorded.</p> : null}
            </div>
        </div>
    )
}

function EndOfDaySummary({ summary }: { summary: any }) {
    return (
        <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">Completed</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-900">{summary.completed}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Pending / Follow Tomorrow</p>
                <p className="mt-2 text-3xl font-extrabold text-amber-900">{summary.pending}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-rose-700">Missed / Issue</p>
                <p className="mt-2 text-3xl font-extrabold text-rose-900">{summary.missed}</p>
            </div>
        </div>
    )
}

function StaffSelect({ task, activeStaff, updateAssignedStaff }: { task: DailyOperationTask; activeStaff: any[]; updateAssignedStaff: (task: DailyOperationTask, staffId: string) => void }) {
    return (
        <>
            <select
                value={task.assignedStaffId || ''}
                onChange={(event) => updateAssignedStaff(task, event.target.value)}
                className="h-9 min-w-[170px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold outline-none focus:border-primary-500"
            >
                <option value="">-- Not assigned --</option>
                {activeStaff.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            {task.assignedTo && !task.assignedStaffId ? <p className="mt-1 text-xs text-slate-500">{task.assignedTo}</p> : null}
        </>
    )
}

function StatusSelect({ task, patchTask }: { task: DailyOperationTask; patchTask: (task: DailyOperationTask, payload: any) => void }) {
    return (
        <>
            <select
                value={task.status}
                onChange={(event) => patchTask(task, { status: event.target.value })}
                className="h-9 min-w-[130px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold outline-none focus:border-primary-500"
            >
                {statuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
            </select>
            <div className="mt-1"><StatusHighlighter value={task.status} /></div>
        </>
    )
}

function RemarksBox({ task, patchTask }: { task: DailyOperationTask; patchTask: (task: DailyOperationTask, payload: any) => void }) {
    return (
        <textarea
            defaultValue={task.remarks || ''}
            onBlur={(event) => {
                if (event.target.value !== (task.remarks || '')) {
                    patchTask(task, { remarks: event.target.value })
                }
            }}
            placeholder="Remarks or issue..."
            className="min-h-[42px] w-full min-w-[220px] rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold outline-none focus:border-primary-500"
        />
    )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'emerald' | 'blue' | 'amber' | 'rose' }) {
    const colors = {
        slate: 'border-slate-100 bg-white text-slate-900',
        emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
        blue: 'border-blue-100 bg-blue-50 text-blue-800',
        amber: 'border-amber-100 bg-amber-50 text-amber-800',
        rose: 'border-rose-100 bg-rose-50 text-rose-800'
    }
    return (
        <div className={`rounded-2xl border p-4 shadow-sm ${colors[tone]}`}>
            <Clock className="h-4 w-4" />
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
            <p className="text-xs font-extrabold uppercase tracking-wide">{label}</p>
        </div>
    )
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
    return (
        <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-primary-500"
            />
        </label>
    )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
    return (
        <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary-500"
            >
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
        </label>
    )
}







