import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Activity,
    ClipboardList,
    FileSignature,
    UserCheck,
    Calendar,
    Users,
    Clock,
    HeartPulse,
    Building2,
    User,
    UserPlus,
    type LucideIcon
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useActiveUnit } from '../../context/useActiveUnit';
import { homeCareService } from './homeCare.service';
import type {
    HomeCareAdmission,
    HomeCareEnquiry,
    ServiceContract,
    HomeCareAllocation,
    HomeCareClientItem,
    VisitTask,
    CaregiverStaff,
    CreateContractPayload,
    UpdateContractPayload,
    CreateAllocationPayload
} from './homeCare.types';

// Tabs
import { ManagerOverviewTab } from './tabs/ManagerOverviewTab';
import { EnquiriesTab } from './tabs/EnquiriesTab';
import { ServiceRequirementsTab } from './tabs/ServiceRequirementsTab';
import { ServiceContractsTab } from './tabs/ServiceContractsTab';
import { StaffAllocationsTab } from './tabs/StaffAllocationsTab';
import { ManagerRosterTab } from './tabs/ManagerRosterTab';
import { StaffOverviewTab } from './tabs/StaffOverviewTab';
import { MyClientsTab } from './tabs/MyClientsTab';
import { MyVisitsTab } from './tabs/MyVisitsTab';
import { CareDeliveryTab } from './tabs/CareDeliveryTab';

// Modals
import { EnquiryFormModal } from './components/EnquiryFormModal';
import { CreateContractModal } from './components/CreateContractModal';
import { ContractDetailsDrawer } from './components/ContractDetailsDrawer';
import { AssignCaregiverModal } from './components/AssignCaregiverModal';
import { ClientDetailsDrawer } from './components/ClientDetailsDrawer';
import { VisitCheckInModal } from './components/VisitCheckInModal';
import { VisitCheckOutModal } from './components/VisitCheckOutModal';
import { CareDeliveryModal } from './components/CareDeliveryModal';
import { ServiceClosureModal } from './components/ServiceClosureModal';
import { PrepareInvoiceModal } from './components/PrepareInvoiceModal';

import { useAuth } from '../auth/useAuth';
import { isSuperAdmin, getRoleName } from '../../utils/permissions';

interface HomeCareTabItem {
    id: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
}

export function HomeCareWorkspace() {
    const { session } = useAuth();
    const user = session?.user;
    const roleName = getRoleName(user).toUpperCase().replace(/[\s-]+/g, '_').trim();
    const isManager = isSuperAdmin(user) || ['HOME_CARE_MANAGER', 'CARE_ALLOCATION_MANAGER', 'ADMIN', 'UNCF_ADMIN'].includes(roleName);

    const [searchParams, setSearchParams] = useSearchParams();
    const paramRole = searchParams.get('role');
    const roleMode: 'manager' | 'staff' = isManager ? (paramRole === 'staff' ? 'staff' : 'manager') : 'staff';
    const activeTab = searchParams.get('tab') || 'overview';

    const { activeUnitName, hasExplicitAllUnits, activeUnitId } = useActiveUnit();

    // Data lists for modals
    const [admissions, setAdmissions] = useState<HomeCareAdmission[]>([]);
    const [staffList, setStaffList] = useState<CaregiverStaff[]>([]);
    const [unallocatedAdmissions, setUnallocatedAdmissions] = useState<HomeCareAdmission[]>([]);
    const [unallocatedCount, setUnallocatedCount] = useState(0);

    // Modal states
    const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false);
    const [contractTargetAdmission, setContractTargetAdmission] = useState<HomeCareAdmission | null>(null);
    const [contractTargetEnquiry, setContractTargetEnquiry] = useState<HomeCareEnquiry | null>(null);
    const [detailsContract, setDetailsContract] = useState<{
        admission: HomeCareAdmission | null;
        contract: ServiceContract | null;
    } | null>(null);
    const [closureTarget, setClosureTarget] = useState<{
        admission: HomeCareAdmission;
        contract: ServiceContract;
    } | null>(null);
    const [invoiceTarget, setInvoiceTarget] = useState<{
        admission: HomeCareAdmission;
        contract: ServiceContract;
    } | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedAllocationForReassign, setSelectedAllocationForReassign] = useState<HomeCareAllocation | null>(null);
    const [selectedClientForDetails, setSelectedClientForDetails] = useState<HomeCareClientItem | null>(null);
    const [checkInVisit, setCheckInVisit] = useState<VisitTask | null>(null);
    const [checkOutVisit, setCheckOutVisit] = useState<VisitTask | null>(null);
    const [careDeliveryContext, setCareDeliveryContext] = useState<{ patientId: string; patientName: string } | null>(null);
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshData = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
        return Promise.resolve();
    }, []);

    // Load reference data
    useEffect(() => {
        let isMounted = true;
        Promise.all([
            homeCareService.getAdmissions(activeUnitId),
            homeCareService.getCaregiverStaff(activeUnitId),
            homeCareService.getAllocations(activeUnitId)
        ])
            .then(async ([adms, staff, allocs]) => {
                if (!isMounted) return;
                setAdmissions(adms);
                setStaffList(staff);

                // Enrich admissions with contracts to identify unallocated active contracts
                const enriched = await Promise.all(
                    adms.map(async (adm) => {
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
                setUnallocatedCount(unallocated.length);
            })
            .catch((err) => {
                console.error('Failed to refresh Home Care data:', err);
            });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, refreshTrigger]);

    const handleTabChange = (tabId: string) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('tab', tabId);
            return next;
        });
    };

    const handleRoleToggle = (targetRole: 'manager' | 'staff') => {
        if (!isManager) return;
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('role', targetRole);
            next.set('tab', 'overview');
            return next;
        });
    };

    // Modal Submit Handlers
    const handleCreateContract = async (payload: CreateContractPayload) => {
        await homeCareService.createContract(payload);
        await refreshData();
    };

    const handleUpdateContract = async (id: string, payload: UpdateContractPayload) => {
        await homeCareService.updateContract(id, payload, activeUnitId);
        await refreshData();
    };

    const handleActivateContract = async (id: string) => {
        await homeCareService.activateContract(id, activeUnitId);
        await refreshData();
    };

    const handleAssignCaregiver = async (payload: CreateAllocationPayload) => {
        await homeCareService.createAllocation(payload);
        setIsAssignModalOpen(false);
        setSelectedAllocationForReassign(null);
        await refreshData();
    };

    const handleCreateEnquiry = async (payload: Record<string, unknown>) => {
        await homeCareService.createEnquiry(payload, activeUnitId);
        setIsNewEnquiryOpen(false);
        await refreshData();
    };

    const handleConfirmCheckIn = async () => {
        if (!checkInVisit) return;
        setIsActionSubmitting(true);
        try {
            await homeCareService.updateVisitStatus(checkInVisit.id, { status: 'IN_PROGRESS' }, activeUnitId);
            setCheckInVisit(null);
            await refreshData();
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const handleConfirmCheckOut = async (remarks: string) => {
        if (!checkOutVisit) return;
        setIsActionSubmitting(true);
        try {
            await homeCareService.updateVisitStatus(checkOutVisit.id, {
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                remarks
            }, activeUnitId);
            setCheckOutVisit(null);
            await refreshData();
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const managerTabs: HomeCareTabItem[] = [
        { id: 'overview', label: 'Operations Overview', icon: Activity },
        { id: 'enquiries', label: 'Client Intake', icon: UserPlus },
        { id: 'requirements', label: 'Care Requirements', icon: ClipboardList },
        { id: 'contracts', label: 'Service Contracts', icon: FileSignature },
        { id: 'allocations', label: 'Staff Allocations', icon: UserCheck, badge: unallocatedCount },
        { id: 'roster', label: 'Staff Roster', icon: Calendar }
    ];

    const staffTabs: HomeCareTabItem[] = [
        { id: 'overview', label: 'Caregiver Shift', icon: Activity },
        { id: 'clients', label: 'My Assigned Clients', icon: Users },
        { id: 'visits', label: 'My Scheduled Visits', icon: Clock },
        { id: 'care-delivery', label: 'Care Delivery Logs', icon: HeartPulse }
    ];

    const currentTabs = roleMode === 'staff' ? staffTabs : managerTabs;

    return (
        <div className="adm-workspace">
            <PageHeader
                eyebrow="BUSINESS DOMAIN · HOME CARE SERVICES"
                title="Home Care & Domiciliary Operations"
                description="Client intake, service contracts, agreed rates, caregiver allocations, and operational home visit execution."
                action={
                    <div className="adm-header-action-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {/* Role Perspective Switcher */}
                        <div
                            style={{
                                display: 'inline-flex',
                                background: '#f1f5f9',
                                padding: 3,
                                borderRadius: 8,
                                border: '1px solid #e2e8f0'
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => handleRoleToggle('manager')}
                                style={{
                                    border: 'none',
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background: roleMode === 'manager' ? '#ffffff' : 'transparent',
                                    color: roleMode === 'manager' ? '#0f172a' : '#64748b',
                                    boxShadow: roleMode === 'manager' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5
                                }}
                            >
                                <UserCheck size={14} /> Home Care Manager
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRoleToggle('staff')}
                                style={{
                                    border: 'none',
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background: roleMode === 'staff' ? '#ffffff' : 'transparent',
                                    color: roleMode === 'staff' ? '#0f172a' : '#64748b',
                                    boxShadow: roleMode === 'staff' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5
                                }}
                            >
                                <User size={14} /> Caregiver / Staff
                            </button>
                        </div>

                        {/* Unit Scope Badge */}
                        <div className="adm-scope-badge" title="Active Operating Scope">
                            <Building2 size={14} />
                            <span>{activeUnitName}</span>
                            {activeUnitId === null && hasExplicitAllUnits && (
                                <span className="adm-badge adm-badge--success" style={{ marginLeft: 6 }}>
                                    Facility Wide
                                </span>
                            )}
                        </div>
                    </div>
                }
            />

            {/* Navigation Tab Bar */}
            <div className="adm-tabs-container">
                <nav className="adm-tabs-nav" aria-label="Home Care Sections">
                    {currentTabs.map((tab) => {
                        const IconComp = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                className={`adm-tab-btn ${isActive ? 'adm-tab-btn--active' : ''}`}
                                onClick={() => handleTabChange(tab.id)}
                            >
                                <IconComp size={16} />
                                <span>{tab.label}</span>
                                {Boolean(tab.badge && tab.badge > 0) && (
                                    <span className="adm-badge adm-badge--warning" style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px' }}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Body */}
            <div className="adm-tab-content">
                {roleMode === 'manager' && (
                    <>
                        {activeTab === 'overview' && (
                            <ManagerOverviewTab
                                onOpenNewEnquiry={() => setIsNewEnquiryOpen(true)}
                                onOpenNewContract={() => {
                                    if (admissions.length > 0) {
                                        setContractTargetAdmission(admissions[0]);
                                    } else {
                                        handleTabChange('contracts');
                                    }
                                }}
                                onOpenNewAllocation={() => {
                                    setSelectedAllocationForReassign(null);
                                    setIsAssignModalOpen(true);
                                }}
                                onNavigateTab={handleTabChange}
                                activeUnitId={activeUnitId}
                            />
                        )}

                        {activeTab === 'enquiries' && (
                            <EnquiriesTab
                                onOpenNewEnquiry={() => setIsNewEnquiryOpen(true)}
                                activeUnitId={activeUnitId}
                            />
                        )}

                        {activeTab === 'requirements' && (
                            <ServiceRequirementsTab
                                onOpenNewContract={(req) => {
                                    if (req) {
                                        const matchingAdmission = admissions.find((a) => a.enquiryId === req.id || a.enquiry?.id === req.id);
                                        if (matchingAdmission) {
                                            setContractTargetAdmission(matchingAdmission);
                                            setContractTargetEnquiry(null);
                                        } else {
                                            setContractTargetEnquiry(req);
                                            setContractTargetAdmission(null);
                                        }
                                    } else if (admissions.length > 0) {
                                        setContractTargetAdmission(admissions[0]);
                                        setContractTargetEnquiry(null);
                                    } else {
                                        handleTabChange('contracts');
                                    }
                                }}
                                activeUnitId={activeUnitId}
                            />
                        )}

                        {activeTab === 'contracts' && (
                            <ServiceContractsTab
                                onOpenCreateContract={(adm) => {
                                    setContractTargetAdmission(adm);
                                    setContractTargetEnquiry(null);
                                }}
                                onOpenContractDetails={(adm, c) => setDetailsContract({ admission: adm, contract: c })}
                                onOpenPrepareInvoice={(adm, c) => setInvoiceTarget({ admission: adm, contract: c })}
                                onOpenClosure={(adm, c) => setClosureTarget({ admission: adm, contract: c })}
                                activeUnitId={activeUnitId}
                            />
                        )}

                        {activeTab === 'allocations' && (
                            <StaffAllocationsTab
                                onOpenNewAllocation={() => {
                                    setSelectedAllocationForReassign(null);
                                    setIsAssignModalOpen(true);
                                }}
                                onReassign={(alloc) => {
                                    setSelectedAllocationForReassign(alloc);
                                    setIsAssignModalOpen(true);
                                }}
                                activeUnitId={activeUnitId}
                            />
                        )}

                        {activeTab === 'roster' && (
                            <ManagerRosterTab activeUnitId={activeUnitId} />
                        )}
                    </>
                )}

                {roleMode === 'staff' && (
                    <>
                        {activeTab === 'overview' && (
                            <StaffOverviewTab
                                onNavigateTab={handleTabChange}
                                activeUnitId={activeUnitId}
                            />
                        )}

                        {activeTab === 'clients' && (
                            <MyClientsTab
                                onOpenClientDetails={(client) => setSelectedClientForDetails(client)}
                                activeUnitId={activeUnitId}
                            />
                        )}

                        {activeTab === 'visits' && (
                            <MyVisitsTab
                                onCheckIn={(v) => setCheckInVisit(v)}
                                onCheckOut={(v) => setCheckOutVisit(v)}
                                onCareDelivery={(pId, pName) => setCareDeliveryContext({ patientId: pId, patientName: pName })}
                                activeUnitId={activeUnitId}
                            />
                        )}

                        {activeTab === 'care-delivery' && (
                            <CareDeliveryTab activeUnitId={activeUnitId} />
                        )}
                    </>
                )}
            </div>

            {/* Modals & Drawers */}
            <EnquiryFormModal
                isOpen={isNewEnquiryOpen}
                onClose={() => setIsNewEnquiryOpen(false)}
                onSubmit={handleCreateEnquiry}
                activeUnitId={activeUnitId}
            />

            <CreateContractModal
                isOpen={Boolean(contractTargetAdmission || contractTargetEnquiry)}
                onClose={() => {
                    setContractTargetAdmission(null);
                    setContractTargetEnquiry(null);
                }}
                admission={contractTargetAdmission}
                enquiry={contractTargetEnquiry}
                onSubmit={handleCreateContract}
                activeUnitId={activeUnitId}
            />

            <ContractDetailsDrawer
                isOpen={Boolean(detailsContract)}
                onClose={() => setDetailsContract(null)}
                contract={detailsContract?.contract || null}
                admission={detailsContract?.admission || null}
                onActivate={handleActivateContract}
                onUpdate={handleUpdateContract}
                onOpenClosure={(adm, c) => setClosureTarget({ admission: adm, contract: c })}
            />

            <AssignCaregiverModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setSelectedAllocationForReassign(null);
                }}
                allocation={selectedAllocationForReassign}
                unallocatedList={unallocatedAdmissions}
                staffList={staffList}
                onAssign={handleAssignCaregiver}
                activeUnitId={activeUnitId}
            />

            <ClientDetailsDrawer
                isOpen={Boolean(selectedClientForDetails)}
                onClose={() => setSelectedClientForDetails(null)}
                client={selectedClientForDetails}
            />

            <VisitCheckInModal
                isOpen={Boolean(checkInVisit)}
                onClose={() => setCheckInVisit(null)}
                onConfirm={handleConfirmCheckIn}
                visit={checkInVisit}
                isSubmitting={isActionSubmitting}
            />

            <VisitCheckOutModal
                isOpen={Boolean(checkOutVisit)}
                onClose={() => setCheckOutVisit(null)}
                onConfirm={handleConfirmCheckOut}
                visit={checkOutVisit}
                isSubmitting={isActionSubmitting}
            />

            <CareDeliveryModal
                isOpen={Boolean(careDeliveryContext)}
                onClose={() => setCareDeliveryContext(null)}
                patientId={careDeliveryContext?.patientId || ''}
                patientName={careDeliveryContext?.patientName}
                activeUnitId={activeUnitId}
            />

            <ServiceClosureModal
                isOpen={Boolean(closureTarget)}
                onClose={() => setClosureTarget(null)}
                admission={closureTarget?.admission || null}
                contract={closureTarget?.contract || null}
                onClosureComplete={refreshData}
            />

            <PrepareInvoiceModal
                isOpen={Boolean(invoiceTarget)}
                onClose={() => setInvoiceTarget(null)}
                admission={invoiceTarget?.admission || null}
                contract={invoiceTarget?.contract || null}
                onInvoiceCreated={async () => {
                    await refreshData();
                }}
                activeUnitId={activeUnitId}
            />
        </div>
    );
}

export default HomeCareWorkspace;
