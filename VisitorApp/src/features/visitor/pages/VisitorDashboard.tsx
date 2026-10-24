import { useQuery } from '@tanstack/react-query';
import { visitorService } from '../services';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Clock, UserPlus, ShieldCheck, History, TrendingUp, Users, UserCheck, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

export function VisitorDashboard() {
    const navigate = useNavigate();
    const { data: analytics, isLoading, error } = useQuery({
        queryKey: ['visitorAnalytics'],
        queryFn: visitorService.getAnalytics,
        refetchInterval: 30000
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600"></div>
                    <p className="font-semibold text-slate-500">Loading command center...</p>
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="p-6 text-center text-red-500 font-bold bg-red-50 rounded-xl border border-red-100">
                Failed to load visitor analytics data.
            </div>
        );
    }

    const peakTimeRanges = [
        { label: '8 AM - 10 AM', start: 8, end: 10 },
        { label: '10 AM - 12 PM', start: 10, end: 12 },
        { label: '12 PM - 2 PM', start: 12, end: 14 },
        { label: '2 PM - 4 PM', start: 14, end: 16 },
        { label: '4 PM - 6 PM', start: 16, end: 18 },
        { label: '6 PM - 8 PM', start: 18, end: 20 }
    ];

    const peakData = peakTimeRanges.map(range => {
        let count = 0;
        for (let i = range.start; i < range.end; i++) {
            const h = analytics.hourlyData?.find((d: any) => d.hour === `${i}:00`);
            if (h) count += h.count;
        }
        return { ...range, count };
    });

    const peakRange = peakData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), peakData[0]);
    const maxHourlyCount = Math.max(...(analytics.hourlyData?.map((d: any) => d.count) || [0]), 1);

    const visitorCategories = [
        { name: 'Guests', count: analytics.guestCount, color: 'bg-teal-500', hex: '#14b8a6' },
        { name: 'Vendors', count: analytics.vendorCount, color: 'bg-sky-500', hex: '#0ea5e9' },
        { name: 'Others', count: analytics.otherCount, color: 'bg-slate-400', hex: '#94a3b8' }
    ];
    const chartData = visitorCategories.filter(c => c.count > 0).map(c => ({ name: c.name, value: c.count, color: c.hex }));
    if (chartData.length === 0) {
        chartData.push({ name: 'No Visitors', value: 1, color: '#f1f5f9' });
    }

    return (
        <div className="flex min-h-full flex-col space-y-6 bg-transparent pb-12">
            <PageHeader
                title="Visitor Command Center"
                subtitle="Reception overview, visitor flow, and today's activity."
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/visitor/reports')}
                            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <History className="h-4 w-4" />
                            Visitor History
                        </button>
                        <button
                            onClick={() => navigate('/visitor')}
                            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all"
                        >
                            <UserPlus className="h-4 w-4" />
                            Register Visitor
                        </button>
                    </div>
                }
            />

            {/* TOP BAR: RECEPTION STATUS & QUICK ACTIONS & PENDING */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Reception Status */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-100 opacity-40"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Reception Status</h3>
                        </div>
                        <div className="flex flex-col gap-1 mt-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-2xl font-black text-emerald-700 uppercase">Active</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-500">Visitor desk is operational</span>
                        </div>
                    </div>
                </div>

                {/* Peak Visitor Time */}
                <div className="rounded-2xl border border-teal-100 bg-teal-50/30 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-teal-100 opacity-40"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-teal-600" />
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Peak Visitor Time</h3>
                        </div>
                        <div className="flex flex-col gap-1 mt-4">
                            <span className="text-2xl font-black text-teal-700">{peakRange.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-700">{peakRange.count} visitors</span>
                                <span className="text-xs font-semibold text-slate-500">
                                    ({Math.round((peakRange.count / Math.max(analytics.totalVisitorsToday, 1)) * 100)}% of total)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Passes */}
                <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-100 opacity-40"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Passes</h3>
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-black text-amber-600 leading-none">
                                    {analytics.pendingPasses > 9 ? analytics.pendingPasses : `0${analytics.pendingPasses}`}
                                </span>
                                {analytics.pendingPasses > 0 && (
                                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md mb-1">
                                        Action required
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-semibold text-slate-500 mt-1">
                                {analytics.pendingPasses > 0 ? 'Awaiting action' : 'All clear'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRIMARY KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Today's Visitors" 
                    value={analytics.totalVisitorsToday} 
                    subtitle="Registered passes"
                    color="text-teal-700" 
                    bg="bg-teal-50/30" 
                    circleBg="bg-teal-100"
                    border="border-teal-100"
                    icon={Users}
                    iconColor="text-teal-600"
                />
                <StatCard 
                    title="Currently Inside" 
                    value={analytics.currentlyInside} 
                    subtitle="Live on premises"
                    color="text-emerald-700" 
                    bg="bg-emerald-50/30" 
                    circleBg="bg-emerald-100"
                    border="border-emerald-100"
                    icon={UserCheck}
                    iconColor="text-emerald-600"
                    liveIndicator
                />
                <StatCard 
                    title="Completed Today" 
                    value={analytics.completedToday} 
                    subtitle="Exited visitors"
                    color="text-slate-700" 
                    bg="bg-slate-100/30" 
                    circleBg="bg-slate-200"
                    border="border-slate-200"
                    icon={LogOut}
                    iconColor="text-slate-600"
                />
            </div>

            {/* MAIN OPERATIONAL ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Visitor Flow Today</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">Total Today</span>
                            <span className="bg-teal-50 text-teal-700 text-sm font-black px-2.5 py-1 rounded-lg">
                                {analytics.totalVisitorsToday}
                            </span>
                        </div>
                    </div>
                    <div className="h-[260px] w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.hourlyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="hour" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
                                    dy={10} 
                                    interval="preserveStartEnd"
                                    minTickGap={20}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
                                    dx={-10}
                                    allowDecimals={false}
                                />
                                <RechartsTooltip 
                                    content={<CustomTooltip />} 
                                    cursor={{ fill: '#f8fafc' }} 
                                />
                                <Bar 
                                    dataKey="count" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={24} 
                                    animationDuration={1000}
                                >
                                    {analytics.hourlyData?.map((entry: any, index: number) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.count === maxHourlyCount && entry.count > 0 ? '#0d9488' : '#99f6e4'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Visitor Types</h3>
                        
                        <div className="relative h-[200px] w-full flex items-center justify-center my-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<DonutTooltip />} cursor={false} />
                                </PieChart>
                            </ResponsiveContainer>
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-700 leading-none">{analytics.totalVisitorsToday}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Total</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-6">
                            {visitorCategories.map(cat => {
                                const pct = analytics.totalVisitorsToday > 0 ? Math.round((cat.count / analytics.totalVisitorsToday) * 100) : 0;
                                return (
                                    <div key={cat.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-3 h-3 rounded-full ${cat.color}`}></span>
                                            <span className="font-bold text-slate-600">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-slate-700">{cat.count}</span>
                                            <span className="text-xs font-bold text-slate-400 w-8 text-right">{pct}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs font-semibold text-slate-400">
                        Categorization of all passes created today.
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, color, bg, circleBg, border, liveIndicator, icon: Icon, iconColor }: any) {
    const formattedValue = typeof value === 'number' && value < 10 && value > 0 ? `0${value}` : value;
    
    return (
        <div className={`rounded-2xl border ${border} ${bg} p-6 shadow-sm flex flex-col justify-between relative overflow-hidden`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${circleBg} opacity-40`}></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-end gap-3">
                        <span className={`text-4xl font-black ${color} leading-none`}>{formattedValue}</span>
                        {liveIndicator && (
                            <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live
                            </span>
                        )}
                    </div>
                    <span className="text-sm font-semibold text-slate-500 mt-1">{subtitle}</span>
                </div>
            </div>
        </div>
    );
}

function DonutTooltip({ active, payload }: any) {
    if (active && payload && payload.length && payload[0].name !== 'No Visitors') {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-800 text-white text-xs rounded-xl py-2 px-3 shadow-xl border border-slate-700/50 backdrop-blur-md flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }}></span>
                <span className="font-semibold text-slate-300">{data.name}:</span>
                <span className="font-black text-teal-400">{data.value}</span>
            </div>
        );
    }
    return null;
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 text-white text-xs rounded-xl py-2.5 px-3.5 shadow-xl border border-slate-700/50 backdrop-blur-md">
                <p className="font-semibold mb-1 text-slate-300">{label}</p>
                <p className="font-black text-teal-400 text-base">
                    {payload[0].value} <span className="font-semibold text-slate-300 text-xs">visitors</span>
                </p>
            </div>
        );
    }
    return null;
}
