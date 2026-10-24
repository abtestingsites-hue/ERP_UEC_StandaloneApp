import { useMemo, useState } from 'react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { PageHeader } from '../../../components/PageHeader'
import { Select } from '../../../components/Select'
import { hasPermissionAccess } from '../../../lib/access'
import { useAuthStore } from '../../../store/authStore'
import { useVendors } from '../../master/services/vendor'
import { useCreateInventoryPurchase, useInventoryProducts, useInventoryPurchases } from '../hooks/useInventory'
import type { InventoryPurchase } from '../types'
import { getDefaultInventoryScope, getInventoryScopeLabel, inventoryScopeOptions, productInScope, purchaseInScope, type InventoryScope } from '../utils/inventoryScope'

export function PurchaseOrders() {
    const [searchQuery, setSearchQuery] = useState('')
    const user = useAuthStore((state) => state.user)
    const canCreatePurchase = hasPermissionAccess(user, ['Purchase Orders', 'Purchases', 'Create Purchases', 'Inventory Purchases'])
    const [inventoryScope, setInventoryScope] = useState<InventoryScope>(() => getDefaultInventoryScope(user))
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({
        productId: '',
        vendorId: '',
        vendor: '',
        isCustomVendor: false,
        quantity: ''
    })
    const { data: products = [], isLoading: isProductsLoading } = useInventoryProducts()
    const { data: purchases = [], isLoading: isPurchasesLoading } = useInventoryPurchases()
    const { data: vendors = [], isLoading: isVendorsLoading } = useVendors()
    const createPurchase = useCreateInventoryPurchase()

    const scopedProducts = useMemo(() => products.filter((product) => productInScope(product, inventoryScope)), [inventoryScope, products])

    const productOptions = useMemo(() => (
        scopedProducts.map((product) => ({
            value: product.id,
            label: `${product.code ? `[${product.code}] ` : ''}${product.name} (${product.category})`
        }))
    ), [scopedProducts])

    const vendorOptions = useMemo(() => {
        const activeVendors = vendors.filter((v) => v.status !== false)
        const list = activeVendors.map((v) => ({
            value: v.id,
            label: `${v.name || 'Unnamed Vendor'} (${v.code || 'Vendor'}${v.category ? ` - ${v.category}` : ''})`
        }))
        return [
            ...list,
            { value: '__custom__', label: '+ Other / Enter Vendor Name Manually' }
        ]
    }, [vendors])

    const handleVendorChange = (value: string) => {
        if (value === '__custom__') {
            setFormData((prev) => ({ ...prev, vendorId: '', isCustomVendor: true, vendor: '' }))
        } else {
            const selected = vendors.find((v) => v.id === value)
            setFormData((prev) => ({
                ...prev,
                vendorId: value,
                isCustomVendor: false,
                vendor: selected?.name || ''
            }))
        }
    }

    const visiblePurchases = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return purchases.filter((purchase) => purchaseInScope(purchase, inventoryScope)).filter((purchase) => !query || [
            purchase.product?.code || '',
            purchase.product?.name || '',
            purchase.product?.category || '',
            purchase.vendor || '',
            purchase.Vendor?.name || '',
            purchase.Vendor?.code || '',
            purchase.quantity,
            purchase.createdAt
        ].some((value) => String(value).toLowerCase().includes(query)))
    }, [inventoryScope, purchases, searchQuery])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const quantity = Math.trunc(Number(formData.quantity || 0))
        const vendorName = formData.vendor.trim()
        if (!formData.productId || !vendorName || quantity <= 0) return

        await createPurchase.mutateAsync({
            productId: formData.productId,
            vendor: vendorName,
            vendorId: formData.vendorId ? formData.vendorId : undefined,
            quantity
        })

        setFormData({ productId: '', vendorId: '', vendor: '', isCustomVendor: false, quantity: '' })
        setDrawerOpen(false)
    }

    const columns: Column<InventoryPurchase>[] = [
        { key: 'sno', header: 'S.No', cell: (_item, index) => index + 1, sortable: false },
        {
            key: 'product',
            header: 'Product',
            cell: (purchase) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 dark:text-gray-100">{purchase.product?.name || 'Unknown Product'}</span>
                        {purchase.product?.code && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                                {purchase.product.code}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{purchase.product?.category || '-'}</span>
                </div>
            )
        },
        {
            key: 'vendor',
            header: 'Vendor',
            sortable: true,
            cell: (purchase) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {purchase.Vendor?.name || purchase.vendor}
                    </span>
                    {purchase.Vendor?.code && (
                        <span className="text-[11px] font-mono text-gray-400">
                            Master: {purchase.Vendor.code}
                        </span>
                    )}
                </div>
            )
        },
        { key: 'quantity', header: 'Purchased Qty', sortable: true },
        {
            key: 'createdAt',
            header: 'Purchase Date',
            cell: (purchase) => purchase.createdAt ? new Date(purchase.createdAt).toLocaleString('en-GB') : '-'
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Purchase Orders"
                subtitle={`Live ${getInventoryScopeLabel(inventoryScope).toLowerCase()} purchase entries. Each purchase automatically increases product stock.`}
                breadcrumbs={[{ label: 'Inventory' }, { label: 'Purchase Orders' }]}
            />

            <ActionBar onAdd={canCreatePurchase ? () => setDrawerOpen(true) : undefined} addLabel="Add Purchase" />

            <div className="mb-4 max-w-xs">
                <Select
                    label="Inventory Scope"
                    value={inventoryScope}
                    onChange={(event) => setInventoryScope(event.target.value as InventoryScope)}
                    options={inventoryScopeOptions}
                />
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search purchase by product, vendor, or category..."
            />

            <DataTable
                data={visiblePurchases}
                columns={columns}
                keyExtractor={(purchase) => purchase.id}
                isLoading={isPurchasesLoading || isProductsLoading || isVendorsLoading}
                emptyStateMessage="No live purchase entries found"
            />

            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Add Purchase"
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

                    {vendorOptions.length > 1 ? (
                        <div>
                            <Select
                                label="Vendor (from Master)"
                                required={!formData.isCustomVendor}
                                value={formData.isCustomVendor ? '__custom__' : formData.vendorId}
                                onChange={(event) => handleVendorChange(event.target.value)}
                                options={vendorOptions}
                                placeholder="Select registered vendor"
                            />
                            {formData.isCustomVendor && (
                                <div className="mt-2">
                                    <Input
                                        label="Manual Vendor Name"
                                        required
                                        value={formData.vendor}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, vendor: event.target.value }))}
                                        placeholder="Enter vendor or shop name"
                                    />
                                </div>
                            )}
                            {!formData.isCustomVendor && formData.vendor && (
                                <p className="mt-1 text-xs font-semibold text-emerald-700">
                                    Linked to Master: {formData.vendor}
                                </p>
                            )}
                        </div>
                    ) : (
                        <Input
                            label="Vendor"
                            required
                            value={formData.vendor}
                            onChange={(event) => setFormData((prev) => ({ ...prev, vendor: event.target.value }))}
                            placeholder="Vendor or shop name"
                        />
                    )}

                    <Input
                        label="Quantity"
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={formData.quantity}
                        onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                        placeholder="Purchased quantity"
                    />

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                        Saving this purchase will automatically increase the selected product stock.
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
                            disabled={createPurchase.isPending || productOptions.length === 0 || !formData.vendor.trim()}
                            className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#294D61] disabled:opacity-60"
                        >
                            {createPurchase.isPending ? 'Saving...' : 'Save Purchase'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
