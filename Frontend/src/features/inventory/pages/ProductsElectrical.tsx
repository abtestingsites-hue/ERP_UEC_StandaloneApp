import { InventoryCategoryProducts } from './InventoryCategoryProducts'

export function ElectricalPlumbingProducts() {
    return (
        <InventoryCategoryProducts
            category="electrical-plumbing"
            categoryLabel="Electrical & Plumbing"
            title="Electrical & Plumbing"
            subtitle="Live electrical and plumbing product master with opening stock."
            addLabel="Add Electrical / Plumbing Product"
            productHeader="Electrical / Plumbing Product"
            searchPlaceholder="Search electrical or plumbing product..."
            emptyStateMessage="No live electrical or plumbing products found"
            breadcrumbs={[{ label: 'UEC' }, { label: 'Inventory' }, { label: 'Electrical & Plumbing' }]}
            placeholder="Bulb, wire, pipe, valve..."
        />
    )
}
