import { useState } from 'react'
import { Activity, Droplets, Apple, CalendarDays } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useClientPortalVitals, useClientPortalADL, useClientPortalNutrition } from '../hooks/useClientPortal'

const formatDateTime = (value?: string | null) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-'
}

function VitalsTab() {
    const { data = [], isLoading } = useClientPortalVitals()

    return (
        <div className="space-y-4">
            {isLoading ? (
                <div className="flex justify-center p-8"><span className="text-sm font-medium text-gray-500">Loading vitals...</span></div>
            ) : data.length === 0 ? (
                <div className="flex justify-center p-8"><span className="text-sm font-medium text-gray-500">No vitals recorded yet.</span></div>
            ) : (
                <div className="grid gap-6">
                    {data.map((chart: any) => (
                        <div key={chart.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b bg-gray-50 px-4 py-3">
                                <h3 className="font-extrabold text-gray-900">{chart.patientName} - {chart.month}</h3>
                                <p className="text-xs font-semibold text-gray-500">Caregiver Vitals Chart</p>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    {(chart.entries || []).slice(0, 7).map((entry: any, idx: number) => (
                                        <div key={idx} className="flex flex-wrap gap-4 rounded-lg bg-gray-50 p-3 text-sm">
                                            <div className="flex w-full items-center gap-2 border-b pb-2 font-bold text-gray-700">
                                                <CalendarDays className="h-4 w-4" /> Day {entry.day}
                                            </div>
                                            <div className="flex flex-1 flex-col gap-1">
                                                <span className="text-xs font-bold text-gray-500 uppercase">Temp (°F)</span>
                                                <span className="font-semibold">{entry.tempMor || '-'} / {entry.tempEve || '-'}</span>
                                            </div>
                                            <div className="flex flex-1 flex-col gap-1">
                                                <span className="text-xs font-bold text-gray-500 uppercase">BP (mmHg)</span>
                                                <span className="font-semibold">{entry.bpMor || '-'} / {entry.bpEve || '-'}</span>
                                            </div>
                                            <div className="flex flex-1 flex-col gap-1">
                                                <span className="text-xs font-bold text-gray-500 uppercase">SpO2 (%)</span>
                                                <span className="font-semibold">{entry.spo2Mor || '-'} / {entry.spo2Eve || '-'}</span>
                                            </div>
                                            <div className="flex flex-1 flex-col gap-1">
                                                <span className="text-xs font-bold text-gray-500 uppercase">Pulse (bpm)</span>
                                                <span className="font-semibold">{entry.pulseMor || '-'} / {entry.pulseEve || '-'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(chart.entries || []).length > 7 && (
                                        <p className="text-center text-xs font-semibold text-gray-500">+ {(chart.entries || []).length - 7} more entries in this month</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function ADLTab() {
    const { data = [], isLoading } = useClientPortalADL()

    const columns: Column<any>[] = [
        {
            key: 'patient',
            header: 'Patient',
            cell: (item) => <span className="font-bold text-gray-900">{item.patient?.name || 'Unknown'}</span>
        },
        {
            key: 'mobility',
            header: 'Mobility',
            cell: (item) => <span className="font-medium text-gray-700">{item.mobility}</span>
        },
        {
            key: 'hygiene',
            header: 'Hygiene',
            cell: (item) => <span className="font-medium text-gray-700">{item.hygiene}</span>
        },
        {
            key: 'feeding',
            header: 'Feeding',
            cell: (item) => <span className="font-medium text-gray-700">{item.feeding}</span>
        },
        {
            key: 'status',
            header: 'Status',
            cell: (item) => <StatusHighlighter value={item.status} />
        },
        {
            key: 'recorded',
            header: 'Recorded On',
            cell: (item) => (
                <div>
                    <p className="font-semibold text-gray-900">{formatDateTime(item.createdAt)}</p>
                    <p className="text-xs text-gray-500">By {item.recordedBy}</p>
                </div>
            )
        }
    ]

    return (
        <DataTable
            data={data}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyStateMessage="No ADL records found for linked patients."
        />
    )
}

function NutritionTab() {
    const { data = [], isLoading } = useClientPortalNutrition()

    const columns: Column<any>[] = [
        {
            key: 'patient',
            header: 'Patient',
            cell: (item) => <span className="font-bold text-gray-900">{item.patient?.name || 'Unknown'}</span>
        },
        {
            key: 'calories',
            header: 'Calories',
            cell: (item) => <span className="font-extrabold text-emerald-600">{item.calories} kcal</span>
        },
        {
            key: 'plan',
            header: 'Diet Plan',
            cell: (item) => <span className="font-medium text-gray-700">{item.dietPlan}</span>
        },
        {
            key: 'assigned',
            header: 'Assigned On',
            cell: (item) => <span className="font-semibold text-gray-500">{formatDateTime(item.createdAt)}</span>
        }
    ]

    return (
        <DataTable
            data={data}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyStateMessage="No nutrition plans found for linked patients."
        />
    )
}

export function ClientPortalHealthRecords() {
    const [activeTab, setActiveTab] = useState<'vitals' | 'adl' | 'nutrition'>('vitals')

    const tabs = [
        { id: 'vitals', label: 'Vital Charts', icon: Activity },
        { id: 'adl', label: 'Daily Care (ADL)', icon: Droplets },
        { id: 'nutrition', label: 'Nutrition', icon: Apple },
    ] as const

    return (
        <div className="space-y-6">
            <PageHeader
                title="Patient Health Records"
                subtitle="Track daily vitals, activities of daily living, and nutrition plans for your linked patients."
                breadcrumbs={[{ label: 'Client Portal' }, { label: 'Health Records' }]}
            />

            <div className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-extrabold transition-all duration-200 ${
                                isActive 
                                    ? 'bg-white text-primary-700 shadow' 
                                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                            }`}
                        >
                            <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
                {activeTab === 'vitals' && <VitalsTab />}
                {activeTab === 'adl' && <ADLTab />}
                {activeTab === 'nutrition' && <NutritionTab />}
            </div>
        </div>
    )
}
