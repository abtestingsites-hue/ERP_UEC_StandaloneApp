import { useMemo, useState } from 'react'
import { AlertTriangle, Boxes, ClipboardCheck, PackagePlus, Search, Wrench } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { hasPermissionAccess } from '../../../lib/access'
import { useAuthStore } from '../../../store/authStore'
import {
    useCreateInventoryProduct,
    useCreateInventoryStockIssueRequest,
    useInventoryProducts,
    useInventoryPurchases,
    useInventoryStock,
    useInventoryStockIssueRequests,
    useInventoryStockMovements,
    useUpdateInventoryStock
} from '../hooks/useInventory'
import type { InventoryProduct, InventoryStockIssueRequest } from '../types'

const assetCategories = new Set(['medical', 'assets', 'asset'])

const getAssetCode = (product: InventoryProduct) => product.code || `AST-${product.id.slice(0, 8).toUpperCase()}`
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-GB') : '-'
const isOpenIssue = (issue: InventoryStockIssueRequest) => issue.status === 'PENDING'
const isAssetIssue = (issue: InventoryStockIssueRequest) => /asset|repair|damage|missing|service/i.test(`${issue.usageType} ${issue.notes || ''}`)

type AssetAction = 'Repair' | 'Damaged' | 'Missing' | 'Moved'

export function AssetProducts() {
    const [searchQuery, setSearchQuery] = useState('')
    const user = useAuthStore((state) => state.user)
    const canCreateProduct = hasPermissionAccess(user, ['Products', 'Create Products', 'Inventory Products'])
    const canRequestIssue = hasPermissionAccess(user, ['Stock Issue Request'])
    const [registerOpen, setRegisterOpen] = useState(false)
    const [issueOpen, setIssueOpen] = useState(false)
    const [selectedAsset, setSelectedAsset] = useState<InventoryProduct | null>(null)
    const [registerForm, setRegisterForm] = useState({ name: '', code: '', openingStock: '1' })
    const [issueForm, setIssueForm] = useState({
        action: 'Repair' as AssetAction,
        quantity: '1',
        location: '',
        assignedTo: '',
        notes: ''
    })

    const { data: products = [], isLoading: isProductsLoading } = useInventoryProducts()
    const { data: stock = [], isLoading: isStockLoading } = useInventoryStock()
    const { data: purchases = [] } = useInventoryPurchases()
    const { data: movements = [] } = useInventoryStockMovements()
    const { data: issueRequests = [], isLoading: isIssuesLoading } = useInventoryStockIssueRequests()
    const createProduct = useCreateInventoryProduct()
    const updateStock = useUpdateInventoryStock()
    const createIssueRequest = useCreateInventoryStockIssueRequest()

    const stockByProductId = useMemo(() => new Map(stock.map((item) => [item.productId, item])), [stock])
    const purchasesByProductId = useMemo(() => {
        const grouped = new Map<string, typeof purchases>()
        purchases.forEach((purchase) => grouped.set(purchase.productId, [...(grouped.get(purchase.productId) || []), purchase]))
        return grouped
    }, [purchases])
    const movementsByProductId = useMemo(() => {
        const grouped = new Map<string, typeof movements>()
        movements.forEach((movement) => grouped.set(movement.productId, [...(grouped.get(movement.productId) || []), movement]))
        return grouped
    }, [movements])
    const openIssuesByProductId = useMemo(() => {
        const grouped = new Map<string, InventoryStockIssueRequest[]>()
        issueRequests.filter((issue) => isOpenIssue(issue) && isAssetIssue(issue)).forEach((issue) => {
            grouped.set(issue.productId, [...(grouped.get(issue.productId) || []), issue])
        })
        return grouped
    }, [issueRequests])

    const assets = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return products
            .filter((product) => assetCategories.has(product.category.toLowerCase()))
            .filter((product) => {
                const currentStock = stockByProductId.get(product.id)?.quantity ?? ''
                const latestMovement = movementsByProductId.get(product.id)?.[0]
                const openIssue = openIssuesByProductId.get(product.id)?.[0]
                const searchable = [
                    product.name,
                    product.category,
                    getAssetCode(product),
                    currentStock,
                    latestMovement?.issuedTo,
                    latestMovement?.usageType,
                    openIssue?.usageType,
                    openIssue?.notes
                ]
                return !query || searchable.some((value) => String(value || '').toLowerCase().includes(query))
            })
    }, [movementsByProductId, openIssuesByProductId, products, searchQuery, stockByProductId])

    const totalQuantity = assets.reduce((sum, asset) => sum + Number(stockByProductId.get(asset.id)?.quantity || 0), 0)
    const assetsWithOpenIssue = assets.filter((asset) => (openIssuesByProductId.get(asset.id)?.length || 0) > 0).length
    const lowOrMissingAssets = assets.filter((asset) => Number(stockByProductId.get(asset.id)?.quantity || 0) <= 0).length

    const openIssueDrawer = (asset: InventoryProduct) => {
        if (!canRequestIssue) return
        setSelectedAsset(asset)
        setIssueForm({ action: 'Repair', quantity: '1', location: '', assignedTo: '', notes: '' })
        setIssueOpen(true)
    }

    const handleRegisterAsset = async (event: React.FormEvent) => {
        event.preventDefault()
        const name = registerForm.name.trim()
        if (!name || !canCreateProduct) return

        const code = registerForm.code.trim() ? registerForm.code.trim().toUpperCase() : undefined
        const product = await createProduct.mutateAsync({ name, code, category: 'medical' })
        const openingStock = Math.max(0, Math.trunc(Number(registerForm.openingStock || 0)))
        if (openingStock > 0) {
            await updateStock.mutateAsync({ productId: product.id, quantity: openingStock })
        }

        setRegisterForm({ name: '', code: '', openingStock: '1' })
        setRegisterOpen(false)
    }

    const handleAssetIssue = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!selectedAsset) return

        const quantity = Math.max(1, Math.trunc(Number(issueForm.quantity || 1)))
        const notes = [
            `Asset Code: ${getAssetCode(selectedAsset)}`,
            issueForm.location.trim() ? `Location: ${issueForm.location.trim()}` : '',
            issueForm.assignedTo.trim() ? `Responsible: ${issueForm.assignedTo.trim()}` : '',
            issueForm.notes.trim() ? `Notes: ${issueForm.notes.trim()}` : ''
        ].filter(Boolean).join(' | ')

        await createIssueRequest.mutateAsync({
            productId: selectedAsset.id,
            quantity,
            usageType: `Asset ${issueForm.action}`,
            issuedTo: issueForm.location.trim() || issueForm.assignedTo.trim() || 'Asset Register',
            notes
        })

        setIssueOpen(false)
        setSelectedAsset(null)
    }

    const columns: Column<InventoryProduct>[] = [
        { key: 'sno', header: 'S.No', cell: (_asset, index) => index + 1, sortable: false },
        {
            key: 'name',
            header: 'Asset',
            cell: (asset) => (
                <div className="flex min-w-[260px] items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                        <Boxes className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-extrabold text-slate-950">{asset.name}</p>
                        <p className="text-xs font-semibold text-slate-500">{getAssetCode(asset)}</p>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            key: 'quantity',
            header: 'Count',
            cell: (asset) => <span className="font-extrabold text-slate-900">{Number(stockByProductId.get(asset.id)?.quantity || 0)}</span>
        },
        {
            key: 'status',
            header: 'Asset Status',
            cell: (asset) => {
                const quantity = Number(stockByProductId.get(asset.id)?.quantity || 0)
                const openIssues = openIssuesByProductId.get(asset.id)?.length || 0
                if (openIssues > 0) return <StatusHighlighter value="Issue Open" />
                if (quantity <= 0) return <StatusHighlighter value="Missing / Empty" />
                return <StatusHighlighter value="Available" />
            }
        },
        {
            key: 'lastMovement',
            header: 'Last Movement',
            cell: (asset) => {
                const latest = movementsByProductId.get(asset.id)?.[0]
                return (
                    <div className="min-w-[170px]">
                        <p className="text-sm font-extrabold text-slate-900">{latest?.usageType || latest?.movementType || 'Stock Register'}</p>
                        <p className="text-xs font-semibold text-slate-500">{formatDate(latest?.createdAt || stockByProductId.get(asset.id)?.updatedAt)}</p>
                    </div>
                )
            }
        },
        {
            key: 'location',
            header: 'Location / Holder',
            cell: (asset) => {
                const latest = movementsByProductId.get(asset.id)?.[0]
                const issue = openIssuesByProductId.get(asset.id)?.[0]
                return <span className="text-sm font-semibold text-slate-700">{issue?.issuedTo || latest?.issuedTo || '-'}</span>
            }
        },
        {
            key: 'purchase',
            header: 'Purchase',
            cell: (asset) => {
                const latestPurchase = purchasesByProductId.get(asset.id)?.[0]
                return (
                    <div className="min-w-[150px]">
                        <p className="text-sm font-extrabold text-slate-900">{latestPurchase?.vendor || '-'}</p>
                        <p className="text-xs font-semibold text-slate-500">{formatDate(latestPurchase?.createdAt)}</p>
                    </div>
                )
            }
        },
        {
            key: 'action',
            header: 'Action',
            cell: (asset) => canRequestIssue ? (
                <button
                    type="button"
                    onClick={() => openIssueDrawer(asset)}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-700 transition hover:bg-amber-100"
                >
                    <Wrench className="h-4 w-4" />
                    Issue
                </button>
            ) : (
                <span className="text-xs font-semibold text-slate-400">View Only</span>
            ),
            sortable: false
        }
    ]

    const isSavingAsset = createProduct.isPending || updateStock.isPending

    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                title="Medical Assets"
                subtitle="Live asset register for medical equipment, accountable quantity, movement, and repair or missing issue tracking."
                breadcrumbs={[{ label: 'UHC' }, { label: 'Inventory' }, { label: 'Medical Assets' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{assets.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Asset Types</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sky-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{totalQuantity}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Count</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{assetsWithOpenIssue}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Open Issues</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{lowOrMissingAssets}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Missing / Empty</p>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-xl flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search asset, code, holder, issue..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-primary-400"
                    />
                </div>
                {canCreateProduct && (
                    <button
                        type="button"
                        onClick={() => setRegisterOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F969C] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#294D61]"
                    >
                        <PackagePlus className="h-4 w-4" />
                        Register Asset
                    </button>
                )}
            </div>

            <div className="min-h-[430px] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                <DataTable
                    data={assets}
                    columns={columns}
                    keyExtractor={(asset) => asset.id}
                    isLoading={isProductsLoading || isStockLoading || isIssuesLoading}
                    emptyStateMessage="No live medical assets found. Register the first asset to start tracking."
                />
            </div>

            <Drawer isOpen={registerOpen} onClose={() => setRegisterOpen(false)} title="Register Asset" size="md">
                <form onSubmit={handleRegisterAsset} className="space-y-4">
                    <Input
                        label="Asset Name"
                        required
                        value={registerForm.name}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Oxygen concentrator, wheelchair, BP monitor..."
                    />
                    <Input
                        label="Asset Code / SKU (Optional)"
                        value={registerForm.code}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                        placeholder="e.g. AST-001 or MED-EQ-101"
                    />
                    <Input
                        label="Opening Count"
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={registerForm.openingStock}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, openingStock: event.target.value }))}
                        placeholder="1"
                    />
                    <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                        Uses existing Product and Stock tables. If code is omitted, a unique reference is generated.
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setRegisterOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={isSavingAsset} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            {isSavingAsset ? 'Saving...' : 'Save Asset'}
                        </button>
                    </div>
                </form>
            </Drawer>

            <Drawer isOpen={issueOpen} onClose={() => setIssueOpen(false)} title={selectedAsset ? `Asset Issue - ${selectedAsset.name}` : 'Asset Issue'} size="md">
                <form onSubmit={handleAssetIssue} className="space-y-4">
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Issue Type</span>
                        <select
                            value={issueForm.action}
                            onChange={(event) => setIssueForm((prev) => ({ ...prev, action: event.target.value as AssetAction }))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold"
                        >
                            {(['Repair', 'Damaged', 'Missing', 'Moved'] as AssetAction[]).map((action) => <option key={action} value={action}>{action}</option>)}
                        </select>
                    </label>
                    <Input
                        label="Quantity"
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={issueForm.quantity}
                        onChange={(event) => setIssueForm((prev) => ({ ...prev, quantity: event.target.value }))}
                    />
                    <Input
                        label="Location / Room / Department"
                        value={issueForm.location}
                        onChange={(event) => setIssueForm((prev) => ({ ...prev, location: event.target.value }))}
                        placeholder="Room 204, Nursing, Store..."
                    />
                    <Input
                        label="Responsible Staff / Vendor"
                        value={issueForm.assignedTo}
                        onChange={(event) => setIssueForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
                        placeholder="Staff or technician name..."
                    />
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Issue Notes</span>
                        <textarea
                            value={issueForm.notes}
                            onChange={(event) => setIssueForm((prev) => ({ ...prev, notes: event.target.value }))}
                            placeholder="Problem, warranty hint, repair cost, missing reason..."
                            className="min-h-[110px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold outline-none transition focus:border-primary-400"
                        />
                    </label>
                    <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>This creates a pending stock issue request for approval, so asset accountability is visible before stock count is reduced.</span>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIssueOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createIssueRequest.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            <ClipboardCheck className="h-4 w-4" />
                            {createIssueRequest.isPending ? 'Saving...' : 'Save Issue'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
