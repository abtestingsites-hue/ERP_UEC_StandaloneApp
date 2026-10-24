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
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#6DA5C0]/20 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-[#6DA5C0]/20 dark:bg-[#072E33]">
            {onSearchChange && (
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-[#6DA5C0]" />
                    </div>
                    <input
                        type="text"
                        className="block h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] py-2 pl-10 pr-3 text-sm font-medium leading-5 text-[#05161A] shadow-sm transition-all placeholder:text-[#6DA5C0] hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:placeholder:text-[#8FB7C8] dark:hover:bg-[#0A2429] dark:focus:bg-[#0B2A30]"
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
                        className="block w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] py-2 pl-3 pr-10 text-sm font-medium text-[#05161A] shadow-sm transition-all hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 sm:w-auto dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:hover:bg-[#0A2429] dark:focus:bg-[#0B2A30]"
                    >
                        {filter.placeholder && (
                            <option value="" disabled className="text-gray-400">
                                {filter.placeholder}
                            </option>
                        )}
                        {filter.options.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-[#0B2A30] dark:text-[#F7FAFC]">{opt.label}</option>
                        ))}
                    </select>
                ))}
            </div>
        </div>
    )
}
