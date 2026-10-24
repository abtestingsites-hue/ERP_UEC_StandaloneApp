import { useMemo, useState } from 'react'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { PageHeader } from '../../../components/PageHeader'
import { Select } from '../../../components/Select'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { hasPermissionAccess } from '../../../lib/access'
import { useAuthStore } from '../../../store/authStore'
import { useVendors } from '../../master/services/vendor'
import { useCreateInventoryPurchase, useInventoryStock } from '../hooks/useInventory'
import type { InventoryStock } from '../types'
import { getDefaultInventoryScope, getInventoryScopeLabel, inventoryScopeOptions, stockInScope, type InventoryScope } from '../utils/inventoryScope'

const DEFAULT_FALLBACK_MIN_STOCK = 10

export const getEffectiveThreshold = (item: InventoryStock): number => {
    const minLevel = Number(item.product?.minStockLevel)
    return Number.isFinite(minLevel) && minLevel > 0 ? minLevel : DEFAULT_FALLBACK_MIN_STOCK
}

export function LowStockAlerts() {
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
        quantity: '',
        batchNumber: '',
        expiryDate: ''
    })
    const { data: stock = [], isLoading } = useInventoryStock()
    const { data: vendors = [], isLoading: isVendorsLoading } = useVendors()
    const createPurchase = useCreateInventoryPurchase()

    const lowStockRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return stock
            .filter((item) => stockInScope(item, inventoryScope))
            .filter((item) => Number(item.quantity || 0) <= getEffectiveThreshold(item))
            .filter((item) => !query || [
                item.product?.code || '',
                item.product?.name || '',
                item.product?.category || '',
                item.quantity
            ].some((value) => String(value).toLowerCase().includes(query)))
    }, [inventoryScope, stock, searchQuery])

    const getAlertStatus = (quantity: number) => {
        if (quantity <= 0) return 'Reorder'
        return 'Low'
    }

    const productOptions = useMemo(() => (
        lowStockRows.map((item) => ({
            value: item.productId,
            label: `${item.product?.name || 'Unknown Product'}${item.product?.code ? ` (${item.product.code})` : ''}`,
            isBatchTracked: item.product?.isBatchTracked
        }))
    ), [lowStockRows])

    const vendorOptions = useMemo(() => {
        const activeVendors = vendors.filter((v: any) => v.status !== false)
        const list = activeVendors.map((v: any) => ({
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
            const selected = vendors.find((v: any) => v.id === value)
            setFormData((prev) => ({
                ...prev,
                vendorId: value,
                isCustomVendor: false,
                vendor: selected?.name || ''
            }))
        }
    }

    const openPurchaseDrawer = (productId = '') => {
        if (!canCreatePurchase) return
        setFormData({ productId, vendorId: '', vendor: '', isCustomVendor: false, quantity: '', batchNumber: '', expiryDate: '' })
        setDrawerOpen(true)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const quantity = Math.trunc(Number(formData.quantity || 0))
        const vendor = formData.vendor.trim()
        if (!formData.productId || !vendor || quantity <= 0) return

        await createPurchase.mutateAsync({
            productId: formData.productId,
            vendor,
            vendorId: formData.vendorId ? formData.vendorId : undefined,
            quantity,
            batchNumber: formData.batchNumber || null,
            expiryDate: formData.expiryDate || null
        })

        setFormData({ productId: '', vendorId: '', vendor: '', isCustomVendor: false, quantity: '', batchNumber: '', expiryDate: '' })
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
        {
            key: 'category',
            header: 'Category',
            cell: (item) => item.product?.category || '-'
        },
        { key: 'quantity', header: 'Qty', sortable: true },
        {
            key: 'threshold',
            header: 'Min Threshold',
            cell: (item) => {
                const hasCustomMin = Number(item.product?.minStockLevel || 0) > 0
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{getEffectiveThreshold(item)}</span>
                        <span className={`text-[10px] font-semibold ${hasCustomMin ? 'text-primary-600' : 'text-amber-500'}`}>
                            {hasCustomMin ? '(Product)' : '(Default)'}
                        </span>
                    </div>
                )
            }
        },
        {
            key: 'status',
            header: 'Status',
            cell: (item) => <StatusHighlighter value={getAlertStatus(Number(item.quantity || 0))} />
        },
        {
            key: 'purchaseAction',
            header: 'Action',
            cell: (item) => canCreatePurchase ? (
                <button
                    type="button"
                    onClick={() => openPurchaseDrawer(item.productId)}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100"
                >
                    Create Purchase
                </button>
            ) : (
                <span className="text-xs font-semibold text-gray-400">View Only</span>
            )
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Low Stock Alerts"
                subtitle={`Live ${getInventoryScopeLabel(inventoryScope).toLowerCase()} stock alerts calculated from current inventory quantities.`}
                breadcrumbs={[{ label: 'Inventory' }, { label: 'Low Stock Alerts' }]}
            />

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
                searchPlaceholder="Search low stock by product or category..."
            />

            <DataTable
                data={lowStockRows}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading || isVendorsLoading}
                emptyStateMessage="No live low stock alerts"
            />

            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Create Purchase"
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Product"
                        required
                        value={formData.productId}
                        onChange={(event) => setFormData((prev) => ({ ...prev, productId: event.target.value }))}
                        options={productOptions}
                        placeholder={productOptions.length ? 'Select low stock product' : 'No low stock products'}
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
                        label="Purchase Quantity"
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={formData.quantity}
                        onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                        placeholder="Enter quantity to purchase"
                    />
                    
                    {productOptions.find((p) => p.value === formData.productId)?.isBatchTracked ? (
                        <>
                            <Input
                                label="Batch Number"
                                required
                                value={formData.batchNumber}
                                onChange={(event) => setFormData((prev) => ({ ...prev, batchNumber: event.target.value }))}
                                placeholder="Enter batch number"
                            />
                            <Input
                                label="Expiry Date"
                                required
                                type="date"
                                value={formData.expiryDate}
                                onChange={(event) => setFormData((prev) => ({ ...prev, expiryDate: event.target.value }))}
                            />
                        </>
                    ) : null}

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                        Saving this purchase will increase live stock and remove the item from low-stock alerts once quantity is above threshold.
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
                            disabled={createPurchase.isPending || productOptions.length === 0}
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
