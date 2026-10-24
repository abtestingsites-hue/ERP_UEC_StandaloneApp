import { useMemo } from 'react'
import { Clock, LogIn, LogOut } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useMarkMyAttendance, useMyAttendanceLogs } from '../../hr/hooks/useHR'

type AttendanceLog = {
    id: string
    date: string
    empId: string
    name: string
    checkIn: string
    checkOut: string
    status: string
}

const today = new Date().toISOString().split('T')[0]

const formatDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

export function MyAttendance() {
    const { data: attendanceLogs = [], isLoading } = useMyAttendanceLogs()
    const markAttendance = useMarkMyAttendance()

    const todayLog = useMemo(() => {
        return attendanceLogs.find((log) => log.date === today) || attendanceLogs[0]
    }, [attendanceLogs])

    const hasCheckedIn = Boolean(todayLog?.checkIn && todayLog.checkIn !== '-')
    const hasCheckedOut = Boolean(todayLog?.checkOut && todayLog.checkOut !== '-')

    const columns: Column<AttendanceLog>[] = [
        { key: 'date', header: 'Date', sortable: true, cell: (row) => formatDate(row.date) },
        { key: 'checkIn', header: 'Check In' },
        { key: 'checkOut', header: 'Check Out' },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="My Attendance"
                subtitle="Mark your daily attendance and review your attendance history."
                breadcrumbs={[{ label: 'Profile' }, { label: 'My Attendance' }]}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1.9fr]">
                <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-[#0F969C]">
                            <Clock className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Today</p>
                            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">{formatDate(today)}</h2>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Check In</p>
                            <p className="mt-1 text-lg font-extrabold text-slate-950">{todayLog?.checkIn || '-'}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Check Out</p>
                            <p className="mt-1 text-lg font-extrabold text-slate-950">{todayLog?.checkOut || '-'}</p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="button"
                            disabled={hasCheckedIn || markAttendance.isPending}
                            onClick={() => markAttendance.mutate({ action: 'CHECK_IN' })}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-[#294D61] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                            <LogIn className="h-4 w-4" />
                            Check In
                        </button>
                        <button
                            type="button"
                            disabled={!hasCheckedIn || hasCheckedOut || markAttendance.isPending}
                            onClick={() => markAttendance.mutate({ action: 'CHECK_OUT' })}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                            <LogOut className="h-4 w-4" />
                            Check Out
                        </button>
                    </div>
                </section>

                <DataTable
                    data={attendanceLogs}
                    columns={columns}
                    keyExtractor={(row) => row.id}
                    isLoading={isLoading}
                    emptyStateMessage="No attendance records yet."
                />
            </div>
        </div>
    )
}
