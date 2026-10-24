import { useState } from 'react';
import { Megaphone, Plus, DollarSign, Calendar, Target, X } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { Modal } from '../../../components/Modal';
import { useCampaigns, useCreateCampaign } from '../../crm/hooks/useCrm';
import type { MarketingCampaign } from '../../crm/services/crmService';

export function MarketingDashboard() {
    const { data: campaigns = [], isLoading, error } = useCampaigns();
    const createCampaign = useCreateCampaign();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Digital');
    const [budget, setBudget] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        createCampaign.mutate(
            {
                title,
                type,
                budget: Number(budget || 0),
                startDate: startDate || undefined,
                endDate: endDate || undefined
            },
            {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    setTitle('');
                    setBudget('');
                    setStartDate('');
                    setEndDate('');
                }
            }
        );
    };

    return (
        <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Marketing Campaigns & Source Attribution"
                    subtitle="Monitor campaign budgets, channel analytics, and lead generation attribution."
                    icon={Megaphone}
                />
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors shrink-0"
                >
                    <Plus className="h-4 w-4" /> Launch Campaign
                </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <LoadingState message="Loading marketing campaigns..." />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-rose-500 font-semibold">
                        Failed to load marketing campaigns. Please retry.
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title="No Active Marketing Campaigns"
                            description="Create marketing campaigns to track digital, print, or referral channel performance."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-5">Campaign Title</th>
                                    <th className="py-3.5 px-5">Channel Type</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5">Allocated Budget</th>
                                    <th className="py-3.5 px-5 text-right">Leads Generated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {campaigns.map((campaign: MarketingCampaign) => (
                                    <tr key={campaign.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                                    <Megaphone className="h-4 w-4" />
                                                </div>
                                                <span className="font-extrabold text-slate-900 dark:text-slate-100">{campaign.title}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {campaign.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                    campaign.status === 'ACTIVE'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}
                                            >
                                                {campaign.status || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                                                {Number(campaign.budget || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                                                <Target className="h-3.5 w-3.5" />
                                                {campaign.leadsGen ?? 0} Leads
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Campaign Modal */}
            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Launch Marketing Campaign">
                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-indigo-600" /> Launch Marketing Campaign
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Campaign Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Q3 Homecare Google Ads / Senior Care Expo"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Channel Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                    >
                                        <option value="Digital">Digital / Google Ads</option>
                                        <option value="Social Media">Social Media</option>
                                        <option value="Print">Print / Newspaper</option>
                                        <option value="Referral">Partner Referral</option>
                                        <option value="Event">Community Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Budget ($)</label>
                                    <input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        placeholder="5000"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
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
                                    disabled={createCampaign.isPending}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow transition-colors disabled:opacity-50"
                                >
                                    {createCampaign.isPending ? 'Saving...' : 'Launch Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </div>
    );
}
