import { useMemo, useState } from 'react'
import { PageHeader } from './PageHeader'
import { FilterSection } from './FilterSection'
import { DataTable } from './DataTable'
import { getDemoModuleData, type DemoModuleKey, type DemoRow } from '../utils/demoData/moduleDemoData'

export function DemoModulePage({ moduleKey }: { moduleKey: DemoModuleKey }) {
    const [searchQuery, setSearchQuery] = useState('')
    const demo = getDemoModuleData(moduleKey)

    const rows = useMemo<DemoRow[]>(() => [], [searchQuery])

    return (
        <div className="flex flex-col h-full bg-transparent dark:bg-black">
            <PageHeader
                title={demo.title}
                breadcrumbs={[
                    { label: demo.module },
                    { label: demo.title }
                ]}
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder={demo.searchPlaceholder}
            />

            <DataTable<DemoRow>
                data={rows}
                columns={demo.columns}
                keyExtractor={(item) => String(item.id)}
                emptyStateMessage={`No live ${demo.title.toLowerCase()} records available.`}
            />
        </div>
    )
}
