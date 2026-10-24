import React from 'react'
import { Calendar, Search, RefreshCw, Download, Building2 } from 'lucide-react'
import type { ReportingPeriod } from '../reports.types'

interface ReportFilterBarProps {
	period: ReportingPeriod
	onPeriodChange: (newPeriod: ReportingPeriod) => void
	searchTerm: string
	onSearchChange: (newSearch: string) => void
	activeUnitName: string
	isLoading: boolean
	onRefresh: () => void
	onExportCsv?: () => void
	searchPlaceholder?: string
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
	period,
	onPeriodChange,
	searchTerm,
	onSearchChange,
	activeUnitName,
	isLoading,
	onRefresh,
	onExportCsv,
	searchPlaceholder = 'Search records by name, ref, or status...',
}) => {
	return (
		<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
			<div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
				{/* Search Box */}
				<div className="relative flex-1 min-w-[200px] max-w-sm">
					<Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
					/>
				</div>

				{/* Period Selector */}
				<div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
					<Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
					<button
						onClick={() => onPeriodChange('TODAY')}
						className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
							period === 'TODAY'
								? 'bg-white text-slate-900 shadow-xs'
								: 'text-slate-600 hover:text-slate-900'
						}`}
					>
						Today
					</button>
					<button
						onClick={() => onPeriodChange('LAST_7_DAYS')}
						className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
							period === 'LAST_7_DAYS'
								? 'bg-white text-slate-900 shadow-xs'
								: 'text-slate-600 hover:text-slate-900'
						}`}
					>
						7 Days
					</button>
					<button
						onClick={() => onPeriodChange('THIS_MONTH')}
						className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
							period === 'THIS_MONTH'
								? 'bg-white text-slate-900 shadow-xs'
								: 'text-slate-600 hover:text-slate-900'
						}`}
					>
						This Month
					</button>
					<button
						onClick={() => onPeriodChange('ALL_TIME')}
						className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
							period === 'ALL_TIME'
								? 'bg-white text-slate-900 shadow-xs'
								: 'text-slate-600 hover:text-slate-900'
						}`}
					>
						All Time
					</button>
				</div>
			</div>

			<div className="flex items-center gap-2 w-full md:w-auto justify-end">
				{/* Unit scope badge */}
				<div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-lg">
					<Building2 className="w-3.5 h-3.5 text-primary-600" />
					<span>Scope:</span>
					<span className="font-semibold text-primary-700">{activeUnitName || 'Global'}</span>
				</div>

				{/* Refresh Button */}
				<button
					onClick={onRefresh}
					disabled={isLoading}
					className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
					title="Refresh data"
				>
					<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary-600' : ''}`} />
					Sync
				</button>

				{/* Export CSV Button */}
				{onExportCsv && (
					<button
						onClick={onExportCsv}
						className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
						title="Export filtered records to CSV"
					>
						<Download className="w-3.5 h-3.5 text-slate-500" />
						Export CSV
					</button>
				)}
			</div>
		</div>
	)
}
