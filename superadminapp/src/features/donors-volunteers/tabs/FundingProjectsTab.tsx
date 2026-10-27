import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    RefreshCw
} from 'lucide-react';
import { donorsVolunteersService } from '../donorsVolunteers.service';
import type { Project, FundingAllocation } from '../donorsVolunteers.types';

interface FundingProjectsTabProps {
    unitId?: string | null;
    unitName: string;
    onOpenNewProject: () => void;
}

export function FundingProjectsTab({
    unitId,
    unitName,
    onOpenNewProject
}: FundingProjectsTabProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [allocations, setAllocations] = useState<FundingAllocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PLANNED' | 'COMPLETED'>('ALL');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        Promise.all([
            donorsVolunteersService.getProjects(unitId),
            donorsVolunteersService.getAllocations(unitId)
        ])
            .then(([projRes, allocRes]) => {
                if (!mounted) return;
                setProjects(projRes);
                setAllocations(allocRes);
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

    const filtered = projects.filter((p) => {
        if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                p.name.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    <div style={{ position: 'relative', minWidth: 260 }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)'
                            }}
                        />
                        <input
                            type="text"
                            className="erp-input"
                            placeholder="Search charitable project..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('ALL')}
                            style={{
                                border: 'none',
                                background: statusFilter === 'ALL' ? 'var(--surface-color)' : 'transparent',
                                color: statusFilter === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: statusFilter === 'ALL' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            All ({projects.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('ACTIVE')}
                            style={{
                                border: 'none',
                                background: statusFilter === 'ACTIVE' ? 'var(--surface-color)' : 'transparent',
                                color: statusFilter === 'ACTIVE' ? '#10b981' : 'var(--text-secondary)',
                                fontWeight: statusFilter === 'ACTIVE' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'ACTIVE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('PLANNED')}
                            style={{
                                border: 'none',
                                background: statusFilter === 'PLANNED' ? 'var(--surface-color)' : 'transparent',
                                color: statusFilter === 'PLANNED' ? '#f59e0b' : 'var(--text-secondary)',
                                fontWeight: statusFilter === 'PLANNED' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'PLANNED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Planned
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('COMPLETED')}
                            style={{
                                border: 'none',
                                background: statusFilter === 'COMPLETED' ? 'var(--surface-color)' : 'transparent',
                                color: statusFilter === 'COMPLETED' ? 'var(--text-secondary)' : 'var(--text-secondary)',
                                fontWeight: statusFilter === 'COMPLETED' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'COMPLETED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Completed
                        </button>
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
                    <button
                        type="button"
                        onClick={onOpenNewProject}
                        className="erp-button erp-button-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: '#3b82f6',
                            borderColor: '#3b82f6',
                            color: '#ffffff'
                        }}
                    >
                        <Plus size={16} /> Register Project
                    </button>
                </div>
            </div>

            {/* Projects Table */}
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
                    Charitable drives and community funding targets for <strong>{unitName}</strong>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading charitable projects...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No charitable projects recorded. Click Register Project to create one.
                    </div>
                ) : (
                    <div className="erp-table-responsive">
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem', width: '28%' }}>PROJECT INITIATIVE</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '15%', textAlign: 'right' }}>TARGET BUDGET</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '15%', textAlign: 'right' }}>FUNDS ALLOCATED</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '18%' }}>FULFILLMENT</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '12%', textAlign: 'center' }}>STATUS</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '12%', textAlign: 'right' }}>DATE CREATED</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((proj) => {
                                    const projAllocated = allocations.filter((a) => a.projectId === proj.id).reduce((s, a) => s + (a.amount || 0), 0);
                                    const pct = proj.totalBudget ? Math.min(100, Math.round((projAllocated / proj.totalBudget) * 100)) : 0;
                                    const isActive = proj.status === 'ACTIVE';

                                    return (
                                        <tr key={proj.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{proj.name}</div>
                                                {proj.description && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {proj.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                ₹{proj.totalBudget.toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#10b981', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                ₹{projAllocated.toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', minWidth: 140 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                                                    <span>{pct}% Fulfilled</span>
                                                </div>
                                                <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                <span
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        padding: '2px 8px',
                                                        borderRadius: 999,
                                                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                        color: isActive ? '#10b981' : '#f59e0b',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {proj.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                {proj.createdAt ? new Date(proj.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' }) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
