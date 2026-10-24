import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    ShieldCheck,
    Users,
    Clock,
    Car,
    ArrowUpRight,
    FileText,
    Shield,
    Building2,
    type LucideIcon
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useActiveUnit } from '../../context/useActiveUnit';
import { visitorSecurityService } from './visitorSecurity.service';
import type {
    VisitorPass,
    GateEntry,
    CreateVehicleEntryPayload
} from './visitorSecurity.types';

// Tabs
import { VisitorDashboardTab } from './tabs/VisitorDashboardTab';
import { VisitorPassesTab } from './tabs/VisitorPassesTab';
import { GateQueueTab } from './tabs/GateQueueTab';
import { VehicleGateTab } from './tabs/VehicleGateTab';
import { ResidentOutingsTab } from './tabs/ResidentOutingsTab';
import { StaffMovementsTab } from './tabs/StaffMovementsTab';
import { DailyReportsTab } from './tabs/DailyReportsTab';

// Modals
import { NewVisitorPassModal } from './components/NewVisitorPassModal';
import { VisitorPassDetailsDrawer } from './components/VisitorPassDetailsDrawer';
import { GateCheckInModal } from './components/GateCheckInModal';
import { GateCheckOutModal } from './components/GateCheckOutModal';
import { VehicleEntryModal } from './components/VehicleEntryModal';

interface WorkspaceTabItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

export function VisitorSecurityWorkspace() {
    const [searchParams, setSearchParams] = useSearchParams();
    const roleMode = searchParams.get('role') || 'reception'; // 'reception' | 'security'
    const activeTab = searchParams.get('tab') || (roleMode === 'security' ? 'gate-queue' : 'overview');

    const { activeUnitName, hasExplicitAllUnits, activeUnitId } = useActiveUnit();

    // Modal States
    const [isNewPassOpen, setIsNewPassOpen] = useState(false);
    const [detailsPass, setDetailsPass] = useState<VisitorPass | null>(null);
    const [checkInEntry, setCheckInEntry] = useState<GateEntry | null>(null);
    const [checkOutEntry, setCheckOutEntry] = useState<GateEntry | null>(null);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

    // Refresh trigger for components that listen to updates
    const [refreshKey, setRefreshKey] = useState(0);
    const triggerRefresh = useCallback(() => {
        setRefreshKey((prev) => prev + 1);
    }, []);

    // Switch Role Mode
    const handleSwitchRoleMode = (mode: 'reception' | 'security') => {
        const defaultTab = mode === 'security' ? 'gate-queue' : 'overview';
        setSearchParams({ role: mode, tab: defaultTab });
    };

    // Switch Tab
    const handleSwitchTab = (tabId: string) => {
        setSearchParams({ role: roleMode, tab: tabId });
    };

    // Tab configurations by perspective
    const receptionTabs: WorkspaceTabItem[] = [
        { id: 'overview', label: 'Visitor Dashboard', icon: ShieldCheck },
        { id: 'passes', label: 'Visitor Passes', icon: Users },
        { id: 'reports', label: 'Daily Reports', icon: FileText }
    ];

    const securityTabs: WorkspaceTabItem[] = [
        { id: 'gate-queue', label: 'Security Gate Queue', icon: Shield },
        { id: 'vehicle-gate', label: 'Vehicle Gate Movements', icon: Car },
        { id: 'resident-outings', label: 'Resident Outings', icon: ArrowUpRight },
        { id: 'staff-movements', label: 'Staff Movements', icon: Users },
        { id: 'passes', label: 'Pass Lookup', icon: Clock }
    ];

    const currentTabs = roleMode === 'security' ? securityTabs : receptionTabs;

    // Actions
    const handleCheckoutPass = async (passId: string) => {
        await visitorSecurityService.checkoutPass(passId, activeUnitId);
        triggerRefresh();
        if (detailsPass?.id === passId) {
            setDetailsPass(null);
        }
    };

    const handleConfirmGateCheckIn = async (entryId: string, remarks?: string) => {
        await visitorSecurityService.checkInExpectedVisitor(entryId, remarks, activeUnitId);
        triggerRefresh();
    };

    const handleConfirmGateCheckOut = async (entryId: string, remarks?: string) => {
        await visitorSecurityService.checkoutGateEntry(entryId, remarks, activeUnitId);
        triggerRefresh();
    };

    const handleRecordVehicleEntry = async (payload: CreateVehicleEntryPayload) => {
        await visitorSecurityService.recordVehicleEntry(payload, activeUnitId);
        triggerRefresh();
    };

    const handleRecordVehicleExit = async (movementId: string) => {
        await visitorSecurityService.recordVehicleExit(movementId, activeUnitId);
        triggerRefresh();
    };

    const handleRecordResidentReturn = async (outingId: string) => {
        await visitorSecurityService.recordResidentReturn(outingId, activeUnitId);
        triggerRefresh();
    };

    return (
        <div className="visitor-security-workspace" style={{ paddingBottom: '3rem' }}>
            <PageHeader
                eyebrow="Business Domain"
                title="Visitor & Security Management"
                description="Visitor profile lookup, OTP verification, visitor pass issuance, real-time security gate queue, vehicle movements, and resident outings."
            />

            {/* Operating Unit & Context Banner */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: '8px',
                            background: 'rgba(217, 119, 6, 0.12)',
                            color: '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Building2 size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Operating Unit Context
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {activeUnitName}
                            {hasExplicitAllUnits && (
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        marginLeft: '0.5rem',
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        background: 'rgba(217, 119, 6, 0.15)',
                                        color: '#d97706'
                                    }}
                                >
                                    Organization Wide
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Perspective Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Workspace Mode:</span>
                    <div
                        style={{
                            display: 'flex',
                            background: 'rgba(0, 0, 0, 0.05)',
                            padding: '3px',
                            borderRadius: '8px'
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => handleSwitchRoleMode('reception')}
                            style={{
                                border: 'none',
                                background: roleMode === 'reception' ? 'var(--surface-color)' : 'transparent',
                                color: roleMode === 'reception' ? '#d97706' : 'var(--text-secondary)',
                                fontWeight: roleMode === 'reception' ? 600 : 400,
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: roleMode === 'reception' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <Users size={15} />
                            Front Desk & Reception
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchRoleMode('security')}
                            style={{
                                border: 'none',
                                background: roleMode === 'security' ? 'var(--surface-color)' : 'transparent',
                                color: roleMode === 'security' ? '#10b981' : 'var(--text-secondary)',
                                fontWeight: roleMode === 'security' ? 600 : 400,
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: roleMode === 'security' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <Shield size={15} />
                            Security Gate & Operations
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div
                style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '1.5rem',
                    overflowX: 'auto',
                    gap: '0.5rem'
                }}
            >
                {currentTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleSwitchTab(tab.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: isActive ? '2px solid #d97706' : '2px solid transparent',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: isActive ? 600 : 500,
                                padding: '0.75rem 1rem',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Icon size={16} color={isActive ? '#d97706' : 'currentColor'} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Active Tab View */}
            <div key={`${activeTab}-${refreshKey}`}>
                {activeTab === 'overview' && (
                    <VisitorDashboardTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                        onOpenNewPass={() => setIsNewPassOpen(true)}
                        onViewPass={(pass) => setDetailsPass(pass)}
                        onNavigateTab={handleSwitchTab}
                    />
                )}

                {activeTab === 'passes' && (
                    <VisitorPassesTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                        onOpenNewPass={() => setIsNewPassOpen(true)}
                        onViewPass={(pass) => setDetailsPass(pass)}
                        onCheckoutPass={handleCheckoutPass}
                    />
                )}

                {activeTab === 'gate-queue' && (
                    <GateQueueTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                        onCheckIn={(entry) => setCheckInEntry(entry)}
                        onCheckOut={(entry) => setCheckOutEntry(entry)}
                    />
                )}

                {activeTab === 'vehicle-gate' && (
                    <VehicleGateTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                        onOpenVehicleEntry={() => setIsVehicleModalOpen(true)}
                        onRecordExit={handleRecordVehicleExit}
                    />
                )}

                {activeTab === 'resident-outings' && (
                    <ResidentOutingsTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                        onRecordReturn={handleRecordResidentReturn}
                    />
                )}

                {activeTab === 'staff-movements' && (
                    <StaffMovementsTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                    />
                )}

                {activeTab === 'reports' && (
                    <DailyReportsTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                    />
                )}
            </div>

            {/* Modals & Drawers */}
            <NewVisitorPassModal
                isOpen={isNewPassOpen}
                onClose={() => setIsNewPassOpen(false)}
                onSuccess={({ pass }) => {
                    setIsNewPassOpen(false);
                    triggerRefresh();
                    setDetailsPass(pass);
                }}
                activeUnitId={activeUnitId}
            />

            <VisitorPassDetailsDrawer
                isOpen={Boolean(detailsPass)}
                onClose={() => setDetailsPass(null)}
                pass={detailsPass}
                onCheckout={handleCheckoutPass}
            />

            <GateCheckInModal
                isOpen={Boolean(checkInEntry)}
                onClose={() => setCheckInEntry(null)}
                entry={checkInEntry}
                onConfirm={handleConfirmGateCheckIn}
            />

            <GateCheckOutModal
                isOpen={Boolean(checkOutEntry)}
                onClose={() => setCheckOutEntry(null)}
                entry={checkOutEntry}
                onConfirm={handleConfirmGateCheckOut}
            />

            <VehicleEntryModal
                isOpen={isVehicleModalOpen}
                onClose={() => setIsVehicleModalOpen(false)}
                onSubmit={handleRecordVehicleEntry}
            />
        </div>
    );
}
