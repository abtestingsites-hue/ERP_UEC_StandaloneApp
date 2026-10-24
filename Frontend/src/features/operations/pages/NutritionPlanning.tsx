import { useMemo, useState } from 'react'
import { CalendarDays, CookingPot, Utensils, Edit3, AlertTriangle, PackagePlus } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Drawer } from '../../../components/Drawer'
import { formatDateTime } from '../../healthcare/utils'
import { useCreateMealPrep, useMealPreps, useOperationsNutritionPlans, useUpdateDietaryRestrictions } from '../hooks/useOperations'
import { useInventoryProducts, useCreateKitchenRequisition } from '../../inventory/hooks/useInventory'
import type { OperationsNutritionPlan } from '../types'

const getCalorieBand = (calories: number) => {
    if (calories >= 2200) return 'High Calorie'
    if (calories <= 1400) return 'Light Diet'
    return 'Standard Diet'
}

export function NutritionPlanning() {
    const [searchQuery, setSearchQuery] = useState('')
    const { data: nutritionPlans = [], isLoading } = useOperationsNutritionPlans()
    const { data: mealPreps = [] } = useMealPreps()
    const createMealPrep = useCreateMealPrep()
    const updateDiet = useUpdateDietaryRestrictions()

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<OperationsNutritionPlan | null>(null)
    const [restrictions, setRestrictions] = useState('')
    const [texture, setTexture] = useState('STANDARD')
    const [notes, setNotes] = useState('')

    const [ingredientDrawerOpen, setIngredientDrawerOpen] = useState(false)
    const [selectedMealPrepId, setSelectedMealPrepId] = useState<string | null>(null)
    const [selectedIngredients, setSelectedIngredients] = useState<{productId: string, quantity: number}[]>([])

    const { data: elderProducts = [] } = useInventoryProducts({ scope: 'elder' })
    const createKitchenRequisition = useCreateKitchenRequisition()

    const handleEditDiet = (plan: OperationsNutritionPlan) => {
        setSelectedPlan(plan)
        const planAny = plan as any;
        setRestrictions(planAny.metadata && typeof planAny.metadata === 'object' && 'dietaryRestrictions' in planAny.metadata ? String(planAny.metadata.dietaryRestrictions) : '')
        setTexture(planAny.metadata && typeof planAny.metadata === 'object' && 'textureModification' in planAny.metadata ? String(planAny.metadata.textureModification) : 'STANDARD')
        setNotes(planAny.metadata && typeof planAny.metadata === 'object' && 'dietaryNotes' in planAny.metadata ? String(planAny.metadata.dietaryNotes) : '')
        setDrawerOpen(true)
    }

    const handleSaveDiet = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedPlan) return
        updateDiet.mutate({
            id: selectedPlan.id,
            data: { restrictions, texture, notes }
        }, {
            onSuccess: () => {
                setDrawerOpen(false)
            }
        })
    }

    const handleOpenIngredients = (mealPrepId: string) => {
        setSelectedMealPrepId(mealPrepId)
        setSelectedIngredients([{ productId: '', quantity: 1 }])
        setIngredientDrawerOpen(true)
    }

    const handleSaveIngredients = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMealPrepId) return
        
        const validItems = selectedIngredients.filter(i => i.productId && i.quantity > 0)
        if (!validItems.length) return

        createKitchenRequisition.mutate({
            mealPrepId: selectedMealPrepId,
            items: validItems
        }, {
            onSuccess: () => {
                setIngredientDrawerOpen(false)
                setSelectedIngredients([])
            }
        })
    }

    const mealPrepByNutritionId = useMemo(() => {
        return new Map(mealPreps.map((prep) => [prep.nutritionId, prep]))
    }, [mealPreps])

    const visiblePlans = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return nutritionPlans.filter((plan) => !query || [
            plan.patient?.name || '',
            plan.dietPlan,
            plan.calories,
            getCalorieBand(Number(plan.calories || 0))
        ].some((value) => String(value).toLowerCase().includes(query)))
    }, [nutritionPlans, searchQuery])

    const highCalorie = nutritionPlans.filter((plan) => Number(plan.calories || 0) >= 2200).length
    const lightDiet = nutritionPlans.filter((plan) => Number(plan.calories || 0) <= 1400).length
    const standardDiet = nutritionPlans.length - highCalorie - lightDiet

    const columns: Column<OperationsNutritionPlan>[] = [
        { key: 'sno', header: 'S.No', cell: (_plan, index) => index + 1, sortable: false },
        {
            key: 'patient',
            header: 'Patient',
            cell: (plan) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Utensils className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{plan.patient?.name || 'Patient'}</p>
                        <p className="text-xs font-semibold text-slate-500">Kitchen planning</p>
                    </div>
                </div>
            )
        },
        { key: 'calories', header: 'Calories', cell: (plan) => `${plan.calories} kcal`, sortable: true },
        { key: 'dietBand', header: 'Diet Band', cell: (plan) => <StatusHighlighter value={getCalorieBand(Number(plan.calories || 0))} /> },
        {
            key: 'dietPlan',
            header: 'Diet Instructions',
            cell: (plan) => {
                const planAny = plan as any;
                const metadata = typeof planAny.metadata === 'object' && planAny.metadata ? planAny.metadata : {}
                const r = 'dietaryRestrictions' in metadata ? String(metadata.dietaryRestrictions) : ''
                const t = 'textureModification' in metadata ? String(metadata.textureModification) : 'STANDARD'
                return (
                    <div className="flex flex-col gap-1">
                        <span className="whitespace-normal text-sm font-semibold text-slate-700">{plan.dietPlan}</span>
                        {r && <span className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {r}</span>}
                        {t !== 'STANDARD' && <span className="text-xs font-bold text-blue-600">{t}</span>}
                    </div>
                )
            }
        },
        { key: 'createdAt', header: 'Plan Date', cell: (plan) => formatDateTime(plan.createdAt), sortable: true },
        {
            key: 'mealPrep',
            header: 'Kitchen Prep',
            sortable: false,
            cell: (plan) => {
                const prep = mealPrepByNutritionId.get(plan.id)
                return (
                    <div className="flex gap-2 items-center">
                        {prep ? (
                            <>
                                <StatusHighlighter value={prep.status} />
                                <button
                                    type="button"
                                    onClick={() => handleOpenIngredients(prep.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                                >
                                    <PackagePlus className="h-3.5 w-3.5" /> Ingredients
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => createMealPrep.mutate({ nutritionId: plan.id })}
                                disabled={createMealPrep.isPending}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <CookingPot className="h-3.5 w-3.5" />
                                Create
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => handleEditDiet(plan)}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-300 dark:hover:bg-white/5"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )
            }
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Nutrition Planning"
                subtitle="Kitchen planning board from live patient nutrition and diet records."
                breadcrumbs={[{ label: 'Operations' }, { label: 'Nutrition Planning' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{nutritionPlans.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Diet Plans</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{standardDiet}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Standard Diet</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{lightDiet}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Light Diet</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{highCalorie}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">High Calorie</p>
                </div>
            </div>

            <div className="mb-4 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
                <CalendarDays className="mr-2 inline h-4 w-4" />
                Review live diet plans here, then create meal-prep work for the kitchen. Food Preparation only shows plans moved from this board.
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search patient, diet instructions, calories..."
            />

            <DataTable
                data={visiblePlans}
                columns={columns}
                keyExtractor={(plan) => plan.id}
                isLoading={isLoading}
                emptyStateMessage="No live nutrition plans found. Add diet plans from Healthcare → Nutrition & Diet."
            />
            
            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Specialized Diet Mapping for ${selectedPlan?.patient?.name || 'Resident'}`}>
                <form onSubmit={handleSaveDiet} className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Dietary Restrictions & Allergies</label>
                        <input
                            type="text"
                            value={restrictions}
                            onChange={(e) => setRestrictions(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            placeholder="e.g. Nut Allergy, Lactose Intolerant"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Texture Modification</label>
                        <select
                            value={texture}
                            onChange={(e) => setTexture(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                            <option value="STANDARD">Standard</option>
                            <option value="SOFT">Soft / Bite-Sized</option>
                            <option value="MINCED">Minced & Moist</option>
                            <option value="PUREED">Pureed</option>
                            <option value="LIQUID">Liquid Diet</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Additional Kitchen Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            rows={3}
                            placeholder="Specific cultural requirements, preference for warm water, etc."
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={updateDiet.isPending}
                        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary-600 px-4 text-sm font-extrabold text-white transition hover:bg-primary-700 disabled:opacity-50"
                    >
                        Save Diet Profile
                    </button>
                </form>
            </Drawer>

            <Drawer isOpen={ingredientDrawerOpen} onClose={() => setIngredientDrawerOpen(false)} title="Request Kitchen Ingredients" size="md">
                <form onSubmit={handleSaveIngredients} className="space-y-4">
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                        Select ration/kitchen items to fulfill this meal prep. This will automatically deduct stock and create a KITCHEN_PREP movement, bypassing patient billing.
                    </div>

                    {selectedIngredients.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="mb-1 block text-xs font-bold text-gray-600">Product</label>
                                <select
                                    value={item.productId}
                                    onChange={(e) => {
                                        const newItems = [...selectedIngredients]
                                        newItems[index].productId = e.target.value
                                        setSelectedIngredients(newItems)
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Select ration item...</option>
                                    {elderProducts.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="mb-1 block text-xs font-bold text-gray-600">Qty</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={item.quantity}
                                    onChange={(e) => {
                                        const newItems = [...selectedIngredients]
                                        newItems[index].quantity = Number(e.target.value) || 0
                                        setSelectedIngredients(newItems)
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                    required
                                />
                            </div>
                            {selectedIngredients.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newItems = selectedIngredients.filter((_, i) => i !== index)
                                        setSelectedIngredients(newItems)
                                    }}
                                    className="mt-5 text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => setSelectedIngredients([...selectedIngredients, { productId: '', quantity: 1 }])}
                        className="text-sm font-bold text-primary-600 hover:text-primary-700"
                    >
                        + Add another item
                    </button>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={createKitchenRequisition.isPending}
                            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {createKitchenRequisition.isPending ? 'Processing...' : 'Deduct Stock & Issue Items'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
