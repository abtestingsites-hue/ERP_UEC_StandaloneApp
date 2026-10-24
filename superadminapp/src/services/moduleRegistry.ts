import {
	Activity,
	Ambulance,
	BarChart3,
	BriefcaseBusiness,
	Headset,
	HeartPulse,
	PackageCheck,
	ShieldCheck,
	UsersRound,
	type LucideIcon,
} from 'lucide-react'

export type DomainModule = {
	id: string
	path: string
	label: string
	shortLabel: string
	description: string
	status: string
	accent: string
	Icon: LucideIcon
}

export const domainModules: DomainModule[] = [
	{
		id: 'crm',
		path: '/crm',
		label: 'CRM & Client Communications',
		shortLabel: 'CRM',
		description: 'Lead generation, omnichannel communications, call center, and client relations.',
		status: 'Active',
		accent: 'plum',
		Icon: Headset,
	},
	{
		id: 'inventory',
		path: '/inventory',
		label: 'Inventory',
		shortLabel: 'Inventory',
		description: 'Stock visibility, supplies, and purchasing overview.',
		status: 'Active',
		accent: 'mint',
		Icon: PackageCheck,
	},
	{
		id: 'admission',
		path: '/admission',
		label: 'Admission & Relieving',
		shortLabel: 'Admission',
		description: 'Resident intake, room allocation, consent, and relieving closures.',
		status: 'Active',
		accent: 'blue',
		Icon: UsersRound,
	},
	{
		id: 'inhouse-care',
		path: '/inhouse-care',
		label: 'Inhouse Care',
		shortLabel: 'Inhouse Care',
		description: 'Resident care, nursing activity, and inhouse operations.',
		status: 'Active',
		accent: 'coral',
		Icon: HeartPulse,
	},
	{
		id: 'home-care',
		path: '/home-care',
		label: 'Home Care',
		shortLabel: 'Home Care',
		description: 'Home-care clients, contracts, visits, and staff allocation.',
		status: 'Active',
		accent: 'mint',
		Icon: HeartPulse,
	},
	{
		id: 'visitor-security',
		path: '/visitor-security',
		label: 'Visitor & Security',
		shortLabel: 'Visitor & Security',
		description: 'Visitor flow, access, and security overview.',
		status: 'Active',
		accent: 'gold',
		Icon: ShieldCheck,
	},
	{
		id: 'donors-volunteers',
		path: '/donors-volunteers',
		label: 'Donors & Volunteers',
		shortLabel: 'Donors & Volunteers',
		description: 'Universal Nature Care and Cure Foundation philanthropic giving, 80G tax receipts, and community volunteers.',
		status: 'Active',
		accent: 'mint',
		Icon: UsersRound,
	},
	{
		id: 'finance',
		path: '/finance',
		label: 'Finance',
		shortLabel: 'Finance',
		description: 'Enterprise billing, general ledger, cashbox, and elder care fees.',
		status: 'Active',
		accent: 'plum',
		Icon: BarChart3,
	},
	{
		id: 'hr-operations',
		path: '/hr-operations',
		label: 'HR & Operations',
		shortLabel: 'HR & Operations',
		description: 'Workforce, staffing, attendance, leave governance, and operational coordination.',
		status: 'Active',
		accent: 'blue',
		Icon: BriefcaseBusiness,
	},
	{
		id: 'ambulance',
		path: '/ambulance',
		label: 'Ambulance',
		shortLabel: 'Ambulance',
		description: 'Emergency transport bookings, fleet assets, dispatching, and run telemetry.',
		status: 'Active',
		accent: 'coral',
		Icon: Ambulance,
	},
	{
		id: 'reports',
		path: '/reports',
		label: 'Central Reports',
		shortLabel: 'Reports',
		description: 'Unified cross-domain reporting and organization-wide operational insights.',
		status: 'Active',
		accent: 'gold',
		Icon: Activity,
	},
]
