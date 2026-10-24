import { useEffect, useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { useStaff } from '../../../hooks/useHRData'
import type { Staff } from '../../../types/staff'
import { useCreateTask } from '../hooks/useTasks'
import { assignTasksSchema, type AssignTasksFormValues } from '../schema'
import { useToast } from '../../../components/Toast'

export function AssignDailyTask() {
    const { data: staffList = [], isLoading: isLoadingStaff, refetch: refetchStaff } = useStaff()
    const activeStaffList = staffList.filter((staff) => {
        const status = String(staff.status || '').trim().toUpperCase()
        return !staff.isDeleted && status !== 'RESIGNED' && status !== 'TERMINATED'
    })
    const taskStaffList = activeStaffList
    const createTask = useCreateTask()
    const { toast } = useToast()

    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [viewingStaffId, setViewingStaffId] = useState<string | null>(null)
    const [loginRequiredStaff, setLoginRequiredStaff] = useState<Staff | null>(null)
    const [autoOpenForStaffId, setAutoOpenForStaffId] = useState<string | null>(null)

    const selectedStaff = useMemo(() =>
        taskStaffList.find(s => s.id === viewingStaffId), [taskStaffList, viewingStaffId]
    )
    const selectedStaffId = selectedStaff?.id ?? null
    const selectedStaffHasActiveLogin = !!selectedStaff?.user?.id && selectedStaff.user.isActive
    const selectedStaffUserId = selectedStaffHasActiveLogin ? selectedStaff!.user!.id : null

    const approvalAuthorityOptions = useMemo(() => [
        { value: '', label: 'Select approval authority' },
        ...taskStaffList
            .filter((s) => !!s.user?.id && s.user.isActive)
            .map((s) => ({ value: s.user!.id, label: `${s.name} (ID: ${s.empId})` }))
    ], [taskStaffList])

    // Setup form
    const { register, control, handleSubmit, reset, formState: { errors } } = useForm<AssignTasksFormValues>({
        resolver: zodResolver(assignTasksSchema),
        defaultValues: {
            approvalAuthorityId: '',
            tasks: [{ title: '' }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'tasks'
    })

    // Filter logic
    const filteredStaff = taskStaffList.filter(s =>
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.empId && s.empId.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const handleAddClick = (staff: Staff) => {
        if (!staff.user?.id || !staff.user.isActive) {
            toast({
                type: 'error',
                title: 'Staff Login Required',
                message: 'Staff login must exist and be active before scheduling tasks'
            })
            setLoginRequiredStaff(staff)
            return
        }
        setLoginRequiredStaff(null)
        setViewingStaffId(staff.id)
        reset({
            approvalAuthorityId: '',
            tasks: [{ title: '' }]
        })
        setIsDrawerOpen(true)
    }

    const onSubmit = async (data: AssignTasksFormValues) => {
        if (!selectedStaffId || !selectedStaffUserId) {
            toast({
                type: 'error',
                title: 'Staff Login Required',
                message: 'Staff login must exist and be active before scheduling tasks'
            })
            return
        }
        try {
            await Promise.all(data.tasks.map(t =>
                createTask.mutateAsync({
                    title: t.title,
                    description: '',
                    type: 'DAILY',
                    assigneeId: selectedStaffId,
                    approvalAuthorityId: data.approvalAuthorityId,
                    dueDate: new Date().toISOString()
                })
            ))
            setViewingStaffId(null)
            setIsDrawerOpen(false)
            reset()
        } catch (error) {
            const message = (error as any)?.response?.data?.message || ''
            if (
                selectedStaff &&
                (
                    message.includes('Staff Login Required') ||
                    message.includes('Staff has no login') ||
                    message.includes('Staff login is disabled')
                )
            ) {
                setLoginRequiredStaff(selectedStaff)
            }
            console.error(error)
        }
    }

    useEffect(() => {
        if (!autoOpenForStaffId) return
        const staff = taskStaffList.find((s) => s.id === autoOpenForStaffId)
        if (!staff?.user?.id || !staff.user.isActive) return

        setViewingStaffId(staff.id)
        setLoginRequiredStaff(null)
        reset({
            approvalAuthorityId: '',
            tasks: [{ title: '' }]
        })
        setIsDrawerOpen(true)
        setAutoOpenForStaffId(null)
    }, [autoOpenForStaffId, taskStaffList, reset])

    const columns: Column<Staff>[] = [
        {
            key: 'sno',
            header: 'S.No',
            cell: (_, index) => <span className="text-gray-500 font-medium">{index + 1}</span>
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
                    <span className="font-bold text-gray-900 dark:text-white">{row.name}</span>
                    <span className="text-xs text-gray-500">ID: {row.empId}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">UEC, Coimbatore</span>
                </div>
            )
        },
        {
            key: 'approvalAuthority',
            header: 'Approval Authority',
            cell: () => (
                <span className="text-sm text-gray-500">ID:</span>
            )
        },
        {
            key: 'taskAssigned',
            header: 'Task Assigned',
            cell: () => (
                <span className="text-sm text-gray-500">No Assigned Task</span>
            )
        },
        {
            key: 'action',
            header: '',
            cell: (row) => (
                <button
                    onClick={() => handleAddClick(row)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                >
                    Add Daily Task
                </button>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Assign Daily Task to Staff's"
                breadcrumbs={[
                    { label: 'Task Log' },
                    { label: 'Assign Daily Task' }
                ]}
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search staff by name or ID..."
            />

            {loginRequiredStaff && (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 flex items-center justify-between gap-3">
                    <p className="text-sm text-red-700 font-medium">
                        Staff login must exist and be active before scheduling tasks
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsCreateLoginDrawerOpen(true)}
                        className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                    >
                        Create Login for Staff
                    </button>
                </div>
            )}

            {isLoadingStaff ? (
                <div className="animate-pulse bg-white border border-gray-200 shadow-sm rounded-lg h-64 p-6">
                    <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                </div>
            ) : (
                <DataTable
                    data={filteredStaff}
                    columns={columns}
                    keyExtractor={(s) => s.id}
                    emptyStateMessage="No staff found."
                />
            )}

            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={`Assign Daily Task - ${selectedStaff?.name || ''}`}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Select
                        label="Task Approval Authority"
                        {...register('approvalAuthorityId')}
                        error={errors.approvalAuthorityId?.message}
                        options={approvalAuthorityOptions}
                    />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white">Tasks</h4>
                        </div>

                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <Input
                                        label={`Task ${index + 1}`}
                                        placeholder="Enter task description"
                                        {...register(`tasks.${index}.title`)}
                                        error={errors?.tasks?.[index]?.title?.message}
                                    />
                                </div>
                                {fields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="mt-7 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => append({ title: '' })}
                            className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 font-medium hover:border-primary-500 hover:text-primary-600 transition-colors"
                        >
                            + Add Another Task
                        </button>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 mt-auto">
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
                            onClick={() => setIsDrawerOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium shadow-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createTask.isPending || !selectedStaffUserId}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm disabled:opacity-50 transition-colors"
                        >
                            {createTask.isPending ? 'Saving...' : 'Save Tasks'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
