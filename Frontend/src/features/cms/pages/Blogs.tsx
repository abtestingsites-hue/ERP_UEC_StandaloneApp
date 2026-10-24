import { useMemo, useState } from 'react'
import { Edit2, Image as ImageIcon, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { FilterSection } from '../../../components/FilterSection'
import { useBlogs, useCreateBlog, useDeleteBlog, useUpdateBlog } from '../hooks/useCMS'

export function Blogs() {
    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        unitName: 'Universal Edler Care - Coimbatore',
        title: '',
        date: '',
        keywords: '',
        description: ''
    })
    const [images, setImages] = useState<FileList | null>(null)

    const { data: blogsData = [], isLoading } = useBlogs()
    const createBlog = useCreateBlog()
    const updateBlog = useUpdateBlog()
    const deleteBlog = useDeleteBlog()

    const filteredBlogs = useMemo(() => {
        return blogsData.filter((blog: any) => {
            const refNo = blog.id?.slice(0, 8).toUpperCase() || ''
            const query = searchQuery.toLowerCase()
            return (
                String(blog.title || '').toLowerCase().includes(query) ||
                String(blog.unitName || '').toLowerCase().includes(query) ||
                refNo.toLowerCase().includes(query)
            )
        })
    }, [blogsData, searchQuery])

    const resetForm = () => {
        setFormData({
            unitName: 'Universal Edler Care - Coimbatore',
            title: '',
            date: '',
            keywords: '',
            description: ''
        })
        setImages(null)
        setEditingId(null)
    }

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this blog?')) {
            deleteBlog.mutate(id)
        }
    }

    const handleEdit = (blog: any) => {
        setEditingId(blog.id)
        setFormData({
            unitName: blog.unitName || 'Universal Edler Care - Coimbatore',
            title: blog.title || '',
            date: blog.date || '',
            keywords: blog.keywords || '',
            description: blog.description || ''
        })
        setImages(null)
        setIsDrawerOpen(true)
    }

    const handleAdd = () => {
        resetForm()
        setIsDrawerOpen(true)
    }

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload: any = { ...formData }
        if (images && images.length > 0) {
            payload.images = images
        }

        const mutation = editingId ? updateBlog.mutate : createBlog.mutate
        const variables = editingId ? { id: editingId, data: payload } : payload

        mutation(variables as any, {
            onSuccess: () => {
                setIsDrawerOpen(false)
                resetForm()
            }
        })
    }

    const columns: Column<any>[] = [
        {
            key: 'id',
            header: 'S.No',
            cell: (_, index) => <span>{index + 1}</span>
        },
        {
            key: 'unit',
            header: 'Unit',
            cell: (d) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{d.unitName || 'Universal Edler Care'}</div>
                    <div className="text-xs text-gray-500">{d.unitCity || 'Coimbatore'}</div>
                </div>
            )
        },
        { key: 'refNo', header: 'Reference No.', cell: (d) => d.id.slice(0, 8).toUpperCase() },
        { key: 'title', header: 'Event / Blog Title' },
        { key: 'date', header: 'Event / Blog Date' },
        {
            key: 'images',
            header: 'Total Images',
            cell: (d) => (
                <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{d.images?.length || 0}</span>
                </div>
            )
        },
        {
            key: 'action',
            header: 'Action',
            cell: (d) => (
                <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => handleEdit(d)} className="p-1.5 bg-primary-500 text-white rounded hover:bg-primary-600" title="Edit">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} disabled={deleteBlog.isPending} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50" title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ]

    const isSubmitting = createBlog.isPending || updateBlog.isPending

    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Latest News & Blogs" breadcrumbs={[{ label: 'Home' }, { label: 'CMS' }]} />

            <div className="mb-4 flex items-center justify-end">
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F969C] text-white font-semibold rounded-2xl shadow-[0_10px_24px_rgba(15,150,156,0.24)] hover:bg-[#294D61] transition-colors"
                >
                    + Add New Blog
                </button>
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search by name, reference..."
            />

            <DataTable
                data={filteredBlogs}
                columns={columns}
                keyExtractor={(d) => d.id}
                isLoading={isLoading}
                emptyStateMessage="No data available"
            />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingId ? 'Edit Blog' : 'Add New Blog'} size="xl">
                <form onSubmit={onSubmit} className="space-y-5">
                    <Select
                        label="Unit Name"
                        value={formData.unitName}
                        onChange={e => setFormData(p => ({ ...p, unitName: e.target.value }))}
                        options={[{ value: 'Universal Edler Care - Coimbatore', label: 'Universal Edler Care - Coimbatore' }]}
                    />
                    <Input
                        label="Event / Blog Title"
                        required
                        value={formData.title}
                        onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                        placeholder="Enter the Event / Blog Title"
                    />
                    <Input
                        label="Event / Blog Date"
                        type="date"
                        required
                        value={formData.date}
                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event / Blog Images
                            <span className="text-xs text-gray-500 ml-2">Accept only .webp / .jpg / .png / .jpeg</span>
                        </label>
                        <div className="flex border border-gray-300 rounded-md shadow-sm overflow-hidden mt-1">
                            <div className="flex-1 px-3 py-2 text-sm text-gray-500 bg-white border-r border-gray-300">
                                {images ? `${images.length} file(s) selected` : 'Choose the Event / Blog Images'}
                            </div>
                            <label className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition">
                                Browse
                                <input type="file" multiple className="hidden" accept=".webp,.jpg,.png,.jpeg" onChange={e => setImages(e.target.files)} />
                            </label>
                        </div>
                    </div>
                    <Input
                        label="Keywords"
                        required
                        value={formData.keywords}
                        onChange={e => setFormData(p => ({ ...p, keywords: e.target.value }))}
                        placeholder="Enter the Blog Keywords"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event / Blog Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                            className="w-full h-48 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Write the blog description"
                        />
                    </div>
                    <div className="pt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm()
                                setIsDrawerOpen(false)
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium shadow-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-[#0F969C] text-white rounded-md hover:bg-[#294D61] font-medium shadow-sm disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? 'Saving...' : editingId ? 'Update Blog' : 'Submit Blog'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
