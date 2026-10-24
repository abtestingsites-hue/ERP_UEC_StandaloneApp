import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, ClipboardList, FileText, HeartPulse, IndianRupee, UserPlus } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { PatientSelector } from '../../../components/PatientSelector'
import { useCreateExistingPatient } from '../../enquiry/hooks/useEnquiry'
import type { ExistingPatientValues } from '../../enquiry/services/enquiry'

const today = new Date().toISOString().split('T')[0]

const initialForm: ExistingPatientValues = {
    clientName: '',
    patientName: '',
    mobile: '',
    email: '',
    address: '',
    careType: 'HOME_CARE',
    admissionDate: today,
    serviceName: '',
    serviceAmount: undefined,
    roomNo: '',
    healthCondition: '',
    currentMedicines: '',
    routineNotes: '',
    openingBalance: undefined
}

const careTypeOptions = [
    { value: 'HOME_CARE', label: 'Home Care' },
    { value: 'CLINICAL', label: 'Clinical Care' },
    { value: 'IN_HOUSE', label: 'In-House Care' },
    { value: 'OTHERS', label: 'Other Care' }
]

const quickLinks = (created: any) => [
    {
        label: 'Daily Operations',
        helper: 'Start routine monitoring',
        href: '/daily-operations',
        icon: ClipboardList
    },
    {
        label: 'Patient Ledger',
        helper: 'Add daily expenses',
        href: `/finance/patient-daily-cost?search=${encodeURIComponent(created?.allocation?.refNo || created?.patient?.name || '')}`,
        icon: IndianRupee
    },
    {
        label: 'Admission Forms',
        helper: 'Create family access',
        href: `/crm/admission-forms?search=${encodeURIComponent(created?.enquiry?.refNo || created?.patient?.name || '')}`,
        icon: FileText
    },
    {
        label: 'Workflow Timeline',
        helper: 'View linked status',
        href: `/workflow/timeline?search=${encodeURIComponent(created?.enquiry?.refNo || created?.allocation?.refNo || '')}`,
        icon: HeartPulse
    }
]

export function ExistingPatient() {
    const createExistingPatient = useCreateExistingPatient()
    const [form, setForm] = useState<ExistingPatientValues>(initialForm)
    const [created, setCreated] = useState<any>(null)

    const amountPreview = useMemo(() => {
        const serviceAmount = Number(form.serviceAmount || 0)
        const openingBalance = Number(form.openingBalance || 0)
        return serviceAmount + openingBalance
    }, [form.openingBalance, form.serviceAmount])

    const updateField = (field: keyof ExistingPatientValues, value: string) => {
        const numberFields = ['serviceAmount', 'openingBalance']
        setForm((current) => ({
            ...current,
            [field]: numberFields.includes(field) ? (value === '' ? undefined : Number(value)) : value
        }))
    }

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const result = await createExistingPatient.mutateAsync(form)
        setCreated(result)
    }

    const canSubmit = form.clientName.trim() && form.patientName.trim() && form.mobile.trim().length >= 10

    return (
        <div className="space-y-6">
            <PageHeader
                title="Add Existing Patient / Resident"
                subtitle="Onboard residents who were already admitted before ERP enquiry tracking started."
                breadcrumbs={[{ label: 'Resident Management' }, { label: 'Existing Resident Onboarding' }]}
            />

            {created ? (
                <div className="rounded-[8px] border border-[#6DA5C0] bg-[#F7FAFC] p-5 shadow-sm dark:bg-black dark:border-white/10">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#0F969C]">Legacy Resident Onboarded</span>
                            <h2 className="text-xl font-black text-[#072E33] dark:text-gray-100">{created.patient?.name}</h2>
                            <p className="text-sm font-medium text-[#294D61] dark:text-gray-400">
                                Client: {created.client?.name} | Enquiry: {created.enquiry?.refNo} | Allocation: {created.allocation?.refNo}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setCreated(null)
                                setForm(initialForm)
                            }}
                            className="inline-flex items-center gap-2 rounded-full bg-[#0F969C] px-4 py-2 text-sm font-bold text-white hover:bg-[#0C7B80]"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add Another Patient
                        </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quickLinks(created).map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    className="flex items-center gap-3 rounded-[6px] border border-[#6DA5C0]/40 bg-white p-3 hover:border-[#0F969C] hover:shadow-sm dark:bg-black dark:border-white/10"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7FAFC] text-[#0F969C] dark:bg-white/10">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-[#072E33] dark:text-gray-200">{item.label}</p>
                                        <p className="truncate text-xs font-medium text-[#294D61] dark:text-gray-400">{item.helper}</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            ) : null}

            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-[8px] border border-[#6DA5C0]/40 bg-white p-5 shadow-sm dark:bg-black dark:border-white/10">
                    <div className="mb-4 flex items-center gap-2 border-b border-[#6DA5C0]/20 pb-3 dark:border-white/10">
                        <UserPlus className="h-5 w-5 text-[#0F969C]" />
                        <div>
                            <h2 className="text-base font-extrabold text-[#072E33] dark:text-gray-100">1. Client & Patient Identity</h2>
                            <p className="text-xs font-medium text-[#294D61] dark:text-gray-400">Match existing record or create new master client and patient identity</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#294D61] dark:text-gray-300">Quick Match Existing Patient</label>
                            <PatientSelector
                                value=""
                                onChange={(patientId, patient) => {
                                    if (patient) {
                                        setForm((prev) => ({
                                            ...prev,
                                            patientName: patient.name || prev.patientName,
                                            mobile: patient.phone || prev.mobile,
                                            email: patient.email || prev.email,
                                            address: patient.address || prev.address
                                        }))
                                    }
                                }}
                            />
                        </div>

                        <Input
                            label="Client / Family Member Name *"
                            value={form.clientName}
                            onChange={(e) => updateField('clientName', e.target.value)}
                            placeholder="e.g. Ramesh Kumar"
                            required
                        />

                        <Input
                            label="Patient / Resident Name *"
                            value={form.patientName}
                            onChange={(e) => updateField('patientName', e.target.value)}
                            placeholder="e.g. Smt. Lakshmi Ammal"
                            required
                        />

                        <Input
                            label="Contact Mobile *"
                            value={form.mobile}
                            onChange={(e) => updateField('mobile', e.target.value)}
                            placeholder="Primary phone number"
                            required
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            value={form.email || ''}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="Family email address"
                        />

                        <Input
                            label="Residential / Care Location"
                            value={form.address || ''}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="Full address or area location"
                        />
                    </div>
                </div>

                <div className="rounded-[8px] border border-[#6DA5C0]/40 bg-white p-5 shadow-sm dark:bg-black dark:border-white/10">
                    <div className="mb-4 flex items-center gap-2 border-b border-[#6DA5C0]/20 pb-3 dark:border-white/10">
                        <CalendarPlus className="h-5 w-5 text-[#0F969C]" />
                        <div>
                            <h2 className="text-base font-extrabold text-[#072E33] dark:text-gray-100">2. Service & Care Requirement</h2>
                            <p className="text-xs font-medium text-[#294D61] dark:text-gray-400">Specify care type, admission date, room/bed, and pricing context</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Select
                            label="Care Requirement Type *"
                            value={form.careType}
                            onChange={(e) => updateField('careType', e.target.value as any)}
                            options={careTypeOptions}
                        />

                        <Input
                            label="Original Admission Date *"
                            type="date"
                            value={form.admissionDate || today}
                            onChange={(e) => updateField('admissionDate', e.target.value)}
                            required
                        />

                        <Input
                            label="Service / Package Name"
                            value={form.serviceName || ''}
                            onChange={(e) => updateField('serviceName', e.target.value)}
                            placeholder="e.g. 24x7 In-House Nursing Care"
                        />

                        <Input
                            label="Room / Bed No."
                            value={form.roomNo || ''}
                            onChange={(e) => updateField('roomNo', e.target.value)}
                            placeholder="e.g. Room 204 - Bed A"
                        />

                        <Input
                            label="Agreed Service Rate (₹)"
                            type="number"
                            value={form.serviceAmount === undefined ? '' : String(form.serviceAmount)}
                            onChange={(e) => updateField('serviceAmount', e.target.value)}
                            placeholder="Monthly or daily rate"
                        />

                        <Input
                            label="Opening Balance / Advance (₹)"
                            type="number"
                            value={form.openingBalance === undefined ? '' : String(form.openingBalance)}
                            onChange={(e) => updateField('openingBalance', e.target.value)}
                            placeholder="Opening credit or due balance"
                        />
                    </div>
                </div>

                <div className="rounded-[8px] border border-[#6DA5C0]/40 bg-white p-5 shadow-sm dark:bg-black dark:border-white/10">
                    <div className="mb-4 flex items-center gap-2 border-b border-[#6DA5C0]/20 pb-3 dark:border-white/10">
                        <ClipboardList className="h-5 w-5 text-[#0F969C]" />
                        <div>
                            <h2 className="text-base font-extrabold text-[#072E33] dark:text-gray-100">3. Initial Clinical Notes & Medicine Details</h2>
                            <p className="text-xs font-medium text-[#294D61] dark:text-gray-400">Captured notes will be attached to care allocation metadata</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#294D61] dark:text-gray-300">Health Condition Summary</label>
                            <textarea
                                value={form.healthCondition || ''}
                                onChange={(e) => updateField('healthCondition', e.target.value)}
                                rows={3}
                                placeholder="Primary diagnosis, mobility, allergy, or care needs..."
                                className="w-full rounded-[6px] border border-[#6DA5C0]/60 bg-white p-3 text-sm text-[#072E33] outline-none focus:border-[#0F969C] dark:bg-black dark:text-gray-100 dark:border-white/10"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#294D61] dark:text-gray-300">Current Medications</label>
                            <textarea
                                value={form.currentMedicines || ''}
                                onChange={(e) => updateField('currentMedicines', e.target.value)}
                                rows={3}
                                placeholder="Ongoing medications, dosage times, and doctors..."
                                className="w-full rounded-[6px] border border-[#6DA5C0]/60 bg-white p-3 text-sm text-[#072E33] outline-none focus:border-[#0F969C] dark:bg-black dark:text-gray-100 dark:border-white/10"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#294D61] dark:text-gray-300">Routine Notes & Special Instructions</label>
                            <textarea
                                value={form.routineNotes || ''}
                                onChange={(e) => updateField('routineNotes', e.target.value)}
                                rows={3}
                                placeholder="Food preference, attendant requirements, billing notes..."
                                className="w-full rounded-[6px] border border-[#6DA5C0]/60 bg-white p-3 text-sm text-[#072E33] outline-none focus:border-[#0F969C] dark:bg-black dark:text-gray-100 dark:border-white/10"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[8px] border border-[#6DA5C0]/40 bg-[#F7FAFC] p-4 dark:bg-black dark:border-white/10">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#294D61] dark:text-gray-400">Total Account Opening Value</p>
                        <p className="text-xl font-black text-[#072E33] dark:text-gray-100">₹ {amountPreview.toLocaleString('en-IN')}</p>
                    </div>

                    <button
                        type="submit"
                        disabled={!canSubmit || createExistingPatient.isPending}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F969C] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0C7B80] disabled:opacity-50"
                    >
                        <UserPlus className="h-4 w-4" />
                        {createExistingPatient.isPending ? 'Onboarding Patient...' : 'Onboard Existing Patient'}
                    </button>
                </div>
            </form>
        </div>
    )
}
