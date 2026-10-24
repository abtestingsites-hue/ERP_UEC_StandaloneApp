import { useState, useMemo } from 'react'
import { Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '../../../components/Toast'

// Localized Mock Interface for standard City Master demonstration
// until backend hrService syncs `useHolidays`
interface Holiday {
    id: string
    date: string
    name: string
    type: 'National' | 'Optional' | 'Festival'
    remarks?: string
}

const mockHolidays: Holiday[] = [
    { id: '1', date: '2026-01-01', name: 'New Year', type: 'National', remarks: 'New Year Holiday' },
    { id: '2', date: '2026-08-15', name: 'Independence Day', type: 'National', remarks: 'National Holiday' }
]

const holidaySchema = z.object({
    date: z.string().min(1, 'Holiday Date is required'),
    name: z.string().min(2, 'Holiday Name must be at least 2 characters'),
    type: z.enum(['National', 'Optional', 'Festival']),
    remarks: z.string().optional()
})

type HolidayFormValues = z.infer<typeof holidaySchema>

export function HolidayMapping() {
    const { toast } = useToast()

    // Simulate query loading local data
    const [holidays, setHolidays] = useState<Holiday[]>(mockHolidays)
    const [isLoading] = useState(false)

    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)

    const filteredHolidays = useMemo(() => {
        return holidays.filter(h =>
            (h.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (h.type || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [holidays, searchQuery])

    const { register, handleSubmit, reset, formState: { errors } } = useForm<HolidayFormValues>({
        resolver: zodResolver(holidaySchema),
        defaultValues: {
            date: '',
            name: '',
            type: 'National',
            remarks: ''
        }
    })

    const handleAdd = () => {
        setEditingHoliday(null)
        reset({ date: '', name: '', type: 'National', remarks: '' })
        setIsDrawerOpen(true)
    }

    const handleEdit = (holiday: Holiday) => {
        setEditingHoliday(holiday)
        reset({
            date: holiday.date,
            name: holiday.name,
            type: holiday.type,
            remarks: holiday.remarks || ''
        })
        setIsDrawerOpen(true)
    }

    const handleDelete = (holidayId: string) => {
        // Implement delete mutation logic
        setHolidays(prev => prev.filter(h => h.id !== holidayId))
        toast({ type: 'success', title: 'Deleted', message: 'Holiday mapped deleted successfully.' })
    }

    const onSubmit = (data: HolidayFormValues) => {
        if (editingHoliday) {
            // Update logic
            setHolidays(prev => prev.map(h => h.id === editingHoliday.id ? { ...h, ...data } : h))
            toast({ type: 'success', title: 'Updated', message: 'Holiday updated successfully.' })
        } else {
            // Create logic
            setHolidays(prev => [...prev, { id: Date.now().toString(), name: data.name, date: data.date, type: data.type, remarks: data.remarks }])
            toast({ type: 'success', title: 'Created', message: 'Holiday added successfully.' })
        }
        setIsDrawerOpen(false)
        reset()
    }

    const columns: Column<Holiday>[] = [
        {
            key: 'sno',
            header: 'S.No',
            cell: (_, index) => <span className="text-gray-500 font-medium text-sm">{index + 1}</span>
        },
        {
            key: 'date',
            header: 'Holiday Date',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{new Date(row.date).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            key: 'name',
            header: 'Holiday Name',
            cell: (row) => <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{row.name}</span>
        },
        {
            key: 'type',
            header: 'Holiday Type',
            cell: (row) => (
                <span className={`px-2 py-1 text-xs font-bold rounded shadow-sm uppercase
                    ${row.type === 'National' ? 'bg-blue-100 text-blue-700' : ''}
                    ${row.type === 'Optional' ? 'bg-orange-100 text-orange-700' : ''}
                    ${row.type === 'Festival' ? 'bg-green-100 text-green-700' : ''}
                `}>
                    {row.type}
                </span>
            )
        },
        {
            key: 'remarks',
            header: 'Remarks',
            cell: (row) => <span className="text-sm text-gray-500">{row.remarks || '-'}</span>
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Holiday"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Holiday"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ]

    return (
        <div className="flex min-h-full min-w-0 flex-col bg-transparent pb-4 dark:bg-black">
            <PageHeader
                title="Holiday Mapping"
                breadcrumbs={[
                    { label: 'Human Resource' },
                    { label: 'Holiday Mapping' }
                ]}
            />

            <ActionBar
                onAdd={handleAdd}
                addLabel="Add New Holiday"
            />

            <div className="mt-4 flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-black">
                <div className="flex flex-col p-4 2xl:p-5">
                    <FilterSection
                        searchQuery={searchQuery}
                        onSearchChange={(e) => setSearchQuery(e.target.value)}
                        searchPlaceholder="Search by holiday name or type..."
                    />

                    {isLoading ? (
                        <div className="animate-pulse flex space-x-4 mt-6">
                            <div className="h-8 bg-gray-200 rounded w-full"></div>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <DataTable
                                data={filteredHolidays}
                                columns={columns}
                                keyExtractor={(h) => h.id}
                                emptyStateMessage="No holidays found."
                            />
                        </div>
                    )}
                </div>
            </div>

            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={editingHoliday ? "Edit Holiday" : "Add New Holiday"}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-full min-h-0 flex-col space-y-6">
                    <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                        <Input
                            label="Holiday Date *"
                            type="date"
                            {...register('date')}
                            error={errors.date?.message}
                        />

                        <Input
                            label="Holiday Name *"
                            placeholder="e.g. Christmas Day"
                            {...register('name')}
                            error={errors.name?.message}
                        />

                        <Select
                            label="Holiday Type *"
                            {...register('type')}
                            error={errors.type?.message}
                            options={[
                                { value: 'National', label: 'National' },
                                { value: 'Optional', label: 'Optional' },
                                { value: 'Festival', label: 'Festival' }
                            ]}
                        />

                        <Input
                            label="Remarks"
                            placeholder="Optional holiday remarks"
                            {...register('remarks')}
                            error={errors.remarks?.message}
                        />
                    </div>
                    <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 mt-auto bg-white dark:bg-black pb-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsDrawerOpen(false)
                                reset()
                            }}
                            className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-white/5 font-medium shadow-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm transition-colors"
                        >
                            {editingHoliday ? 'Update Holiday' : 'Save Holiday'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
