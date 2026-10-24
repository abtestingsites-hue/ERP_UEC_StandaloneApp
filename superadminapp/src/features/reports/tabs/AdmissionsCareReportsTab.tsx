import React, { useState, useMemo } from 'react'
import { Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import type { AdmissionRecord, Patient, ServiceClosure } from '../../admissions/admissions.types'
import type { MedicalAssignment, IncidentReport, MedicalDashboardSummary } from '../../care/care.types'
import type { ReportingPeriod } from '../reports.types'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportMetricCard } from '../components/ReportMetricCard'
import { exportToCsv } from '../utils/exportCsv'
import { formatAdmissionNumber, formatElderId } from '../../../utils/idFormatters'

interface AdmissionsCareReportsTabProps {
	admissions: AdmissionRecord[]
	patients: Patient[]
	closures: ServiceClosure[]
	careDashboard: MedicalDashboardSummary | null
	assignments: MedicalAssignment[]
	incidents: IncidentReport[]
	isLoading: boolean
	onRefresh: () => void
	activeUnitName: string
}

export const AdmissionsCareReportsTab: React.FC<AdmissionsCareReportsTabProps> = ({
	admissions,
	patients,
	closures,
	careDashboard,
	assignments,
	incidents,
	isLoading,
	onRefresh,
	activeUnitName,
}) => {
	const [period, setPeriod] = useState<ReportingPeriod>('ALL_TIME')
	const [searchTerm, setSearchTerm] = useState('')
	const [activeSubView, setActiveSubView] = useState<'ADMISSIONS' | 'ASSIGNMENTS' | 'INCIDENTS'>('ADMISSIONS')

	// Filter admissions
	const filteredAdmissions = useMemo(() => {
		if (!searchTerm.trim()) return admissions
		return admissions.filter((a) => {
			const name = a.patient?.name || ''
			const num = a.enquiry?.refNo || (a.id ? String(a.id) : '')
			const condition = a.healthCondition || a.clinicalStatus || ''
			return (
				name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(num || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				condition.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [admissions, searchTerm])

	// Filter assignments
	const filteredAssignments = useMemo(() => {
		if (!searchTerm.trim()) return assignments
		return assignments.filter((asgn) => {
			const staff = asgn.staff ? `${asgn.staff.firstName || ''} ${asgn.staff.lastName || ''}`.trim() : ''
			const pName = asgn.patient?.name || ''
			const status = asgn.status || ''
			return (
				staff.toLowerCase().includes(searchTerm.toLowerCase()) ||
				pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				status.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [assignments, searchTerm])

	// Filter incidents
	const filteredIncidents = useMemo(() => {
		if (!searchTerm.trim()) return incidents
		return incidents.filter((inc) => {
			const desc = inc.description || ''
			const type = inc.incidentType || ''
			const sev = inc.severity || ''
			return (
				desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
				type.toLowerCase().includes(searchTerm.toLowerCase()) ||
				sev.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [incidents, searchTerm])

	const handleExport = () => {
		if (activeSubView === 'ADMISSIONS') {
			exportToCsv(
				'Inpatient_Admissions_Report',
				[
					{ key: 'id', label: 'Admission ID' },
					{ key: 'admittedAt', label: 'Admission Date' },
					{ key: 'status', label: 'Status' },
					{ key: 'clinicalStatus', label: 'Clinical Status' },
				],
				filteredAdmissions as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'ASSIGNMENTS') {
			exportToCsv(
				'Care_Assignments_Report',
				[
					{ key: 'dutyType', label: 'Duty Type' },
					{ key: 'status', label: 'Status' },
					{ key: 'startAt', label: 'Scheduled Time' },
				],
				filteredAssignments as unknown as Record<string, unknown>[]
			)
		} else {
			exportToCsv(
				'Clinical_Incidents_Report',
				[
					{ key: 'incidentType', label: 'Incident Type' },
					{ key: 'severity', label: 'Severity' },
					{ key: 'description', label: 'Description' },
					{ key: 'actionTaken', label: 'Action Taken' },
				],
				filteredIncidents as unknown as Record<string, unknown>[]
			)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric Ribbon */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<ReportMetricCard
					title="Active Census (Admitted)"
					value={admissions.filter((a) => a.status === 'ADMITTED' || a.status === 'ACTIVE').length}
					subtitle={`${patients.length} Total Registered Residents`}
					icon={Users}
					accentColor="primary"
				/>
				<ReportMetricCard
					title="Discharges & Relieving"
					value={closures.length}
					subtitle={`${admissions.filter((a) => a.status === 'DISCHARGED').length} Formal Discharges`}
					icon={CheckCircle2}
					accentColor="emerald"
				/>
				<ReportMetricCard
					title="Care Approvals Queue"
					value={careDashboard?.waitingApprovalCount || 0}
					subtitle={`${careDashboard?.activeStaffCount || 0} Nurses Active`}
					icon={Clock}
					accentColor="amber"
				/>
				<ReportMetricCard
					title="Incident Reports (UEC)"
					value={incidents.length}
					subtitle={`${incidents.filter((i) => i.severity === 'HIGH' || i.severity === 'CRITICAL').length} Critical Severity`}
					icon={AlertCircle}
					accentColor="rose"
				/>
			</div>

			{/* Filter Bar */}
			<ReportFilterBar
				period={period}
				onPeriodChange={setPeriod}
				searchTerm={searchTerm}
				onSearchChange={setSearchTerm}
				activeUnitName={activeUnitName}
				isLoading={isLoading}
				onRefresh={onRefresh}
				onExportCsv={handleExport}
				searchPlaceholder="Search patients, staff, admission number, or incident notes..."
			/>

			{/* Sub-view switcher */}
			<div className="flex items-center gap-2 border-b border-slate-200 pb-3">
				<button
					onClick={() => setActiveSubView('ADMISSIONS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'ADMISSIONS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Admissions Census ({filteredAdmissions.length})
				</button>
				<button
					onClick={() => setActiveSubView('ASSIGNMENTS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'ASSIGNMENTS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Nursing Duty Roster ({filteredAssignments.length})
				</button>
				<button
					onClick={() => setActiveSubView('INCIDENTS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'INCIDENTS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Clinical Incidents ({filteredIncidents.length})
				</button>
			</div>

			{/* Admissions Table */}
			{activeSubView === 'ADMISSIONS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredAdmissions.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No admission records match your active query.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Admission Number</th>
										<th className="px-6 py-3">Resident / Patient</th>
										<th className="px-6 py-3">Room & Bed</th>
										<th className="px-6 py-3">Admission Date</th>
										<th className="px-6 py-3">Admitting Physician</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredAdmissions.map((adm) => (
										<tr key={adm.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">
												{formatAdmissionNumber(adm.admissionNumber || adm.refNo || adm.enquiry?.refNo, adm.id)}
											</td>
											<td className="px-6 py-3.5 font-semibold text-slate-800">
												<div>{adm.patient?.name || 'Resident'}</div>
												<div className="text-xs font-mono text-slate-500 font-normal">
													{formatElderId(adm.patient?.elderId, adm.patientId)}
												</div>
											</td>
											<td className="px-6 py-3.5 text-slate-600">
												{adm.room ? `Room ${adm.room}` : '—'}
												{adm.bed ? ` · Bed ${adm.bed}` : ''}
											</td>
											<td className="px-6 py-3.5 text-slate-500">
												{adm.admittedAt ? String(adm.admittedAt).slice(0, 10) : '—'}
											</td>
											<td className="px-6 py-3.5 text-slate-700">{adm.clinicalStatus || adm.healthCondition || 'General Care'}</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
														adm.status === 'ADMITTED' || adm.status === 'ACTIVE'
															? 'bg-emerald-50 text-emerald-700 border-emerald-200'
															: 'bg-slate-100 text-slate-700 border-slate-200'
													}`}
												>
													{adm.status}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Assignments Table */}
			{activeSubView === 'ASSIGNMENTS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredAssignments.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No care assignment records found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Patient</th>
										<th className="px-6 py-3">Assigned Nurse</th>
										<th className="px-6 py-3">Shift</th>
										<th className="px-6 py-3">Care Date</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredAssignments.map((asgn) => (
										<tr key={asgn.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">
												{asgn.patient?.name || 'Resident'}
											</td>
											<td className="px-6 py-3.5 text-slate-700">
												{asgn.staff ? `${asgn.staff.firstName || ''} ${asgn.staff.lastName || ''}`.trim() : 'Care Staff'}
											</td>
											<td className="px-6 py-3.5 text-slate-600">{asgn.dutyType || 'Shift Duty'}</td>
											<td className="px-6 py-3.5 text-slate-500">{asgn.startAt ? String(asgn.startAt).slice(0, 10) : '—'}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
													{asgn.status}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Incidents Table */}
			{activeSubView === 'INCIDENTS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredIncidents.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No clinical incident logs reported.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Incident Type</th>
										<th className="px-6 py-3">Severity</th>
										<th className="px-6 py-3">Description</th>
										<th className="px-6 py-3">Action Taken</th>
										<th className="px-6 py-3">Logged Date</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredIncidents.map((inc) => (
										<tr key={inc.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{inc.incidentType}</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
														inc.severity === 'CRITICAL' || inc.severity === 'HIGH'
															? 'bg-rose-100 text-rose-800'
															: 'bg-amber-100 text-amber-800'
													}`}
												>
													{inc.severity}
												</span>
											</td>
											<td className="px-6 py-3.5 max-w-sm truncate text-slate-700">{inc.description}</td>
											<td className="px-6 py-3.5 text-slate-600">{inc.actionTaken || 'Reviewed'}</td>
											<td className="px-6 py-3.5 text-slate-500">
												{inc.reportedAt ? String(inc.reportedAt).slice(0, 10) : '—'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
