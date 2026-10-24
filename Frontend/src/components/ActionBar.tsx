import { Plus, Filter, Download } from 'lucide-react'
import { cn } from '../lib/utils'

interface ActionBarProps {
    onAdd?: () => void
    onFilter?: () => void
    onExport?: () => void
    addLabel?: string
    exportLabel?: string
    className?: string
}

export function ActionBar({
    onAdd,
    onFilter,
    onExport,
    addLabel = 'Add New',
    exportLabel = 'Export',
    className
}: ActionBarProps) {
    return (
        <div className={cn("mb-4 flex flex-wrap items-center gap-3", className)}>
            {onFilter && (
                <button
                    type="button"
                    onClick={onFilter}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#6DA5C0]/30 bg-white px-4 text-[13.5px] font-semibold text-[#294D61] shadow-sm transition-all hover:border-[#0F969C]/50 hover:bg-[#F7FAFC] hover:text-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#072E33] dark:text-[#B8D9E8] dark:hover:bg-[#0A2429] dark:hover:text-white"
                >
                    <Filter className="h-4 w-4 text-[#6DA5C0]" />
                    Filter
                </button>
            )}
            <div className="flex-1" />
            {onExport && (
                <button
                    type="button"
                    onClick={onExport}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#6DA5C0]/30 bg-white px-4 text-[13.5px] font-semibold text-[#294D61] shadow-sm transition-all hover:border-[#0F969C]/50 hover:bg-[#F7FAFC] hover:text-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#072E33] dark:text-[#B8D9E8] dark:hover:bg-[#0A2429] dark:hover:text-white"
                >
                    <Download className="h-4 w-4 text-[#6DA5C0]" />
                    {exportLabel}
                </button>
            )}
            {onAdd && (
                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-transparent bg-gradient-to-r from-[#0F969C] to-[#294D61] px-4 text-[13.5px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,150,156,0.24)] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/30 focus:ring-offset-2 active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    {addLabel}
                </button>
            )}
        </div>
    )
}
