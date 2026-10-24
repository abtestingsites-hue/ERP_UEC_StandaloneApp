import { useMemo } from 'react'
import { CalendarClock, FileText, UserCircle, Activity, HeartPulse, Pill, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../../components/PageHeader'
import { useMyShift } from '../hooks/useMyShift'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { formatDateTime } from '../../healthcare/utils'
import { api } from '../../../lib/axios'
import { useToast } from '../../../components/Toast'

export function MyShiftDashboard() {
    const { data: shiftData, isLoading } = useMyShift()
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const kpis = useMemo(() => {
        if (!shiftData) return []
        const activeAssignments = (shiftData.assignments || []).length
        const totalTasks = (shiftData.tasks || []).length
        const pendingTasks = (shiftData.tasks || []).filter((t: any) => t.status === 'PENDING').length

        return [
            { title: 'My Active Assignments', value: activeAssignments, icon: UserCircle, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
            { title: 'Total Tasks Today', value: totalTasks, icon: FileText, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { title: 'Pending Tasks', value: pendingTasks, icon: CalendarClock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
        ]
    }, [shiftData])

    const updateTaskMutation = useMutation({
        mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
            const { data } = await api.patch(`/daily-operations/tasks/${taskId}`, { status })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-shift'] })
            toast({ type: 'success', title: 'Task Updated', message: 'Task status updated successfully.' })
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || 'Failed to update task'
            toast({ type: 'error', title: 'Update Failed', message: msg })
        }
    })

    const handleTaskAction = (taskId: string, currentStatus: string) => {
        if (currentStatus === 'PENDING') {
            updateTaskMutation.mutate({ taskId, status: 'IN_PROGRESS' })
        } else if (currentStatus === 'IN_PROGRESS') {
            updateTaskMutation.mutate({ taskId, status: 'COMPLETED' })
        }
    }

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="My Shift"
                subtitle="Your daily assignments and operational tasks."
                breadcrumbs={[{ label: 'Medical' }, { label: 'My Shift' }]}
            />

            {!isLoading && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {kpis.map((kpi, idx) => (
                        <div key={idx} className={`rounded-2xl border ${kpi.border} ${kpi.bg} p-5 shadow-sm`}>
                            <div className="flex items-center gap-4">
                                <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ${kpi.color}`}>
                                    <kpi.icon className="h-6 w-6" />
                                </span>
                                <div>
                                    <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{kpi.title}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && shiftData && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-slate-800">Today's Assignments</h3>
                        {shiftData.assignments.length === 0 ? (
                            <p className="text-sm text-slate-500">No assignments for today.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {shiftData.assignments.map((assignment: any) => (
                                    <div key={assignment.id} className="rounded-lg border border-slate-100 bg-slate-50 p-5 shadow-sm">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-lg font-semibold text-slate-800">
                                                    {assignment.patientId 
                                                        ? (assignment.patient?.name || 'Unknown Patient') 
                                                        : (assignment.dutyType === 'VISIT' ? 'VISIT DUTY' : assignment.dutyType)}
                                                </h4>
                                                <p className="text-sm text-slate-500">{assignment.role} &bull; {assignment.dutyType}</p>
                                            </div>
                                            <StatusHighlighter status={assignment.status} />
                                        </div>
                                        
                                        {!assignment.patientId && (
                                            <div className="mb-2 text-sm text-slate-600">
                                                <p><span className="font-medium">Service Type:</span> External Allocation / Field Visit</p>
                                                {assignment.location && <p><span className="font-medium">Location:</span> {assignment.location}</p>}
                                                {assignment.notes && <p><span className="font-medium">Notes:</span> {assignment.notes}</p>}
                                            </div>
                                        )}

                                        <div className="mb-4 flex flex-col gap-1 text-sm text-slate-600">
                                            <p><span className="font-medium">Shift Start:</span> {formatDateTime(assignment.startAt)}</p>
                                            <p><span className="font-medium">Shift End:</span> {assignment.endAt ? formatDateTime(assignment.endAt) : 'Ongoing'}</p>
                                        </div>
                                        
                                        {assignment.patientId && (
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    to={`/patient-care/adl?patientId=${assignment.patientId}&assignmentId=${assignment.id}`}
                                                    className="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                                >
                                                    <Activity className="h-4 w-4" />
                                                    Record ADL
                                                </Link>
                                                <Link
                                                    to={`/nursing-care/vitals?patientId=${assignment.patientId}&assignmentId=${assignment.id}`}
                                                    className="flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                >
                                                    <HeartPulse className="h-4 w-4" />
                                                    Record Vitals
                                                </Link>
                                                <Link
                                                    to={`/nursing-care/medication-schedule?patientId=${assignment.patientId}&assignmentId=${assignment.id}`}
                                                    className="flex items-center gap-1 rounded-md bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                                                >
                                                    <Pill className="h-4 w-4" />
                                                    Medication
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-slate-800">My Operational Tasks</h3>
                        {shiftData.tasks.length === 0 ? (
                            <p className="text-sm text-slate-500">No tasks generated for today.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {shiftData.tasks.map((task: any) => (
                                    <div key={task.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                        <div className="mb-2 flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-700">{task.title}</h4>
                                                <p className="text-xs text-slate-500">{task.patient?.name ? `Patient: ${task.patient.name}` : ''}</p>
                                            </div>
                                            <StatusHighlighter status={task.status} />
                                        </div>
                                        <div className="mb-3 text-xs text-slate-600">
                                            <p><span className="font-medium">Phase:</span> {task.phase.replace(/_/g, ' ')}</p>
                                        </div>
                                        <div className="flex justify-end">
                                            {task.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleTaskAction(task.id, task.status)}
                                                    disabled={updateTaskMutation.isPending}
                                                    className="rounded-md bg-amber-500 px-3 py-1 text-sm font-medium text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 disabled:opacity-50"
                                                >
                                                    Start Task
                                                </button>
                                            )}
                                            {task.status === 'IN_PROGRESS' && (
                                                <button
                                                    onClick={() => handleTaskAction(task.id, task.status)}
                                                    disabled={updateTaskMutation.isPending}
                                                    className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
                                                >
                                                    Complete Task
                                                </button>
                                            )}
                                            {task.status === 'COMPLETED' && (
                                                <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Completed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
