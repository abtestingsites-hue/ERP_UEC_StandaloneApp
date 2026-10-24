import { Navigate, Route, Routes } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { Dashboard } from '../features/dashboard/Dashboard'
import { Login } from '../features/auth/Login'
import { TemporaryPasswordChange } from '../features/auth/TemporaryPasswordChange'
import { SuperAdminLayout } from '../layouts/SuperAdminLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { domainModules, type DomainModule } from '../services/moduleRegistry'
import { InventoryWorkspace } from '../features/inventory/InventoryWorkspace'
import { AdmissionWorkspace } from '../features/admissions/AdmissionWorkspace'
import { CareWorkspace } from '../features/care/CareWorkspace'
import { HomeCareWorkspace } from '../features/home-care/HomeCareWorkspace'
import { VisitorSecurityWorkspace } from '../features/visitor-security/VisitorSecurityWorkspace'
import { DonorsVolunteersWorkspace } from '../features/donors-volunteers/DonorsVolunteersWorkspace'
import { FinanceWorkspace } from '../features/finance/FinanceWorkspace'
import { HrOperationsWorkspace } from '../features/hr-operations/HrOperationsWorkspace'
import { AmbulanceWorkspace } from '../features/ambulance/AmbulanceWorkspace'
import { CentralReportsWorkspace } from '../features/reports/CentralReportsWorkspace'
import { CRMWorkspace } from '../features/crm/CRMWorkspace'
import { ProtectedRoute } from './ProtectedRoute'
import { DomainGuard } from './DomainGuard'
import { useAuth } from '../features/auth/useAuth'
import { getDefaultRouteForUser, isSuperAdmin } from '../utils/permissions'
import { PortalLogin } from '../features/portal/pages/PortalLogin'
import { PortalLayout } from '../features/portal/pages/PortalLayout'

function IndexRedirect() {
	const { session } = useAuth()
	return <Navigate to={getDefaultRouteForUser(session?.user)} replace />
}

function DashboardGuard({ children }: { children: React.ReactNode }) {
	const { session } = useAuth()
	if (!isSuperAdmin(session?.user)) {
		return <Navigate to={getDefaultRouteForUser(session?.user)} replace />
	}
	return <>{children}</>
}

function DomainPreview({ domain }: { domain: DomainModule }) {
	const { Icon } = domain

	return (
		<>
			<PageHeader
				eyebrow="Business domain"
				title={domain.label}
				description={domain.description}
			/>
			<div className="preview-banner" role="note">
				<span className="preview-banner__dot" />
				<span>
					<strong>Demo preview</strong> · Sample interface only. This domain is
					not connected to live ERP data.
				</span>
			</div>
			<section className="domain-preview">
				<div className={`domain-preview__icon module-icon module-icon--${domain.accent}`}>
					<Icon size={25} strokeWidth={1.8} />
				</div>
				<div className="domain-preview__copy">
					<span className="section-kicker">WORKSPACE PREVIEW</span>
					<h2>{domain.shortLabel} overview</h2>
					<p>
						This workspace is ready for its domain-specific experience. The
						figures and activity shown in the command center are illustrative
						demo values, not live operational records.
					</p>
				</div>
				<span className="status-badge status-badge--demo">{domain.status}</span>
			</section>
			<div className="preview-placeholder-grid">
				<article className="preview-placeholder">
					<span className="preview-placeholder__index">01</span>
					<div>
						<h3>Overview</h3>
						<p>Summary panels will appear here when this module is developed.</p>
					</div>
				</article>
				<article className="preview-placeholder">
					<span className="preview-placeholder__index">02</span>
					<div>
						<h3>Records & activity</h3>
						<p>No records are loaded in this frontend-only preview.</p>
					</div>
				</article>
			</div>
		</>
	)
}

function NotFound() {
	return (
		<div className="not-found">
			<span className="section-kicker">PAGE NOT FOUND</span>
			<h1>This workspace page is unavailable.</h1>
			<p>Choose a business domain from the sidebar to continue.</p>
		</div>
	)
}

export function AppRoutes() {
	return (
		<Routes>
			{/* Public Family & Client Portal Routes */}
			<Route path="portal/login" element={<PortalLogin />} />
			<Route path="portal/*" element={<PortalLayout />} />
			<Route path="client-portal/*" element={<Navigate to="/portal" replace />} />
			<Route path="patient-portal/*" element={<Navigate to="/portal" replace />} />

			<Route element={<AuthLayout />}>
				<Route path="login" element={<Login />} />
			</Route>
			<Route element={<ProtectedRoute />}>
				<Route element={<AuthLayout />}>
					<Route path="change-temporary-password" element={<TemporaryPasswordChange />} />
				</Route>
				<Route element={<SuperAdminLayout />}>
					<Route index element={<IndexRedirect />} />
					<Route path="dashboard" element={<DashboardGuard><Dashboard /></DashboardGuard>} />
					<Route path="crm/*" element={<DomainGuard domainId="crm"><CRMWorkspace /></DomainGuard>} />
					<Route path="inventory/*" element={<DomainGuard domainId="inventory"><InventoryWorkspace /></DomainGuard>} />
					<Route path="admission/*" element={<DomainGuard domainId="admission"><AdmissionWorkspace /></DomainGuard>} />
					<Route path="inhouse-care/*" element={<DomainGuard domainId="inhouse-care"><CareWorkspace /></DomainGuard>} />
					<Route path="inhouse_care/*" element={<DomainGuard domainId="inhouse-care"><CareWorkspace /></DomainGuard>} />
					<Route path="inhouse care/*" element={<DomainGuard domainId="inhouse-care"><CareWorkspace /></DomainGuard>} />
					<Route path="home-care/*" element={<DomainGuard domainId="home-care"><HomeCareWorkspace /></DomainGuard>} />
					<Route path="visitor-security/*" element={<DomainGuard domainId="visitor-security"><VisitorSecurityWorkspace /></DomainGuard>} />
					<Route path="donors-volunteers/*" element={<DomainGuard domainId="donors-volunteers"><DonorsVolunteersWorkspace /></DomainGuard>} />
					<Route path="finance/*" element={<DomainGuard domainId="finance"><FinanceWorkspace /></DomainGuard>} />
					<Route path="hr-operations/*" element={<DomainGuard domainId="hr-operations"><HrOperationsWorkspace /></DomainGuard>} />
					<Route path="ambulance/*" element={<DomainGuard domainId="ambulance"><AmbulanceWorkspace /></DomainGuard>} />
					<Route path="reports/*" element={<DomainGuard domainId="reports"><CentralReportsWorkspace /></DomainGuard>} />
					{domainModules
						.filter(
							(domain) =>
								domain.id !== 'crm' &&
								domain.id !== 'inventory' &&
								domain.id !== 'admission' &&
								domain.id !== 'inhouse-care' &&
								domain.id !== 'home-care' &&
								domain.id !== 'visitor-security' &&
								domain.id !== 'donors-volunteers' &&
								domain.id !== 'finance' &&
								domain.id !== 'hr-operations' &&
								domain.id !== 'ambulance' &&
								domain.id !== 'reports',
						)
						.map((domain) => (
							<Route
								key={domain.id}
								path={domain.path.slice(1)}
								element={<DomainPreview domain={domain} />}
							/>
						))}
					<Route path="*" element={<NotFound />} />
				</Route>
			</Route>
		</Routes>
	)
}
