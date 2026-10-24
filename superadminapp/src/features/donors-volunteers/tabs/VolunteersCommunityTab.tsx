import React, { useState, useEffect } from 'react';
import {
    Search,
    RefreshCw,
    UserPlus,
    X,
    AlertCircle,
    CheckCircle2,
    HeartHandshake
} from 'lucide-react';
import { donorsVolunteersService } from '../donorsVolunteers.service';
import type { Donation, VolunteerMember } from '../donorsVolunteers.types';

interface VolunteersCommunityTabProps {
    unitId?: string | null;
    unitName: string;
}

export function VolunteersCommunityTab({
    unitId,
    unitName
}: VolunteersCommunityTabProps) {
    const [volunteers, setVolunteers] = useState<VolunteerMember[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modal state
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Form inputs
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        role: 'Community Coordinator',
        initiative: 'Free Medical Camps',
        availability: 'Weekends',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
    });

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger((prev) => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        Promise.all([
            donorsVolunteersService.getVolunteers(unitId),
            donorsVolunteersService.getDonations(unitId)
        ])
            .then(([volRes, donRes]) => {
                if (!mounted) return;
                setVolunteers(volRes || []);
                setDonations(donRes || []);
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

    // Merge in any references from donations that are not already in volunteer roster
    const allParticipants: VolunteerMember[] = [...volunteers];
    for (const d of donations) {
        if (d.references && Array.isArray(d.references)) {
            for (const r of d.references) {
                if (r.name && !allParticipants.some((p) => p.name.toLowerCase() === r.name.toLowerCase())) {
                    allParticipants.push({
                        id: `ref-${r.id}`,
                        name: r.name,
                        mobile: r.mobile || '—',
                        role: 'Community Reference',
                        initiative: d.purpose || 'Foundation Supporter',
                        availability: 'On-Call',
                        status: 'ACTIVE',
                        joinedDate: d.date ? d.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
                    });
                }
            }
        }
    }

    const filtered = allParticipants.filter((m) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            m.name.toLowerCase().includes(q) ||
            m.role.toLowerCase().includes(q) ||
            (m.initiative && m.initiative.toLowerCase().includes(q)) ||
            (m.mobile && m.mobile.includes(q)) ||
            (m.email && m.email.toLowerCase().includes(q))
        );
    });

    const handleRegisterVolunteer = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        if (!formData.name.trim()) {
            setFormError('Volunteer full name is required.');
            return;
        }
        if (!formData.mobile.trim()) {
            setFormError('Contact mobile number is required.');
            return;
        }

        try {
            setSubmitting(true);
            const created = await donorsVolunteersService.createVolunteer(
                {
                    name: formData.name.trim(),
                    mobile: formData.mobile.trim(),
                    email: formData.email.trim() || undefined,
                    role: formData.role.trim(),
                    initiative: formData.initiative.trim(),
                    availability: formData.availability,
                    status: formData.status
                },
                unitId
            );

            setFormSuccess(`Volunteer "${created.name}" registered successfully!`);
            setFormData({
                name: '',
                mobile: '',
                email: '',
                role: 'Community Coordinator',
                initiative: 'Free Medical Camps',
                availability: 'Weekends',
                status: 'ACTIVE'
            });

            // Refresh live list
            setTimeout(() => {
                setIsRegisterModalOpen(false);
                setFormSuccess(null);
                handleRefresh();
            }, 1200);
        } catch (err: any) {
            setFormError(err.response?.data?.message || err.message || 'Failed to register volunteer.');
        } finally {
            setSubmitting(false);
        }
    };

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
                <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 380 }}>
                    <Search
                        size={16}
                        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                    />
                    <input
                        type="text"
                        className="erp-input"
                        placeholder="Search volunteer, initiative, role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 34, fontSize: '0.85rem', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="erp-button erp-button-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        <RefreshCw size={14} /> Refresh Roster
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFormError(null);
                            setFormSuccess(null);
                            setIsRegisterModalOpen(true);
                        }}
                        className="erp-button erp-button-primary"
                        style={{
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: '#3b82f6',
                            borderColor: '#3b82f6',
                            color: '#ffffff'
                        }}
                    >
                        <UserPlus size={15} /> Register Volunteer
                    </button>
                </div>
            </div>

            {/* Volunteers Directory */}
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
                    Active volunteers and community representatives serving <strong>{unitName}</strong> ({filtered.length} Registered)
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading community volunteers...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No volunteer records matching search. Click <strong>Register Volunteer</strong> to add one.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="erp-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>MEMBER NAME</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>ROLE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>INITIATIVE / DRIVE</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>AVAILABILITY</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>CONTACT</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                            {item.name}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                                                {item.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {item.initiative || 'Community Support'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {item.availability}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div>{item.mobile}</div>
                                            {item.email && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.email}</span>}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    padding: '2px 8px',
                                                    borderRadius: 999,
                                                    background: item.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                    color: item.status === 'ACTIVE' ? '#10b981' : '#ef4444'
                                                }}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- REGISTER VOLUNTEER MODAL --- */}
            {isRegisterModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'var(--surface-color)', borderRadius: '14px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <HeartHandshake color="#3b82f6" size={20} /> Register Community Volunteer
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRegisterModalOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleRegisterVolunteer} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {formError && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <AlertCircle size={16} />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {formSuccess && (
                                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <CheckCircle2 size={16} />
                                    <span>{formSuccess}</span>
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    className="erp-input"
                                    placeholder="e.g. Dr. Kavitha Sundaram"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                        Mobile Number *
                                    </label>
                                    <input
                                        type="tel"
                                        className="erp-input"
                                        placeholder="+91 98765 43210"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        style={{ width: '100%' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        className="erp-input"
                                        placeholder="volunteer@example.org"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                        Role / Designation *
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        placeholder="e.g. Field Health Assistant"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        style={{ width: '100%' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                        Initiative / Drive *
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        placeholder="e.g. Free Medical Camps"
                                        value={formData.initiative}
                                        onChange={(e) => setFormData({ ...formData, initiative: e.target.value })}
                                        style={{ width: '100%' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                        Availability *
                                    </label>
                                    <select
                                        className="erp-input"
                                        value={formData.availability}
                                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Full Time">Full Time</option>
                                        <option value="Part Time">Part Time</option>
                                        <option value="Weekends">Weekends</option>
                                        <option value="On-Call">On-Call</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                        Status
                                    </label>
                                    <select
                                        className="erp-input"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsRegisterModalOpen(false)}
                                    className="erp-button erp-button-secondary"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="erp-button erp-button-primary"
                                    style={{ background: '#3b82f6', borderColor: '#3b82f6', color: '#ffffff' }}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Registering...' : 'Register Volunteer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
