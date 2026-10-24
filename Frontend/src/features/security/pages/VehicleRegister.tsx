import React, { useMemo, useState, type FormEvent, useEffect } from 'react'
import { Car, Eye, LogOut, Plus, RefreshCw, History, CheckCircle } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { Input } from '../../../components/Input'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { 
    useVehicleMovements, 
    useRecordVehicleEntry, 
    useRecordVehicleExit 
} from '../hooks/useSecurity'
import { VehicleMaterialEntry } from '../components/VehicleMaterialEntry'
import { VehicleDetailsModal } from '../components/VehicleDetailsModal'
import type { VehicleMovement } from '../types'
import { format } from 'date-fns'

const VEHICLE_TYPES = [
    'Ambulance',
    'Car',
    'Taxi / Cab',
    'Auto Rickshaw',
    'Two Wheeler',
    'Bus',
    'Van',
    'Truck',
    'Mini Truck',
    'Delivery Vehicle',
    'Commercial Vehicle',
    'Service Vehicle',
    'Government Vehicle',
    'Other'
];

const VEHICLE_PURPOSE_MAP: Record<string, string[]> = {
    'Ambulance': ['Patient Transfer', 'Emergency Service', 'Hospital / Medical Visit', 'Other'],
    'Delivery Vehicle': ['Food Delivery', 'Medicine Delivery', 'Parcel / Courier', 'Supplies Delivery', 'Other'],
    'Truck': ['Material Delivery', 'Inventory Supply', 'Equipment Delivery', 'Loading / Unloading', 'Other'],
    'Mini Truck': ['Material Delivery', 'Inventory Supply', 'Equipment Delivery', 'Loading / Unloading', 'Other'],
    'Service Vehicle': ['Maintenance', 'Repair', 'Technical Service', 'Facility Service', 'Other'],
    'Government Vehicle': ['Official Visit', 'Inspection', 'Documentation', 'Other'],
    'Car': ['Visitor Transport', 'Staff Transport', 'Patient Transport', 'Official Work', 'Other'],
    'Taxi / Cab': ['Visitor Transport', 'Staff Transport', 'Patient Transport', 'Official Work', 'Other'],
    'Auto Rickshaw': ['Visitor Transport', 'Staff Transport', 'Patient Transport', 'Official Work', 'Other'],
    'Two Wheeler': ['Delivery', 'Staff Transport', 'Official Work', 'Other'],
    'Bus': ['Resident Transport', 'Staff Transport', 'Group Transport', 'Official Work', 'Other'],
    'Van': ['Resident Transport', 'Staff Transport', 'Group Transport', 'Official Work', 'Other'],
    'Commercial Vehicle': ['Delivery', 'Supply', 'Service', 'Other'],
    'Other': ['Official Work', 'Delivery', 'Service', 'Personal Visit', 'Other']
};

const formatTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return format(date, 'MMM dd, yyyy • hh:mm a')
}

export function VehicleRegister() {
    const { data: movements = [], isLoading, refetch, isFetching } = useVehicleMovements()
    const recordEntry = useRecordVehicleEntry()
    const recordExit = useRecordVehicleExit()
    
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMovement, setSelectedMovement] = useState<VehicleMovement | null>(null)

    // Form State
    const [vehicleNo, setVehicleNo] = useState('')
    const [vehicleType, setVehicleType] = useState('')
    const [customVehicleType, setCustomVehicleType] = useState('')
    
    const [driverName, setDriverName] = useState('')
    const [driverMobile, setDriverMobile] = useState('')
    const [companyName, setCompanyName] = useState('')
    
    const [purposeCategory, setPurposeCategory] = useState('')
    const [customPurpose, setCustomPurpose] = useState('')
    
    const [materials, setMaterials] = useState<string | null>(null)
    const [isMaterialsValid, setIsMaterialsValid] = useState(true)
    const [remarks, setRemarks] = useState('')

    // Reset purpose when vehicle type changes
    useEffect(() => {
        setPurposeCategory('')
        setCustomPurpose('')
    }, [vehicleType])

    const activeMovements = useMemo(() => movements.filter((m) => m.status === 'INSIDE'), [movements])
    const historyMovements = useMemo(() => movements.filter((m) => m.status === 'COMPLETED'), [movements])
    
    const displayList = activeTab === 'ACTIVE' ? activeMovements : historyMovements;
    
    const filteredMovements = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return displayList.filter((m) =>
            String(m.vehicleNo || '').toLowerCase().includes(query) ||
            String(m.driverName || '').toLowerCase().includes(query) ||
            String(m.driverMobile || '').toLowerCase().includes(query) ||
            String(m.purpose || '').toLowerCase().includes(query) ||
            String(m.companyName || '').toLowerCase().includes(query)
        )
    }, [displayList, searchQuery])

    // Metrics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const entriesToday = movements.filter(m => new Date(m.entryAt) >= today).length
    const completedToday = movements.filter(m => m.status === 'COMPLETED' && m.exitAt && new Date(m.exitAt) >= today).length

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        
        if (!isMaterialsValid) {
            return;
        }

        const finalVehicleType = vehicleType === 'Other' ? customVehicleType.trim() : vehicleType;
        const finalPurpose = purposeCategory === 'Other' ? customPurpose.trim() : purposeCategory;

        try {
            await recordEntry.mutateAsync({
                vehicleNo,
                vehicleType: finalVehicleType || undefined,
                driverName,
                driverMobile: driverMobile || undefined,
                companyName: companyName || undefined,
                purpose: finalPurpose,
                materialDetails: materials || undefined,
                remarks: remarks || undefined
            })
            
            // Reset form
            setVehicleNo('')
            setVehicleType('')
            setCustomVehicleType('')
            setDriverName('')
            setDriverMobile('')
            setCompanyName('')
            setPurposeCategory('')
            setCustomPurpose('')
            setRemarks('')
            setSearchQuery('')
        } catch {
            // Handled by mutation hook
        }
    }

    const handleCheckout = (movement: VehicleMovement) => {
        if (window.confirm(`Are you sure you want to exit vehicle ${movement.vehicleNo}?`)) {
            recordExit.mutate(movement.id)
        }
    }

    const columns: Column<VehicleMovement>[] = [
        { key: 'vehicleNo', header: 'Vehicle No', sortable: true, cell: (m) => <span className="font-extrabold text-slate-900">{m.vehicleNo}</span> },
        { key: 'vehicleType', header: 'Type', cell: (m) => m.vehicleType || '-' },
        { key: 'driverName', header: 'Driver', cell: (m) => m.driverName || '-' },
        { key: 'purpose', header: 'Purpose' },
        { key: 'companyName', header: 'Company', cell: (m) => m.companyName || '-' },
        { key: 'entryAt', header: 'Entry Time', cell: (m) => formatTime(m.entryAt), sortable: true },
        { 
            key: 'status', 
            header: 'Status', 
            cell: (m) => (
                <div className="flex items-center gap-2">
                    <StatusHighlighter value={m.status} />
                </div>
            ) 
        },
        {
            key: 'id',
            header: '',
            cell: (m) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setSelectedMovement(m)}
                        className="inline-flex h-8 items-center rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-600 hover:bg-slate-200"
                    >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Details
                    </button>
                    {m.status === 'INSIDE' && (
                        <button
                            onClick={() => handleCheckout(m)}
                            disabled={recordExit.isPending}
                            className="inline-flex h-8 items-center rounded-lg bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                            <LogOut className="mr-1.5 h-3.5 w-3.5" />
                            Exit
                        </button>
                    )}
                </div>
            )
        }
    ]

    const purposeOptions = VEHICLE_PURPOSE_MAP[vehicleType === 'Other' ? 'Other' : vehicleType] || VEHICLE_PURPOSE_MAP['Other'];
    const isCustomPurposeInvalid = purposeCategory === 'Other' && !customPurpose.trim();
    const isCustomVehicleInvalid = vehicleType === 'Other' && !customVehicleType.trim();
    
    const isFormInvalid = 
        !vehicleNo.trim() || 
        !driverName.trim() || 
        !vehicleType || 
        !purposeCategory || 
        isCustomPurposeInvalid || 
        isCustomVehicleInvalid || 
        !isMaterialsValid;

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent pb-10">
            <PageHeader
                title="Vehicle Register"
                subtitle="Live vehicle entry, driver details, material movement, and checkout tracking."
                breadcrumbs={[{ label: 'Security' }, { label: 'Vehicle Register' }]}
            />

            <div className="grid gap-3 md:grid-cols-3">
                {[
                    { label: 'Vehicles Inside', value: activeMovements.length, tone: 'bg-primary-50 text-primary-700' },
                    { label: 'Total Entries Today', value: entriesToday, tone: 'bg-slate-50 text-slate-700' },
                    { label: 'Completed Today', value: completedToday, tone: 'bg-emerald-50 text-emerald-700' }
                ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 px-4 py-3 ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            {/* Entry Form */}
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2">
                    <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
                        <Plus className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-950">New Vehicle Entry</h2>
                </div>
                
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Input label="Vehicle No. *" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} required />
                        
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Vehicle Type *</label>
                            <select 
                                value={vehicleType} 
                                onChange={(e) => setVehicleType(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-primary-500 bg-white text-sm"
                                required
                            >
                                <option value="">Select Type</option>
                                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {vehicleType === 'Other' && (
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Custom Vehicle Type *</label>
                                <input 
                                    type="text"
                                    value={customVehicleType}
                                    onChange={(e) => setCustomVehicleType(e.target.value)}
                                    placeholder="Enter vehicle type"
                                    className={`w-full rounded-xl border p-2.5 outline-none bg-white text-sm ${isCustomVehicleInvalid ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-primary-500'}`}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Driver Info */}
                    <div className="grid gap-4 md:grid-cols-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                        <Input label="Driver Name *" value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
                        <Input label="Driver Mobile" value={driverMobile} onChange={(e) => setDriverMobile(e.target.value)} />
                        <Input label="Company / Organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>

                    {/* Purpose Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Purpose of Visit *</label>
                            <select 
                                value={purposeCategory} 
                                onChange={(e) => setPurposeCategory(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-primary-500 bg-white text-sm"
                                required
                            >
                                <option value="">Select Purpose</option>
                                {purposeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        
                        {purposeCategory === 'Other' && (
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Custom Purpose *</label>
                                <input 
                                    type="text"
                                    value={customPurpose}
                                    onChange={(e) => setCustomPurpose(e.target.value)}
                                    placeholder="Enter purpose"
                                    className={`w-full rounded-xl border p-2.5 outline-none bg-white text-sm ${isCustomPurposeInvalid ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-primary-500'}`}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Materials */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Materials / Cargo (Optional)</h3>
                        <VehicleMaterialEntry 
                            vehicleType={vehicleType}
                            onChange={setMaterials}
                            onValidityChange={setIsMaterialsValid}
                        />
                    </div>

                    {/* Remarks */}
                    <div>
                        <Input label="Remarks (Optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={recordEntry.isPending || isFormInvalid}
                            className="h-11 rounded-xl bg-primary-600 px-8 text-sm font-extrabold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {recordEntry.isPending ? 'Processing...' : 'Record Vehicle Entry'}
                        </button>
                    </div>
                </div>
            </form>

            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setActiveTab('ACTIVE')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                activeTab === 'ACTIVE' 
                                    ? 'bg-white text-primary-700 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            <Car className="w-4 h-4 mr-2" />
                            Active Inside
                            <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                                {activeMovements.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('HISTORY')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                activeTab === 'HISTORY' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            <History className="w-4 h-4 mr-2" />
                            History
                        </button>
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                <FilterSection 
                    searchQuery={searchQuery} 
                    onSearchChange={(e) => setSearchQuery(e.target.value)} 
                    searchPlaceholder="Search vehicle, driver, company, or purpose..." 
                />

                <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                    <DataTable 
                        data={filteredMovements} 
                        columns={columns} 
                        keyExtractor={(m) => m.id} 
                        isLoading={isLoading} 
                    />
                </div>
            </section>

            <VehicleDetailsModal
                isOpen={!!selectedMovement}
                onClose={() => setSelectedMovement(null)}
                movement={selectedMovement}
            />
        </div>
    )
}
