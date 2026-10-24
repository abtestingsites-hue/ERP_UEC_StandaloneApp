import { useSearchParams } from 'react-router-dom';
import {
    Users,
    UserPlus,
    UserCheck,
    History,
    LogOut,
    Building2,
    Archive
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useActiveUnit } from '../../context/useActiveUnit';
import { AdmissionsListTab } from './tabs/AdmissionsListTab';
import { HistoricalArchiveTab } from './tabs/HistoricalArchiveTab';
import { NewAdmissionTab } from './tabs/NewAdmissionTab';
import { PatientRegistrationTab } from './tabs/PatientRegistrationTab';
import { ExistingPatientTab } from './tabs/ExistingPatientTab';
import { RelievingDischargeTab } from './tabs/RelievingDischargeTab';
import type { Patient } from './admissions.types';
import { useState } from 'react';

export function AdmissionWorkspace() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'register';
    const [patientToAdmit, setPatientToAdmit] = useState<Patient | null>(null);

    const { activeUnitName, hasExplicitAllUnits, activeUnitId } = useActiveUnit();

    const handleTabChange = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    const tabs = [
        { id: 'register', label: 'Admissions Register', icon: Users },
        { id: 'archive', label: 'Discharged Archive', icon: Archive },
        { id: 'new', label: 'New Admission', icon: UserCheck },
        { id: 'patient', label: 'Patient Registration', icon: UserPlus },
        { id: 'existing', label: 'Existing Resident Onboarding', icon: History },
        { id: 'relieving', label: 'Relieving & Discharge', icon: LogOut }
    ];

    return (
        <div className="adm-workspace">
            <PageHeader
                eyebrow="BUSINESS DOMAIN · RESIDENT MANAGEMENT"
                title="Admission & Relieving"
                description="Resident intake management, bed allocation, legal care consent, and authorized multi-department relieving closures."
                action={
                    <div className="adm-header-action-group">
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

            {/* Navigation Tabs */}
            <div className="adm-tabs-nav-bar">
                <nav className="adm-tabs-list" aria-label="Admission and Relieving Workspaces">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                className={`adm-tab-btn ${isActive ? 'adm-tab-btn--active' : ''}`}
                                onClick={() => handleTabChange(tab.id)}
                                type="button"
                            >
                                <Icon size={15} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Body */}
            <div className="adm-tab-body">
                {activeTab === 'register' && (
                    <AdmissionsListTab
                        onNavigateNewAdmission={() => handleTabChange('new')}
                        onNavigateArchive={() => handleTabChange('archive')}
                    />
                )}
                {activeTab === 'archive' && (
                    <HistoricalArchiveTab
                        onNavigateActiveRegister={() => handleTabChange('register')}
                    />
                )}
                {activeTab === 'new' && (
                    <NewAdmissionTab
                        initialPatient={patientToAdmit}
                        onAdmissionCompleted={() => {
                            setPatientToAdmit(null);
                        }}
                        onNavigateRegisterPatient={() => handleTabChange('patient')}
                    />
                )}
                {activeTab === 'patient' && (
                    <PatientRegistrationTab
                        onPatientRegistered={() => {}}
                        onProceedToAdmission={(patient) => {
                            setPatientToAdmit(patient);
                            handleTabChange('new');
                        }}
                    />
                )}
                {activeTab === 'existing' && (
                    <ExistingPatientTab />
                )}
                {activeTab === 'relieving' && (
                    <RelievingDischargeTab />
                )}
            </div>
        </div>
    );
}
