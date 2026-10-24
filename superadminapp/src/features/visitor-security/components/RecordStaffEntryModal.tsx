import React, { useState, useEffect } from 'react';
import { X, LogIn, AlertCircle, Search, UserCheck } from 'lucide-react';
import { visitorSecurityService } from '../visitorSecurity.service';

interface StaffItem {
    id: string;
    empId?: string;
    firstName: string;
    lastName?: string;
    department?: string;
    designation?: string;
}

interface RecordStaffEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    unitId?: string | null;
    activeStaffIds?: Set<string>;
}

export function RecordStaffEntryModal({
    isOpen,
    onClose,
    onSuccess,
    unitId,
    activeStaffIds = new Set()
}: RecordStaffEntryModalProps) {
    const [staffList, setStaffList] = useState<StaffItem[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLoadingStaff(true);
            setError(null);
            setSearchTerm('');
            setSelectedStaffId('');

            visitorSecurityService.getStaffList(unitId)
                .then((res) => {
                    setStaffList(res);
                    // Select first staff not already on premises if available
                    const available = res.filter((s) => !activeStaffIds.has(s.id));
                    if (available.length > 0) {
                        setSelectedStaffId(available[0].id);
                    } else if (res.length > 0) {
                        setSelectedStaffId(res[0].id);
                    }
                    setLoadingStaff(false);
                })
                .catch(() => {
                    setLoadingStaff(false);
                });
        }
    }, [isOpen, unitId, activeStaffIds]);

    if (!isOpen) return null;

    const filteredStaff = staffList.filter((s) => {
        const full = `${s.firstName || ''} ${s.lastName || ''} ${s.empId || ''} ${s.department || ''} ${s.designation || ''}`.toLowerCase();
        return full.includes(searchTerm.toLowerCase());
    });

    const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
    const isAlreadyInside = selectedStaff ? activeStaffIds.has(selectedStaff.id) : false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaffId) {
            setError('Please select a staff member.');
            return;
        }

        if (isAlreadyInside) {
            setError('This staff member is already recorded ON PREMISES today.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await visitorSecurityService.recordStaffEntry({ staffId: selectedStaffId }, unitId);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to record staff entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1050,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(3px)',
                padding: '1rem'
            }}
        >
            <div
                style={{
                    backgroundColor: 'var(--surface-color, #ffffff)',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '520px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border-color, #e2e8f0)',
                        backgroundColor: 'var(--header-bg, #f8fafc)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#10b981'
                            }}
                        >
                            <LogIn size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                                Record Staff Gate Entry
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                                Facility check-in synced with HR daily attendance
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary, #64748b)',
                            padding: '4px',
                            display: 'flex'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {error && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#ef4444',
                                fontSize: '0.85rem'
                            }}
                        >
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Search & Staff Selector */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                            Select Staff Member <span style={{ color: '#ef4444' }}>*</span>
                        </label>

                        {/* Search input */}
                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                            <Search
                                size={14}
                                style={{
                                    position: 'absolute',
                                    left: 10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-secondary, #64748b)'
                                }}
                            />
                            <input
                                type="text"
                                className="erp-input"
                                placeholder="Search by name, ID, or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 30, fontSize: '0.85rem', width: '100%' }}
                            />
                        </div>

                        {loadingStaff ? (
                            <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                Loading staff directory...
                            </div>
                        ) : filteredStaff.length === 0 ? (
                            <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                No staff members match your search.
                            </div>
                        ) : (
                            <select
                                className="erp-input"
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                style={{ width: '100%', fontSize: '0.875rem' }}
                                required
                            >
                                <option value="">-- Choose Staff Member --</option>
                                {filteredStaff.map((s) => {
                                    const inside = activeStaffIds.has(s.id);
                                    const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
                                    return (
                                        <option key={s.id} value={s.id}>
                                            {name} ({s.empId || 'No ID'}) — {s.designation || 'Staff'} [{s.department || 'General'}] {inside ? '• Already Inside' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>

                    {/* Staff Details Preview */}
                    {selectedStaff && (
                        <div
                            style={{
                                padding: '0.85rem 1rem',
                                borderRadius: '10px',
                                backgroundColor: isAlreadyInside ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                                border: `1px solid ${isAlreadyInside ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <UserCheck size={18} color={isAlreadyInside ? '#ef4444' : '#10b981'} />
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {selectedStaff.firstName} {selectedStaff.lastName}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {selectedStaff.designation || 'Staff'} • {selectedStaff.department || 'Operations'}
                                    </div>
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    backgroundColor: isAlreadyInside ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isAlreadyInside ? '#ef4444' : '#10b981'
                                }}
                            >
                                {isAlreadyInside ? 'ALREADY ON PREMISES' : 'READY TO CHECK-IN'}
                            </span>
                        </div>
                    )}

                    <div
                        style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            fontSize: '0.8rem',
                            color: '#2563eb',
                            lineHeight: 1.4
                        }}
                    >
                        Recording gate entry logs arrival time and marks the staff member active on campus. If configured, it automatically registers daily attendance in the HR system.
                    </div>

                    {/* Actions */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            marginTop: '0.5rem'
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="erp-button erp-button-secondary"
                            disabled={isSubmitting}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="erp-button erp-button-primary"
                            disabled={isSubmitting || !selectedStaffId || isAlreadyInside}
                            style={{
                                padding: '0.5rem 1.25rem',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                backgroundColor: '#10b981',
                                borderColor: '#10b981',
                                color: '#ffffff'
                            }}
                        >
                            <LogIn size={15} />
                            {isSubmitting ? 'Recording...' : 'Confirm Gate Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
