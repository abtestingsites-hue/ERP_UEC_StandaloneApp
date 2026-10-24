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
import { usePaymentCategorys, useCreatePaymentCategory, useUpdatePaymentCategory, useDeletePaymentCategory } from '../services/payment-category'

export function PaymentCategoryMaster() {
    const { data: dataArr = [], isLoading } = usePaymentCategorys()
    const createMutation = useCreatePaymentCategory()
    const updateMutation = useUpdatePaymentCategory()
    const deleteMutation = useDeletePaymentCategory()

    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<any>(null)

    const filteredData = useMemo(() => {
        return dataArr.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [dataArr, searchQuery])

    const handleAdd = () => { setSelectedItem(null); setIsDrawerOpen(true); }
    const handleEdit = (item: any) => { setSelectedItem(item); setIsDrawerOpen(true); }
    const handleDelete = (item: any) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    }

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            await deleteMutation.mutateAsync(itemToDelete.id)
            setDeleteModalOpen(false)
            setItemToDelete(null)
        }
    }

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const payload = {
            code: formData.get('code') as string,
            name: formData.get('name') as string,
            type: formData.get('type') as "INCOME" | "EXPENSE",
            description: formData.get('description') as string || null,
            status: formData.get('status') === 'Active',
        }
        try {
            if (selectedItem) {
                await updateMutation.mutateAsync({ id: selectedItem.id, data: payload })
            } else {
                await createMutation.mutateAsync(payload)
            }
            setIsDrawerOpen(false)
        } catch (error) {
            console.error('Failed to save', error)
        }
    }

    const columns: Column<any>[] = [
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Category Name', sortable: true },
        { key: 'type', header: 'Type (Income/Expense)' },
        { key: 'description', header: 'Description' },
        { key: 'status', header: 'Status', cell: (d) => <StatusHighlighter value={d.status} /> }
    ]

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader title="Payment Category Master" breadcrumbs={[{ label: 'Master' }, { label: 'Payment Categories' }]} />
            <ActionBar onAdd={handleAdd} addLabel="Add Category" />
            <FilterSection searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} searchPlaceholder="Search categories..." />
            <DataTable data={filteredData} columns={columns} isLoading={isLoading} keyExtractor={(d) => d.id} actions={(item) => (
                <div className="flex gap-2 justify-end">
                    <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/5 rounded" title="Edit"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(item)} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-white/5 rounded" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg></button>
                </div>
            )} />
            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={selectedItem ? "Edit Category" : "Add New Category"}>
                <form onSubmit={onSubmit} className="space-y-4">
                    <Input name="code" label="Category Code" defaultValue={selectedItem?.code} required />
                    <Input name="name" label="Category Name" defaultValue={selectedItem?.name} required />
                    <Select name="type" label="Flow Type" defaultValue={selectedItem?.type || 'INCOME'} options={[{ value: 'INCOME', label: 'INCOME' }, { value: 'EXPENSE', label: 'EXPENSE' }]} />
                    <Input name="description" label="Description" defaultValue={selectedItem?.description} />
                    <Select name="status" label="Status" defaultValue={selectedItem ? (selectedItem.status ? 'Active' : 'Inactive') : 'Active'} options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} />
                    <div className="pt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm transition-all">{selectedItem ? "Update" : "Save"}</button>
                    </div>
                </form>
            </Drawer>
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Category"
                type="danger"
                message={`Are you sure you want to delete ${itemToDelete?.name}?`}
                onConfirm={handleDeleteConfirm}
                confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            />
        </div>
    )
}
