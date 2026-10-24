import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    action?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs = [], action }: PageHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
                {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
                {breadcrumbs.length > 0 && (
                    <nav className="mt-2.5 flex overflow-x-auto text-xs text-slate-500 dark:text-slate-400 scrollbar-hide" aria-label="Breadcrumb">
                        <ol className="inline-flex min-w-0 items-center space-x-1 whitespace-nowrap md:space-x-2">
                            {breadcrumbs.map((item, index) => (
                                <li key={item.label} className="inline-flex items-center">
                                    {index > 0 && <ChevronRight className="mx-1 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
                                    {item.href ? (
                                        <Link
                                            to={item.href}
                                            className="inline-flex items-center hover:text-[#0F969C] dark:hover:text-[#0F969C] font-semibold transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.label}</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
