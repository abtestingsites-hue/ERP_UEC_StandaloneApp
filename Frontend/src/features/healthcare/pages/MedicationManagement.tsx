import { useMemo, useState } from 'react'
import { PackagePlus, Pill, Send } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { PageHeader } from '../../../components/PageHeader'
import { Select } from '../../../components/Select'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { hasPermissionAccess } from '../../../lib/access'
import { useAuthStore } from '../../../store/authStore'
import {
    useCreateInventoryProduct,
    useCreateInventoryStockIssueRequest,
    useInventoryProducts,
    useInventoryStock,
    useInventoryStockIssueRequests,
    useUpdateInventoryStock,
    useInventoryBatches
} from '../../inventory/hooks/useInventory'
import type { InventoryProduct, InventoryStock, InventoryStockIssueRequest, InventoryProductBatch } from '../../inventory/types'

const medicineCategory = 'medical'
const lowStockThreshold = 10

const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Inhaler', 'Other']

const getQuantity = (stockByProductId: Map<string, InventoryStock>, productId: string) =>
    Number(stockByProductId.get(productId)?.quantity || 0)

const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return 'Out of Stock'
    if (quantity <= lowStockThreshold) return 'Low Stock'
    return 'Available'
}

const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-GB')
}

const medicineDisplayName = (name: string, dosageForm: string, strength: string) =>
    [name.trim(), strength.trim(), dosageForm.trim()].filter(Boolean).join(' - ')

export function MedicationManagement() {
    const user = useAuthStore((state) => state.user)
    const [searchQuery, setSearchQuery] = useState('')
    const [medicineDrawerOpen, setMedicineDrawerOpen] = useState(false)
    const [issueDrawerOpen, setIssueDrawerOpen] = useState(false)
    const [batchesDrawerProductId, setBatchesDrawerProductId] = useState<string | null>(null)
    const [medicineForm, setMedicineForm] = useState({ name: '', dosageForm: 'Tablet', strength: '', openingStock: '', reorderLevel: String(lowStockThreshold) })
    const [issueForm, setIssueForm] = useState({ productId: '', quantity: '', issuedTo: '', notes: '' })

    const { data: products = [], isLoading: isProductsLoading } = useInventoryProducts()
    const { data: stock = [], isLoading: isStockLoading } = useInventoryStock()
    const { data: issueRequests = [], isLoading: isIssueLoading } = useInventoryStockIssueRequests()
    const { data: batches = [], isLoading: isBatchesLoading } = useInventoryBatches({ productId: batchesDrawerProductId || undefined })
    const createProduct = useCreateInventoryProduct()
    const updateStock = useUpdateInventoryStock()
    const createIssueRequest = useCreateInventoryStockIssueRequest()

    const canCreateMedicine = hasPermissionAccess(user, ['Products', 'Inventory Products', 'Stock'])
    const canRequestMedicine = hasPermissionAccess(user, ['Stock Issue Request'])

    const stockByProductId = useMemo(() => new Map(stock.map((item) => [item.productId, item])), [stock])

    const medicines = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return products
            .filter((product) => product.category.toLowerCase() === medicineCategory)
            .filter((product) => !query || [
                product.name,
                product.category,
                getQuantity(stockByProductId, product.id)
            ].some((value) => String(value).toLowerCase().includes(query)))
    }, [products, searchQuery, stockByProductId])

    const medicalStock = useMemo(() => (
        stock.filter((item) => item.product?.category?.toLowerCase() === medicineCategory)
    ), [stock])

    const availableMedicineOptions = useMemo(() => (
        medicalStock
            .filter((item) => Number(item.quantity || 0) > 0)
            .map((item) => ({
                value: item.productId,
                label: `${item.product?.name || 'Unknown Medicine'} - Qty ${item.quantity}`
            }))
    ), [medicalStock])

    const selectedStock = useMemo(
        () => medicalStock.find((item) => item.productId === issueForm.productId),
        [issueForm.productId, medicalStock]
    )

    const medicineIssueRequests = useMemo(() => (
        issueRequests.filter((request) => request.category.toLowerCase() === medicineCategory)
    ), [issueRequests])

    const handleCreateMedicine = async (event: React.FormEvent) => {
        event.preventDefault()
        const name = medicineDisplayName(medicineForm.name, medicineForm.dosageForm, medicineForm.strength)
        if (!name) return

        const product = await createProduct.mutateAsync({ name, category: medicineCategory })
        const openingStock = Math.trunc(Number(medicineForm.openingStock || 0))
        if (openingStock > 0) {
            await updateStock.mutateAsync({ productId: product.id, quantity: openingStock })
        }

        setMedicineForm({ name: '', dosageForm: 'Tablet', strength: '', openingStock: '', reorderLevel: String(lowStockThreshold) })
        setMedicineDrawerOpen(false)
    }

    const handleRequestIssue = async (event: React.FormEvent) => {
        event.preventDefault()
        const quantity = Math.trunc(Number(issueForm.quantity || 0))
        const currentQuantity = Number(selectedStock?.quantity || 0)
        if (!issueForm.productId || quantity <= 0 || quantity > currentQuantity) return

        await createIssueRequest.mutateAsync({
            productId: issueForm.productId,
            quantity,
            usageType: 'PATIENT_MEDICATION',
            issuedTo: issueForm.issuedTo.trim(),
            notes: issueForm.notes.trim()
        })

        setIssueForm({ productId: '', quantity: '', issuedTo: '', notes: '' })
        setIssueDrawerOpen(false)
    }

    const columns: Column<InventoryProduct>[] = [
        { key: 'sno', header: 'S.No', cell: (_item, index) => index + 1, sortable: false },
        {
            key: 'name',
            header: 'Medicine',
            cell: (product) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Pill className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-gray-900 dark:text-gray-100">{product.name}</span>
                        <span className="text-xs font-semibold text-gray-500">Medical stock item</span>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            key: 'quantity',
            header: 'Current Stock',
            cell: (product) => getQuantity(stockByProductId, product.id),
            sortable: true
        },
        {
            key: 'status',
            header: 'Stock Status',
            cell: (product) => <StatusHighlighter value={getStockStatus(getQuantity(stockByProductId, product.id))} />
        },
        {
            key: 'updatedAt',
            header: 'Last Updated',
            cell: (product) => formatDateTime(stockByProductId.get(product.id)?.updatedAt || product.updatedAt)
        },
        ...(canRequestMedicine ? [{
            key: 'action',
            header: 'Action',
            cell: (product) => (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setIssueForm({ productId: product.id, quantity: '', issuedTo: '', notes: '' })
                            setIssueDrawerOpen(true)
                        }}
                        disabled={getQuantity(stockByProductId, product.id) <= 0}
                        className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 transition hover:bg-primary-100 disabled:opacity-50"
                    >
                        Request Issue
                    </button>
                    {product.isBatchTracked ? (
                        <button
                            type="button"
                            onClick={() => setBatchesDrawerProductId(product.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50"
                        >
                            Batches
                        </button>
                    ) : null}
                </div>
            ),
            sortable: false
        } satisfies Column<InventoryProduct>] : [])
    ]

    const requestColumns: Column<InventoryStockIssueRequest>[] = [
        { key: 'productName', header: 'Medicine', cell: (request) => <span className="font-extrabold text-gray-900 dark:text-gray-100">{request.productName}</span> },
        { key: 'quantity', header: 'Qty', sortable: true },
        { key: 'issuedTo', header: 'Patient / Receiver', cell: (request) => request.issuedTo || '-' },
        { key: 'notes', header: 'Notes', cell: (request) => request.notes || '-' },
        { key: 'status', header: 'Status', cell: (request) => <StatusHighlighter value={request.status} /> },
        { key: 'requestedAt', header: 'Requested At', cell: (request) => formatDateTime(request.requestedAt), sortable: true }
    ]

    const isSavingMedicine = createProduct.isPending || updateStock.isPending
    const summary = [
        { label: 'Medicines', value: medicines.length, tone: 'bg-primary-50 text-primary-700' },
        { label: 'Available Stock', value: medicalStock.filter((item) => Number(item.quantity || 0) > lowStockThreshold).length, tone: 'bg-emerald-50 text-emerald-700' },
        { label: 'Low / Out Stock', value: medicalStock.filter((item) => Number(item.quantity || 0) <= lowStockThreshold).length, tone: 'bg-amber-50 text-amber-700' },
        { label: 'Issue Requests', value: medicineIssueRequests.length, tone: 'bg-sky-50 text-sky-700' }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Medication Management"
                subtitle="Live medicine master, stock visibility, and patient medicine issue requests."
                breadcrumbs={[{ label: 'Healthcare' }, { label: 'Medication Management' }]}
                action={(
                    <div className="flex flex-wrap gap-2">
                        {canRequestMedicine ? (
                            <button
                                type="button"
                                onClick={() => setIssueDrawerOpen(true)}
                                className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-xs font-extrabold text-primary-700 hover:bg-primary-100"
                            >
                                <Send className="h-4 w-4" />
                                Request Medicine
                            </button>
                        ) : null}
                    </div>
                )}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                {summary.map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 p-4 shadow-sm ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            {canCreateMedicine ? <ActionBar onAdd={() => setMedicineDrawerOpen(true)} addLabel="Add Medicine" /> : null}

            {!canCreateMedicine && !canRequestMedicine ? (
                <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    This login can view medication stock, but does not have medicine creation or issue request access.
                </div>
            ) : null}

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search medicine by name, strength, form, or stock..."
            />

            <div className="mb-5">
                <DataTable
                    data={medicines}
                    columns={columns}
                    keyExtractor={(product) => product.id}
                    isLoading={isProductsLoading || isStockLoading}
                    emptyStateMessage="No live medicines found. Add medicines through this page or medical inventory products."
                />
            </div>

            <section className="mb-6 flex min-h-[300px] flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-950">Medicine Request History</h2>
                        <p className="text-sm font-semibold text-slate-500">Live request status after medical inventory approval.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIssueDrawerOpen(true)}
                        disabled={!canRequestMedicine}
                        className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-extrabold text-primary-700 transition hover:bg-primary-100 disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                        New Request
                    </button>
                </div>
                <div className="min-h-[230px] flex-1">
                    <DataTable
                        data={medicineIssueRequests}
                        columns={requestColumns}
                        keyExtractor={(request) => request.id}
                        isLoading={isIssueLoading}
                        emptyStateMessage="No medicine issue requests found."
                    />
                </div>
            </section>

            <Drawer isOpen={medicineDrawerOpen} onClose={() => setMedicineDrawerOpen(false)} title="Add Medicine" size="md">
                <form onSubmit={handleCreateMedicine} className="space-y-4">
                    <Input label="Medicine Name" required value={medicineForm.name} onChange={(event) => setMedicineForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Paracetamol" />
                    <Select label="Dosage Form" value={medicineForm.dosageForm} onChange={(event) => setMedicineForm((prev) => ({ ...prev, dosageForm: event.target.value }))} options={dosageForms.map((form) => ({ value: form, label: form }))} />
                    <Input label="Strength" value={medicineForm.strength} onChange={(event) => setMedicineForm((prev) => ({ ...prev, strength: event.target.value }))} placeholder="500 mg" />
                    <Input label="Opening Stock" type="number" min="0" step="1" value={medicineForm.openingStock} onChange={(event) => setMedicineForm((prev) => ({ ...prev, openingStock: event.target.value }))} placeholder="0" />
                    <Input label="Reorder Level" type="number" min="0" step="1" value={medicineForm.reorderLevel} onChange={(event) => setMedicineForm((prev) => ({ ...prev, reorderLevel: event.target.value }))} placeholder="10" />

                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                        Reorder level is shown as guidance now. Stock alert still uses the existing inventory threshold until medicine batch fields are added later.
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setMedicineDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-300 dark:hover:bg-white/5">Cancel</button>
                        <button type="submit" disabled={isSavingMedicine} className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#294D61] disabled:opacity-60">
                            <PackagePlus className="h-4 w-4" />
                            {isSavingMedicine ? 'Saving...' : 'Save Medicine'}
                        </button>
                    </div>
                </form>
            </Drawer>

            <Drawer isOpen={issueDrawerOpen} onClose={() => setIssueDrawerOpen(false)} title="Request Medicine Issue" size="md">
                <form onSubmit={handleRequestIssue} className="space-y-4">
                    <Select
                        label="Medicine"
                        required
                        value={issueForm.productId}
                        onChange={(event) => setIssueForm((prev) => ({ ...prev, productId: event.target.value }))}
                        options={availableMedicineOptions}
                        placeholder={availableMedicineOptions.length ? 'Select medicine' : 'No medicine stock available'}
                    />
                    <Input label="Quantity" required type="number" min="1" max={selectedStock?.quantity || undefined} step="1" value={issueForm.quantity} onChange={(event) => setIssueForm((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="Enter quantity" />
                    <Input label="Patient / Receiver" value={issueForm.issuedTo} onChange={(event) => setIssueForm((prev) => ({ ...prev, issuedTo: event.target.value }))} placeholder="Patient name, room, or staff" />
                    <Input label="Clinical Notes" value={issueForm.notes} onChange={(event) => setIssueForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Reason, dosage instruction, or prescription ref" />

                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                        This creates a pending issue request. Medical Inventory approves it before live stock is reduced.
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIssueDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-300 dark:hover:bg-white/5">Cancel</button>
                        <button type="submit" disabled={!canRequestMedicine || createIssueRequest.isPending || availableMedicineOptions.length === 0} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#294D61] disabled:opacity-60">
                            Save Request
                        </button>
                    </div>
                </form>
            </Drawer>

            <Drawer isOpen={!!batchesDrawerProductId} onClose={() => setBatchesDrawerProductId(null)} title="Medicine Batches" size="lg">
                <div className="p-2">
                    {isBatchesLoading ? (
                        <div className="py-8 text-center text-sm text-slate-500">Loading batches...</div>
                    ) : batches.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">No active batches found for this product. Existing stock may be legacy unbatched.</div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-extrabold">Batch No</th>
                                        <th className="px-4 py-3 font-extrabold">Expiry Date</th>
                                        <th className="px-4 py-3 font-extrabold">Quantity</th>
                                        <th className="px-4 py-3 font-extrabold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {batches.map((batch: InventoryProductBatch) => (
                                        <tr key={batch.id}>
                                            <td className="px-4 py-3 font-semibold">{batch.batchNumber}</td>
                                            <td className="px-4 py-3">{formatDateTime(batch.expiryDate)}</td>
                                            <td className="px-4 py-3 font-semibold">{batch.quantity}</td>
                                            <td className="px-4 py-3">
                                                <StatusHighlighter value={batch.status || ''} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Drawer>
        </div>
    )
}
