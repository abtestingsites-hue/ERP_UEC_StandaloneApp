import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Edit2, Trash2, Eye } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Drawer } from '../../../components/Drawer'
import { Modal } from '../../../components/Modal'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { useUnits, useAddUnit, useUpdateUnit, useDeleteUnit } from '../hooks/useUnit'
import { useCreateLocation, useLocationSearch } from '../hooks/useLocation'
import { unitSchema, type UnitFormValues } from '../schema'
import type { Unit } from '../types'
import { useDebounce } from '../../../hooks/useDebounce'

export function UnitMaster() {
    const { data: units = [], isLoading } = useUnits()
    const addUnit = useAddUnit()
    const updateUnit = useUpdateUnit()
    const deleteUnit = useDeleteUnit()
    const createLocation = useCreateLocation()

    const [searchQuery, setSearchQuery] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewUnit, setPreviewUnit] = useState<Unit | null>(null)

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null)
    const [locationQuery, setLocationQuery] = useState('')
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
    const [showAddLocationForm, setShowAddLocationForm] = useState(false)
    const [newLocationDraft, setNewLocationDraft] = useState({
        name: '',
        state: '',
        country: 'India',
        pincode: ''
    })

    const debouncedLocationQuery = useDebounce(locationQuery, 300)
    const { data: locationSuggestions = [], isFetching: isSearchingLocations } = useLocationSearch(debouncedLocationQuery)

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UnitFormValues>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            name: '',
            shortName: '',
            type: '',
            locationId: '',
            locationLabel: '',
            address: '',
            pincode: '',
            email: '',
            phone: '',
            status: 'active'
        }
    })

    const selectedLocationId = watch('locationId')

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.unitId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.location.label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const canAddTypedLocation = locationQuery.trim().length >= 2 &&
        !locationSuggestions.some(location =>
            location.label.toLowerCase() === locationQuery.trim().toLowerCase()
        )

    const resetLocationState = () => {
        setLocationQuery('')
        setIsLocationPickerOpen(false)
        setShowAddLocationForm(false)
        setNewLocationDraft({
            name: '',
            state: '',
            country: 'India',
            pincode: ''
        })
    }

    const handleAdd = () => {
        setEditingUnit(null)
        reset({
            name: '',
            shortName: '',
            type: '',
            locationId: '',
            locationLabel: '',
            address: '',
            pincode: '',
            email: '',
            phone: '',
            status: 'active'
        })
        resetLocationState()
        setIsDrawerOpen(true)
    }

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit)
        reset({
            name: unit.name,
            shortName: unit.shortName,
            type: unit.type,
            locationId: unit.locationId,
            locationLabel: unit.location.label,
            address: unit.address,
            pincode: unit.pincode,
            email: unit.email,
            phone: unit.phone,
            status: unit.status
        })
        setLocationQuery(unit.location.label)
        setIsLocationPickerOpen(false)
        setShowAddLocationForm(false)
        setIsDrawerOpen(true)
    }

    const onSubmit = (data: UnitFormValues) => {
        if (editingUnit) {
            updateUnit.mutate({ id: editingUnit.id, data }, {
                onSuccess: () => setIsDrawerOpen(false)
            })
        } else {
            addUnit.mutate(data, {
                onSuccess: () => setIsDrawerOpen(false)
            })
        }
    }

    const handleLocationInputChange = (value: string) => {
        setLocationQuery(value)
        setValue('locationLabel', value, { shouldValidate: true, shouldDirty: true })
        setIsLocationPickerOpen(true)
        setShowAddLocationForm(false)

        if (selectedLocationId) {
            setValue('locationId', '', { shouldValidate: true, shouldDirty: true })
        }
    }

    const handleSelectLocation = (location: Unit['location']) => {
        setLocationQuery(location.label)
        setValue('locationId', location.id, { shouldValidate: true, shouldDirty: true })
        setValue('locationLabel', location.label, { shouldValidate: true, shouldDirty: true })
        setIsLocationPickerOpen(false)
        setShowAddLocationForm(false)
    }

    const handleOpenAddLocation = () => {
        setShowAddLocationForm(true)
        setNewLocationDraft({
            name: locationQuery.trim(),
            state: '',
            country: 'India',
            pincode: ''
        })
    }

    const handleCreateLocation = async () => {
        const createdLocation = await createLocation.mutateAsync({
            name: newLocationDraft.name.trim(),
            state: newLocationDraft.state.trim(),
            country: newLocationDraft.country.trim(),
            pincode: newLocationDraft.pincode.trim() || undefined
        })

        handleSelectLocation(createdLocation)
    }

    const handleDeleteConfirm = () => {
        if (unitToDelete) {
            deleteUnit.mutate(unitToDelete.id, {
                onSuccess: () => {
                    setDeleteModalOpen(false)
                    setUnitToDelete(null)
                }
            })
        }
    }

    const columns: Column<Unit>[] = [
        { key: 'serial', header: 'S.No', cell: () => null },
        { key: 'unitId', header: 'Unit ID', sortable: true },
        {
            key: 'logo', header: 'Logo', cell: (u) => (
                u.logo ? <img src={u.logo} alt="logo" className="w-8 h-8 rounded-full border border-gray-200" /> : <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200" />
            )
        },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'type', header: 'Type', sortable: true },
        { key: 'location', header: 'Location', cell: (u) => u.location.label },
        { key: 'status', header: 'Status', cell: (u) => <StatusHighlighter value={u.status} /> }
    ]

    columns[0].cell = (item) => filteredUnits.findIndex(u => u.id === item.id) + 1

    return (
        <div className="flex flex-col h-full bg-transparent dark:bg-black">
            <PageHeader
                title="Unit Master"
                breadcrumbs={[
                    { label: 'Master Data' },
                    { label: 'Unit Master', href: '/master/unit' }
                ]}
            />

            <ActionBar
                onAdd={handleAdd}
                addLabel="Add Unit"
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search unit ID or name..."
            />

            {isLoading ? (
                <div className="animate-pulse bg-white dark:bg-black border border-gray-200 dark:border-white/10 shadow-sm rounded-lg h-64 p-6" />
            ) : (
                <DataTable
                    data={filteredUnits}
                    columns={columns}
                    keyExtractor={(u) => u.id}
                    emptyStateMessage="No units found."
                    actions={(u) => (
                        <>
                            <button
                                onClick={() => {
                                    setPreviewUnit(u)
                                    setIsPreviewOpen(true)
                                }}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded"
                                title="Preview"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleEdit(u)}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/5 rounded"
                                title="Edit"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setUnitToDelete(u)
                                    setDeleteModalOpen(true)
                                }}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-white/5 rounded"
                                title="Delete"
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
                title={editingUnit ? "Edit Unit" : "Add New Unit"}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <input type="hidden" {...register('locationId')} />
                    <input type="hidden" {...register('locationLabel')} />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Logo</label>
                            <input type="file" {...register('logo')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                        </div>
                        <Input label="Unit Name" {...register('name')} error={errors.name?.message} />
                        <Input label="Short Name" {...register('shortName')} error={errors.shortName?.message} />
                        <Select
                            label="Unit Type"
                            {...register('type')}
                            error={errors.type?.message}
                            options={[
                                { value: 'Service Company', label: 'Service Company' },
                                { value: 'Trust', label: 'Trust' },
                                { value: 'Training Institution', label: 'Training Institution' },
                                { value: 'Hospital', label: 'Hospital' },
                                { value: 'Clinic', label: 'Clinic' }
                            ]}
                            placeholder="--Select Unit Type--"
                        />
                        <div className="relative">
                            <Input
                                label="Location"
                                value={locationQuery}
                                onChange={(e) => handleLocationInputChange(e.target.value)}
                                onFocus={() => setIsLocationPickerOpen(true)}
                                placeholder="Search city, state, country"
                                error={errors.locationId?.message || errors.locationLabel?.message}
                            />
                            {isLocationPickerOpen && (
                                <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black shadow-xl">
                                    {locationQuery.trim().length < 2 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                            Type at least 2 characters to search globally.
                                        </div>
                                    ) : isSearchingLocations ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                            Searching locations...
                                        </div>
                                    ) : (
                                        <>
                                            {locationSuggestions.map((location) => (
                                                <button
                                                    key={location.id}
                                                    type="button"
                                                    onClick={() => handleSelectLocation(location)}
                                                    className="block w-full border-b border-gray-100 dark:border-white/5 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5"
                                                >
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{location.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{location.state}, {location.country}</div>
                                                </button>
                                            ))}
                                            {locationSuggestions.length === 0 && (
                                                <div className="px-3 py-2 text-sm text-gray-500">
                                                    No matching locations found.
                                                </div>
                                            )}
                                            {canAddTypedLocation && (
                                                <button
                                                    type="button"
                                                    onClick={handleOpenAddLocation}
                                                    className="block w-full px-3 py-2 text-left text-sm font-medium text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                                >
                                                    Add new location
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="sm:col-span-2">
                            <Input label="Address" {...register('address')} error={errors.address?.message} />
                        </div>
                        {showAddLocationForm && (
                            <div className="sm:col-span-2 rounded-2xl border border-dashed border-primary-300 dark:border-primary-900/30 bg-primary-50/40 dark:bg-primary-900/10 p-4">
                                <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Add New Location</div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input
                                        label="City Name"
                                        value={newLocationDraft.name}
                                        onChange={(e) => setNewLocationDraft((prev) => ({ ...prev, name: e.target.value }))}
                                    />
                                    <Input
                                        label="State"
                                        value={newLocationDraft.state}
                                        onChange={(e) => setNewLocationDraft((prev) => ({ ...prev, state: e.target.value }))}
                                    />
                                    <Input
                                        label="Country"
                                        value={newLocationDraft.country}
                                        onChange={(e) => setNewLocationDraft((prev) => ({ ...prev, country: e.target.value }))}
                                    />
                                    <Input
                                        label="Pincode"
                                        value={newLocationDraft.pincode}
                                        onChange={(e) => setNewLocationDraft((prev) => ({ ...prev, pincode: e.target.value }))}
                                    />
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddLocationForm(false)}
                                        className="rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-black px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreateLocation}
                                        disabled={createLocation.isPending}
                                        className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        {createLocation.isPending ? 'Saving...' : 'Save Location'}
                                    </button>
                                </div>
                            </div>
                        )}
                        <Input label="Pincode" {...register('pincode')} error={errors.pincode?.message} />
                        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
                        <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
                        <Select
                            label="Status"
                            {...register('status')}
                            error={errors.status?.message}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' }
                            ]}
                        />
                    </div>

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
                            disabled={addUnit.isPending || updateUnit.isPending}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm disabled:opacity-50 transition-colors"
                        >
                            {addUnit.isPending || updateUnit.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Drawer>

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Unit"
                type="danger"
                message={`Are you sure you want to delete ${unitToDelete?.name}?`}
                onConfirm={handleDeleteConfirm}
                confirmLabel={deleteUnit.isPending ? 'Deleting...' : 'Delete'}
            />

            {/* Preview Drawer */}
            <Drawer
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="Unit Details Preview"
                size="lg"
            >
                {previewUnit && (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            {previewUnit.logo ? (
                                <img src={previewUnit.logo} alt="logo" className="w-16 h-16 rounded-full border border-gray-200" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium text-xl">
                                    {previewUnit.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{previewUnit.name}</h3>
                                <p className="text-sm font-medium text-gray-500">ID: {previewUnit.unitId}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-100 dark:border-white/10">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Short Name</p>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{previewUnit.shortName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Unit Type</p>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{previewUnit.type}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Location</p>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{previewUnit.location.label}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pincode</p>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{previewUnit.pincode}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-sm font-medium text-gray-500">Address</p>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{previewUnit.address}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email Address</p>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100"><a href={`mailto:${previewUnit.email}`} className="text-primary-600 hover:underline">{previewUnit.email}</a></p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Contact Number</p>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{previewUnit.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Status</p>
                                <div className="mt-1">
                                    <StatusHighlighter value={previewUnit.status} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsPreviewOpen(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-white/5 font-medium shadow-sm transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    )
}
