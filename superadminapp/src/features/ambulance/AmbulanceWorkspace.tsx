import { useEffect, useState, useMemo } from 'react'
import {
	Ambulance,
	Compass,
	CalendarCheck,
	Truck,
	ClipboardList,
	Receipt,
	Plus,
	RefreshCw,
	Building2,
	AlertCircle,
} from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { useActiveUnit } from '../../context/useActiveUnit'
import { ambulanceService } from './ambulance.service'
import type {
	AmbulanceVehicle,
	AmbulanceTrip,
	AmbulanceOverviewMetrics,
	VehicleStatus,
} from './ambulance.types'

import { AmbulanceOverviewTab } from './tabs/AmbulanceOverviewTab'
import { TripBookingsTab } from './tabs/TripBookingsTab'
import { DispatchManagementTab } from './tabs/DispatchManagementTab'
import { TripSheetsTab } from './tabs/TripSheetsTab'
import { VehicleFleetTab } from './tabs/VehicleFleetTab'
import { AmbulanceBillingTab } from './tabs/AmbulanceBillingTab'

import { BookTripModal } from './components/BookTripModal'
import { DispatchTripModal } from './components/DispatchTripModal'
import { TripSheetActionModal } from './components/TripSheetActionModal'
import { AddVehicleModal } from './components/AddVehicleModal'
import { TripDetailDrawer } from './components/TripDetailDrawer'

export function AmbulanceWorkspace() {
	const { activeUnitName, activeUnitId, hasExplicitAllUnits } = useActiveUnit()

	const [activeTab, setActiveTab] = useState<string>('overview')

	// Data states
	const [vehicles, setVehicles] = useState<AmbulanceVehicle[]>([])
	const [trips, setTrips] = useState<AmbulanceTrip[]>([])
	const [drivers, setDrivers] = useState<Array<{ id: string; name: string; role: string; empId: string }>>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

	// Modal states
	const [isBookModalOpen, setIsBookModalOpen] = useState(false)
	const [dispatchModalTrip, setDispatchModalTrip] = useState<AmbulanceTrip | null>(null)
	const [actionModalState, setActionModalState] = useState<{
		trip: AmbulanceTrip | null
		action: 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | null
	}>({ trip: null, action: null })
	const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
	const [selectedTripForDossier, setSelectedTripForDossier] = useState<AmbulanceTrip | null>(null)

	// Refresh trigger handler
	const handleRefresh = () => {
		setRefreshTrigger((prev) => prev + 1)
	}

	useEffect(() => {
		let isMounted = true

		const loadData = async () => {
			try {
				const [vehiclesRes, tripsRes, driversRes] = await Promise.all([
					ambulanceService.getVehicles({
						scope: hasExplicitAllUnits ? 'all' : undefined,
						unitId: activeUnitId,
					}),
					ambulanceService.getTrips({
						scope: hasExplicitAllUnits ? 'all' : undefined,
						unitId: activeUnitId,
					}),
					ambulanceService.getDrivers(),
				])

				if (isMounted) {
					setVehicles(vehiclesRes)
					setTrips(tripsRes)
					setDrivers(driversRes)
					setLoadError(null)
				}
			} catch (err: unknown) {
				if (isMounted) {
					const msg = err instanceof Error ? err.message : 'Failed to load ambulance operational data'
					setLoadError(msg)
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		loadData()

		return () => {
			isMounted = false
		}
	}, [refreshTrigger, activeUnitId, hasExplicitAllUnits])

	// Compute overview KPI metrics
	const overviewMetrics: AmbulanceOverviewMetrics = useMemo(() => {
		const totalVehicles = vehicles.length
		const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length
		const onTripVehicles = vehicles.filter((v) => v.status === 'ON_TRIP').length
		const maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE').length

		const totalTrips = trips.length
		const activeTrips = trips.filter((t) =>
			['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(t.status)
		).length
		const pendingDispatchTrips = trips.filter((t) =>
			['REQUESTED', 'DISPATCH_READY'].includes(t.status)
		).length
		const completedTrips = trips.filter((t) =>
			['COMPLETED', 'BILLED'].includes(t.status)
		).length
		const unbilledTrips = trips.filter((t) => t.status === 'COMPLETED').length
		const billedTrips = trips.filter((t) => t.status === 'BILLED').length

		return {
			totalVehicles,
			availableVehicles,
			onTripVehicles,
			maintenanceVehicles,
			totalTrips,
			activeTrips,
			pendingDispatchTrips,
			completedTrips,
			activeDispatches: activeTrips,
			unbilledTrips,
			billedTrips,
		}
	}, [vehicles, trips])

	// Action handlers
	const handleUpdateVehicleStatus = async (id: string, status: VehicleStatus) => {
		await ambulanceService.updateVehicleStatus(id, status)
		handleRefresh()
	}

	const handleGenerateInvoice = async (trip: AmbulanceTrip, customAmount?: number) => {
		try {
			await ambulanceService.generateTripInvoice(trip.id, customAmount)
			handleRefresh()
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to generate invoice'
			alert(`Invoice Generation Failed: ${msg}`)
		}
	}

	return (
		<div className="min-h-screen bg-slate-50/50 pb-16">
			{/* Unit Scope and Domain Header */}
			<PageHeader
				eyebrow="EMERGENCY & PATIENT TRANSIT SERVICES"
				title="Ambulance & Transport Logistics"
				description="Manage emergency transport requests, vehicle fleet availability, crew dispatching, run telemetry, and billing ledger integration."
				action={
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg shadow-xs">
							<Building2 className="w-3.5 h-3.5 text-primary-600" />
							<span>Active Unit:</span>
							<span className="text-primary-700 font-bold">{activeUnitName || 'Global Enterprise'}</span>
						</div>
						<button
							onClick={handleRefresh}
							disabled={isLoading}
							className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
							title="Synchronize records"
						>
							<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary-600' : ''}`} />
							Sync
						</button>
						<button
							onClick={() => setIsBookModalOpen(true)}
							className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
						>
							<Plus className="w-3.5 h-3.5" />
							Book Transport
						</button>
					</div>
				}
			/>

			{/* Main Workspace Body */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
				{/* Error Notice */}
				{loadError && (
					<div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
						<AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
						<div>
							<h4 className="text-sm font-semibold text-rose-900">Communication Error</h4>
							<p className="text-xs text-rose-700 mt-0.5">{loadError}</p>
						</div>
					</div>
				)}

				{/* Primary Navigation Tabs */}
				<div className="border-b border-slate-200 mb-6">
					<nav className="flex space-x-6 overflow-x-auto pb-px">
						<button
							onClick={() => setActiveTab('overview')}
							className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
								activeTab === 'overview'
									? 'border-primary-600 text-primary-600'
									: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
							}`}
						>
							<Ambulance className="w-4 h-4" />
							Overview & Readiness
						</button>
						<button
							onClick={() => setActiveTab('bookings')}
							className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
								activeTab === 'bookings'
									? 'border-primary-600 text-primary-600'
									: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
							}`}
						>
							<CalendarCheck className="w-4 h-4" />
							Trip Bookings
							<span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
								{trips.length}
							</span>
						</button>
						<button
							onClick={() => setActiveTab('dispatch')}
							className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
								activeTab === 'dispatch'
									? 'border-primary-600 text-primary-600'
									: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
							}`}
						>
							<Compass className="w-4 h-4" />
							Dispatch Center
							{Boolean(overviewMetrics.pendingDispatchTrips && overviewMetrics.pendingDispatchTrips > 0) && (
								<span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-700 font-bold">
									{overviewMetrics.pendingDispatchTrips}
								</span>
							)}
						</button>
						<button
							onClick={() => setActiveTab('tripsheets')}
							className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
								activeTab === 'tripsheets'
									? 'border-primary-600 text-primary-600'
									: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
							}`}
						>
							<ClipboardList className="w-4 h-4" />
							Trip Sheets & Telemetry
						</button>
						<button
							onClick={() => setActiveTab('fleet')}
							className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
								activeTab === 'fleet'
									? 'border-primary-600 text-primary-600'
									: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
							}`}
						>
							<Truck className="w-4 h-4" />
							Fleet Assets
							<span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
								{vehicles.length}
							</span>
						</button>
						<button
							onClick={() => setActiveTab('billing')}
							className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
								activeTab === 'billing'
									? 'border-primary-600 text-primary-600'
									: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
							}`}
						>
							<Receipt className="w-4 h-4" />
							Billing & Ledger
						</button>
					</nav>
				</div>

				{/* Tab Panels */}
				{activeTab === 'overview' && (
					<AmbulanceOverviewTab
						trips={trips}
						vehicles={vehicles}
						isLoading={isLoading}
						onOpenBookModal={() => setIsBookModalOpen(true)}
						onOpenAddVehicleModal={() => setIsAddVehicleOpen(true)}
						onSelectTrip={(trip) => setSelectedTripForDossier(trip)}
						onNavigateTab={(tab) => setActiveTab(tab)}
					/>
				)}

				{activeTab === 'bookings' && (
					<TripBookingsTab
						trips={trips}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						onOpenBookModal={() => setIsBookModalOpen(true)}
						onOpenDispatchModal={(trip) => setDispatchModalTrip(trip)}
						onOpenActionModal={(trip, action) => setActionModalState({ trip, action })}
						onSelectTrip={(trip) => setSelectedTripForDossier(trip)}
					/>
				)}

				{activeTab === 'dispatch' && (
					<DispatchManagementTab
						trips={trips}
						vehicles={vehicles}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						onOpenDispatchModal={(trip) => setDispatchModalTrip(trip)}
						onOpenActionModal={(trip, action) => setActionModalState({ trip, action })}
						onSelectTrip={(trip) => setSelectedTripForDossier(trip)}
					/>
				)}

				{activeTab === 'tripsheets' && (
					<TripSheetsTab
						trips={trips}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						onOpenActionModal={(trip, action) => setActionModalState({ trip, action })}
						onSelectTrip={(trip) => setSelectedTripForDossier(trip)}
					/>
				)}

				{activeTab === 'fleet' && (
					<VehicleFleetTab
						vehicles={vehicles}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						onOpenAddVehicleModal={() => setIsAddVehicleOpen(true)}
						onUpdateVehicleStatus={handleUpdateVehicleStatus}
					/>
				)}

				{activeTab === 'billing' && (
					<AmbulanceBillingTab
						trips={trips}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						onGenerateInvoice={handleGenerateInvoice}
						onSelectTrip={(trip) => setSelectedTripForDossier(trip)}
					/>
				)}
			</div>

			{/* Intake & Action Modals */}
			<BookTripModal
				isOpen={isBookModalOpen}
				onClose={() => setIsBookModalOpen(false)}
				onSuccess={handleRefresh}
			/>

			<DispatchTripModal
				isOpen={!!dispatchModalTrip}
				trip={dispatchModalTrip}
				vehicles={vehicles}
				staffList={drivers}
				onClose={() => setDispatchModalTrip(null)}
				onSuccess={handleRefresh}
			/>

			<TripSheetActionModal
				isOpen={!!actionModalState.trip && !!actionModalState.action}
				trip={actionModalState.trip}
				action={actionModalState.action}
				onClose={() => setActionModalState({ trip: null, action: null })}
				onSuccess={handleRefresh}
			/>

			<AddVehicleModal
				isOpen={isAddVehicleOpen}
				onClose={() => setIsAddVehicleOpen(false)}
				onSuccess={handleRefresh}
			/>

			<TripDetailDrawer
				isOpen={!!selectedTripForDossier}
				trip={selectedTripForDossier}
				onClose={() => setSelectedTripForDossier(null)}
				onGenerateInvoice={handleGenerateInvoice}
			/>
		</div>
	)
}
export default AmbulanceWorkspace
