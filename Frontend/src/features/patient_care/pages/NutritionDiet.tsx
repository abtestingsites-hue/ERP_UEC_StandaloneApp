import { useMemo, useState } from 'react'
import { Apple, Plus } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useHealthcarePatients } from '../../healthcare/hooks/useHealthcare'
import { useCreatePatientCareNutritionPlan, usePatientCareNutritionPlans } from '../hooks/usePatientCare'
import { formatDateTime } from '../../healthcare/utils'
import { PatientSelector } from '../../../components/PatientSelector'
import { StaffSelector } from '../../../components/StaffSelector'

export function NutritionDiet() {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({ 
        patientId: '', 
        calories: '', 
        dietPlan: '', 
        mealSchedule: '', 
        dietaryRestrictions: '', 
        notes: '', 
        assignedStaffId: '' 
    })

    const { data: patients = [], isLoading: patientsLoading } = useHealthcarePatients()
    const { data: nutritionPlans = [], isLoading: nutritionLoading } = usePatientCareNutritionPlans()
    const createNutrition = useCreatePatientCareNutritionPlan()

    const visiblePlans = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return nutritionPlans.filter((plan: any) => !query || [
            plan.patient?.name || '',
            plan.dietPlan,
            plan.mealSchedule,
            plan.status
        ].some((value) => String(value).toLowerCase().includes(query)))
    }, [nutritionPlans, searchQuery])

    const averageCalories = nutritionPlans.length
        ? Math.round(nutritionPlans.reduce((sum: number, plan: any) => sum + Number(plan.calories || 0), 0) / nutritionPlans.length)
        : 0

    const columns: Column<any>[] = [
        {
            key: 'patient',
            header: 'Resident',
            cell: (plan) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <Apple className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{plan.patient?.name || 'Resident'}</p>
                        <p className="text-xs font-semibold text-slate-500">Nutrition plan</p>
                    </div>
                </div>
            )
        },
        { key: 'calories', header: 'Calories', cell: (plan) => plan.calories ? `${plan.calories} kcal` : '-', sortable: true },
        {
            key: 'dietPlan',
            header: 'Diet Plan',
            cell: (plan) => <span className="whitespace-normal text-sm font-semibold text-slate-700">{plan.dietPlan}</span>
        },
        { key: 'schedule', header: 'Meal Schedule', cell: (plan) => plan.mealSchedule || '-' },
        { key: 'restrictions', header: 'Restrictions', cell: (plan) => plan.dietaryRestrictions || '-' },
        { key: 'status', header: 'Status', cell: (plan) => <StatusHighlighter value={plan.status} /> },
        { key: 'createdAt', header: 'Created', cell: (plan) => formatDateTime(plan.createdAt), sortable: true }
    ]

    const handleCreateNutrition = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!formData.patientId || !formData.dietPlan.trim()) return

        await createNutrition.mutateAsync({
            ...formData,
            assignedStaffId: formData.assignedStaffId || undefined,
            calories: formData.calories ? Math.trunc(Number(formData.calories)) : undefined
        })
        setFormData({ patientId: '', calories: '', dietPlan: '', mealSchedule: '', dietaryRestrictions: '', notes: '', assignedStaffId: '' })
        setDrawerOpen(false)
    }

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Nutrition & Diet"
                subtitle="Live diet plans linked directly to registered residents."
                breadcrumbs={[{ label: 'Patient Care' }, { label: 'Nutrition & Diet' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{nutritionPlans.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Diet Plans</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{averageCalories || '-'}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Avg Calories</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{patients.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Residents Available</p>
                </div>
            </div>

            <ActionBar onAdd={() => setDrawerOpen(true)} addLabel="Add Diet Plan" />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search resident, diet plan..."
            />

            <DataTable
                data={visiblePlans}
                columns={columns}
                keyExtractor={(plan: any) => plan.id}
                isLoading={patientsLoading || nutritionLoading}
                emptyStateMessage="No live nutrition plans found. Add a diet plan for an existing resident."
            />

            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Diet Plan" size="md">
                <form onSubmit={handleCreateNutrition} className="space-y-4">
                    <PatientSelector
                        value={formData.patientId}
                        onChange={(val) => setFormData((prev) => ({ ...prev, patientId: val }))}
                        required
                    />
                    
                    <Input 
                        label="Calories (Optional)" 
                        type="number" 
                        min="1" 
                        step="1" 
                        value={formData.calories} 
                        onChange={(event) => setFormData((prev) => ({ ...prev, calories: event.target.value }))} 
                        placeholder="1800" 
                    />
                    
                    <Input 
                        label="Dietary Restrictions" 
                        value={formData.dietaryRestrictions} 
                        onChange={(event) => setFormData((prev) => ({ ...prev, dietaryRestrictions: event.target.value }))} 
                        placeholder="e.g. Nut Allergy, Low Sodium" 
                    />
                    
                    <Input 
                        label="Meal Schedule" 
                        value={formData.mealSchedule} 
                        onChange={(event) => setFormData((prev) => ({ ...prev, mealSchedule: event.target.value }))} 
                        placeholder="e.g. 8AM, 12PM, 6PM" 
                    />

                    <StaffSelector 
                        value={formData.assignedStaffId}
                        onChange={(val) => setFormData((prev) => ({ ...prev, assignedStaffId: val }))}
                        placeholder="Assign Dietitian/Staff..."
                    />

                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Diet Plan Details</span>
                        <textarea
                            required
                            value={formData.dietPlan}
                            onChange={(event) => setFormData((prev) => ({ ...prev, dietPlan: event.target.value }))}
                            placeholder="Breakfast, lunch, dinner, hydration notes..."
                            className="min-h-32 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Additional Notes</span>
                        <textarea
                            value={formData.notes}
                            onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                            placeholder="Preferences, cultural requirements..."
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </label>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createNutrition.isPending || !patients.length} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            <Plus className="h-4 w-4" />
                            {createNutrition.isPending ? 'Saving...' : 'Save Diet Plan'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
