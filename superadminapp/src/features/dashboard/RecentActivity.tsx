import { ArrowUpRight, CircleCheck } from 'lucide-react'
import type { LiveActivityItem } from './dashboard.service'

interface RecentActivityProps {
	activities?: LiveActivityItem[]
	isLoading?: boolean
}

export function RecentActivity({ activities = [], isLoading }: RecentActivityProps) {
	const hasActivities = activities.length > 0

	return (
		<section className="activity-panel" aria-labelledby="activity-heading">
			<div className="section-heading section-heading--activity">
				<div>
					<span className="section-kicker">LIVE ERP AUDIT TRAIL</span>
					<h2 id="activity-heading">Recent activity</h2>
				</div>
				<span className="activity-panel__icon" aria-hidden="true">
					<ArrowUpRight size={17} />
				</span>
			</div>
			{isLoading ? (
				<div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
					Loading live activities from backend...
				</div>
			) : !hasActivities ? (
				<div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
					No recent workflow activities recorded in this unit.
				</div>
			) : (
				<div className="activity-list">
					{activities.map((item) => {
						const dateStr = item.timestamp
							? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
							: 'Just now'

						return (
							<article className="activity-item" key={item.id}>
								<span className="activity-item__icon activity-item__icon--mint">
									<CircleCheck size={16} strokeWidth={1.8} />
								</span>
								<div className="activity-item__content">
									<h3>{item.title}</h3>
									<p>{item.description || item.status || 'Workflow activity logged'}</p>
									<time>{dateStr}</time>
								</div>
							</article>
						)
					})}
				</div>
			)}
			<div className="activity-panel__footnote">
				Synchronized from PostgreSQL backend event logs.
			</div>
		</section>
	)
}
