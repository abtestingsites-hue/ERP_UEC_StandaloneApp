import { AlertCircle, Bell, CalendarClock, CheckCircle2, CreditCard, MessageSquare, ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { useClientPortalComplaints, useClientPortalNotifications, useClientPortalServices } from '../hooks/useClientPortal'
import type { ClientPortalComplaint, ClientPortalSavedNotification, ClientPortalService } from '../services/clientPortal'

type PortalNotification = {
    id: string
    title: string
    detail: string
    tone: 'amber' | 'emerald' | 'sky' | 'rose' | 'slate'
    icon: typeof Bell
    href: string
    date?: string | null
}

const money = (value?: number) => `Rs ${Number(value || 0).toFixed(2)}`

const formatDateTime = (value?: string | null) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-'
}

const toneClass: Record<PortalNotification['tone'], string> = {
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    slate: 'border-gray-100 bg-gray-50 text-gray-700'
}

const isOpenComplaint = (complaint: ClientPortalComplaint) => {
    const status = String(complaint.status || '').toUpperCase()
    return !['RESOLVED', 'CLOSED'].includes(status)
}

const buildServiceNotifications = (services: ClientPortalService[]): PortalNotification[] => services.flatMap((service) => {
    const serviceRef = service.allocationRef || service.ref || service.id
    const serviceName = service.service || 'Care Service'
    const patient = service.patientName || service.clientName || 'Patient'
    const notifications: PortalNotification[] = []

    if (Number(service.balanceAmount || 0) > 0 || service.paymentStatus !== 'PAID') {
        notifications.push({
            id: `${service.id}-payment`,
            title: 'Payment Pending',
            detail: `${serviceName} for ${patient} has ${money(service.balanceAmount)} due.`,
            tone: 'amber',
            icon: CreditCard,
            href: '/client-portal/services',
            date: service.workflowClosedAt || service.completedAt
        })
    }

    if (service.paymentStatus === 'PAID' && service.feedbackStatus !== 'COLLECTED') {
        notifications.push({
            id: `${service.id}-feedback`,
            title: 'Feedback Pending',
            detail: `${serviceName} is paid. Please share feedback for ${patient}.`,
            tone: 'sky',
            icon: MessageSquare,
            href: '/client-portal/services',
            date: service.completedAt
        })
    }

    if (service.receiptNo) {
        notifications.push({
            id: `${service.id}-receipt`,
            title: 'Receipt Available',
            detail: `${service.receiptNo} is available for ${serviceRef}.`,
            tone: 'emerald',
            icon: ReceiptText,
            href: '/client-portal/services',
            date: service.workflowClosedAt
        })
    }

    if (service.status === 'COMPLETED') {
        notifications.push({
            id: `${service.id}-completed`,
            title: 'Service Completed',
            detail: `${serviceName} for ${patient} is marked completed.`,
            tone: 'emerald',
            icon: CheckCircle2,
            href: '/client-portal/services',
            date: service.completedAt
        })
    }

    if (service.renewalFollowUpStatus || service.renewalFollowUpScheduledAt) {
        notifications.push({
            id: `${service.id}-renewal`,
            title: 'Renewal Follow-up Scheduled',
            detail: `${serviceName} renewal follow-up is ${service.renewalFollowUpStatus || 'scheduled'} for ${formatDateTime(service.renewalFollowUpScheduledAt)}.`,
            tone: 'amber',
            icon: CalendarClock,
            href: '/client-portal/services',
            date: service.renewalFollowUpScheduledAt || service.renewalFollowUpAt
        })
    }

    return notifications
})

const buildComplaintNotifications = (complaints: ClientPortalComplaint[]): PortalNotification[] => complaints
    .filter(isOpenComplaint)
    .map((complaint) => ({
        id: `${complaint.id}-complaint`,
        title: `Complaint ${complaint.status || 'Open'}`,
        detail: `${complaint.refNo || complaint.id} - ${complaint.type || complaint.metadata?.category || 'Complaint'} is still active.`,
        tone: String(complaint.priority || '').toLowerCase().includes('critical') ? 'rose' : 'amber',
        icon: AlertCircle,
        href: '/client-portal/complaints',
        date: complaint.updatedAt || complaint.createdAt
    }))

const buildSavedNotifications = (saved: ClientPortalSavedNotification[]): PortalNotification[] => saved
    .filter((item) => item.type === 'MEDICINE_DOSE_GIVEN')
    .map((item) => ({
        id: `${item.id}-saved`,
        title: 'Medicine Dose Given',
        detail: item.message || 'Scheduled medicine dose was marked as given.',
        tone: 'emerald',
        icon: CheckCircle2,
        href: '/client-portal/medicines',
        date: item.createdAt
    }))

const sortNotifications = (items: PortalNotification[]) => [...items].sort((first, second) => {
    const firstDate = first.date ? new Date(first.date).getTime() : 0
    const secondDate = second.date ? new Date(second.date).getTime() : 0
    return secondDate - firstDate
})

export function ClientPortalNotifications() {
    const { data: services = [], isLoading: isServicesLoading } = useClientPortalServices()
    const { data: complaints = [], isLoading: isComplaintsLoading } = useClientPortalComplaints()
    const { data: savedNotifications = [], isLoading: isSavedLoading } = useClientPortalNotifications()
    const notifications = sortNotifications([
        ...buildSavedNotifications(savedNotifications),
        ...buildServiceNotifications(services),
        ...buildComplaintNotifications(complaints)
    ])
    const isLoading = isServicesLoading || isComplaintsLoading || isSavedLoading

    return (
        <div className="space-y-5">
            <PageHeader
                title="My Notifications"
                subtitle="Read-only alerts generated from your live services, payments, feedback, complaints, and renewals."
                breadcrumbs={[{ label: 'Client Portal' }, { label: 'My Notifications' }]}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Total Alerts" value={isLoading ? '-' : notifications.length} tone="slate" />
                <SummaryCard label="Payment / Feedback" value={isLoading ? '-' : notifications.filter((item) => ['Payment Pending', 'Feedback Pending'].includes(item.title)).length} tone="amber" />
                <SummaryCard label="Open Complaints" value={isLoading ? '-' : notifications.filter((item) => item.title.startsWith('Complaint')).length} tone="rose" />
                <SummaryCard label="Medicine Updates" value={isLoading ? '-' : notifications.filter((item) => item.title.includes('Medicine')).length} tone="emerald" />
            </div>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Bell className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-gray-900">Action Alerts</h3>
                        <p className="text-sm font-semibold text-gray-500">Generated from the same database-backed portal data shown in your services and complaints.</p>
                    </div>
                </div>

                <div className="mt-4 grid gap-3">
                    {isLoading ? (
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm font-bold text-gray-500">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">No alerts right now.</div>
                    ) : notifications.map((notification) => {
                        const Icon = notification.icon
                        return (
                            <Link
                                key={notification.id}
                                to={notification.href}
                                className={`grid gap-3 rounded-lg border p-4 transition hover:shadow-sm md:grid-cols-[auto_1fr_auto] md:items-center ${toneClass[notification.tone]}`}
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold">{notification.title}</p>
                                    <p className="text-sm font-semibold opacity-80">{notification.detail}</p>
                                </div>
                                <p className="text-xs font-extrabold opacity-70">{formatDateTime(notification.date)}</p>
                            </Link>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}

function SummaryCard({ label, value, tone }: { label: string; value: number | string; tone: PortalNotification['tone'] }) {
    return (
        <div className={`rounded-lg border p-4 ${toneClass[tone]}`}>
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="mt-1 text-xs font-extrabold uppercase tracking-wide opacity-80">{label}</p>
        </div>
    )
}
