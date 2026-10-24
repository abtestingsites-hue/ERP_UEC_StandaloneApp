import { useMemo, useState } from 'react'
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
import { useInventoryProducts, useInventoryStock, useUpdateInventoryStock } from '../hooks/useInventory'
import type { InventoryStock } from '../types'
import { getDefaultInventoryScope, getInventoryScopeLabel, inventoryScopeOptions, productInScope, stockInScope, type InventoryScope } from '../utils/inventoryScope'

const lowStockThreshold = 10

const stockModeOptions = [
    { value: 'IN', label: 'Stock In' },
    { value: 'OUT', label: 'Stock Out' }
]

export function StockManagement() {
    const [searchQuery, setSearchQuery] = useState('')
    const user = useAuthStore((state) => state.user)
    const canUpdateStock = hasPermissionAccess(user, ['Stock', 'Update Stock', 'Inventory Stock'])
    const [inventoryScope, setInventoryScope] = useState<InventoryScope>(() => getDefaultInventoryScope(user))
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({
        productId: '',
        mode: 'IN',
        quantity: '',
        referenceNo: '',
        storageLocation: '',
        issuedTo: '',
        usageType: '',
        notes: ''
    })
    const { data: products = [], isLoading: isProductsLoading } = useInventoryProducts()
    const { data: stock = [], isLoading: isStockLoading } = useInventoryStock()
    const updateStock = useUpdateInventoryStock()

    const scopedProducts = useMemo(() => (
        products.filter((product) => productInScope(product, inventoryScope))
    ), [inventoryScope, products])

    const scopedStock = useMemo(() => (
        stock.filter((item) => stockInScope(item, inventoryScope))
    ), [inventoryScope, stock])

    const productOptions = useMemo(() => (
        scopedProducts.map((product) => ({
            value: product.id,
            label: `${product.name} (${product.category})`
        }))
    ), [scopedProducts])

    const visibleStock = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return scopedStock.filter((item) => {
            const product = item.product
            return !query || [
                product?.name || '',
                product?.code || '',
                product?.name || '',
                product?.category || '',
                item.quantity,
                item.updatedAt
            ].some((value) => String(value).toLowerCase().includes(query))
        })
    }, [scopedStock, searchQuery])

    const getProductMinThreshold = (item: InventoryStock) => {
        const minLevel = Number(item.product?.minStockLevel)
        return Number.isFinite(minLevel) && minLevel > 0 ? minLevel : lowStockThreshold
    }

    const stockSummary = useMemo(() => {
        const totalItems = scopedStock.length
        const lowStock = scopedStock.filter((item) => {
            const threshold = getProductMinThreshold(item)
            const qty = Number(item.quantity || 0)
            return qty > 0 && qty <= threshold
        }).length
        const outOfStock = scopedStock.filter((item) => Number(item.quantity || 0) <= 0).length
        const available = scopedStock.filter((item) => {
            const threshold = getProductMinThreshold(item)
            return Number(item.quantity || 0) > threshold
        }).length

        return { totalItems, available, lowStock, outOfStock }
    }, [scopedStock])

    const getStockStatus = (item: InventoryStock) => {
        const qty = Number(item.quantity || 0)
        const threshold = getProductMinThreshold(item)
        if (qty <= 0) return 'Out of Stock'
        if (qty <= threshold) return 'Low Stock'
        return 'Available'
    }

    const openStockDrawer = (mode: 'IN' | 'OUT' = 'IN', productId = '') => {
        if (!canUpdateStock) return
        setFormData({
            productId,
            mode,
            quantity: '',
            referenceNo: '',
            storageLocation: '',
            issuedTo: '',
            usageType: mode === 'OUT' ? 'Department Use' : 'Stock Receipt',
            notes: ''
        })
        setDrawerOpen(true)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const quantity = Math.trunc(Number(formData.quantity || 0))
        if (!formData.productId || quantity <= 0) return

        const traceNotes = [
            formData.referenceNo ? `Reference/Bill: ${formData.referenceNo}` : '',
            formData.storageLocation ? `Storage/Location: ${formData.storageLocation}` : '',
            formData.issuedTo ? `${formData.mode === 'OUT' ? 'Issued To' : 'Received From'}: ${formData.issuedTo}` : '',
            formData.notes ? `Notes: ${formData.notes}` : ''
        ].filter(Boolean).join(' | ')

        await updateStock.mutateAsync({
            productId: formData.productId,
            quantity: formData.mode === 'OUT' ? -quantity : quantity,
            usageType: formData.usageType || (formData.mode === 'OUT' ? 'Department Use' : 'Stock Receipt'),
            issuedTo: formData.mode === 'OUT' ? formData.issuedTo || undefined : undefined,
            notes: traceNotes || undefined
        })

        setFormData({
            productId: '',
            mode: 'IN',
            quantity: '',
            referenceNo: '',
            storageLocation: '',
            issuedTo: '',
            usageType: '',
            notes: ''
        })
        setDrawerOpen(false)
    }

    const columns: Column<InventoryStock>[] = [
        { key: 'sno', header: 'S.No', cell: (_item, index) => index + 1, sortable: false },
        {
            key: 'product',
            header: 'Product',
            cell: (item) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 dark:text-gray-100">{item.product?.name || 'Unknown Product'}</span>
                        {item.product?.code && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {item.product.code}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{item.product?.category || '-'}</span>
                </div>
            )
        },
        { key: 'quantity', header: 'Current Stock', sortable: true },
        {
            key: 'status',
            header: 'Stock Status',
            cell: (item) => <StatusHighlighter value={getStockStatus(item)} />
        },
        {
            key: 'updatedAt',
            header: 'Last Updated',
            cell: (item) => item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-GB') : '-'
        },
        {
            key: 'stockAction',
            header: 'Stock Action',
            cell: (item) => canUpdateStock ? (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => openStockDrawer('IN', item.productId)}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100"
                    >
                        Stock In
                    </button>
                    <button
                        type="button"
                        onClick={() => openStockDrawer('OUT', item.productId)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100"
                    >
                        Stock Out
                    </button>
                </div>
            ) : (
                <span className="text-xs font-semibold text-gray-400">View Only</span>
            )
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Stock"
                subtitle={`Live stock quantity for ${getInventoryScopeLabel(inventoryScope).toLowerCase()} in the selected unit.`}
                breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock' }]}
            />

            <ActionBar onAdd={canUpdateStock ? () => openStockDrawer('IN') : undefined} addLabel="Stock In / Out" />

            <div className="mb-4 max-w-xs">
                <Select
                    label="Inventory Scope"
                    value={inventoryScope}
                    onChange={(event) => setInventoryScope(event.target.value as InventoryScope)}
                    options={inventoryScopeOptions}
                />
            </div>

            <section className="mb-4 grid gap-3 md:grid-cols-4">
                {[
                    { label: 'Stock Records', value: stockSummary.totalItems },
                    { label: 'Available', value: stockSummary.available },
                    { label: 'Low Stock', value: stockSummary.lowStock },
                    { label: 'Out of Stock', value: stockSummary.outOfStock }
                ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-black">
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500">{item.label}</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-gray-100">{item.value}</p>
                    </div>
                ))}
            </section>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search stock by product or category..."
            />

            <DataTable
                data={visibleStock}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isStockLoading || isProductsLoading}
                emptyStateMessage="No live stock records found"
            />

            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Update Stock"
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Product"
                        required
                        value={formData.productId}
                        onChange={(event) => setFormData((prev) => ({ ...prev, productId: event.target.value }))}
                        options={productOptions}
                        placeholder={productOptions.length ? 'Select product' : 'Create a product first'}
                    />
                    <Select
                        label="Movement"
                        required
                        value={formData.mode}
                        onChange={(event) => setFormData((prev) => ({ ...prev, mode: event.target.value }))}
                        options={stockModeOptions}
                    />
                    <Input
                        label="Quantity"
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={formData.quantity}
                        onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                        placeholder="Enter quantity"
                    />
                    <Input
                        label="Bill / Reference No."
                        value={formData.referenceNo}
                        onChange={(event) => setFormData((prev) => ({ ...prev, referenceNo: event.target.value }))}
                        placeholder="Bill no., invoice no., gate pass, or manual ref"
                    />
                    <Input
                        label="Storage / Location"
                        value={formData.storageLocation}
                        onChange={(event) => setFormData((prev) => ({ ...prev, storageLocation: event.target.value }))}
                        placeholder="Store room, nursing station, room no., shelf"
                    />
                    <Input
                        label={formData.mode === 'OUT' ? 'Issued To / Department' : 'Received From / Vendor'}
                        value={formData.issuedTo}
                        onChange={(event) => setFormData((prev) => ({ ...prev, issuedTo: event.target.value }))}
                        placeholder={formData.mode === 'OUT' ? 'Kitchen, nursing, patient, staff...' : 'Vendor, family, pharmacy...'}
                    />
                    <Select
                        label="Purpose"
                        value={formData.usageType}
                        onChange={(event) => setFormData((prev) => ({ ...prev, usageType: event.target.value }))}
                        options={formData.mode === 'OUT'
                            ? [
                                { value: 'Department Use', label: 'Department Use' },
                                { value: 'Patient Use', label: 'Patient Use' },
                                { value: 'Damage / Breakage', label: 'Damage / Breakage' },
                                { value: 'Transfer', label: 'Transfer' },
                                { value: 'Maintenance', label: 'Maintenance' }
                            ]
                            : [
                                { value: 'Stock Receipt', label: 'Stock Receipt' },
                                { value: 'Purchase', label: 'Purchase' },
                                { value: 'Family Supplied', label: 'Family Supplied' },
                                { value: 'Vendor Supplied', label: 'Vendor Supplied' },
                                { value: 'Opening Adjustment', label: 'Opening Adjustment' }
                            ]}
                    />
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-black dark:text-gray-100"
                            placeholder="Quantity verification, bill scanned, condition, warranty, or handover notes"
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
                            disabled={updateStock.isPending || productOptions.length === 0}
                            className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#294D61] disabled:opacity-60"
                        >
                            {updateStock.isPending ? 'Saving...' : 'Save Stock'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
