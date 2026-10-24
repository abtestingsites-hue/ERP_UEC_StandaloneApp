import { useState } from 'react';
import { Users, Plus, Building2, Phone, Mail, Award, X } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { Modal } from '../../../components/Modal';
import { usePartners, useCreatePartner } from '../../crm/hooks/useCrm';
import type { B2PPartner } from '../../crm/services/crmService';

export function B2PDashboard() {
    const { data: partners = [], isLoading, error } = usePartners();
    const createPartner = useCreatePartner();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('Hospital');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        createPartner.mutate(
            { name, type, contact, email },
            {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    setName('');
                    setContact('');
                    setEmail('');
                }
            }
        );
    };

    return (
        <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="B2P Referral Management"
                    subtitle="Track and manage healthcare partners, clinics, doctors, and patient referrals."
                    icon={Users}
                />
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors shrink-0"
                >
                    <Plus className="h-4 w-4" /> Add Referral Partner
                </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <LoadingState message="Loading B2P referral partners..." />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-rose-500 font-semibold">
                        Failed to load B2P referral partners. Please retry.
                    </div>
                ) : partners.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title="No Referral Partners Registered"
                            description="Add business partners, doctors, or clinics to start tracking B2P patient referrals."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-5">Partner Name</th>
                                    <th className="py-3.5 px-5">Partner Type</th>
                                    <th className="py-3.5 px-5">Contact Details</th>
                                    <th className="py-3.5 px-5">Email Address</th>
                                    <th className="py-3.5 px-5 text-right">Total Referrals</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {partners.map((partner: B2PPartner) => (
                                    <tr key={partner.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <span className="font-extrabold text-slate-900 dark:text-slate-100">{partner.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {partner.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 font-semibold text-slate-700 dark:text-slate-300">
                                            {partner.contact ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {partner.contact}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-normal">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 font-medium text-slate-600 dark:text-slate-400">
                                            {partner.email ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {partner.email}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-normal">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                                                <Award className="h-3.5 w-3.5" />
                                                {partner._count?.referrals ?? 0} Referrals
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Partner Modal */}
            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register B2P Referral Partner">
                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-indigo-600" /> Register B2P Referral Partner
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Partner / Doctor Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. City General Hospital / Dr. Sharma"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Partner Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                >
                                    <option value="Hospital">Hospital</option>
                                    <option value="Clinic">Clinic</option>
                                    <option value="Doctor">Doctor / Physician</option>
                                    <option value="Agent">Healthcare Agent</option>
                                    <option value="Corporate">Corporate Partner</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        placeholder="Phone contact"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="partner@example.com"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createPartner.isPending}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow transition-colors disabled:opacity-50"
                                >
                                    {createPartner.isPending ? 'Saving...' : 'Register Partner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </div>
    );
}
