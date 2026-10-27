import { useState, useEffect } from 'react';
import { UserCheck, AlertCircle, RotateCw, Activity } from 'lucide-react';
import { homeCareService } from '../homeCare.service';
import type { HomeCareAllocation, HomeCareAdmission } from '../homeCare.types';

interface StaffAllocationsTabProps {
    onOpenNewAllocation: () => void;
    onReassign: (allocation: HomeCareAllocation) => void;
    activeUnitId?: string | null;
}

export function StaffAllocationsTab({
    onOpenNewAllocation,
    onReassign,
    activeUnitId
}: StaffAllocationsTabProps) {
    const [allocations, setAllocations] = useState<HomeCareAllocation[]>([]);
    const [unallocatedAdmissions, setUnallocatedAdmissions] = useState<HomeCareAdmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            homeCareService.getAllocations(activeUnitId),
            homeCareService.getAdmissions(activeUnitId)
        ])
            .then(async ([allocs, admissions]) => {
                if (!isMounted) return;
                setAllocations(allocs);

                // Fetch contracts for admissions to identify unallocated active contracts
                const enriched = await Promise.all(
                    admissions.map(async (adm) => {
                        const c = await homeCareService.getAdmissionContract(adm.id, activeUnitId);
                        return { ...adm, serviceContract: c };
                    })
                );

                if (!isMounted) return;
                const allocatedEnquiryIds = new Set(
                    allocs
                        .filter((a) => (a.status === 'ALLOCATED' || a.status === 'ACTIVE') && a.staffId)
                        .map((a) => a.enquiryId || a.enquiry?.id)
                        .filter(Boolean)
                );

                const unallocated = enriched.filter((adm) => {
                    const hasActiveContract = adm.serviceContract?.status === 'ACTIVE';
                    const enquiryId = adm.enquiry?.id;
                    return hasActiveContract && (!enquiryId || !allocatedEnquiryIds.has(enquiryId));
                });

                setUnallocatedAdmissions(unallocated);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load allocations:', err);
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, refreshTrigger]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header & Quick Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserCheck size={18} color="#0f969c" />
                        Staff Allocations & Caregiver Assignments
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        Match registered caregiver staff with active Home Care service contracts.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="adm-btn adm-btn--primary" onClick={onOpenNewAllocation}>
                        <UserCheck size={14} /> Allocate Caregiver
                    </button>
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={handleRefresh} title="Refresh">
                        <RotateCw size={14} />
                    </button>
                </div>
            </div>

            {/* Unallocated Active Contracts Alert */}
            {unallocatedAdmissions.length > 0 && (
                <div
                    style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: 12,
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertCircle size={20} color="#d97706" />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>
                                {unallocatedAdmissions.length} Active Contract(s) Awaiting Caregiver Allocation
                            </div>
                            <div style={{ fontSize: 12, color: '#b45309' }}>
                                These clients have signed, active service contracts ready for staff assignment.
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        style={{ fontSize: 12, padding: '5px 12px', background: '#d97706', borderColor: '#d97706' }}
                        onClick={onOpenNewAllocation}
                    >
                        Allocate Now
                    </button>
                </div>
            )}

            {/* Allocations Table */}
            {isLoading ? (
                <div className="adm-loading-state" style={{ padding: 48, textAlign: 'center' }}>
                    <Activity className="adm-spin" size={24} color="#0f969c" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Loading staff allocations...</p>
                </div>
            ) : allocations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>No Home Care allocations registered.</p>
                </div>
            ) : (
                <div className="adm-table-container">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Ref / Client</th>
                                <th style={{ width: '20%' }}>Assigned Caregiver</th>
                                <th style={{ width: '18%' }}>Care Type / Service</th>
                                <th style={{ width: '12%', textAlign: 'center' }}>Start Date</th>
                                <th style={{ width: '12%', textAlign: 'center' }}>End Date</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                                <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allocations.map((alloc) => {
                                const clientName = alloc.clientName || alloc.patient || alloc.enquiry?.client?.name || 'Home Care Client';
                                const staffName = alloc.staffName || (alloc.staff ? `${alloc.staff.firstName} ${alloc.staff.lastName || ''}`.trim() : 'Unassigned');

                                return (
                                    <tr key={alloc.id}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{clientName}</div>
                                            <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                                                {alloc.refNo || alloc.id.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#0f969c' }}>{staffName}</div>
                                            {alloc.staff?.designation && (
                                                <span style={{ fontSize: 11, color: '#64748b' }}>{alloc.staff.designation}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{alloc.service || 'Home Care Service'}</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Type: {alloc.type}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {alloc.startDate ? new Date(alloc.startDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {alloc.endDate ? new Date(alloc.endDate).toLocaleDateString() : 'Ongoing'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span
                                                className={`adm-badge ${
                                                    alloc.status === 'ALLOCATED' || alloc.status === 'ACTIVE'
                                                        ? 'adm-badge--success'
                                                        : alloc.status === 'PENDING'
                                                        ? 'adm-badge--warning'
                                                        : 'adm-badge--secondary'
                                                }`}
                                            >
                                                {alloc.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--secondary"
                                                style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}
                                                onClick={() => onReassign(alloc)}
                                            >
                                                Reassign / Edit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
