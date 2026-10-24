import { Search } from 'lucide-react'

interface FilterOption {
    value: string
    label: string
}

interface FilterProps {
    name: string
    options: FilterOption[]
    value: string | string[]
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    placeholder?: string
    multiple?: boolean
}

interface FilterSectionProps {
    filters?: FilterProps[]
    searchQuery?: string
    onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    searchPlaceholder?: string
}

export function FilterSection({
    filters = [],
    searchQuery = '',
    onSearchChange,
    searchPlaceholder = 'Search...'
}: FilterSectionProps) {
    return (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black p-4 shadow-sm sm:flex-row sm:items-center">
            {onSearchChange && (
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block h-10 w-full rounded-xl border border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-slate-900 py-2 pl-10 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 shadow-sm transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={onSearchChange}
                    />
                </div>
            )}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {filters.map((filter, index) => (
                    <select
                        key={index}
                        name={filter.name}
                        value={filter.value}
                        onChange={filter.onChange}
                        multiple={filter.multiple}
                        className="block w-full rounded-xl border border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-slate-900 py-2 pl-3 pr-10 text-sm font-medium text-gray-900 dark:text-gray-100 shadow-sm transition-all hover:bg-white focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
                    >
                        {filter.placeholder && (
                            <option value="" disabled className="text-gray-400">
                                {filter.placeholder}
                            </option>
                        )}
                        {filter.options.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-slate-900 dark:text-gray-100">{opt.label}</option>
                        ))}
                    </select>
                ))}
            </div>
        </div>
    )
}
