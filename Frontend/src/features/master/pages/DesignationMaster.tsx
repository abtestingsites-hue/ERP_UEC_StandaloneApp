import { useState, useMemo } from 'react'
import { Edit2 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Drawer } from '../../../components/Drawer'
import { Modal } from '../../../components/Modal'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'

export function DesignationMaster() {
    const [data, setData] = useState([
        { id: '1', title: 'Senior Doctor', level: 'L1', basicPayRange: '₹80k - ₹1.5L', status: 'Active' },
        { id: '2', title: 'Head Nurse', level: 'L2', basicPayRange: '₹40k - ₹70k', status: 'Active' },
    ])

    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<any>(null)

    const filteredData = useMemo(() => {
        return data.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [data, searchQuery])

    const handleAdd = () => { setSelectedItem(null); setIsDrawerOpen(true); }
    const handleEdit = (item: any) => { setSelectedItem(item); setIsDrawerOpen(true); }
    const handleDelete = (item: any) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    }

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            setData(data.filter(d => d.id !== itemToDelete.id))
            setDeleteModalOpen(false)
            setItemToDelete(null)
        }
    }
    const onSubmit = (e: React.FormEvent) => { e.preventDefault(); setIsDrawerOpen(false); }

    const columns: Column<any>[] = [
        { key: 'title', header: 'Designation Title', sortable: true },
        { key: 'level', header: 'Senority Level', sortable: true },
        { key: 'basicPayRange', header: 'Pay Scale Bracket' },
        { key: 'status', header: 'Status', cell: (d) => <StatusHighlighter value={d.status} /> }
    ]

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader title="Designation Master" breadcrumbs={[{ label: 'Master' }, { label: 'Designations' }]} />
            <ActionBar onAdd={handleAdd} addLabel="Add Designation" />
            <FilterSection searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} searchPlaceholder="Search..." />
            <DataTable data={filteredData} columns={columns} keyExtractor={(d) => d.id} actions={(d) => (
                <div className="flex gap-2 justify-end">
                    <button onClick={() => handleEdit(d)} className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/5 rounded" title="Edit"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(d)} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-white/5 rounded" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg></button>
                </div>
            )} />
            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={selectedItem ? "Edit Designation" : "Add Designation"}>
                <form onSubmit={onSubmit} className="space-y-4">
                    <Input label="Designation Title" defaultValue={selectedItem?.title} required />
                    <Select label="Senority Level" defaultValue={selectedItem?.level || 'L1'} options={[{ value: 'L1', label: 'L1 (Management)' }, { value: 'L2', label: 'L2 (Heads)' }, { value: 'L3', label: 'L3 (Staff)' }]} />
                    <Input label="Basic Pay Bracket" defaultValue={selectedItem?.basicPayRange} placeholder="e.g. ₹50k - ₹80k" />
                    <Select label="Status" defaultValue={selectedItem?.status || 'Active'} options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} />
                    <div className="pt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm transition-all">Save</button>
                    </div>
                </form>
            </Drawer>
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Designation"
                type="danger"
                message={`Are you sure you want to delete ${itemToDelete?.title}?`}
                onConfirm={handleDeleteConfirm}
                confirmLabel="Delete"
            />
        </div>
    )
}
