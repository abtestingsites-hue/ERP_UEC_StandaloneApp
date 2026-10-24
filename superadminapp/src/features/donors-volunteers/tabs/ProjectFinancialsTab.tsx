import React, { useState, useEffect } from 'react';
import {
    Search,
    RefreshCw,
    Plus,
    CheckCircle2,
    CreditCard,
    AlertCircle,
    X,
    FileText,
    Receipt,
    Wallet,
    TrendingDown
} from 'lucide-react';
import { donorsVolunteersService } from '../donorsVolunteers.service';
import type { 
    FundingAllocation, 
    ProjectExpenditure, 
    Project, 
    FundingSource, 
    ProjectCapacity 
} from '../donorsVolunteers.types';

interface ProjectFinancialsTabProps {
    unitId?: string | null;
    unitName: string;
}

export function ProjectFinancialsTab({
    unitId,
    unitName
}: ProjectFinancialsTabProps) {
    const [allocations, setAllocations] = useState<FundingAllocation[]>([]);
    const [expenditures, setExpenditures] = useState<ProjectExpenditure[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'EXPENDITURES' | 'ALLOCATIONS'>('EXPENDITURES');
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modals
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [isExpenditureModalOpen, setIsExpenditureModalOpen] = useState(false);
    const [reviewExpenditure, setReviewExpenditure] = useState<ProjectExpenditure | null>(null);
    const [paymentExpenditure, setPaymentExpenditure] = useState<ProjectExpenditure | null>(null);
    const [disbursementExpenditure, setDisbursementExpenditure] = useState<ProjectExpenditure | null>(null);
    const [disbursementForm, setDisbursementForm] = useState({
        paymentReference: '',
        disbursementDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Form States
    const [allocationForm, setAllocationForm] = useState({
        projectId: '',
        sourceType: 'DONATION' as 'DONATION' | 'GENERAL_FUND' | 'GRANT' | 'CSR_GRANT',
        sourceDonationId: '',
        amount: '',
        notes: ''
    });

    const [expenditureForm, setExpenditureForm] = useState({
        projectId: '',
        category: 'Medical Supplies',
        amount: '',
        description: '',
        justification: '',
        receiptRef: ''
    });

    const [reviewForm, setReviewForm] = useState({
        rejectionReason: ''
    });

    const [paymentForm, setPaymentForm] = useState({
        paymentMode: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'UPI' | 'ONLINE',
        paymentReference: '',
        notes: ''
    });

    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [projectCapacity, setProjectCapacity] = useState<ProjectCapacity | null>(null);

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        Promise.all([
            donorsVolunteersService.getAllocations(unitId),
            donorsVolunteersService.getExpenditures(unitId),
            donorsVolunteersService.getProjects(unitId),
            donorsVolunteersService.getFundingSources(undefined, unitId)
        ])
            .then(([allocRes, expRes, projRes, sourceRes]) => {
                if (!mounted) return;
                setAllocations(allocRes);
                setExpenditures(expRes);
                setProjects(projRes);
                setFundingSources(sourceRes);
                setLoading(false);
            })
            .catch(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [unitId, refreshTrigger]);

    // When project changes in expenditure form, fetch its capacity
    useEffect(() => {
        if (!expenditureForm.projectId) {
            setProjectCapacity(null);
            return;
        }
        donorsVolunteersService.getProjectCapacity(expenditureForm.projectId, unitId).then((cap) => {
            setProjectCapacity(cap);
        });
    }, [expenditureForm.projectId, unitId]);

    // Totals
    const totalAllocated = allocations.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const approvedSpent = expenditures
        .filter((e) => e.approvalStatus === 'APPROVED' && e.paymentStatus !== 'CANCELLED')
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const pendingSpent = expenditures
        .filter((e) => e.approvalStatus === 'PENDING' && e.paymentStatus !== 'CANCELLED')
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const paidSpent = expenditures
        .filter((e) => e.paymentStatus === 'PAID')
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // --- Actions ---

    // 1. Submit Allocation
    const handleCreateAllocation = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);
        setModalSuccess(null);

        const amt = parseFloat(allocationForm.amount);
        if (!allocationForm.projectId) {
            setModalError('Please select a target charitable project.');
            return;
        }
        if (!amt || amt <= 0) {
            setModalError('Please enter a valid allocation amount greater than zero.');
            return;
        }
        if (allocationForm.sourceType === 'DONATION' && !allocationForm.sourceDonationId) {
            setModalError('Please select a verified funding source.');
            return;
        }

        setSubmitting(true);
        try {
            await donorsVolunteersService.createAllocation(
                {
                    projectId: allocationForm.projectId,
                    amount: amt,
                    sourceType: allocationForm.sourceType,
                    sourceDonationId: allocationForm.sourceDonationId || null,
                    notes: allocationForm.notes || undefined,
                    idempotencyKey: `alloc-fe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
                },
                unitId
            );
            setModalSuccess('Funding allocation created successfully!');
            setTimeout(() => {
                setIsAllocationModalOpen(false);
                setAllocationForm({ projectId: '', sourceType: 'DONATION', sourceDonationId: '', amount: '', notes: '' });
                handleRefresh();
            }, 800);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to create allocation.';
            setModalError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // 2. Submit Expenditure Request
    const handleCreateExpenditure = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);
        setModalSuccess(null);

        const amt = parseFloat(expenditureForm.amount);
        if (!expenditureForm.projectId) {
            setModalError('Please select a target project.');
            return;
        }
        if (!amt || amt <= 0) {
            setModalError('Please enter a valid expenditure amount greater than zero.');
            return;
        }
        if (!expenditureForm.description.trim()) {
            setModalError('Please provide a description of the expenditure.');
            return;
        }
        if (projectCapacity && amt > projectCapacity.remainingCapacity) {
            setModalError(`Amount ₹${amt.toLocaleString()} exceeds remaining project capacity of ₹${projectCapacity.remainingCapacity.toLocaleString()}.`);
            return;
        }

        setSubmitting(true);
        try {
            await donorsVolunteersService.createExpenditure(
                {
                    projectId: expenditureForm.projectId,
                    amount: amt,
                    category: expenditureForm.category,
                    description: expenditureForm.description,
                    justification: expenditureForm.justification || undefined,
                    receiptRef: expenditureForm.receiptRef || undefined,
                    idempotencyKey: `exp-fe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
                },
                unitId
            );
            setModalSuccess('Expenditure request submitted successfully for approval!');
            setTimeout(() => {
                setIsExpenditureModalOpen(false);
                setExpenditureForm({ projectId: '', category: 'Medical Supplies', amount: '', description: '', justification: '', receiptRef: '' });
                handleRefresh();
            }, 800);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to submit expenditure request.';
            setModalError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // 3. Review Expenditure (Approve / Reject)
    const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
        if (!reviewExpenditure) return;
        setModalError(null);
        setModalSuccess(null);

        if (status === 'REJECTED' && !reviewForm.rejectionReason.trim()) {
            setModalError('A rejection reason is strictly required when rejecting an expenditure request.');
            return;
        }

        setSubmitting(true);
        try {
            await donorsVolunteersService.approveExpenditure(
                reviewExpenditure.id,
                {
                    status,
                    rejectionReason: status === 'REJECTED' ? reviewForm.rejectionReason.trim() : undefined
                },
                unitId
            );
            setModalSuccess(`Expenditure ${status.toLowerCase()} successfully!`);
            setTimeout(() => {
                setReviewExpenditure(null);
                setReviewForm({ rejectionReason: '' });
                handleRefresh();
            }, 800);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to update expenditure status.';
            setModalError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // 4. Record Payment Voucher (Stage 1: Issue Voucher in Finance)
    const handleProcessPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentExpenditure) return;
        setModalError(null);
        setModalSuccess(null);

        setSubmitting(true);
        try {
            const result = await donorsVolunteersService.issuePaymentVoucher(
                paymentExpenditure.id,
                {
                    paymentMode: paymentForm.paymentMode,
                    paymentReference: paymentForm.paymentReference || undefined,
                    notes: paymentForm.notes || undefined,
                    idempotencyKey: `pv-fe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
                },
                unitId
            );
            setModalSuccess(`Payment voucher ${result.voucherRef || 'recorded'} issued successfully! Ready for disbursement.`);
            setTimeout(() => {
                setPaymentExpenditure(null);
                setPaymentForm({ paymentMode: 'BANK_TRANSFER', paymentReference: '', notes: '' });
                handleRefresh();
            }, 1000);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to issue payment voucher.';
            setModalError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // 5. Confirm Payment Disbursement (Stage 2: Confirm Disbursed / Cleared Funds)
    const handleConfirmDisbursement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!disbursementExpenditure) return;
        if (!disbursementForm.paymentReference.trim()) {
            setModalError('Payment reference (e.g. Bank UTR, transaction ID, cheque number) is required');
            return;
        }
        setModalError(null);
        setModalSuccess(null);

        setSubmitting(true);
        try {
            const result = await donorsVolunteersService.confirmPayment(
                disbursementExpenditure.id,
                {
                    paymentReference: disbursementForm.paymentReference.trim(),
                    disbursementDate: disbursementForm.disbursementDate || undefined,
                    notes: disbursementForm.notes || undefined,
                    idempotencyKey: `disb-fe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
                },
                unitId
            );
            setModalSuccess(`Payment disbursement confirmed successfully! Transaction ${result.voucherRef || ''} is settled.`);
            setTimeout(() => {
                setDisbursementExpenditure(null);
                setDisbursementForm({ paymentReference: '', disbursementDate: new Date().toISOString().split('T')[0], notes: '' });
                handleRefresh();
            }, 1000);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to confirm payment disbursement.';
            setModalError(msg);
        } finally {
            setSubmitting(false);
        }
    };


    // Filtered lists
    const filteredExpenditures = expenditures.filter((e) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const pName = (projects.find((p) => p.id === e.projectId)?.name || e.project?.name || '').toLowerCase();
        return (
            (e.description || '').toLowerCase().includes(q) ||
            (e.category || '').toLowerCase().includes(q) ||
            pName.includes(q) ||
            (e.paymentVoucherRef || '').toLowerCase().includes(q)
        );
    });

    const filteredAllocations = allocations.filter((a) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const pName = (projects.find((p) => p.id === a.projectId)?.name || a.project?.name || '').toLowerCase();
        return (
            (a.source || '').toLowerCase().includes(q) ||
            (a.sourceReference || '').toLowerCase().includes(q) ||
            pName.includes(q) ||
            (a.notes || '').toLowerCase().includes(q)
        );
    });

    const categories = [
        'Medical Supplies',
        'Medicines & Pharmaceuticals',
        'Logistics & Transport',
        'Volunteer & Staff Stipend',
        'Patient Food & Refreshments',
        'Diagnostic & Laboratory',
        'Camp Equipment & Tents',
        'Administrative & Miscellaneous'
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* KPI Ribbon */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL ALLOCATED</span>
                        <Wallet size={18} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.35rem' }}>
                        ₹{totalAllocated.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Reserved for charitable projects</div>
                </div>

                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>APPROVED EXPENDITURES</span>
                        <TrendingDown size={18} color="#ef4444" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ef4444', marginTop: '0.35rem' }}>
                        ₹{approvedSpent.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Authorized project disbursements</div>
                </div>

                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PENDING REVIEW</span>
                        <Receipt size={18} color="#6366f1" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#6366f1', marginTop: '0.35rem' }}>
                        ₹{pendingSpent.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Awaiting managerial approval</div>
                </div>

                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PAID VOUCHERS</span>
                        <CreditCard size={18} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981', marginTop: '0.35rem' }}>
                        ₹{paidSpent.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Executed Finance disbursements</div>
                </div>
            </div>

            {/* Header & Controls */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}
            >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setActiveSection('EXPENDITURES')}
                            style={{
                                border: 'none',
                                background: activeSection === 'EXPENDITURES' ? 'var(--surface-color)' : 'transparent',
                                color: activeSection === 'EXPENDITURES' ? '#ef4444' : 'var(--text-secondary)',
                                fontWeight: activeSection === 'EXPENDITURES' ? 600 : 400,
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: activeSection === 'EXPENDITURES' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <span>Project Expenditures</span>
                            <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: 999, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                                {expenditures.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveSection('ALLOCATIONS')}
                            style={{
                                border: 'none',
                                background: activeSection === 'ALLOCATIONS' ? 'var(--surface-color)' : 'transparent',
                                color: activeSection === 'ALLOCATIONS' ? '#f59e0b' : 'var(--text-secondary)',
                                fontWeight: activeSection === 'ALLOCATIONS' ? 600 : 400,
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: activeSection === 'ALLOCATIONS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <span>Funding Allocations</span>
                            <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                                {allocations.length}
                            </span>
                        </button>
                    </div>

                    <div style={{ position: 'relative', minWidth: 240, flex: 1, maxWidth: 360 }}>
                        <Search
                            size={16}
                            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                        />
                        <input
                            type="text"
                            className="erp-input"
                            placeholder="Search description, project, voucher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="erp-button erp-button-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>

                    {activeSection === 'ALLOCATIONS' ? (
                        <button
                            type="button"
                            onClick={() => {
                                setModalError(null);
                                setModalSuccess(null);
                                setIsAllocationModalOpen(true);
                            }}
                            className="erp-button erp-button-primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f59e0b', borderColor: '#f59e0b' }}
                        >
                            <Plus size={15} /> Allocate Funds
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setModalError(null);
                                setModalSuccess(null);
                                setIsExpenditureModalOpen(true);
                            }}
                            className="erp-button erp-button-primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ef4444', borderColor: '#ef4444' }}
                        >
                            <Plus size={15} /> Request Expenditure
                        </button>
                    )}
                </div>
            </div>

            {/* Content Table */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {activeSection === 'EXPENDITURES' ? 'Project disbursement and invoice records' : 'Fund transfers allocated to charitable projects'} for <strong>{unitName}</strong>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading financial records...
                    </div>
                ) : activeSection === 'EXPENDITURES' ? (
                    /* Expenditures Table */
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>PROJECT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>CATEGORY & DETAILS</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>AMOUNT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DATE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>APPROVAL</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>PAYMENT VOUCHER</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenditures.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No project expenditures recorded yet. Click <strong>+ Request Expenditure</strong> to initiate.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExpenditures.map((item) => {
                                        const proj = projects.find((p) => p.id === item.projectId) || item.project;
                                        const isPending = item.approvalStatus === 'PENDING';
                                        const isApproved = item.approvalStatus === 'APPROVED';
                                        const isRejected = item.approvalStatus === 'REJECTED';
                                        const isPaid = item.paymentStatus === 'PAID';

                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{proj?.name || 'Project'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        Budget: ₹{((proj as any)?.totalBudget || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{item.category || 'General'}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.description}</div>
                                                    {item.justification && (
                                                        <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '2px' }}>
                                                            Justification: {item.justification}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#ef4444' }}>
                                                    ₹{item.amount.toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {item.date ? new Date(item.date).toLocaleDateString('en-IN', { dateStyle: 'short' }) : '—'}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            padding: '2px 8px',
                                                            borderRadius: 999,
                                                            background: isApproved ? 'rgba(16, 185, 129, 0.15)' : isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                            color: isApproved ? '#10b981' : isPending ? '#f59e0b' : '#ef4444'
                                                        }}
                                                    >
                                                        {item.approvalStatus}
                                                    </span>
                                                    {isRejected && item.rejectionReason && (
                                                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '3px' }}>
                                                            {item.rejectionReason}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    {isPaid ? (
                                                        <div>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                                                                PAID / DISBURSED
                                                            </span>
                                                            <div style={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'monospace', marginTop: '2px' }}>
                                                                {item.paymentVoucherRef || 'Voucher'}
                                                            </div>
                                                            {item.receiptRef && (
                                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                                                                    Ref: {item.receiptRef}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : item.paymentStatus === 'VOUCHER_ISSUED' ? (
                                                        <div>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                                                                VOUCHER ISSUED
                                                            </span>
                                                            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontFamily: 'monospace', marginTop: '2px' }}>
                                                                {item.paymentVoucherRef}
                                                            </div>
                                                        </div>
                                                    ) : isApproved ? (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                                                            PAYMENT PENDING
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            UNPAID
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                    {isPending ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setModalError(null);
                                                                setModalSuccess(null);
                                                                setReviewExpenditure(item);
                                                            }}
                                                            className="erp-button erp-button-secondary"
                                                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                        >
                                                            Review
                                                        </button>
                                                    ) : isApproved && (item.paymentStatus === 'PAYMENT_PENDING' || !item.paymentStatus || item.paymentStatus === 'UNPAID') ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setModalError(null);
                                                                setModalSuccess(null);
                                                                setPaymentExpenditure(item);
                                                            }}
                                                            className="erp-button erp-button-primary"
                                                            style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#3b82f6', borderColor: '#3b82f6' }}
                                                        >
                                                            Issue Voucher
                                                        </button>
                                                    ) : item.paymentStatus === 'VOUCHER_ISSUED' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setModalError(null);
                                                                setModalSuccess(null);
                                                                setDisbursementExpenditure(item);
                                                            }}
                                                            className="erp-button erp-button-primary"
                                                            style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
                                                        >
                                                            Confirm Payment
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: isPaid ? '#10b981' : 'var(--text-secondary)' }}>
                                                            {isPaid ? 'Settled' : 'Completed'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Allocations Table */
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>TARGET PROJECT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>FUNDING SOURCE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>AMOUNT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>NOTES / JUSTIFICATION</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ALLOCATED DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAllocations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No funding allocations created yet. Click <strong>+ Allocate Funds</strong> to reserve charity funds for a project.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAllocations.map((a) => {
                                        const proj = projects.find((p) => p.id === a.projectId) || a.project;
                                        return (
                                            <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                                    <div>{proj?.name || 'Project'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        Target Budget: ₹{((proj as any)?.totalBudget || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{a.sourceReference || a.source || 'Donation'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Type: {a.sourceType || 'DONATION'}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#f59e0b' }}>
                                                    ₹{a.amount.toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                                                    {a.notes || '—'}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                                                    {a.date ? new Date(a.date).toLocaleDateString('en-IN', { dateStyle: 'short' }) : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- MODAL 1: NEW FUNDING ALLOCATION --- */}
            {isAllocationModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'var(--surface-color)', borderRadius: '14px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Wallet color="#f59e0b" size={20} /> New Project Funding Allocation
                            </div>
                            <button type="button" onClick={() => setIsAllocationModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAllocation} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {modalError && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <AlertCircle size={16} />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            {modalSuccess && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <CheckCircle2 size={16} />
                                    <span>{modalSuccess}</span>
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Target Project *
                                </label>
                                <select
                                    className="erp-input"
                                    value={allocationForm.projectId}
                                    onChange={(e) => setAllocationForm({ ...allocationForm, projectId: e.target.value })}
                                    style={{ width: '100%' }}
                                    required
                                >
                                    <option value="">Select a charitable project...</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (Budget: ₹{p.totalBudget.toLocaleString('en-IN')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Funding Source *
                                </label>
                                <select
                                    className="erp-input"
                                    value={allocationForm.sourceDonationId}
                                    onChange={(e) => {
                                        const src = fundingSources.find((s) => s.id === e.target.value);
                                        setAllocationForm({
                                            ...allocationForm,
                                            sourceDonationId: e.target.value,
                                            sourceType: src ? src.sourceType : 'DONATION'
                                        });
                                    }}
                                    style={{ width: '100%' }}
                                    required
                                >
                                    <option value="">Select an authoritative funding source...</option>
                                    {fundingSources.map((s) => {
                                        const disabled = !s.isEligible;
                                        return (
                                            <option key={s.id} value={s.id} disabled={disabled}>
                                                {s.sourceReference} — {s.isEligible ? `Available: ₹${s.availableBalance.toLocaleString('en-IN')} (${s.donorName || 'Eligible'})` : `[INELIGIBLE: ${s.ineligibilityReason || 'Unavailable'}]`}
                                            </option>
                                        );
                                    })}
                                </select>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Only cleared, verified donations with unallocated balances can be selected.
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Allocation Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    className="erp-input"
                                    placeholder="Enter amount to reserve"
                                    value={allocationForm.amount}
                                    onChange={(e) => setAllocationForm({ ...allocationForm, amount: e.target.value })}
                                    style={{ width: '100%' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Notes & Purpose
                                </label>
                                <textarea
                                    className="erp-input"
                                    rows={3}
                                    placeholder="e.g. Allocation from cleared cash donation for camp medical supplies"
                                    value={allocationForm.notes}
                                    onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAllocationModalOpen(false)}
                                    className="erp-button erp-button-secondary"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="erp-button erp-button-primary"
                                    style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Allocating...' : 'Confirm Allocation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: NEW EXPENDITURE REQUEST --- */}
            {isExpenditureModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'var(--surface-color)', borderRadius: '14px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText color="#ef4444" size={20} /> Request Project Expenditure
                            </div>
                            <button type="button" onClick={() => setIsExpenditureModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateExpenditure} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {modalError && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <AlertCircle size={16} />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            {modalSuccess && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <CheckCircle2 size={16} />
                                    <span>{modalSuccess}</span>
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Target Project *
                                </label>
                                <select
                                    className="erp-input"
                                    value={expenditureForm.projectId}
                                    onChange={(e) => setExpenditureForm({ ...expenditureForm, projectId: e.target.value })}
                                    style={{ width: '100%' }}
                                    required
                                >
                                    <option value="">Select a project...</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Capacity Info Card */}
                            {projectCapacity && (
                                <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Total Allocated:</span>
                                        <strong>₹{projectCapacity.totalAllocated.toLocaleString('en-IN')}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Committed (Approved/Pending):</span>
                                        <span style={{ color: '#ef4444' }}>₹{projectCapacity.committedAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                                        <span>Remaining Spendable Capacity:</span>
                                        <strong style={{ color: projectCapacity.remainingCapacity > 0 ? '#10b981' : '#ef4444' }}>
                                            ₹{projectCapacity.remainingCapacity.toLocaleString('en-IN')}
                                        </strong>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                        Category *
                                    </label>
                                    <select
                                        className="erp-input"
                                        value={expenditureForm.category}
                                        onChange={(e) => setExpenditureForm({ ...expenditureForm, category: e.target.value })}
                                        style={{ width: '100%' }}
                                        required
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                        Amount (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        className="erp-input"
                                        placeholder="Enter amount"
                                        value={expenditureForm.amount}
                                        onChange={(e) => setExpenditureForm({ ...expenditureForm, amount: e.target.value })}
                                        style={{ width: '100%' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Description *
                                </label>
                                <input
                                    type="text"
                                    className="erp-input"
                                    placeholder="e.g. Purchase of first-aid kits and surgical bandages"
                                    value={expenditureForm.description}
                                    onChange={(e) => setExpenditureForm({ ...expenditureForm, description: e.target.value })}
                                    style={{ width: '100%' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Business Justification
                                </label>
                                <textarea
                                    className="erp-input"
                                    rows={2}
                                    placeholder="Explain why this disbursement is necessary for the project deliverables"
                                    value={expenditureForm.justification}
                                    onChange={(e) => setExpenditureForm({ ...expenditureForm, justification: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsExpenditureModalOpen(false)}
                                    className="erp-button erp-button-secondary"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="erp-button erp-button-primary"
                                    style={{ background: '#ef4444', borderColor: '#ef4444' }}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: REVIEW EXPENDITURE (APPROVE / REJECT) --- */}
            {reviewExpenditure && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'var(--surface-color)', borderRadius: '14px', width: '100%', maxWidth: 480, border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                Review Expenditure Request
                            </div>
                            <button type="button" onClick={() => setReviewExpenditure(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {modalError && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                                    {modalError}
                                </div>
                            )}

                            {modalSuccess && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem' }}>
                                    {modalSuccess}
                                </div>
                            )}

                            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Amount:</span>
                                    <strong style={{ fontSize: '1.1rem', color: '#ef4444' }}>₹{reviewExpenditure.amount.toLocaleString('en-IN')}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                                    <span>{reviewExpenditure.category || 'General'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Description:</span>
                                    <span>{reviewExpenditure.description}</span>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Rejection Reason (Required only if rejecting)
                                </label>
                                <textarea
                                    className="erp-input"
                                    rows={2}
                                    placeholder="State the reason if you are rejecting this request..."
                                    value={reviewForm.rejectionReason}
                                    onChange={(e) => setReviewForm({ rejectionReason: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => handleDecision('REJECTED')}
                                    className="erp-button erp-button-secondary"
                                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                    disabled={submitting}
                                >
                                    Reject Request
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDecision('APPROVED')}
                                    className="erp-button erp-button-primary"
                                    style={{ background: '#10b981', borderColor: '#10b981' }}
                                    disabled={submitting}
                                >
                                    Approve for Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: ISSUE PAYMENT VOUCHER --- */}
            {paymentExpenditure && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'var(--surface-color)', borderRadius: '14px', width: '100%', maxWidth: 500, border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CreditCard color="#10b981" size={20} /> Issue Finance Payment Voucher
                            </div>
                            <button type="button" onClick={() => setPaymentExpenditure(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleProcessPayment} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {modalError && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                                    {modalError}
                                </div>
                            )}

                            {modalSuccess && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem' }}>
                                    {modalSuccess}
                                </div>
                            )}

                            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Approved Amount:</span>
                                    <strong style={{ fontSize: '1.15rem', color: '#10b981' }}>₹{paymentExpenditure.amount.toLocaleString('en-IN')}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Description:</span>
                                    <span>{paymentExpenditure.description}</span>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Payment Method *
                                </label>
                                <select
                                    className="erp-input"
                                    value={paymentForm.paymentMode}
                                    onChange={(e: any) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                                    style={{ width: '100%' }}
                                    required
                                >
                                    <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS)</option>
                                    <option value="CHEQUE">Cheque / Demand Draft</option>
                                    <option value="UPI">UPI / Instant Digital</option>
                                    <option value="CASH">Petty Cash Drawer</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Payment Reference / Cheque No.
                                </label>
                                <input
                                    type="text"
                                    className="erp-input"
                                    placeholder="e.g. UTR-994821 or Cheque #004921"
                                    value={paymentForm.paymentReference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Disbursement Notes
                                </label>
                                <textarea
                                    className="erp-input"
                                    rows={2}
                                    placeholder="Disbursement details for central Finance audit trail"
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setPaymentExpenditure(null)}
                                    className="erp-button erp-button-secondary"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="erp-button erp-button-primary"
                                    style={{ background: '#10b981', borderColor: '#10b981' }}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Recording...' : 'Authorize & Execute Voucher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 5: CONFIRM PAYMENT DISBURSEMENT --- */}
            {disbursementExpenditure && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'var(--surface-color)', borderRadius: '14px', width: '100%', maxWidth: 500, border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle2 color="#10b981" size={20} /> Confirm Payment Disbursement
                            </div>
                            <button type="button" onClick={() => setDisbursementExpenditure(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmDisbursement} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {modalError && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                                    {modalError}
                                </div>
                            )}

                            {modalSuccess && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem' }}>
                                    {modalSuccess}
                                </div>
                            )}

                            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Voucher Reference:</span>
                                    <strong style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{disbursementExpenditure.paymentVoucherRef || 'Voucher'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Amount to Disburse:</span>
                                    <strong style={{ fontSize: '1.15rem', color: '#10b981' }}>₹{disbursementExpenditure.amount.toLocaleString('en-IN')}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Description:</span>
                                    <span>{disbursementExpenditure.description}</span>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Payment Evidence / Bank UTR / Cheque Ref *
                                </label>
                                <input
                                    type="text"
                                    className="erp-input"
                                    placeholder="e.g. UTR-99482144, CMS-TXN-10291, or Cheque Clearance Ref"
                                    value={disbursementForm.paymentReference}
                                    onChange={(e) => setDisbursementForm({ ...disbursementForm, paymentReference: e.target.value })}
                                    style={{ width: '100%' }}
                                    required
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Authoritative transaction identifier verifying money was physically disbursed.
                                </span>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Disbursement Date
                                </label>
                                <input
                                    type="date"
                                    className="erp-input"
                                    value={disbursementForm.disbursementDate}
                                    onChange={(e) => setDisbursementForm({ ...disbursementForm, disbursementDate: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Reconciliation Notes
                                </label>
                                <textarea
                                    className="erp-input"
                                    rows={2}
                                    placeholder="Audit notes or payee acknowledgement details"
                                    value={disbursementForm.notes}
                                    onChange={(e) => setDisbursementForm({ ...disbursementForm, notes: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setDisbursementExpenditure(null)}
                                    className="erp-button erp-button-secondary"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="erp-button erp-button-primary"
                                    style={{ background: '#10b981', borderColor: '#10b981' }}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Confirming...' : 'Confirm & Mark Disbursed'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
