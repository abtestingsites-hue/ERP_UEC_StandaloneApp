import { useState, useMemo, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useStaff, useAddStaff, useUpdateStaff, useDeleteStaff } from '../hooks/useHR'
import { Edit2, Trash2 } from 'lucide-react'
import { Drawer } from '../../../components/Drawer'
import { useUnits } from '../../master/hooks/useUnit'


function HookInput({ label, required, register, name, ...rest }: any) {
    return (
        <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}>
                {label} <span className="text-red-500">{required && '*'}</span>
            </label>
            <input
                {...(register && name ? register(name) : {})}
                className="block w-full border-gray-300 dark:border-white/10 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                {...rest}
            />
        </div>
    )
}

function HookSelect({ label, required, options, register, name, ...rest }: any) {
    return (
        <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}>
                {label} <span className="text-red-500">{required && '*'}</span>
            </label>
            <select
                {...(register && name ? register(name) : {})}
                className="block w-full border-gray-300 dark:border-white/10 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                {...rest}
            >
                {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    )
}

export function LabourManagement() {
    const { data: staffData = [] } = useStaff()
    const { data: units = [] } = useUnits()
    const addStaff = useAddStaff()
    const updateStaff = useUpdateStaff()
    const deleteStaff = useDeleteStaff()

    const { register, handleSubmit, reset } = useForm()
    const [searchQuery, setSearchQuery] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const unitOptions = useMemo(() => [
        { value: '', label: '-- Select Unit --' },
        ...units.map((unit) => ({
            value: unit.id,
            label: unit.location?.label ? `${unit.name} - ${unit.location.label}` : unit.name
        }))
    ], [units])

    // Only show staff that are categorised via our Labour UI pattern
    const labourData = useMemo(() => {
        return staffData.filter((s: any) =>
            (s.role || '').includes('Labour') ||
            (s.role || '').includes('Security') ||
            (s.role || '').includes('Attendant') ||
            s.department === 'Labour'
        ).filter((s: any) =>
            (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.empId || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [staffData, searchQuery])

    // Cleanup camera if unmounted
    useEffect(() => {
        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }
        }
    }, [])

    const toggleCamera = async () => {
        if (isCameraOpen) {
            const stream = videoRef.current?.srcObject as MediaStream
            stream?.getTracks().forEach(track => track.stop())
            setIsCameraOpen(false)
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                setIsCameraOpen(true)
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream
                    }
                }, 100)
            } catch (err) {
                console.error("Camera access denied or unavailable", err)
                alert("Could not access the web camera.")
            }
        }
    }

    const handleEdit = (staff: any) => {
        setEditingId(staff.id)
        reset({ ...staff.metadata, name: staff.name, role: staff.role, phone: staff.phone, status: staff.status })
        setIsAdding(true)
    }

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this labour profile?")) {
            deleteStaff.mutate(id)
        }
    }

    const onSubmit = (data: any) => {
        // Map form data strictly back to base staff schema + generic metadata payload
        const payload = {
            empId: editingId ? undefined : `L-${Math.floor(Math.random() * 900) + 100}`, // mocking staff ID generator securely if new
            name: data.name || 'Unknown Labour',
            role: data.role || 'Attendant',
            department: 'Labour',
            unitId: data.unitId || '',
            phone: data.phone || '',
            email: '',
            joiningDate: data.joiningDate || new Date().toISOString(),
            gender: data.gender || '',
            status: 'Active' as const,
            metadata: data // pack everything inside metadata mapping
        }

        if (editingId) {
            // Re-fetch payload requirements if ID exists
            const existingEmpId = staffData.find((s: any) => s.id === editingId)?.empId || payload.empId;
            updateStaff.mutate({ staffId: editingId, data: { ...payload, empId: existingEmpId } }, {
                onSuccess: () => {
                    setIsAdding(false)
                    setEditingId(null)
                    reset()
                }
            })
        } else {
            addStaff.mutate(payload, {
                onSuccess: () => {
                    setIsAdding(false)
                    reset()
                }
            })
        }
    }

    const columns: Column<any>[] = [
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Labour Name', sortable: true },
        { key: 'role', header: 'Role/Function' },
        { key: 'agency', header: 'Sourcing Agency', cell: (d) => d.metadata?.agency || 'Internal' },
        { key: 'status', header: 'Status', cell: (d) => <StatusHighlighter value={d.status} /> },
        {
            key: 'action', header: 'Action', cell: (d) => (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button onClick={() => handleEdit(d)} className="px-3 py-1 bg-[#0d6efd] text-white text-xs font-semibold rounded hover:bg-blue-600 shadow flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDelete(d.id)} disabled={deleteStaff.isPending} className="rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                        <Trash2 className="w-3 h-3" /> Delete
                    </button>
                </div>
            )
        },
    ]

    return (
        <div className="flex h-full min-w-0 flex-col space-y-4 bg-transparent dark:bg-black sm:space-y-6">
            <PageHeader title="Labour Management" breadcrumbs={[{ label: 'Home' }, { label: 'Labour Management' }]} />

            <ActionBar onAdd={() => { reset(); setEditingId(null); setIsAdding(true); }} addLabel="Add New Staff" />
            <FilterSection searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} searchPlaceholder="Search by name or ID..." />
            <DataTable data={labourData} columns={columns} keyExtractor={(d) => d.id} />

            <Drawer isOpen={isAdding} onClose={() => setIsAdding(false)} title={editingId ? 'Edit - Staff Profile' : 'Add - New Staff'} size="xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 py-4">
                    <div className="mx-auto w-full max-w-none space-y-8">
                        {/* Camera and Upload Actions */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                                <button type="button" onClick={toggleCamera} className="px-6 py-2 bg-primary-500 text-white text-sm font-medium rounded hover:bg-primary-600 transition shadow-sm">
                                    {isCameraOpen ? 'Close Web Camera' : 'Open Web Camera'}
                                </button>
                                <label className="px-6 py-2 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 dark:hover:bg-gray-400 transition shadow-sm cursor-pointer relative overflow-hidden">
                                    Upload Photo
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                </label>
                            </div>
                            {isCameraOpen && (
                                <div className="mt-4 aspect-[4/3] w-full max-w-sm overflow-hidden rounded-lg border-2 border-dashed border-primary-300 bg-black shadow-inner">
                                    <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover shadow-sm" />
                                </div>
                            )}
                        </div>

                        {/* Top Level Selects */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
                            <HookSelect register={register} name="unitId" label="Unit Name" options={unitOptions} />
                            <HookSelect register={register} name="role" label="Service Name" required options={[{ value: '', label: '-- Select the Service Name --' }, { value: 'Attendant', label: 'Attendant' }, { value: 'Security Guard', label: 'Security Guard' }]} />
                        </div>

                        {/* Personnel Details */}
                        <div>
                            <div className="bg-blue-600 text-white text-center py-2 text-lg font-medium mb-6 rounded-sm shadow-sm">Personnel Details</div>
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 2xl:grid-cols-4">
                                <HookInput register={register} name="name" label="Staff Name" required placeholder="Enter Full Name" />
                                <HookInput register={register} name="joiningDate" label="Available From (mm-dd-yyyy)" required type="date" />

                                <HookInput register={register} name="phone" label="Personal Mobile No." required placeholder="Enter Personal Mobile No." />
                                <HookInput register={register} name="altPhone" label="Alternate Mobile No." required placeholder="Enter Alternate Mobile No." />

                                <HookInput register={register} name="dob" label="Date of Birth (mm-dd-yyyy)" required type="date" />
                                <HookInput register={register} name="age" label="Age" required placeholder="Enter Age" />

                                <HookInput register={register} name="location" label="Location (Native Place)" required placeholder="Enter Location" />
                                <HookInput register={register} name="experience" label="Total Experience (in years)" required placeholder="Enter Total Experience (in years)" />

                                <HookSelect register={register} name="gender" label="Gender" required options={[{ value: '', label: '-- Select the Gender --' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
                                <HookSelect register={register} name="maritalStatus" label="Marital Status" required options={[{ value: '', label: '-- Select the Marital Status --' }, { value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' }]} />

                                <HookSelect register={register} name="bloodGroup" label="Blood Group" required options={[{ value: '', label: '-- Select the Blood Group --' }, { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }]} />
                                <HookSelect register={register} name="language" label="Language Known" required options={[{ value: '', label: '-- Select the Language Known --' }, { value: 'English', label: 'English' }, { value: 'Tamil', label: 'Tamil' }]} />

                                <HookSelect register={register} name="workRating" label="Work Ratings" required options={[{ value: '', label: '-- Select the Working Ratings --' }, { value: 'Excellent', label: 'Excellent' }, { value: 'Good', label: 'Good' }]} />
                                <HookInput register={register} name="workRemarks" label="Work Remarks" required placeholder="Enter the Work Remarks" />

                                <HookSelect register={register} name="religious" label="Religious" required options={[{ value: '', label: '-- Select the Religious --' }, { value: 'Hindu', label: 'Hindu' }]} />
                                <HookSelect register={register} name="community" label="Community" required options={[{ value: '', label: '-- Select the Community --' }, { value: 'General', label: 'General' }]} />

                                <HookInput register={register} name="referredBy" label="Referred By" required placeholder="Enter Referred By (Name)" />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resume <span className="text-xs text-gray-500 font-normal">(Documents only. Max 2MB)</span></label>
                                    <div className="flex">
                                        <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-50 dark:file:bg-black file:text-gray-700 dark:text-gray-300 hover:file:bg-gray-100 dark:hover:file:bg-white/5 border border-gray-300 dark:border-white/10 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-black" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Aadhaar Verification */}
                        <div>
                            <div className="bg-blue-600 text-white text-center py-2 text-lg font-medium mb-6 rounded-sm shadow-sm">Aadhaar Verification</div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
                                <HookInput register={register} name="aadhaarNo" label="Aadhaar No." required placeholder="Enter the Aadhaar No." />
                                <HookInput register={register} name="aadhaarDate" label="Verified Date" type="date" />
                                <HookInput register={register} name="aadhaarPerson" label="Verified Person Name" placeholder="Verified By" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhaar Proof <span className="text-xs text-gray-500 font-normal">(Max Size 2MB)</span></label>
                                    <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 dark:file:bg-black file:text-gray-700 dark:text-gray-300 hover:file:bg-gray-100 dark:hover:file:bg-white/5 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black" />
                                </div>
                            </div>
                        </div>

                        {/* Address Verification */}
                        <div>
                            <div className="bg-blue-600 text-white text-center py-2 text-lg font-medium mb-6 rounded-sm shadow-sm">Address Verification</div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address *</label>
                                    <textarea {...register('address')} rows={2} className="block w-full border-gray-300 dark:border-white/10 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white dark:bg-black text-gray-900 dark:text-gray-100" placeholder="Enter Full Address with Pincode"></textarea>
                                </div>
                                <HookInput register={register} name="addressDate" label="Verified Date" type="date" />
                                <HookInput register={register} name="addressPerson" label="Verified Person Name" placeholder="Verified By" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Proof <span className="text-xs text-gray-500 font-normal">(Max Size 2MB)</span></label>
                                    <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 dark:file:bg-black file:text-gray-700 dark:text-gray-300 hover:file:bg-gray-100 dark:hover:file:bg-white/5 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black" />
                                </div>
                            </div>
                        </div>

                        {/* Police Verification */}
                        <div>
                            <div className="bg-blue-600 text-white text-center py-2 text-lg font-medium mb-6 rounded-sm shadow-sm">Police Verification</div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
                                <HookInput register={register} name="pvrStation" label="Nearby Police Station" required placeholder="Police Station Name" />
                                <HookInput register={register} name="pvrNo" label="PVR No" placeholder="Police Verify Record No." />
                                <HookInput register={register} name="pvrDate" label="Date of Issue" type="date" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PVR Document <span className="text-xs text-gray-500 font-normal">(Max Size 2MB)</span></label>
                                    <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 dark:file:bg-black file:text-gray-700 dark:text-gray-300 hover:file:bg-gray-100 dark:hover:file:bg-white/5 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black" />
                                </div>
                            </div>
                        </div>

                        {/* Relations Contact Details (Emergency) */}
                        <div>
                            <div className="bg-blue-600 text-white text-center py-2 text-lg font-medium mb-6 rounded-sm shadow-sm">Relations Contact Details (Emergency)</div>
                            <div className="space-y-4 px-0 sm:px-4">
                                {[1, 2, 3].map((num) => (
                                    <div key={num} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <HookInput register={register} name={`relName${num}`} label={`Relation Name ${num}`} placeholder={`Relation Name ${num}`} />
                                        <HookSelect register={register} name={`relType${num}`} label="Relationship Type" options={[{ value: '', label: '-- Select the Relationship --' }, { value: 'Spouse', label: 'Spouse' }, { value: 'Parent', label: 'Parent' }, { value: 'Child', label: 'Child' }]} />
                                        <HookInput register={register} name={`relPhone${num}`} label="Contact Number" placeholder="Contact Number" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-auto flex flex-col justify-end gap-3 border-t border-gray-200 pt-6 dark:border-white/10 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-white/5 font-medium shadow-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={addStaff.isPending || updateStaff.isPending}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm disabled:opacity-50 transition-colors"
                            >
                                {addStaff.isPending || updateStaff.isPending ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
