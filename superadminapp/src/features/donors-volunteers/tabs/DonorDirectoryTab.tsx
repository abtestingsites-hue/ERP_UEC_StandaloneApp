import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    RefreshCw
} from 'lucide-react';
import { donorsVolunteersService } from '../donorsVolunteers.service';
import type { Donation } from '../donorsVolunteers.types';

interface DerivedDonor {
    donorNo: string;
    name: string;
    mobile?: string;
    email?: string;
    panNumber?: string;
    isCorporate: boolean;
    address?: string;
    totalContributed: number;
    donationCount: number;
    lastDonationDate: string;
}

interface DonorDirectoryTabProps {
    unitId?: string | null;
    unitName: string;
}

export function DonorDirectoryTab({
    unitId,
    unitName
}: DonorDirectoryTabProps) {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [donorTypeFilter, setDonorTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'CORPORATE'>('ALL');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        donorsVolunteersService.getDonations(unitId)
            .then((res) => {
                if (!mounted) return;
                setDonations(res);
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

    // Aggregate unique donors from donations
    const donors = useMemo(() => {
        const donorMap = new Map<string, DerivedDonor>();

        for (const donation of donations) {
            const donor = donation.donor;
            const donorKey = donor?.donorNo || donor?.id || donation.donorId || donor?.name || 'Anonymous';

            const existing = donorMap.get(donorKey);
            const amount = donation.amount || 0;
            const donationDate = donation.date || donation.createdAt;

            if (existing) {
                existing.totalContributed += amount;
                existing.donationCount += 1;
                if (donationDate && new Date(donationDate) > new Date(existing.lastDonationDate)) {
                    existing.lastDonationDate = donationDate;
                }
            } else {
                donorMap.set(donorKey, {
                    donorNo: donor?.donorNo || 'DNR-UNKNOWN',
                    name: donor?.name || 'Anonymous Donor',
                    mobile: donor?.mobile || donor?.whatsappNumber || undefined,
                    email: donor?.email || undefined,
                    panNumber: donor?.panNumber || undefined,
                    isCorporate: donor?.isCorporate || false,
                    address: donor?.residentialAddress || undefined,
                    totalContributed: amount,
                    donationCount: 1,
                    lastDonationDate: donationDate || '',
                });
            }
        }

        return Array.from(donorMap.values());
    }, [donations]);

    const filteredDonors = donors.filter((d) => {
        if (donorTypeFilter === 'INDIVIDUAL' && d.isCorporate) return false;
        if (donorTypeFilter === 'CORPORATE' && !d.isCorporate) return false;

        if (search) {
            const q = search.toLowerCase();
            return (
                d.name.toLowerCase().includes(q) ||
                d.donorNo.toLowerCase().includes(q) ||
                (d.mobile && d.mobile.includes(q)) ||
                (d.panNumber && d.panNumber.toLowerCase().includes(q))
            );
        }
        return true;
    });

    const totalSupporters = donors.length;
    const corporateCount = donors.filter((d) => d.isCorporate).length;
    const individualCount = totalSupporters - corporateCount;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header & Filter Controls */}
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
                            placeholder="Search donor name, donor no, mobile, PAN..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setDonorTypeFilter('ALL')}
                            style={{
                                border: 'none',
                                background: donorTypeFilter === 'ALL' ? 'var(--surface-color)' : 'transparent',
                                color: donorTypeFilter === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: donorTypeFilter === 'ALL' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: donorTypeFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            All ({totalSupporters})
                        </button>
                        <button
                            type="button"
                            onClick={() => setDonorTypeFilter('INDIVIDUAL')}
                            style={{
                                border: 'none',
                                background: donorTypeFilter === 'INDIVIDUAL' ? 'var(--surface-color)' : 'transparent',
                                color: donorTypeFilter === 'INDIVIDUAL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: donorTypeFilter === 'INDIVIDUAL' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: donorTypeFilter === 'INDIVIDUAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Individual ({individualCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setDonorTypeFilter('CORPORATE')}
                            style={{
                                border: 'none',
                                background: donorTypeFilter === 'CORPORATE' ? 'var(--surface-color)' : 'transparent',
                                color: donorTypeFilter === 'CORPORATE' ? '#0284c7' : 'var(--text-secondary)',
                                fontWeight: donorTypeFilter === 'CORPORATE' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: donorTypeFilter === 'CORPORATE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Corporate / CSR ({corporateCount})
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleRefresh}
                    className="erp-button erp-button-secondary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Donor Directory Table */}
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
                    Donors and institutional supporters associated with <strong>{unitName}</strong>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Compiling donor profiles...
                    </div>
                ) : filteredDonors.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No donor profiles found for selected filter.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>DONOR NO</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DONOR NAME</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>TYPE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>CONTACT & PAN</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DONATIONS COUNT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>TOTAL CONTRIBUTED</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>LAST GIFT DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDonors.map((d, idx) => (
                                    <tr key={`${d.donorNo}-${idx}`} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#10b981' }}>
                                            {d.donorNo}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{d.name}</div>
                                            {d.address && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {d.address}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {d.isCorporate ? (
                                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999, background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', fontWeight: 600 }}>
                                                    Corporate CSR
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600 }}>
                                                    Individual
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {d.mobile && <div>{d.mobile}</div>}
                                            {d.panNumber && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                    PAN: {d.panNumber}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <span style={{ fontWeight: 600 }}>{d.donationCount}</span> gift(s)
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>
                                            ₹{d.totalContributed.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                                            {d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString('en-IN', { dateStyle: 'short' }) : '—'}
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
