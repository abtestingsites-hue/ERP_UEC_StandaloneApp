import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Database, Edit2, Eye, FileText, Printer, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { Modal } from '../../../components/Modal'
import { Select } from '../../../components/Select'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { api } from '../../../lib/axios'

type AdminFileGroup = 'UNCF Documents' | 'Staff Files' | 'Client Files' | 'Finance Files' | 'UEC Licence Files' | 'UEC Documents' | 'Admin Record Books' | 'Nursing Files' | 'Watchman Files'
type AdminFileStatus = 'Not Uploaded' | 'Received' | 'Verified' | 'Archived'

interface AdminFileRecord {
    id: string
    group: AdminFileGroup
    fileType: string
    relatedName: string
    fileNo: string
    fileName: string
    maintainedBy: string
    date: string
    issueDate?: string
    expiryDate?: string
    renewalReminderDate?: string
    status: AdminFileStatus
    remarks: string
    uploadedFileId?: string
    uploadedFileName?: string
    uploadedFileUrl?: string
    uploadedAt?: string
    isAutoFetched?: boolean
    sourceType?: string
    sourceId?: string
}

interface OperationalRecordDetail {
    sourceType: string
    record: any
}

const fileTypes: Array<{ group: AdminFileGroup, value: string }> = [
    { group: 'UNCF Documents', value: 'Company Documents' },
    { group: 'UNCF Documents', value: 'Trust / Organization Records' },
    { group: 'UNCF Documents', value: 'Admin Circulars' },
    { group: 'Staff Files', value: 'Staff Resume' },
    { group: 'Staff Files', value: 'Staff Application' },
    { group: 'Staff Files', value: 'Staff Confirmation and Joining Letter' },
    { group: 'Staff Files', value: 'Staff Verification' },
    { group: 'Staff Files', value: 'Staff Letter' },
    { group: 'Client Files', value: 'Clients Application' },
    { group: 'Client Files', value: 'Client Verification' },
    { group: 'Client Files', value: 'Clients Moments Letter' },
    { group: 'Client Files', value: 'Clients Feedback Form' },
    { group: 'Finance Files', value: 'UEC Bills' },
    { group: 'Finance Files', value: 'UEC Old Bills' },
    { group: 'Finance Files', value: 'UEC Vouchers' },
    { group: 'Finance Files', value: 'UEC Old Vouchers' },
    { group: 'UEC Licence Files', value: 'Fire Certificate' },
    { group: 'UEC Licence Files', value: 'Sanitary Certificate' },
    { group: 'UEC Licence Files', value: 'Building Stability Certificate' },
    { group: 'UEC Licence Files', value: 'Tahsildar Certificate' },
    { group: 'UEC Licence Files', value: 'FSSAI Certificate' },
    { group: 'UEC Licence Files', value: 'DSW Certificate' },
    { group: 'UEC Licence Files', value: 'Rental Deed' },
    { group: 'UEC Licence Files', value: 'Promissory Note' },
    { group: 'UEC Documents', value: 'Resident Agreement' },
    { group: 'UEC Documents', value: 'Policy Guidelines' },
    { group: 'UEC Documents', value: 'Compliance Report' },
    { group: 'Admin Record Books', value: 'Important Contact / Yellow Pages' },
    { group: 'Admin Record Books', value: 'Day Book Record' },
    { group: 'Admin Record Books', value: 'Inmate Attendance Record' },
    { group: 'Admin Record Books', value: 'Staff Attendance Record' },
    { group: 'Admin Record Books', value: 'Admission Register' },
    { group: 'Admin Record Books', value: 'Staff Register' },
    { group: 'Admin Record Books', value: 'Salary Register' },
    { group: 'Admin Record Books', value: 'Nursing Student Register' },
    { group: 'Admin Record Books', value: 'Officer Inspection Register' },
    { group: 'Admin Record Books', value: 'Accounts Register' },
    { group: 'Admin Record Books', value: 'Petty Cash Register' },
    { group: 'Admin Record Books', value: 'Stock Ration Dry' },
    { group: 'Admin Record Books', value: 'Stock Ration Fresh' },
    { group: 'Admin Record Books', value: 'Stock Cleaning Materials' },
    { group: 'Admin Record Books', value: 'Death Register' },
    { group: 'Admin Record Books', value: 'Donor Register' },
    { group: 'Admin Record Books', value: 'Stock Clerical' },
    { group: 'Admin Record Books', value: 'Stock Electrical' },
    { group: 'Admin Record Books', value: 'Stock Plumbing' },
    { group: 'Admin Record Books', value: 'Old Age Enquiry Record' },
    { group: 'Admin Record Books', value: 'Staff Enquiry Record' },
    { group: 'Admin Record Books', value: 'Donor Enquiry Record' },
    { group: 'Admin Record Books', value: 'Assets Record' },
    { group: 'Nursing Files', value: 'Inmates Revenue' },
    { group: 'Nursing Files', value: 'Inmates Revenue Old Record' },
    { group: 'Nursing Files', value: 'Inmates Vitals Record' },
    { group: 'Nursing Files', value: 'Inmates Vitals Old Record' },
    { group: 'Nursing Files', value: 'Staff Vital and Revenue' },
    { group: 'Nursing Files', value: 'Staff Old Vitals and Revenue' },
    { group: 'Nursing Files', value: 'Inmates Medical Record' },
    { group: 'Nursing Files', value: 'Staffs Medical Record' },
    { group: 'Nursing Files', value: 'Doctor Check Up Record' },
    { group: 'Nursing Files', value: 'Nursing Student Register' },
    { group: 'Nursing Files', value: 'Nursing Register' },
    { group: 'Nursing Files', value: 'UEC Stock Medicine Register' },
    { group: 'Nursing Files', value: 'First Aid Register' },
    { group: 'Nursing Files', value: 'UEC Stock - Gloves, Mask, Catheter, Urobag, Bedwipes, Rubbersheet and Underpad' },
    { group: 'Nursing Files', value: 'Food Register' },
    { group: 'Nursing Files', value: 'Medical Equipments Record' },
    { group: 'Watchman Files', value: 'Visitors Record' },
    { group: 'Watchman Files', value: 'Outside Staff In and Out Register Record' },
    { group: 'Watchman Files', value: 'Inmates Movement Register Record' },
    { group: 'Watchman Files', value: 'Staff Movement Register Record' },
    { group: 'Watchman Files', value: 'Garbage Register Record' },
    { group: 'Watchman Files', value: 'Milk Register Record' },
    { group: 'Watchman Files', value: 'News Paper and Journal Record' },
    { group: 'Watchman Files', value: 'Post / Courier Incoming and Outgoing Register' },
    { group: 'Watchman Files', value: 'Incoming and Outgoing Material Register' },
    { group: 'Watchman Files', value: 'Vehicle In and Out Record' },
    { group: 'Watchman Files', value: 'Tank Cleaning Register' },
    { group: 'Watchman Files', value: 'Motor On and Off Record' }
]

const createSeedRecords = (): AdminFileRecord[] => fileTypes.map((item, index) => ({
    id: `ADMIN-FILE-${String(index + 1).padStart(3, '0')}`,
    group: item.group,
    fileType: item.value,
    relatedName: '-',
    fileNo: '-',
    fileName: '-',
    maintainedBy: 'Admin',
    date: '',
    issueDate: '',
    expiryDate: '',
    renewalReminderDate: '',
    status: 'Not Uploaded',
    remarks: ''
}))

const normalizeGroup = (group: string): AdminFileGroup => {
    if (group === 'UEC Documents') return 'UEC Documents'
    if (groupOptions.some((option) => option.value === group && option.value !== 'ALL')) return group as AdminFileGroup
    return 'UNCF Documents'
}

const resolveGroupForFileType = (group: string, fileType: string): AdminFileGroup => {
    const matchingType = fileTypes.find((item) => item.value === fileType)
    if (matchingType) return matchingType.group
    return normalizeGroup(group)
}

const mergeWithSeedRecords = (savedRecords: any[]): AdminFileRecord[] => {
    const normalizedSaved = savedRecords.map((record) => ({
        ...record,
        group: resolveGroupForFileType(String(record.group || 'UNCF Documents'), String(record.fileType || '')),
        date: formatDateInput(record.date),
        issueDate: formatDateInput(record.issueDate),
        expiryDate: formatDateInput(record.expiryDate),
        renewalReminderDate: formatDateInput(record.renewalReminderDate),
        status: record.status || 'Not Uploaded'
    })) as AdminFileRecord[]
    const savedKeys = new Set(normalizedSaved.map((record) => `${record.group}::${record.fileType}`))
    const missingSeeds = createSeedRecords().filter((record) => !savedKeys.has(`${record.group}::${record.fileType}`))

    return [...normalizedSaved, ...missingSeeds]
}

function formatDateInput(value?: string | null) {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10)
    return parsed.toISOString().slice(0, 10)
}

const fetchAdminFileRecords = async () => {
    const response = await api.get('/admin-files/register')
    return mergeWithSeedRecords(response.data?.data || [])
}

const emptyForm: Omit<AdminFileRecord, 'id'> = {
    group: 'UNCF Documents',
    fileType: 'Company Documents',
    relatedName: '',
    fileNo: '',
    fileName: '',
    maintainedBy: 'Admin',
    date: '',
    issueDate: '',
    expiryDate: '',
    renewalReminderDate: '',
    status: 'Received',
    remarks: ''
}

const groupOptions = [
    { value: 'ALL', label: 'All File Groups' },
    { value: 'UNCF Documents', label: 'UNCF Documents' },
    { value: 'Staff Files', label: 'Staff Files' },
    { value: 'Client Files', label: 'Client Files' },
    { value: 'Finance Files', label: 'Finance Files' },
    { value: 'UEC Licence Files', label: 'UEC Licence Files' },
    { value: 'Admin Record Books', label: 'Admin Record Books' },
    { value: 'Nursing Files', label: 'Nursing Files' },
    { value: 'Watchman Files', label: 'Watchman Files' }
]

const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'Not Uploaded', label: 'Not Uploaded' },
    { value: 'Received', label: 'Received' },
    { value: 'Verified', label: 'Verified' },
    { value: 'Archived', label: 'Archived' }
]

const renewalStatusOptions = [
    { value: 'ALL', label: 'All Renewal Status' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Due Soon', label: 'Due Soon' },
    { value: 'Active', label: 'Active' },
    { value: 'No Expiry', label: 'No Expiry' }
]

const sectionOptions = [
    {
        value: 'ADMINISTRATIVE',
        label: 'Administrative Documents',
        description: 'Official documents, uploaded files, licences, agreements, certificates, and office records.',
        icon: FileText
    },
    {
        value: 'OPERATIONAL',
        label: 'Operational Records',
        description: 'System-generated care, vitals, billing, revenue, and register records from ERP modules.',
        icon: Database
    }
]

const operationalGroups: AdminFileGroup[] = ['Admin Record Books', 'Nursing Files', 'Watchman Files']

const isOperationalRecord = (record: AdminFileRecord) => record.isAutoFetched || operationalGroups.includes(record.group)

const isOperationalGroup = (group: AdminFileGroup | 'ALL') => group !== 'ALL' && operationalGroups.includes(group)

const daysInMonth = (month?: string) => {
    const [year, monthNumber] = String(month || '').split('-').map(Number)
    if (!year || !monthNumber) return 31
    return new Date(year, monthNumber, 0).getDate()
}

const readJsonArray = (value: any) => Array.isArray(value) ? value : []

const readJsonObject = (value: any) => value && typeof value === 'object' && !Array.isArray(value) ? value : {}

const getDayValue = (days: Record<string, number> | undefined, day: number) => {
    const value = days?.[String(day)] ?? days?.[day as any]
    return value ? String(value) : ''
}

const totalRevenueItem = (item: any) => {
    const rate = Number(item.rate || 0)
    const quantity = Object.values(item.days || {}).reduce<number>((sum, value) => sum + Number(value || 0), 0)
    return rate * quantity
}

const getRenewalStatus = (record: AdminFileRecord) => {
    if (!record.expiryDate) return 'No Expiry'

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiryDate = new Date(record.expiryDate)
    expiryDate.setHours(0, 0, 0, 0)
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysToExpiry < 0) return 'Expired'
    if (daysToExpiry <= 30) return 'Due Soon'

    if (record.renewalReminderDate) {
        const reminderDate = new Date(record.renewalReminderDate)
        reminderDate.setHours(0, 0, 0, 0)
        if (today >= reminderDate) return 'Due Soon'
    }

    return 'Active'
}

function VitalChartDocument({ record }: { record: any }) {
    const entries = readJsonArray(record.entries)
    const signatures = readJsonObject(record.signatures)
    const dayCount = daysInMonth(record.month)
    const rowForDay = (day: number) => entries.find((entry: any) => Number(entry.day) === day) || {}

    return (
        <div className="space-y-4 text-gray-900">
            <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">UEC</div>
                <h2 className="text-lg font-bold">Care Giver's Vital Sign Chart</h2>
                <div className="text-sm text-gray-600">Month: {record.month || '-'}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div><span className="font-semibold">Inmate:</span> {record.patientName || '-'}</div>
                <div><span className="font-semibold">Patient ID:</span> {record.patientId || '-'}</div>
                <div><span className="font-semibold">Age:</span> {record.age || '-'}</div>
                <div><span className="font-semibold">Sex:</span> {record.sex || '-'}</div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-[1400px] border-collapse text-[11px]">
                    <thead>
                        <tr className="bg-gray-100">
                            {['Day', 'Temp M', 'Temp E', 'BP M', 'BP E', 'PR M', 'PR E', 'SPO2 M', 'SPO2 E', 'RR M', 'RR E', 'Glucose BF', 'Glucose AF', 'W/kg', 'BF', 'Lunch', 'Dinner', 'Urine', 'Stool', 'Sign'].map((header) => (
                                <th key={header} className="border border-gray-300 px-2 py-1 text-left">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: dayCount }, (_, index) => {
                            const day = index + 1
                            const entry = rowForDay(day)
                            return (
                                <tr key={day}>
                                    <td className="border border-gray-300 px-2 py-1 font-semibold">{day}</td>
                                    {['tempMor', 'tempEve', 'bpMor', 'bpEve', 'pulseMor', 'pulseEve', 'spo2Mor', 'spo2Eve', 'rrMor', 'rrEve', 'glucoseBf', 'glucoseAf', 'weight', 'intakeBf', 'intakeLunch', 'intakeDinner', 'urine', 'stool', 'sign'].map((key) => (
                                        <td key={key} className="border border-gray-300 px-2 py-1">{entry[key] || ''}</td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div><span className="font-semibold">Doctor:</span> {signatures.doctor || '-'}</div>
                <div><span className="font-semibold">Nurse:</span> {signatures.nurse || '-'}</div>
                <div><span className="font-semibold">Attender:</span> {signatures.attender || '-'}</div>
                <div><span className="font-semibold">Manager:</span> {signatures.manager || '-'}</div>
            </div>
        </div>
    )
}

function RevenueSheetDocument({ record }: { record: any }) {
    const items = readJsonArray(record.items)
    const signatures = readJsonObject(record.signatures)
    const dayCount = daysInMonth(record.month)

    return (
        <div className="space-y-4 text-gray-900">
            <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">UEC</div>
                <h2 className="text-lg font-bold">Care Giver's Total Revenue Form</h2>
                <div className="text-sm text-gray-600">Month: {record.month || '-'}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div><span className="font-semibold">Inmate:</span> {record.patientName || '-'}</div>
                <div><span className="font-semibold">Client:</span> {record.clientName || '-'}</div>
                <div><span className="font-semibold">Patient ID:</span> {record.patientId || '-'}</div>
                <div><span className="font-semibold">Total:</span> Rs {Number(record.totalAmount || 0).toFixed(2)}</div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-[1500px] border-collapse text-[11px]">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-2 py-1 text-left">Item</th>
                            <th className="border border-gray-300 px-2 py-1 text-left">Rate</th>
                            {Array.from({ length: dayCount }, (_, index) => (
                                <th key={index + 1} className="border border-gray-300 px-2 py-1 text-center">{index + 1}</th>
                            ))}
                            <th className="border border-gray-300 px-2 py-1 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any) => (
                            <tr key={item.key || item.label}>
                                <td className="border border-gray-300 px-2 py-1 font-semibold">{item.label || item.key}</td>
                                <td className="border border-gray-300 px-2 py-1">Rs {Number(item.rate || 0).toFixed(2)}</td>
                                {Array.from({ length: dayCount }, (_, index) => (
                                    <td key={index + 1} className="border border-gray-300 px-2 py-1 text-center">{getDayValue(item.days, index + 1)}</td>
                                ))}
                                <td className="border border-gray-300 px-2 py-1 text-right font-semibold">Rs {totalRevenueItem(item).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div><span className="font-semibold">Caregiver Day:</span> {signatures.caregiverDay || '-'}</div>
                <div><span className="font-semibold">Caregiver Night:</span> {signatures.caregiverNight || '-'}</div>
                <div><span className="font-semibold">Nurse:</span> {signatures.nurse || '-'}</div>
                <div><span className="font-semibold">Manager:</span> {signatures.manager || '-'}</div>
            </div>
        </div>
    )
}

function OperationalRecordDocument({ detail }: { detail: OperationalRecordDetail }) {
    if (detail.sourceType === 'CAREGIVER_VITAL_CHART') {
        return <VitalChartDocument record={detail.record} />
    }

    if (detail.sourceType === 'CAREGIVER_REVENUE_SHEET') {
        return <RevenueSheetDocument record={detail.record} />
    }

    return <div className="text-sm text-gray-600">No document view is available for this operational record yet.</div>
}

export function AdminFileRegister() {
    const location = useLocation()
    const [records, setRecords] = useState<AdminFileRecord[]>(() => createSeedRecords())
    const [isLoadingRecords, setIsLoadingRecords] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSection, setSelectedSection] = useState<'ADMINISTRATIVE' | 'OPERATIONAL'>('ADMINISTRATIVE')
    const [selectedGroup, setSelectedGroup] = useState('ALL')
    const [selectedStatus, setSelectedStatus] = useState('ALL')
    const [selectedRenewalStatus, setSelectedRenewalStatus] = useState('ALL')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState(emptyForm)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [operationalDetail, setOperationalDetail] = useState<OperationalRecordDetail | null>(null)
    const [isLoadingOperationalDetail, setIsLoadingOperationalDetail] = useState(false)

    const routeGroup = useMemo<AdminFileGroup | 'ALL'>(() => {
        if (location.pathname.includes('/uncf-documents')) return 'UNCF Documents'
        if (location.pathname.includes('/staff-files')) return 'Staff Files'
        if (location.pathname.includes('/client-files')) return 'Client Files'
        if (location.pathname.includes('/finance-files')) return 'Finance Files'
        if (location.pathname.includes('/uec-documents')) return 'UEC Documents'
        if (location.pathname.includes('/uec-licence-files')) return 'UEC Licence Files'
        if (location.pathname.includes('/record-books')) return 'Admin Record Books'
        if (location.pathname.includes('/nursing-files')) return 'Nursing Files'
        if (location.pathname.includes('/watchman-files')) return 'Watchman Files'
        return 'ALL'
    }, [location.pathname])

    useEffect(() => {
        setSelectedGroup(routeGroup)
        setSelectedSection(isOperationalGroup(routeGroup) ? 'OPERATIONAL' : 'ADMINISTRATIVE')
    }, [routeGroup])

    useEffect(() => {
        let mounted = true
        setIsLoadingRecords(true)
        fetchAdminFileRecords()
            .then((nextRecords) => {
                if (mounted) setRecords(nextRecords)
            })
            .catch(() => {
                if (mounted) setRecords(createSeedRecords())
            })
            .finally(() => {
                if (mounted) setIsLoadingRecords(false)
            })

        return () => {
            mounted = false
        }
    }, [])

    const availableFileTypes = useMemo(() => (
        fileTypes
            .filter((item) => item.group === formData.group)
            .map((item) => ({ value: item.value, label: item.value }))
    ), [formData.group])

    const filteredRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return records.filter((record) => {
            const matchesSection = selectedSection === 'OPERATIONAL' ? isOperationalRecord(record) : !isOperationalRecord(record)
            const matchesGroup = selectedGroup === 'ALL' || record.group === selectedGroup
            const matchesStatus = selectedStatus === 'ALL' || record.status === selectedStatus
            const matchesRenewalStatus = selectedRenewalStatus === 'ALL' || getRenewalStatus(record) === selectedRenewalStatus
            const matchesSearch = !query || [
                record.fileType,
                record.group,
                record.relatedName,
                record.fileNo,
                record.fileName,
                record.maintainedBy,
                record.issueDate || '',
                record.expiryDate || '',
                record.renewalReminderDate || '',
                record.remarks
            ].some((value) => value.toLowerCase().includes(query))

            return matchesSection && matchesGroup && matchesStatus && matchesRenewalStatus && matchesSearch
        })
    }, [records, searchQuery, selectedSection, selectedGroup, selectedStatus, selectedRenewalStatus])

    const sectionCounts = useMemo(() => ({
        administrative: records.filter((record) => !isOperationalRecord(record)).length,
        operational: records.filter((record) => isOperationalRecord(record)).length
    }), [records])

    const visibleGroupOptions = useMemo(() => {
        const groupsForSection = groupOptions.filter((option) => {
            if (option.value === 'ALL') return true
            const group = option.value as AdminFileGroup
            return selectedSection === 'OPERATIONAL' ? operationalGroups.includes(group) : !operationalGroups.includes(group)
        })

        return groupsForSection.some((option) => option.value === selectedGroup)
            ? groupsForSection
            : groupsForSection.map((option) => option.value === 'ALL' ? { ...option, label: selectedSection === 'OPERATIONAL' ? 'All Operational Groups' : 'All Document Groups' } : option)
    }, [selectedGroup, selectedSection])

    const openAddDrawer = () => {
        const group = routeGroup !== 'ALL' ? routeGroup : 'UNCF Documents'
        const firstType = fileTypes.find((item) => item.group === group)?.value || ''
        setEditingId(null)
        setFormData({ ...emptyForm, group, fileType: firstType })
        setSelectedFile(null)
        setDrawerOpen(true)
    }

    const openEditDrawer = (record: AdminFileRecord) => {
        if (record.isAutoFetched) {
            window.alert('Operational records are generated from their source module. Edit the original vitals or revenue entry to update this record.')
            return
        }
        setEditingId(record.id)
        setFormData({
            group: record.group,
            fileType: record.fileType,
            relatedName: record.relatedName === '-' ? '' : record.relatedName,
            fileNo: record.fileNo === '-' ? '' : record.fileNo,
            fileName: record.fileName === '-' ? '' : record.fileName,
            maintainedBy: record.maintainedBy,
            date: record.date,
            issueDate: record.issueDate || '',
            expiryDate: record.expiryDate || '',
            renewalReminderDate: record.renewalReminderDate || '',
            status: record.status,
            remarks: record.remarks
        })
        setSelectedFile(null)
        setDrawerOpen(true)
    }

    const handleDelete = (id: string) => {
        if (id.startsWith('AUTO-')) {
            window.alert('Operational records cannot be deleted from Admin Files. Update or remove the source record in its module.')
            return
        }
        if (!window.confirm('Delete this file register entry?')) return
        if (id.startsWith('ADMIN-FILE-')) {
            setRecords((prev) => prev.filter((record) => record.id !== id))
            return
        }

        api.delete(`/admin-files/register/${id}`)
            .then(() => setRecords((prev) => mergeWithSeedRecords(prev.filter((record) => record.id !== id))))
            .catch((error: any) => window.alert(error?.response?.data?.message || 'File entry could not be deleted'))
    }

    const openOperationalRecord = async (record: AdminFileRecord) => {
        if (!record.isAutoFetched || !record.sourceType || !record.sourceId) {
            window.alert('This operational register is listed, but a live ERP document view has not been connected yet.')
            return
        }

        setIsLoadingOperationalDetail(true)
        try {
            const response = await api.get(`/admin-files/operational-records/${record.sourceType}/${record.sourceId}`)
            setOperationalDetail(response.data?.data || null)
        } catch (error: any) {
            window.alert(error?.response?.data?.message || 'Operational record could not be loaded')
        } finally {
            setIsLoadingOperationalDetail(false)
        }
    }

    const printOperationalRecord = () => {
        const content = document.getElementById('operational-record-print-area')?.innerHTML
        if (!content) return

        const printWindow = window.open('', '_blank', 'width=1200,height=800')
        if (!printWindow) return

        printWindow.document.write(`
            <html>
                <head>
                    <title>Operational Record</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #d1d5db; padding: 4px 6px; font-size: 11px; }
                        th { background: #f3f4f6; text-align: left; }
                        h2 { margin: 4px 0; }
                        .overflow-x-auto { overflow: visible !important; }
                        .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
                        .text-center { text-align: center; }
                        .font-semibold { font-weight: 600; }
                        .font-bold { font-weight: 700; }
                        .text-right { text-align: right; }
                        .text-xs, .text-sm, .text-\\[11px\\] { font-size: 11px; }
                    </style>
                </head>
                <body>${content}</body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
    }

    const uploadAdminFile = async (recordId: string) => {
        if (!selectedFile) return null

        const uploadData = new FormData()
        uploadData.append('file', selectedFile)
        uploadData.append('entityId', recordId)
        uploadData.append('fileGroup', formData.group)
        uploadData.append('fileType', formData.fileType)

        const response = await api.post('/admin-files/upload', uploadData)
        return response.data?.data || null
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const recordId = editingId || `ADMIN-FILE-${Date.now()}`

        setIsUploading(true)
        try {
            const uploadedFile = await uploadAdminFile(recordId)

            const nextRecord: AdminFileRecord = {
                id: recordId,
                ...formData,
                relatedName: formData.relatedName.trim() || '-',
                fileNo: formData.fileNo.trim() || '-',
                fileName: formData.fileName.trim() || uploadedFile?.fileName || '-',
                maintainedBy: formData.maintainedBy.trim() || 'Admin',
                issueDate: formData.issueDate || '',
                expiryDate: formData.expiryDate || '',
                renewalReminderDate: formData.renewalReminderDate || '',
                status: selectedFile ? 'Received' : formData.status,
                remarks: formData.remarks.trim(),
                ...(uploadedFile ? {
                    uploadedFileId: uploadedFile.id,
                    uploadedFileName: uploadedFile.fileName,
                    uploadedFileUrl: uploadedFile.fileUrl,
                    uploadedAt: uploadedFile.createdAt
                } : {})
            }

            const shouldCreate = !editingId || editingId.startsWith('ADMIN-FILE-')
            const response = shouldCreate
                ? await api.post('/admin-files/register', nextRecord)
                : await api.put(`/admin-files/register/${editingId}`, nextRecord)
            const savedRecord = response.data?.data || nextRecord

            setRecords((prev) => {
                const withoutEdited = editingId ? prev.filter((record) => record.id !== editingId) : prev
                const withoutDuplicateSeed = withoutEdited.filter((record) => `${record.group}::${record.fileType}` !== `${savedRecord.group}::${savedRecord.fileType}`)
                return mergeWithSeedRecords([savedRecord, ...withoutDuplicateSeed])
            })
            setDrawerOpen(false)
            setEditingId(null)
            setFormData(emptyForm)
            setSelectedFile(null)
        } catch (error: any) {
            const message = error?.response?.data?.message || 'File entry could not be saved'
            window.alert(message)
        } finally {
            setIsUploading(false)
        }
    }

    const columns: Column<AdminFileRecord>[] = [
        { key: 'sno', header: 'S.No', cell: (_item, index) => index + 1, sortable: false },
        { key: 'group', header: 'File Group', sortable: true },
        {
            key: 'fileType',
            header: 'File Type',
            cell: (record) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{record.fileType}</span>
                    <span className="text-xs text-gray-500">{record.fileNo}</span>
                </div>
            )
        },
        { key: 'relatedName', header: 'Related To', sortable: true },
        {
            key: 'fileName',
            header: 'File Name / Location',
            cell: (record) => (
                <div className="flex flex-col">
                    <span>{record.fileName}</span>
                    {record.uploadedFileUrl ? (
                        <a
                            href={record.uploadedFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-[#0F969C] hover:underline"
                        >
                            View uploaded file
                        </a>
                    ) : null}
                </div>
            )
        },
        { key: 'maintainedBy', header: 'Maintained By' },
        { key: 'date', header: 'Date', cell: (record) => record.date || '-' },
        {
            key: 'expiryDate',
            header: 'Renewal',
            cell: (record) => {
                const renewalStatus = getRenewalStatus(record)
                return (
                    <div className="flex flex-col gap-1">
                        <StatusHighlighter value={renewalStatus} />
                        <span className="text-xs text-gray-500">
                            {record.expiryDate ? `Expiry: ${record.expiryDate}` : 'No expiry date'}
                        </span>
                        {record.renewalReminderDate ? (
                            <span className="text-xs text-gray-500">Reminder: {record.renewalReminderDate}</span>
                        ) : null}
                    </div>
                )
            }
        },
        { key: 'status', header: 'Status', cell: (record) => <StatusHighlighter value={record.status} /> },
        {
            key: 'action',
            header: 'Action',
            cell: (record) => (
                <div className="flex items-center justify-center gap-1">
                    {isOperationalRecord(record) ? (
                        <button
                            onClick={() => openOperationalRecord(record)}
                            className={`p-1.5 text-white rounded ${record.isAutoFetched ? 'bg-[#0F969C] hover:bg-[#294D61]' : 'bg-gray-400 hover:bg-gray-500'}`}
                            title={record.isAutoFetched ? 'View operational record' : 'Document view not connected yet'}
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                    ) : null}
                    <button
                        onClick={() => openEditDrawer(record)}
                        className={`p-1.5 text-white rounded ${record.isAutoFetched ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'}`}
                        title={record.isAutoFetched ? 'Generated from source module' : 'Edit'}
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(record.id)}
                        className={`p-1.5 text-white rounded ${record.isAutoFetched ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                        title={record.isAutoFetched ? 'Generated from source module' : 'Delete'}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader title={routeGroup === 'ALL' ? 'Admin File Register' : routeGroup} breadcrumbs={[{ label: 'Home' }, { label: 'Admin Files' }]} />

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {sectionOptions.map((section) => {
                    const Icon = section.icon
                    const isActive = selectedSection === section.value
                    const count = section.value === 'ADMINISTRATIVE' ? sectionCounts.administrative : sectionCounts.operational

                    return (
                        <button
                            key={section.value}
                            type="button"
                            onClick={() => {
                                const nextSection = section.value as 'ADMINISTRATIVE' | 'OPERATIONAL'
                                setSelectedSection(nextSection)
                                const selectedGroupIsOperational = selectedGroup !== 'ALL' && operationalGroups.includes(selectedGroup as AdminFileGroup)
                                if ((nextSection === 'OPERATIONAL') !== selectedGroupIsOperational) {
                                    setSelectedGroup('ALL')
                                }
                            }}
                            className={`rounded-lg border p-4 text-left transition-colors ${
                                isActive
                                    ? 'border-[#0F969C] bg-[#F7FAFC] text-[#294D61] shadow-sm dark:border-[#6DA5C0] dark:bg-white/10 dark:text-white'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-300 dark:hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <span className={`rounded-md p-2 ${isActive ? 'bg-white/70 dark:bg-white/10' : 'bg-gray-100 dark:bg-white/5'}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <div className="text-sm font-semibold">{section.label}</div>
                                        <div className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{section.description}</div>
                                    </div>
                                </div>
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#294D61] shadow-sm dark:bg-white/10 dark:text-white">
                                    {count}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>

            {selectedSection === 'ADMINISTRATIVE' ? (
                <ActionBar onAdd={openAddDrawer} addLabel="Add Document Entry" />
            ) : null}

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search by file type, name, file no..."
                filters={[
                    {
                        name: 'group',
                        value: selectedGroup,
                        onChange: (event) => setSelectedGroup(event.target.value),
                        options: visibleGroupOptions
                    },
                    {
                        name: 'status',
                        value: selectedStatus,
                        onChange: (event) => setSelectedStatus(event.target.value),
                        options: statusOptions
                    },
                    {
                        name: 'renewalStatus',
                        value: selectedRenewalStatus,
                        onChange: (event) => setSelectedRenewalStatus(event.target.value),
                        options: renewalStatusOptions
                    }
                ]}
            />

            <DataTable
                data={filteredRecords}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={isLoadingRecords}
                emptyStateMessage="No admin files found"
            />

            {isLoadingOperationalDetail ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 text-sm font-semibold text-white">
                    Loading operational record...
                </div>
            ) : null}

            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={editingId ? 'Edit File Entry' : 'Add File Entry'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Select
                            label="File Group"
                            required
                            value={formData.group}
                            onChange={(event) => {
                                const group = event.target.value as AdminFileGroup
                                const firstType = fileTypes.find((item) => item.group === group)?.value || ''
                                setFormData((prev) => ({ ...prev, group, fileType: firstType }))
                            }}
                            options={groupOptions.filter((option) => option.value !== 'ALL')}
                        />
                        <Select
                            label="File Type"
                            required
                            value={formData.fileType}
                            onChange={(event) => setFormData((prev) => ({ ...prev, fileType: event.target.value }))}
                            options={availableFileTypes}
                        />
                        <Input
                            label="Related Staff / Client"
                            value={formData.relatedName}
                            onChange={(event) => setFormData((prev) => ({ ...prev, relatedName: event.target.value }))}
                            placeholder="Name or department"
                        />
                        <Input
                            label="File No / Reference"
                            value={formData.fileNo}
                            onChange={(event) => setFormData((prev) => ({ ...prev, fileNo: event.target.value }))}
                            placeholder="Reference number"
                        />
                        <Input
                            label="File Name / Location"
                            value={formData.fileName}
                            onChange={(event) => setFormData((prev) => ({ ...prev, fileName: event.target.value }))}
                            placeholder="Cabinet, shelf, drive link, or file name"
                        />
                        <Input
                            label="Maintained By"
                            value={formData.maintainedBy}
                            onChange={(event) => setFormData((prev) => ({ ...prev, maintainedBy: event.target.value }))}
                        />
                        <Input
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
                        />
                        <Input
                            label="Issue Date"
                            type="date"
                            value={formData.issueDate || ''}
                            onChange={(event) => setFormData((prev) => ({ ...prev, issueDate: event.target.value }))}
                        />
                        <Input
                            label="Expiry Date"
                            type="date"
                            value={formData.expiryDate || ''}
                            onChange={(event) => setFormData((prev) => ({ ...prev, expiryDate: event.target.value }))}
                        />
                        <Input
                            label="Renewal Reminder Date"
                            type="date"
                            value={formData.renewalReminderDate || ''}
                            onChange={(event) => setFormData((prev) => ({ ...prev, renewalReminderDate: event.target.value }))}
                        />
                        <Select
                            label="Status"
                            required
                            value={formData.status}
                            onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value as AdminFileStatus }))}
                            options={statusOptions.filter((option) => option.value !== 'ALL')}
                        />
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Document</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.docx"
                                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-[#F7FAFC] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#294D61] hover:bg-white focus:border-[#0F969C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 dark:border-white/10 dark:bg-black dark:text-gray-100 dark:hover:bg-white/5"
                            />
                            <p className="mt-1 text-xs text-gray-500">Allowed: PDF, JPG, PNG, DOCX. Maximum size: 5 MB.</p>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
                        <textarea
                            value={formData.remarks}
                            onChange={(event) => setFormData((prev) => ({ ...prev, remarks: event.target.value }))}
                            className="h-24 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 transition-all placeholder:text-gray-400 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 dark:border-white/10 dark:bg-black dark:text-gray-100 dark:hover:bg-white/5"
                            placeholder="Notes about verification, pending items, or physical file location"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(false)}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-300 dark:hover:bg-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#294D61]"
                        >
                            {isUploading ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </Drawer>

            <Modal
                isOpen={Boolean(operationalDetail)}
                onClose={() => setOperationalDetail(null)}
                title={operationalDetail?.sourceType === 'CAREGIVER_REVENUE_SHEET' ? 'Caregiver Revenue Sheet' : 'Caregiver Vital Chart'}
                size="xl"
                type="info"
                onConfirm={printOperationalRecord}
                confirmLabel="Print"
                cancelLabel="Close"
            >
                <div className="mt-4 max-h-[70vh] overflow-auto rounded-lg border border-gray-200 bg-white p-4">
                    <div id="operational-record-print-area">
                        {operationalDetail ? <OperationalRecordDocument detail={operationalDetail} /> : null}
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Printer className="h-4 w-4" />
                    Print uses the saved ERP data for this operational record.
                </div>
            </Modal>
        </div>
    )
}
