import {
    X,
    User,
    Activity,
    Bed,
    FileCheck
} from 'lucide-react';
import type { AdmissionRecord } from '../admissions.types';

interface AdmissionDetailsModalProps {
    admission: AdmissionRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onManageClosure?: (admission: AdmissionRecord) => void;
}

export function AdmissionDetailsModal({
    admission,
    isOpen,
    onClose,
    onManageClosure
}: AdmissionDetailsModalProps) {
    if (!isOpen || !admission) return null;

    const patient = admission.patient;

    return (
        <div className="adm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--md" onClick={(e) => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <div>
                        <div className="adm-modal-kicker">ADMISSION RECORD</div>
                        <h2 className="adm-modal-title">{patient?.name || 'Inpatient Profile'}</h2>
                        <p className="adm-modal-subtitle">
                            Admission ID: <code style={{ fontSize: '11px' }}>{admission.id}</code>
                        </p>
                    </div>
                    <button className="adm-modal-close" onClick={onClose} type="button" aria-label="Close modal">
                        <X size={18} />
                    </button>
                </div>

                <div className="adm-modal-body">
                    <div className="adm-details-grid">
                        {/* Demographics Card */}
                        <div className="adm-details-card">
                            <h4 className="adm-details-card-title">
                                <User size={15} />
                                <span>Patient Details</span>
                            </h4>
                            <div className="adm-details-list">
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Full Name</span>
                                    <span className="adm-detail-value">{patient?.name || '-'}</span>
                                </div>
                                {patient?.elderId && (
                                    <div className="adm-detail-row">
                                        <span className="adm-detail-label">Elder Identifier</span>
                                        <span className="adm-detail-value font-mono text-blue-600">{patient.elderId}</span>
                                    </div>
                                )}
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Age / Gender</span>
                                    <span className="adm-detail-value">
                                        {patient?.age ? `${patient.age} yrs` : '-'} · {patient?.gender || '-'}
                                    </span>
                                </div>
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Blood Group</span>
                                    <span className="adm-detail-value">{patient?.bloodGroup || '-'}</span>
                                </div>
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Phone</span>
                                    <span className="adm-detail-value">{patient?.phone || '-'}</span>
                                </div>
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Emergency Contact</span>
                                    <span className="adm-detail-value">{patient?.emergencyContact || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stay & Room Details */}
                        <div className="adm-details-card">
                            <h4 className="adm-details-card-title">
                                <Bed size={15} />
                                <span>Location & Stay Allocation</span>
                            </h4>
                            <div className="adm-details-list">
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Status</span>
                                    <span className="adm-detail-value">
                                        <span className={`adm-badge adm-badge--${admission.status === 'ACTIVE' ? 'success' : admission.status === 'DISCHARGED' ? 'neutral' : 'info'}`}>
                                            {admission.status}
                                        </span>
                                    </span>
                                </div>
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Floor</span>
                                    <span className="adm-detail-value">{admission.floor || 'Standard Floor'}</span>
                                </div>
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Room</span>
                                    <span className="adm-detail-value">{admission.room || '-'}</span>
                                </div>
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Bed</span>
                                    <span className="adm-detail-value font-semibold">{admission.bed || '-'}</span>
                                </div>
                                <div className="adm-detail-row">
                                    <span className="adm-detail-label">Admitted On</span>
                                    <span className="adm-detail-value">
                                        {new Date(admission.admittedAt).toLocaleString('en-IN', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </span>
                                </div>
                                {admission.dischargedAt && (
                                    <div className="adm-detail-row">
                                        <span className="adm-detail-label">Discharged On</span>
                                        <span className="adm-detail-value font-medium" style={{ color: '#dc2626' }}>
                                            {new Date(admission.dischargedAt).toLocaleString('en-IN', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Relieving Clearance & Service Closure (if available) */}
                        {admission.serviceClosure && (
                            <div className="adm-details-card" style={{ gridColumn: '1 / -1' }}>
                                <h4 className="adm-details-card-title">
                                    <FileCheck size={15} />
                                    <span>Relieving & Service Closure Clearances</span>
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Medical Clearance</span>
                                        <span className={`adm-badge adm-badge--${admission.serviceClosure.medicalCleared ? 'success' : 'neutral'}`} style={{ marginTop: 4 }}>
                                            {admission.serviceClosure.medicalCleared ? 'Cleared' : 'Pending'}
                                        </span>
                                    </div>
                                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Finance Clearance</span>
                                        <span className={`adm-badge adm-badge--${admission.serviceClosure.financeCleared ? 'success' : 'neutral'}`} style={{ marginTop: 4 }}>
                                            {admission.serviceClosure.financeCleared ? 'Cleared' : 'Pending'}
                                        </span>
                                    </div>
                                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Asset Clearance</span>
                                        <span className={`adm-badge adm-badge--${admission.serviceClosure.assetCleared ? 'success' : 'neutral'}`} style={{ marginTop: 4 }}>
                                            {admission.serviceClosure.assetCleared ? 'Cleared' : 'Pending'}
                                        </span>
                                    </div>
                                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Agreement Status</span>
                                        <span className="adm-badge adm-badge--neutral" style={{ marginTop: 4 }}>
                                            {admission.serviceClosure.status}
                                        </span>
                                    </div>
                                </div>
                                {admission.serviceClosure.closingRemarks && (
                                    <div className="adm-detail-row" style={{ marginTop: 8 }}>
                                        <span className="adm-detail-label">Closing Remarks</span>
                                        <span className="adm-detail-value italic">{admission.serviceClosure.closingRemarks}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Clinical Triage */}
                        <div className="adm-details-card" style={{ gridColumn: '1 / -1' }}>
                            <h4 className="adm-details-card-title">
                                <Activity size={15} />
                                <span>Clinical Status & Condition</span>
                            </h4>
                            <div className="adm-details-chips">
                                <div className="adm-chip-box">
                                    <span className="adm-chip-label">Priority Level</span>
                                    <span className={`adm-badge adm-badge--${admission.admissionPriority === 'CRITICAL' || admission.admissionPriority === 'HIGH' ? 'error' : 'info'}`}>
                                        {admission.admissionPriority || 'NORMAL'}
                                    </span>
                                </div>
                                <div className="adm-chip-box">
                                    <span className="adm-chip-label">Health Condition</span>
                                    <span className="adm-badge adm-badge--neutral">
                                        {admission.healthCondition || 'STABLE'}
                                    </span>
                                </div>
                                <div className="adm-chip-box">
                                    <span className="adm-chip-label">Mobility / Clinical Status</span>
                                    <span className="adm-badge adm-badge--neutral">
                                        {admission.clinicalStatus || 'AMBULATORY'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="adm-modal-footer">
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose}>
                        Close
                    </button>
                    {admission.status === 'ACTIVE' && onManageClosure && (
                        <button
                            type="button"
                            className="adm-btn adm-btn--primary"
                            onClick={() => {
                                onClose();
                                onManageClosure(admission);
                            }}
                        >
                            <FileCheck size={14} />
                            <span>Manage Relieving / Discharge</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
