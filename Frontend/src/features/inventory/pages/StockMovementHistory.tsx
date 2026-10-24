import { useMemo, useState } from 'react'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { Select } from '../../../components/Select'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useAuthStore } from '../../../store/authStore'
import { useInventoryStockMovements } from '../hooks/useInventory'
import type { InventoryStockMovement } from '../types'
import { getDefaultInventoryScope, getInventoryScopeLabel, inventoryScopeOptions, movementInScope, type InventoryScope } from '../utils/inventoryScope'

const movementLabels: Record<InventoryStockMovement['movementType'], string> = {
    STOCK_IN: 'Stock In',
    STOCK_OUT: 'Stock Out',
    PURCHASE: 'Purchase',
    CURRENT_STOCK: 'Current Stock'
}

export function StockMovementHistory() {
    const [searchQuery, setSearchQuery] = useState('')
    const user = useAuthStore((state) => state.user)
    const [inventoryScope, setInventoryScope] = useState<InventoryScope>(() => getDefaultInventoryScope(user))
    const { data: movements = [], isLoading } = useInventoryStockMovements()

    const visibleMovements = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return movements.filter((movement) => movementInScope(movement, inventoryScope)).filter((movement) => !query || [
            movement.product?.code || '',
            movement.product?.name || '',
            movement.product?.category || '',
            movementLabels[movement.movementType],
            movement.vendor || '',
            movement.usageType || '',
            movement.issuedTo || '',
            movement.notes || '',
            movement.updatedBy,
            movement.quantity,
            movement.createdAt
        ].some((value) => String(value).toLowerCase().includes(query)))
    }, [inventoryScope, movements, searchQuery])

    const columns: Column<InventoryStockMovement>[] = [
        { key: 'sno', header: 'S.No', cell: (_item, index) => index + 1, sortable: false },
        {
            key: 'product',
            header: 'Product',
            cell: (movement) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 dark:text-gray-100">{movement.product?.name || 'Unknown Product'}</span>
                        {movement.product?.code && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                                {movement.product.code}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{movement.product?.category || '-'}</span>
                </div>
            )
        },
        {
            key: 'movementType',
            header: 'Movement',
            cell: (movement) => <StatusHighlighter value={movementLabels[movement.movementType]} />
        },
        {
            key: 'quantity',
            header: 'Quantity',
            sortable: true,
            cell: (movement) => (
                <span className={movement.signedQuantity < 0 ? 'font-extrabold text-rose-600' : 'font-extrabold text-emerald-700'}>
                    {movement.movementType === 'CURRENT_STOCK' ? '' : movement.signedQuantity < 0 ? '-' : '+'}{movement.quantity}
                </span>
            )
        },
        {
            key: 'balanceAfter',
            header: 'Balance After',
            sortable: true,
            cell: (movement) => movement.balanceAfter != null ? (
                <span className="font-semibold text-gray-800 dark:text-gray-200">{movement.balanceAfter}</span>
            ) : '-'
        },
        {
            key: 'reference',
            header: 'Reference',
            cell: (movement) => {
                if (movement.vendor) return `Vendor: ${movement.vendor}`
                if (movement.usageType || movement.issuedTo || movement.notes) {
                    return [movement.usageType, movement.issuedTo, movement.notes].filter(Boolean).join(' - ')
                }
                if (movement.movementType === 'CURRENT_STOCK') return 'Current live stock balance'
                return 'Manual stock update'
            }
        },
        { key: 'updatedBy', header: 'Updated By', sortable: true },
        {
            key: 'createdAt',
            header: 'Date',
            sortable: true,
            cell: (movement) => movement.createdAt ? new Date(movement.createdAt).toLocaleString('en-GB') : '-'
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Stock Movement History"
                subtitle={`Live audit trail for ${getInventoryScopeLabel(inventoryScope).toLowerCase()} stock in, stock out, and purchase movements.`}
                breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Movement History' }]}
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
                searchPlaceholder="Search movements by product, type, vendor, or user..."
            />

            <DataTable
                data={visibleMovements}
                columns={columns}
                keyExtractor={(movement) => movement.id}
                isLoading={isLoading}
                emptyStateMessage="No stock movement history found"
            />
        </div>
    )
}
