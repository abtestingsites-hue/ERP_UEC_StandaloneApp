import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDonations } from '../services/donationService';
import { Plus, Search, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { DonationReceiptPdf } from '../components/DonationReceiptPdf';
import { PageHeader } from '../../../components/PageHeader';
import { Link } from 'react-router-dom';

export const DonationList = () => {
    const [search, setSearch] = useState('');
    const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);

    const { data: donations = [], isLoading } = useQuery({
        queryKey: ['uncf-donations'],
        queryFn: getDonations,
    });

    const filtered = donations.filter((d) =>
        d.donor?.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.receiptNo?.toLowerCase().includes(search.toLowerCase()) ||
        d.donor?.mobile?.includes(search) ||
        d.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="UNCF Donations Register"
                subtitle="View donation receipts, audit payment ledgers, and manage 80G tax receipts."
                breadcrumbs={[{ label: 'UNCF' }, { label: 'Donations' }]}
                action={
                    <Link
                        to="/donations/new"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0F969C] hover:bg-[#0D8287] px-4 text-sm font-semibold text-white transition-colors shadow-xs"
                    >
                        <Plus size={18} />
                        New Receipt
                    </Link>
                }
            />

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 p-4 shadow-xs">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search receipt no, donor, mobile..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:outline-none focus:ring-1 focus:ring-[#0F969C] transition-colors"
                    />
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Showing <span className="font-bold text-slate-800 dark:text-white">{filtered.length}</span> of <span className="font-bold text-slate-800 dark:text-white">{donations.length}</span> total receipts
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-slate-100 dark:border-white/10">
                            <tr>
                                <th className="px-6 py-4">Receipt No</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Donor Name</th>
                                <th className="px-6 py-4">Mobile</th>
                                <th className="px-6 py-4">Payment Mode</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0F969C]"></div>
                                            <span>Loading donations...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                                        No donations found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((donation) => (
                                    <tr key={donation.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{donation.receiptNo}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {donation.date ? format(new Date(donation.date), 'dd MMM yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{donation.donor?.name || 'Anonymous'}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{donation.donor?.mobile || donation.donor?.whatsappNumber || '-'}</td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            <span className="inline-block rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {donation.paymentMode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{donation.category || 'General'}</td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                                            ₹{donation.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedDonationId(donation.id)}
                                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] px-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-[#0F969C] dark:hover:text-[#0F969C] transition-colors shadow-xs"
                                            >
                                                <FileText size={14} />
                                                View Receipt
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedDonationId && (
                <DonationReceiptPdf
                    donationId={selectedDonationId}
                    onClose={() => setSelectedDonationId(null)}
                />
            )}
        </div>
    );
};
