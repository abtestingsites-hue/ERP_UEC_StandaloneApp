import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, FileText, IndianRupee, Plus, Send, Upload } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Modal } from '../../../components/Modal'
import { useInvoices } from '../../accounts/hooks/useAccounts'
import {
    useCreatePatientDailyCost,
    useGeneratePatientFamilyInvoice,
    useMedicineCatalog,
    useMarkPatientReceiptSent,
    usePatientBillingServices,
    usePatientDailyCosts,
    useUploadPatientBillEntry
} from '../hooks/usePatientBilling'
import type { MedicineCatalogItem, PatientDailyCost, PatientService } from '../services/patientBilling'

const getLocalYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

const today = () => getLocalYMD(new Date())
const patientCostTabs = [
    { key: 'daily', label: 'Daily Sheets' },
    { key: 'lifecycle', label: 'Invoice Lifecycle' },
    { key: 'add', label: 'Add Expense' },
    { key: 'monthly', label: 'Monthly Invoice' }
] as const
type PatientCostTab = typeof patientCostTabs[number]['key']

const monthStart = () => {
    const date = new Date()
    return getLocalYMD(new Date(date.getFullYear(), date.getMonth(), 1))
}
const monthEnd = () => {
    const date = new Date()
    return getLocalYMD(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

const categoryByService: Record<string, string[]> = {
    HOME_CARE: ['Care Service Charges', 'Medicine Charges', 'Doctor Consultation Charges', 'Consumable Charges', 'Lab Charges', 'Other Charges'],
    CLINICAL: ['Care Service Charges', 'Medicine Charges', 'Doctor Consultation Charges', 'Consumable Charges', 'Lab Charges', 'Other Charges'],
    IN_HOUSE: ['Accommodation Charges', 'Care Service Charges', 'Medicine Charges', 'Doctor Consultation Charges', 'Consumable Charges', 'Lab Charges', 'Other Charges'],
    OTHERS: ['Care Service Charges', 'Medicine Charges', 'Doctor Consultation Charges', 'Consumable Charges', 'Lab Charges', 'Other Charges']
}

const formatMoney = (value: number | string | null | undefined) =>
    `Rs ${Number(value || 0).toFixed(2)}`

const formatDate = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const dateKey = (value?: string | null) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return getLocalYMD(date)
}

const formatSource = (value?: string | null) => {
    if (!value) return 'Manual'
    return value
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

const isDraftLedgerStatus = (value?: string | null) =>
    ['DRAFT', 'REVIEWED'].includes(String(value || '').trim().toUpperCase())

const chargeGroupForCategory = (category: string) => {
    const value = String(category || '').toLowerCase()
    if (value.includes('room') || value.includes('accommodation')) return 'Accommodation Charges'
    if (value.includes('care') || value.includes('staff') || value.includes('duty') || value.includes('service') || value.includes('extra hours')) return 'Care Service Charges'
    if (value.includes('consumable') || value.includes('diaper') || value.includes('glove') || value.includes('mask') || value.includes('catheter') || value.includes('uro') || value.includes('dressing') || value.includes('underpad') || value.includes('rubber')) return 'Consumable Charges'
    if (value.includes('medicine') || value.includes('injection')) return 'Medicine Charges'
    if (value.includes('doctor') || value.includes('consult')) return 'Doctor Consultation Charges'
    if (value.includes('lab') || value.includes('test')) return 'Lab Charges'
    return 'Other Charges'
}

type DailyExpenseSheet = {
    id: string
    date: string
    periodTo?: string
    billLabel: string
    sourceGroupId?: string | null
    patientName: string
    clientName?: string | null
    allocationId: string
    serviceType: string
    entries: PatientDailyCost[]
    summary: Array<{ name: string; amount: number }>
    total: number
}

type MonthlyInvoiceGroup = {
    id: string
    patientName: string
    clientName?: string | null
    allocationId: string
    serviceType: string
    sourceLabel: string
    sourceSummary: Array<{ name: string; entries: number; draftEntries: number; amount: number; draftAmount: number }>
    periodFrom: string
    periodTo: string
    entries: PatientDailyCost[]
    draftEntries: PatientDailyCost[]
    total: number
    draftTotal: number
    status: string
}

const pdfEscape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

const htmlEscape = (value: string | number | null | undefined) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const invoiceMoney = (value: number | string | null | undefined) =>
    `Rs ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const downloadSimplePdf = (fileName: string, lines: string[]) => {
    const safeLines = lines.flatMap((line) => {
        if (line.length <= 88) return [line]
        const chunks = []
        for (let index = 0; index < line.length; index += 88) chunks.push(line.slice(index, index + 88))
        return chunks
    })
    const content = [
        'BT',
        '/F1 11 Tf',
        '50 790 Td',
        ...safeLines.map((line, index) => `${index === 0 ? '' : '0 -18 Td'}(${pdfEscape(line)}) Tj`),
        'ET'
    ].join('\n')
    const objects = [
        '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
        '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
        '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
        '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
        `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`
    ]
    let pdf = '%PDF-1.4\n'
    const offsets = [0]
    objects.forEach((object) => {
        offsets.push(pdf.length)
        pdf += `${object}\n`
    })
    const xrefOffset = pdf.length
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
    })
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

    const blob = new Blob([pdf], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
}

const normalizeWhatsAppNumber = (value?: string | null) => {
    const digits = String(value || '').replace(/\D/g, '')
    if (digits.length === 10) return `91${digits}`
    if (digits.length === 12 && digits.startsWith('91')) return digits
    if (digits.length > 10 && digits.length <= 15) return digits
    return ''
}

const ledgerBillGroupId = (entry: PatientDailyCost) => {
    const sourceGroupId = entry.metadata?.sourceGroupId
    if (sourceGroupId) return String(sourceGroupId)
    return `${entry.allocationId}-${dateKey(entry.costDate)}`
}

const ledgerBillLabel = (entry: PatientDailyCost) => {
    const label = entry.metadata?.groupedBillLabel
    if (label) return String(label)
    if (entry.metadata?.billType === 'ENQUIRY_COMPLETION') return 'Enquiry Completion Bill'
    return 'Patient Daily Expense Sheet'
}

const monthlySourceTags = (entry: PatientDailyCost) => {
    const tags = [formatSource(entry.sourceType)]
    if (entry.metadata?.billType === 'ENQUIRY_COMPLETION') tags.push('Enquiry Completion Bill')
    return tags.filter(Boolean)
}

export function PatientDailyCost() {
    const { data: services = [], isLoading: servicesLoading } = usePatientBillingServices()
    const { data: entries = [], isLoading: entriesLoading } = usePatientDailyCosts()
    const { data: medicineCatalog = [] } = useMedicineCatalog()
    const { data: financeInvoices = [] } = useInvoices()
    const createEntry = useCreatePatientDailyCost()
    const uploadBillEntry = useUploadPatientBillEntry()
    const generateInvoice = useGeneratePatientFamilyInvoice()
    const markSent = useMarkPatientReceiptSent()

    const [manualAllocationId, setManualAllocationId] = useState('')
    const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([])
    const [costDate, setCostDate] = useState(today())
    const [category, setCategory] = useState('Medicine')
    const [description, setDescription] = useState('')
    const [quantity, setQuantity] = useState('1')
    const [rate, setRate] = useState('')
    const [billFile, setBillFile] = useState<File | null>(null)
    const [search, setSearch] = useState('')
    const [sourceFilter, setSourceFilter] = useState('ALL')
    const [receiptInvoice, setReceiptInvoice] = useState<any | null>(null)
    const [receiptEntries, setReceiptEntries] = useState<PatientDailyCost[]>([])
    const [selectedDailySheet, setSelectedDailySheet] = useState<DailyExpenseSheet | null>(null)
    const [selectedMonthlyGroup, setSelectedMonthlyGroup] = useState<MonthlyInvoiceGroup | null>(null)
    const [activeTab, setActiveTab] = useState<PatientCostTab>('daily')
    const [upiId, setUpiId] = useState('owner-gpay@upi')
    const [qrImageUrl, setQrImageUrl] = useState('')
    const [sentVia, setSentVia] = useState('WhatsApp')
    const [periodFrom, setPeriodFrom] = useState(monthStart())
    const [periodTo, setPeriodTo] = useState(monthEnd())

    const manualService = useMemo(
        () => services.find((service) => service.allocationId === manualAllocationId) || null,
        [manualAllocationId, services]
    )

    const serviceCategories = categoryByService[manualService?.serviceType || ''] || categoryByService.OTHERS
    const isMedicineCategory = /medicine|injection/i.test(category)

    const medicineOptions = useMemo(() => {
        const map = new Map<string, MedicineCatalogItem>()
        medicineCatalog.forEach((item) => {
            const key = String(item.name || '').trim().toLowerCase()
            if (!key || map.has(key)) return
            map.set(key, item)
        })
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
    }, [medicineCatalog])

    const selectedMedicine = useMemo(() => {
        const key = description.trim().toLowerCase()
        if (!key || !isMedicineCategory) return null
        return medicineOptions.find((item) => item.name.trim().toLowerCase() === key) || null
    }, [description, isMedicineCategory, medicineOptions])

    useEffect(() => {
        if (!selectedMedicine || Number(rate || 0) > 0 || Number(selectedMedicine.suggestedRate || 0) <= 0) return
        setRate(String(selectedMedicine.suggestedRate))
    }, [rate, selectedMedicine])

    const visibleEntries = useMemo(() => {
        const query = search.trim().toLowerCase()
        return entries.filter((entry) => {
            if (!query) return true
            return [
                entry.costNo,
                entry.patientName,
                entry.clientName || '',
                entry.serviceType,
                entry.category,
                entry.description,
                entry.status,
                entry.invoiceRefNo || '',
                entry.sentVia || '',
                entry.familyContact || ''
            ].some((value) => String(value).toLowerCase().includes(query))
        })
    }, [entries, search])

    const periodLedgerEntries = useMemo(() => {
        return entries.filter((entry) => selectedEntryIds.includes(entry.id) && isDraftLedgerStatus(entry.status))
    }, [entries, selectedEntryIds])

    const selectedInvoiceEntry = periodLedgerEntries[0] || null
    const billingService = useMemo(
        () => selectedInvoiceEntry ? services.find((service) => service.allocationId === selectedInvoiceEntry.allocationId) || null : null,
        [selectedInvoiceEntry, services]
    )
    const receiptService = useMemo(
        () => receiptInvoice ? services.find((service) => service.allocationId === receiptInvoice.allocationId) || billingService : billingService,
        [billingService, receiptInvoice, services]
    )
    const billingPatientLabel = selectedInvoiceEntry
        ? `${selectedInvoiceEntry.patientName} - ${selectedInvoiceEntry.serviceType.replace(/_/g, ' ')}`
        : 'No ledger row selected'

    const totals = useMemo(() => ({
        draft: entries.filter((entry) => isDraftLedgerStatus(entry.status)).reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        invoiced: entries.filter((entry) => entry.status === 'INVOICED').reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        selected: periodLedgerEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    }), [entries, periodLedgerEntries])

    const groupedCharges = useMemo(() => {
        const groups = [
            'Accommodation Charges',
            'Care Service Charges',
            'Medicine Charges',
            'Doctor Consultation Charges',
            'Lab Charges',
            'Other Charges'
        ]
        return groups.map((name) => ({
            name,
            amount: periodLedgerEntries
                .filter((entry) => chargeGroupForCategory(entry.category) === name)
                .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
            }))
    }, [periodLedgerEntries])

    const dailySheets = useMemo<DailyExpenseSheet[]>(() => {
        const grouped = new Map<string, PatientDailyCost[]>()

        visibleEntries.forEach((entry) => {
            const key = ledgerBillGroupId(entry)
            if (!grouped.has(key)) grouped.set(key, [])
            grouped.get(key)?.push(entry)
        })

        return Array.from(grouped.entries())
            .map(([id, sheetEntries]) => {
                const first = sheetEntries[0]
                const sortedEntries = [...sheetEntries].sort((a, b) => (
                    new Date(a.costDate).getTime() - new Date(b.costDate).getTime()
                    || new Date(a.createdAt || a.costDate).getTime() - new Date(b.createdAt || b.costDate).getTime()
                ))
                const last = sortedEntries[sortedEntries.length - 1]
                const summaryMap = new Map<string, number>()

                sheetEntries.forEach((entry) => {
                    const group = chargeGroupForCategory(entry.category)
                    summaryMap.set(group, Number((Number(summaryMap.get(group) || 0) + Number(entry.amount || 0)).toFixed(2)))
                })

                return {
                    id,
                    date: dateKey(first.costDate),
                    periodTo: dateKey(last.costDate),
                    billLabel: ledgerBillLabel(first),
                    sourceGroupId: first.metadata?.sourceGroupId ? String(first.metadata.sourceGroupId) : null,
                    patientName: first.patientName,
                    clientName: first.clientName,
                    allocationId: first.allocationId,
                    serviceType: first.serviceType,
                    entries: sortedEntries,
                    summary: Array.from(summaryMap.entries()).map(([name, amount]) => ({ name, amount })),
                    total: Number(sheetEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0).toFixed(2))
                }
            })
            .sort((a, b) => new Date(b.periodTo || b.date).getTime() - new Date(a.periodTo || a.date).getTime() || a.patientName.localeCompare(b.patientName))
    }, [visibleEntries])

    const monthlySheets = useMemo(() => (
        dailySheets.filter((sheet) => {
            if (!periodFrom || !periodTo) return true
            return sheet.date >= periodFrom && sheet.date <= periodTo
        })
    ), [dailySheets, periodFrom, periodTo])

    const monthlySheetTotal = useMemo(() => (
        Number(monthlySheets.reduce((sum, sheet) => sum + sheet.total, 0).toFixed(2))
    ), [monthlySheets])

    const monthlySourceOptions = useMemo(() => {
        const periodRows = visibleEntries.filter((entry) => {
            const cost = dateKey(entry.costDate)
            return cost >= periodFrom && cost <= periodTo
        })
        const sources = new Set<string>()
        periodRows.forEach((entry) => monthlySourceTags(entry).forEach((source) => sources.add(source)))
        return ['ALL', ...Array.from(sources).sort((a, b) => a.localeCompare(b))]
    }, [periodFrom, periodTo, visibleEntries])

    const monthlyInvoiceGroups = useMemo<MonthlyInvoiceGroup[]>(() => {
        console.log('DEBUG: visibleEntries length:', visibleEntries?.length)
        console.log('DEBUG: periodFrom:', periodFrom, 'periodTo:', periodTo, 'sourceFilter:', sourceFilter)
        
        const periodRows = (visibleEntries as any).filter((entry: any) => {
            const cost = dateKey(entry.costDate)
            const isPendingCompletion = entry.metadata?.billType === 'ENQUIRY_COMPLETION' && !entry.invoiceRefNo && String(entry.status || '').toUpperCase() === 'DRAFT'
            const hasSearchQuery = search.trim().length > 0;
            const matchesPeriod = hasSearchQuery || isPendingCompletion || (cost >= periodFrom && cost <= periodTo)
            const matchesSource = sourceFilter === 'ALL' || monthlySourceTags(entry).includes(sourceFilter)
            return matchesPeriod && matchesSource
        })
        console.log('DEBUG: periodRows length:', periodRows?.length)
        const grouped = new Map<string, PatientDailyCost[]>()

        periodRows.forEach((entry: any) => {
            const key = entry.allocationId
            if (!grouped.has(key)) grouped.set(key, [])
            grouped.get(key)?.push(entry)
        })

        const mapped = Array.from(grouped.entries())
            .map(([id, groupEntries]) => {
                const sortedEntries = [...groupEntries].sort((a, b) => (
                    dateKey(a.costDate).localeCompare(dateKey(b.costDate)) || String(a.description).localeCompare(String(b.description))
                ))
                const first = sortedEntries[0]
                const draftEntries = sortedEntries.filter((entry) => isDraftLedgerStatus(entry.status) && !entry.invoiceRefNo)
                const sourceTypes = [...new Set(sortedEntries.map((entry) => formatSource(entry.sourceType)).filter(Boolean))]
                
                const sourceSummary = Array.from(sortedEntries.reduce((map, entry) => {
                    const source = formatSource(entry.sourceType)
                    const current = map.get(source) || { name: source, entries: 0, draftEntries: 0, amount: 0, draftAmount: 0 }
                    const amount = Number(entry.amount || 0)
                    const isDraft = isDraftLedgerStatus(entry.status) && !entry.invoiceRefNo
                    current.entries += 1
                    current.amount = Number((current.amount + amount).toFixed(2))
                    if (isDraft) {
                        current.draftEntries += 1
                        current.draftAmount = Number((current.draftAmount + amount).toFixed(2))
                    }
                    map.set(source, current)
                    return map
                }, new Map<string, { name: string; entries: number; draftEntries: number; amount: number; draftAmount: number }>()).values())
                
                const invoicedCount = sortedEntries.filter((entry) => entry.invoiceRefNo || String(entry.status).toUpperCase() === 'INVOICED').length

                return {
                    id: `${id}-${periodFrom}-${periodTo}`,
                    patientName: first.patientName,
                    clientName: first.clientName,
                    allocationId: first.allocationId,
                    serviceType: first.serviceType,
                    sourceLabel: sourceTypes.length === 1 ? sourceTypes[0] : (sourceTypes.length ? `${sourceTypes.length} Sources` : 'No Activity'),
                    sourceSummary,
                    periodFrom: dateKey(sortedEntries[0].costDate),
                    periodTo: dateKey(sortedEntries[sortedEntries.length - 1].costDate),
                    entries: sortedEntries,
                    draftEntries,
                    total: Number(sortedEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0).toFixed(2)),
                    draftTotal: Number(draftEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0).toFixed(2)),
                    status: draftEntries.length
                        ? 'Draft - Monthly invoice pending'
                        : invoicedCount === sortedEntries.length
                            ? 'Invoiced'
                            : 'Partially invoiced'
                }
            })
            
        const list = mapped.filter((item) => item !== null) as any as MonthlyInvoiceGroup[]
        return list.sort((a, b) => b.periodTo.localeCompare(a.periodTo) || a.patientName.localeCompare(b.patientName))
    }, [periodFrom, periodTo, sourceFilter, visibleEntries])

    const invoiceLifecycleRows = useMemo(() => {
        const financeById = new Map(financeInvoices.map((invoice: any) => [invoice.id, invoice]))
        const grouped = new Map<string, PatientDailyCost[]>()

        entries
            .filter((entry) => entry.invoiceId || entry.invoiceRefNo)
            .forEach((entry) => {
                const key = entry.invoiceId || entry.invoiceRefNo || ''
                if (!key) return
                if (!grouped.has(key)) grouped.set(key, [])
                grouped.get(key)?.push(entry)
            })

        return Array.from(grouped.entries())
            .map(([invoiceKey, rows]) => {
                const first = rows[0]
                const financeInvoice = financeById.get(first.invoiceId || invoiceKey) as any
                const invoiceMetadata = financeInvoice?.metadata || {}
                const amount = Number(financeInvoice?.amount ?? rows.reduce((sum, row) => sum + Number(row.amount || 0), 0))
                const paidAmount = Number(invoiceMetadata.paidAmount || 0)
                const balanceAmount = Number(invoiceMetadata.balanceAmount ?? Math.max(0, amount - paidAmount))
                const sentAt = rows.find((row) => row.sentAt)?.sentAt || null
                const paymentStatus = invoiceMetadata.paymentStatus || (paidAmount > 0 ? 'PARTIAL' : 'UNPAID')

                return {
                    id: first.invoiceId || invoiceKey,
                    invoiceRefNo: first.invoiceRefNo || financeInvoice?.receiptNo || financeInvoice?.refNo || '-',
                    patientName: first.patientName,
                    serviceType: first.serviceType,
                    amount,
                    paidAmount,
                    balanceAmount,
                    sentAt,
                    sentVia: rows.find((row) => row.sentVia)?.sentVia || invoiceMetadata.sentVia || '-',
                    paymentStatus,
                    invoiceStatus: financeInvoice?.status || 'CREATED',
                    receiptRefNo: invoiceMetadata.lastReceiptRefNo || '-',
                    paidAt: invoiceMetadata.lastPaymentAt || null
                }
            })
            .sort((a, b) => String(b.invoiceRefNo).localeCompare(String(a.invoiceRefNo)))
    }, [entries, financeInvoices])

    const addCost = (event: React.FormEvent) => {
        event.preventDefault()
        if (!manualAllocationId || !description.trim()) return

        createEntry.mutate({
            allocationId: manualAllocationId,
            costDate,
            category,
            description: description.trim(),
            quantity: Number(quantity || 0),
            rate: Number(rate || 0),
            sourceType: 'MANUAL'
        }, {
            onSuccess: () => {
                setDescription('')
                setQuantity('1')
                setRate('')
            }
        })
    }

    const uploadBill = () => {
        if (!manualAllocationId || !description.trim() || !billFile || Number(quantity || 0) <= 0) return

        uploadBillEntry.mutate({
            allocationId: manualAllocationId,
            costDate,
            category,
            description: description.trim(),
            quantity: Number(quantity || 0),
            rate: Number(rate || 0),
            sourceType: 'EXTERNAL_BILL',
            sourceId: billFile.name,
            bill: billFile
        }, {
            onSuccess: () => {
                setDescription('')
                setQuantity('1')
                setRate('')
                setBillFile(null)
            }
        })
    }

    const createInvoice = () => {
        if (!periodLedgerEntries.length || totals.selected <= 0) return
        generateInvoice.mutate({
            entryIds: periodLedgerEntries.map((entry) => entry.id),
            periodFrom,
            periodTo,
            upiId,
            qrLabel: qrImageUrl || 'Owner GPay QR',
            notes: `Monthly patient invoice for ${selectedInvoiceEntry?.patientName || 'patient'} (${formatDate(periodFrom)} to ${formatDate(periodTo)})`
        }, {
            onSuccess: (result: any) => {
                setReceiptInvoice(result?.invoice || null)
                setReceiptEntries(result?.entries || periodLedgerEntries)
                setSelectedEntryIds([])
            }
        })
    }

    const openWhatsApp = () => {
        if (!receiptInvoice) return
        const mobile = normalizeWhatsAppNumber(receiptService?.familyContact)
        const period = `${formatDate(periodFrom)} to ${formatDate(periodTo)}`
        const message = [
            'Dear Family,',
            '',
            `Please find the monthly invoice for ${receiptInvoice.metadata?.patientName || receiptService?.patientName || 'the patient'} for ${period}.`,
            '',
            `Amount Due: ${formatMoney(receiptInvoice.amount)}`,
            '',
            'Regards,',
            'Universal Elder Care'
        ].join('\n')
        const target = mobile ? `https://wa.me/${mobile}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`
        window.open(target, '_blank', 'noopener,noreferrer')
    }

    const downloadInvoicePdf = () => {
        if (!receiptInvoice) return
        const metadata = receiptInvoice.metadata || {}
        // summary removed
        const patientName = metadata.patientName || receiptService?.patientName || '-'
        const clientName = metadata.clientName || receiptInvoice.clientName || receiptService?.clientName || '-'
        const serviceType = String(metadata.serviceType || receiptService?.serviceLabel || '-').replace(/_/g, ' ')
        const generatedAt = new Date()
        const upi = metadata.upiId || upiId
        const accountHolder = 'Universal Elder Care'
        // contactNumber removed
        const amount = Number(receiptInvoice.amount || 0)
        const upiUri = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(accountHolder)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(receiptInvoice.refNo || 'Monthly Patient Invoice')}`
        const qrSrc = qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`
        const logoSrc = `${window.location.origin}/logo-uec.png`

        const getSum = (regex: RegExp) => {
            const sum = receiptEntries.filter((e) => regex.test(`${e.category} ${e.description}`)).reduce((s, e) => s + Number(e.amount || 0), 0)
            return sum > 0 ? sum : ''
        }
        const getQty = (regex: RegExp) => {
            const qty = receiptEntries.filter((e) => regex.test(`${e.category} ${e.description}`)).reduce((s, e) => s + Number(e.quantity || 0), 0)
            return qty > 0 ? qty : ''
        }
        
        const uncfSubsidy = getSum(/uncf|subsidy/i) || 0
        const totalPayable = Number(receiptInvoice.amount || 0) - Number(uncfSubsidy)
        
        const currentMonthName = generatedAt.toLocaleString('default', { month: 'long' })

        const renderRow = (desc: string, amount: number | string | undefined, subsidy: number = 0) => {
            const price = Number(amount) || 0;
            if (price <= 0) return '';
            const sub = Number(subsidy) || 0;
            const payable = price - sub;
            return `
                <tr>
                    <td>${htmlEscape(desc)}</td>
                    <td class="text-right">Rs ${invoiceMoney(price)}</td>
                    <td class="text-right">Rs ${invoiceMoney(sub)}</td>
                    <td class="text-right">Rs ${invoiceMoney(payable)}</td>
                </tr>
            `;
        };

        const renderSection = (title: string, rowsHtml: string) => {
            if (!rowsHtml.trim()) return '';
            return `
                <tr class="section-header">
                    <td colspan="4">${htmlEscape(title)}</td>
                </tr>
                ${rowsHtml}
            `;
        };

        const billType = (serviceType === 'HOME CARE' || serviceType === 'HOME_CARE') ? 'HOME_CARE' : 'ELDER_CARE';

        let elderRows = "";
        
        let careRows = "";
        careRows += renderRow("Care Service Charges", getSum(/care service|service bill/i));
        careRows += renderRow("Care Giver", getSum(/care giver/i));
        careRows += renderRow("Nursing Care", getSum(/nursing/i));
        careRows += renderRow("Special Care", getSum(/special/i));
        careRows += renderRow("Palliative Care", getSum(/palliative/i));
        careRows += renderRow("Dementia Care", getSum(/dementia/i));
        careRows += renderRow("Alzheimer's Care", getSum(/alzheimer/i));
        careRows += renderRow(`Dressing (Qty: ${getQty(/dressing/i) || 1})`, getSum(/dressing/i));
        careRows += renderRow(`First Aid (Qty: ${getQty(/first aid/i) || 1})`, getSum(/first aid/i));
        elderRows += renderSection("CARE STAFF SERVICES", careRows);

        let therapyRows = "";
        therapyRows += renderRow("Doctor Visit", getSum(/doctor/i));
        therapyRows += renderRow("Physiotherapy", getSum(/physio/i));
        therapyRows += renderRow("Occupational Therapy", getSum(/occupational/i));
        therapyRows += renderRow("Speech Therapy", getSum(/speech/i));
        therapyRows += renderRow("Geriatric Counseling", getSum(/geriatric/i));
        therapyRows += renderRow("Psychiatric Counseling", getSum(/psychiatric|counsel/i));
        therapyRows += renderRow("Yoga", getSum(/yoga/i));
        elderRows += renderSection("THERAPY & CONSULTATION", therapyRows);

        let medRows = "";
        medRows += renderRow("Medicine", getSum(/medicine/i));
        medRows += renderRow("Lab Test", getSum(/lab|test/i));
        medRows += renderRow("ICU at Home", getSum(/icu/i));
        medRows += renderRow("Surgical Eq / Rental", getSum(/surgical|equipment|rental/i));
        elderRows += renderSection("MEDICAL SUPPORT", medRows);

        let transportRows = "";
        transportRows += renderRow("Ambulance", getSum(/ambulance/i));
        transportRows += renderRow("Taxi", getSum(/taxi/i));
        transportRows += renderRow("Auto", getSum(/auto/i));
        transportRows += renderRow("Senior Friendly Cab", getSum(/senior cab|cab/i));
        elderRows += renderSection("TRANSPORTATION", transportRows);

        let lifeRows = "";
        lifeRows += renderRow("Beauty Service", getSum(/beauty|haircut/i));
        elderRows += renderSection("PERSONAL & LIFESTYLE SERVICES", lifeRows);

        let accRows = "";
        accRows += renderRow("Bed Charges", getSum(/bed charge|accommodation|rent/i));
        accRows += renderRow("Upcoming Month Bed Charge", getSum(/upcoming/i));
        elderRows += renderSection("ACCOMMODATION", accRows);

        let utilRows = "";
        utilRows += renderRow("Laundry", getSum(/laundry/i));
        utilRows += renderRow("Electricity", getSum(/eb|electricity/i));
        utilRows += renderRow("Cleaning", getSum(/cleaning/i));
        utilRows += renderRow("Winding-up Cleaning", getSum(/winding/i));
        elderRows += renderSection("LAUNDRY & UTILITY", utilRows);

        let foodRows = "";
        foodRows += renderRow("Milk", getSum(/milk/i));
        elderRows += renderSection("FOOD & NUTRITION", foodRows);

        let linenRows = "";
        linenRows += renderRow("New Dress", getSum(/dress/i));
        linenRows += renderRow("New Towel", getSum(/towel/i));
        linenRows += renderRow("New Bedspread", getSum(/bedspread/i));
        linenRows += renderRow("New Blanket", getSum(/blanket/i));
        linenRows += renderRow("New Pillow Cover", getSum(/pillow/i));
        linenRows += renderRow("New Airbed", getSum(/airbed/i));
        linenRows += renderRow("Stitching", getSum(/stitching/i));
        elderRows += renderSection("LINEN & PERSONAL ITEMS", linenRows);

        let consRows = "";
        consRows += renderRow(`Diapers (Qty: ${getQty(/diaper/i) || 1})`, getSum(/diaper/i));
        consRows += renderRow(`Gloves (Qty: ${getQty(/glove/i) || 1})`, getSum(/glove/i));
        consRows += renderRow(`Mask (Qty: ${getQty(/mask/i) || 1})`, getSum(/mask/i));
        consRows += renderRow(`Under Pad (Qty: ${getQty(/under pad|underpad/i) || 1})`, getSum(/under pad|underpad/i));
        consRows += renderRow(`Bed Wipes (Qty: ${getQty(/bed wipe/i) || 1})`, getSum(/bed wipe/i));
        consRows += renderRow(`Catheter (Qty: ${getQty(/catheter/i) || 1})`, getSum(/catheter/i));
        consRows += renderRow(`Uro Bag (Qty: ${getQty(/uro bag/i) || 1})`, getSum(/uro bag/i));
        consRows += renderRow(`Rubber Sheet (Qty: ${getQty(/rubber sheet/i) || 1})`, getSum(/rubber sheet/i));
        consRows += renderRow(`Oxygen (Qty: ${getQty(/oxygen|o2/i) || 1})`, getSum(/oxygen|o2/i));
        consRows += renderRow(`Nebulizer (Qty: ${getQty(/nebulizer/i) || 1})`, getSum(/nebulizer/i));
        elderRows += renderSection("MEDICAL CONSUMABLES", consRows);

        let feesRows = "";
        feesRows += renderRow("Previous Pending", getSum(/pending|previous/i));
        feesRows += renderRow("Late Fee", getSum(/late fee/i));
        feesRows += renderRow("Late Material Fee", getSum(/late material/i));
        feesRows += renderRow("Balance Amount", getSum(/balance amount/i));
        feesRows += renderRow("Monthly Essentials Balance", getSum(/monthly essential/i));
        feesRows += renderRow("Consumables", getSum(/consumable/i));
        feesRows += renderRow("Other Charges", getSum(/other/i));
        elderRows += renderSection("FEES & BALANCES", feesRows);

        let homeRows = "";
        let homeMem = "";
        homeMem += renderRow("Monthly Membership", getSum(/monthly mem/i));
        homeMem += renderRow("Half-Yearly Membership", getSum(/half-yearly/i));
        homeMem += renderRow("Annual Membership", getSum(/annual/i));
        homeMem += renderRow("Silver Membership", getSum(/silver/i));
        homeMem += renderRow("Gold Membership", getSum(/gold/i));
        homeMem += renderRow("Platinum Membership", getSum(/platinum/i));
        homeRows += renderSection("A. MEMBERSHIP", homeMem);

        let homeCare = "";
        homeCare += renderRow("Care Service Charges", getSum(/care service|service bill/i));
        homeCare += renderRow("Home Nursing", getSum(/nursing/i));
        homeCare += renderRow("Caregiver", getSum(/caregiver|care giver/i));
        homeCare += renderRow("Doctor Visit", getSum(/doctor/i));
        homeCare += renderRow("Physiotherapy", getSum(/physio/i));
        homeCare += renderRow("Occupational Therapy", getSum(/occupational/i));
        homeCare += renderRow("Speech Therapy", getSum(/speech/i));
        homeCare += renderRow("Counseling", getSum(/counseling/i));
        homeCare += renderRow("Yoga", getSum(/yoga/i));
        homeCare += renderRow("Palliative Care", getSum(/palliative/i));
        homeCare += renderRow("Dementia Care", getSum(/dementia/i));
        homeCare += renderRow("Alzheimer's Care", getSum(/alzheimer/i));
        homeRows += renderSection("B. HOME CARE SERVICES", homeCare);

        let homeSupport = "";
        homeSupport += renderRow("Lab Tests", getSum(/lab/i));
        homeSupport += renderRow("Medicine Delivery", getSum(/medicine/i));
        homeSupport += renderRow("Transport", getSum(/transport/i));
        homeSupport += renderRow("Ambulance", getSum(/ambulance/i));
        homeSupport += renderRow("Beauty Service", getSum(/beauty/i));
        homeSupport += renderRow("Legal Service", getSum(/legal/i));
        homeSupport += renderRow("Pooja Service", getSum(/pooja/i));
        homeSupport += renderRow("Tours & Travels", getSum(/tour/i));
        homeSupport += renderRow("Rendering Service", getSum(/rendering/i));
        homeSupport += renderRow("Essentials Service", getSum(/essential/i));
        homeSupport += renderRow("Equipment / Rental", getSum(/equipment|rental/i));
        homeSupport += renderRow("Consumables", getSum(/consumable/i));
        homeSupport += renderRow("Other Charges", getSum(/other/i));
        homeRows += renderSection("C. HOME SUPPORT SERVICES", homeSupport);

        const invoiceTableHtml = `
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th style="text-align: left;">Description</th>
                        <th style="text-align: right; width: 100px;">Amount</th>
                        <th style="text-align: right; width: 100px;">UNCF Subsidy</th>
                        <th style="text-align: right; width: 100px;">Net Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${billType === "ELDER_CARE" ? elderRows : homeRows}
                </tbody>
            </table>
        `;

        const dispatchHtml = `
            <div class="mt-4" style="border: 1px solid #dbe5ef; border-radius: 6px; padding: 14px; background: #fafcff; margin-bottom: 24px;">
                <h3 style="margin: 0 0 10px; color: #334155; font-size: 11px; text-transform: uppercase; letter-spacing: .06em;">Materials to be Sent Before 5th of Every Month</h3>
                <table class="patient-table">
                    <tbody>
                        <tr><td>Diapers</td><td>0 Nos</td></tr>
                        <tr><td>Gloves</td><td>0 Nos</td></tr>
                        <tr><td>Mask</td><td>0 Nos</td></tr>
                        <tr><td>Under Pad</td><td>0 Nos</td></tr>
                        <tr><td>Rubber Sheet</td><td>0 Nos</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        const html = `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Patient Service Bill - ${htmlEscape(patientName)}</title>
    <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #fff; color: #172033; font-family: "Times New Roman", Times, serif; font-size: 11px; }
        .sheet { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 22px; }
        
        .header { display: grid; grid-template-columns: 1fr auto; gap: 20px; border-bottom: 2px solid #0f766e; padding-bottom: 16px; }
        .brand { display: flex; gap: 14px; align-items: center; }
        .logo { width: 58px; height: 58px; object-fit: contain; }
        h1 { margin: 0; font-size: 18px; color: #0f2f3f; }
        .muted { color: #64748b; line-height: 1.45; }
        .title { text-align: right; }
        .title h2 { margin: 0; font-size: 16px; color: #0f766e; }
        .badge { display: inline-block; margin-top: 8px; border-radius: 999px; padding: 5px 12px; background: #ecfdf5; color: #047857; font-weight: 800; text-transform: uppercase; font-size: 10px; }
        
        .profile-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; border: 1px solid #dbe5ef; }
        .profile-table td { padding: 8px; border: 1px solid #dbe5ef; font-size: 11px; }
        .profile-table td:nth-child(odd) { font-weight: bold; background: #f8fafc; color: #334155; width: 25%; }
        .profile-table td:nth-child(even) { width: 25%; }

        .panel { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
        .box { border: 1px solid #dbe5ef; border-radius: 6px; padding: 14px; background: #fafcff; }
        .box h3 { margin: 0 0 10px; color: #334155; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
        
        .patient-table { width: 100%; border-collapse: collapse; }
        .patient-table td { padding: 4px 0; font-size: 11px; }
        .patient-table td:first-child { width: 110px; color: #64748b; font-weight: bold; }
        .patient-table td:last-child { font-weight: bold; color: #111827; }

        .invoice-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        .invoice-table th, .invoice-table td { padding: 8px 12px; border: 1px solid #dbe5ef; font-size: 11px; }
        .invoice-table th { background: #f8fafc; font-weight: bold; color: #334155; border-bottom: 2px solid #94a3b8; }
        .invoice-table tr.section-header td { background: #f1f5f9; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: .05em; text-align: left; }
        
        .totals-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
        .totals-table td { padding: 6px 12px; border: 1px solid #dbe5ef; font-size: 12px; }
        .totals-table tr.grand-total td { background: #ecfdf5; font-weight: bold; color: #065f46; border-color: #059669; font-size: 14px; }
        
        .payment-table { width: 100%; border-collapse: collapse; }
        .payment-table td { padding: 6px 12px; border: 1px solid #dbe5ef; font-size: 11px; background: #fafcff; }

        .payment-total { display: grid; grid-template-columns: 1fr 220px; gap: 18px; align-items: stretch; margin-top: 18px; }
        .qr { text-align: center; border: 1px solid #dbe5ef; border-radius: 6px; padding: 12px; }
        .qr img { width: 180px; height: 180px; object-fit: contain; }
        
        .footer { display: grid; grid-template-columns: 1fr 220px; gap: 18px; margin-top: 24px; border-top: 1px solid #dbe5ef; padding-top: 16px; font-size: 10px; }
        .signature { height: 72px; border-bottom: 1px solid #94a3b8; display: flex; align-items: end; justify-content: center; color: #64748b; font-weight: 700; }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .italic { font-style: italic; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .mb-4 { margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="header" style="grid-template-columns: auto 1fr; align-items: center;">
            <div class="brand">
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <img class="logo" style="width: 200px; height: auto;" src="${htmlEscape(logoSrc)}" />
                    <strong style="font-size: 13px; margin-top: 8px; color: #64748b;">(A Unit Of UNCF)</strong>
                </div>
            </div>
            <div class="title">
                <h2>${billType === "ELDER_CARE" ? "Elder Care Patient Service Bill" : "Home Care Patient Service Bill"}</h2>
            </div>
        </div>

        <div class="panel">
            <div class="box">
                <h3>Elder Details</h3>
                <table class="patient-table">
                    <tbody>
                        <tr><td>Patient Name</td><td>${htmlEscape(patientName)}</td></tr>
                        <tr><td>Age</td><td>-</td></tr>
                        <tr><td>Sex</td><td>-</td></tr>
                        <tr><td>DOB</td><td>-</td></tr>
                        <tr><td>Patient ID</td><td>${htmlEscape(receiptService?.patientId || metadata.patientId || '-')}</td></tr>
                        <tr><td>Service Type</td><td>${htmlEscape(serviceType)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="box">
                <h3>Guardian Details</h3>
                <table class="patient-table">
                    <tbody>
                        <tr><td>Bill ID</td><td>${htmlEscape(receiptInvoice.refNo || '-')}</td></tr>
                        <tr><td>Bill Date</td><td>${htmlEscape(formatDate(receiptInvoice.date || generatedAt.toISOString()))}</td></tr>
                        <tr><td>Guardian Name</td><td>${htmlEscape(clientName)}</td></tr>
                        <tr><td>Contact Number</td><td>${htmlEscape(receiptService?.familyContact || '-')}</td></tr>
                        <tr><td>Address</td><td>-</td></tr>
                        <tr><td>Billing Month</td><td>${htmlEscape(currentMonthName)}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        ${invoiceTableHtml}

        <table class="totals-table">
            <tbody>
                <tr>
                    <td><strong>Gross Total Amount</strong></td>
                    <td class="text-right"><strong>Rs ${htmlEscape(invoiceMoney(receiptInvoice.amount))}</strong></td>
                </tr>
                <tr>
                    <td style="color: #ea580c;"><strong>UNCF Subsidy Amount</strong></td>
                    <td class="text-right" style="color: #ea580c;"><strong>- Rs ${htmlEscape(invoiceMoney(uncfSubsidy))}</strong></td>
                </tr>
                <tr class="grand-total">
                    <td>Total Payable Amount</td>
                    <td class="text-right">Rs ${htmlEscape(invoiceMoney(totalPayable))}</td>
                </tr>
            </tbody>
        </table>

        ${dispatchHtml}

        <div class="mt-4" style="font-size: 14px; line-height: 1.5;">
            <div class="bold italic" style="font-size: 16px;">Feedbacks and issues:</div>
            <div class="mt-1">Please write letter (post or direct letter to UEC) and mail <span class="bold">universaleldercare2010@gmail.com</span>.<br/>Please follow up with us, within one or two weeks issues or queries are cleared.</div>
            <div class="mt-2 mb-2 italic" style="font-size: 14px">It will be kind enough if we receive the payments within "5th of every month", it will be supportive to get the materials.<br/>After 7th of every month, late payment will be collected.</div>
            
            <div class="bold mt-3" style="color: #b91c1c; font-size: 14px;">IF PAYMENT RECEIPT HAVEN'T SENT TO THE SAME NUMBER, IT WON'T BE ACCOUNTABLE.<br/>THE AMOUNT WILL BE ADDED IN NEXT MONTH BILL.</div>
            <div class="bold mt-1" style="color: #b91c1c; font-size: 14px;">பணம் செலுத்தும் ரசீது இந்த எண்ணுக்கு அனுப்பப்படாவிட்டால், அது கணக்கிடப்படாது,<br/>அடுத்த மாத கணக்கில் தொகை சேர்க்கப்படும்.</div>
        </div>

        <div class="payment-total">
            <div>
                <div class="bold">Payment facilities:</div>
                <div>Net banking or <span class="bold">UPI Google pay, PhonePe</span></div>
                <div class="bold mt-2">After payment kindly send:</div>
                <div style="margin-left: 12px;">
                    1) transfer id<br/>
                    2) screenshot of payment<br/>
                    3) transferred date<br/>
                    4) transferred amount
                </div>
            </div>
            <div class="qr">
                <img src="${htmlEscape(qrSrc)}" />
                <div class="bold mt-2">UPI QR Code</div>
                <div style="font-size: 10px; color: #64748b;">${htmlEscape(upi)}</div>
            </div>
        </div>

        <div class="footer" style="display: block; text-align: center; margin-top: 40px; color: #64748b; font-size: 12px; font-style: italic; border-top: 1px solid #dbe5ef; padding-top: 16px;">
            This is a system generated bill.
        </div>
    </div>
    <script>
        window.addEventListener('load', () => setTimeout(() => window.print(), 500));
    </script>
</body>
</html>`

        const printWindow = window.open('', '_blank')
        if (!printWindow) return
        printWindow.document.open()
        printWindow.document.write(html)
        printWindow.document.close()
    }

    const downloadDailySheetPdf = (sheet: DailyExpenseSheet) => {
        const entryLines = sheet.entries.flatMap((entry, index) => [
            `${index + 1}. ${formatTime(entry.createdAt || entry.costDate)} | ${entry.category} | ${entry.description}`,
            `   Qty: ${entry.quantity} | Rate: ${formatMoney(entry.rate)} | Amount: ${formatMoney(entry.amount)} | Source: ${formatSource(entry.sourceType)}`
        ])
        downloadSimplePdf(`daily-expense-${sheet.patientName}-${sheet.date}.pdf`, [
            'Universal Elder Care',
            sheet.billLabel,
            '',
            `Patient: ${sheet.patientName}`,
            `Client: ${sheet.clientName || '-'}`,
            `Date: ${sheet.periodTo && sheet.periodTo !== sheet.date ? `${formatDate(sheet.date)} to ${formatDate(sheet.periodTo)}` : formatDate(sheet.date)}`,
            `Service: ${String(sheet.serviceType || '-').replace(/_/g, ' ')}`,
            '',
            'Detailed Expense Entries',
            ...entryLines,
            '',
            'Daily Summary',
            ...sheet.summary.map((item) => `${item.name}: ${formatMoney(item.amount)}`),
            '',
            `Daily Total: ${formatMoney(sheet.total)}`
        ])
    }

    const downloadMonthlySummaryPdf = () => {
        const periodRows = visibleEntries.filter((entry) => {
            const cost = dateKey(entry.costDate)
            return cost >= periodFrom && cost <= periodTo
        })
        const selectedRows = periodLedgerEntries.length ? periodLedgerEntries : periodRows
        if (!selectedRows.length) return

        const patientName = selectedRows[0]?.patientName || billingService?.patientName || 'patient'
        const serviceType = selectedRows[0]?.serviceType || billingService?.serviceLabel || '-'
        const dailyTotals = new Map<string, number>()
        const chargeTotals = new Map<string, number>()
        selectedRows.forEach((entry) => {
            const day = dateKey(entry.costDate)
            dailyTotals.set(day, Number((Number(dailyTotals.get(day) || 0) + Number(entry.amount || 0)).toFixed(2)))
            const group = chargeGroupForCategory(entry.category)
            chargeTotals.set(group, Number((Number(chargeTotals.get(group) || 0) + Number(entry.amount || 0)).toFixed(2)))
        })
        const total = selectedRows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
        downloadSimplePdf(`monthly-expense-summary-${patientName}-${periodFrom}-to-${periodTo}.pdf`, [
            'Universal Elder Care',
            'Month-End Patient Expense Summary',
            '',
            `Patient: ${patientName}`,
            `Service: ${String(serviceType || '-').replace(/_/g, ' ')}`,
            `Period: ${formatDate(periodFrom)} to ${formatDate(periodTo)}`,
            `Rows Included: ${selectedRows.length}`,
            '',
            'Date-wise Totals',
            ...Array.from(dailyTotals.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([day, amount]) => `${formatDate(day)}: ${formatMoney(amount)}`),
            '',
            'Charge Summary',
            ...Array.from(chargeTotals.entries()).map(([name, amount]) => `${name}: ${formatMoney(amount)}`),
            '',
            'Itemized Ledger Rows',
            ...selectedRows.map((entry, index) => `${index + 1}. ${formatDate(entry.costDate)} | ${entry.category} | ${entry.description} | Qty ${entry.quantity} | ${formatMoney(entry.amount)} | ${formatSource(entry.sourceType)}`),
            '',
            `Monthly Total: ${formatMoney(total)}`
        ])
    }

    const toggleMonthlyGroupForInvoice = (group: MonthlyInvoiceGroup) => {
        const draftIds = group.draftEntries.map((entry) => entry.id)
        if (!draftIds.length) return

        setSelectedEntryIds((prev) => {
            const allSelected = draftIds.every((id) => prev.includes(id))
            if (allSelected) return prev.filter((id) => !draftIds.includes(id))

            const selectedRows = entries.filter((item) => prev.includes(item.id))
            const samePatientSelection = !selectedRows.length || selectedRows.every((item) => item.allocationId === group.allocationId)
            return samePatientSelection ? Array.from(new Set([...prev, ...draftIds])) : draftIds
        })
    }

    const markReceiptSent = () => {
        if (!receiptInvoice?.id) return
        markSent.mutate({
            invoiceId: receiptInvoice.id,
            sentVia,
            familyContact: receiptService?.familyContact || ''
        }, {
            onSuccess: () => setReceiptInvoice(null)
        })
    }

    const monthlyGroupColumns: Column<MonthlyInvoiceGroup>[] = [
        {
            key: 'select',
            header: 'Select',
            cell: (group) => {
                const draftIds = group.draftEntries.map((entry) => entry.id)
                const canSelect = draftIds.length > 0
                return (
                    <input
                        type="checkbox"
                        checked={canSelect && draftIds.every((id) => selectedEntryIds.includes(id))}
                        disabled={!canSelect}
                        onChange={() => toggleMonthlyGroupForInvoice(group)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0F969C] 700 focus:ring-[#0F969C] disabled:opacity-40"
                        title={canSelect ? 'Select this monthly billing group' : 'Already invoiced or unavailable'}
                    />
                )
            }
        },
        {
            key: 'patient',
            header: 'Patient / Service',
            cell: (group) => (
                <div className="min-w-[220px] whitespace-normal">
                    <p className="font-extrabold text-slate-900">{group.patientName}</p>
                    <p className="text-xs font-semibold text-slate-500">{group.serviceType.replace(/_/g, ' ')}</p>
                </div>
            )
        },
        {
            key: 'period',
            header: 'Period',
            cell: (group) => (
                <span className="font-semibold text-slate-700">{formatDate(group.periodFrom)} - {formatDate(group.periodTo)}</span>
            )
        },
        {
            key: 'source',
            header: 'Sources',
            cell: (group) => (
                <div className="min-w-[220px] space-y-1">
                    <StatusHighlighter value={group.sourceLabel} />
                    <p className="text-xs font-semibold text-slate-500">
                        {group.sourceSummary.slice(0, 3).map((source) => source.name).join(', ')}
                        {group.sourceSummary.length > 3 ? ` +${group.sourceSummary.length - 3} more` : ''}
                    </p>
                </div>
            )
        },
        {
            key: 'items',
            header: 'Items',
            cell: (group) => (
                <div className="min-w-[170px]">
                    <p className="font-extrabold text-slate-900">{group.entries.length} entries</p>
                    <p className="text-xs font-semibold text-slate-500">{group.draftEntries.length} draft for billing</p>
                </div>
            )
        },
        { key: 'amount', header: 'Amount', cell: (group) => <span className="font-extrabold">{formatMoney(group.draftTotal || group.total)}</span> },
        { key: 'status', header: 'Invoice Status', cell: (group) => <StatusHighlighter value={group.status} /> },
        {
            key: 'actions',
            header: 'View',
            cell: (group) => (
                <button
                    type="button"
                    onClick={() => setSelectedMonthlyGroup(group)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary-200 bg-[#0F969C]/10 px-3 text-xs font-extrabold text-[#0F969C] 700 hover:bg-[#0F969C]/20"
                >
                    <Eye className="h-4 w-4" />
                    View
                </button>
            )
        }
    ]

    const dailySheetColumns: Column<DailyExpenseSheet>[] = [
        { key: 'date', header: 'Date', cell: (sheet) => <span className="block min-w-[140px] font-semibold text-slate-700">{formatDate(sheet.date)}</span> },
        {
            key: 'patient',
            header: 'Patient / Bill',
            cell: (sheet) => (
                <div className="min-w-[220px]">
                    <p className="font-extrabold text-slate-900">{sheet.patientName}</p>
                    <p className="text-xs font-semibold text-slate-500">{sheet.billLabel}</p>
                    <p className="text-xs font-semibold text-slate-400">{String(sheet.serviceType || '').replace(/_/g, ' ')}</p>
                </div>
            )
        },
        { key: 'entries', header: 'Entries', cell: (sheet) => <span className="block min-w-[90px] font-extrabold text-slate-700">{sheet.entries.length}</span> },
        {
            key: 'summary',
            header: 'Daily Summary',
            cell: (sheet) => (
                <div className="min-w-[520px] space-y-1.5">
                    {sheet.summary.slice(0, 3).map((item) => (
                        <div key={item.name} className="grid grid-cols-[minmax(180px,1fr)_minmax(120px,auto)] items-center gap-6 text-xs font-bold text-slate-600">
                            <span className="whitespace-normal">{item.name}</span>
                            <span className="whitespace-nowrap text-right">{formatMoney(item.amount)}</span>
                        </div>
                    ))}
                    {sheet.summary.length > 3 && <p className="text-xs font-bold text-slate-400">+{sheet.summary.length - 3} more</p>}
                </div>
            )
        },
        {
            key: 'total',
            header: 'Daily Cost',
            sortable: true,
            cell: (sheet) => <span className="block min-w-[150px] text-sm font-extrabold text-emerald-700">{formatMoney(sheet.total)}</span>
        },
        {
            key: 'actions',
            header: 'Sheet',
            cell: (sheet) => (
                <div className="flex min-w-[260px] flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedDailySheet(sheet)}
                        className="inline-flex h-9 min-w-[126px] items-center justify-center gap-2 rounded-xl border border-primary-200 bg-[#0F969C]/10 px-3 text-xs font-extrabold text-[#0F969C] 700 transition hover:bg-[#0F969C]/20"
                    >
                        <Eye className="h-4 w-4" />
                        View Sheet
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadDailySheetPdf(sheet)}
                        className="inline-flex h-9 min-w-[126px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50"
                    >
                        <Download className="h-4 w-4" />
                        Download
                    </button>
                </div>
            )
        }
    ]

    return (
        <div className="flex min-h-full min-w-0 flex-col gap-6 pb-8">
            <PageHeader
                title="Patient Expense Ledger"
                subtitle="Daily patient expenses are tracked here. Monthly invoices are generated from this ledger."
                breadcrumbs={[{ label: 'Finance' }, { label: 'Patient Daily Cost' }]}
            />

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard icon={IndianRupee} label="Unbilled Daily Cost" value={formatMoney(totals.draft)} tone="emerald" />
                <SummaryCard icon={FileText} label="Already Invoiced" value={formatMoney(totals.invoiced)} tone="blue" />
                <SummaryCard icon={FileText} label="Selected Invoice Total" value={formatMoney(totals.selected)} tone="amber" />
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
                {patientCostTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`h-10 rounded-xl px-4 text-sm font-extrabold transition ${
                            activeTab === tab.key
                                ? 'bg-[#0C7A7E] text-white shadow-sm'
                                : 'bg-slate-50 text-slate-700 hover:bg-[#0F969C]/10 hover:text-[#0F969C] 700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'daily' && (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Patient Daily Expense Sheets</p>
                        <h2 className="mt-1 text-lg font-extrabold text-slate-900">Grouped patient bill verification</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Enquiry completion charges appear as one bill with service, medicine, and staff lines inside.
                        </p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                            Monthly Summary ({formatDate(periodFrom)} - {formatDate(periodTo)})
                        </p>
                        <p className="mt-1 text-2xl font-extrabold text-emerald-900">{formatMoney(monthlySheetTotal)}</p>
                    </div>
                </div>
                <div className="min-h-[320px]">
                    <DataTable
                        data={monthlySheets}
                        columns={dailySheetColumns}
                        keyExtractor={(sheet) => sheet.id}
                        isLoading={entriesLoading}
                        emptyStateMessage="No daily expense sheets available for this period."
                        minTableWidth="100%"
                        showScrollbars
                    />
                </div>
            </section>
            )}

            {activeTab === 'lifecycle' && (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Invoice Payment Tracking</p>
                        <h2 className="mt-1 text-lg font-extrabold text-slate-900">Monthly invoice lifecycle</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Check whether generated monthly patient invoices are sent, partially paid, or fully paid.
                        </p>
                    </div>
                    <a
                        href="/finance/invoice"
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-primary-200 bg-[#0F969C]/10 px-4 text-xs font-extrabold text-[#0F969C] 700 hover:bg-[#0F969C]/20"
                    >
                        Open Finance Invoice
                    </a>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="min-w-[980px] w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Invoice</th>
                                <th className="px-4 py-3">Patient</th>
                                <th className="px-4 py-3 text-right">Invoice Amount</th>
                                <th className="px-4 py-3 text-right">Paid</th>
                                <th className="px-4 py-3 text-right">Balance</th>
                                <th className="px-4 py-3">Sent</th>
                                <th className="px-4 py-3">Payment</th>
                                <th className="px-4 py-3">Receipt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceLifecycleRows.map((invoice) => (
                                <tr key={invoice.id} className="border-t border-slate-100">
                                    <td className="px-4 py-3">
                                        <p className="font-extrabold text-[#0F969C] 700">{invoice.invoiceRefNo}</p>
                                        <p className="text-xs font-semibold text-slate-500">{invoice.invoiceStatus}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-extrabold text-slate-900">{invoice.patientName}</p>
                                        <p className="text-xs font-semibold text-slate-500">{String(invoice.serviceType || '').replace(/_/g, ' ')}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-extrabold">{formatMoney(invoice.amount)}</td>
                                    <td className="px-4 py-3 text-right font-extrabold text-emerald-700">{formatMoney(invoice.paidAmount)}</td>
                                    <td className="px-4 py-3 text-right font-extrabold text-amber-700">{formatMoney(invoice.balanceAmount)}</td>
                                    <td className="px-4 py-3">
                                        <StatusHighlighter value={invoice.sentAt ? `Sent - ${invoice.sentVia}` : 'Generated'} />
                                        {invoice.sentAt && <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(invoice.sentAt)}</p>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusHighlighter value={invoice.paymentStatus} />
                                        {String(invoice.invoiceStatus).toUpperCase() !== 'POSTED' && invoice.paymentStatus === 'UNPAID' ? (
                                            <p className="mt-1 text-xs font-semibold text-amber-700">Post in Finance before collecting payment</p>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-700">{invoice.receiptRefNo}</p>
                                        {invoice.paidAt && <p className="text-xs font-semibold text-slate-500">{formatDate(invoice.paidAt)}</p>}
                                    </td>
                                </tr>
                            ))}
                            {!invoiceLifecycleRows.length ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                                        No monthly invoices generated yet.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>
            )}

            {activeTab === 'add' && (
                <form onSubmit={addCost} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                        <Plus className="h-5 w-5 text-[#0F969C] 600" />
                        <h2 className="text-base font-extrabold text-slate-900">Add Ledger Expense</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Patient / Service</span>
                            <select
                                value={manualAllocationId}
                                onChange={(event) => {
                                    setManualAllocationId(event.target.value)
                                    const nextService = services.find((service) => service.allocationId === event.target.value)
                                    const nextCategories = categoryByService[nextService?.serviceType || ''] || categoryByService.OTHERS
                                    setCategory(nextCategories[0])
                                }}
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20"
                                disabled={servicesLoading || !services.length}
                            >
                                <option value="">{servicesLoading ? 'Loading patients...' : '-- Select Patient / Service --'}</option>
                                {services.map((service: PatientService) => (
                                    <option key={service.allocationId} value={service.allocationId}>
                                        {service.patientName} - {service.serviceLabel} - {service.allocationRef}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Date" type="date" value={costDate} onChange={setCostDate} />
                            <label className="block">
                                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Category</span>
                                <select
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20"
                                >
                            {serviceCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </label>
                        </div>

                        {isMedicineCategory ? (
                            <label className="block">
                                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Medicine / Bill Item</span>
                                <input
                                    list="patient-billing-medicine-catalog"
                                    value={description}
                                    onChange={(event) => {
                                        const value = event.target.value
                                        setDescription(value)
                                        const match = medicineOptions.find((item) => item.name.trim().toLowerCase() === value.trim().toLowerCase())
                                        if (match?.suggestedRate && Number(match.suggestedRate) > 0) setRate(String(match.suggestedRate))
                                    }}
                                    placeholder="Select or type medicine name"
                                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20"
                                />
                                <datalist id="patient-billing-medicine-catalog">
                                    {medicineOptions.map((item) => (
                                        <option key={item.id} value={item.name}>
                                            {item.suggestedRate > 0 ? `Rs ${item.suggestedRate} - ${item.rateSource}` : item.rateSource}
                                        </option>
                                    ))}
                                </datalist>
                                <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">
                                    {selectedMedicine
                                        ? `Rate source: ${selectedMedicine.rateSource}. Available stock: ${selectedMedicine.availableQty ?? 'Not linked'}.`
                                        : 'If the medicine has a previous rate, it will auto-fill. New items can still be entered manually.'}
                                </div>
                            </label>
                        ) : (
                            <Field label="Description" value={description} onChange={setDescription} placeholder="Consultation, test, extra duty..." />
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Quantity" type="number" value={quantity} onChange={setQuantity} min="0.01" step="0.01" />
                            <Field label="Rate" type="number" value={rate} onChange={setRate} min="0" step="0.01" />
                        </div>

                        <div className="rounded-xl border border-primary-100 bg-[#0F969C]/10 px-3 py-2 text-sm font-extrabold text-[#0F969C] 800">
                            Amount: {formatMoney(Number(quantity || 0) * Number(rate || 0))}
                        </div>

                        <button
                            type="submit"
                            disabled={createEntry.isPending || !manualAllocationId || !description.trim() || Number(quantity || 0) <= 0}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F969C] text-sm font-extrabold text-white shadow-sm hover:bg-[#0C7A7E] disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            {createEntry.isPending ? 'Adding...' : 'Add Ledger Entry'}
                        </button>

                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
                            <label className="block">
                                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Upload Bill / Invoice</span>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(event) => setBillFile(event.target.files?.[0] || null)}
                                    className="mt-2 block w-full text-xs font-bold text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-[#0F969C] 700"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={uploadBill}
                                disabled={uploadBillEntry.isPending || !manualAllocationId || !description.trim() || !billFile || Number(quantity || 0) <= 0}
                                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 text-sm font-extrabold text-white shadow-sm hover:bg-slate-900 disabled:opacity-50"
                            >
                                <Upload className="h-4 w-4" />
                                {uploadBillEntry.isPending ? 'Uploading...' : 'Upload Bill & Add Ledger'}
                            </button>
                            <p className="mt-2 text-[11px] font-semibold text-slate-500">
                                PDF, JPG or PNG. Uploaded bills stay as draft ledger entries and can be selected for monthly invoice.
                            </p>
                        </div>
                        {!servicesLoading && !services.length && (
                            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-slate-900 font-extrabold">
                                No service is available for billing yet. Complete Admission and create the service allocation first, then this list will show the patient here.
                            </div>
                        )}
                    </div>
                </form>
            )}

            {activeTab === 'monthly' && (
                <div className="flex min-w-0 flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="flex flex-1 flex-wrap items-end gap-3">
                                <label className="block w-[240px] max-w-full">
                                    <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Search Patient</span>
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Patient, cost, invoice..."
                                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20 bg-white"
                                    />
                                </label>
                                <label className="block w-[200px] max-w-full">
                                    <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Bill Source</span>
                                    <select
                                        value={sourceFilter}
                                        onChange={(event) => setSourceFilter(event.target.value)}
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20"
                                    >
                                        {monthlySourceOptions.map((source) => (
                                            <option key={source} value={source}>
                                                {source === 'ALL' ? 'All Sources' : source}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <div className="flex items-end gap-2">
                                    <label className="block w-[140px]">
                                        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Period From</span>
                                        <input
                                            type="date"
                                            value={periodFrom}
                                            onChange={(e) => setPeriodFrom(e.target.value)}
                                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20 bg-white"
                                        />
                                    </label>
                                    <label className="block w-[140px]">
                                        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Period To</span>
                                        <input
                                            type="date"
                                            value={periodTo}
                                            onChange={(e) => setPeriodTo(e.target.value)}
                                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20 bg-white"
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={downloadMonthlySummaryPdf}
                                    disabled={!monthlyInvoiceGroups.length}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Month
                                </button>
                                <button
                                    type="button"
                                    onClick={createInvoice}
                                    disabled={!periodLedgerEntries.length || totals.selected <= 0 || generateInvoice.isPending}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
                                >
                                    <FileText className="h-4 w-4" />
                                    {selectedInvoiceEntry ? `Generate For ${selectedInvoiceEntry.patientName.split(' ')[0]}` : 'Select Rows First'}
                                </button>
                            </div>
                        </div>

                        {periodLedgerEntries.length > 0 && (
                            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-[13px] font-semibold text-slate-600 sm:justify-between">
                                <span>Selected patient: <span className="font-extrabold text-slate-900">{billingPatientLabel}</span></span>
                                <span>Selected ledger rows: <span className="font-extrabold text-slate-900">{periodLedgerEntries.length}</span></span>
                                <span>Selected invoice total: <span className="font-extrabold text-emerald-700">{formatMoney(totals.selected)}</span></span>
                                <span className="text-xs font-medium text-slate-500">Status flow: Draft &gt; Generated &gt; Sent &gt; Paid</span>
                            </div>
                        )}
                    </div>

                    <div className="min-h-[460px] min-w-0">
                        <DataTable
                            data={monthlyInvoiceGroups}
                            columns={monthlyGroupColumns}
                            keyExtractor={(group) => group.id}
                            isLoading={entriesLoading}
                            emptyStateMessage="No patient billing groups available for this period."
                            minTableWidth="1180px"
                            showScrollbars
                        />
                    </div>
                </div>
            )}

            <Modal
                isOpen={Boolean(selectedMonthlyGroup)}
                onClose={() => setSelectedMonthlyGroup(null)}
                title="Monthly Billing Breakdown"
                type="info"
                size="xl"
                cancelLabel="Close"
            >
                {selectedMonthlyGroup ? (
                    <div className="mt-4 max-h-[68vh] space-y-5 overflow-y-auto pr-2 text-left">
                        <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700 md:grid-cols-4">
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Patient</p>
                                <p className="mt-1 text-base font-extrabold text-slate-900">{selectedMonthlyGroup.patientName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Period</p>
                                <p className="mt-1">{formatDate(selectedMonthlyGroup.periodFrom)} - {formatDate(selectedMonthlyGroup.periodTo)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Entries</p>
                                <p className="mt-1">{selectedMonthlyGroup.entries.length}</p>
                            </div>
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Draft Total</p>
                                <p className="mt-1 text-base font-extrabold text-[#0F969C] 700">{formatMoney(selectedMonthlyGroup.draftTotal || selectedMonthlyGroup.total)}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-4">
                            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">Source Breakdown</p>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {selectedMonthlyGroup.sourceSummary.map((source) => (
                                    <div key={source.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-extrabold text-slate-900">{source.name}</p>
                                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                                    {source.entries} entries, {source.draftEntries} draft
                                                </p>
                                            </div>
                                            <p className="whitespace-nowrap text-sm font-extrabold text-[#0F969C] 700">
                                                {formatMoney(source.draftAmount || source.amount)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="max-h-[46vh] overflow-auto rounded-2xl border border-slate-100">
                            <table className="min-w-[980px] divide-y divide-slate-100 text-sm sm:min-w-full">
                                <thead className="sticky top-0 z-10 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">Source</th>
                                        <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">Category</th>
                                        <th className="px-4 py-3 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">Qty</th>
                                        <th className="px-4 py-3 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">Rate</th>
                                        <th className="px-4 py-3 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedMonthlyGroup.entries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="px-4 py-3 font-semibold text-slate-700">{formatDate(entry.costDate)}</td>
                                            <td className="px-4 py-3"><StatusHighlighter value={formatSource(entry.sourceType)} /></td>
                                            <td className="px-4 py-3 font-extrabold text-slate-900">{entry.description}</td>
                                            <td className="px-4 py-3 text-slate-600">{entry.category}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{Number(entry.quantity || 0)}</td>
                                            <td className="px-4 py-3 text-right">{formatMoney(entry.rate)}</td>
                                            <td className="px-4 py-3 text-right font-extrabold">{formatMoney(entry.amount)}</td>
                                            <td className="px-4 py-3"><StatusHighlighter value={entry.invoiceRefNo ? `${entry.status} - ${entry.invoiceRefNo}` : 'Draft'} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <Modal
                isOpen={Boolean(selectedDailySheet)}
                onClose={() => setSelectedDailySheet(null)}
                title="Patient Daily Expense Sheet"
                type="info"
                size="xl"
                cancelLabel="Close"
            >
                {selectedDailySheet ? (
                    <div className="mt-4 space-y-5 text-left">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Patient</p>
                            <p className="text-lg font-extrabold text-slate-900">{selectedDailySheet.patientName}</p>
                            <p className="text-sm font-bold text-slate-600">
                                {selectedDailySheet.billLabel} - {selectedDailySheet.periodTo && selectedDailySheet.periodTo !== selectedDailySheet.date
                                    ? `${formatDate(selectedDailySheet.date)} to ${formatDate(selectedDailySheet.periodTo)}`
                                    : formatDate(selectedDailySheet.date)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => downloadDailySheetPdf(selectedDailySheet)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Download className="h-4 w-4" />
                            Download Daily Sheet
                        </button>

                        <div className="overflow-x-auto rounded-2xl border border-slate-100">
                            <table className="min-w-[760px] divide-y divide-slate-100 text-sm sm:min-w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {['Time', 'Category', 'Item', 'Qty', 'Rate', 'Amount', 'Source'].map((header) => (
                                            <th key={header} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {selectedDailySheet.entries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-700">{formatTime(entry.createdAt || entry.costDate)}</td>
                                            <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-700">{entry.category}</td>
                                            <td className="min-w-[180px] px-4 py-3 text-slate-600">{entry.description}</td>
                                            <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-700">{Number(entry.quantity || 0)}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-700">{formatMoney(entry.rate)}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-slate-900">{formatMoney(entry.amount)}</td>
                                            <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-600">{formatSource(entry.sourceType)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-4">
                            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">Daily Summary</p>
                            <div className="space-y-2">
                                {selectedDailySheet.summary.map((item) => (
                                    <div key={item.name} className="grid grid-cols-[minmax(160px,1fr)_minmax(120px,auto)] items-center gap-6 text-sm font-bold text-slate-700">
                                        <span>{item.name}</span>
                                        <span className="whitespace-nowrap text-right">{formatMoney(item.amount)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-slate-200 pt-2">
                                    <div className="grid grid-cols-[minmax(160px,1fr)_minmax(120px,auto)] items-center gap-6 text-base font-extrabold text-slate-900">
                                        <span>Daily Total</span>
                                        <span className="whitespace-nowrap text-right">{formatMoney(selectedDailySheet.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <Modal
                isOpen={Boolean(receiptInvoice)}
                onClose={() => setReceiptInvoice(null)}
                title="Monthly Invoice Ready"
                type="success"
                confirmLabel={markSent.isPending ? 'Saving...' : 'Mark Sent'}
                onConfirm={markReceiptSent}
                confirmDisabled={!receiptInvoice || markSent.isPending}
            >
                {receiptInvoice ? (
                    <div className="mt-4 space-y-4 text-left">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Invoice</p>
                                    <p className="text-xl font-extrabold text-slate-900">{receiptInvoice.refNo}</p>
                                    <p className="text-sm font-bold text-slate-600">{receiptInvoice.clientName}</p>
                                    <p className="mt-2 text-2xl font-extrabold text-emerald-700">{formatMoney(receiptInvoice.amount)}</p>
                                    <p className="mt-1 text-xs font-bold text-slate-500">
                                        {formatDate(receiptInvoice.metadata?.billingPeriodFrom || periodFrom)} to {formatDate(receiptInvoice.metadata?.billingPeriodTo || periodTo)}
                                    </p>
                                </div>
                                <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-center text-xs font-extrabold text-slate-500">
                                    {qrImageUrl ? <img src={qrImageUrl} alt="GPay QR" className="h-full w-full rounded-xl object-cover" /> : <DummyQr />}
                                </div>
                            </div>
                            <p className="mt-3 text-sm font-bold text-slate-700">UPI ID: {upiId}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">Monthly Charge Breakdown</p>
                            {(receiptInvoice.metadata?.chargeSummary || groupedCharges).map((item: any) => (
                                <div key={item.name} className="flex items-center justify-between py-1 text-sm font-bold text-slate-700">
                                    <span>{item.name}</span>
                                    <span>{formatMoney(item.amount)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Owner UPI / GPay ID" value={upiId} onChange={setUpiId} />
                            <Field label="QR Image URL" value={qrImageUrl} onChange={setQrImageUrl} placeholder="Optional hosted QR image URL" />
                        </div>

                        <label className="block">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Send / Tracking Mode</span>
                            <select
                                value={sentVia}
                                onChange={(event) => setSentVia(event.target.value)}
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20"
                            >
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Email">Email</option>
                                <option value="Client Portal">Client Portal</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </label>

                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-slate-900 font-extrabold">
                            Download the PDF, click WhatsApp, attach the PDF manually, then mark the invoice as sent.
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={downloadInvoicePdf}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                                <Download className="h-4 w-4" />
                                Download PDF
                            </button>
                            <button
                                type="button"
                                onClick={openWhatsApp}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-800"
                            >
                                <Send className="h-4 w-4" />
                                Send To Family
                            </button>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    )
}

function DummyQr() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-slate-50 p-2">
            <div className="grid h-20 w-20 grid-cols-7 grid-rows-7 gap-0.5 rounded-md bg-white p-1 shadow-inner">
                {Array.from({ length: 49 }).map((_, index) => {
                    const row = Math.floor(index / 7)
                    const col = index % 7
                    const finder = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2)
                    const pattern = finder || [3, 5, 9, 10, 13, 16, 18, 20, 22, 24, 27, 31, 32, 34, 37, 40, 43, 45].includes(index)
                    return <span key={index} className={pattern ? 'rounded-[1px] bg-slate-800' : 'rounded-[1px] bg-slate-100'} />
                })}
            </div>
            <span className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Dummy GPay QR</span>
        </div>
    )
}

function Field({ label, value, onChange, type = 'text', placeholder, min, step }: {
    label: string
    value: string
    onChange: (value: string) => void
    type?: string
    placeholder?: string
    min?: string
    step?: string
}) {
    return (
        <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
            <input
                type={type}
                min={min}
                step={step}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20"
            />
        </label>
    )
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: 'emerald' | 'blue' | 'amber' }) {
    const tones = {
        emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
        blue: 'border-blue-100 bg-blue-50 text-blue-800',
        amber: 'border-amber-100 bg-amber-50 text-slate-900 font-extrabold'
    }

    return (
        <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
            <p className="mt-3 text-2xl font-extrabold">{value}</p>
            <p className="text-xs font-extrabold uppercase tracking-wide">{label}</p>
        </div>
    )
}
