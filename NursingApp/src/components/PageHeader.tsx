

interface Breadcrumb {
    label: string;
    path?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: Breadcrumb[];
}

export function PageHeader({ title, subtitle, breadcrumbs }: PageHeaderProps) {
    return (
        <div className="mb-6">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="mb-2 flex text-sm text-gray-500 dark:text-[#B8D9E8]">
                    {breadcrumbs.map((bc, idx) => (
                        <span key={idx} className="flex items-center">
                            {idx > 0 && <span className="mx-2 text-gray-400 dark:text-gray-600">/</span>}
                            {bc.path ? (
                                <a href={bc.path} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {bc.label}
                                </a>
                            ) : (
                                <span className="text-gray-700 dark:text-[#D8EEF5]">{bc.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-[#B8D9E8]">{subtitle}</p>}
        </div>
    );
}
