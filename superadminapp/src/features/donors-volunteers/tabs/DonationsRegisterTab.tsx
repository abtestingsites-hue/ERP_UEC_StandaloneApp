import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Eye,
    RefreshCw,
    Send
} from 'lucide-react';
import { donorsVolunteersService } from '../donorsVolunteers.service';
import type { Donation } from '../donorsVolunteers.types';

interface DonationsRegisterTabProps {
    unitId?: string | null;
    unitName: string;
    onOpenNewDonation: () => void;
    onViewDonation: (donation: Donation) => void;
    onMarkSent: (donationId: string) => Promise<void>;
}

export function DonationsRegisterTab({
    unitId,
    unitName,
    onOpenNewDonation,
    onViewDonation,
    onMarkSent
}: DonationsRegisterTabProps) {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'ONLINE' | 'CHEQUE' | 'MATERIAL' | 'TAX_EXEMPT'>('ALL');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [markingId, setMarkingId] = useState<string | null>(null);

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

    const handleMarkDispatched = async (id: string) => {
        setMarkingId(id);
        try {
            await onMarkSent(id);
            handleRefresh();
        } finally {
            setMarkingId(null);
        }
    };

    const filteredDonations = donations.filter((d) => {
        if (paymentFilter === 'TAX_EXEMPT' && !d.taxDeduction) return false;
        if (paymentFilter !== 'ALL' && paymentFilter !== 'TAX_EXEMPT' && d.paymentMode !== paymentFilter) return false;

        if (search) {
            const q = search.toLowerCase();
            return (
                d.receiptNo.toLowerCase().includes(q) ||
                d.donor?.name?.toLowerCase().includes(q) ||
                d.donor?.mobile?.includes(q) ||
                d.purpose?.toLowerCase().includes(q) ||
                d.donor?.panNumber?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const totalFilteredAmount = filteredDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

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
                            placeholder="Search receipt no, donor, PAN, mobile..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setPaymentFilter('ALL')}
                            style={{
                                border: 'none',
                                background: paymentFilter === 'ALL' ? 'var(--surface-color)' : 'transparent',
                                color: paymentFilter === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: paymentFilter === 'ALL' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: paymentFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            All ({donations.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentFilter('CASH')}
                            style={{
                                border: 'none',
                                background: paymentFilter === 'CASH' ? 'var(--surface-color)' : 'transparent',
                                color: paymentFilter === 'CASH' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: paymentFilter === 'CASH' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: paymentFilter === 'CASH' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Cash
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentFilter('ONLINE')}
                            style={{
                                border: 'none',
                                background: paymentFilter === 'ONLINE' ? 'var(--surface-color)' : 'transparent',
                                color: paymentFilter === 'ONLINE' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: paymentFilter === 'ONLINE' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: paymentFilter === 'ONLINE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Online / UPI
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentFilter('CHEQUE')}
                            style={{
                                border: 'none',
                                background: paymentFilter === 'CHEQUE' ? 'var(--surface-color)' : 'transparent',
                                color: paymentFilter === 'CHEQUE' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: paymentFilter === 'CHEQUE' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: paymentFilter === 'CHEQUE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Cheque
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentFilter('TAX_EXEMPT')}
                            style={{
                                border: 'none',
                                background: paymentFilter === 'TAX_EXEMPT' ? 'var(--surface-color)' : 'transparent',
                                color: paymentFilter === 'TAX_EXEMPT' ? '#10b981' : 'var(--text-secondary)',
                                fontWeight: paymentFilter === 'TAX_EXEMPT' ? 600 : 400,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: paymentFilter === 'TAX_EXEMPT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            80G Exempt
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
                        onClick={onOpenNewDonation}
                        className="erp-button erp-button-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: '#10b981',
                            borderColor: '#10b981',
                            color: '#ffffff'
                        }}
                    >
                        <Plus size={16} /> Issue Donation Receipt
                    </button>
                </div>
            </div>

            {/* Donations Table */}
            <div
                style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Showing <strong>{filteredDonations.length}</strong> donation records for <strong>{unitName}</strong>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10b981' }}>
                        Total Filtered: ₹{totalFilteredAmount.toLocaleString('en-IN')}
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading donation ledger...
                    </div>
                ) : filteredDonations.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No donation receipts found for selected criteria.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>RECEIPT NO</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DONOR & MOBILE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>AMOUNT</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>MODE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>PURPOSE / OCCASION</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>DATE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>80G TAX STATUS</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDonations.map((d) => (
                                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontFamily: 'monospace', color: '#10b981' }}>
                                            {d.receiptNo}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{d.donor?.name || 'Anonymous'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {d.donor?.mobile || 'No Mobile'} {d.donor?.panNumber ? `• PAN: ${d.donor.panNumber}` : ''}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>
                                            ₹{d.amount.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.05)' }}>
                                                {d.paymentMode}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div>{d.purpose || 'General Donation'}</div>
                                            {d.occasionName && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    Occasion: {d.occasionName}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {d.date ? new Date(d.date).toLocaleDateString('en-IN', { dateStyle: 'short' }) : '—'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {d.taxDeduction ? (
                                                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Eligible</span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Regular</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => onViewDonation(d)}
                                                    className="erp-button erp-button-secondary"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Eye size={13} /> View
                                                </button>
                                                {!d.isReceiptSent && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkDispatched(d.id)}
                                                        disabled={markingId === d.id}
                                                        className="erp-button erp-button-secondary"
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '0.75rem',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            color: '#10b981',
                                                            borderColor: '#10b981'
                                                        }}
                                                        title="Mark 80G receipt as dispatched"
                                                    >
                                                        <Send size={12} />
                                                        {markingId === d.id ? 'Sending...' : 'Dispatch'}
                                                    </button>
                                                )}
                                            </div>
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
