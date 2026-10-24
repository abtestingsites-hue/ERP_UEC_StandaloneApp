import React, { useState, useMemo } from 'react'
import { Receipt, FileText, CheckCircle, RefreshCw, Eye, ArrowRight, DollarSign } from 'lucide-react'
import type { AmbulanceTrip } from '../ambulance.types'

interface AmbulanceBillingTabProps {
	trips: AmbulanceTrip[]
	isLoading: boolean
	onRefresh: () => void
	onGenerateInvoice: (trip: AmbulanceTrip, amount?: number) => Promise<void>
	onSelectTrip: (trip: AmbulanceTrip) => void
}

export const AmbulanceBillingTab: React.FC<AmbulanceBillingTabProps> = ({
	trips,
	isLoading,
	onRefresh,
	onGenerateInvoice,
	onSelectTrip,
}) => {
	const [searchTerm, setSearchTerm] = useState('')
	const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNBILLED' | 'BILLED'>('ALL')
	const [invoicingId, setInvoicingId] = useState<string | null>(null)

	// Filter down to trips that have completed transit or have been billed
	const billableTrips = useMemo(() => {
		return trips.filter((t) => ['COMPLETED', 'BILLED'].includes(t.status))
	}, [trips])

	const filteredTrips = useMemo(() => {
		return billableTrips.filter((t) => {
			const matchesSearch =
				t.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.vehicle?.vehicleNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.pickupLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.destination || '').toLowerCase().includes(searchTerm.toLowerCase())

			let matchesStatus = true
			if (filterStatus === 'UNBILLED') {
				matchesStatus = t.status === 'COMPLETED'
			} else if (filterStatus === 'BILLED') {
				matchesStatus = t.status === 'BILLED'
			}

			return matchesSearch && matchesStatus
		})
	}, [billableTrips, searchTerm, filterStatus])

	const unbilledCount = billableTrips.filter((t) => t.status === 'COMPLETED').length
	const billedCount = billableTrips.filter((t) => t.status === 'BILLED').length
	const totalBilledAmount = billableTrips
		.filter((t) => t.status === 'BILLED' && t.totalAmount)
		.reduce((sum, t) => sum + (t.totalAmount || 0), 0)

	const handleInvoiceClick = async (trip: AmbulanceTrip) => {
		let billingAmount: number | undefined = trip.totalAmount && trip.totalAmount > 0 ? trip.totalAmount : undefined

		if (!billingAmount) {
			const distance =
				trip.kmStart != null && trip.kmEnd != null && trip.kmEnd >= trip.kmStart
					? trip.kmEnd - trip.kmStart
					: 0
			const suggestedAmount = distance > 0 ? distance * 20 : 500
			const promptMsg =
				`Trip ${trip.refNo} has ${distance > 0 ? `${distance} km logged` : 'no distance logged'}.\n` +
				`Standard rate (₹20/km): ₹${suggestedAmount}.\n\n` +
				`Enter billing amount in ₹ for Finance Invoice:`

			const input = window.prompt(promptMsg, String(suggestedAmount))
			if (input === null) return
			const parsed = parseFloat(input.trim())
			if (isNaN(parsed) || parsed <= 0) {
				alert('Please enter a valid billing amount greater than ₹0.')
				return
			}
			billingAmount = parsed
		} else {
			if (
				!window.confirm(
					`Generate authoritative Finance Invoice for ambulance transport trip ${trip.refNo} for ₹${billingAmount.toLocaleString()}?`
				)
			) {
				return
			}
		}

		try {
			setInvoicingId(trip.id)
			await onGenerateInvoice(trip, billingAmount)
		} finally {
			setInvoicingId(null)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric KPI cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Invoicing</p>
						<p className="text-2xl font-bold text-amber-600 mt-1">{unbilledCount}</p>
					</div>
					<span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
						<FileText className="w-5 h-5" />
					</span>
				</div>
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoiced via Finance</p>
						<p className="text-2xl font-bold text-emerald-600 mt-1">{billedCount}</p>
					</div>
					<span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
						<Receipt className="w-5 h-5" />
					</span>
				</div>
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced Value</p>
						<p className="text-2xl font-bold text-slate-900 mt-1">₹{totalBilledAmount.toLocaleString()}</p>
					</div>
					<span className="p-3 bg-primary-50 text-primary-600 rounded-xl">
						<DollarSign className="w-5 h-5" />
					</span>
				</div>
			</div>

			{/* Filter & Action Bar */}
			<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
				<div className="flex flex-1 gap-3 w-full md:w-auto">
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search by ref no, client, vehicle, pickup, or drop-off..."
						className="w-full max-w-sm px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
					/>
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'UNBILLED' | 'BILLED')}
						className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
					>
						<option value="ALL">All Completed / Billed ({billableTrips.length})</option>
						<option value="UNBILLED">Pending Invoicing ({unbilledCount})</option>
						<option value="BILLED">Invoiced ({billedCount})</option>
					</select>
				</div>
				<button
					onClick={onRefresh}
					disabled={isLoading}
					className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
				>
					<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
					Refresh
				</button>
			</div>

			{/* Billable Trips Table */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Receipt className="w-5 h-5 text-primary-600" />
						<h3 className="font-bold text-slate-800">Transport Billing & Finance Integration</h3>
						<span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
							{filteredTrips.length} records
						</span>
					</div>
					<div className="text-xs text-slate-500">
						Authoritative Finance ledger integration via Account Transactions
					</div>
				</div>

				{filteredTrips.length === 0 ? (
					<div className="p-12 text-center text-slate-500">
						<p className="text-base font-semibold">No transport billing records found.</p>
						<p className="text-xs text-slate-400 mt-1">
							Trips appear here once marked COMPLETED with distance and fare details.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm text-slate-700">
							<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
								<tr>
									<th className="px-6 py-3">Trip / Client</th>
									<th className="px-6 py-3">Assigned Vehicle</th>
									<th className="px-6 py-3">Route Details</th>
									<th className="px-6 py-3">Distance & Time</th>
									<th className="px-6 py-3">Amount</th>
									<th className="px-6 py-3">Billing Status</th>
									<th className="px-6 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredTrips.map((trip) => {
									const isGenerating = invoicingId === trip.id
									const kmDiff =
										trip.kmStart != null && trip.kmEnd != null
											? trip.kmEnd - trip.kmStart
											: null

									return (
										<tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
											<td className="px-6 py-4">
												<div className="flex items-center gap-3">
													<div
														className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
															trip.status === 'BILLED'
																? 'bg-emerald-50 text-emerald-700'
																: 'bg-amber-50 text-amber-700'
														}`}
													>
														{trip.status === 'BILLED' ? (
															<Receipt className="w-4 h-4" />
														) : (
															<FileText className="w-4 h-4" />
														)}
													</div>
													<div>
														<div className="font-bold text-slate-900">{trip.refNo}</div>
														<div className="text-xs text-slate-500">
															{trip.clientName || 'General Transit'}
														</div>
														{trip.mobile && (
															<div className="text-xs text-slate-400">{trip.mobile}</div>
														)}
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="font-semibold text-slate-800">
													{trip.vehicle?.vehicleNo || '—'}
												</div>
												<div className="text-xs text-slate-500">
													Driver: {trip.driver?.name || 'Unassigned'}
												</div>
											</td>
											<td className="px-6 py-4 max-w-xs">
												<div className="text-xs">
													<span className="text-slate-400 font-medium">From:</span>{' '}
													<span className="font-medium text-slate-700">{trip.pickupLocation || '—'}</span>
												</div>
												<div className="text-xs flex items-center gap-1 mt-0.5">
													<ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
													<span className="text-slate-400 font-medium">To:</span>{' '}
													<span className="font-medium text-slate-700">{trip.destination || '—'}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-xs font-semibold text-slate-800">
													{kmDiff != null ? `${kmDiff} km logged` : '—'}
												</div>
												<div className="text-xs text-slate-500">
													{trip.completionTime
														? new Date(trip.completionTime).toLocaleTimeString([], {
																hour: '2-digit',
																minute: '2-digit',
														  })
														: '—'}
												</div>
											</td>
											<td className="px-6 py-4">
												<span className="font-bold text-slate-900">
													{trip.totalAmount != null ? `₹${trip.totalAmount.toLocaleString()}` : '₹0'}
												</span>
											</td>
											<td className="px-6 py-4">
												{trip.status === 'BILLED' ? (
													<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
														<CheckCircle className="w-3.5 h-3.5" />
														Billed (Ledger Invoiced)
													</span>
												) : (
													<span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
														Pending Invoicing
													</span>
												)}
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex items-center justify-end gap-2">
													{trip.status === 'COMPLETED' && (
														<button
															onClick={() => handleInvoiceClick(trip)}
															disabled={isGenerating}
															className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
														>
															<Receipt className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
															Generate Invoice
														</button>
													)}
													<button
														onClick={() => onSelectTrip(trip)}
														className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
														title="View Trip Details"
													>
														<Eye className="w-4 h-4" />
													</button>
												</div>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
