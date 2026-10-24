import { useState, useEffect } from 'react';
import {
    HeartHandshake,
    PiggyBank,
    Receipt,
    FolderKanban,
    IndianRupee,
    Search,
    Eye
} from 'lucide-react';
import { donorsVolunteersService } from '../donorsVolunteers.service';
import type { Donation, Project, FundingAllocation, ProjectExpenditure } from '../donorsVolunteers.types';

interface FoundationOverviewTabProps {
    unitId?: string | null;
    unitName: string;
    onOpenNewDonation: () => void;
    onOpenNewProject: () => void;
    onViewDonation: (donation: Donation) => void;
    onNavigateTab: (tabId: string) => void;
}

export function FoundationOverviewTab({
    unitId,
    unitName,
    onOpenNewDonation,
    onOpenNewProject,
    onViewDonation,
    onNavigateTab
}: FoundationOverviewTabProps) {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [allocations, setAllocations] = useState<FundingAllocation[]>([]);
    const [expenditures, setExpenditures] = useState<ProjectExpenditure[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        let mounted = true;
        Promise.all([
            donorsVolunteersService.getDonations(unitId),
            donorsVolunteersService.getProjects(unitId),
            donorsVolunteersService.getAllocations(unitId),
            donorsVolunteersService.getExpenditures(unitId)
        ])
            .then(([donRes, projRes, allocRes, expRes]) => {
                if (!mounted) return;
                setDonations(donRes);
                setProjects(projRes);
                setAllocations(allocRes);
                setExpenditures(expRes);
                setLoading(false);
            })
            .catch(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [unitId]);

    const totalCollected = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalSpent = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);
    const activeProjects = projects.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');
    const totalBudget = projects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);

    const filteredDonations = donations.filter((d) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            d.receiptNo.toLowerCase().includes(q) ||
            d.donor?.name?.toLowerCase().includes(q) ||
            d.donor?.mobile?.includes(q) ||
            d.purpose?.toLowerCase().includes(q)
        );
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* KPI Ribbon */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            TOTAL DONATIONS
                        </span>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HeartHandshake size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>
                        {loading ? '—' : `₹${totalCollected.toLocaleString('en-IN')}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {donations.length} receipts registered
                    </div>
                </div>

                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            FUNDS ALLOCATED
                        </span>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PiggyBank size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>
                        {loading ? '—' : `₹${totalAllocated.toLocaleString('en-IN')}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Targeted to charitable projects
                    </div>
                </div>

                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            PROJECT EXPENDITURES
                        </span>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Receipt size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ef4444' }}>
                        {loading ? '—' : `₹${totalSpent.toLocaleString('en-IN')}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Verified project disbursements
                    </div>
                </div>

                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            ACTIVE PROJECTS
                        </span>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FolderKanban size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {loading ? '—' : activeProjects.length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Target: ₹{totalBudget.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Action Shortcuts & Quick Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 600 }}>
                        Foundation Action Shortcuts
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={onOpenNewDonation}
                            className="erp-button erp-button-primary"
                            style={{
                                padding: '0.85rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.4rem',
                                background: '#10b981',
                                borderColor: '#10b981',
                                color: '#ffffff',
                                borderRadius: '8px',
                                textAlign: 'left'
                            }}
                        >
                            <HeartHandshake size={20} />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Issue Donation</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Generate 80G Receipt</span>
                        </button>

                        <button
                            type="button"
                            onClick={onOpenNewProject}
                            className="erp-button erp-button-secondary"
                            style={{
                                padding: '0.85rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.4rem',
                                borderRadius: '8px',
                                textAlign: 'left'
                            }}
                        >
                            <FolderKanban size={20} color="#3b82f6" />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Register Project</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Charitable Initiatives</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigateTab('donors')}
                            className="erp-button erp-button-secondary"
                            style={{
                                padding: '0.85rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.4rem',
                                borderRadius: '8px',
                                textAlign: 'left'
                            }}
                        >
                            <PiggyBank size={20} color="#f59e0b" />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Donor Directory</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Profiles & PAN Info</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigateTab('volunteers')}
                            className="erp-button erp-button-secondary"
                            style={{
                                padding: '0.85rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.4rem',
                                borderRadius: '8px',
                                textAlign: 'left'
                            }}
                        >
                            <IndianRupee size={20} color="#8b5cf6" />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Volunteers & NGO</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Community Outreach</span>
                        </button>
                    </div>
                </div>

                {/* Charitable Projects Status Summary */}
                <div
                    style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                            Active Charitable Drives
                        </h3>
                        <button
                            type="button"
                            onClick={() => onNavigateTab('projects')}
                            className="erp-button erp-button-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        >
                            View All
                        </button>
                    </div>

                    {projects.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            No charitable projects recorded. Click Register Project to create one.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {projects.slice(0, 3).map((proj) => {
                                const projAllocated = allocations.filter((a) => a.projectId === proj.id).reduce((s, a) => s + (a.amount || 0), 0);
                                const pct = proj.totalBudget ? Math.min(100, Math.round((projAllocated / proj.totalBudget) * 100)) : 0;
                                return (
                                    <div key={proj.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                                            <span style={{ fontWeight: 600 }}>{proj.name}</span>
                                            <span style={{ color: '#10b981', fontWeight: 600 }}>{pct}% Funded</span>
                                        </div>
                                        <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Allocated: ₹{projAllocated.toLocaleString('en-IN')}</span>
                                            <span>Target: ₹{proj.totalBudget.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Donations Table */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                            Recent Donation Receipts
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            UNCF Foundation records for <strong>{unitName}</strong>
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', minWidth: 240 }}>
                            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="erp-input"
                                placeholder="Search receipt, donor, mobile..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => onNavigateTab('donations')}
                            className="erp-button erp-button-secondary"
                            style={{ fontSize: '0.85rem' }}
                        >
                            View All Receipts
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading foundation donations...
                    </div>
                ) : filteredDonations.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No donations recorded matching criteria.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>RECEIPT NO</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DONOR NAME</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>AMOUNT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>MODE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>PURPOSE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>TAX STATUS</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDonations.slice(0, 8).map((d) => (
                                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#10b981' }}>
                                            {d.receiptNo}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{d.donor?.name || 'Anonymous'}</div>
                                            {d.donor?.mobile && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.donor.mobile}</span>}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#10b981' }}>
                                            ₹{d.amount.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.05)' }}>
                                                {d.paymentMode}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {d.purpose || 'General Charity'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {d.taxDeduction ? (
                                                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>80G Eligible</span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Standard</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                onClick={() => onViewDonation(d)}
                                                className="erp-button erp-button-secondary"
                                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Eye size={13} /> View Receipt
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
