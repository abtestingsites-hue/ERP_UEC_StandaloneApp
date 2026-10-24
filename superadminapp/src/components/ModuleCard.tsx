import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DomainModule } from '../services/moduleRegistry'

type ModuleCardProps = {
	module: DomainModule
}

export function ModuleCard({ module }: ModuleCardProps) {
	const { Icon } = module

	return (
		<Link
			className={`module-card module-card--${module.accent}`}
			to={module.path}
			aria-label={`Open ${module.label} demo preview`}
		>
			<div className="module-card__topline">
				<span className={`module-icon module-icon--${module.accent}`}>
					<Icon size={20} strokeWidth={1.8} />
				</span>
				<span className="status-badge status-badge--demo">{module.status}</span>
			</div>
			<h3>{module.label}</h3>
			<p>{module.description}</p>
			<span className="module-card__footer">
				Open preview <ArrowUpRight size={15} />
			</span>
		</Link>
	)
}
