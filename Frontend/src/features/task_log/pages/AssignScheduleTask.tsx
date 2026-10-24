import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { FilterSection } from '../../../components/FilterSection'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { useStaff } from '../../../hooks/useHRData'
import type { Staff } from '../../../types/staff'
import { useCreateTask, useTasks } from '../hooks/useTasks'
import { useToast } from '../../../components/Toast'
import type { Task } from '../types'
import { ArrowLeft, CalendarDays, CircleCheck, Clock3, Plus } from 'lucide-react'
const scheduleTaskFormSchema = z.object({
    approvalAuthorityId: z.string().min(1, 'Approval Authority is required'),
    description: z.string().min(3, 'Task description is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    priority: z.string().min(1, 'Priority is required')
})

type ScheduleTaskFormValues = z.infer<typeof scheduleTaskFormSchema>

type ViewState = 'list' | 'staff_tasks'

export function AssignScheduleTask() {
    const { data: staffList = [], isLoading: isLoadingStaff, refetch: refetchStaff } = useStaff()
    const activeStaffList = staffList.filter((staff) => {
        const status = String(staff.status || '').trim().toUpperCase()
        return !staff.isDeleted && status !== 'RESIGNED' && status !== 'TERMINATED'
    })
    const taskStaffList = activeStaffList
    const { data: allTasks = [], isLoading: isLoadingTasks } = useTasks()
    const createTask = useCreateTask()
    const { toast } = useToast()

    const [currentView, setCurrentView] = useState<ViewState>('list')
    const [searchQuery, setSearchQuery] = useState('')
    const [viewingStaffId, setViewingStaffId] = useState<string | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedHistoryTask, setSelectedHistoryTask] = useState<Task | null>(null)

    const selectedStaff = useMemo(() =>
        taskStaffList.find(s => s.id === viewingStaffId), [taskStaffList, viewingStaffId]
    )
    const selectedStaffId = selectedStaff?.id ?? null
    const selectedStaffHasActiveLogin = !!selectedStaff?.user?.id && selectedStaff.user.isActive
    const selectedStaffUserId = selectedStaffHasActiveLogin ? selectedStaff!.user!.id : null

    const approvalAuthorityOptions = useMemo(() => [
        { value: '', label: '-- Select the Staff --' },
        ...taskStaffList
            .filter((s) => !!s.user?.id && s.user.isActive)
            .map((s) => ({ value: s.user!.id, label: `${s.name} (ID: ${s.empId})` }))
    ], [taskStaffList])

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ScheduleTaskFormValues>({
        resolver: zodResolver(scheduleTaskFormSchema),
        defaultValues: {
            approvalAuthorityId: '',
            description: '',
            dueDate: '',
            priority: ''
        }
    })

    const filteredStaff = taskStaffList.filter(s =>
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.empId && s.empId.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const tasksForSelectedStaff = allTasks.filter(
        (t) => (
            (!!selectedStaffUserId && t.assigneeId === selectedStaffUserId) ||
            (!!selectedStaffId && t.assignedStaffId === selectedStaffId)
        ) && t.type === 'SCHEDULED'
    )

    const taskStatusMeta: Record<string, { label: string, className: string }> = {
        ASSIGNED: { label: 'Assigned', className: 'bg-slate-100 text-slate-700 border-slate-200' },
        IN_PROGRESS: { label: 'In Progress', className: 'bg-amber-100 text-amber-700 border-amber-200' },
        COMPLETED: { label: 'Completed', className: 'bg-sky-100 text-sky-700 border-sky-200' },
        APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        REJECTED: { label: 'Rejected', className: 'bg-rose-100 text-rose-700 border-rose-200' }
    }

    const scheduledTaskSummary = useMemo(() => ({
        total: tasksForSelectedStaff.length,
        completed: tasksForSelectedStaff.filter(task => task.status === 'COMPLETED' || task.status === 'APPROVED').length,
        inProgress: tasksForSelectedStaff.filter(task => task.status === 'IN_PROGRESS').length,
        assigned: tasksForSelectedStaff.filter(task => task.status === 'ASSIGNED').length
    }), [tasksForSelectedStaff])

    const formatCreatedAt = (value?: string) => {
        if (!value) return 'Recently created'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'Recently created'
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatDueDate = (value?: string) => {
        if (!value) return 'No due date'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'No due date'
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const getPriorityLabel = (priority?: string) => {
        if (!priority) return 'Medium'
        return priority.charAt(0) + priority.slice(1).toLowerCase()
    }

    const getPriorityClassName = (priority?: string) => {
        if (priority === 'HIGH') return 'text-rose-600'
        if (priority === 'LOW') return 'text-emerald-600'
        return 'text-amber-600'
    }

    const getStaffScheduledTaskCount = (staff: Staff) => {
        return allTasks.filter((task) => (
            task.assignedStaffId === staff.id ||
            (!!staff.user?.id && task.assigneeId === staff.user.id)
        ) && task.type === 'SCHEDULED').length
    }

    const handleViewStaffTasks = (staffId: string) => {
        setViewingStaffId(staffId)
        setCurrentView('staff_tasks')
        setSearchQuery('')
        setSearchQuery('')
    }

    const handleAddNewTask = () => {
        if (!selectedStaffId || !selectedStaffUserId) {
            toast({
                type: 'error',
                title: 'Staff Login Required',
                message: 'Staff login must exist and be active before scheduling tasks'
            })

            return
        }
        reset({
            approvalAuthorityId: '',
            description: '',
            dueDate: '',
            priority: ''
        })
        setIsDrawerOpen(true)
    }

    const onSubmitTask = async (data: ScheduleTaskFormValues) => {
        if (!selectedStaffId || !selectedStaffUserId) {
            toast({
                type: 'error',
                title: 'Staff Login Required',
                message: 'Staff login must exist and be active before scheduling tasks'
            })
            setShowCreateLoginPrompt(true)
            return
        }
        try {
            await createTask.mutateAsync({
                title: data.description,
                description: '',
                type: 'SCHEDULED',
                assigneeId: selectedStaffId,
                approvalAuthorityId: data.approvalAuthorityId,
                dueDate: new Date(data.dueDate).toISOString(),
                priority: data.priority
            })
            setIsDrawerOpen(false)
            reset()
        } catch (error) {
            const message = (error as any)?.response?.data?.message || ''
            if (
                message.includes('Staff Login Required') ||
                message.includes('Staff has no login') ||
                message.includes('Staff login is disabled')
            ) {
                setShowCreateLoginPrompt(true)
            }
            console.error(error)
        }
    }

    useEffect(() => {
        if (!autoOpenTaskDrawerAfterLogin || !selectedStaffUserId) return
        reset({
            approvalAuthorityId: '',
            description: '',
            dueDate: '',
            priority: ''
        })
        setShowCreateLoginPrompt(false)
        setIsDrawerOpen(true)
        setAutoOpenTaskDrawerAfterLogin(false)
    }, [autoOpenTaskDrawerAfterLogin, selectedStaffUserId, reset])

    const listColumns: Column<Staff>[] = [
        {
            key: 'sno',
            header: 'S.No',
            cell: (_, index) => <span className="text-gray-500 font-medium text-sm">{index + 1}</span>
        },
        {
            key: 'photoUrl',
            header: 'Staff Photo',
            cell: (row) => (
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden border border-yellow-200">
                    {row.photoUrl ? (
                        <img src={row.photoUrl} alt={row.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-600 bg-primary-100/50">
                            <span className="text-sm font-bold uppercase">{row.name?.substring(0, 2)}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'staffName',
            header: 'Staff Name & Ref. ID',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{row.name}</span>
                    <span className="text-xs text-primary-600">ID: {row.empId}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5 font-medium">UEC, Coimbatore</span>
                </div>
            )
        },
        {
            key: 'totalTasks',
            header: 'Total Scheduled Tasks',
            cell: (row) => <span className="text-gray-800 text-lg font-medium">{getStaffScheduledTaskCount(row)}</span>
        },
        {
            key: 'completedTasks',
            header: 'Completed Task',
            cell: () => <span className="text-gray-800 text-lg font-medium">0</span>
        },
        {
            key: 'underProcess',
            header: 'Task Under Process',
            cell: (row) => <span className="text-gray-800 text-lg font-medium">{getStaffScheduledTaskCount(row)}</span>
        },
        {
            key: 'action',
            header: '',
            cell: (row) => (
                <button
                    onClick={() => handleViewStaffTasks(row.id)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
                >
                    View Task
                </button>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900">
            {currentView === 'list' && (
                <>
                    <PageHeader
                        title="Assign Schedule Task"
                        breadcrumbs={[
                            { label: 'Task Log' },
                            { label: 'Assign Schedule Task' }
                        ]}
                    />

                    <FilterSection
                        searchQuery={searchQuery}
                        onSearchChange={(e) => setSearchQuery(e.target.value)}
                        searchPlaceholder="Search staff by name or ID..."
                    />

                    {isLoadingStaff ? (
                        <div className="animate-pulse bg-white border border-gray-200 shadow-sm rounded-lg h-64 p-6">
                            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                        </div>
                    ) : (
                        <DataTable
                            data={filteredStaff}
                            columns={listColumns}
                            keyExtractor={(s) => s.id}
                            emptyStateMessage="No staff found."
                        />
                    )}
                </>
            )}

            {currentView === 'staff_tasks' && selectedStaff && (
                <>
                    <PageHeader
                        title="Assign Schedule Task"
                        breadcrumbs={[
                            { label: 'Task Log' },
                            { label: 'Assign Schedule Task', href: '#' },
                            { label: selectedStaff.name }
                        ]}
                    />

                    <section className="rounded-[28px] border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] overflow-hidden">
                        <div className="flex flex-col gap-3 border-b border-primary-100 bg-gradient-to-r from-[#0F969C] via-[#6DA5C0] to-[#294D61] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Task Log Workspace</p>
                                <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Update Assign Schedule Task</h2>
                            </div>
                            <button
                                onClick={() => setCurrentView('list')}
                                className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </button>
                        </div>

                        <div className="space-y-6 bg-gradient-to-b from-[#F7FAFC] via-white to-white px-5 py-6 sm:px-7">
                            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                                <div className="rounded-[24px] border border-[#0F969C]/15 bg-white p-5 shadow-[0_10px_30px_rgba(15,150,156,0.08)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#294D61]">Staff Reference</p>
                                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{selectedStaff.empId}</p>
                                            <p className="mt-1 text-sm font-medium text-slate-500">{selectedStaff.name}</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                                            <CircleCheck className="h-3.5 w-3.5" />
                                            {selectedStaffHasActiveLogin ? 'Login Active' : 'Login Required'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total</p>
                                        <p className="mt-2 text-2xl font-extrabold text-slate-900">{scheduledTaskSummary.total}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">Completed</p>
                                        <p className="mt-2 text-2xl font-extrabold text-emerald-700">{scheduledTaskSummary.completed}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">In Progress</p>
                                        <p className="mt-2 text-2xl font-extrabold text-amber-700">{scheduledTaskSummary.inProgress}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-sky-200 bg-sky-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">Assigned</p>
                                        <p className="mt-2 text-2xl font-extrabold text-sky-700">{scheduledTaskSummary.assigned}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                                <div className="grid gap-px bg-gray-200 md:grid-cols-4">
                                    <div className="bg-[#F7FAFC] px-5 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#294D61]">Unit Name</p>
                                        <p className="mt-2 text-lg font-bold text-slate-900">Universal Elder Care</p>
                                        <p className="text-sm text-slate-500">Coimbatore</p>
                                    </div>
                                    <div className="bg-white px-5 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Staff Name</p>
                                        <p className="mt-2 text-lg font-bold text-slate-900">{selectedStaff.name}</p>
                                        <p className="text-sm text-slate-500">{selectedStaff.email || 'No email added'}</p>
                                    </div>
                                    <div className="bg-white px-5 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Designation</p>
                                        <p className="mt-2 text-lg font-bold text-slate-900">{selectedStaff.role || 'Unassigned'}</p>
                                        <p className="text-sm text-slate-500">{selectedStaff.department || 'Administration'}</p>
                                    </div>
                                    <div className="bg-[#fff8e7] px-5 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">Action</p>
                                        <button
                                            onClick={handleAddNewTask}
                                            className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0F969C] to-[#294D61] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,150,156,0.22)] hover:-translate-y-0.5 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add New Task
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <section className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                                <div className="border-b border-cyan-200 bg-gradient-to-r from-[#6DA5C0] to-[#F7FAFC] px-5 py-4">
                                    <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Schedule Task History</h3>
                                    <p className="mt-1 text-sm font-medium text-slate-500">A cleaner version of the legacy task history panel using your current palette.</p>
                                </div>

                                {isLoadingTasks ? (
                                    <div className="animate-pulse p-6">
                                        <div className="mb-3 h-12 rounded-2xl bg-gray-100"></div>
                                        <div className="mb-3 h-12 rounded-2xl bg-gray-100"></div>
                                        <div className="h-12 rounded-2xl bg-gray-100"></div>
                                    </div>
                                ) : tasksForSelectedStaff.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                        <CalendarDays className="h-10 w-10 text-[#0F969C]/40" />
                                        <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">No Task Added</p>
                                        <p className="mt-2 max-w-md text-sm font-medium text-slate-500">Create the first scheduled task for this staff member to populate the history section.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-[#f7fafc]">
                                                <tr className="text-left">
                                                    {['S.No', 'Created By', 'Task', 'Due Date & Priority', 'Approval Authority', 'Task Status', 'Action'].map((label) => (
                                                        <th key={label} className="px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            {label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {tasksForSelectedStaff.map((task, index) => {
                                                    const statusMeta = taskStatusMeta[task.status] || taskStatusMeta.ASSIGNED
                                                    return (
                                                        <tr key={task.id} className="transition-colors hover:bg-[#0F969C]/4">
                                                            <td className="px-5 py-5 text-sm font-bold text-slate-500">{index + 1}</td>
                                                            <td className="px-5 py-5 align-top">
                                                                <div className="text-sm font-bold text-slate-900">{task.assignedBy || 'System'}</div>
                                                                <div className="mt-1 text-xs font-medium text-slate-500">{formatCreatedAt(task.createdAt)}</div>
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <div className="max-w-[240px] text-sm font-semibold text-slate-900">{task.title}</div>
                                                                <div className="mt-1 text-xs text-slate-500">{task.description || 'Scheduled staff task'}</div>
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <div className="text-sm font-bold text-slate-900">{formatDueDate(task.dueDate)}</div>
                                                                <div className={`mt-1 text-xs font-semibold uppercase tracking-[0.16em] ${getPriorityClassName(task.priority)}`}>
                                                                    {getPriorityLabel(task.priority)}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <div className="text-sm font-bold text-slate-900">{task.assignedBy || selectedStaff.name}</div>
                                                                <div className="mt-1 text-xs font-medium text-slate-500">UEC, Coimbatore</div>
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <StatusHighlighter value={statusMeta.label} />
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <button
                                                                    onClick={() => setSelectedHistoryTask(task)}
                                                                    className="inline-flex items-center gap-2 rounded-2xl border border-[#0F969C]/20 bg-[#0F969C]/8 px-3 py-2 text-sm font-semibold text-[#294D61] hover:bg-[#0F969C]/12 transition-colors"
                                                                >
                                                                    <Clock3 className="h-4 w-4" />
                                                                    View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </div>
                    </section>
                </>
            )}

            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={`Schedule Task - ${(selectedStaff as any)?.name || ''}`}
            >
                <form onSubmit={handleSubmit(onSubmitTask)} className="flex max-h-full min-h-0 flex-col space-y-6">
                    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-2">
                    <Select
                        label="Task Approval Authority *"
                        {...register('approvalAuthorityId')}
                        error={errors.approvalAuthorityId?.message}
                        options={approvalAuthorityOptions}
                    />

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Task Details</h4>
                            <div className="space-y-5">
                                <Input
                                    label="Task Description *"
                                    placeholder="Enter task description"
                                    {...register('description')}
                                    error={errors.description?.message}
                                />

                                <Input
                                    label="Task Due Date *"
                                    type="date"
                                    {...register('dueDate')}
                                    error={errors.dueDate?.message}
                                />

                                <Select
                                    label="Task Priority *"
                                    {...register('priority')}
                                    error={errors.priority?.message}
                                    options={[
                                        { value: '', label: '-- Select the Task Priority --' },
                                        { value: 'HIGH', label: 'High' },
                                        { value: 'MEDIUM', label: 'Medium' },
                                        { value: 'LOW', label: 'Low' }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 border-t border-gray-200 bg-white pt-6 pb-2 sm:flex-row sm:justify-end">
                        {selectedStaff && !selectedStaffHasActiveLogin && (
                            <button
                                type="button"
                                onClick={() => setIsCreateLoginDrawerOpen(true)}
                                className="text-xs text-red-700 mr-auto self-center font-semibold underline underline-offset-2"
                            >
                                Create Login for Staff
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setIsDrawerOpen(false)
                                reset()
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium shadow-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createTask.isPending || !selectedStaffUserId}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm disabled:opacity-50 transition-colors"
                        >
                            {createTask.isPending ? 'Saving...' : 'Submit Task'}
                        </button>
                    </div>
                </form>
            </Drawer>

            <Drawer
                isOpen={!!selectedHistoryTask}
                onClose={() => setSelectedHistoryTask(null)}
                title={`Task Detail - ${selectedStaff?.name || ''}`}
            >
                {selectedHistoryTask ? (
                    <div className="space-y-5 p-1">
                        <div className="rounded-3xl border border-[#0F969C]/15 bg-[#F7FAFC] p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#294D61]">Task Overview</p>
                            <h4 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">{selectedHistoryTask.title}</h4>
                            <p className="mt-2 text-sm font-medium text-slate-500">{selectedHistoryTask.description || 'Scheduled staff task'}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Due Date</p>
                                <p className="mt-2 text-base font-bold text-slate-900">{formatDueDate(selectedHistoryTask.dueDate)}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Priority</p>
                                <p className={`mt-2 text-base font-bold ${getPriorityClassName(selectedHistoryTask.priority)}`}>{getPriorityLabel(selectedHistoryTask.priority)}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Created By</p>
                                <p className="mt-2 text-base font-bold text-slate-900">{selectedHistoryTask.assignedBy || 'System'}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">{formatCreatedAt(selectedHistoryTask.createdAt)}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
                                <StatusHighlighter value={taskStatusMeta[selectedHistoryTask.status]?.label || 'Assigned'} className="mt-2" />
                            </div>
                        </div>
                    </div>
                ) : null}
            </Drawer>
        </div>
    )
}
