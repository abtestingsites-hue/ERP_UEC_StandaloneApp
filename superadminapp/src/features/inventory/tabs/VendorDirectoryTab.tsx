import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Users,
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Eye,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    X,
    Phone,
    Building2,
    Tag,
    ShieldAlert
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type { Vendor, CreateVendorPayload, UpdateVendorPayload } from '../inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';

const VENDOR_CATEGORIES = [
    'ALL',
    'Pharmacy',
    'Medical',
    'Groceries',
    'Housekeeping',
    'Maintenance',
    'Electrical',
    'Stationary',
    'General'
];

export function VendorDirectoryTab() {
    const { activeUnitId, activeUnitName } = useActiveUnit();

    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
    const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

    // Form states
    const [formData, setFormData] = useState<CreateVendorPayload>({
        code: '',
        name: '',
        category: 'Pharmacy',
        contact: '',
        status: true
    });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const fetchVendors = useCallback(async () => {
        try {
            const data = await inventoryService.getVendors(activeUnitId);
            setVendors(data);
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load vendors:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load vendors';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchVendors();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchVendors]);

    const handleRefresh = () => {
        setIsLoading(true);
        void fetchVendors();
    };

    // Filtered vendors
    const filteredVendors = useMemo(() => {
        return vendors.filter((v) => {
            const q = search.trim().toLowerCase();
            const matchesSearch = !q ||
                v.name.toLowerCase().includes(q) ||
                v.code.toLowerCase().includes(q) ||
                (v.contact && v.contact.toLowerCase().includes(q)) ||
                v.category.toLowerCase().includes(q);

            const matchesCategory = selectedCategory === 'ALL' || v.category.toLowerCase() === selectedCategory.toLowerCase();

            const matchesStatus =
                selectedStatus === 'ALL' ||
                (selectedStatus === 'ACTIVE' && v.status !== false) ||
                (selectedStatus === 'INACTIVE' && v.status === false);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [vendors, search, selectedCategory, selectedStatus]);

    // Metrics
    const metrics = useMemo(() => {
        const total = vendors.length;
        const activeCount = vendors.filter(v => v.status !== false).length;
        const inactiveCount = total - activeCount;
        const categoriesCount = new Set(vendors.map(v => v.category)).size;
        return { total, activeCount, inactiveCount, categoriesCount };
    }, [vendors]);

    // Create Modal handlers
    const openCreateModal = () => {
        setFormData({
            code: '',
            name: '',
            category: 'Pharmacy',
            contact: '',
            status: true
        });
        setFormError(null);
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = formData.code.trim().toUpperCase();
        const name = formData.name.trim();

        if (code.length < 2) {
            setFormError('Vendor Code must be at least 2 characters.');
            return;
        }
        if (name.length < 2) {
            setFormError('Vendor Name must be at least 2 characters.');
            return;
        }

        setFormSubmitting(true);
        setFormError(null);
        try {
            await inventoryService.createVendor({
                ...formData,
                code,
                name,
                contact: formData.contact?.trim() || undefined
            }, activeUnitId);

            setIsCreateModalOpen(false);
            setSuccessMessage(`Vendor "${name}" created successfully.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            void fetchVendors();
        } catch (err: unknown) {
            console.error('Failed to create vendor:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to create vendor.';
            setFormError(message);
        } finally {
            setFormSubmitting(false);
        }
    };

    // Edit Modal handlers
    const openEditModal = (vendor: Vendor) => {
        setEditingVendor(vendor);
        setFormData({
            code: vendor.code,
            name: vendor.name,
            category: vendor.category,
            contact: vendor.contact || '',
            status: vendor.status !== false
        });
        setFormError(null);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVendor) return;

        const name = formData.name.trim();
        if (name.length < 2) {
            setFormError('Vendor Name must be at least 2 characters.');
            return;
        }

        setFormSubmitting(true);
        setFormError(null);
        try {
            const updatePayload: UpdateVendorPayload = {
                name,
                category: formData.category,
                contact: formData.contact?.trim() || undefined,
                status: formData.status
            };

            await inventoryService.updateVendor(editingVendor.id, updatePayload, activeUnitId);
            setEditingVendor(null);
            setSuccessMessage(`Vendor "${name}" updated successfully.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            void fetchVendors();
        } catch (err: unknown) {
            console.error('Failed to update vendor:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to update vendor.';
            setFormError(message);
        } finally {
            setFormSubmitting(false);
        }
    };

    // Soft-delete handler
    const confirmDeleteVendor = async () => {
        if (!vendorToDelete) return;
        setDeleteSubmitting(true);
        try {
            await inventoryService.deleteVendor(vendorToDelete.id, activeUnitId);
            setSuccessMessage(`Vendor "${vendorToDelete.name}" successfully archived.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            setVendorToDelete(null);
            void fetchVendors();
        } catch (err: unknown) {
            console.error('Failed to archive vendor:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to archive vendor.';
            setError(message);
            setVendorToDelete(null);
        } finally {
            setDeleteSubmitting(false);
        }
    };

    return (
        <div className="inventory-tab-content">
            <div className="overview-toolbar">
                <div>
                    <span className="section-kicker">SUPPLY CHAIN & LOGISTICS · {activeUnitName.toUpperCase()}</span>
                    <h2>Vendor Directory</h2>
                </div>
                <div className="toolbar-actions">
                    <button
                        className="inv-btn inv-btn--primary"
                        onClick={openCreateModal}
                    >
                        <Plus size={15} />
                        <span>Register Vendor</span>
                    </button>
                    <button
                        className="inv-btn inv-btn--secondary"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title="Reload Vendors"
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

            {/* Metrics Row */}
            <div className="stat-cards-grid" style={{ marginBottom: 16 }}>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--info">
                        <Users size={20} />
                    </div>
                    <span className="stat-card__label">Total Registered</span>
                    <strong className="stat-card__value">{metrics.total}</strong>
                    <span className="stat-card__note">Commercial & medical suppliers</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--success">
                        <Building2 size={20} />
                    </div>
                    <span className="stat-card__label">Active Vendors</span>
                    <strong className="stat-card__value">{metrics.activeCount}</strong>
                    <span className="stat-card__note">Eligible for purchase orders</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--warning">
                        <ShieldAlert size={20} />
                    </div>
                    <span className="stat-card__label">Inactive / On Hold</span>
                    <strong className="stat-card__value">{metrics.inactiveCount}</strong>
                    <span className="stat-card__note">Restricted from PO creation</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--primary">
                        <Tag size={20} />
                    </div>
                    <span className="stat-card__label">Supply Categories</span>
                    <strong className="stat-card__value">{metrics.categoriesCount}</strong>
                    <span className="stat-card__note">Specialized procurement lines</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="inv-filters-bar">
                <div className="inv-search-form" style={{ flex: '1 1 320px' }}>
                    <Search size={15} className="inv-search-icon" />
                    <input
                        type="search"
                        className="inv-search-input"
                        placeholder="Search by vendor name, code, contact or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="inv-filter-group">
                    <Filter size={14} className="inv-filter-icon" />
                    <label htmlFor="vendor-cat-select" className="sr-only">Category</label>
                    <select
                        id="vendor-cat-select"
                        className="inv-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {VENDOR_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
                        ))}
                    </select>
                </div>

                <div className="inv-filter-group">
                    <label htmlFor="vendor-status-select" className="sr-only">Status</label>
                    <select
                        id="vendor-status-select"
                        className="inv-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive Only</option>
                    </select>
                </div>
            </div>

            {/* Vendors Table */}
            <div className="inv-card">
                {isLoading ? (
                    <div className="inv-loading-state">
                        <RefreshCw size={24} className="spin-animation" />
                        <p>Loading verified vendor records...</p>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="inv-empty-state">
                        <Users size={32} />
                        <h4>No vendors found</h4>
                        <p>Adjust your search criteria or register a new commercial vendor.</p>
                    </div>
                ) : (
                    <div className="inv-table-responsive">
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th>Vendor ID / Code</th>
                                    <th>Vendor Name</th>
                                    <th>Category</th>
                                    <th>Contact Phone</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVendors.map((v) => (
                                    <tr key={v.id}>
                                        <td>
                                            <strong>{v.code}</strong>
                                        </td>
                                        <td>
                                            <div className="inv-product-cell">
                                                <strong>{v.name}</strong>
                                                <span className="inv-subtext">ID: {v.id.slice(0, 8)}...</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="inv-category-pill">{v.category}</span>
                                        </td>
                                        <td>
                                            {v.contact ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Phone size={13} className="inv-subtext" />
                                                    <span>{v.contact}</span>
                                                </div>
                                            ) : (
                                                <span className="inv-subtext">No contact listed</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`inv-badge inv-badge--${v.status !== false ? 'success' : 'danger'}`}>
                                                {v.status !== false ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="inv-table-actions">
                                                <button
                                                    className="inv-icon-btn"
                                                    onClick={() => setViewingVendor(v)}
                                                    title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    className="inv-icon-btn"
                                                    onClick={() => openEditModal(v)}
                                                    title="Edit Vendor"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="inv-icon-btn inv-icon-btn--danger"
                                                    onClick={() => setVendorToDelete(v)}
                                                    title="Archive Vendor"
                                                >
                                                    <Trash2 size={14} />
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

            {/* Create Vendor Modal */}
            {isCreateModalOpen && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">VENDOR MANAGEMENT</span>
                                <h3>Register New Vendor</h3>
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
                            <div className="inv-alert inv-alert--danger" style={{ margin: '16px 20px 0' }}>
                                <AlertCircle size={15} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateSubmit} className="inv-modal-body">
                            <div className="inv-form-grid">
                                <div className="inv-form-field">
                                    <label htmlFor="vendor-code">Vendor Code *</label>
                                    <input
                                        id="vendor-code"
                                        type="text"
                                        className="inv-input"
                                        placeholder="e.g. VEN-PHARM-01"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                    />
                                    <small className="inv-subtext">Unique commercial code</small>
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="vendor-name">Vendor Name *</label>
                                    <input
                                        id="vendor-name"
                                        type="text"
                                        className="inv-input"
                                        placeholder="e.g. MedPlus Logistics Pvt Ltd"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="vendor-category">Supply Category *</label>
                                    <select
                                        id="vendor-category"
                                        className="inv-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="Pharmacy">Pharmacy & Medical Supplies</option>
                                        <option value="Medical">Clinical & Surgical Equipment</option>
                                        <option value="Groceries">Groceries & Kitchen Ration</option>
                                        <option value="Housekeeping">Housekeeping & Sanitization</option>
                                        <option value="Maintenance">Maintenance & Facilities</option>
                                        <option value="Electrical">Electrical & Appliances</option>
                                        <option value="Stationary">Office & Administrative Supplies</option>
                                        <option value="General">General Logistics</option>
                                    </select>
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="vendor-contact">Contact Phone / Email</label>
                                    <input
                                        id="vendor-contact"
                                        type="text"
                                        className="inv-input"
                                        placeholder="e.g. +91 98450 12345 or info@vendor.com"
                                        value={formData.contact || ''}
                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="inv-form-checkbox-row" style={{ marginTop: 16 }}>
                                <label className="inv-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.status !== false}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                    />
                                    <span>Active Status (Vendor is approved for purchase transactions)</span>
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
                                    {formSubmitting ? 'Registering...' : 'Save Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Vendor Modal */}
            {editingVendor && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">MODIFY RECORD</span>
                                <h3>Edit Vendor · {editingVendor.code}</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setEditingVendor(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {formError && (
                            <div className="inv-alert inv-alert--danger" style={{ margin: '16px 20px 0' }}>
                                <AlertCircle size={15} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleEditSubmit} className="inv-modal-body">
                            <div className="inv-form-grid">
                                <div className="inv-form-field">
                                    <label htmlFor="edit-vendor-code">Vendor Code (Read-Only)</label>
                                    <input
                                        id="edit-vendor-code"
                                        type="text"
                                        className="inv-input"
                                        value={editingVendor.code}
                                        disabled
                                        style={{ opacity: 0.7 }}
                                    />
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="edit-vendor-name">Vendor Name *</label>
                                    <input
                                        id="edit-vendor-name"
                                        type="text"
                                        className="inv-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="edit-vendor-category">Supply Category *</label>
                                    <select
                                        id="edit-vendor-category"
                                        className="inv-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="Pharmacy">Pharmacy & Medical Supplies</option>
                                        <option value="Medical">Clinical & Surgical Equipment</option>
                                        <option value="Groceries">Groceries & Kitchen Ration</option>
                                        <option value="Housekeeping">Housekeeping & Sanitization</option>
                                        <option value="Maintenance">Maintenance & Facilities</option>
                                        <option value="Electrical">Electrical & Appliances</option>
                                        <option value="Stationary">Office & Administrative Supplies</option>
                                        <option value="General">General Logistics</option>
                                    </select>
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="edit-vendor-contact">Contact Phone / Email</label>
                                    <input
                                        id="edit-vendor-contact"
                                        type="text"
                                        className="inv-input"
                                        value={formData.contact || ''}
                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="inv-form-checkbox-row" style={{ marginTop: 16 }}>
                                <label className="inv-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.status !== false}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                    />
                                    <span>Active Status</span>
                                </label>
                            </div>

                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setEditingVendor(null)}
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

            {/* View Details Modal */}
            {viewingVendor && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">SUPPLIER SPECIFICATION</span>
                                <h3>{viewingVendor.name}</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setViewingVendor(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <div className="inv-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Vendor Code</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingVendor.code}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Category</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingVendor.category}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Contact Information</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingVendor.contact || 'None registered'}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Operating Status</span>
                                    <div style={{ marginTop: 4 }}>
                                        <span className={`inv-badge inv-badge--${viewingVendor.status !== false ? 'success' : 'danger'}`}>
                                            {viewingVendor.status !== false ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Record ID</span>
                                    <p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: '0.85em' }}>{viewingVendor.id}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Registered On</span>
                                    <p style={{ margin: '4px 0 0' }}>{new Date(viewingVendor.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setViewingVendor(null)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="inv-btn inv-btn--primary"
                                onClick={() => {
                                    const v = viewingVendor;
                                    setViewingVendor(null);
                                    openEditModal(v);
                                }}
                            >
                                Edit Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Soft-Delete Dialog */}
            {vendorToDelete && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 440 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker" style={{ color: 'var(--danger-color, #ef4444)' }}>SAFE ARCHIVAL</span>
                                <h3>Archive Vendor</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setVendorToDelete(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <p>Are you sure you want to archive <strong>{vendorToDelete.name}</strong> ({vendorToDelete.code})?</p>
                            <div className="inv-alert inv-alert--warning" style={{ marginTop: 12 }}>
                                <AlertCircle size={15} />
                                <span>This performs a soft-deletion. Historical purchase orders, product batches, and audit records linked to this vendor remain preserved.</span>
                            </div>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setVendorToDelete(null)}
                                disabled={deleteSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="inv-btn inv-btn--danger"
                                onClick={confirmDeleteVendor}
                                disabled={deleteSubmitting}
                            >
                                {deleteSubmitting ? 'Archiving...' : 'Confirm Archive'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
