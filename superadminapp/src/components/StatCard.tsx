import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
	label: string
	value: string
	note: string
	accent: string
	Icon: LucideIcon
}

export function StatCard({ label, value, note, accent, Icon }: StatCardProps) {
	return (
		<article className={`stat-card stat-card--${accent}`}>
			<div className="stat-card__topline">
				<span className="stat-card__label">{label}</span>
				<span className="stat-card__icon" aria-hidden="true">
					<Icon size={18} strokeWidth={1.8} />
				</span>
			</div>
			<strong className="stat-card__value">{value}</strong>
			<span className="stat-card__note">{note}</span>
		</article>
	)
}
