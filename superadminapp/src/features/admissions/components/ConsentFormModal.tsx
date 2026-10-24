import { useEffect } from 'react';
import { X, FileText, Shield, Stethoscope, Lock, CheckCircle2 } from 'lucide-react';

interface ConsentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientName?: string;
}

export function ConsentFormModal({ isOpen, onClose, patientName }: ConsentFormModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="adm-modal-backdrop" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
            aria-labelledby="consent-modal-title"
        >
            <div 
                className="adm-modal-container adm-modal-container--lg" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '680px' }}
            >
                <div className="adm-modal-header">
                    <div>
                        <div className="adm-modal-kicker">LEGAL CONSENT DOCUMENT · VERSION 1.0</div>
                        <h2 className="adm-modal-title" id="consent-modal-title">
                            Resident Admission Consent & Care Agreement
                        </h2>
                        <p className="adm-modal-subtitle">
                            Standard statutory admission consent covering institutional care, medical protocols, and privacy guidelines.
                        </p>
                    </div>
                    <button 
                        className="adm-modal-close" 
                        onClick={onClose} 
                        type="button" 
                        aria-label="Close consent form dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="adm-modal-body" style={{ maxHeight: 'calc(80vh - 120px)' }}>
                    {patientName && (
                        <div 
                            style={{ 
                                padding: '10px 14px', 
                                background: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '8px', 
                                marginBottom: '16px',
                                fontSize: '13px',
                                color: '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <FileText size={16} className="text-blue-600" />
                            <span>Subject Resident: <strong>{patientName}</strong></span>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
                        {/* Summary Statutory Notice */}
                        <div 
                            style={{ 
                                padding: '12px 14px', 
                                background: '#eff6ff', 
                                border: '1px solid #bfdbfe', 
                                borderRadius: '8px',
                                color: '#1e40af',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px'
                            }}
                        >
                            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <strong style={{ display: 'block', marginBottom: '2px' }}>Statutory Admission Acknowledgment:</strong>
                                <em>"Resident and guardian acknowledge admission guidelines, medical emergency authorization, and facility terms of service."</em>
                            </div>
                        </div>

                        {/* Clause 1 */}
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px', fontSize: '14px', color: '#0f172a' }}>
                                <Shield size={16} style={{ color: '#2563eb' }} />
                                <span>1. Facility Terms of Service & Residential Care</span>
                            </h4>
                            <p style={{ margin: 0, color: '#475569' }}>
                                The resident and/or authorized guardian agrees to abide by the institutional rules, residential policies, safety standards, and community guidelines of the facility. Accommodation, dining, daily living assistance, and facility amenities will be provided in accordance with the allocated service plan and bed assignment.
                            </p>
                        </div>

                        {/* Clause 2 */}
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px', fontSize: '14px', color: '#0f172a' }}>
                                <Stethoscope size={16} style={{ color: '#2563eb' }} />
                                <span>2. Medical Treatment & Emergency Care Authorization</span>
                            </h4>
                            <p style={{ margin: 0, color: '#475569' }}>
                                General consent is granted to the clinical and nursing staff to perform vital monitoring, health assessments, routine medical nursing care, and administration of prescribed medications. In the event of an acute medical emergency, staff are authorized to initiate immediate emergency response protocols, life-support interventions, and transport the resident to the designated emergency tertiary hospital.
                            </p>
                        </div>

                        {/* Clause 3 */}
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px', fontSize: '14px', color: '#0f172a' }}>
                                <Lock size={16} style={{ color: '#2563eb' }} />
                                <span>3. Data Privacy & Clinical Records Governance</span>
                            </h4>
                            <p style={{ margin: 0, color: '#475569' }}>
                                The resident's health telemetry, clinical observations, and demographic records will be securely maintained in compliance with healthcare data protection and confidentiality standards. Information will only be disclosed to authorized attending physicians, clinical caregivers, and primary emergency contacts designated during intake.
                            </p>
                        </div>

                        {/* Clause 4 */}
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                <strong>Execution & Attestation:</strong> Checking the admission consent acknowledgement on the intake form certifies that the resident or legal representative has read, understood, and consented to these terms. A digital consent record (Version 1.0) is sealed upon admission confirmation.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="adm-modal-footer">
                    <button 
                        type="button" 
                        className="adm-btn adm-btn--primary" 
                        onClick={onClose}
                    >
                        Close Document
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConsentFormModal;
