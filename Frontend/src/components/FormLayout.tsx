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
        <section className={cn("rounded-2xl border border-[#6DA5C0]/20 bg-white p-4 shadow-sm dark:border-[#6DA5C0]/20 dark:bg-[#072E33]", className)}>
            {(title || description) && (
                <div className="mb-4 border-b border-[#6DA5C0]/15 pb-3 dark:border-[#6DA5C0]/20">
                    {title && <h3 className="text-[15px] font-extrabold text-[#05161A] dark:text-[#F7FAFC]">{title}</h3>}
                    {description && <p className="mt-1 text-sm font-medium text-gray-500 dark:text-[#8FB7C8]">{description}</p>}
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
        <div className={cn('flex flex-col-reverse gap-3 border-t border-[#6DA5C0]/15 pt-4 sm:flex-row sm:justify-end dark:border-[#6DA5C0]/20', className)}>
            {children}
        </div>
    )
}
