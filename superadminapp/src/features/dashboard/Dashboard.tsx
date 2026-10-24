import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../auth/useAuth'
import { ModuleGrid } from './ModuleGrid'
import { RecentActivity } from './RecentActivity'
import { SummaryCards } from './SummaryCards'
import { dashboardService, type LiveDashboardKPIs, type LiveActivityItem } from './dashboard.service'
import { ShieldCheck } from 'lucide-react'

export function Dashboard() {
	const { session } = useAuth()
	const userName = session?.user.name || session?.user.email || 'Administrator'
	const [kpis, setKpis] = useState<LiveDashboardKPIs | null>(null)
	const [activities, setActivities] = useState<LiveActivityItem[]>([])
	const [isLoading, setIsLoading] = useState(true)

	const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())

	useEffect(() => {
		let isMounted = true
		async function loadData() {
			setIsLoading(true)
			try {
				const [liveKpis, liveActs] = await Promise.all([
					dashboardService.getKPIs(),
					dashboardService.getActivities()
				])
				if (isMounted) {
					setKpis(liveKpis)
					setActivities(liveActs)
				}
			} finally {
				if (isMounted) setIsLoading(false)
			}
		}
		void loadData()
		return () => {
			isMounted = false
		}
	}, [])

	return (
		<>
			<PageHeader
				eyebrow={`${dayOfWeek} · Enterprise Command Center`}
				title={`Good morning, ${userName}`}
				description="A live central view across authorized ERP domains and operations."
			/>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 10,
					padding: '10px 16px',
					background: '#f0fdf4',
					border: '1px solid #bbf7d0',
					borderRadius: 8,
					marginBottom: 20,
					fontSize: 13,
					color: '#166534',
					fontWeight: 600
				}}
				role="status"
			>
				<ShieldCheck size={18} color="#16a34a" />
				<span>
					<strong>LIVE ERP BACKEND ACTIVE</strong> · Real-time operational metrics loaded from PostgreSQL database.
				</span>
			</div>
			<SummaryCards kpis={kpis} isLoading={isLoading} />
			<div className="dashboard-columns">
				<ModuleGrid />
				<RecentActivity activities={activities} isLoading={isLoading} />
			</div>
		</>
	)
}
