import { CalendarClock, IndianRupee, ShieldCheck, TrendingUp } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { useUecFinanceDashboard } from '../../../hooks/useDashboard'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const colors = ['#0F969C', '#294D61', '#6DA5C0', '#0C7075', '#072E33', '#8BC7DC']

const formatShortMoney = (amount: number) => {
    if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`
    if (amount >= 1000) return `Rs ${Math.round(amount / 1000)}k`
    return `Rs ${Math.round(amount)}`
}

const buildEmptyMonthlyTrend = (keys: string[]) => {
    const today = new Date()
    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1)
        return keys.reduce<Record<string, string | number>>((row, key) => {
            row[key] = 0
            return row
        }, { month: date.toLocaleDateString('en-IN', { month: 'short' }) })
    })
}

export function ElderFinanceDashboard() {
    const { data: uecFinanceData, isLoading } = useUecFinanceDashboard()
    const trendData = uecFinanceData?.trend?.datasets || []

    const activeTrend = trendData.length > 0 ? buildEmptyMonthlyTrend(['volume', 'pending', 'completed']).map((bucket, index) => {
        bucket.volume = trendData[0]?.data?.[index] || 0;
        bucket.pending = trendData[1]?.data?.[index] || 0;
        bucket.completed = trendData[2]?.data?.[index] || 0;
        return bucket;
    }) : buildEmptyMonthlyTrend(['volume', 'pending', 'completed'])

    const volumeCurrent = trendData[0]?.data?.[5] || 0;
    const pendingCurrent = trendData[1]?.data?.[5] || 0;
    const completedCurrent = trendData[2]?.data?.[5] || 0;

    const metrics = [
        { label: 'Monthly Expense', value: isLoading ? '-' : formatShortMoney(volumeCurrent), helper: 'UEC current period spend', icon: IndianRupee },
        { label: 'Pending Bills', value: isLoading ? '-' : pendingCurrent, helper: 'Bills waiting for review', icon: CalendarClock },
        { label: 'Approved Items', value: isLoading ? '-' : completedCurrent, helper: 'Expense records approved', icon: ShieldCheck },
        { label: 'Variance', value: '0%', helper: 'Expense variance from plan', icon: TrendingUp }
    ]

    const split = [
        { name: 'Monthly Expense', value: volumeCurrent },
        { name: 'Pending Bills', value: pendingCurrent },
        { name: 'Approved Items', value: completedCurrent }
    ]

    return (
        <div className="w-full min-w-0 space-y-4 px-2 pb-6 sm:px-4 2xl:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <PageHeader
                    title="Elder Finance Dashboard"
                    subtitle="UEC in-house expense, care spending, approvals, and elder finance monitoring."
                    breadcrumbs={[{ label: 'UEC' }, { label: 'Elder Finance' }, { label: 'Dashboard' }]}
                />
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    <Link
                        to="/finance/inhouse-expense"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-extrabold text-gray-700 shadow-sm transition hover:border-primary-300 hover:text-[#0F969C] dark:border-white/10 dark:bg-black dark:text-gray-100"
                    >
                        In-House Expense
                    </Link>
                </div>
            </div>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon
                    return (
                        <div key={metric.label} className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F969C]/10 text-[#0F969C]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="h-2.5 w-2.5 rounded-full bg-[#0F969C]" />
                            </div>
                            <p className="mt-4 text-2xl font-extrabold leading-none text-gray-950 dark:text-gray-100">{metric.value}</p>
                            <p className="mt-2 text-sm font-extrabold text-gray-700 dark:text-gray-200">{metric.label}</p>
                            <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{metric.helper}</p>
                        </div>
                    )
                })}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <div className="min-h-[340px] rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-950 dark:text-gray-100">Elder Finance Movement</h2>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expense volume, pending records, and approved transactions</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-[#0F969C]" />
                    </div>
                    <div className="h-[260px] w-full min-w-[1px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <BarChart data={activeTrend} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <Tooltip />
                                <Legend />
                                {['volume', 'pending', 'completed'].map((key, index) => (
                                    <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[8, 8, 0, 0]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="min-h-[340px] rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-gray-100">Finance Split</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current period finance distribution</p>
                    <div className="mt-4 h-[260px] w-full min-w-[1px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <PieChart>
                                <Pie data={split} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="76%" paddingAngle={4}>
                                    {split.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        </div>
    )
}
