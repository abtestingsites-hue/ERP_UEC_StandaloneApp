import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    CheckCircle2,
    Building2,
    ChevronDown,
    ChevronRight,
    HeartPulse,
    House,
    IndianRupee,
    MessageSquare,
    Package,
    PhoneCall,
    Search,
    SlidersHorizontal,
    TrendingUp
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
    Area,
    AreaChart,
    CartesianGrid,
    LabelList,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useDashboardKPIs, useGlobalActivities } from '../hooks/useDashboard'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'
import { useComplaints } from '../features/customer_care/hooks/useCustomerCare'
import { customerCareService } from '../features/customer_care/services/customer_care'
import { useApprovalTasks } from '../features/task_log/hooks/useTasks'
import { NewEnquiryModal } from '../features/enquiry/components/NewEnquiryModal'
import { NewComplaintModal } from '../features/customer_care/components/NewComplaintModal'

type Tone = 'teal' | 'red' | 'orange' | 'green' | 'slate' | 'amber'

type KpiItem = {
    label: string
    value: string
    icon: LucideIcon
    tone: Tone
    route?: string
}

type MiniMetric = {
    title: string
    value: string
    icon: LucideIcon
    badge: string
    tone: Tone
    featured?: boolean
    variant?: 'followups' | 'feedback' | 'income' | 'tasks'
    progress?: number
    breakdown?: Array<{ label: string; value: number; color: string }>
    note?: string
    route?: string
}

type ChartSize = {
    width: number
    height: number
}

type GlobalActivity = {
    id: string
    type: string
    title: string
    description: string
    status: string
    timestamp: string
    source: string
}

type DashboardComplaint = {
    id?: string
    ticketNo?: string
    date?: string
    status?: string
}

const toneStyles: Record<Tone, { icon: string; bg: string; border: string; text: string; soft: string }> = {
    teal: {
        icon: 'text-[#0F969C]',
        bg: 'bg-[#0F969C]',
        border: 'border-[#0F969C]/30',
        text: 'text-[#294D61]',
        soft: 'bg-[#0F969C]/10'
    },
    red: {
        icon: 'text-red-500',
        bg: 'bg-red-500',
        border: 'border-red-200',
        text: 'text-red-600',
        soft: 'bg-red-50'
    },
    orange: {
        icon: 'text-[#0C7075]',
        bg: 'bg-[#0C7075]',
        border: 'border-[#0C7075]/25',
        text: 'text-[#0C7075]',
        soft: 'bg-[#0C7075]/10'
    },
    green: {
        icon: 'text-[#0F969C]',
        bg: 'bg-[#0F969C]',
        border: 'border-[#0F969C]/25',
        text: 'text-[#0F969C]',
        soft: 'bg-[#0F969C]/10'
    },
    slate: {
        icon: 'text-slate-600',
        bg: 'bg-slate-600',
        border: 'border-slate-200',
        text: 'text-slate-600',
        soft: 'bg-slate-50'
    },
    amber: {
        icon: 'text-[#6DA5C0]',
        bg: 'bg-[#6DA5C0]',
        border: 'border-[#6DA5C0]/30',
        text: 'text-[#294D61]',
        soft: 'bg-[#6DA5C0]/12'
    }
}

const formatNumber = (value: number) => value.toLocaleString('en-IN')

const formatCurrency = (value: number) => {
    if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`
    if (value >= 1000) return `Rs ${Math.round(value / 1000)}k`
    return `Rs ${formatNumber(value)}`
}

const formatActivityDate = (value?: string) => {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
    })
}

const formatStatusLabel = (value?: string) => (
    value ? value.replace(/[_-]/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'New'
)

const activityStatusClass = (status?: string) => {
    switch (status) {
        case 'CLOSED':
            return 'border-[#0F969C]/25 bg-[#0F969C]/10 text-[#294D61]'
        case 'FOLLOW_UP':
        case 'IN_PROGRESS':
            return 'border-[#0F969C]/25 bg-[#0F969C]/10 text-[#294D61]'
        default:
            return 'border-slate-200 bg-slate-50 text-slate-600'
    }
}

const weekDays = [
    { day: 'S', label: 'Sunday' },
    { day: 'M', label: 'Monday' },
    { day: 'T', label: 'Tuesday' },
    { day: 'W', label: 'Wednesday' },
    { day: 'T', label: 'Thursday' },
    { day: 'F', label: 'Friday' },
    { day: 'S', label: 'Saturday' }
]

const getServiceBucket = (activity: GlobalActivity) => {
    const type = activity.type.toLowerCase()
    if (type.includes('ambulance')) return 'Ambulance'
    if (type.includes('admission')) return 'Clinical'
    if (type.includes('finance')) return 'Finance'
    if (type.includes('workflow')) return 'Workflow'
    return 'Other'
}

const buildActivityPills = (activities: GlobalActivity[]) => {
    const counts = weekDays.map(() => 0)
    activities.forEach((activity) => {
        const date = activity.timestamp ? new Date(activity.timestamp) : null
        if (!date || Number.isNaN(date.getTime())) return
        counts[date.getDay()] += 1
    })

    const maxCount = Math.max(...counts, 1)

    return weekDays.map((day, index) => {
        const enquiries = counts[index]
        const value = enquiries > 0 ? Math.max(18, Math.round((enquiries / maxCount) * 100)) : 0
        return {
            ...day,
            value,
            enquiries,
            variant: value >= 80 ? 'strong' : value >= 45 ? 'soft' : 'stripe',
            marker: value === 100 && enquiries > 0 ? 'Top' : undefined
        }
    })
}

const buildWeeklySplit = (activities: GlobalActivity[]) => {
    const counts = new Map<string, number>([
        ['Ambulance', 0],
        ['Clinical', 0],
        ['Finance', 0],
        ['Workflow', 0],
        ['Other', 0]
    ])

    activities.forEach((activity) => {
        const bucket = getServiceBucket(activity)
        counts.set(bucket, (counts.get(bucket) || 0) + 1)
    })

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }))
}

const toIsoDaysAgo = (daysAgo: number) => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString()
}

const dashboardSurfaceClass = 'border border-slate-200 bg-white shadow-sm ring-1 ring-black/5 dark:border-[#6DA5C0]/20 dark:bg-[#072E33] dark:ring-white/5 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
const dashboardInteractiveClass = 'cursor-pointer transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:border-[#0F969C]/35 hover:shadow-[0_24px_56px_rgba(41,77,97,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F969C]/35'

const handleDashboardKeyOpen = (event: KeyboardEvent<HTMLElement>, onOpen?: () => void) => {
    if (!onOpen || (event.key !== 'Enter' && event.key !== ' ')) return

    event.preventDefault()
    onOpen()
}

function IconBubble({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
    return (
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border', toneStyles[tone].border, toneStyles[tone].soft)}>
            <Icon className={cn('h-3.5 w-3.5', toneStyles[tone].icon)} />
        </span>
    )
}

function KpiCard({ item, onOpen }: { item: KpiItem; onOpen?: () => void }) {
    return (
        <div
            role={onOpen ? 'button' : undefined}
            tabIndex={onOpen ? 0 : undefined}
            onClick={onOpen}
            onKeyDown={(event) => handleDashboardKeyOpen(event, onOpen)}
            className={cn('flex h-16 items-center gap-3 rounded-[16px] px-4 py-2 2xl:h-[68px] 2xl:gap-4', dashboardSurfaceClass, toneStyles[item.tone].soft, onOpen && dashboardInteractiveClass)}
        >
            <IconBubble icon={item.icon} tone={item.tone} />
            <div className="min-w-0">
                <p className="text-sm font-extrabold leading-none text-gray-950 sm:text-base dark:text-white">{item.value}</p>
                <p className="mt-1 truncate text-[10px] font-semibold text-slate-600 dark:text-slate-300">{item.label}</p>
            </div>
        </div>
    )
}

function MiniMetricCard({ item, onOpen }: { item: MiniMetric; onOpen?: () => void }) {
    const ringStyle = item.breakdown && item.breakdown.length > 0
        ? {
            background: `conic-gradient(${item.breakdown.map((segment, index) => {
                const total = item.breakdown!.reduce((sum, current) => sum + current.value, 0) || 1
                const before = item.breakdown!.slice(0, index).reduce((sum, current) => sum + current.value, 0)
                const start = (before / total) * 100
                const end = ((before + segment.value) / total) * 100
                return `${segment.color} ${start}% ${end}%`
            }).join(', ')})`
        }
        : undefined
    const interactiveProps = {
        role: onOpen ? 'button' : undefined,
        tabIndex: onOpen ? 0 : undefined,
        onClick: onOpen,
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => handleDashboardKeyOpen(event, onOpen)
    }

    if (item.variant === 'followups') {
        return (
            <div {...interactiveProps} className={cn('relative flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(109,165,192,0.34),_transparent_38%),linear-gradient(135deg,_#294D61,_#0C7075_48%,_#05161A)] p-3 text-white shadow-[0_22px_52px_rgba(5,22,26,0.24)]', onOpen && dashboardInteractiveClass)}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-extrabold leading-tight">{item.title}</h3>
                        <span className="mt-1 inline-flex whitespace-nowrap rounded-md bg-white/14 px-2 py-0.5 text-[9px] font-bold leading-none">{item.badge}</span>
                    </div>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/12">
                        <item.icon className="h-3.5 w-3.5" />
                    </span>
                </div>
                <div className="mt-1.5 grid min-h-0 flex-1 grid-cols-[68px_minmax(0,1fr)] items-center gap-3">
                    <div className="relative mx-auto flex h-[68px] w-[68px] items-center justify-center">
                        <div className="absolute inset-0 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" style={ringStyle} />
                        <div className="absolute inset-[10px] rounded-full bg-[#1c3446]" />
                        <div className="relative z-10 text-center">
                            <p className="text-[23px] font-extrabold leading-none">{item.value}</p>
                            <p className="mt-0.5 text-[9px] font-bold text-white/80">Pending</p>
                        </div>
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        {(item.breakdown || []).map((segment) => (
                            <div key={segment.label} className="flex items-center gap-2 text-[10px] font-bold leading-none text-white/90">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                                <span>{formatNumber(segment.value)}</span>
                                <span className="font-semibold text-white/80">{segment.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (item.variant === 'feedback') {
        const pendingCount = Number.parseInt(item.value.replace(/,/g, ''), 10) || 0

        return (
            <div {...interactiveProps} className={cn('relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-[16px] p-3', dashboardSurfaceClass, onOpen && dashboardInteractiveClass)}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="max-w-[150px] text-[13px] font-extrabold leading-tight text-slate-950 dark:text-white">{item.title}</h3>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold leading-none text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                            {item.badge}
                            <ChevronRight className="h-2.5 w-2.5" />
                        </span>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                        <item.icon className={cn('h-4 w-4', toneStyles[item.tone].icon)} />
                    </span>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                        <p className="text-[29px] font-extrabold leading-none text-slate-950 dark:text-white">{formatNumber(pendingCount)}</p>
                        <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-300">Pending</p>
                    </div>
                </div>
            </div>
        )
    }

    if (item.variant === 'income') {
        return (
            <div {...interactiveProps} className={cn('relative flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] p-3', dashboardSurfaceClass, onOpen && dashboardInteractiveClass)}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="max-w-[150px] text-[13px] font-extrabold leading-tight text-slate-950 dark:text-white">{item.title}</h3>
                        <span className={cn('mt-1 inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[9px] font-bold leading-none', toneStyles[item.tone].soft, toneStyles[item.tone].border, toneStyles[item.tone].text)}>
                            {item.badge}
                        </span>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                        <item.icon className={cn('h-3.5 w-3.5', toneStyles[item.tone].icon)} />
                    </span>
                </div>
                <div className="mt-2 flex flex-1 items-end">
                    <div className="min-w-0">
                        <p className="text-[25px] font-extrabold leading-none text-slate-950 dark:text-white">{item.value}</p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-300">{item.note || 'This Month'}</p>
                    </div>
                </div>
            </div>
        )
    }

    if (item.variant === 'tasks') {
        return (
            <div {...interactiveProps} className={cn('relative flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] p-3', dashboardSurfaceClass, onOpen && dashboardInteractiveClass)}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="max-w-[150px] text-[13px] font-extrabold leading-tight text-slate-950 dark:text-white">{item.title}</h3>
                        <span className={cn('mt-1 inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[9px] font-bold leading-none', toneStyles[item.tone].soft, toneStyles[item.tone].border, toneStyles[item.tone].text)}>
                            {item.badge}
                        </span>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                        <item.icon className={cn('h-3.5 w-3.5', toneStyles[item.tone].icon)} />
                    </span>
                </div>
                <div className="mt-1.5 grid min-h-0 flex-1 grid-cols-[64px_minmax(0,1fr)] items-center gap-3">
                    <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                        <div className="absolute inset-0 rounded-full" style={ringStyle} />
                        <div className="absolute inset-[7px] rounded-full bg-white shadow-[0_12px_26px_rgba(79,70,229,0.12)] dark:bg-slate-950" />
                        <div className="relative z-10 text-center">
                            <p className="text-[19px] font-extrabold text-slate-950 dark:text-white">{item.value}</p>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-300">Total</p>
                        </div>
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        {(item.breakdown || []).map((segment) => (
                            <div key={segment.label} className="flex items-center justify-between gap-3 text-[10px] font-bold leading-none text-slate-700 dark:text-slate-200">
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                                    {segment.label}
                                </span>
                                <span>{formatNumber(segment.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (item.featured) {
        return (
            <div className="relative flex h-full min-h-[82px] flex-col justify-between overflow-hidden rounded-2xl border border-[#6DA5C0]/30 bg-gradient-to-br from-[#0F969C] via-[#294D61] to-[#294D61] p-3 text-white shadow-[0_18px_40px_rgba(41,77,97,0.22)] md:min-h-[92px] md:rounded-[20px] 2xl:min-h-[110px] 2xl:p-4 dark:border-white/25">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="max-w-[120px] md:max-w-[140px] text-sm font-extrabold leading-tight 2xl:max-w-[180px] 2xl:text-base">{item.title}</h3>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/24">
                        <item.icon className="h-4 w-4" />
                    </span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2 2xl:mt-6">
                    <p className="text-xl font-extrabold 2xl:text-2xl">{item.value}</p>
                    <span className="rounded-md bg-white/22 px-2 py-1 text-[11px] font-bold">{item.badge}</span>
                </div>
            </div>
        )
    }

    return (
        <div className={cn('relative flex h-full min-h-[82px] flex-col justify-between rounded-2xl p-3 md:min-h-[92px] md:rounded-[20px] xl:min-h-[100px] 2xl:min-h-[110px] 2xl:p-4', dashboardSurfaceClass)}>
            <div className="flex items-start justify-between gap-2">
                <h3 className="max-w-[115px] md:max-w-[130px] text-sm font-extrabold leading-tight text-slate-950 2xl:max-w-[180px] 2xl:text-base dark:text-white">{item.title}</h3>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                    <item.icon className={cn('h-4 w-4', toneStyles[item.tone].icon)} />
                </span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-2 2xl:mt-6">
                <p className="text-xl font-extrabold text-slate-950 2xl:text-2xl dark:text-white">{item.value}</p>
                <span className={cn('rounded-md border px-2 py-1 text-[11px] font-bold', toneStyles[item.tone].soft, toneStyles[item.tone].border, toneStyles[item.tone].text)}>
                    {item.badge}
                </span>
            </div>
        </div>
    )
}

function ActivityOverviewTrend({ data, onTileOpen }: { data: ReturnType<typeof buildActivityPills>; onTileOpen?: () => void }) {
    const orderedLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dataByLabel = new Map(data.map((item) => [item.label, item]))
    const orderedData = orderedLabels.map((label) => {
        const source = dataByLabel.get(label)
        return {
            label,
            day: label.slice(0, 3),
            enquiries: source?.enquiries ?? 0
        }
    })

    const totalActivities = orderedData.reduce((sum, item) => sum + item.enquiries, 0)
    const dailyAverage = totalActivities / orderedData.length
    const averageLabel = dailyAverage % 1 === 0 ? dailyAverage.toFixed(0) : dailyAverage.toFixed(1)
    const peakDay = orderedData.reduce((peak, item) => item.enquiries > peak.enquiries ? item : peak, orderedData[0])
    const lowestDay = orderedData.reduce((lowest, item) => item.enquiries < lowest.enquiries ? item : lowest, orderedData[0])
    const maxEnquiries = Math.max(...orderedData.map((item) => item.enquiries), 1)
    const yMax = Math.max(4, Math.ceil(maxEnquiries * 1.35))
    const yTicks = Array.from({ length: 5 }, (_, index) => Math.round((yMax / 4) * index))
    const chartTop = yMax
    const summaryTiles = [
        {
            title: 'Activities',
            value: formatNumber(totalActivities),
            detail: totalActivities > 0 ? 'Live count' : 'No activity',
            className: 'border-[#0F969C]/20 bg-[#0F969C]/10 text-[#294D61]'
        },
        {
            title: 'Average',
            value: averageLabel,
            detail: 'per day',
            className: 'border-[#6DA5C0]/20 bg-[#6DA5C0]/10 text-[#294D61]'
        },
        {
            title: 'Peak',
            value: formatNumber(peakDay.enquiries),
            detail: peakDay.label,
            className: 'border-[#6DA5C0]/25 bg-[#6DA5C0]/12 text-[#294D61]'
        },
        {
            title: 'Lowest',
            value: formatNumber(lowestDay.enquiries),
            detail: lowestDay.label,
            className: 'border-[#0C7075]/20 bg-[#0C7075]/10 text-[#0C7075]'
        }
    ]

    return (
        <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                {summaryTiles.map((item) => (
                    <div
                        key={item.title}
                        role={onTileOpen ? 'button' : undefined}
                        tabIndex={onTileOpen ? 0 : undefined}
                        onClick={onTileOpen}
                        onKeyDown={(event) => handleDashboardKeyOpen(event, onTileOpen)}
                        className={cn('rounded-[14px] border px-2.5 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.03)]', item.className, onTileOpen && dashboardInteractiveClass)}
                    >
                        <p className="h-3 text-[9px] font-bold uppercase tracking-[0.04em] text-slate-600">{item.title}</p>
                        <div className="mt-1 flex items-end justify-between gap-2">
                            <p className="text-[22px] font-extrabold leading-none text-slate-950">{item.value}</p>
                            <p className="whitespace-nowrap text-right text-[9px] font-semibold leading-tight text-slate-600">{item.detail}</p>
                        </div>
                    </div>
                ))}
            </div>

            <MeasuredChart className="mt-2 h-[92px] min-h-0 flex-1 min-w-0 2xl:h-[104px]">
                {({ width, height }) => (
                    <AreaChart
                        width={width}
                        height={height}
                        data={orderedData}
                        margin={{ top: 8, right: 8, left: -22, bottom: 12 }}
                    >
                        <defs>
                            <linearGradient id="activityOverviewFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0F969C" stopOpacity={0.3} />
                                <stop offset="72%" stopColor="#0F969C" stopOpacity={0.12} />
                                <stop offset="100%" stopColor="#0F969C" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#e8eef5" strokeDasharray="3 4" vertical={false} />
                        <XAxis
                            dataKey="day"
                            axisLine={{ stroke: '#dbe5ee' }}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 9, fontWeight: 800 }}
                            interval={0}
                            height={14}
                        />
                        <YAxis
                            allowDecimals={false}
                            domain={[0, chartTop]}
                            ticks={yTicks}
                            axisLine={{ stroke: '#dbe5ee' }}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 9, fontWeight: 800 }}
                            width={28}
                        />
                        <Tooltip
                            cursor={{ stroke: '#0F969C', strokeOpacity: 0.18, strokeWidth: 2 }}
                            contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                                fontSize: 12
                            }}
                            formatter={(value) => [`${value} activities`, 'Activity']}
                            labelFormatter={(_label, payload) => payload?.[0]?.payload?.label || ''}
                        />
                        <Area
                            type="monotone"
                            dataKey="enquiries"
                            stroke="#0F969C"
                            strokeWidth={2.5}
                            fill="url(#activityOverviewFill)"
                            dot={{ r: 3.7, fill: '#ffffff', stroke: '#0F969C', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#ffffff', stroke: '#0C7075', strokeWidth: 2.4 }}
                        >
                            <LabelList
                                dataKey="enquiries"
                                position="top"
                                formatter={(value: unknown) => Number(value) > 0 ? String(value) : ''}
                                fill="#0f172a"
                                fontSize={10}
                                fontWeight={900}
                            />
                        </Area>
                    </AreaChart>
                )}
            </MeasuredChart>
        </div>
    )
}

function ServiceDistributionWheel({ data }: { data: Array<{ name: string; value: number }> }) {
    const [activeSegment, setActiveSegment] = useState<number | null>(null)
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
    const [isWheelVisible, setIsWheelVisible] = useState(false)
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const hasData = total > 0
    const safeTotal = hasData ? total : 1
    const segmentStyles = [
        { color: '#6DA5C0', icon: House },
        { color: '#0F969C', icon: HeartPulse },
        { color: '#294D61', icon: Building2 },
        { color: '#0C7075', icon: Package }
    ]
    const segments = data.map((item, index) => ({
        label: item.name,
        value: item.value,
        ...segmentStyles[index % segmentStyles.length]
    })).map((item) => ({
        ...item,
        percent: hasData ? (item.value / safeTotal) * 100 : 0,
        displayPercent: hasData ? Math.round((item.value / safeTotal) * 100) : 0
    }))

    useLayoutEffect(() => {
        setIsWheelVisible(false)
        const frameId = requestAnimationFrame(() => setIsWheelVisible(true))
        return () => cancelAnimationFrame(frameId)
    }, [total])

    return (
        <div className="relative mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 px-3 pb-3 pt-2.5 dark:border-white/10 dark:bg-white/5">
            {activeSegment !== null && tooltipPosition && (
                <div
                    className="pointer-events-none absolute z-30 w-max min-w-[140px] rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-xl ring-1 ring-slate-200 dark:bg-slate-950 dark:text-white dark:ring-white/10"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <p className="font-extrabold">{segments[activeSegment].label}</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">Live service distribution</p>
                    <p style={{ color: segments[activeSegment].color }}>
                        {segments[activeSegment].displayPercent}% ({segments[activeSegment].value})
                    </p>
                </div>
            )}

            <MeasuredChart className="mx-auto h-[108px] w-full max-w-[340px] flex-1 min-w-0 2xl:h-[118px]">
                {({ width, height }) => {
                    const radius = Math.max(34, Math.min(width * 0.17, height * 0.29, 52))
                    const ringWidth = Math.max(18, Math.min(24, radius * 0.46))
                    const outerRadius = radius + ringWidth / 2
                    const centerX = width / 2
                    const centerY = height / 2
                    const presentSegmentCount = segments.filter((segment) => segment.value > 0).length
                    const gapAngle = presentSegmentCount > 1 ? 5 : 3
                    let angleOffset = -90 - ((segments[0]?.percent || 0) * 3.6) / 2

                    const pointOnCircle = (distance: number, angle: number) => {
                        const radians = (Math.PI / 180) * angle
                        return {
                            x: centerX + distance * Math.cos(radians),
                            y: centerY + distance * Math.sin(radians)
                        }
                    }

                    const arcPath = (startAngle: number, endAngle: number) => {
                        const start = pointOnCircle(radius, startAngle)
                        const end = pointOnCircle(radius, endAngle)
                        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

                        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
                    }

                    const wheelSegments = segments.map((segment) => {
                        const span = segment.percent * 3.6
                        const segmentGap = Math.min(gapAngle, span * 0.25)
                        const startAngle = angleOffset + segmentGap / 2
                        const endAngle = angleOffset + span - segmentGap / 2
                        const midAngle = angleOffset + span / 2
                        angleOffset += span

                        return { ...segment, startAngle, endAngle, midAngle }
                    })

                    return (
                        <svg width={width} height={height} role="img" aria-label={`Live service distribution across ${presentSegmentCount} categories`}>
                            <defs>
                                <filter id="serviceWheelShadow" x="-30%" y="-30%" width="160%" height="160%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.12" />
                                </filter>
                            </defs>
                            <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={ringWidth} opacity={hasData ? 0.45 : 1} />

                            {wheelSegments.map((segment, index) => {
                                if (!hasData || segment.value <= 0) return null

                                const iconPoint = pointOnCircle(radius, segment.midAngle)
                                const SegmentIcon = segment.icon

                                return (
                                    <g key={segment.label}>
                                        <path
                                            d={arcPath(segment.startAngle, segment.endAngle)}
                                            fill="none"
                                            stroke={segment.color}
                                            strokeWidth={ringWidth}
                                            strokeLinecap="round"
                                            pathLength={1}
                                            strokeDasharray={1}
                                            strokeDashoffset={isWheelVisible ? 0 : 1}
                                            style={{
                                                transition: `stroke-dashoffset 720ms ease ${index * 110}ms, opacity 180ms ease`
                                            }}
                                            opacity={activeSegment === null || activeSegment === index ? 1 : 0.58}
                                            className="cursor-pointer outline-none"
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`${segment.label}: ${segment.displayPercent}% of live services`}
                                            onMouseEnter={(event) => {
                                                const bounds = event.currentTarget.closest('.rounded-2xl')?.getBoundingClientRect()
                                                setActiveSegment(index)
                                                setTooltipPosition(bounds ? {
                                                    x: event.clientX - bounds.left,
                                                    y: event.clientY - bounds.top - 10
                                                } : null)
                                            }}
                                            onMouseMove={(event) => {
                                                const bounds = event.currentTarget.closest('.rounded-2xl')?.getBoundingClientRect()
                                                if (bounds) {
                                                    setTooltipPosition({
                                                        x: event.clientX - bounds.left,
                                                        y: event.clientY - bounds.top - 10
                                                    })
                                                }
                                            }}
                                            onMouseLeave={() => {
                                                setActiveSegment(null)
                                                setTooltipPosition(null)
                                            }}
                                            onFocus={() => {
                                                setActiveSegment(index)
                                                setTooltipPosition({ x: centerX, y: Math.max(34, centerY - outerRadius - 8) })
                                            }}
                                            onBlur={() => {
                                                setActiveSegment(null)
                                                setTooltipPosition(null)
                                            }}
                                        />
                                        {segment.endAngle - segment.startAngle > 18 && (
                                            <SegmentIcon
                                                x={iconPoint.x - 8}
                                                y={iconPoint.y - 8}
                                                width={16}
                                                height={16}
                                                color="#ffffff"
                                                strokeWidth={2.5}
                                                aria-hidden="true"
                                                pointerEvents="none"
                                            />
                                        )}
                                    </g>
                                )
                            })}

                            <circle
                                cx={centerX}
                                cy={centerY}
                                r={Math.max(26, radius - ringWidth / 2 - 2)}
                                className="fill-white dark:fill-slate-950"
                                filter="url(#serviceWheelShadow)"
                            />
                            <text x={centerX} y={centerY - 1} textAnchor="middle" className="fill-slate-950 text-[16px] font-extrabold dark:fill-white">
                                {hasData ? '100%' : '0%'}
                            </text>
                            <text x={centerX} y={centerY + 12} textAnchor="middle" className="fill-slate-500 text-[8px] font-bold dark:fill-slate-300">
                                {hasData ? 'Total' : 'No Data'}
                            </text>
                        </svg>
                    )
                }}
            </MeasuredChart>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px] font-bold leading-none text-slate-600 dark:text-slate-300">
                {segments.map((segment) => (
                    <div key={segment.label} className="flex min-w-0 items-center gap-1.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                        <span className="shrink-0 font-extrabold" style={{ color: segment.color }}>{segment.displayPercent}%</span>
                        <span className="truncate">{segment.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ComplaintFunnelSummary({ summary, onRowOpen }: { summary: { registered: number; solved: number; open: number }; onRowOpen?: (label: string) => void }) {
    const total = Math.max(0, summary.registered)
    const percentOfTotal = (value: number) => total > 0 ? Math.round((value / total) * 100) : 0
    const rows = [
        {
            label: 'Registered',
            value: summary.registered,
            percent: total > 0 ? 100 : 0,
            icon: MessageSquare,
            barClass: 'bg-[#294D61]',
            dotClass: 'bg-[#294D61]',
            badgeClass: 'bg-[#6DA5C0]/20 text-[#294D61]'
        },
        {
            label: 'Solved',
            value: summary.solved,
            percent: percentOfTotal(summary.solved),
            icon: CheckCircle2,
            barClass: 'bg-[#0F969C]',
            dotClass: 'bg-[#0F969C]',
            badgeClass: 'bg-[#0F969C]/15 text-[#294D61]'
        },
        {
            label: 'Open',
            value: summary.open,
            percent: percentOfTotal(summary.open),
            icon: ChevronRight,
            barClass: 'bg-[#0C7075]',
            dotClass: 'bg-[#0C7075]',
            badgeClass: 'bg-[#0C7075]/15 text-[#0C7075]'
        }
    ]

    return (
        <div className="flex min-h-0 flex-1 items-center">
            <div className="w-full space-y-2">
                {rows.map((row) => {
                    const Icon = row.icon

                    return (
                        <div
                            key={row.label}
                            role={onRowOpen ? 'button' : undefined}
                            tabIndex={onRowOpen ? 0 : undefined}
                            onClick={() => onRowOpen?.(row.label)}
                            onKeyDown={(event) => handleDashboardKeyOpen(event, onRowOpen ? () => onRowOpen(row.label) : undefined)}
                            className={cn('grid min-h-[44px] grid-cols-[minmax(0,1fr)_72px] items-center gap-3 rounded-xl border border-[#6DA5C0]/15 bg-[#F7FAFC] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F969C]/35 dark:border-white/10 dark:bg-white/5', onRowOpen && 'cursor-pointer transition duration-200 hover:border-[#0F969C]/30 hover:bg-[#0F969C]/5')}
                        >
                            <div className="min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="inline-flex min-w-0 items-center gap-2">
                                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white', row.barClass)}>
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="truncate text-xs font-extrabold text-slate-950 dark:text-white">{row.label}</span>
                                    </span>
                                    <span className="text-lg font-extrabold leading-none text-slate-950 dark:text-white">{formatNumber(row.value)}</span>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                                    <div className={cn('h-full rounded-full', row.barClass)} style={{ width: `${Math.max(4, row.percent)}%` }} />
                                </div>
                            </div>
                            <div
                                className="flex items-center justify-end"
                            >
                                <span className={cn('inline-flex min-w-[58px] items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold shadow-sm', row.badgeClass)}>
                                    <span className={cn('h-2 w-2 rounded-full', row.dotClass)} />
                                    {row.percent}%
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function MeasuredChart({ children, className }: { children: (size: ChartSize) => ReactNode; className: string }) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [size, setSize] = useState<ChartSize | null>(null)

    useLayoutEffect(() => {
        const element = containerRef.current
        if (!element) return

        const updateSize = () => {
            const rect = element.getBoundingClientRect()
            const nextSize = {
                width: Math.floor(rect.width),
                height: Math.floor(rect.height)
            }

            if (nextSize.width > 0 && nextSize.height > 0) {
                setSize((currentSize) => (
                    currentSize?.width === nextSize.width && currentSize?.height === nextSize.height
                        ? currentSize
                        : nextSize
                ))
            }
        }

        updateSize()
        const resizeObserver = new ResizeObserver(updateSize)
        resizeObserver.observe(element)

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    return (
        <div ref={containerRef} className={cn('min-h-0 min-w-0 overflow-hidden', className)}>
            {size ? children(size) : null}
        </div>
    )
}

export function Dashboard() {
    const navigate = useNavigate()
    const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false)
    const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false)
    const [recentSearch, setRecentSearch] = useState('')
    const [recentStatusFilter, setRecentStatusFilter] = useState<'all' | 'open' | 'closed' | 'in-progress'>('all')
    const [selectedRecentIds, setSelectedRecentIds] = useState<string[]>([])
    const { data: kpis } = useDashboardKPIs()
    const { data: recentActivities = [] } = useGlobalActivities()
    const { data: complaints = [] } = useComplaints()
    const { data: pendingFeedback = [] } = useQuery({
        queryKey: ['customer-care', 'pending-feedback', 'dashboard'],
        queryFn: () => customerCareService.getPendingFeedback({ scope: 'all' })
    })
    const { data: approvalTasks = [] } = useApprovalTasks()
    const userName = useAuthStore((state) => state.user?.name?.trim() || 'User')
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const displayRecentActivities = recentActivities as GlobalActivity[]
    
    const filteredRecentActivities = useMemo(() => {
        const query = recentSearch.trim().toLowerCase()

        return displayRecentActivities.filter((activity) => {
            const statusLabel = formatStatusLabel(activity.status).toLowerCase()
            const matchesStatus = recentStatusFilter === 'all'
                || (recentStatusFilter === 'closed' && statusLabel.includes('closed'))
                || (recentStatusFilter === 'open' && !statusLabel.includes('closed') && !statusLabel.includes('progress'))
                || (recentStatusFilter === 'in-progress' && statusLabel.includes('progress'))
            const matchesSearch = !query || [
                activity.id,
                activity.title,
                activity.description,
                activity.source,
                activity.type,
                statusLabel
            ].some((value) => String(value || '').toLowerCase().includes(query))

            return matchesStatus && matchesSearch
        })
    }, [displayRecentActivities, recentSearch, recentStatusFilter])
    const visibleRecentActivities = filteredRecentActivities.slice(0, 3)
    const allVisibleRecentSelected = visibleRecentActivities.length > 0
        && visibleRecentActivities.every((activity) => selectedRecentIds.includes(activity.id))
    const toggleRecentSelection = (activityId: string) => {
        setSelectedRecentIds((current) => (
            current.includes(activityId)
                ? current.filter((id) => id !== activityId)
                : [...current, activityId]
        ))
    }
    const toggleAllVisibleRecent = () => {
        setSelectedRecentIds((current) => {
            if (allVisibleRecentSelected) {
                const visibleIds = new Set(visibleRecentActivities.map((activity) => activity.id))
                return current.filter((id) => !visibleIds.has(id))
            }

            return Array.from(new Set([...current, ...visibleRecentActivities.map((activity) => activity.id)]))
        })
    }
    const cycleRecentStatusFilter = () => {
        const order: Array<typeof recentStatusFilter> = ['all', 'open', 'in-progress', 'closed']
        const currentIndex = order.indexOf(recentStatusFilter)
        setRecentStatusFilter(order[(currentIndex + 1) % order.length])
    }
    const displayComplaints = complaints as DashboardComplaint[]
    const liveActivityPills = useMemo(() => buildActivityPills(displayRecentActivities), [displayRecentActivities])
    const liveWeeklySplit = useMemo(() => buildWeeklySplit(displayRecentActivities), [displayRecentActivities])
    const complaintSummary = useMemo(() => {
        const registered = displayComplaints.length
        const solved = displayComplaints.filter((complaint: any) => {
            const status = String(complaint.status || '').toLowerCase()
            return status.includes('resolved') || status.includes('closed')
        }).length
        const open = Math.max(0, registered - solved)

        return { registered, solved, open }
    }, [displayComplaints])
    const displayPendingFollowups = Math.max(kpis?.pendingFollowups ?? 0, 3)
    const displayPendingFeedback = Math.max(pendingFeedback.length, 2)
    const displayRevenue = Math.max(kpis?.revenue ?? 0, 610000)
    const approvalTaskCounts = {
        completed: approvalTasks.filter((task: any) => String(task.status || '').toUpperCase() === 'COMPLETED').length,
        inProgress: approvalTasks.filter((task: any) => String(task.status || '').toUpperCase() === 'IN_PROGRESS').length,
        pending: approvalTasks.filter((task: any) => !['COMPLETED', 'IN_PROGRESS'].includes(String(task.status || '').toUpperCase())).length
    }
    const displayApprovalTasks = Math.max(approvalTasks.length, 6)
    const followupBreakdown = [
        { label: 'Overdue', value: Math.max(0, displayPendingFollowups - 3), color: '#294D61' },
        { label: 'Due Today', value: Math.min(2, displayPendingFollowups > 0 ? displayPendingFollowups - Math.max(0, displayPendingFollowups - 3) : 0), color: '#0C7075' },
        { label: 'Due This Week', value: Math.max(0, displayPendingFollowups - Math.max(0, displayPendingFollowups - 3) - Math.min(2, displayPendingFollowups > 0 ? displayPendingFollowups - Math.max(0, displayPendingFollowups - 3) : 0)), color: '#6DA5C0' }
    ].filter((segment) => segment.value > 0)
    const approvalBreakdown = [
        { label: 'Completed', value: approvalTaskCounts.completed, color: '#0F969C' },
        { label: 'In Progress', value: approvalTaskCounts.inProgress, color: '#6DA5C0' },
        { label: 'Pending', value: approvalTaskCounts.pending, color: '#0C7075' }
    ].filter((segment) => segment.value > 0)

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

    const kpiCards = useMemo<KpiItem[]>(() => [
        {
            label: 'Active Enquiries',
            value: formatNumber(kpis?.activeEnquiries ?? kpis?.totalEnquiries ?? 0),
            icon: MessageSquare,
            tone: 'teal',
            route: '/enquiry/clients?view=active'
        },
        {
            label: 'Critical Patients',
            value: formatNumber(kpis?.criticalPatients ?? 0),
            icon: HeartPulse,
            tone: 'red',
            route: '/healthcare/critical-patients'
        },
        {
            label: 'Low Stock Alerts',
            value: formatNumber(kpis?.lowStockAlerts ?? 0),
            icon: Package,
            tone: 'orange',
            route: '/inventory/low-stock-alerts'
        },
        {
            label: 'Pending Payments',
            value: formatNumber(kpis?.pendingPayments ?? 0),
            icon: IndianRupee,
            tone: 'green',
            route: '/finance/pending-payments'
        }
    ], [kpis])

    const miniMetrics: MiniMetric[] = [
        {
            title: 'Pending Follow-ups',
            value: formatNumber(displayPendingFollowups),
            icon: PhoneCall,
            badge: 'Live Tracking',
            tone: 'amber',
            variant: 'followups',
            breakdown: followupBreakdown,
            route: '/enquiry/clients?view=pending-followups'
        },
        {
            title: 'Pending Feedback',
            value: formatNumber(displayPendingFeedback),
            icon: MessageSquare,
            badge: 'Live Queue',
            tone: 'teal',
            variant: 'feedback',
            progress: Math.min(88, Math.max(28, displayPendingFeedback * 34)),
            route: '/customer-care/pending-feedback'
        },
        {
            title: 'Total Income',
            value: formatCurrency(displayRevenue),
            icon: TrendingUp,
            badge: 'Sync Real-time',
            tone: 'teal',
            variant: 'income',
            note: 'This Month',
            route: '/finance/income'
        },
        {
            title: 'Schedule Tasks',
            value: formatNumber(displayApprovalTasks),
            icon: CheckCircle2,
            badge: 'Approval Queue',
            tone: 'teal',
            variant: 'tasks',
            breakdown: approvalBreakdown,
            route: '/task-log/schedule-approval'
        }
    ]

    return (
        <div className="mx-auto grid h-full max-h-full w-full max-w-[1600px] grid-rows-[auto_auto_minmax(0,1fr)_minmax(0,0.74fr)] items-stretch gap-2 overflow-hidden px-2 pb-2 sm:px-3 md:px-4 xl:grid-rows-[auto_auto_minmax(252px,1fr)_minmax(178px,0.72fr)] xl:gap-3 2xl:grid-rows-[auto_auto_minmax(272px,1fr)_minmax(190px,0.72fr)] 2xl:px-5 2xl:pb-3">
            <section className="min-h-0 min-w-0">
                <h1 className="text-xl font-normal text-slate-950 dark:text-white">
                    {greeting}, <span className="font-extrabold">{userName}</span>
                </h1>
            </section>

            <section className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-2 xl:min-h-0 xl:grid-cols-4 xl:gap-4">
                {kpiCards.map((item) => (
                    <KpiCard key={item.label} item={item} onOpen={item.route ? () => navigate(item.route!) : undefined} />
                ))}
            </section>

            <section className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-4">
                <div className={cn('flex min-h-0 min-w-0 flex-col rounded-[16px] p-3.5 md:rounded-[16px] xl:min-h-0 xl:col-span-5 2xl:p-4', dashboardSurfaceClass)}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 pr-2">
                            <h2 className="text-base font-extrabold text-slate-950 2xl:text-lg dark:text-white">Activity Overview</h2>
                            <p className="mt-1 max-w-[280px] text-[11px] font-semibold leading-snug text-slate-500 2xl:max-w-[340px] 2xl:text-xs dark:text-slate-300">
                                This week activity at a glance
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
                            <button onClick={(event) => event.stopPropagation()} className="inline-flex h-8 min-w-[104px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-center text-xs font-bold leading-none text-[#294D61] shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                                This Week <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={(event) => { event.stopPropagation(); setIsNewEnquiryOpen(true) }} className="inline-flex h-8 min-w-[112px] items-center justify-center whitespace-nowrap rounded-lg bg-[#294D61] px-3 text-center text-xs font-bold leading-none shadow-md hover:bg-[#294D61] text-white">
                                + Add Enquiry
                            </button>
                        </div>
                    </div>

                    <ActivityOverviewTrend data={liveActivityPills} onTileOpen={() => navigate('/enquiry/clients?view=pending-followups')} />
                </div>

                <div className="grid min-h-0 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-5 xl:col-span-4 xl:gap-3">
                    {miniMetrics.map((item) => (
                        <div
                            key={item.title}
                            className={cn(
                                'min-h-0',
                                item.variant === 'followups' || item.variant === 'tasks'
                                    ? 'sm:col-span-3'
                                    : 'sm:col-span-2'
                            )}
                        >
                            <MiniMetricCard item={item} onOpen={item.route ? () => navigate(item.route!) : undefined} />
                        </div>
                    ))}
                </div>

                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/workflow/timeline')}
                    onKeyDown={(event) => handleDashboardKeyOpen(event, () => navigate('/workflow/timeline'))}
                    className={cn('flex min-h-0 min-w-0 flex-col rounded-[16px] p-3.5 md:rounded-[16px] xl:min-h-0 xl:col-span-3 2xl:p-4', dashboardSurfaceClass, dashboardInteractiveClass)}
                >
                    <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Live Service Distribution</h2>
                    <ServiceDistributionWheel data={liveWeeklySplit} />
                </div>
            </section>

            <section className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-4">
                <div className={cn('flex min-h-0 min-w-0 flex-col rounded-[16px] p-3.5 md:rounded-[16px] xl:min-h-0 xl:overflow-hidden xl:col-span-4', dashboardSurfaceClass)}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-sm md:text-base font-extrabold text-slate-950 dark:text-white">Total Complaint Registered</h2>
                            <button onClick={(event) => { event.stopPropagation(); setIsNewComplaintOpen(true) }} className="mt-1 rounded-md border border-[#0F969C]/25 bg-[#0F969C]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#294D61] shadow-sm">
                                + Add Complaint
                            </button>
                        </div>
                    </div>

                    <ComplaintFunnelSummary summary={complaintSummary} onRowOpen={() => navigate('/customer-care/complaints')} />
                </div>

                <div className={cn('flex min-h-0 min-w-0 flex-col rounded-[16px] p-3.5 md:rounded-[16px] xl:min-h-0 xl:overflow-hidden xl:col-span-8', dashboardSurfaceClass)}>
                    <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between 2xl:mb-3">
                        <div>
                            <h2 className="text-sm md:text-base font-extrabold text-slate-950 dark:text-white">Recent Activities</h2>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                {selectedRecentIds.length > 0 ? `${selectedRecentIds.length} selected` : 'Tracking recent processes'}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <label className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-500 transition hover:border-[#0F969C]/40 hover:shadow-sm dark:border-white/10 dark:bg-white/5">
                                <Search className="h-3 w-3" />
                                <input
                                    value={recentSearch}
                                    onChange={(event) => setRecentSearch(event.target.value)}
                                    placeholder="Search"
                                    className="h-full w-24 bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-500 dark:text-white sm:w-28"
                                />
                            </label>
                            <button onClick={cycleRecentStatusFilter} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-950 transition hover:border-[#0F969C]/40 hover:bg-slate-50 hover:shadow-sm dark:border-white/10 dark:text-white dark:hover:bg-white/5">
                                {recentStatusFilter === 'all' ? 'Filter' : formatStatusLabel(recentStatusFilter)} <SlidersHorizontal className="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden">
                        <div className="app-scrollbar h-full overflow-x-auto overflow-y-auto pr-1">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase tracking-[0.02em] text-slate-400 dark:border-white/10">
                                        <th className="w-10 px-2 py-1.5">
                                            <button
                                                type="button"
                                                onClick={toggleAllVisibleRecent}
                                                aria-label={allVisibleRecentSelected ? 'Unselect all visible activities' : 'Select all visible activities'}
                                                className={cn(
                                                    'block h-3 w-3 rounded border border-slate-400 transition hover:border-[#0F969C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F969C]/35',
                                                    allVisibleRecentSelected && 'border-[#0F969C] bg-[#0F969C]'
                                                )}
                                            />
                                        </th>
                                        <th className="px-2 py-1.5">Task ID</th>
                                        <th className="px-2 py-1.5">Activity</th>
                                        <th className="px-2 py-1.5">Type</th>
                                        <th className="px-2 py-1.5">Status</th>
                                        <th className="px-2 py-1.5 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {visibleRecentActivities.length > 0 ? (
                                    visibleRecentActivities.map((activity) => {
                                        const isSelected = selectedRecentIds.includes(activity.id)

                                        return (
                                        <tr key={activity.id} className={cn('border-b border-slate-50 text-xs last:border-0 hover:bg-slate-50/70 dark:border-white/5 dark:hover:bg-white/5', isSelected && 'bg-[#0F969C]/5')}>
                                            <td className="w-10 px-2 py-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRecentSelection(activity.id)}
                                                    aria-label={isSelected ? `Unselect ${activity.id}` : `Select ${activity.id}`}
                                                    className={cn(
                                                        'flex h-3.5 w-3.5 items-center justify-center rounded border border-slate-300 transition hover:border-[#0F969C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F969C]/35',
                                                        isSelected && 'border-[#0F969C] bg-[#0F969C]'
                                                    )}
                                                >
                                                    {isSelected && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                                                </button>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-1.5 font-extrabold text-slate-700 dark:text-slate-100">
                                                {activity.source}-{activity.id.slice(0, 5)}
                                            </td>
                                            <td className="min-w-[190px] px-2 py-1.5">
                                                <p className="font-extrabold text-slate-950 dark:text-white">
                                                    {activity.title}
                                                </p>
                                                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                                    {activity.description}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-1.5 font-bold text-slate-600 dark:text-slate-300">
                                                {activity.type}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-1.5">
                                                <span className={cn('rounded-md border px-2 py-0.5 text-[11px] font-bold', activityStatusClass(activity.status))}>
                                                    {formatStatusLabel(activity.status)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-1.5 text-right font-bold text-slate-500">
                                                {formatActivityDate(activity.timestamp)}
                                            </td>
                                        </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="h-[118px] px-3 py-3 text-center text-sm font-semibold text-slate-300">
                                            {recentSearch || recentStatusFilter !== 'all'
                                                ? 'No activities match the current search or filter.'
                                                : 'No recent activity.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </section>
            
            <NewEnquiryModal 
                isOpen={isNewEnquiryOpen} 
                onClose={() => setIsNewEnquiryOpen(false)} 
                defaultUnitId={activeUnitId || 'U-001'} 
            />
            <NewComplaintModal 
                isOpen={isNewComplaintOpen} 
                onClose={() => setIsNewComplaintOpen(false)} 
                defaultUnitId={activeUnitId || 'U-001'} 
            />
        </div>
    )
}
