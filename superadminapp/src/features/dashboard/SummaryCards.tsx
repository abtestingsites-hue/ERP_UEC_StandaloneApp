import {
	ClipboardCheck,
	IndianRupee,
	AlertTriangle,
	UsersRound,
} from 'lucide-react'
import { StatCard } from '../../components/StatCard'
import type { LiveDashboardKPIs } from './dashboard.service'

interface SummaryCardsProps {
	kpis?: LiveDashboardKPIs | null
	isLoading?: boolean
}

export function SummaryCards({ kpis, isLoading }: SummaryCardsProps) {
	const summaryStats = [
		{
			label: 'Live ERP Revenue',
			value: kpis ? `₹${(kpis.revenue || 0).toLocaleString('en-IN')}` : (isLoading ? '...' : '₹0'),
			note: 'Operational billing total',
			accent: 'mint',
			Icon: IndianRupee,
		},
		{
			label: 'Active Enquiries',
			value: kpis ? String(kpis.activeEnquiries || kpis.totalEnquiries || 0) : (isLoading ? '...' : '0'),
			note: `${kpis?.totalEnquiries || 0} total enquiries registered`,
			accent: 'blue',
			Icon: UsersRound,
		},
		{
			label: 'Pending Dues & Approvals',
			value: kpis ? String((kpis.pendingApprovals || 0) + (kpis.pendingPayments || 0)) : (isLoading ? '...' : '0'),
			note: `${kpis?.pendingPayments || 0} payments pending settlement`,
			accent: 'gold',
			Icon: ClipboardCheck,
		},
		{
			label: 'Low Stock Alerts',
			value: kpis ? String(kpis.lowStockAlerts || 0) : (isLoading ? '...' : '0'),
			note: (kpis?.lowStockAlerts ?? 0) > 0 ? 'Reorder threshold reached' : 'Inventory levels optimal',
			accent: (kpis?.lowStockAlerts ?? 0) > 0 ? 'coral' : 'mint',
			Icon: AlertTriangle,
		},
	]

	return (
		<section className="summary-grid" aria-label="Live summary metrics">
			{summaryStats.map((stat) => (
				<StatCard key={stat.label} {...stat} />
			))}
		</section>
	)
}
