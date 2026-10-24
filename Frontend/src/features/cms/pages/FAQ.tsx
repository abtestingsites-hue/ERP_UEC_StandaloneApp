import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Edit2, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { faqSchema, type FAQFormValues } from '../schema'
import type { FAQ } from '../types'

export function FAQPage() {
    const [data] = useState<FAQ[]>([
        { id: '1', question: 'What are the visiting hours?', answer: 'Visiting hours are from 10:00 AM to 6:00 PM daily. Please notify us in advance.', category: 'General', displayOrder: 1, status: 'Active' },
        { id: '2', question: 'How is the food menu decided?', answer: 'The menu is decided by our expert nutritionists taking into account all dietary restrictions of the residents.', category: 'Dining', displayOrder: 2, status: 'Active' }
    ])

    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FAQFormValues>({
        resolver: zodResolver(faqSchema) as any,
        defaultValues: { question: '', answer: '', category: 'General', displayOrder: 1, status: 'Active' }
    })

    const filteredData = useMemo(() => {
        return data.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [data, searchQuery])

    const onSubmit = (formData: FAQFormValues) => {
        console.log('Saving FAQ...', formData)
        setIsDrawerOpen(false)
    }

    const columns: Column<FAQ>[] = [
        { key: 'displayOrder', header: 'Order', sortable: true },
        { key: 'question', header: 'Question' },
        { key: 'category', header: 'Category' },
        { key: 'status', header: 'Status', cell: (f) => <StatusHighlighter value={f.status} /> }
    ]

    return (
        <div className="flex flex-col h-full space-y-6">
            <PageHeader title="FAQ Management" breadcrumbs={[{ label: 'CMS' }, { label: 'FAQ' }]} />

            <ActionBar onAdd={() => { reset(); setIsDrawerOpen(true) }} addLabel="Add FAQ" />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search questions..."
            />

            <DataTable
                data={filteredData}
                columns={columns}
                keyExtractor={(f) => f.id}
                actions={() => (
                    <>
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </>
                )}
            />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Manage FAQ">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                        <Select
                            label="Category" {...register('category')} error={errors.category?.message}
                            options={[{ value: 'General', label: 'General' }, { value: 'Dining', label: 'Dining' }, { value: 'Medical', label: 'Medical' }, { value: 'Facilities', label: 'Facilities' }]}
                        />
                        <Input label="Question" {...register('question')} error={errors.question?.message} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer</label>
                            <textarea {...register('answer')} rows={4} className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
                            {errors.answer && <p className="mt-1 text-sm text-red-600">{errors.answer.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Display Order" type="number" {...register('displayOrder')} error={errors.displayOrder?.message} />
                            <Select
                                label="Status" {...register('status')} error={errors.status?.message}
                                options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 bg-white hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Save FAQ</button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
