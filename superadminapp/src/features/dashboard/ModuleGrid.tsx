import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { domainModules } from '../../services/moduleRegistry'
import { ModuleCard } from '../../components/ModuleCard'

export function ModuleGrid() {
	return (
		<section className="module-section" aria-labelledby="module-heading">
			<div className="section-heading">
				<div>
					<span className="section-kicker">ENTERPRISE BUSINESS DOMAINS</span>
					<h2 id="module-heading">Your workspaces</h2>
				</div>
				<Link className="text-link" to="/reports">
					View all <ArrowRight size={15} />
				</Link>
			</div>
			<div className="module-grid">
				{domainModules.map((module) => (
					<ModuleCard key={module.id} module={module} />
				))}
			</div>
		</section>
	)
}
