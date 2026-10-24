import { useState, useEffect } from 'react';
import {
    X,
    CheckCircle,
    AlertCircle,
    DollarSign,
    Activity,
    PackageCheck,
    Check,
    Printer
} from 'lucide-react';
import { admissionsService } from '../admissions.service';
import type { AdmissionRecord, ServiceClosure } from '../admissions.types';

interface ClosureAgreementModalProps {
    admission: AdmissionRecord;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ClosureAgreementModal({ admission, isOpen, onClose, onSuccess }: ClosureAgreementModalProps) {
    const [closure, setClosure] = useState<ServiceClosure | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [closingRemarks, setClosingRemarks] = useState('');
    const [executedSuccess, setExecutedSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen || !admission?.id) return;
        let isMounted = true;
        const fetchClosure = async () => {
            try {
                const data = await admissionsService.startOrFetchClosure(admission.id);
                if (isMounted) {
                    setClosure(data);
                    setLoading(false);
                    setError(null);
                }
            } catch (err: unknown) {
                if (isMounted) {
                    const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load closure agreement';
                    setError(message);
                    setLoading(false);
                }
            }
        };
        void fetchClosure();
        return () => {
            isMounted = false;
        };
    }, [isOpen, admission?.id]);

    if (!isOpen) return null;

    const handleClearance = async (type: 'MEDICAL' | 'FINANCE' | 'ASSET') => {
        if (!closure) return;
        setError(null);

        if (type === 'FINANCE' && typeof closure.outstandingBalance === 'number' && closure.outstandingBalance > 0) {
            setError(`Finance clearance cannot be completed. Outstanding ledger balance: ₹${closure.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Please settle all charges first.`);
            return;
        }

        try {
            setActionLoading(true);
            const updated = await admissionsService.updateClearance(closure.id, type);
            setClosure(prev => prev ? { ...prev, ...updated, outstandingBalance: prev.outstandingBalance } : updated);
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to update clearance';
            setError(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!closure || closure.status !== 'READY') return;

        try {
            setActionLoading(true);
            setError(null);
            const executed = await admissionsService.executeClosure(closure.id, closingRemarks || 'Discharge and relieving executed via SuperAdminApp');
            setClosure(executed);
            setExecutedSuccess(true);
            onSuccess();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to execute relieving';
            setError(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePrintSummary = () => {
        window.print();
    };

    const patientName = admission.patient?.name || 'Resident';
    const balance = closure?.outstandingBalance ?? 0;
    const canClearFinance = balance <= 0;
    const isReadyToExecute = closure?.status === 'READY' || (closure?.medicalCleared && closure?.financeCleared && closure?.assetCleared && closure?.status !== 'EXECUTED');

    return (
        <div className="adm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--lg" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="adm-modal-header">
                    <div>
                        <div className="adm-modal-kicker">RESIDENT DISCHARGE & RELIEVING</div>
                        <h2 className="adm-modal-title">Service Closing Agreement</h2>
                        <p className="adm-modal-subtitle">
                            Resident: <strong>{patientName}</strong> · Room: <strong>{admission.room || '-'} / {admission.bed || '-'}</strong>
                        </p>
                    </div>
                    <button className="adm-modal-close" onClick={onClose} type="button" aria-label="Close modal">
                        <X size={18} />
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="adm-alert adm-alert--error" style={{ margin: '16px 24px 0' }}>
                        <AlertCircle size={16} />
                        <div>
                            <strong>Clearance Warning</strong>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Banner */}
                {executedSuccess && (
                    <div className="adm-alert adm-alert--success" style={{ margin: '16px 24px 0' }}>
                        <CheckCircle size={16} />
                        <div>
                            <strong>Discharge Executed Successfully</strong>
                            <p>Resident status updated to DISCHARGED. Bed is released and service contract completed.</p>
                        </div>
                    </div>
                )}

                {/* Modal Body */}
                <div className="adm-modal-body">
                    {loading ? (
                        <div className="adm-loading-state">
                            <span className="adm-spinner" />
                            <p>Loading closure checklist and verifying ledger balance...</p>
                        </div>
                    ) : closure ? (
                        <div className="adm-closure-flow">
                            {/* Summary Card */}
                            <div className="adm-closure-summary-card">
                                <div className="adm-summary-col">
                                    <span className="adm-summary-label">Agreement Lifecycle Status</span>
                                    <div className="adm-summary-value-group">
                                        <span className={`adm-badge adm-badge--${closure.status === 'EXECUTED' ? 'neutral' : closure.status === 'READY' ? 'success' : 'warning'}`}>
                                            {closure.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="adm-summary-col adm-summary-col--right">
                                    <span className="adm-summary-label">Outstanding Ledger Balance</span>
                                    <div className={`adm-summary-amount ${balance > 0 ? 'adm-summary-amount--due' : 'adm-summary-amount--settled'}`}>
                                        ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <span className="adm-summary-hint">
                                        {balance > 0 ? 'Requires financial settlement prior to discharge' : 'Ledger settled (Zero balance)'}
                                    </span>
                                </div>
                            </div>

                            {/* Clearances Checklist */}
                            <div className="adm-checklist-card">
                                <h4 className="adm-checklist-title">Pre-Discharge Clearance Verification</h4>
                                <div className="adm-checklist-items">
                                    {/* 1. Medical Clearance */}
                                    <div className={`adm-clearance-item ${closure.medicalCleared ? 'adm-clearance-item--cleared' : ''}`}>
                                        <div className="adm-clearance-icon adm-clearance-icon--medical">
                                            <Activity size={18} />
                                        </div>
                                        <div className="adm-clearance-info">
                                            <div className="adm-clearance-head">
                                                <h5>Medical & Clinical Clearance</h5>
                                                {closure.medicalCleared ? (
                                                    <span className="adm-pill adm-pill--success"><Check size={12} /> Cleared</span>
                                                ) : (
                                                    <span className="adm-pill adm-pill--pending">Pending Verification</span>
                                                )}
                                            </div>
                                            <p>Physician discharge notes, medication handover summary, and clinical stability verification.</p>
                                        </div>
                                        <div className="adm-clearance-action">
                                            {!closure.medicalCleared && closure.status !== 'EXECUTED' && (
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--sm adm-btn--secondary"
                                                    onClick={() => handleClearance('MEDICAL')}
                                                    disabled={actionLoading}
                                                >
                                                    Clear Medical
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Finance Clearance */}
                                    <div className={`adm-clearance-item ${closure.financeCleared ? 'adm-clearance-item--cleared' : ''}`}>
                                        <div className="adm-clearance-icon adm-clearance-icon--finance">
                                            <DollarSign size={18} />
                                        </div>
                                        <div className="adm-clearance-info">
                                            <div className="adm-clearance-head">
                                                <h5>Finance & Ledger Clearance</h5>
                                                {closure.financeCleared ? (
                                                    <span className="adm-pill adm-pill--success"><Check size={12} /> Cleared</span>
                                                ) : (
                                                    <span className="adm-pill adm-pill--pending">
                                                        {canClearFinance ? 'Ready for Clearance' : 'Dues Pending'}
                                                    </span>
                                                )}
                                            </div>
                                            <p>Complete reconciliation of daily cost ledger, medical consumption, and bed charges.</p>
                                            {balance > 0 && (
                                                <div className="adm-clearance-alert">
                                                    Outstanding dues: ₹{balance.toFixed(2)}. Settle ledger in Finance before clearing.
                                                </div>
                                            )}
                                        </div>
                                        <div className="adm-clearance-action">
                                            {!closure.financeCleared && closure.status !== 'EXECUTED' && (
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--sm adm-btn--secondary"
                                                    onClick={() => handleClearance('FINANCE')}
                                                    disabled={actionLoading || !canClearFinance}
                                                    title={!canClearFinance ? 'Cannot clear finance with outstanding balance' : undefined}
                                                >
                                                    Clear Finance
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Asset Clearance */}
                                    <div className={`adm-clearance-item ${closure.assetCleared ? 'adm-clearance-item--cleared' : ''}`}>
                                        <div className="adm-clearance-icon adm-clearance-icon--asset">
                                            <PackageCheck size={18} />
                                        </div>
                                        <div className="adm-clearance-info">
                                            <div className="adm-clearance-head">
                                                <h5>Facility Asset & Inventory Clearance</h5>
                                                {closure.assetCleared ? (
                                                    <span className="adm-pill adm-pill--success"><Check size={12} /> Cleared</span>
                                                ) : (
                                                    <span className="adm-pill adm-pill--pending">Pending Verification</span>
                                                )}
                                            </div>
                                            <p>Return of facility mobility equipment, room keys, and loaner assistive devices.</p>
                                        </div>
                                        <div className="adm-clearance-action">
                                            {!closure.assetCleared && closure.status !== 'EXECUTED' && (
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn--sm adm-btn--secondary"
                                                    onClick={() => handleClearance('ASSET')}
                                                    disabled={actionLoading}
                                                >
                                                    Clear Asset
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Execution or Completed Section */}
                            {closure.status === 'EXECUTED' ? (
                                <div className="adm-executed-box">
                                    <div className="adm-executed-head">
                                        <CheckCircle size={20} className="adm-text-success" />
                                        <div>
                                            <h4>Discharge & Service Relieving Completed</h4>
                                            <p>Closing remarks: {closure.closingRemarks || 'Standard discharge executed.'}</p>
                                        </div>
                                    </div>
                                    <div className="adm-action-row" style={{ marginTop: 12 }}>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--secondary"
                                            onClick={handlePrintSummary}
                                        >
                                            <Printer size={15} />
                                            <span>Print Discharge Summary</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="adm-execution-box">
                                    <label className="adm-field">
                                        <span className="adm-field-label">Discharge Remarks & Handover Notes</span>
                                        <textarea
                                            className="adm-textarea"
                                            rows={2}
                                            value={closingRemarks}
                                            onChange={(e) => setClosingRemarks(e.target.value)}
                                            placeholder="Enter relieving remarks, guardian handover confirmation, or forwarding address..."
                                        />
                                    </label>
                                    <div className="adm-execution-action">
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--primary"
                                            disabled={!isReadyToExecute || actionLoading}
                                            onClick={handleExecute}
                                        >
                                            <CheckCircle size={15} />
                                            <span>{actionLoading ? 'Executing Discharge...' : 'Execute Relieving & Complete Discharge'}</span>
                                        </button>
                                        {!isReadyToExecute && (
                                            <span className="adm-execution-hint">
                                                All 3 clearances (Medical, Finance, Asset) must be satisfied to execute discharge.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Modal Footer */}
                <div className="adm-modal-footer">
                    <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
