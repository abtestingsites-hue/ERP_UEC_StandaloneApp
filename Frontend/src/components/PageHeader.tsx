import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem {
    label: string
    href?: string
}

interface PageHeaderProps {
    title: string
    subtitle?: string
    breadcrumbs?: BreadcrumbItem[]
    action?: ReactNode
}

export function PageHeader({ title, subtitle, breadcrumbs = [], action }: PageHeaderProps) {
    return (
        <div className="mb-4 flex flex-col gap-2 px-2 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:px-4 2xl:px-6">
            <div>
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl 2xl:text-[28px]">{title}</h1>
                {subtitle && <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-0.5">{subtitle}</p>}
                {breadcrumbs.length > 0 && (
                    <nav className="mt-2 flex overflow-x-auto text-sm text-gray-500 scrollbar-hide" aria-label="Breadcrumb">
                        <ol className="inline-flex min-w-0 items-center space-x-1 whitespace-nowrap md:space-x-3">
                            {breadcrumbs.map((item, index) => (
                                <li key={item.label} className="inline-flex items-center">
                                    {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />}
                                    {item.href ? (
                                        <Link
                                            to={item.href}
                                            className="inline-flex items-center hover:text-[#0F969C] font-medium transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}
