import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { useJobApplications, useCreateJobApplication, useUpdateJobApplication, useDeleteJobApplication, useConvertJobApplication } from '../hooks/useHR'
import { Edit2, Trash2, ArrowRight } from 'lucide-react'
import { Drawer } from '../../../components/Drawer'
import { useUnits } from '../../master/hooks/useUnit'

function RedLabelInput(props: any) {
    const { label, required, register, name, ...rest } = props;
    return (
        <div>
            <label className={`block text-sm font-bold mb-1 ${required ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                {label} {required && '*'}
            </label>
            <input
                {...(register ? register(name) : {})}
                className="block w-full border-gray-300 dark:border-white/10 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                {...rest}
            />
        </div>
    )
}

function RedLabelSelect(props: any) {
    const { label, required, options, register, name, ...rest } = props;
    return (
        <div>
            <label className={`block text-sm font-bold mb-1 ${required ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                {label} {required && '*'}
            </label>
            <select
                {...(register ? register(name) : {})}
                className="block w-full border-gray-300 dark:border-white/10 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                {...rest}
            >
                {options.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}

export function JobEnquiry() {
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const { register, handleSubmit, reset } = useForm()
    const { data: units = [] } = useUnits()

    const { data: applications = [] } = useJobApplications()
    const createJobApp = useCreateJobApplication()
    const updateJobApp = useUpdateJobApplication()
    const deleteJobApp = useDeleteJobApplication()
    const convertJobApp = useConvertJobApplication()
    const unitOptions = [
        { value: '', label: '-- Select Unit --' },
        ...units.map((unit) => ({
            value: unit.id,
            label: unit.location?.label ? `${unit.name} - ${unit.location.label}` : unit.name
        }))
    ]

    const handleEdit = (app: any) => {
        setEditingId(app.id)
        reset(app)
        setIsAdding(true)
    }

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this job application?")) {
            deleteJobApp.mutate(id)
        }
    }

    const handleConvert = (id: string) => {
        if (window.confirm("Convert this application to a Candidate for recruitment?")) {
            convertJobApp.mutate(id)
        }
    }

    const onSubmit = (data: any) => {
        if (editingId) {
            updateJobApp.mutate({ id: editingId, data }, {
                onSuccess: () => {
                    setIsAdding(false)
                    setEditingId(null)
                    reset()
                }
            })
        } else {
            createJobApp.mutate({
                ...data,
                applicationNo: `APP-${Date.now()}`
            }, {
                onSuccess: () => {
                    setIsAdding(false)
                    reset()
                }
            })
        }
    }

    const columns: Column<any>[] = [
        { key: 'applicationNo', header: 'Application No' },
        { key: 'companyUnit', header: 'Company (Unit)' },
        { key: 'applyFor', header: 'Apply For' },
        { key: 'applicantName', header: 'Applicant Details' },
        { key: 'experience', header: 'Experience' },
        { key: 'location', header: 'Location' },
        { key: 'followupStatus', header: 'Followup Status' },
        { key: 'interestStatus', header: 'Interest Status' },
        {
            key: 'action', header: 'Action', cell: (d) => (
                <div className="flex flex-wrap items-center gap-2">
                    {d.followupStatus !== 'Converted' && (
                        <button onClick={() => handleConvert(d.id)} className="p-1 px-3 bg-green-600 text-white text-xs rounded shadow flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Convert
                        </button>
                    )}
                    <button onClick={() => handleEdit(d)} className="p-1 px-3 bg-[#0d6efd] text-white text-xs rounded shadow flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                        <Trash2 className="w-3 h-3" /> Delete
                    </button>
                </div>
            )
        },
    ]

    return (
        <div className="flex h-full min-w-0 flex-col space-y-4 bg-transparent dark:bg-black sm:space-y-6">
            <PageHeader title="Job Enquiry / Applications" breadcrumbs={[{ label: 'Home' }, { label: 'Job Enquiry' }]} />
            <ActionBar onAdd={() => { reset(); setEditingId(null); setIsAdding(true); }} addLabel="Add New Application" />
            <FilterSection searchQuery={""} onSearchChange={() => { }} searchPlaceholder="Search by Application No. or Applicant..." />
            <DataTable data={applications} columns={columns} keyExtractor={(d) => d.id} />

            <Drawer isOpen={isAdding} onClose={() => setIsAdding(false)} title={editingId ? 'Edit Job Application' : 'Add New Job Application'} size="xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="mx-auto w-full max-w-none space-y-8">
                        <div>
                            <h3 className="text-xl font-normal text-gray-800 dark:text-gray-200 mb-6 border-b pb-2 dark:border-white/10">Company & Position Details</h3>
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 2xl:grid-cols-4">
                                <RedLabelSelect
                                    label="Company (Unit)" required register={register} name="companyUnit"
                                    options={unitOptions}
                                />
                                <RedLabelInput
                                    label="Apply For (Post)" required register={register} name="applyFor"
                                    placeholder="Enter Post / Position Applied For"
                                />
                                <RedLabelSelect
                                    label="Experience" register={register} name="experience"
                                    options={[
                                        { value: '', label: '-- Select Experience --' },
                                        { value: '0-2 Yrs', label: '0-2 Yrs' },
                                        { value: '3-5 Yrs', label: '3-5 Yrs' },
                                        { value: '5+ Yrs', label: '5+ Yrs' }
                                    ]}
                                />
                                <RedLabelInput
                                    label="Location (City)" register={register} name="location"
                                    placeholder="Enter Applicant City / Location"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-normal text-gray-800 dark:text-gray-200 mb-6 border-b pb-2 dark:border-white/10">Applicant Details</h3>
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 2xl:grid-cols-4">
                                <RedLabelInput
                                    label="Applicant Full Name" required register={register} name="applicantName"
                                    placeholder="Enter Applicant Full Name"
                                />
                                <RedLabelInput
                                    label="Mobile No" required register={register} name="mobileNo"
                                    placeholder="Enter Mobile Number"
                                />
                                <RedLabelInput
                                    label="Email Address" register={register} name="email"
                                    placeholder="Enter Email Address"
                                />
                                <div className="space-y-4">
                                    <RedLabelInput
                                        label="Resume Link" register={register} name="resumeUrl"
                                        placeholder="e.g. https://drive.google.com/..."
                                    />
                                    <div>
                                        <label className="block text-sm font-bold mb-1 text-gray-800 dark:text-gray-200">Or Upload Resume File</label>
                                        <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-50 dark:file:bg-white/5 file:text-gray-700 dark:text-gray-300 hover:file:bg-gray-100 dark:hover:file:bg-white/10 border border-gray-300 dark:border-white/10 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-black" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-normal text-gray-800 dark:text-gray-200 mb-6 border-b pb-2 dark:border-white/10">Status Details</h3>
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 2xl:grid-cols-4">
                                <RedLabelSelect
                                    label="Followup Status" register={register} name="followupStatus"
                                    options={[
                                        { value: 'Pending', label: 'Pending' },
                                        { value: 'Completed', label: 'Completed' }
                                    ]}
                                />
                                <RedLabelSelect
                                    label="Interest Status" register={register} name="interestStatus"
                                    options={[
                                        { value: 'Neutral', label: 'Neutral' },
                                        { value: 'Interested', label: 'Interested' },
                                        { value: 'Not Interested', label: 'Not Interested' }
                                    ]}
                                />
                            </div>
                        </div>

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
                                disabled={createJobApp.isPending || updateJobApp.isPending}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium shadow-sm disabled:opacity-50 transition-colors"
                            >
                                {createJobApp.isPending || updateJobApp.isPending ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
