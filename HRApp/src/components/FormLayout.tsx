import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface FormSectionProps {
    title?: string
    description?: string
    children: ReactNode
    className?: string
    contentClassName?: string
}

interface FormGridProps {
    children: ReactNode
    columns?: 1 | 2 | 3
    className?: string
}

interface FormActionsProps {
    children: ReactNode
    className?: string
}

export function FormSection({ title, description, children, className, contentClassName }: FormSectionProps) {
    return (
        <section className={cn("rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black p-4 shadow-sm", className)}>
            {(title || description) && (
                <div className="mb-4 border-b border-gray-100 dark:border-white/10 pb-3">
                    {title && <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-gray-100">{title}</h3>}
                    {description && <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{description}</p>}
                </div>
            )}
            <div className={contentClassName}>{children}</div>
        </section>
    )
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
    const columnClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3'
    }[columns]

    return (
        <div className={cn('grid gap-4', columnClass, className)}>
            {children}
        </div>
    )
}

export function FormActions({ children, className }: FormActionsProps) {
    return (
        <div className={cn('flex flex-col-reverse gap-3 border-t border-gray-100 dark:border-white/10 pt-4 sm:flex-row sm:justify-end', className)}>
            {children}
        </div>
    )
}
