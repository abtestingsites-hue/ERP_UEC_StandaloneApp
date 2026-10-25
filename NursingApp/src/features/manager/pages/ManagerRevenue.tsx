import { useMemo, useState } from 'react';
import { IndianRupee, Package, FileText, Users, ArrowLeft, Eye, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { useMedicalPatients } from '../hooks/useNursingManager';
import { useManagerRevenue } from '../hooks/useManagerRevenue';

const formatMoney = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const daysInMonth = (monthStr: string) => {
    const [year, monthNum] = monthStr.split('-').map(Number);
    if (!year || !monthNum) return 31;
    return new Date(year, monthNum, 0).getDate();
};

const formatMonthLabel = (monthStr: string) => {
    const [year, monthNum] = monthStr.split('-').map(Number);
    if (!year || !monthNum) return monthStr;
    const date = new Date(year, monthNum - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getCurrentMonthStr = () => new Date().toISOString().slice(0, 7);

export default function ManagerRevenue() {
    const [month, setMonth] = useState<string>(getCurrentMonthStr());
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [source, setSource] = useState<'ALL' | 'MANUAL' | 'INVENTORY'>('ALL');

    const { data: activePatients = [], isLoading: isLoadingPatients } = useMedicalPatients();
    const { data: revenueData, isLoading: isLoadingRevenue, isError, error, refetch } = useManagerRevenue({
        month,
        patientId: selectedPatientId || undefined,
        source
    });

    const daysCount = useMemo(() => daysInMonth(month), [month]);
    const daysArray = useMemo(() => Array.from({ length: daysCount }, (_, i) => i + 1), [daysCount]);

    const selectedPatientData = useMemo(() => {
        if (!selectedPatientId || !revenueData?.patients) return null;
        return revenueData.patients.find((p) => p.patientId === selectedPatientId) || null;
    }, [revenueData, selectedPatientId]);

    const activePatientMap = useMemo(() => {
        const map = new Map<string, { id: string; name: string; elderId: string }>();
        for (const p of activePatients) {
            map.set(p.id, p);
        }
        return map;
    }, [activePatients]);

    const summary = revenueData?.summary || {
        patientCount: activePatients.length || 0,
        manualTotal: 0,
        inventoryTotal: 0,
        totalAmount: 0
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <PageHeader
                title="Care Giver's Total Revenue Form"
                subtitle="Monthly operational usage, inventory tracking, and revenue review for nursing care."
                breadcrumbs={[
                    { label: 'Manager Workspace', path: '/manager' },
                    { label: 'Revenue' }
                ]}
            />

            {/* Control Bar Card */}
            <div className="bg-white dark:bg-[#072E33] rounded-2xl p-5 border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    
                    {/* Month Selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#B8D9E8] mb-1.5">
                            Month
                        </label>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-[#6DA5C0]/30 bg-gray-50 dark:bg-[#05161A] text-gray-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#0F969C]"
                        />
                    </div>

                    {/* Patient Selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#B8D9E8] mb-1.5">
                            Patient Filter
                        </label>
                        <select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            disabled={isLoadingPatients}
                            className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-[#6DA5C0]/30 bg-gray-50 dark:bg-[#05161A] text-gray-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#0F969C]"
                        >
                            <option value="">All Patients (Manager Summary)</option>
                            {activePatients.map((patient) => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.name} {patient.elderId ? `(${patient.elderId})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Source Filter */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#B8D9E8] mb-1.5">
                            Usage Source
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-[#05161A] p-1 rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20">
                            {(['ALL', 'MANUAL', 'INVENTORY'] as const).map((srcOption) => (
                                <button
                                    key={srcOption}
                                    onClick={() => setSource(srcOption)}
                                    className={`h-9 text-xs font-extrabold rounded-lg transition-all ${
                                        source === srcOption
                                            ? 'bg-[#0F969C] text-white shadow-sm'
                                            : 'text-gray-600 dark:text-[#B8D9E8] hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    {srcOption === 'ALL' ? 'All Sources' : srcOption === 'MANUAL' ? 'Manual' : 'Inventory'}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-5 border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex items-center space-x-4">
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Manual Usage</p>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatMoney(summary.manualTotal)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-5 border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex items-center space-x-4">
                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Inventory Issued</p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">Read-Only</span>
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatMoney(summary.inventoryTotal)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-5 border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex items-center space-x-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Total Usage</p>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatMoney(summary.totalAmount)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-5 border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex items-center space-x-4">
                    <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider">Active Patients</p>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{summary.patientCount}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {isLoadingRevenue ? (
                <div className="bg-white dark:bg-[#072E33] rounded-2xl p-12 border border-gray-100 dark:border-[#6DA5C0]/15 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0F969C]" />
                    <p className="text-sm font-bold text-gray-600 dark:text-[#B8D9E8]">Loading revenue data...</p>
                </div>
            ) : isError ? (
                <div className="bg-red-50 dark:bg-red-950/40 rounded-2xl p-6 border border-red-200 dark:border-red-900/50 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                        {error instanceof Error ? error.message : 'Failed to load manager revenue.'}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : !selectedPatientId ? (
                /* ALL PATIENTS OVERVIEW TABLE */
                <div className="bg-white dark:bg-[#072E33] rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">Active Patients Revenue Summary</h2>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">
                                Overview for {formatMonthLabel(month)} ({summary.patientCount} active nursing patients)
                            </p>
                        </div>
                    </div>

                    {!revenueData?.patients?.length ? (
                        <div className="p-12 text-center text-gray-500 dark:text-[#B8D9E8]">
                            No active nursing patients or revenue entries found for this month.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-[#05161A] text-xs font-bold text-gray-500 dark:text-[#B8D9E8] uppercase tracking-wider border-b border-gray-100 dark:border-[#6DA5C0]/15">
                                    <tr>
                                        <th className="py-3.5 px-4">Patient Name</th>
                                        <th className="py-3.5 px-4">Elder ID</th>
                                        <th className="py-3.5 px-4 text-right">Manual Total</th>
                                        <th className="py-3.5 px-4 text-right">Inventory Total</th>
                                        <th className="py-3.5 px-4 text-right">Total Amount</th>
                                        <th className="py-3.5 px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-[#6DA5C0]/15 font-medium">
                                    {revenueData.patients.map((p) => {
                                        const activeMeta = activePatientMap.get(p.patientId);
                                        const displayName = p.patientName || activeMeta?.name || 'Patient';
                                        const displayElder = p.elderId || activeMeta?.elderId || '-';

                                        return (
                                            <tr key={p.patientId} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                                                    {displayName}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-500 dark:text-[#B8D9E8] font-mono text-xs">
                                                    {displayElder}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                                                    {formatMoney(p.totals?.manual || 0)}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                                    {formatMoney(p.totals?.inventory || 0)}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                                    {formatMoney(p.totals?.total || 0)}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedPatientId(p.patientId)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F969C]/10 text-[#0F969C] hover:bg-[#0F969C] hover:text-white text-xs font-bold transition-all"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View Form
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* INDIVIDUAL PATIENT "CARE GIVER'S TOTAL REVENUE FORM" */
                <div className="space-y-6">
                    {/* Selected Patient Banner */}
                    <div className="bg-white dark:bg-[#072E33] rounded-2xl p-5 border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setSelectedPatientId('')}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-[#05161A] text-gray-700 dark:text-[#B8D9E8] hover:bg-gray-200 dark:hover:bg-[#0F969C] dark:hover:text-white transition-all"
                                title="Back to All Patients"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                    {selectedPatientData?.patientName || activePatientMap.get(selectedPatientId)?.name || 'Patient'}
                                </h2>
                                <p className="text-xs font-semibold text-gray-500 dark:text-[#B8D9E8] flex items-center gap-2 mt-0.5">
                                    <span>Elder ID: <strong className="font-mono text-gray-800 dark:text-white">{selectedPatientData?.elderId || activePatientMap.get(selectedPatientId)?.elderId || 'N/A'}</strong></span>
                                    <span>•</span>
                                    <span>{formatMonthLabel(month)}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 dark:text-[#B8D9E8] uppercase">Patient Monthly Total</p>
                                <p className="text-2xl font-extrabold text-[#0F969C]">
                                    {formatMoney(selectedPatientData?.totals?.total || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Care Giver's Total Revenue Form Grid */}
                    <div className="bg-white dark:bg-[#072E33] rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm p-5 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-[#6DA5C0]/15">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Care Giver's Total Revenue Form</h3>
                                <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">Day-wise itemized log for {formatMonthLabel(month)}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold">
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                                    Manual
                                </span>
                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                                    Inventory (Read-Only)
                                </span>
                            </div>
                        </div>

                        {!selectedPatientData?.entries?.length ? (
                            <div className="p-10 text-center text-gray-500 dark:text-[#B8D9E8] bg-gray-50/50 dark:bg-[#05161A]/50 rounded-xl border border-dashed border-gray-200 dark:border-[#6DA5C0]/20">
                                No revenue entries recorded for this patient in {formatMonthLabel(month)}.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20">
                                <table className="min-w-[1400px] border-collapse text-xs">
                                    <thead className="bg-gray-50 dark:bg-[#05161A] text-gray-700 dark:text-[#B8D9E8] font-bold">
                                        <tr>
                                            <th className="w-56 border-b border-r border-gray-200 dark:border-[#6DA5C0]/20 p-2.5 text-left sticky left-0 bg-gray-50 dark:bg-[#05161A] z-10">Particulars / Item</th>
                                            <th className="w-24 border-b border-r border-gray-200 dark:border-[#6DA5C0]/20 p-2.5 text-center">Source</th>
                                            <th className="w-24 border-b border-r border-gray-200 dark:border-[#6DA5C0]/20 p-2.5 text-right">Rate</th>
                                            {daysArray.map((d) => (
                                                <th key={d} className="w-10 border-b border-r border-gray-200 dark:border-[#6DA5C0]/20 p-2 text-center font-bold">
                                                    {d}
                                                </th>
                                            ))}
                                            <th className="w-28 border-b border-gray-200 dark:border-[#6DA5C0]/20 p-2.5 text-right font-bold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-[#6DA5C0]/20 font-medium">
                                        {selectedPatientData.entries.map((entry, idx) => {
                                            const entryDate = entry.date ? new Date(entry.date) : null;
                                            const entryDayNum = entryDate ? entryDate.getDate() : 0;
                                            const isInventory = entry.sourceGroup === 'INVENTORY';

                                            return (
                                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="border-r border-gray-200 dark:border-[#6DA5C0]/20 p-2.5 font-bold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-[#072E33] z-10">
                                                        {entry.category || entry.description}
                                                        <span className="block text-[10px] font-normal text-gray-400 dark:text-[#B8D9E8] truncate max-w-[200px]">
                                                            {entry.description}
                                                        </span>
                                                    </td>
                                                    <td className="border-r border-gray-200 dark:border-[#6DA5C0]/20 p-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                                            isInventory
                                                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                                        }`}>
                                                            {isInventory ? 'INVENTORY' : 'MANUAL'}
                                                        </span>
                                                    </td>
                                                    <td className="border-r border-gray-200 dark:border-[#6DA5C0]/20 p-2.5 text-right font-mono text-gray-700 dark:text-[#D8EEF5]">
                                                        {formatMoney(entry.rate)}
                                                    </td>
                                                    {daysArray.map((d) => (
                                                        <td
                                                            key={d}
                                                            className={`border-r border-gray-200 dark:border-[#6DA5C0]/20 p-2 text-center font-bold ${
                                                                d === entryDayNum
                                                                    ? 'bg-[#0F969C]/10 text-[#0F969C] dark:text-[#6DA5C0]'
                                                                    : 'text-gray-300 dark:text-gray-700'
                                                            }`}
                                                        >
                                                            {d === entryDayNum ? entry.quantity : ''}
                                                        </td>
                                                    ))}
                                                    <td className="p-2.5 text-right font-extrabold text-gray-900 dark:text-white font-mono">
                                                        {formatMoney(entry.amount)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Daily Summary & Breakdown */}
                    {Boolean(selectedPatientData?.dailyTotals?.length) && (
                        <div className="bg-white dark:bg-[#072E33] rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm p-5 space-y-4">
                            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Daily Revenue Summary</h3>
                            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 dark:bg-[#05161A] text-gray-600 dark:text-[#B8D9E8] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-[#6DA5C0]/20">
                                        <tr>
                                            <th className="py-2.5 px-4">Date</th>
                                            <th className="py-2.5 px-4 text-right">Manual Usage</th>
                                            <th className="py-2.5 px-4 text-right">Inventory Issued</th>
                                            <th className="py-2.5 px-4 text-right">Daily Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-[#6DA5C0]/20 font-medium">
                                        {selectedPatientData!.dailyTotals.map((dt) => (
                                            <tr key={dt.date} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white font-mono">
                                                    {dt.date}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-semibold text-amber-600 dark:text-amber-400">
                                                    {formatMoney(dt.manual)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {formatMoney(dt.inventory)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-extrabold text-gray-900 dark:text-white">
                                                    {formatMoney(dt.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Caregiver Sheet / Signature Context */}
                    <div className="bg-white dark:bg-[#072E33] rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#6DA5C0]/15">
                            <div className="flex items-center space-x-2">
                                <ShieldCheck className="w-5 h-5 text-[#0F969C]" />
                                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Operational Review & Signatures</h3>
                            </div>
                            {selectedPatientData?.caregiverSheet && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#0F969C]/10 text-[#0F969C]">
                                    Status: {selectedPatientData.caregiverSheet.status}
                                </span>
                            )}
                        </div>

                        {!selectedPatientData?.caregiverSheet ? (
                            <div className="p-4 bg-gray-50 dark:bg-[#05161A] rounded-xl text-xs text-gray-500 dark:text-[#B8D9E8]">
                                No Caregiver Revenue Sheet recorded for this patient for {formatMonthLabel(month)}.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {([
                                    ['caregiverDay', 'Caregiver Day'],
                                    ['caregiverNight', 'Caregiver Night'],
                                    ['nurse', 'Nurse'],
                                    ['manager', 'Manager']
                                ] as const).map(([key, label]) => {
                                    const sigValue = selectedPatientData.caregiverSheet?.signatures?.[key];
                                    return (
                                        <div key={key} className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#05161A] border border-gray-200 dark:border-[#6DA5C0]/20 space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                                {sigValue || 'Pending Review'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
