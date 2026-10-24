import { useEffect, useState, useCallback } from 'react';
import {
    Package,
    Plus,
    Search,
    Filter,
    Edit2,
    ToggleLeft,
    ToggleRight,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    X,
    Eye
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type {
    InventoryProduct,
    CreateProductPayload,
    UpdateProductPayload
} from '../inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { useInventoryDomain } from '../../../context/useInventoryDomain';

export function ProductMasterTab() {
    const { activeUnitId } = useActiveUnit();
    const { activeDomain, domainConfig } = useInventoryDomain();

    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('ALL');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
    const [viewingProduct, setViewingProduct] = useState<InventoryProduct | null>(null);

    // Form states
    const [formData, setFormData] = useState<CreateProductPayload>({
        name: '',
        code: '',
        sku: '',
        productCode: '',
        category: activeDomain === 'medical' ? 'Medicines' : 'Ration',
        description: '',
        unit: 'Nos',
        unitOfMeasure: 'Nos',
        unitCost: 0,
        defaultRevenuePrice: 0,
        minStockLevel: 10,
        reorderLevel: 10,
        chargeableInCareRevenue: false,
        isBatchTracked: false
    });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Adjust category filter when domain changes
    const [prevDomain, setPrevDomain] = useState(activeDomain);
    if (prevDomain !== activeDomain) {
        setPrevDomain(activeDomain);
        setCategory('ALL');
    }

    const fetchProducts = useCallback(async () => {
        try {
            const data = await inventoryService.getProducts({
                unitId: activeUnitId,
                allUnits: activeUnitId === null,
                domain: activeDomain,
                category: category !== 'ALL' ? category : undefined,
                search: search || undefined
            });
            setProducts(data);
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load products:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load products';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, activeDomain, category, search]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchProducts();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchProducts]);

    const handleRefresh = () => {
        setIsLoading(true);
        void fetchProducts();
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        void fetchProducts();
    };

    const handleToggleStatus = async (product: InventoryProduct) => {
        try {
            setError(null);
            const newStatus = !product.status;
            await inventoryService.updateProductStatus(product.id, newStatus);
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
            setSuccessMessage(`Product "${product.name}" status updated to ${newStatus ? 'Active' : 'Inactive'}.`);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            console.error('Failed to toggle product status:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to update product status';
            setError(message);
        }
    };

    const openCreateModal = () => {
        setFormData({
            name: '',
            code: '',
            sku: '',
            productCode: '',
            category: activeDomain === 'medical' ? 'Medicines' : 'Ration',
            description: '',
            unit: 'Nos',
            unitOfMeasure: 'Nos',
            unitCost: 0,
            defaultRevenuePrice: 0,
            minStockLevel: 10,
            reorderLevel: 10,
            chargeableInCareRevenue: false,
            isBatchTracked: false
        });
        setFormError(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (product: InventoryProduct) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            code: product.code || product.productCode || '',
            sku: product.sku || '',
            productCode: product.code || product.productCode || '',
            category: product.category || (activeDomain === 'medical' ? 'Medicines' : 'Ration'),
            description: product.description || '',
            unit: product.unit || product.unitOfMeasure || 'Nos',
            unitOfMeasure: product.unit || product.unitOfMeasure || 'Nos',
            unitCost: product.defaultRevenuePrice || product.unitCost || 0,
            defaultRevenuePrice: product.defaultRevenuePrice || product.unitCost || 0,
            minStockLevel: product.minStockLevel || product.reorderLevel || 10,
            reorderLevel: product.minStockLevel || product.reorderLevel || 10,
            chargeableInCareRevenue: Boolean(product.chargeableInCareRevenue),
            isBatchTracked: Boolean(product.isBatchTracked)
        });
        setFormError(null);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError('Product name is required.');
            return;
        }

        setFormSubmitting(true);
        setFormError(null);
        try {
            await inventoryService.createProduct({
                name: formData.name.trim(),
                code: (formData.code || formData.productCode || '').trim() || undefined,
                category: formData.category,
                unit: formData.unit || formData.unitOfMeasure || 'Nos',
                unitOfMeasure: formData.unit || formData.unitOfMeasure || 'Nos',
                minStockLevel: Number(formData.minStockLevel ?? formData.reorderLevel) || 0,
                defaultRevenuePrice: Number(formData.defaultRevenuePrice ?? formData.unitCost) || 0,
                chargeableInCareRevenue: Boolean(formData.chargeableInCareRevenue),
                isBatchTracked: Boolean(formData.isBatchTracked)
            }, activeDomain);
            setIsCreateModalOpen(false);
            setSuccessMessage(`Product "${formData.name}" created successfully.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            void fetchProducts();
        } catch (err: unknown) {
            console.error('Failed to create product:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to create product.';
            if (message.includes('already exists for this tenant')) {
                setFormError(`Product code "${formData.code}" is already in use by another product in this organization. Please use a unique product code.`);
            } else {
                setFormError(message);
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        if (!formData.name.trim()) {
            setFormError('Product name is required.');
            return;
        }

        setFormSubmitting(true);
        setFormError(null);
        try {
            const updatePayload: UpdateProductPayload = {
                name: formData.name.trim(),
                code: (formData.code || formData.productCode || '').trim() || undefined,
                category: formData.category,
                unit: formData.unit || formData.unitOfMeasure || 'Nos',
                minStockLevel: Number(formData.minStockLevel ?? formData.reorderLevel) || 0,
                defaultRevenuePrice: Number(formData.defaultRevenuePrice ?? formData.unitCost) || 0,
                chargeableInCareRevenue: Boolean(formData.chargeableInCareRevenue),
                isBatchTracked: Boolean(formData.isBatchTracked)
            };
            await inventoryService.updateProduct(editingProduct.id, updatePayload, activeDomain);
            setEditingProduct(null);
            setSuccessMessage(`Product "${formData.name}" updated successfully.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            void fetchProducts();
        } catch (err: unknown) {
            console.error('Failed to update product:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to update product.';
            if (message.includes('already exists for this tenant')) {
                setFormError(`Product code "${formData.code}" is already in use by another product in this organization. Please use a unique product code.`);
            } else {
                setFormError(message);
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    const domainCategories = activeDomain === 'medical'
        ? ['ALL', 'Medicines', 'Medical Supplies', 'Clinical Consumables']
        : ['ALL', 'Ration', 'Fresh Food', 'Food & Ration', 'Kitchen Supplies'];

    const formCategories = activeDomain === 'medical'
        ? ['Medicines', 'Medical Supplies', 'Clinical Consumables']
        : ['Ration', 'Fresh Food', 'Food & Ration', 'Kitchen Supplies'];

    return (
        <div className="inventory-tab-content">
            <div className="overview-toolbar">
                <div>
                    <span className="section-kicker">{domainConfig.label.toUpperCase()} · CATALOG</span>
                    <h2>Product Master</h2>
                </div>
                <div className="toolbar-actions">
                    <button
                        className="inv-btn inv-btn--primary"
                        onClick={openCreateModal}
                    >
                        <Plus size={15} />
                        <span>Add Product</span>
                    </button>
                    <button
                        className="inv-btn inv-btn--secondary"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title="Reload Products"
                    >
                        <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="inv-alert inv-alert--success" role="alert">
                    <CheckCircle2 size={16} />
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="inv-alert inv-alert--danger" role="alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Filters Bar */}
            <div className="inv-filters-bar">
                <form className="inv-search-form" onSubmit={handleSearchSubmit}>
                    <Search size={15} className="inv-search-icon" />
                    <input
                        type="search"
                        className="inv-search-input"
                        placeholder="Search by product name, SKU, or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="inv-btn inv-btn--secondary inv-btn--sm">
                        Search
                    </button>
                </form>

                <div className="inv-filter-group">
                    <Filter size={14} className="inv-filter-icon" />
                    <label htmlFor="prod-cat-select" className="sr-only">Filter category</label>
                    <select
                        id="prod-cat-select"
                        className="inv-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {domainCategories.map((c) => (
                            <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="inv-card">
                {isLoading ? (
                    <div className="inv-loading-state">
                        <RefreshCw size={24} className="spin-animation" />
                        <p>Loading products catalog...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="inv-empty-state">
                        <Package size={32} />
                        <h4>No products found</h4>
                        <p>Adjust your search criteria or register a new product.</p>
                    </div>
                ) : (
                    <div className="inv-table-responsive">
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Code / Unit</th>
                                    <th>Category</th>
                                    <th>Unit Price</th>
                                    <th>Min Stock</th>
                                    <th>Batch Tracked</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="inv-product-cell">
                                                <strong>{p.name}</strong>
                                                <span className="inv-subtext">ID: {p.id.slice(0, 8)}...</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div><strong>{p.code || p.productCode || p.sku || '—'}</strong></div>
                                            <small className="inv-subtext">Unit: {p.unit || p.unitOfMeasure || 'Nos'}</small>
                                        </td>
                                        <td>
                                            <span className="inv-category-pill">{p.category || 'General'}</span>
                                        </td>
                                        <td>
                                            {p.defaultRevenuePrice !== null && p.defaultRevenuePrice !== undefined && p.defaultRevenuePrice > 0 ? (
                                                `₹${Number(p.defaultRevenuePrice).toFixed(2)}`
                                            ) : p.unitCost !== null && p.unitCost !== undefined && p.unitCost > 0 ? (
                                                `₹${Number(p.unitCost).toFixed(2)}`
                                            ) : (
                                                <span className="inv-cost-missing">Missing Price</span>
                                            )}
                                        </td>
                                        <td>{p.minStockLevel ?? p.reorderLevel ?? 0} {p.unit || 'Nos'}</td>
                                        <td>
                                            <span className={`inv-badge inv-badge--${p.isBatchTracked ? 'info' : 'neutral'}`}>
                                                {p.isBatchTracked ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`inv-badge inv-badge--${p.status ? 'success' : 'danger'}`}>
                                                {p.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="inv-table-actions">
                                                <button
                                                    className="inv-icon-btn"
                                                    onClick={() => setViewingProduct(p)}
                                                    title="View Product Specifications"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    className="inv-icon-btn"
                                                    onClick={() => openEditModal(p)}
                                                    title="Edit Product"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className={`inv-icon-btn ${p.status ? 'inv-icon-btn--danger' : 'inv-icon-btn--success'}`}
                                                    onClick={() => handleToggleStatus(p)}
                                                    title={p.status ? 'Deactivate Product' : 'Activate Product'}
                                                >
                                                    {p.status ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Product Modal */}
            {isCreateModalOpen && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">NEW CATALOG ITEM</span>
                                <h3>Create Product</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setIsCreateModalOpen(false)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {formError && (
                            <div className="inv-alert inv-alert--danger" role="alert">
                                <AlertCircle size={15} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form className="inv-modal-form" onSubmit={handleCreateSubmit}>
                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label>Product Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Paracetamol 500mg"
                                    />
                                </div>
                                <div className="inv-form-group">
                                    <label>Product Code (Unique ID)</label>
                                    <input
                                        type="text"
                                        value={formData.code || ''}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. MED-PCM-500"
                                    />
                                    <small className="inv-subtext">Tenant-wide unique identifier</small>
                                </div>
                                <div className="inv-form-group">
                                    <label>Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {formCategories.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="inv-form-group">
                                    <label>Unit of Measure *</label>
                                    <select
                                        value={formData.unit || 'Nos'}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value, unitOfMeasure: e.target.value })}
                                    >
                                        <option value="Nos">Nos (Count)</option>
                                        <option value="Units">Units</option>
                                        <option value="Strips">Strips</option>
                                        <option value="Bottles">Bottles</option>
                                        <option value="Packs">Packs</option>
                                        <option value="Bags">Bags</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Liters">Liters</option>
                                        <option value="Boxes">Boxes</option>
                                    </select>
                                </div>
                                <div className="inv-form-group">
                                    <label>Default Revenue / Billing Price (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.defaultRevenuePrice || 0}
                                        onChange={(e) => setFormData({ ...formData, defaultRevenuePrice: parseFloat(e.target.value) || 0, unitCost: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="inv-form-group">
                                    <label>Minimum Stock Level (Reorder Threshold)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.minStockLevel || 0}
                                        onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0, reorderLevel: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="inv-checkbox-group" style={{ marginTop: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isBatchTracked}
                                        onChange={(e) => setFormData({ ...formData, isBatchTracked: e.target.checked })}
                                    />
                                    <span>Track expiry dates and batches for this item (FEFO lot tracking)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.chargeableInCareRevenue}
                                        onChange={(e) => setFormData({ ...formData, chargeableInCareRevenue: e.target.checked })}
                                    />
                                    <span>Chargeable item in resident billing / care plans</span>
                                </label>
                            </div>

                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={formSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--primary"
                                    disabled={formSubmitting}
                                >
                                    {formSubmitting ? 'Creating...' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">UPDATE PRODUCT</span>
                                <h3>Edit {editingProduct.name}</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setEditingProduct(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {formError && (
                            <div className="inv-alert inv-alert--danger" role="alert">
                                <AlertCircle size={15} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form className="inv-modal-form" onSubmit={handleEditSubmit}>
                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label>Product Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="inv-form-group">
                                    <label>Product Code (Unique)</label>
                                    <input
                                        type="text"
                                        value={formData.code || ''}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="inv-form-group">
                                    <label>Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {Array.from(new Set([...formCategories, formData.category])).map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="inv-form-group">
                                    <label>Unit of Measure *</label>
                                    <select
                                        value={formData.unit || 'Nos'}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value, unitOfMeasure: e.target.value })}
                                    >
                                        <option value="Nos">Nos (Count)</option>
                                        <option value="Units">Units</option>
                                        <option value="Strips">Strips</option>
                                        <option value="Bottles">Bottles</option>
                                        <option value="Packs">Packs</option>
                                        <option value="Bags">Bags</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Liters">Liters</option>
                                        <option value="Boxes">Boxes</option>
                                    </select>
                                </div>
                                <div className="inv-form-group">
                                    <label>Default Revenue / Billing Price (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.defaultRevenuePrice || 0}
                                        onChange={(e) => setFormData({ ...formData, defaultRevenuePrice: parseFloat(e.target.value) || 0, unitCost: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="inv-form-group">
                                    <label>Minimum Stock Level</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.minStockLevel || 0}
                                        onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0, reorderLevel: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="inv-checkbox-group" style={{ marginTop: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isBatchTracked}
                                        onChange={(e) => setFormData({ ...formData, isBatchTracked: e.target.checked })}
                                    />
                                    <span>Track expiry dates and batches for this item</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.chargeableInCareRevenue}
                                        onChange={(e) => setFormData({ ...formData, chargeableInCareRevenue: e.target.checked })}
                                    />
                                    <span>Chargeable item in resident billing / care plans</span>
                                </label>
                            </div>

                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setEditingProduct(null)}
                                    disabled={formSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--primary"
                                    disabled={formSubmitting}
                                >
                                    {formSubmitting ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Product Details Modal */}
            {viewingProduct && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">PRODUCT SPECIFICATION</span>
                                <h3>{viewingProduct.name}</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setViewingProduct(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <div className="inv-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Product Code</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingProduct.code || viewingProduct.productCode || 'None'}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Category</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingProduct.category}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Unit of Measure</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingProduct.unit || viewingProduct.unitOfMeasure || 'Nos'}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Standard Billing / Revenue Price</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
                                        ₹{Number(viewingProduct.defaultRevenuePrice || viewingProduct.unitCost || 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Minimum Stock (Reorder Level)</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
                                        {viewingProduct.minStockLevel ?? viewingProduct.reorderLevel ?? 0} {viewingProduct.unit || 'Nos'}
                                    </p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Batch & Expiry Tracking</span>
                                    <div style={{ marginTop: 4 }}>
                                        <span className={`inv-badge inv-badge--${viewingProduct.isBatchTracked ? 'info' : 'neutral'}`}>
                                            {viewingProduct.isBatchTracked ? 'ACTIVE (FEFO Lots)' : 'NOT TRACKED'}
                                        </span>
                                    </div>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Operating Status</span>
                                    <div style={{ marginTop: 4 }}>
                                        <span className={`inv-badge inv-badge--${viewingProduct.status ? 'success' : 'danger'}`}>
                                            {viewingProduct.status ? 'ACTIVE IN CATALOG' : 'DEACTIVATED'}
                                        </span>
                                    </div>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Catalog ID</span>
                                    <p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: '0.85em' }}>{viewingProduct.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setViewingProduct(null)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="inv-btn inv-btn--primary"
                                onClick={() => {
                                    const p = viewingProduct;
                                    setViewingProduct(null);
                                    openEditModal(p);
                                }}
                            >
                                Edit Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
