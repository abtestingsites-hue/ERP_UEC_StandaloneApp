import { Activity, AlertTriangle, Briefcase, Calendar, CalendarDays, ClipboardCheck, ClipboardList, Database, FileText, HeartPulse, IndianRupee, MessageSquare, PhoneCall, Radio, Receipt, Stethoscope, Truck, UserPlus, Users, Pill, ListPlus, FileSpreadsheet } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { PatientCareClinicalOverview } from '../features/patient_care/components/PatientCareClinicalOverview'
import { NursingPatientCareOverview } from '../features/nursing_care/components/NursingPatientCareOverview'

type HubItem = {
    title: string
    description: string
    href: string
    icon: any
    status?: string
}

type HubConfig = {
    title: string
    subtitle: string
    breadcrumbs: Array<{ label: string }>
    items: HubItem[]
}

const hubs: Record<string, HubConfig> = {
    'nursing-care': {
        title: 'Nursing Care Dashboard',
        subtitle: 'Clinical treatment, medication administration, monitoring and nursing documentation.',
        breadcrumbs: [{ label: 'Nursing Care' }, { label: 'Dashboard' }],
        items: [
            { title: 'Critical Patients', description: 'Patients requiring urgent monitoring.', href: '/nursing-care/critical-patients', icon: HeartPulse },
            { title: 'Vitals', description: 'Vital sign entry and tracking.', href: '/nursing-care/vitals', icon: Activity },
            { title: 'Medication Schedule', description: 'Medicine distribution and schedule.', href: '/nursing-care/medication-schedule', icon: Pill },
            { title: 'Medicine Issue Log', description: 'Log of medicines issued to patients.', href: '/nursing-care/medicine-issue-log', icon: ClipboardList },
            { title: 'Medicine Requests', description: 'Medicine request queue for pharmacy.', href: '/nursing-care/medicine-requests', icon: MessageSquare }
        ]
    },
    'patient-care': {
        title: 'Patient Care Dashboard',
        subtitle: 'Daily living support, resident comfort, hygiene and wellbeing.',
        breadcrumbs: [{ label: 'Patient Care' }, { label: 'Dashboard' }],
        items: [
            { title: 'Patient Dashboard', description: 'Patient-level care overview.', href: '/patient-care/dashboard', icon: Stethoscope },
            { title: 'ADL Daily Living', description: 'Activities of daily living monitoring.', href: '/patient-care/adl', icon: ClipboardCheck },
            { title: 'Nutrition & Diet', description: 'Patient diet and nutrition control.', href: '/patient-care/nutrition-diet', icon: ClipboardList },
            { title: 'Incident Reports', description: 'Log falls and behavioral incidents.', href: '/patient-care/incidents', icon: AlertTriangle }
        ]
    },
    'uec-inhouse-care': {
        title: 'In-House Care Command Center',
        subtitle: 'Resident revenue, vitals, ADL and in-house care workflows in one workspace.',
        breadcrumbs: [{ label: 'UEC' }, { label: 'In-House Care' }],
        items: [
            { title: 'Revenue', description: 'In-house resident revenue and billing records.', href: '/inhouse-care/revenue', icon: IndianRupee },
            { title: 'Vitals', description: 'Resident vitals and health monitoring form.', href: '/inhouse-care/vitals', icon: HeartPulse },
            { title: 'ADL Daily Living', description: 'Activities of daily living monitoring.', href: '/inhouse-care/adl', icon: ClipboardCheck },
            { title: 'Event Calendar', description: 'Resident activities and recreation schedule.', href: '/inhouse-care/events', icon: CalendarDays },
            { title: 'Incident Reports', description: 'Log falls and behavioral incidents.', href: '/inhouse-care/incidents', icon: AlertTriangle }
        ]
    },
    'uec-operations': {
        title: 'Elder Operations Command Center',
        subtitle: 'Food, nutrition, laundry, maintenance and waste operations in one workspace.',
        breadcrumbs: [{ label: 'UEC' }, { label: 'Elder Operations' }],
        items: [
            { title: 'Food Preparation', description: 'Kitchen preparation and ration usage workflow.', href: '/operations/food-preparation', icon: Activity },
            { title: 'Nutrition Planning', description: 'Diet planning and nutrition schedule.', href: '/operations/nutrition-planning', icon: Calendar },
            { title: 'Laundry Management', description: 'Laundry allocation and completion tracking.', href: '/operations/laundry-management', icon: ClipboardList },
            { title: 'Maintenance', description: 'Facility repair and service tickets.', href: '/operations/maintenance', icon: Briefcase },
            { title: 'Waste Management', description: 'Waste and rag movement tracking.', href: '/operations/waste-management', icon: ClipboardCheck }
        ]
    },
    'uec-finance': {
        title: 'Elder Finance Command Center',
        subtitle: 'In-house expense, finance follow-up and billing workflow entry point.',
        breadcrumbs: [{ label: 'UEC' }, { label: 'Elder Finance' }],
        items: [
            { title: 'Finance Dashboard', description: 'Elder finance overview and live accounting status.', href: '/finance/elder-dashboard', icon: IndianRupee },
            { title: 'In-House Expense', description: 'Resident and facility expense entry.', href: '/finance/inhouse-expense', icon: Receipt },
            { title: 'Elder Billing', description: 'Monthly packages and security deposits.', href: '/finance/elder-billing', icon: FileText },
            { title: 'Cashbox', description: 'Cashbox and payment movement visibility.', href: '/finance/cashbox', icon: Database },
            { title: 'Patient Ledger', description: 'Daily patient expenses and automated billing items.', href: '/finance/patient-daily-cost', icon: ListPlus },
            { title: 'Invoices', description: 'Generated monthly invoices and manual billing.', href: '/finance/invoice', icon: FileSpreadsheet }
        ]
    },
    'uec-task-log': {
        title: 'Task Log Command Center',
        subtitle: 'Daily tasks, scheduled work and approval flows in one workspace.',
        breadcrumbs: [{ label: 'UEC' }, { label: 'Task Log' }],
        items: [
            { title: 'Assign Daily Task', description: 'Create and assign daily operational tasks.', href: '/task-log/assign-daily', icon: ClipboardList },
            { title: 'Assign Schedule Task', description: 'Create scheduled tasks for future work.', href: '/task-log/assign-schedule', icon: Calendar },
            { title: 'Daily Task Approval', description: 'Approve completed daily tasks.', href: '/task-log/daily-approval', icon: ClipboardCheck },
            { title: 'Schedule Task Approval', description: 'Approve completed scheduled tasks.', href: '/task-log/schedule-approval', icon: ClipboardCheck }
        ]
    },
    'uhc-healthcare': {
        title: 'Healthcare Command Center',
        subtitle: 'Patient care, vitals, medication, nutrition and medical monitoring workflows.',
        breadcrumbs: [{ label: 'UHC' }, { label: 'Healthcare' }],
        items: [
            { title: 'Critical Patients', description: 'Patients requiring urgent monitoring.', href: '/healthcare/critical-patients', icon: HeartPulse },
            { title: 'Nurse Dashboard', description: 'Nursing workflow, vitals and ADL care overview.', href: '/healthcare/nurse-dashboard', icon: Stethoscope },
            { title: 'Vitals', description: 'Vital sign entry and tracking.', href: '/healthcare/vitals', icon: Activity },
            { title: 'Medical Monitor', description: 'Clinical monitoring dashboard.', href: '/healthcare/medical-monitor', icon: HeartPulse },
            { title: 'Doctor Dashboard', description: 'Medical KPI and Live Duty Monitor.', href: '/medical/doctor-dashboard', icon: Stethoscope },
            { title: 'Doctor Visits', description: 'Doctor Consultations & Medical Orders.', href: '/medical/doctor-visits', icon: Activity },
            { title: 'Doctor Duty', description: 'Doctor Shift Duty Assignments.', href: '/medical/doctor-duty', icon: Activity },
            { title: 'Clinical View', description: 'Resident Clinical History.', href: '/medical/clinical-view', icon: HeartPulse },
            { title: 'Medication Management', description: 'Medicine stock and medication operations.', href: '/healthcare/medication-management', icon: ClipboardList },
            { title: 'Nutrition & Diet', description: 'Patient diet and nutrition control.', href: '/healthcare/nutrition-diet', icon: ClipboardCheck }
        ]
    },
    'uhc-allocation': {
        title: 'Care Allocation Command Center',
        subtitle: 'Clinical, home care, in-house and other allocation workflows.',
        breadcrumbs: [{ label: 'UHC' }, { label: 'Care Allocation' }],
        items: [
            { title: 'Clinical Care', description: 'Clinical care allocation.', href: '/allocation/clinical-care', icon: HeartPulse },
            { title: 'Home Care', description: 'Home care allocation.', href: '/allocation/home-care', icon: Users },
            { title: 'In-House Care', description: 'In-house allocation workflow.', href: '/allocation/inhouse-care', icon: ClipboardCheck },
            { title: 'Others', description: 'Other service allocation.', href: '/allocation/others', icon: Briefcase }
        ]
    },
    'ua-services': {
        title: 'Ambulance Services Command Center',
        subtitle: 'Bookings, dispatch, fleet, staff assignment and trip sheets in one workspace.',
        breadcrumbs: [{ label: 'UA' }, { label: 'Ambulance Services' }],
        items: [
            { title: 'Bookings', description: 'Ambulance booking workflow.', href: '/ambulance/bookings', icon: PhoneCall },
            { title: 'Dispatch', description: 'Dispatch and assignment control.', href: '/ambulance/dispatch', icon: Radio },
            { title: 'Vehicle & Fleet', description: 'Fleet availability and vehicle register.', href: '/ambulance/fleet', icon: Truck },
            { title: 'Staff Assignment', description: 'Driver and staff assignment.', href: '/ambulance/staff-assignment', icon: Users },
            { title: 'Trip Sheets', description: 'Trip sheet records and journey workflow.', href: '/ambulance/trip-sheets', icon: ClipboardList }
        ]
    },
    'ua-support': {
        title: 'Ambulance Support Command Center',
        subtitle: 'Maintenance, billing, emergency logs and field duty support.',
        breadcrumbs: [{ label: 'UA' }, { label: 'Ambulance Support' }],
        items: [
            { title: 'Maintenance', description: 'Vehicle repair and service register.', href: '/ambulance/maintenance', icon: Briefcase },
            { title: 'Billing', description: 'Ambulance billing workflow.', href: '/ambulance/billing', icon: Receipt },
            { title: 'Emergency Call Logs', description: 'Emergency call and response records.', href: '/ambulance/call-logs', icon: PhoneCall },
            { title: 'Field Duty', description: 'Field duty assignment and tracking.', href: '/hr/field-duty', icon: ClipboardCheck }
        ]
    },
    'ueo-enquiry': {
        title: 'Enquiry Desk Command Center',
        subtitle: 'New enquiries, follow-ups, active pipeline, clients and admissions in one workspace.',
        breadcrumbs: [{ label: 'UEO' }, { label: 'Enquiry Desk' }],
        items: [
            { title: 'New Enquiry', description: 'Create a new enquiry with lead qualification.', href: '/crm/new-enquiry', icon: PhoneCall },
            { title: 'Add Existing Patient', description: 'Onboard already admitted patients into admission, allocation, operations and billing.', href: '/crm/existing-patient', icon: UserPlus },
            { title: 'Follow-ups', description: 'Client follow-up accountability and conversion tracking.', href: '/crm/enquiry-follow-up', icon: Calendar },
            { title: 'Active Enquiries', description: 'Live lead pipeline and filtering.', href: '/crm/active-enquiries', icon: Activity },
            { title: 'Clients', description: 'Client list and follow-up records.', href: '/crm/clients', icon: Users },
            { title: 'Admissions', description: 'Admission tracking and handoff control.', href: '/crm/admission-tracking', icon: ClipboardCheck },
            { title: 'Admission Forms', description: 'Admission records and family portal access setup.', href: '/crm/admission-forms', icon: FileText },
            { title: 'B2P Referrals', description: 'Business-to-Partner referral tracking.', href: '/crm/b2p', icon: Briefcase },
            { title: 'Marketing Campaigns', description: 'Marketing campaign tracking and ROI.', href: '/crm/marketing', icon: Activity }
        ]
    },
    'ueo-customer': {
        title: 'Customer Relations Command Center',
        subtitle: 'Welcome calls, feedback, complaints and service history in one workspace.',
        breadcrumbs: [{ label: 'UEO' }, { label: 'Customer Relations' }],
        items: [
            { title: 'Welcome Call', description: 'Welcome and onboarding call workflow.', href: '/business/welcome-call', icon: PhoneCall },
            { title: 'Pending Feedbacks', description: 'Feedback follow-up queue.', href: '/customer-care/pending-feedback', icon: MessageSquare },
            { title: 'Complaints', description: 'Customer complaint tracking.', href: '/customer-care/complaints', icon: ClipboardCheck },
            { title: 'Service History', description: 'Client service history view.', href: '/customer-care/service-history', icon: ClipboardList }
        ]
    },
    'ueo-omnichannel': {
        title: 'Omnichannel Command Center',
        subtitle: 'Calls, missed calls and communication follow-up in one workspace.',
        breadcrumbs: [{ label: 'UEO' }, { label: 'Omnichannel' }],
        items: [
            { title: 'Calls', description: 'Call handling and call records.', href: '/omnichannel/calls', icon: PhoneCall },
            { title: 'Missed Calls', description: 'Missed call queue and callback workflow.', href: '/omnichannel/missed-calls', icon: Radio }
        ]
    },
    'ueo-security': {
        title: 'Visitor Command Center',
        subtitle: 'Visitor registration, live analytics, and pass workflows in one workspace.',
        breadcrumbs: [{ label: 'UEO' }, { label: 'Visitor Command Center' }],
        items: [
            { title: 'Visitor Dashboard', description: 'Live overview, statistics, and entry analytics.', href: '/security/visitor-dashboard', icon: Activity },

            { title: 'Visitor Reports', description: 'Analytics and chronological visitor logs.', href: '/security/visitor-reports', icon: FileText },
            { title: 'Action History', description: 'System-wide digital audit and security logs.', href: '/security/action-history', icon: ClipboardList }
        ]
    }
}

export function ModuleCommandCenter() {
    const navigate = useNavigate()
    const { hub = '' } = useParams()
    const config = hubs[hub] || hubs['ueo-enquiry']

    return (
        <div className="flex min-h-full flex-col px-2 pb-6 sm:px-4 2xl:px-6">
            <PageHeader title={config.title} subtitle={config.subtitle} breadcrumbs={config.breadcrumbs} />

            {hub === 'patient-care' && <PatientCareClinicalOverview />}
            {hub === 'nursing-care' && <NursingPatientCareOverview />}

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {config.items.map(({ title, description, href, icon: Icon, status }) => (
                    <button
                        key={href}
                        type="button"
                        onClick={() => navigate(href)}
                        className="group flex min-h-[140px] flex-col justify-between rounded-[24px] border border-gray-100 bg-white p-5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-[#0F969C]/30 hover:bg-[#F7FAFC] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F969C]/35 dark:border-white/10 dark:bg-[#1E1E1E] dark:hover:bg-white/5 sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-3 w-full">
                            <div className="space-y-1.5">
                                <h2 className="text-base font-extrabold leading-tight text-slate-950 transition-colors group-hover:text-[#0F969C] dark:text-white sm:text-lg">{title}</h2>
                                <p className="text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">{description}</p>
                            </div>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 transition-colors group-hover:border-[#0F969C]/20 group-hover:bg-white dark:border-white/10 dark:bg-white/5">
                                <Icon className="h-5 w-5 text-slate-600 transition-colors group-hover:text-[#0F969C] dark:text-slate-400" />
                            </span>
                        </div>
                        
                        <div className="mt-6 flex items-center text-[11px] font-bold uppercase tracking-wider text-[#0F969C]">
                            {status || 'Open workflow'}
                            <svg className="ml-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                    </button>
                ))}
            </section>
        </div>
    )
}

