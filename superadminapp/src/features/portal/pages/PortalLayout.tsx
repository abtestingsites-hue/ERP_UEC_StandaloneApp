import { useState, useEffect } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
	HeartPulse,
	Pill,
	Utensils,
	Receipt,
	MessageSquare,
	LayoutDashboard,
	Footprints,
	RefreshCw,
	AlertCircle,
} from 'lucide-react'
import { PortalHeader } from '../components/PortalHeader'
import { PortalOverviewTab } from '../tabs/PortalOverviewTab'
import { PortalVitalsTab } from '../tabs/PortalVitalsTab'
import { PortalAdlTab } from '../tabs/PortalAdlTab'
import { PortalMedsTab } from '../tabs/PortalMedsTab'
import { PortalDietTab } from '../tabs/PortalDietTab'
import { PortalBillingTab } from '../tabs/PortalBillingTab'
import { PortalComplaintsTab } from '../tabs/PortalComplaintsTab'
import { PortalService } from '../portal.service'
import { getPortalToken, getPortalAccount, clearPortalSession } from '../portalStorage'
import type { PortalDashboardData, PortalComplaint } from '../portal.types'
import '../portal.css'

export function PortalLayout() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const activeTab = searchParams.get('tab') || 'overview'

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [data, setData] = useState<PortalDashboardData | null>(null)
	const [complaints, setComplaints] = useState<PortalComplaint[]>([])

	const token = getPortalToken()
	const account = getPortalAccount()

	const loadData = async () => {
		try {
			setLoading(true)
			setError('')
			const [dashboardData, complaintsData] = await Promise.all([
				PortalService.getDashboard(),
				PortalService.getComplaints(),
			])
			setData(dashboardData)
			setComplaints(complaintsData)
		} catch (err: any) {
			console.error('Portal dashboard error', err)
			setError(err?.message || 'Unable to load resident care details.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (token) {
			loadData()
		}
	}, [token])

	if (!token || !account) {
		return <Navigate to="/login" replace />
	}

	const handleTabChange = (tab: string) => {
		setSearchParams({ tab })
	}

	const navTabs = [
		{ id: 'overview', label: 'Overview', icon: LayoutDashboard },
		{ id: 'vitals', label: 'Health & Vitals', icon: HeartPulse },
		{ id: 'adl', label: 'Daily Care (ADL)', icon: Footprints },
		{ id: 'meds', label: 'Medications', icon: Pill },
		{ id: 'diet', label: 'Diet & Nutrition', icon: Utensils },
		{ id: 'billing', label: 'Billing & Invoices', icon: Receipt },
		{ id: 'complaints', label: 'Care Desk & Feedback', icon: MessageSquare },
	]

	return (
		<div className="portal-root">
			<PortalHeader
				account={account}
				resident={data?.resident}
				onLogout={() => {
					clearPortalSession()
					navigate('/login', { replace: true })
				}}
			/>

			{/* Refined Navigation Tabs Bar matching Enterprise Workspace */}
			<div className="portal-nav-bar">
				<div className="portal-nav-container">
					{navTabs.map((tab) => {
						const Icon = tab.icon
						const isActive = activeTab === tab.id
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => handleTabChange(tab.id)}
								className={`portal-nav-btn ${isActive ? 'active' : ''}`}
							>
								<Icon size={16} />
								<span>{tab.label}</span>
							</button>
						)
					})}
				</div>
			</div>

			{/* Main Workspace Content Area */}
			<main className="portal-main-container">
				{loading ? (
					<div className="flex h-64 items-center justify-center">
						<div className="flex flex-col items-center gap-3">
							<div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-700 border-t-transparent" />
							<p className="text-xs font-semibold text-slate-500">
								Loading resident records…
							</p>
						</div>
					</div>
				) : error ? (
					<div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
						<AlertCircle className="mx-auto h-8 w-8 text-red-500" />
						<h3 className="mt-2 text-sm font-bold text-red-800">{error}</h3>
						<button
							onClick={loadData}
							className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
						>
							<RefreshCw className="h-3.5 w-3.5" /> Retry
						</button>
					</div>
				) : data ? (
					<div>
						{activeTab === 'overview' && (
							<PortalOverviewTab data={data} onTabChange={handleTabChange} />
						)}
						{activeTab === 'vitals' && <PortalVitalsTab data={data} />}
						{activeTab === 'adl' && <PortalAdlTab data={data} />}
						{activeTab === 'meds' && <PortalMedsTab data={data} />}
						{activeTab === 'diet' && <PortalDietTab data={data} />}
						{activeTab === 'billing' && <PortalBillingTab data={data} />}
						{activeTab === 'complaints' && (
							<PortalComplaintsTab complaints={complaints} onRefresh={loadData} />
						)}
					</div>
				) : null}
			</main>
		</div>
	)
}
