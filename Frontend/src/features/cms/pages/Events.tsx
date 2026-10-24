import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'

export function Events() {
    const [data, setData] = useState([
        { id: '1', title: 'Annual Health Camp', date: '2023-11-15', location: 'Sunrise Unit 1', status: 'Published' },
        { id: '2', title: 'Staff Training Seminar', date: '2023-12-05', location: 'Main HQ', status: 'Draft' },
    ])

    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const filteredData = useMemo(() => {
        return data.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [data, searchQuery])

    const handleAdd = () => setIsDrawerOpen(true)
    const onSubmit = (e: React.FormEvent) => { e.preventDefault(); setIsDrawerOpen(false); }

    const handleDelete = (id: string) => {
        setData(prev => prev.filter(item => item.id !== id))
    }

    const columns: Column<any>[] = [
        { key: 'title', header: 'Event Title', sortable: true },
        { key: 'date', header: 'Event Date', sortable: true },
        { key: 'location', header: 'Location' },
        { key: 'status', header: 'Status', cell: (d) => <StatusHighlighter value={d.status} /> }
    ]

    return (
        <div className="flex flex-col h-full space-y-6">
            <PageHeader title="Events Management" breadcrumbs={[{ label: 'CMS' }, { label: 'Events' }]} />
            <div className="flex justify-end gap-3 mb-4">
                <button onClick={handleAdd} className="inline-flex items-center px-4 py-2.5 shadow-sm text-[13.5px] font-medium rounded-xl text-white bg-gradient-to-r from-[#0F969C] to-[#294D61] hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(15,150,156,0.22)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F969C] transition-all active:scale-95 border border-transparent">
                    <Plus className="w-4 h-4 mr-2" /> Create Event
                </button>
            </div>
            <FilterSection searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} searchPlaceholder="Search events..." />
            <DataTable data={filteredData} columns={columns} keyExtractor={(d) => d.id} actions={(item) => (
                <button onClick={() => handleDelete(item.id)} className="p-1 px-2 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200">
                    <Trash2 className="w-4 h-4" />
                </button>
            )} />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Create New Event">
                <form onSubmit={onSubmit} className="space-y-4">
                    <Input label="Event Title" required />
                    <Input label="Event Date" type="date" required />
                    <Input label="Location" required />
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Description</label>
                        <textarea className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Write event details here..." required />
                    </div>
                    <div className="pt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Publish Event</button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
