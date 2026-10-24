import type { ReactNode } from 'react'

type PageHeaderProps = {
	eyebrow: string
	title: string
	description: string
	action?: ReactNode
}

export function PageHeader({
	eyebrow,
	title,
	description,
	action,
}: PageHeaderProps) {
	return (
		<div className="page-header">
			<div className="page-header__copy">
				<span className="section-kicker">{eyebrow}</span>
				<h1>{title}</h1>
				<p>{description}</p>
			</div>
			{action && <div className="page-header__action">{action}</div>}
		</div>
	)
}
