import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDonations } from '../../donations/services/donationService';
import { PageHeader } from '../../../components/PageHeader';
import { Search, Users, HeartHandshake, Phone, Mail, Building2, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

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

export function DonorList() {
    const [search, setSearch] = useState('');

    const { data: donations = [], isLoading } = useQuery({
        queryKey: ['uncf-donations'],
        queryFn: getDonations,
    });

    // Derive donor directory purely from returned donation records
    const derivedDonors = useMemo(() => {
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

    const filtered = derivedDonors.filter(
        (d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.donorNo.toLowerCase().includes(search.toLowerCase()) ||
            (d.mobile && d.mobile.includes(search)) ||
            (d.panNumber && d.panNumber.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Donor Directory (Derived View)"
                subtitle="Aggregated donor profiles derived directly from recorded donation receipts."
                breadcrumbs={[{ label: 'UNCF' }, { label: 'Donors' }]}
            />

            {/* Disclaimer Banner */}
            <div className="rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/40 p-4 text-xs font-semibold text-sky-900 dark:text-sky-300 flex items-start gap-2">
                <Users className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                <div>
                    <p className="font-bold">Derived Frontend Directory View</p>
                    <p className="mt-0.5 text-sky-800 dark:text-sky-400">
                        This view aggregates unique donor contacts and calculates total lifetime contributions based on live `/uncf-donations` receipts.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 p-4 shadow-xs">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search donor name, DNR number, mobile..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:outline-none focus:ring-1 focus:ring-[#0F969C] transition-colors"
                    />
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Showing <span className="font-bold text-slate-800 dark:text-white">{filtered.length}</span> unique donors
                </div>
            </div>

            {/* Donor Directory Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-slate-100 dark:border-white/10">
                            <tr>
                                <th className="px-6 py-4">Donor No</th>
                                <th className="px-6 py-4">Donor Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Receipts Issued</th>
                                <th className="px-6 py-4">Last Contribution</th>
                                <th className="px-6 py-4 text-right">Total Contributed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                                        Loading donor summary...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                                        No donors found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((donor) => (
                                    <tr key={donor.donorNo + donor.name} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{donor.donorNo}</td>
                                        <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">{donor.name}</td>
                                        <td className="px-6 py-4">
                                            {donor.isCorporate ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 text-xs font-bold text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                                                    <Building2 className="h-3 w-3" />
                                                    Corporate CSR
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    <UserIcon className="h-3 w-3" />
                                                    Individual
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                                            {donor.mobile && (
                                                <p className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                                                    {donor.mobile}
                                                </p>
                                            )}
                                            {donor.email && (
                                                <p className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                                                    {donor.email}
                                                </p>
                                            )}
                                            {!donor.mobile && !donor.email && '-'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                                            {donor.donationCount} {donor.donationCount === 1 ? 'receipt' : 'receipts'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                                            {donor.lastDonationDate ? format(new Date(donor.lastDonationDate), 'dd MMM yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                                            ₹{donor.totalContributed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
