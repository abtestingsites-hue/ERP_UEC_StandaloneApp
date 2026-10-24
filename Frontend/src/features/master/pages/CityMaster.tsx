import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Edit2, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Drawer } from '../../../components/Drawer'
import { Modal } from '../../../components/Modal'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { useCities, useAddCity, useUpdateCity, useDeleteCity } from '../hooks/useCity'
import { citySchema, type CityFormValues } from '../schema'
import type { City } from '../types'

export function CityMaster() {
    const { data: cities = [], isLoading } = useCities()
    const addCity = useAddCity()
    const updateCity = useUpdateCity()
    const deleteCity = useDeleteCity()

    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingCity, setEditingCity] = useState<City | null>(null)

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [cityToDelete, setCityToDelete] = useState<City | null>(null)

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CityFormValues>({
        resolver: zodResolver(citySchema),
        defaultValues: {
            name: '',
            state: '',
            country: '',
            status: 'active'
        }
    })

    // Filter logic
    const filteredCities = cities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.state.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleAdd = () => {
        setEditingCity(null)
        reset({ name: '', state: '', country: '', status: 'active' })
        setIsDrawerOpen(true)
    }

    const handleEdit = (city: City) => {
        setEditingCity(city)
        reset({
            name: city.name,
            state: city.state,
            country: city.country,
            status: city.status
        })
        setIsDrawerOpen(true)
    }

    const onSubmit = (data: CityFormValues) => {
        if (editingCity) {
            updateCity.mutate({ id: editingCity.id, data }, {
                onSuccess: () => setIsDrawerOpen(false)
            })
        } else {
            addCity.mutate(data, {
                onSuccess: () => setIsDrawerOpen(false)
            })
        }
    }

    const handleDeleteConfirm = () => {
        if (cityToDelete) {
            deleteCity.mutate(cityToDelete.id, {
                onSuccess: () => {
                    setDeleteModalOpen(false)
                    setCityToDelete(null)
                }
            })
        }
    }

    const columns: Column<City>[] = [
        { key: 'serial', header: 'S.No', cell: () => null }, // Replaced dynamically later
        { key: 'name', header: 'City Name', sortable: true },
        { key: 'state', header: 'State', sortable: true },
        { key: 'country', header: 'Country', sortable: true },
        { key: 'status', header: 'Status', cell: (c) => <StatusHighlighter value={c.status} /> }
    ]

    // Fix S.No mapping by adjusting the columns cell approach
    columns[0].cell = (item) => filteredCities.findIndex(c => c.id === item.id) + 1

    return (
        <div className="flex flex-col h-full bg-transparent dark:bg-black">
            <PageHeader
                title="City Master"
                breadcrumbs={[
                    { label: 'Master Data' },
                    { label: 'City Master', href: '/master/city' }
                ]}
            />

            <ActionBar
                onAdd={handleAdd}
                addLabel="Add City"
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search city or state..."
            />

            {isLoading ? (
                <div className="animate-pulse bg-white dark:bg-black border border-gray-200 dark:border-white/10 shadow-sm rounded-lg h-64 p-6">
                    <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                </div>
            ) : (
                <DataTable
                    data={filteredCities}
                    columns={columns}
                    keyExtractor={(c) => c.id}
                    emptyStateMessage="No cities found."
                    actions={(c) => (
                        <>
                            <button
                                onClick={() => handleEdit(c)}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/5 rounded"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setCityToDelete(c)
                                    setDeleteModalOpen(true)
                                }}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-white/5 rounded"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </>
                    )}
                />
            )}

            {/* Drawer Form */}
            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={editingCity ? "Edit City" : "Add New City"}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="City Name"
                        {...register('name')}
                        error={errors.name?.message}
                    />
                    <Select
                        label="State"
                        {...register('state')}
                        error={errors.state?.message}
                        options={[
                            { value: 'Maharashtra', label: 'Maharashtra' },
                            { value: 'Delhi', label: 'Delhi' },
                            { value: 'Karnataka', label: 'Karnataka' },
                            { value: 'Tamil Nadu', label: 'Tamil Nadu' }
                        ]}
                        placeholder="Select a state"
                    />
                    <Select
                        label="Country"
                        {...register('country')}
                        error={errors.country?.message}
                        options={[
                            { value: 'India', label: 'India' },
                            { value: 'USA', label: 'USA' }
                        ]}
                        placeholder="Select a country"
                    />
                    <Select
                        label="Status"
                        {...register('status')}
                        error={errors.status?.message}
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' }
                        ]}
                    />

                    <div className="pt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(false)}
                            className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-white/5 font-medium shadow-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={addCity.isPending || updateCity.isPending}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm disabled:opacity-50 transition-colors"
                        >
                            {addCity.isPending || updateCity.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Drawer>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete City"
                type="danger"
                message={`Are you sure you want to delete ${cityToDelete?.name}? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                confirmLabel={deleteCity.isPending ? 'Deleting...' : 'Delete'}
            />
        </div>
    )
}
