import { InventoryCategoryProducts } from './InventoryCategoryProducts'

export function StationaryProducts() {
    return (
        <InventoryCategoryProducts
            category="stationary"
            categoryLabel="Stationary"
            title="Stationary Products"
            subtitle="Live stationary product master and opening stock for inventory tracking."
            addLabel="Add Stationary Product"
            productHeader="Stationary Product"
            searchPlaceholder="Search stationary product..."
            emptyStateMessage="No live stationary products found"
            breadcrumbs={[{ label: 'UEC' }, { label: 'Inventory' }, { label: 'Stationary Products' }]}
            placeholder="Notebook, pen, files..."
        />
    )
}
