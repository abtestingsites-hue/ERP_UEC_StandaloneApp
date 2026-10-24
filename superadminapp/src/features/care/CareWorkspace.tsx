import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Activity,
    ClipboardList,
    ShieldCheck,
    Stethoscope,
    HeartPulse,
    Pill,
    Apple,
    PackageCheck,
    AlertTriangle,
    Receipt,
    Building2,
    CalendarCheck,
    type LucideIcon
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useActiveUnit } from '../../context/useActiveUnit';
import { careService } from './care.service';
import type { MedicalAssignment } from './care.types';

interface CareTabItem {
    id: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
}

// Tabs
import { ManagerOverviewTab } from './tabs/ManagerOverviewTab';
import { DailyOperationsTab } from './tabs/DailyOperationsTab';
import { AssignmentsTab } from './tabs/AssignmentsTab';
import { DutyApprovalTab } from './tabs/DutyApprovalTab';
import { NurseShiftTab } from './tabs/NurseShiftTab';
import { MonitoringAlertsTab } from './tabs/MonitoringAlertsTab';
import { MedicationTab } from './tabs/MedicationTab';
import { AdlNutritionTab } from './tabs/AdlNutritionTab';
import { MedicineRequestsTab } from './tabs/MedicineRequestsTab';
import { IncidentsTab } from './tabs/IncidentsTab';
import { RevenueSheetTab } from './tabs/RevenueSheetTab';

// Modals
import { NewAssignmentModal } from './components/NewAssignmentModal';
import { DutyApprovalModal } from './components/DutyApprovalModal';
import { ClinicalDutyModal } from './components/ClinicalDutyModal';

import { useAuth } from '../auth/useAuth';
import { isSuperAdmin, getRoleName } from '../../utils/permissions';

export function CareWorkspace() {
    const { session } = useAuth();
    const user = session?.user;
    const roleName = getRoleName(user).toUpperCase().replace(/\s+/g, '_');
    const isManager = isSuperAdmin(user) || ['NURSING_MANAGER', 'MEDICAL_MANAGER', 'ADMIN', 'UNCF_ADMIN'].includes(roleName);

    const [searchParams, setSearchParams] = useSearchParams();
    const managerOnlyTabs = ['overview', 'assignments', 'approvals', 'monitoring'];
    const rawTab = searchParams.get('tab');
    const paramTab = rawTab ? rawTab.replace(/_/g, '-') : null;
    const activeTab = (!isManager && managerOnlyTabs.includes(paramTab || ''))
        ? 'my-shift'
        : (paramTab || (isManager ? 'overview' : 'my-shift'));

    const roleMode: 'manager' | 'staff' = isManager ? 'manager' : 'staff';

    const { activeUnitName, hasExplicitAllUnits, activeUnitId } = useActiveUnit();

    // Modals state
    const [isNewAssignmentOpen, setIsNewAssignmentOpen] = useState(false);
    const [approvalDuty, setApprovalDuty] = useState<MedicalAssignment | null>(null);
    const [clinicalDuty, setClinicalDuty] = useState<MedicalAssignment | null>(null);
    const [waitingCount, setWaitingCount] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Refresh pending approval counter
    useEffect(() => {
        let isMounted = true;
        careService.getAssignments({ status: 'WAITING_APPROVAL', unitId: activeUnitId }).then((res) => {
            if (!isMounted) return;
            setWaitingCount(res.length);
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

    const handleDataMutated = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    const managerTabs: CareTabItem[] = [
        { id: 'overview', label: 'Operations Overview', icon: Activity },
        { id: 'daily-operations', label: 'Daily Operations', icon: CalendarCheck },
        { id: 'assignments', label: 'Staff Assignments', icon: ClipboardList },
        { id: 'approvals', label: 'Duty Approvals', icon: ShieldCheck, badge: waitingCount },
        { id: 'monitoring', label: 'Patient Monitoring', icon: HeartPulse },
        { id: 'revenue', label: 'Item Charges & Revenue', icon: Receipt },
        { id: 'medication', label: 'Medication Plans', icon: Pill },
        { id: 'adl-nutrition', label: 'ADL & Nutrition', icon: Apple },
        { id: 'medicine-requests', label: 'Medicine Requests', icon: PackageCheck },
        { id: 'incidents', label: 'Clinical Incidents', icon: AlertTriangle }
    ];

    const staffTabs: CareTabItem[] = [
        { id: 'my-shift', label: 'My Shift & Duties', icon: Stethoscope },
        { id: 'daily-operations', label: 'Daily Operations', icon: CalendarCheck },
        { id: 'revenue', label: 'Patient Item Charges', icon: Receipt },
        { id: 'medication', label: 'Medication Admin', icon: Pill },
        { id: 'adl-nutrition', label: 'ADL & Nutrition', icon: Apple },
        { id: 'medicine-requests', label: 'Medicine Requests', icon: PackageCheck },
        { id: 'incidents', label: 'Report Incident', icon: AlertTriangle }
    ];

    const currentTabs = roleMode === 'staff' ? staffTabs : managerTabs;

    return (
        <div className="adm-workspace">
            <PageHeader
                eyebrow="BUSINESS DOMAIN · CLINICAL INHOUSE CARE"
                title="Inhouse Care & Nursing Operations"
                description="Resident clinical care execution, duty shifts, daily care checklists, medication administration, and nursing manager verification."
                action={
                    <div className="adm-header-action-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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

            {/* Navigation Tabs Bar */}
            <div className="adm-tabs-nav-bar">
                <nav className="adm-tabs-list" aria-label="Inhouse Care Domain Navigation">
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
            <div className="adm-tab-body" style={{ marginTop: 20 }}>
                {activeTab === 'overview' && (
                    <ManagerOverviewTab
                        activeUnitId={activeUnitId}
                        onAssignDuty={() => setIsNewAssignmentOpen(true)}
                        onReviewDuty={(duty) => setApprovalDuty(duty)}
                        onViewApprovalQueue={() => handleTabChange('approvals')}
                    />
                )}

                {activeTab === 'daily-operations' && (
                    <DailyOperationsTab activeUnitId={activeUnitId} />
                )}

                {activeTab === 'assignments' && (
                    <AssignmentsTab
                        activeUnitId={activeUnitId}
                        onAssignDuty={() => setIsNewAssignmentOpen(true)}
                        onLaunchDutyWorkspace={(duty) => setClinicalDuty(duty)}
                        onReviewApproval={(duty) => setApprovalDuty(duty)}
                    />
                )}

                {activeTab === 'approvals' && (
                    <DutyApprovalTab
                        activeUnitId={activeUnitId}
                        onOpenReviewModal={(duty) => setApprovalDuty(duty)}
                    />
                )}

                {activeTab === 'my-shift' && (
                    <NurseShiftTab
                        activeUnitId={activeUnitId}
                        onLaunchDutyWorkspace={(duty) => setClinicalDuty(duty)}
                        isManager={isManager}
                    />
                )}

                {activeTab === 'monitoring' && (
                    <MonitoringAlertsTab activeUnitId={activeUnitId} />
                )}

                {activeTab === 'revenue' && (
                    <RevenueSheetTab activeUnitId={activeUnitId} />
                )}

                {activeTab === 'medication' && (
                    <MedicationTab activeUnitId={activeUnitId} isManager={roleMode === 'manager'} />
                )}

                {activeTab === 'adl-nutrition' && (
                    <AdlNutritionTab activeUnitId={activeUnitId} isManager={roleMode === 'manager'} />
                )}

                {activeTab === 'medicine-requests' && (
                    <MedicineRequestsTab activeUnitId={activeUnitId} isManager={roleMode === 'manager'} />
                )}

                {activeTab === 'incidents' && (
                    <IncidentsTab activeUnitId={activeUnitId} isManager={roleMode === 'manager'} />
                )}
            </div>

            {/* Modals */}
            <NewAssignmentModal
                isOpen={isNewAssignmentOpen}
                onClose={() => setIsNewAssignmentOpen(false)}
                onSuccess={handleDataMutated}
                activeUnitId={activeUnitId}
            />

            <DutyApprovalModal
                isOpen={Boolean(approvalDuty)}
                assignment={approvalDuty}
                onClose={() => setApprovalDuty(null)}
                onSuccess={handleDataMutated}
                activeUnitId={activeUnitId}
            />

            <ClinicalDutyModal
                isOpen={Boolean(clinicalDuty)}
                assignment={clinicalDuty}
                onClose={() => setClinicalDuty(null)}
                onSuccess={handleDataMutated}
                activeUnitId={activeUnitId}
            />
        </div>
    );
}
