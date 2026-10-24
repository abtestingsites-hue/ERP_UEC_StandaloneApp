import { Mail, Phone, User, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useClientPortalServices, useClientPortalSummary } from '../hooks/useClientPortal'
import type { ClientPortalService } from '../services/clientPortal'

const formatDateTime = (value?: string | null) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-'
}

const InfoBox = ({ label, value }: { label: string; value?: ReactNode }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-400">{label}</p>
        <div className="mt-1 text-sm font-bold text-gray-900">{value || '-'}</div>
    </div>
)

const getLatestService = (services: ClientPortalService[]) => services[0] || null

export function ClientPortalProfile() {
    const { data: summary, isLoading: isSummaryLoading } = useClientPortalSummary()
    const { data: services = [], isLoading: isServicesLoading } = useClientPortalServices()
    const clients = summary?.clients || []
    const latestService = getLatestService(services)
    const patientNames = [...new Set(services.map((service) => service.patientName || service.clientName).filter(Boolean))]

    return (
        <div className="space-y-5">
            <PageHeader
                title="My Profile"
                subtitle="Read-only client and patient links for this family portal login."
                breadcrumbs={[{ label: 'Client Portal' }, { label: 'My Profile' }]}
            />

            <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
                <section className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                            <User className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-wide text-primary-700">Linked Client</p>
                            <h2 className="mt-1 text-2xl font-extrabold text-gray-900">{isSummaryLoading ? 'Loading...' : clients[0]?.name || 'No linked client'}</h2>
                            <p className="text-sm font-semibold text-gray-500">{clients[0]?.refNo || 'Matched by login email or mobile'}</p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <InfoBox label="Client Ref No" value={clients[0]?.refNo} />
                        <InfoBox label="Client Name" value={clients[0]?.name} />
                        <InfoBox label="Mobile" value={<span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" />{clients[0]?.mobile || '-'}</span>} />
                        <InfoBox label="Email" value={<span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" />{clients[0]?.email || '-'}</span>} />
                    </div>

                    {clients.length > 1 && (
                        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                            This login matches {clients.length} client records by email or mobile. All linked services are shown below.
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                            <Users className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-wide text-sky-700">Linked Patient</p>
                            <h2 className="mt-1 text-2xl font-extrabold text-gray-900">{isServicesLoading ? 'Loading...' : patientNames[0] || 'No patient service linked'}</h2>
                            <p className="text-sm font-semibold text-gray-500">{latestService?.service || 'Patient appears after a service is completed and linked'}</p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <InfoBox label="Latest Service Ref" value={latestService?.allocationRef || latestService?.ref} />
                        <InfoBox label="Current Service" value={latestService?.service} />
                        <InfoBox label="Assigned Staff" value={latestService?.allocatedDetails} />
                        <InfoBox label="Service Status" value={latestService ? <StatusHighlighter value={latestService.status || 'Pending'} /> : '-'} />
                        <InfoBox label="Payment" value={latestService ? <StatusHighlighter value={latestService.paymentStatus || 'Pending'} /> : '-'} />
                        <InfoBox label="Feedback" value={latestService ? <StatusHighlighter value={latestService.feedbackStatus || 'Waiting'} /> : '-'} />
                        <InfoBox label="Completed On" value={formatDateTime(latestService?.completedAt)} />
                        <InfoBox label="Renewal" value={latestService?.renewalFollowUpStatus ? <StatusHighlighter value={latestService.renewalFollowUpStatus} /> : 'Not scheduled'} />
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-extrabold text-gray-900">Linked Services</h3>
                    <p className="text-sm font-semibold text-gray-500">Only live services matched to this login email or mobile are shown.</p>
                </div>

                <div className="mt-4 grid gap-3">
                    {isServicesLoading ? (
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm font-bold text-gray-500">Loading linked services...</div>
                    ) : services.length === 0 ? (
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm font-bold text-gray-500">No linked services found for this login.</div>
                    ) : services.map((service) => (
                        <div key={service.id} className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
                            <div>
                                <p className="text-sm font-extrabold text-gray-900">{service.allocationRef || service.ref || '-'}</p>
                                <p className="text-xs font-bold text-gray-500">{service.service || 'Care Service'} - {service.patientName || service.clientName || 'Patient'}</p>
                            </div>
                            <p className="text-sm font-bold text-gray-700">{service.allocatedDetails || 'Staff pending'}</p>
                            <p className="text-sm font-bold text-gray-700">{formatDateTime(service.completedAt)}</p>
                            <StatusHighlighter value={service.status || 'Pending'} />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
