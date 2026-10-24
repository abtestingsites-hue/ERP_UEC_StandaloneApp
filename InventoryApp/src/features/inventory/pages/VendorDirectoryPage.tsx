import React, { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Phone,
  Tag,
  Building2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Badge,
  Drawer,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { hasPermission, INVENTORY_PERMISSIONS } from '../../../lib/permissions';
import {
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from '../hooks/useInventory';
import type { Vendor } from '../types';

const CATEGORY_OPTIONS = [
  { value: 'Pharmacy', label: 'Pharmacy & Medical Supplies' },
  { value: 'Groceries', label: 'Groceries & Kitchen Ration' },
  { value: 'Housekeeping', label: 'Housekeeping & Cleaning' },
  { value: 'Maintenance', label: 'Electrical, Plumbing & Maintenance' },
  { value: 'Stationary', label: 'Office Supplies & Stationary' },
];

export default function VendorDirectoryPage() {
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);

  // Authoritative permissions
  const canViewVendors = hasPermission(user, [
    INVENTORY_PERMISSIONS.VENDOR_VIEW,
    'Vendor Master',
    'Vendors',
    'Stock',
  ]);
  const canManageVendors = hasPermission(user, [
    'Vendor Master',
    'Vendors',
  ]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'name' | 'code' | 'category'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer & Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Pharmacy',
    contact: '',
    status: true,
  });

  // Query Hooks
  const {
    data: vendors = [],
    isLoading: isVendorsLoading,
    isError: isVendorsError,
    error: vendorsError,
    refetch: refetchVendors,
  } = useVendors();

  const createVendorMutation = useCreateVendor();
  const updateVendorMutation = useUpdateVendor();
  const deleteVendorMutation = useDeleteVendor();

  // Metrics
  const metrics = useMemo(() => {
    const total = vendors.length;
    const activeCount = vendors.filter((v) => v.status !== false).length;
    const inactiveCount = total - activeCount;
    const categoryCount = new Set(vendors.map((v) => v.category)).size;

    return { total, activeCount, inactiveCount, categoryCount };
  }, [vendors]);

  // Filtered dataset
  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return vendors.filter((v) => {
      // Category filter
      if (selectedCategory !== 'all' && v.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'active' && v.status === false) return false;
      if (selectedStatus === 'inactive' && v.status !== false) return false;

      // Query
      if (!query) return true;
      const matchName = v.name?.toLowerCase().includes(query);
      const matchCode = v.code?.toLowerCase().includes(query);
      const matchCat = v.category?.toLowerCase().includes(query);
      const matchContact = v.contact?.toLowerCase().includes(query);

      return Boolean(matchName || matchCode || matchCat || matchContact);
    });
  }, [vendors, searchQuery, selectedCategory, selectedStatus]);

  // Sorted dataset
  const sortedVendors = useMemo(() => {
    return [...filteredVendors].sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortField) {
        case 'code':
          valA = (a.code || '').toLowerCase();
          valB = (b.code || '').toLowerCase();
          break;
        case 'category':
          valA = (a.category || '').toLowerCase();
          valB = (b.category || '').toLowerCase();
          break;
        case 'name':
        default:
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredVendors, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedVendors.length / pageSize) || 1;
  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedVendors.slice(start, start + pageSize);
  }, [sortedVendors, currentPage, pageSize]);

  // Handlers
  const handleRefresh = () => {
    refetchVendors();
  };

  const openCreateDrawer = () => {
    if (!canManageVendors) return;
    setEditingVendor(null);
    setFormError(null);
    setFormData({
      code: '',
      name: '',
      category: 'Pharmacy',
      contact: '',
      status: true,
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (vendor: Vendor) => {
    if (!canManageVendors) return;
    setEditingVendor(vendor);
    setFormError(null);
    setFormData({
      code: vendor.code || '',
      name: vendor.name || '',
      category: vendor.category || 'Pharmacy',
      contact: vendor.contact || '',
      status: vendor.status !== false,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = formData.code.trim();
    const name = formData.name.trim();
    const category = formData.category.trim();

    if (!code || code.length < 2) {
      setFormError('Vendor Code must be at least 2 characters');
      return;
    }
    if (!name || name.length < 2) {
      setFormError('Vendor Name must be at least 2 characters');
      return;
    }

    try {
      if (editingVendor) {
        await updateVendorMutation.mutateAsync({
          id: editingVendor.id,
          data: {
            code,
            name,
            category,
            contact: formData.contact.trim() || null,
            status: formData.status,
          },
        });
      } else {
        await createVendorMutation.mutateAsync({
          code,
          name,
          category,
          contact: formData.contact.trim() || null,
          status: formData.status,
        });
      }
      setIsDrawerOpen(false);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || err?.message || 'Failed to save vendor details'
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!vendorToDelete) return;
    try {
      await deleteVendorMutation.mutateAsync(vendorToDelete.id);
      setVendorToDelete(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete vendor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Vendor Directory"
        description={`Master supplier directory for ${
          activeUnit ? activeUnit.name : 'Active Operating Unit'
        }. Registered vendors are available for immediate selection during Purchase Order recording.`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isVendorsLoading}
              title="Refresh vendors from server"
            >
              <RotateCcw
                className={`w-4 h-4 mr-2 ${isVendorsLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>

            {canManageVendors && (
              <Button
                variant="primary"
                size="sm"
                onClick={openCreateDrawer}
                className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Enroll Vendor
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Registered Vendors
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {metrics.total}
            </span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total suppliers registered for this operating unit
          </p>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Active / Approved
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {metrics.activeCount}
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Verified suppliers ready for active procurement
          </p>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Pending / Inactive
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {metrics.inactiveCount}
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Suspended or pending assessment vendor profiles
          </p>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Supply Categories
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">
              {metrics.categoryCount}
            </span>
            <Tag className="w-5 h-5 text-cyan-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Distinct supply categories serviced across the facility
          </p>
        </Card>
      </section>

      {/* Filters Toolbar */}
      <Card className="p-4 border-slate-800 bg-slate-900/80">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Input
              placeholder="Search vendors by name, ID code, category, or contact number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-slate-500" />}
              className="bg-slate-950 border-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48">
              <Select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Supply Categories' },
                  ...CATEGORY_OPTIONS,
                ]}
              />
            </div>

            <div className="w-36">
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>

            {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Vendors Data Table */}
      <Card className="border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        {isVendorsLoading ? (
          <div className="py-20">
            <LoadingState message="Fetching registered vendors..." />
          </div>
        ) : isVendorsError ? (
          <div className="py-12 px-6">
            <ErrorState
              title="Unable to load vendor directory"
              message={
                (vendorsError as any)?.response?.data?.message ||
                (vendorsError as any)?.message ||
                'Failed to load vendors from server.'
              }
              onRetry={handleRefresh}
            />
          </div>
        ) : sortedVendors.length === 0 ? (
          <div className="py-16 px-6">
            <EmptyState
              icon={<Users className="w-12 h-12 text-slate-600" />}
              title="No vendors found"
              description={
                searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'No vendor profiles match your current search and filter criteria.'
                  : 'No vendors enrolled yet for this operating unit.'
              }
              action={
                canManageVendors ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateDrawer}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Enroll First Vendor
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-200 select-none transition-colors"
                    onClick={() => {
                      if (sortField === 'code') setSortAsc(!sortAsc);
                      else {
                        setSortField('code');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Vendor ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-200 select-none transition-colors"
                    onClick={() => {
                      if (sortField === 'name') setSortAsc(!sortAsc);
                      else {
                        setSortField('name');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Vendor Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-200 select-none transition-colors"
                    onClick={() => {
                      if (sortField === 'category') setSortAsc(!sortAsc);
                      else {
                        setSortField('category');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Supply Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Primary Contact</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {canManageVendors && <th className="py-3.5 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {paginatedVendors.map((vendor, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isActive = vendor.status !== false;

                  return (
                    <tr
                      key={vendor.id}
                      className="hover:bg-slate-800/40 transition-colors group text-slate-200"
                    >
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                        {globalIdx}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-emerald-400 font-bold">
                          {vendor.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                            {vendor.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                          {vendor.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {vendor.contact ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{vendor.contact}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">None provided</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isActive ? 'success' : 'default'}>
                          {isActive ? 'Approved' : 'Pending'}
                        </Badge>
                      </td>

                      {canManageVendors && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDrawer(vendor)}
                              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40"
                              title="Edit vendor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setVendorToDelete(vendor)}
                              className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                              title="Delete vendor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {sortedVendors.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <span className="font-bold text-slate-200">
                {Math.min((currentPage - 1) * pageSize + 1, sortedVendors.length)}
              </span>
              <span>to</span>
              <span className="font-bold text-slate-200">
                {Math.min(currentPage * pageSize, sortedVendors.length)}
              </span>
              <span>of</span>
              <span className="font-bold text-slate-200">{sortedVendors.length}</span>
              <span>vendors</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="px-3 font-semibold text-slate-300">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Drawer: Enroll / Edit Vendor */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingVendor ? 'Edit Vendor Profile' : 'Enroll New Vendor'}
        description={`Manage supplier master records registered under ${
          activeUnit ? activeUnit.name : 'active unit'
        }.`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Vendor ID / Code <span className="text-rose-400">*</span>
            </label>
            <Input
              placeholder="e.g. VEN-001, PHARM-MEDPLUS"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
              }
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Vendor Name <span className="text-rose-400">*</span>
            </label>
            <Input
              placeholder="e.g. MedPlus Pharmacy, FreshKart Groceries"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Supply Category <span className="text-rose-400">*</span>
            </label>
            <Select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              options={CATEGORY_OPTIONS}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Primary Contact Number / Email
            </label>
            <Input
              placeholder="e.g. +91 9876543210 or sales@vendor.com"
              value={formData.contact}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contact: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Verification Status
            </label>
            <Select
              value={formData.status ? 'active' : 'inactive'}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value === 'active' }))
              }
              options={[
                { value: 'active', label: 'Approved & Active' },
                { value: 'inactive', label: 'Pending Assessment' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createVendorMutation.isPending || updateVendorMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {createVendorMutation.isPending || updateVendorMutation.isPending
                ? 'Saving...'
                : editingVendor
                ? 'Update Vendor'
                : 'Enroll Vendor'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Modal: Confirm Vendor Deletion */}
      {vendorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Revoke Vendor Verification</h3>
                <p className="text-xs text-slate-400">Confirm vendor de-registration</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to remove <span className="font-bold text-white">"{vendorToDelete.name}"</span> ({vendorToDelete.code}) from the active vendor master directory?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVendorToDelete(null)}
                disabled={deleteVendorMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleteVendorMutation.isPending}
                className="bg-rose-600 hover:bg-rose-500 text-white"
              >
                {deleteVendorMutation.isPending ? 'Removing...' : 'Confirm Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
