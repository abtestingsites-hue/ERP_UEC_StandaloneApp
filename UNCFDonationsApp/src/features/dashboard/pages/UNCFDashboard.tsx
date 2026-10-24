import { useQuery } from '@tanstack/react-query';
import { getDonations } from '../../donations/services/donationService';
import { getProjects } from '../../projects/services/projectService';
import { getFundingAllocations } from '../../funding/services/fundingService';
import { getProjectExpenditures } from '../../expenditures/services/expenditureService';
import { PageHeader } from '../../../components/PageHeader';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { HeartHandshake, FolderKanban, PiggyBank, Receipt, IndianRupee, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const currency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export function UNCFDashboard() {
    const { data: donations = [], isLoading: loadingDonations, isError: errorDonations } = useQuery({
        queryKey: ['uncf-donations'],
        queryFn: getDonations,
    });

    const { data: projects = [], isLoading: loadingProjects } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    const { data: allocations = [], isLoading: loadingAllocations } = useQuery({
        queryKey: ['fundingAllocations'],
        queryFn: getFundingAllocations,
    });

    const { data: expenditures = [], isLoading: loadingExpenditures } = useQuery({
        queryKey: ['projectExpenditures'],
        queryFn: getProjectExpenditures,
    });

    const isLoading = loadingDonations || loadingProjects || loadingAllocations || loadingExpenditures;

    const totalCollected = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalSpent = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalProjectTarget = projects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
    const activeProjectCount = projects.filter((p) => p.status !== 'CANCELLED' && p.status !== 'COMPLETED').length;

    if (isLoading) return <SkeletonLoader />;

    const kpis = [
        { label: 'Total Funds Collected', value: currency(totalCollected), icon: HeartHandshake, color: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40' },
        { label: 'Funds Allocated', value: currency(totalAllocated), icon: PiggyBank, color: 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40' },
        { label: 'Project Expenditures', value: currency(totalSpent), icon: Receipt, color: 'text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40' },
        { label: 'Active Projects', value: activeProjectCount, icon: FolderKanban, color: 'text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40' },
        { label: 'Target Project Budget', value: currency(totalProjectTarget), icon: IndianRupee, color: 'text-[#0F969C] dark:text-[#6DA5C0] bg-[#0F969C]/10 dark:bg-[#0F969C]/20 border-[#0F969C]/20 dark:border-[#0F969C]/30' }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="UNCF Foundation Command Center"
                subtitle="Live executive dashboard for donations, charitable projects, funding allocations, and expenditures."
                breadcrumbs={[{ label: 'UNCF Foundation' }, { label: 'Dashboard' }]}
                action={
                    <Link
                        to="/donations/new"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] hover:bg-[#0D8287] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors"
                    >
                        <Plus size={18} />
                        New Donation Receipt
                    </Link>
                }
            />

            {errorDonations && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm font-semibold text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Live donation records could not be fetched from the backend.</span>
                </div>
            )}

            {/* Live KPI Metric Cards */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {kpis.map(({ label, value, icon: Icon, color }) => (
                    <div
                        key={label}
                        className="rounded-[24px] border border-slate-200/80 dark:border-white/10 p-5 shadow-xs bg-white dark:bg-[#072E33]/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/40 relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between">
                            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xs ${color}`}>
                                <Icon className="h-6 w-6" />
                            </span>
                        </div>
                        <p className="mt-4 text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                            {value}
                        </p>
                        <p className="mt-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {label}
                        </p>
                    </div>
                ))}
            </section>

            {/* Live Data Grid */}
            <div className="grid gap-6 xl:grid-cols-2">
                {/* Recent Live Donations */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-4">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Donations</h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Latest receipts recorded in database</p>
                        </div>
                        <Link to="/donations" className="text-xs font-bold text-[#0F969C] hover:underline">
                            View All ({donations.length}) →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-3 py-2.5">Receipt No</th>
                                    <th className="px-3 py-2.5">Donor</th>
                                    <th className="px-3 py-2.5">Date</th>
                                    <th className="px-3 py-2.5 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {donations.slice(0, 5).map((donation) => (
                                    <tr key={donation.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200">{donation.receiptNo}</td>
                                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{donation.donor?.name || 'Anonymous'}</td>
                                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{donation.date ? format(new Date(donation.date), 'dd MMM yyyy') : '-'}</td>
                                        <td className="px-3 py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                            ₹{donation.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {donations.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-6 text-center text-slate-400 dark:text-slate-500">
                                            No donations recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Foundation Projects Overview */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-4">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Charitable Projects</h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Live project pipeline & budgets</p>
                        </div>
                        <Link to="/projects" className="text-xs font-bold text-[#0F969C] hover:underline">
                            View All ({projects.length}) →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {projects.slice(0, 4).map((project) => (
                            <div key={project.id} className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-3 flex items-center justify-between">
                                <div>
                                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">{project.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Budget: {currency(project.totalBudget)}</p>
                                </div>
                                <span className="inline-flex rounded-full bg-[#0F969C]/10 dark:bg-[#0F969C]/20 px-3 py-1 text-xs font-extrabold text-[#0F969C] uppercase tracking-wider">
                                    {project.status}
                                </span>
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">No projects created yet.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
