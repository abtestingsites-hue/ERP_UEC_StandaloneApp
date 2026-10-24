import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface ReportMetricCardProps {
	title: string
	value: string | number
	subtitle?: string
	icon: LucideIcon
	trendLabel?: string
	accentColor?: 'primary' | 'emerald' | 'amber' | 'indigo' | 'purple' | 'rose' | 'cyan'
}

const colorMap = {
	primary: {
		bg: 'bg-primary-50',
		text: 'text-primary-700',
		iconBg: 'bg-primary-100 text-primary-700',
		border: 'border-slate-200',
	},
	emerald: {
		bg: 'bg-emerald-50/50',
		text: 'text-emerald-700',
		iconBg: 'bg-emerald-100 text-emerald-700',
		border: 'border-emerald-100',
	},
	amber: {
		bg: 'bg-amber-50/50',
		text: 'text-amber-700',
		iconBg: 'bg-amber-100 text-amber-700',
		border: 'border-amber-100',
	},
	indigo: {
		bg: 'bg-indigo-50/50',
		text: 'text-indigo-700',
		iconBg: 'bg-indigo-100 text-indigo-700',
		border: 'border-indigo-100',
	},
	purple: {
		bg: 'bg-purple-50/50',
		text: 'text-purple-700',
		iconBg: 'bg-purple-100 text-purple-700',
		border: 'border-purple-100',
	},
	rose: {
		bg: 'bg-rose-50/50',
		text: 'text-rose-700',
		iconBg: 'bg-rose-100 text-rose-700',
		border: 'border-rose-100',
	},
	cyan: {
		bg: 'bg-cyan-50/50',
		text: 'text-cyan-700',
		iconBg: 'bg-cyan-100 text-cyan-700',
		border: 'border-cyan-100',
	},
}

export const ReportMetricCard: React.FC<ReportMetricCardProps> = ({
	title,
	value,
	subtitle,
	icon: Icon,
	trendLabel,
	accentColor = 'primary',
}) => {
	const styling = colorMap[accentColor] || colorMap.primary

	return (
		<div className={`bg-white border ${styling.border} rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}>
			<div className="flex items-center justify-between">
				<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
				<span className={`p-2.5 rounded-xl ${styling.iconBg}`}>
					<Icon className="w-5 h-5" />
				</span>
			</div>
			<div className="mt-2">
				<p className={`text-2xl font-bold ${styling.text}`}>{value}</p>
				{subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
				{trendLabel && (
					<div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
						{trendLabel}
					</div>
				)}
			</div>
		</div>
	)
}
