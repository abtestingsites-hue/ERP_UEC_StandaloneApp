import { useMemo, useState } from 'react'
import { CheckCircle2, Download, RefreshCw, X } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { usePayrollPreview, useProcessPayroll } from '../hooks/useHR'

type PayrollRow = {
    id: string
    staffId: string
    empId: string
    name: string
    role: string
    department: string
    month: string
    workingDays: number
    presentDays: number
    approvedLeaveDays: number
    absentDays: number
    baseSalary: number
    fixedAllowance: number
    fixedDeduction: number
    grossPay: number
    deductions: number
    netPay: number
    status: string
    processedAt?: string | null
    processedBy?: string | null
}

const currentMonth = new Date().toISOString().slice(0, 7)
const money = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

export function Payroll() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(currentMonth)
    const [selectedPayslip, setSelectedPayslip] = useState<PayrollRow | null>(null)
    const { data = [], isLoading, refetch, isFetching } = usePayrollPreview({ month: selectedMonth, scope: 'all' })
    const processPayroll = useProcessPayroll()

    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return data.filter((row) =>
            (row.name || '').toLowerCase().includes(query) ||
            (row.empId || '').toLowerCase().includes(query) ||
            (row.role || '').toLowerCase().includes(query)
        )
    }, [data, searchQuery])

    const summary = useMemo(() => {
        return filteredData.reduce(
            (acc, row) => {
                acc.staff += 1
                acc.gross += row.grossPay
                acc.deductions += row.deductions
                acc.net += row.netPay
                return acc
            },
            { staff: 0, gross: 0, deductions: 0, net: 0 }
        )
    }, [filteredData])

    const columns: Column<PayrollRow>[] = [
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Staff Name', sortable: true, cell: (row) => <div><p className="font-extrabold">{row.name}</p><p className="text-xs text-slate-500">{row.role}</p></div> },
        { key: 'month', header: 'Month', sortable: true },
        { key: 'presentDays', header: 'Attendance', cell: (row) => `${row.presentDays}/${row.workingDays}` },
        { key: 'approvedLeaveDays', header: 'Approved Leave', cell: (row) => row.approvedLeaveDays },
        { key: 'baseSalary', header: 'Base Salary', cell: (row) => money(row.baseSalary) },
        { key: 'fixedAllowance', header: 'Allowance', cell: (row) => money(row.fixedAllowance) },
        { key: 'grossPay', header: 'Gross Pay', cell: (row) => money(row.grossPay) },
        { key: 'deductions', header: 'Deductions', cell: (row) => money(row.deductions) },
        { key: 'netPay', header: 'Net Payable', cell: (row) => <span className="font-extrabold">{money(row.netPay)}</span>, sortable: true },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="Payroll Processing"
                subtitle="Live payroll preview from manual staff, attendance, and approved leave data."
                breadcrumbs={[{ label: 'Human Resource' }, { label: 'Payroll' }]}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {[
                    { label: 'Staff in Payroll', value: summary.staff, tone: 'bg-slate-50 text-slate-700' },
                    { label: 'Gross Pay', value: money(summary.gross), tone: 'bg-primary-50 text-primary-700' },
                    { label: 'Deductions', value: money(summary.deductions), tone: 'bg-amber-50 text-amber-700' },
                    { label: 'Net Payable', value: money(summary.net), tone: 'bg-emerald-50 text-emerald-700' }
                ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 px-4 py-3 ${item.tone}`}>
                        <p className="text-xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    Payroll Month
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(event) => setSelectedMonth(event.target.value || currentMonth)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                    />
                </label>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-[#294D61]"
                >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh Preview
                </button>
            </div>

            <FilterSection searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} searchPlaceholder="Search staff, employee ID, or role..." />
            <DataTable
                data={filteredData}
                columns={columns}
                keyExtractor={(row) => row.id}
                isLoading={isLoading}
                emptyStateMessage="No manual staff payroll data found. Add manual staff and attendance first."
                actions={(row) => (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedPayslip(row)}
                            className="flex items-center gap-1 rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                            title="Payslip preview"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        {row.status === 'Processed' ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Done
                            </span>
                        ) : (
                            <button
                                type="button"
                                disabled={processPayroll.isPending || row.grossPay <= 0}
                                onClick={() => processPayroll.mutate({ staffId: row.staffId, month: row.month })}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#0F969C] px-2 py-1 text-xs font-extrabold text-white shadow-sm hover:bg-[#294D61] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                                title={row.grossPay <= 0 ? 'Set salary before processing' : 'Process payroll'}
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Process
                            </button>
                        )}
                    </div>
                )}
            />

            {selectedPayslip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-950">Payslip Preview</h2>
                                <p className="text-sm font-semibold text-slate-500">{selectedPayslip.month}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPayslip(null)}
                                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
                            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                                <p className="text-xs font-extrabold uppercase tracking-wide text-primary-700">Employee</p>
                                <h3 className="mt-1 text-2xl font-extrabold text-slate-950">{selectedPayslip.name}</h3>
                                <p className="text-sm font-semibold text-slate-600">{selectedPayslip.empId} - {selectedPayslip.role}</p>
                                {selectedPayslip.processedAt && (
                                    <p className="mt-2 text-xs font-bold text-primary-700">
                                        Processed on {new Date(selectedPayslip.processedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {[
                                    { label: 'Working Days', value: selectedPayslip.workingDays },
                                    { label: 'Present', value: selectedPayslip.presentDays },
                                    { label: 'Leave', value: selectedPayslip.approvedLeaveDays },
                                    { label: 'Absent', value: selectedPayslip.absentDays }
                                ].map((item) => (
                                    <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{item.label}</p>
                                        <p className="mt-1 text-xl font-extrabold text-slate-950">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-slate-100">
                                {[
                                    { label: 'Base Salary', value: selectedPayslip.baseSalary },
                                    { label: 'Fixed Allowance', value: selectedPayslip.fixedAllowance },
                                    { label: 'Gross Pay', value: selectedPayslip.grossPay },
                                    { label: 'Deductions', value: selectedPayslip.deductions },
                                    { label: 'Net Payable', value: selectedPayslip.netPay, strong: true }
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                                        <span className="text-sm font-bold text-slate-600">{item.label}</span>
                                        <span className={item.strong ? 'text-lg font-extrabold text-emerald-700' : 'text-sm font-extrabold text-slate-950'}>
                                            {money(item.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-[#294D61]"
                                >
                                    Print
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPayslip(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
