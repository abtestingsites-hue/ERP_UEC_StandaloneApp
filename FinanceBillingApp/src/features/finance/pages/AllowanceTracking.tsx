import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useStaff } from '../../../hooks/useHRData'

type AllowanceDraft = Partial<{
    staff: string
    role: string
    purpose: string
    tripDate: string
    fromLocation: string
    toLocation: string
}>

export function AllowanceTracking() {
    const location = useLocation()
    const { data: staff = [] } = useStaff()
    const [claims, setClaims] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({
        staffId: '',
        staff: '',
        role: '',
        purpose: '',
        allowanceType: 'Petrol',
        tripDate: '',
        fromLocation: '',
        toLocation: '',
        distanceKm: '',
        ratePerKm: '',
        claimedAmount: '',
        approvedAmount: '',
        receiptStatus: 'Missing',
        status: 'Draft'
    })

    const staffOptions = useMemo(() => {
        const options = staff
            .filter((member) => {
                const status = String(member.status || '').trim().toLowerCase()
                return !member.isDeleted && status !== 'terminated' && status !== 'resigned'
            })
            .map((member) => ({
                value: member.id,
                label: `${member.name}${member.empId ? ` (${member.empId})` : ''} - ${member.role || 'Staff'}`
            }))

        return options
    }, [staff])

    const filteredClaims = useMemo(() => {
        return claims.filter((claim) => {
            const matchesSearch =
                claim.staff.toLowerCase().includes(searchQuery.toLowerCase()) ||
                claim.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
                claim.allowanceType.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [claims, searchQuery, statusFilter])

    const resetForm = () => {
        setFormData({
            staffId: '',
            staff: '',
            role: '',
            purpose: '',
            allowanceType: 'Petrol',
            tripDate: '',
            fromLocation: '',
            toLocation: '',
            distanceKm: '',
            ratePerKm: '',
            claimedAmount: '',
            approvedAmount: '',
            receiptStatus: 'Missing',
            status: 'Draft'
        })
    }

    useEffect(() => {
        const allowanceDraft = (location.state as { allowanceDraft?: AllowanceDraft } | null)?.allowanceDraft
        if (!allowanceDraft) return
        const matchedStaff = staff.find((member) => member.name === allowanceDraft.staff)

        setFormData((current) => ({
            ...current,
            staffId: matchedStaff?.id || '',
            staff: allowanceDraft.staff || '',
            role: allowanceDraft.role || '',
            purpose: allowanceDraft.purpose || '',
            tripDate: allowanceDraft.tripDate || '',
            fromLocation: allowanceDraft.fromLocation || '',
            toLocation: allowanceDraft.toLocation || '',
            status: 'Draft'
        }))
        setIsDrawerOpen(true)
    }, [location.state, staff])

    const handleStaffChange = (staffId: string) => {
        const selectedStaff = staff.find((member) => member.id === staffId)
        setFormData((current) => ({
            ...current,
            staffId,
            staff: selectedStaff?.name || '',
            role: selectedStaff?.role || current.role
        }))
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        setClaims((current) => [
            {
                id: `ALW-${1000 + current.length + 1}`,
                staff: formData.staff || 'Unassigned Staff',
                role: formData.role || 'Staff',
                purpose: formData.purpose,
                allowanceType: formData.allowanceType,
                tripDate: formData.tripDate,
                fromLocation: formData.fromLocation,
                toLocation: formData.toLocation,
                distanceKm: Number(formData.distanceKm || 0),
                ratePerKm: Number(formData.ratePerKm || 0),
                claimedAmount: Number(formData.claimedAmount || 0),
                approvedAmount: Number(formData.approvedAmount || 0),
                receiptStatus: formData.receiptStatus,
                status: formData.status
            },
            ...current
        ])
        resetForm()
        setIsDrawerOpen(false)
    }

    const monthlySummary = useMemo(() => {
        const totalClaimed = claims.reduce((total, claim) => total + claim.claimedAmount, 0)
        const totalApproved = claims.reduce((total, claim) => total + claim.approvedAmount, 0)
        const totalPaid = claims.filter((claim) => claim.status === 'Paid').reduce((total, claim) => total + claim.approvedAmount, 0)
        const pendingAmount = totalClaimed - totalApproved

        return [
            { label: 'Total Claimed', value: `Rs ${totalClaimed.toFixed(2)}` },
            { label: 'Total Approved', value: `Rs ${totalApproved.toFixed(2)}` },
            { label: 'Total Paid', value: `Rs ${totalPaid.toFixed(2)}` },
            { label: 'Pending Review', value: `Rs ${pendingAmount.toFixed(2)}` }
        ]
    }, [claims])

    const columns: Column<any>[] = [
        { key: 'id', header: 'Claim ID', sortable: true },
        { key: 'staff', header: 'Staff' },
        { key: 'role', header: 'Role' },
        { key: 'purpose', header: 'Trip Purpose' },
        { key: 'allowanceType', header: 'Type' },
        { key: 'tripDate', header: 'Trip Date', sortable: true },
        { key: 'route', header: 'Route', cell: (row) => `${row.fromLocation || '-'} to ${row.toLocation || '-'}` },
        { key: 'distanceKm', header: 'KM', cell: (row) => `${row.distanceKm || 0} km` },
        { key: 'claimedAmount', header: 'Claimed', cell: (row) => <span className="font-semibold">Rs {row.claimedAmount.toFixed(2)}</span> },
        { key: 'approvedAmount', header: 'Approved', cell: (row) => <span className="font-semibold text-emerald-600">Rs {row.approvedAmount.toFixed(2)}</span> },
        { key: 'receiptStatus', header: 'Receipt', cell: (row) => <StatusHighlighter value={row.receiptStatus} /> },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="Allowance Tracking"
                subtitle="Track staff travel, petrol, toll, food, and field-duty reimbursements."
                breadcrumbs={[{ label: 'Finance' }, { label: 'Allowance Tracking' }]}
            />

            <ActionBar onAdd={() => setIsDrawerOpen(true)} addLabel="Add Allowance Claim" />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {monthlySummary.map((item) => (
                    <div key={item.label} className="bg-white dark:bg-black border border-gray-100/80 dark:border-white/10 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-gray-100">{item.value}</p>
                    </div>
                ))}
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search staff, purpose, or allowance type..."
                filters={[
                    {
                        name: 'status',
                        value: statusFilter,
                        onChange: (event) => setStatusFilter(event.target.value),
                        options: [
                            { value: 'ALL', label: 'All Status' },
                            { value: 'Draft', label: 'Draft' },
                            { value: 'Submitted', label: 'Submitted' },
                            { value: 'HR Verified', label: 'HR Verified' },
                            { value: 'Finance Approved', label: 'Finance Approved' },
                            { value: 'Paid', label: 'Paid' },
                            { value: 'Rejected', label: 'Rejected' },
                        ]
                    }
                ]}
            />

            <DataTable
                data={filteredClaims}
                columns={columns}
                keyExtractor={(row) => row.id}
                emptyStateMessage="No allowance claims found"
            />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add Allowance Claim" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Staff"
                            value={formData.staffId}
                            onChange={(event) => handleStaffChange(event.target.value)}
                            options={staffOptions}
                            placeholder="Select staff"
                            required
                        />
                        <Input label="Role" value={formData.role} onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))} placeholder="Doctor / Nurse / Driver" required />
                        <Select
                            label="Allowance Type"
                            value={formData.allowanceType}
                            onChange={(event) => setFormData((current) => ({ ...current, allowanceType: event.target.value }))}
                            options={[
                                { value: 'Petrol', label: 'Petrol' },
                                { value: 'Travel', label: 'Travel' },
                                { value: 'Food', label: 'Food' },
                                { value: 'Parking', label: 'Parking' },
                                { value: 'Toll', label: 'Toll' },
                                { value: 'Other', label: 'Other' }
                            ]}
                        />
                        <Input label="Trip Date" type="date" value={formData.tripDate} onChange={(event) => setFormData((current) => ({ ...current, tripDate: event.target.value }))} required />
                        <Input label="From Location" value={formData.fromLocation} onChange={(event) => setFormData((current) => ({ ...current, fromLocation: event.target.value }))} placeholder="Starting point" required />
                        <Input label="To Location" value={formData.toLocation} onChange={(event) => setFormData((current) => ({ ...current, toLocation: event.target.value }))} placeholder="Destination" required />
                        <Input label="Distance KM" type="number" value={formData.distanceKm} onChange={(event) => {
                            const distanceKm = event.target.value
                            const ratePerKm = formData.ratePerKm
                            setFormData((current) => ({
                                ...current,
                                distanceKm,
                                claimedAmount: distanceKm && ratePerKm ? String(Number(distanceKm) * Number(ratePerKm)) : current.claimedAmount
                            }))
                        }} />
                        <Input label="Rate Per KM" type="number" value={formData.ratePerKm} onChange={(event) => {
                            const ratePerKm = event.target.value
                            const distanceKm = formData.distanceKm
                            setFormData((current) => ({
                                ...current,
                                ratePerKm,
                                claimedAmount: distanceKm && ratePerKm ? String(Number(distanceKm) * Number(ratePerKm)) : current.claimedAmount
                            }))
                        }} />
                        <Input label="Claimed Amount" type="number" value={formData.claimedAmount} onChange={(event) => setFormData((current) => ({ ...current, claimedAmount: event.target.value }))} required />
                        <Input label="Approved Amount" type="number" value={formData.approvedAmount} onChange={(event) => setFormData((current) => ({ ...current, approvedAmount: event.target.value }))} />
                        <Select
                            label="Receipt Status"
                            value={formData.receiptStatus}
                            onChange={(event) => setFormData((current) => ({ ...current, receiptStatus: event.target.value }))}
                            options={[
                                { value: 'Attached', label: 'Attached' },
                                { value: 'Missing', label: 'Missing' },
                                { value: 'Not Required', label: 'Not Required' }
                            ]}
                        />
                        <Select
                            label="Status"
                            value={formData.status}
                            onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
                            options={[
                                { value: 'Draft', label: 'Draft' },
                                { value: 'Submitted', label: 'Submitted' },
                                { value: 'HR Verified', label: 'HR Verified' },
                                { value: 'Finance Approved', label: 'Finance Approved' },
                                { value: 'Paid', label: 'Paid' },
                                { value: 'Rejected', label: 'Rejected' },
                            ]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trip Purpose</label>
                        <textarea
                            value={formData.purpose}
                            onChange={(event) => setFormData((current) => ({ ...current, purpose: event.target.value }))}
                            className="w-full h-24 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 focus:border-[#0F969C]"
                            placeholder="Example: Doctor visit to patient home, hospital transfer, medicine pickup"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 dark:text-gray-300 dark:border-white/10">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-xl bg-[#0F969C] text-sm font-semibold text-white">
                            Save Claim
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
