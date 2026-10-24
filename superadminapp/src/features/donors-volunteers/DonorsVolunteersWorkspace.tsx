import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    HeartHandshake,
    Users,
    FolderKanban,
    Receipt,
    PiggyBank,
    Building2,
    type LucideIcon
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useActiveUnit } from '../../context/useActiveUnit';
import { donorsVolunteersService } from './donorsVolunteers.service';
import type { Donation } from './donorsVolunteers.types';

// Tabs
import { FoundationOverviewTab } from './tabs/FoundationOverviewTab';
import { DonationsRegisterTab } from './tabs/DonationsRegisterTab';
import { DonorDirectoryTab } from './tabs/DonorDirectoryTab';
import { FundingProjectsTab } from './tabs/FundingProjectsTab';
import { ProjectFinancialsTab } from './tabs/ProjectFinancialsTab';
import { VolunteersCommunityTab } from './tabs/VolunteersCommunityTab';

// Modals
import { NewDonationModal } from './components/NewDonationModal';
import { DonationReceiptDrawer } from './components/DonationReceiptDrawer';
import { NewProjectModal } from './components/NewProjectModal';

interface WorkspaceTabItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

export function DonorsVolunteersWorkspace() {
    const [searchParams, setSearchParams] = useSearchParams();
    const roleMode = searchParams.get('role') || 'foundation'; // 'foundation' | 'projects'
    const activeTab = searchParams.get('tab') || (roleMode === 'projects' ? 'projects' : 'overview');

    const { activeUnitName, hasExplicitAllUnits, activeUnitId } = useActiveUnit();

    // Modal States
    const [isNewDonationOpen, setIsNewDonationOpen] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

    // Refresh trigger
    const [refreshKey, setRefreshKey] = useState(0);
    const triggerRefresh = useCallback(() => {
        setRefreshKey((prev) => prev + 1);
    }, []);

    // Mode Switcher
    const handleSwitchRoleMode = (mode: 'foundation' | 'projects') => {
        const defaultTab = mode === 'projects' ? 'projects' : 'overview';
        setSearchParams({ role: mode, tab: defaultTab });
    };

    // Tab Switcher
    const handleSwitchTab = (tabId: string) => {
        setSearchParams({ role: roleMode, tab: tabId });
    };

    // Tab configurations by perspective
    const foundationTabs: WorkspaceTabItem[] = [
        { id: 'overview', label: 'Foundation Command Center', icon: HeartHandshake },
        { id: 'donations', label: 'Donations Register', icon: Receipt },
        { id: 'donors', label: 'Donor Directory', icon: Users },
        { id: 'volunteers', label: 'Volunteers & Outreach', icon: PiggyBank }
    ];

    const projectTabs: WorkspaceTabItem[] = [
        { id: 'projects', label: 'Charitable Projects', icon: FolderKanban },
        { id: 'financials', label: 'Allocations & Expenditures', icon: Receipt },
        { id: 'overview', label: 'Foundation Overview', icon: HeartHandshake }
    ];

    const currentTabs = roleMode === 'projects' ? projectTabs : foundationTabs;

    const handleMarkSent = async (donationId: string) => {
        await donorsVolunteersService.markDonationReceiptSent(donationId, activeUnitId);
        triggerRefresh();
    };

    return (
        <div className="donors-volunteers-workspace" style={{ paddingBottom: '3rem' }}>
            <PageHeader
                eyebrow="Business Domain"
                title="Donors & Volunteers Management"
                description="Universal Nature Care and Cure Foundation (UNCF) philanthropic giving, 80G tax receipts, charitable initiatives, funding allocations, and community volunteers."
            />

            {/* Operating Unit Context & Perspective Switcher */}
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
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
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
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        color: '#10b981'
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
                            onClick={() => handleSwitchRoleMode('foundation')}
                            style={{
                                border: 'none',
                                background: roleMode === 'foundation' ? 'var(--surface-color)' : 'transparent',
                                color: roleMode === 'foundation' ? '#10b981' : 'var(--text-secondary)',
                                fontWeight: roleMode === 'foundation' ? 600 : 400,
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: roleMode === 'foundation' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <HeartHandshake size={15} />
                            Foundation & Donors
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchRoleMode('projects')}
                            style={{
                                border: 'none',
                                background: roleMode === 'projects' ? 'var(--surface-color)' : 'transparent',
                                color: roleMode === 'projects' ? '#3b82f6' : 'var(--text-secondary)',
                                fontWeight: roleMode === 'projects' ? 600 : 400,
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: roleMode === 'projects' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <FolderKanban size={15} />
                            Projects & Allocation
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
                                borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
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
                            <Icon size={16} color={isActive ? '#10b981' : 'currentColor'} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Active Tab View */}
            <div key={`${activeTab}-${refreshKey}`}>
                {activeTab === 'overview' && (
                    <FoundationOverviewTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                        onOpenNewDonation={() => setIsNewDonationOpen(true)}
                        onOpenNewProject={() => setIsNewProjectOpen(true)}
                        onViewDonation={(donation) => setSelectedDonation(donation)}
                        onNavigateTab={handleSwitchTab}
                    />
                )}

                {activeTab === 'donations' && (
                    <DonationsRegisterTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                        onOpenNewDonation={() => setIsNewDonationOpen(true)}
                        onViewDonation={(donation) => setSelectedDonation(donation)}
                        onMarkSent={handleMarkSent}
                    />
                )}

                {activeTab === 'donors' && (
                    <DonorDirectoryTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                    />
                )}

                {activeTab === 'projects' && (
                    <FundingProjectsTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                        onOpenNewProject={() => setIsNewProjectOpen(true)}
                    />
                )}

                {activeTab === 'financials' && (
                    <ProjectFinancialsTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                    />
                )}

                {activeTab === 'volunteers' && (
                    <VolunteersCommunityTab
                        unitId={activeUnitId}
                        unitName={activeUnitName}
                    />
                )}
            </div>

            {/* Modals & Drawers */}
            <NewDonationModal
                isOpen={isNewDonationOpen}
                onClose={() => setIsNewDonationOpen(false)}
                onSuccess={(donation) => {
                    setIsNewDonationOpen(false);
                    triggerRefresh();
                    setSelectedDonation(donation);
                }}
                activeUnitId={activeUnitId}
            />

            <DonationReceiptDrawer
                isOpen={Boolean(selectedDonation)}
                onClose={() => setSelectedDonation(null)}
                donation={selectedDonation}
                onMarkSent={handleMarkSent}
            />

            <NewProjectModal
                isOpen={isNewProjectOpen}
                onClose={() => setIsNewProjectOpen(false)}
                onSuccess={() => {
                    setIsNewProjectOpen(false);
                    triggerRefresh();
                }}
                activeUnitId={activeUnitId}
            />
        </div>
    );
}
