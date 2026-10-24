import { useState } from 'react'
import { Drawer } from '../../../components/Drawer'
import { useVitalSigns } from '../hooks/useHealthcare'
import { useClinicalSummary } from '../../patient_care/hooks/usePatientCare'
import { useUecIncidents } from '../../patient_care/pages/IncidentReports'
import { useInventoryStockIssueRequests } from '../../inventory/hooks/useInventory'
import { Activity, Apple, CheckSquare, Pill, AlertTriangle, Package } from 'lucide-react'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { format } from 'date-fns'

interface ResidentProfileDrawerProps {
    isOpen: boolean
    onClose: () => void
    patientId: string | null
    patientName: string
}

export function ResidentProfileDrawer({ isOpen, onClose, patientId, patientName }: ResidentProfileDrawerProps) {
    const [activeTab, setActiveTab] = useState<'vitals' | 'adl' | 'nutrition' | 'medication' | 'stock' | 'incidents'>('vitals')

    // Only fetch when drawer is open and patientId exists
    const queryOptions = { enabled: isOpen && !!patientId }

    const { data: clinicalSummary, isLoading: isSummaryLoading } = useClinicalSummary(patientId || '', null, queryOptions)
    
    const vitals = clinicalSummary?.latestVitals || []
    const isVitalsLoading = isSummaryLoading
    const adlRecords = clinicalSummary?.latestAdls || []
    const isAdlLoading = isSummaryLoading
    const nutritionPlans = clinicalSummary?.latestNutrition || []
    const isNutritionLoading = isSummaryLoading
    const medSchedules = clinicalSummary?.medicationSchedules || []
    const isMedLoading = isSummaryLoading

    const { data: stockRequests = [], isLoading: isStockLoading } = useInventoryStockIssueRequests({ patientId, ...queryOptions })
    const { data: incidents = [], isLoading: isIncidentsLoading } = useUecIncidents(patientId, queryOptions)

    const tabs = [
        { id: 'vitals', label: 'Vitals', icon: Activity },
        { id: 'adl', label: 'ADL', icon: CheckSquare },
        { id: 'nutrition', label: 'Nutrition', icon: Apple },
        { id: 'medication', label: 'Medication', icon: Pill },
        { id: 'stock', label: 'Stock Issue', icon: Package },
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle }
    ] as const

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={`${patientName} - Resident Profile`} size="xl">
            <div className="flex h-full flex-col">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${
                                        activeTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    } group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium`}
                                >
                                    <Icon className={`${
                                        activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                                    } -ml-0.5 mr-2 h-5 w-5`} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {/* VITALS TAB */}
                    {activeTab === 'vitals' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Recent Vitals</h3>
                            {isVitalsLoading ? (
                                <p className="text-sm text-gray-500">Loading vitals...</p>
                            ) : vitals.length === 0 ? (
                                <p className="text-sm text-gray-500">No vitals recorded.</p>
                            ) : (
                                <div className="overflow-hidden bg-white shadow sm:rounded-md">
                                    <ul role="list" className="divide-y divide-gray-200">
                                        {vitals.slice(0, 5).map((vital: any) => (
                                            <li key={vital.id} className="px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-4">
                                                        <p className="text-sm font-medium text-gray-900">BP: {vital.bloodPressure}</p>
                                                        <p className="text-sm text-gray-500">Pulse: {vital.pulseRate} bpm</p>
                                                        <p className="text-sm text-gray-500">Temp: {vital.temperature}°F</p>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{format(new Date(vital.recordedAt || vital.createdAt), 'PP p')}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADL TAB */}
                    {activeTab === 'adl' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">ADL Records</h3>
                            {isAdlLoading ? (
                                <p className="text-sm text-gray-500">Loading ADL...</p>
                            ) : adlRecords.length === 0 ? (
                                <p className="text-sm text-gray-500">No ADL records.</p>
                            ) : (
                                <div className="overflow-hidden bg-white shadow sm:rounded-md">
                                    <ul role="list" className="divide-y divide-gray-200">
                                        {adlRecords.slice(0, 10).map((record: any) => (
                                            <li key={record.id} className="px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Mobility: {record.mobility || 'N/A'}</p>
                                                        <p className="text-sm text-gray-500">Hygiene: {record.hygiene || 'N/A'}</p>
                                                    </div>
                                                    <StatusHighlighter value={record.status} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* NUTRITION TAB */}
                    {activeTab === 'nutrition' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Nutrition Plans</h3>
                            {isNutritionLoading ? (
                                <p className="text-sm text-gray-500">Loading nutrition plans...</p>
                            ) : nutritionPlans.length === 0 ? (
                                <p className="text-sm text-gray-500">No nutrition plans.</p>
                            ) : (
                                <div className="overflow-hidden bg-white shadow sm:rounded-md">
                                    <ul role="list" className="divide-y divide-gray-200">
                                        {nutritionPlans.map((plan: any) => (
                                            <li key={plan.id} className="px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{plan.dietType || 'Standard Diet'}</p>
                                                        <p className="text-sm text-gray-500">Calories: {plan.dailyCalories || 'Not set'}</p>
                                                    </div>
                                                    <StatusHighlighter value={plan.status} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MEDICATION TAB */}
                    {activeTab === 'medication' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Medication Schedules</h3>
                            {isMedLoading ? (
                                <p className="text-sm text-gray-500">Loading schedules...</p>
                            ) : medSchedules.length === 0 ? (
                                <p className="text-sm text-gray-500">No medication schedules.</p>
                            ) : (
                                <div className="overflow-hidden bg-white shadow sm:rounded-md">
                                    <ul role="list" className="divide-y divide-gray-200">
                                        {medSchedules.map((schedule: any) => (
                                            <li key={schedule.id} className="px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{schedule.payload?.medicationName || 'Unknown Medication'}</p>
                                                        <p className="text-sm text-gray-500">Dosage: {schedule.payload?.dosage || 'N/A'}</p>
                                                    </div>
                                                    <StatusHighlighter value={schedule.payload?.status || 'SCHEDULED'} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STOCK ISSUE TAB */}
                    {activeTab === 'stock' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Stock Issue Requests</h3>
                            {isStockLoading ? (
                                <p className="text-sm text-gray-500">Loading requests...</p>
                            ) : stockRequests.length === 0 ? (
                                <p className="text-sm text-gray-500">No stock requests.</p>
                            ) : (
                                <div className="overflow-hidden bg-white shadow sm:rounded-md">
                                    <ul role="list" className="divide-y divide-gray-200">
                                        {stockRequests.map((req: any) => (
                                            <li key={req.id} className="px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Request: {req.requestNumber || req.id.slice(0,8)}</p>
                                                        <p className="text-sm text-gray-500">Qty: {req.quantity}</p>
                                                    </div>
                                                    <StatusHighlighter value={req.status} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* INCIDENTS TAB */}
                    {activeTab === 'incidents' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Reported Incidents</h3>
                            {isIncidentsLoading ? (
                                <p className="text-sm text-gray-500">Loading incidents...</p>
                            ) : incidents.length === 0 ? (
                                <p className="text-sm text-gray-500">No incidents reported.</p>
                            ) : (
                                <div className="overflow-hidden bg-white shadow sm:rounded-md">
                                    <ul role="list" className="divide-y divide-gray-200">
                                        {incidents.map((incident: any) => (
                                            <li key={incident.id} className="px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{incident.title}</p>
                                                        <p className="text-sm text-gray-500">{incident.category} - {incident.severity}</p>
                                                    </div>
                                                    <StatusHighlighter value={incident.status} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    )
}
