import { useEffect, useMemo, useState } from 'react'
import { IndianRupee, Save } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useInvoices } from '../../accounts/hooks/useAccounts'
import { useInHouseAllocations } from '../../allocation/hooks/useAllocation'
import { useInventoryProducts } from '../../inventory/hooks/useInventory'
import { useUnits } from '../../master/hooks/useUnit'
import { useCaregiverRevenueSheets, usePatientBillingServices, useSaveCaregiverRevenueSheet } from '../../patient_billing/hooks/usePatientBilling'
import type { CaregiverRevenueItem } from '../../patient_billing/services/patientBilling'

const money = (value: number) => `Rs ${Number(value || 0).toFixed(2)}`
const monthKey = () => new Date().toISOString().slice(0, 7)
const daysInMonth = (month: string) => {
    const [year, monthNumber] = month.split('-').map(Number)
    if (!year || !monthNumber) return 31
    return new Date(year, monthNumber, 0).getDate()
}

const revenueItemTemplates = [
    { key: 'diaper', label: 'Diaper', unit: 'Nos' },
    { key: 'gloves', label: 'Gloves', unit: 'Nos' },
    { key: 'mask', label: 'Mask', unit: 'Nos' },
    { key: 'ec_bath', label: 'EC Bath', unit: 'Nos' },
    { key: 'underpad_rubber_sheet', label: 'Underpad / Rubber Sheet', unit: 'Nos' },
    { key: 'catheter_uro_bag', label: 'Catheter / Uro Bag', unit: 'Nos' },
    { key: 'doctor_checkup', label: 'Doctor Checkup', unit: 'Visit' },
    { key: 'injection', label: 'Injection', unit: 'Nos' },
    { key: 'ambulance', label: 'Ambulance', unit: 'Trip' },
    { key: 'lab', label: 'Lab', unit: 'Test' },
    { key: 'dressing', label: 'Dressing', unit: 'Nos' },
    { key: 'hygiene_items', label: 'Hygiene / Personal Care', unit: 'Nos' },
    { key: 'other_care_items', label: 'Other Care Items', unit: 'Nos' }
]

const emptyRevenueItems = (chargeableProducts: any[] = []): CaregiverRevenueItem[] => {
    if (chargeableProducts.length) {
        return chargeableProducts.map((product) => ({
            key: product.id,
            label: product.name,
            category: product.category || null,
            unit: product.unit || 'Nos',
            rate: Number(product.defaultRevenuePrice || 0),
            days: {}
        }))
    }

    return revenueItemTemplates.map((item) => ({
        ...item,
        rate: 0,
        days: {}
    }))
}

const fallbackRevenueItems = (): CaregiverRevenueItem[] => revenueItemTemplates.map((item) => ({
    ...item,
    rate: 0,
    days: {}
}))

const isDemoLike = (value?: unknown) => {
    const normalized = String(value || '').trim().toUpperCase()
    return normalized.startsWith('DEMO-') || normalized.startsWith('SEED-') || normalized.includes('DEMO-') || normalized.includes('SEED-')
}

const emptyList: any[] = []

export function Revenue() {
    const [searchQuery, setSearchQuery] = useState('')
    const [sheetMonth, setSheetMonth] = useState(monthKey())
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [manualPatientName, setManualPatientName] = useState('')
    const [revenueItems, setRevenueItems] = useState<CaregiverRevenueItem[]>(() => fallbackRevenueItems())
    const [signatures, setSignatures] = useState({ caregiverDay: '', caregiverNight: '', nurse: '', manager: '' })
    const { data: units = emptyList } = useUnits()
    const uecUnitId = useMemo(() => {
        const uecUnit = units.find((unit: any) => {
            const code = String(unit.unitId || '').trim().toUpperCase()
            const shortName = String(unit.shortName || '').trim().toUpperCase()
            const name = String(unit.name || '').trim().toUpperCase()
            return code === 'UEC' || shortName === 'UEC' || name.includes('UNIVERSAL ELDER CARE')
        })
        return uecUnit?.id || null
    }, [units])
    const { data: invoices = emptyList, isLoading: invoicesLoading } = useInvoices()
    const { data: allocations = emptyList, isLoading: allocationsLoading } = useInHouseAllocations()
    const { data: inventoryProducts = emptyList } = useInventoryProducts(uecUnitId ? { unitId: uecUnitId } : undefined)
    const { data: patientServices = emptyList } = usePatientBillingServices()
    const { data: revenueSheets = emptyList } = useCaregiverRevenueSheets(sheetMonth)
    const saveRevenueSheet = useSaveCaregiverRevenueSheet()

    const selectedService = patientServices.find((service) => service.allocationId === selectedServiceId)
    const selectedSheet = revenueSheets.find((sheet) => sheet.allocationId === selectedServiceId)
    const days = useMemo(() => Array.from({ length: daysInMonth(sheetMonth) }, (_, index) => index + 1), [sheetMonth])
    const chargeableRevenueProducts = useMemo(() => inventoryProducts
        .filter((product: any) => product.chargeableInCareRevenue && product.status !== false)
        .sort((first: any, second: any) => String(first.name || '').localeCompare(String(second.name || ''))), [inventoryProducts])

    useEffect(() => {
        if (!selectedServiceId && patientServices[0]) setSelectedServiceId(patientServices[0].allocationId)
    }, [patientServices, selectedServiceId])

    useEffect(() => {
        if (selectedSheet) {
            const savedByKey = new Map((selectedSheet.items || []).map((item: CaregiverRevenueItem) => [item.key, item]))
            setRevenueItems(emptyRevenueItems(chargeableRevenueProducts).map((item) => ({ ...item, ...(savedByKey.get(item.key) || {}) })))
            setManualPatientName(selectedSheet.patientName || '')
            setSignatures({
                caregiverDay: selectedSheet.signatures?.caregiverDay || '',
                caregiverNight: selectedSheet.signatures?.caregiverNight || '',
                nurse: selectedSheet.signatures?.nurse || '',
                manager: selectedSheet.signatures?.manager || ''
            })
        } else {
            setRevenueItems(emptyRevenueItems(chargeableRevenueProducts))
            setManualPatientName(selectedService?.patientName || '')
            setSignatures({ caregiverDay: '', caregiverNight: '', nurse: '', manager: '' })
        }
    }, [selectedSheet?.id, selectedServiceId, sheetMonth, selectedService?.patientName, chargeableRevenueProducts])

    const rows = useMemo(() => {
        const allocationMap = new Map(allocations.map((allocation: any) => [allocation.id, allocation]))
        return invoices
            .filter((invoice: any) => {
                const allocation = allocationMap.get(invoice.allocationId) as any
                const isInHouse = allocationMap.has(invoice.allocationId) || String(invoice.category || '').toLowerCase().includes('in-house')
                const hasDemoIdentity = [
                    invoice.refNo,
                    invoice.receiptNo,
                    invoice.clientName,
                    invoice.category,
                    invoice.notes,
                    invoice.metadata?.allocationRef,
                    invoice.metadata?.taskRefNo,
                    invoice.metadata?.patientName,
                    allocation?.ref,
                    allocation?.clientName
                ].some(isDemoLike)
                return isInHouse && !hasDemoIdentity
            })
            .map((invoice: any) => {
                const allocation = allocationMap.get(invoice.allocationId) as any
                const amount = Number(invoice.amount || 0)
                const paidAmount = Number(invoice.metadata?.paidAmount || 0)
                const balanceAmount = Number(invoice.metadata?.balanceAmount ?? Math.max(0, amount - paidAmount))
                return {
                    id: invoice.id,
                    refNo: invoice.refNo || invoice.receiptNo,
                    service: invoice.category || allocation?.service || 'In-House Care',
                    clientName: invoice.clientName || allocation?.clientName || '-',
                    guardian: allocation?.guardian || allocation?.mobile || '-',
                    amount,
                    paidAmount,
                    balanceAmount,
                    status: balanceAmount <= 0 && amount > 0 ? 'Paid' : String(invoice.status || 'Created'),
                    date: invoice.date || invoice.createdAt
                }
            })
    }, [allocations, invoices])

    const visibleRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return rows.filter((row) => !query || [
            row.refNo,
            row.service,
            row.clientName,
            row.guardian,
            row.status
        ].some((value) => String(value || '').toLowerCase().includes(query)))
    }, [rows, searchQuery])

    const totalRevenue = rows.reduce((sum, row) => sum + row.amount, 0)
    const totalPaid = rows.reduce((sum, row) => sum + row.paidAmount, 0)
    const totalDue = rows.reduce((sum, row) => sum + row.balanceAmount, 0)
    const sheetTotal = revenueItems.reduce((sum, item) => (
        sum + Object.values(item.days || {}).reduce((qtySum, value) => qtySum + Number(value || 0), 0) * Number(item.rate || 0)
    ), 0)

    const updateItemRate = (key: string, rate: string) => {
        setRevenueItems((prev) => prev.map((item) => item.key === key ? { ...item, rate: Number(rate || 0) } : item))
    }

    const updateItemUnit = (key: string, unit: string) => {
        setRevenueItems((prev) => prev.map((item) => item.key === key ? { ...item, unit } : item))
    }

    const updateItemDay = (key: string, day: number, quantity: string) => {
        setRevenueItems((prev) => prev.map((item) => {
            if (item.key !== key) return item
            return {
                ...item,
                days: {
                    ...(item.days || {}),
                    [String(day)]: Number(quantity || 0)
                }
            }
        }))
    }

    const handleSaveRevenueSheet = async () => {
        const patientName = selectedService?.patientName || manualPatientName.trim()
        if (!patientName) return
        await saveRevenueSheet.mutateAsync({
            allocationId: selectedService?.allocationId || null,
            patientId: selectedService?.patientId || null,
            patientName,
            clientName: selectedService?.clientName || null,
            month: sheetMonth,
            items: revenueItems,
            signatures,
            status: 'DRAFT'
        })
    }

    const columns: Column<any>[] = [
        { key: 'sno', header: 'S.No', cell: (_row, index) => index + 1 },
        { key: 'refNo', header: 'Invoice', cell: (row) => <span className="font-extrabold text-primary-700">{row.refNo || '-'}</span> },
        { key: 'service', header: 'Service Details', cell: (row) => <span className="font-bold text-slate-900">{row.service}</span> },
        { key: 'clientName', header: 'Client Details', cell: (row) => <span className="font-semibold">{row.clientName}</span> },
        { key: 'guardian', header: 'Guardian / Contact', cell: (row) => row.guardian || '-' },
        {
            key: 'dailyRevenue',
            header: 'Revenue',
            cell: (row) => (
                <div className="text-sm">
                    <p className="font-extrabold">{money(row.amount)}</p>
                    <p className="text-xs font-semibold text-slate-500">Paid {money(row.paidAmount)} / Due {money(row.balanceAmount)}</p>
                </div>
            )
        },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="In-House Care Revenue"
                subtitle="Live in-house billing and collection view from invoice and receipt data."
                breadcrumbs={[{ label: 'In-House Care' }, { label: 'Revenue' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <IndianRupee className="mb-2 h-5 w-5" />
                    <p className="text-2xl font-extrabold">{money(totalRevenue)}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Billed</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{money(totalPaid)}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Collected</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{money(totalDue)}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Pending</p>
                </div>
            </div>

            <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-base font-extrabold text-slate-950">Care Giver's Total Revenue Form</h2>
                        <p className="text-sm font-semibold text-slate-500">Monthly used-items register stored in the same day-wise structure as the paper form.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveRevenueSheet}
                        disabled={saveRevenueSheet.isPending || (!selectedService && !manualPatientName.trim())}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                        <Save className="h-4 w-4" />
                        {saveRevenueSheet.isPending ? 'Saving...' : 'Save Sheet'}
                    </button>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-4">
                    <label className="block">
                        <span className="mb-1 block text-xs font-extrabold uppercase text-slate-500">Patient / Service</span>
                        <select value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold">
                            <option value="">Manual patient</option>
                            {patientServices.map((service) => (
                                <option key={service.allocationId} value={service.allocationId}>{service.patientName} - {service.serviceLabel}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-extrabold uppercase text-slate-500">Manual Name</span>
                        <input value={manualPatientName} onChange={(event) => setManualPatientName(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold" placeholder={selectedService?.patientName || 'Inmate name'} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-extrabold uppercase text-slate-500">Month</span>
                        <input type="month" value={sheetMonth} onChange={(event) => setSheetMonth(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold" />
                    </label>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-xs font-extrabold uppercase text-slate-500">Sheet Total</p>
                        <p className="text-lg font-extrabold text-slate-900">{money(sheetTotal)}</p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-[2100px] border-collapse text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="w-56 border border-slate-200 px-2 py-2 text-left">Particulars</th>
                                <th className="w-16 border border-slate-200 px-2 py-2 text-left">Unit</th>
                                <th className="w-20 border border-slate-200 px-2 py-2 text-left">Rate</th>
                                {days.map((day) => <th key={day} className="w-12 border border-slate-200 px-2 py-2 text-center">{day}</th>)}
                                <th className="w-24 border border-slate-200 px-2 py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenueItems.map((item) => {
                                const quantity = Object.values(item.days || {}).reduce((sum, value) => sum + Number(value || 0), 0)
                                return (
                                    <tr key={item.key}>
                                        <td className="border border-slate-200 px-2 py-1 font-bold text-slate-800">{item.label}</td>
                                        <td className="border border-slate-200 p-1">
                                            <input
                                                value={item.unit || ''}
                                                onChange={(event) => updateItemUnit(item.key, event.target.value)}
                                                placeholder="Unit"
                                                className="h-8 w-full rounded border border-transparent bg-transparent px-1 text-xs outline-none focus:border-primary-300 focus:bg-white"
                                            />
                                        </td>
                                        <td className="border border-slate-200 p-1">
                                            <input type="number" min="0" value={item.rate || ''} onChange={(event) => updateItemRate(item.key, event.target.value)} className="h-8 w-full rounded border border-transparent bg-transparent px-1 text-xs outline-none focus:border-primary-300 focus:bg-white" />
                                        </td>
                                        {days.map((day) => (
                                            <td key={day} className="border border-slate-200 p-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.days?.[String(day)] || ''}
                                                    onChange={(event) => updateItemDay(item.key, day, event.target.value)}
                                                    className="h-8 w-full rounded border border-transparent bg-transparent px-1 text-center text-xs outline-none focus:border-primary-300 focus:bg-white"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-slate-200 px-2 py-1 text-right font-extrabold">{money(quantity * Number(item.rate || 0))}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {([
                        ['caregiverDay', 'Caregiver Day'],
                        ['caregiverNight', 'Caregiver Night'],
                        ['nurse', 'Nurse'],
                        ['manager', 'Manager']
                    ] as const).map(([key, label]) => (
                        <label key={key} className="block">
                            <span className="mb-1 block text-xs font-extrabold uppercase text-slate-500">{label}</span>
                            <input
                                value={signatures[key]}
                                onChange={(event) => setSignatures((prev) => ({ ...prev, [key]: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold"
                            />
                        </label>
                    ))}
                </div>
            </section>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search invoice, client, service, status..."
            />

            <DataTable
                data={visibleRows}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={invoicesLoading || allocationsLoading}
                emptyStateMessage="No live in-house revenue found. Complete an in-house duty and invoice flow first."
            />
        </div>
    )
}
