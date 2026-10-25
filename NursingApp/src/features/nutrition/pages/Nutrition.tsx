import { useState, useMemo, useEffect } from 'react';
import { Plus, ChevronDown, Apple, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Modal } from '../../../components/Modal';
import { usePatients } from '../../patients/hooks/usePatients';
import { StaffSelector } from '../../../components/StaffSelector';
import { useNutritionPlans, useCreateNutritionPlan, useNutritionRecords, useCreateNutritionRecord } from '../hooks/useNutrition';
import { useAuthStore } from '../../../store/authStore';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

export default function Nutrition() {
    const { data: patients = [], isLoading: loadingPatients } = usePatients();
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    
    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState({
        calories: '',
        dietPlan: '',
        mealSchedule: '',
        dietaryRestrictions: '',
        notes: '',
        assignedStaffId: ''
    });

    const [recordMealModal, setRecordMealModal] = useState({
        isOpen: false,
        meal: '',
        status: 'CONSUMED',
        remarks: ''
    });

    const [searchParams] = useSearchParams();
    const urlPatientId = searchParams.get('patientId');
    const user = useAuthStore((state: any) => state.user);
    const userRoleStr = typeof user?.role === 'object' ? user?.role?.name : user?.role;
    const isRestrictedRole = !['SUPER_ADMIN', 'NURSING_MANAGER', 'NURSING_SUPER_HEAD', 'MEDICAL_MANAGER', 'ELDER_OPERATIONS_MANAGER', 'CARE_ALLOCATION_MANAGER', 'NURSING_CARE_STAFF'].includes(String(userRoleStr || '').trim().toUpperCase().replace(/\s+/g, '_'));

    useEffect(() => {
        if (urlPatientId) {
            setSelectedPatientId(urlPatientId);
        }
    }, [urlPatientId]);

    const { data: nutritionPlans = [], isLoading: loadingNutrition } = useNutritionPlans(selectedPatientId, { enabled: Boolean(selectedPatientId) });
    const createNutrition = useCreateNutritionPlan();

    const todayDateStr = useMemo(() => format(new Date(), "yyyy-MM-dd'T'00:00:00.000'Z'"), []);
    const { data: nutritionRecords = [], isLoading: loadingRecords } = useNutritionRecords(selectedPatientId, todayDateStr, { enabled: Boolean(selectedPatientId) });
    const createRecord = useCreateNutritionRecord();

    const activeDietPlan = useMemo(() => {
        return nutritionPlans.find((p: any) => p.status === 'ACTIVE' || p.status == null);
    }, [nutritionPlans]);

    const mealsList = useMemo(() => {
        if (activeDietPlan?.mealSchedule) {
            return activeDietPlan.mealSchedule.split(',').map((m: string) => m.trim()).filter(Boolean);
        }
        return ['Breakfast', 'Lunch', 'Dinner'];
    }, [activeDietPlan]);

    const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

    const patientOptions = useMemo(() => {
        const options = patients.map(p => ({ id: p.id, name: p.name }));
        if (urlPatientId && !options.some(option => option.id === urlPatientId)) {
            options.unshift({
                id: urlPatientId,
                name: selectedPatient?.name || 'Selected patient'
            });
        }
        return options;
    }, [patients, selectedPatient, urlPatientId]);

    const handleAssignSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId || !formData.dietPlan.trim()) return;
        const assignmentId = searchParams.get('assignmentId');

        createNutrition.mutate({
            patientId: selectedPatientId,
            assignmentId: assignmentId || undefined,
            calories: formData.calories ? Math.trunc(Number(formData.calories)) : undefined,
            dietPlan: formData.dietPlan,
            mealSchedule: formData.mealSchedule,
            dietaryRestrictions: formData.dietaryRestrictions,
            notes: formData.notes,
            assignedStaffId: formData.assignedStaffId || undefined
        }, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setFormData({
                    calories: '',
                    dietPlan: '',
                    mealSchedule: '',
                    dietaryRestrictions: '',
                    notes: '',
                    assignedStaffId: ''
                });
            }
        });
    };

    const handleRecordMealSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId || !recordMealModal.meal) return;
        
        const assignmentId = searchParams.get('assignmentId');
        createRecord.mutate({
            patientId: selectedPatientId,
            assignmentId: assignmentId || undefined,
            meal: recordMealModal.meal,
            careDate: todayDateStr,
            status: recordMealModal.status,
            remarks: recordMealModal.remarks
        }, {
            onSuccess: () => {
                setRecordMealModal({ isOpen: false, meal: '', status: 'CONSUMED', remarks: '' });
            }
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Nutrition & Diet"
                subtitle="Live diet plans linked directly to registered residents."
                breadcrumbs={[{ label: 'Nursing Care' }, { label: 'Nutrition & Diet' }]}
            />

            {/* PATIENT SELECTION / CONTEXT */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                {!isRestrictedRole && (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5">
                        <div className="w-full max-w-md">
                            <label className="block text-sm font-bold text-gray-700">
                                Select Patient
                            </label>
                            <div className="relative mt-1">
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    disabled={loadingPatients}
                                    className="w-full appearance-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                                >
                                    <option value="">-- Search patient name / patient ID --</option>
                                    {patientOptions.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.name} (PT-{patient.id.substring(0, 4).toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        {selectedPatientId && (
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add Diet Plan
                            </button>
                        )}
                    </div>
                )}

                {selectedPatientId && selectedPatient ? (
                    <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Patient Information</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500 mb-1">Patient Name</div>
                                <div className="font-bold text-gray-900">{selectedPatient.name}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 mb-1">Patient ID</div>
                                <div className="font-semibold text-gray-900">PT-{selectedPatientId.substring(0, 4).toUpperCase()}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 mb-1">Status</div>
                                <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                                    ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 border-t border-gray-100 mt-5">
                        <Apple className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm font-medium">Select a patient to view and manage nutrition plans.</p>
                    </div>
                )}
            </div>

            {/* NUTRITION PLANS LIST */}
            {selectedPatientId && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-4 items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Apple className="h-5 w-5 text-gray-500" />
                            Current Diet Plan
                        </h3>
                        {loadingNutrition && <span className="text-xs font-bold text-emerald-600 animate-pulse">Loading plans...</span>}
                    </div>

                    <div className="p-0">
                        {!loadingNutrition && nutritionPlans.length === 0 ? (
                            <div className="py-16 text-center text-gray-500">
                                <Apple className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                <p className="text-base font-bold text-gray-700">No active nutrition plan found.</p>
                                <p className="text-sm text-gray-500 mt-1">Assign a new diet plan to get started.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Diet Plan</th>
                                            <th className="px-6 py-4 font-bold">Calories</th>
                                            <th className="px-6 py-4 font-bold">Meal Schedule</th>
                                            <th className="px-6 py-4 font-bold">Restrictions</th>
                                            <th className="px-6 py-4 font-bold">Status</th>
                                            <th className="px-6 py-4 font-bold">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {nutritionPlans.map((plan: any) => (
                                            <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="whitespace-normal text-sm font-semibold text-gray-700">{plan.dietPlan}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {plan.calories ? `${plan.calories} kcal` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 font-medium">
                                                    {plan.mealSchedule || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {plan.dietaryRestrictions || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(plan.status)}`}>
                                                        {plan.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">
                                                    {plan.createdAt ? format(new Date(plan.createdAt), 'dd MMM yyyy HH:mm') : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TODAY'S NUTRITION (Nurse Workflow) */}
            {selectedPatientId && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mt-6">
                    <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-4 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Today's Nutrition</h3>
                                <p className="text-xs font-semibold text-gray-500 mt-0.5">{format(new Date(), 'dd MMM yyyy')}</p>
                            </div>
                        </div>
                        {loadingRecords && <span className="text-xs font-bold text-blue-600 animate-pulse">Loading records...</span>}
                    </div>
                    
                    <div className="p-6">
                        {mealsList.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-sm">No meals defined for today.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mealsList.map((mealName: string) => {
                                    const existingRecord = nutritionRecords.find((r: any) => 
                                        r.meal.toLowerCase() === mealName.toLowerCase()
                                    );
                                    
                                    return (
                                        <div key={mealName} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                                <h4 className="font-bold text-gray-900">{mealName}</h4>
                                                {existingRecord ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Recorded
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        Not Recorded
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col">
                                                {existingRecord ? (
                                                    <div className="space-y-3 flex-1">
                                                        <div>
                                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</div>
                                                            <div className="font-bold text-gray-900">{existingRecord.status}</div>
                                                        </div>
                                                        {existingRecord.remarks && (
                                                            <div>
                                                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Remarks</div>
                                                                <div className="text-sm text-gray-700">{existingRecord.remarks}</div>
                                                            </div>
                                                        )}
                                                        <div className="pt-3 border-t border-gray-100 mt-auto">
                                                            <div className="text-xs text-gray-500 font-medium">
                                                                Recorded by <span className="font-bold text-gray-700">{existingRecord.recordedByName || existingRecord.recordedBy}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-medium mt-0.5">
                                                                at {format(new Date(existingRecord.recordedAt), 'hh:mm a')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                                                        <button
                                                            onClick={() => setRecordMealModal({ isOpen: true, meal: mealName, status: 'CONSUMED', remarks: '' })}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 text-sm font-bold shadow-sm hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors w-full justify-center"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Record {mealName}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ASSIGN DIET PLAN MODAL */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Diet Plan"
                confirmLabel="Save Diet Plan"
                onConfirm={handleAssignSubmit as any}
                confirmDisabled={createNutrition.isPending || !formData.dietPlan.trim()}
            >
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Calories (Optional)</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={formData.calories}
                            onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            placeholder="1800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Dietary Restrictions</label>
                        <input 
                            value={formData.dietaryRestrictions} 
                            onChange={(e) => setFormData(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" 
                            placeholder="e.g. Nut Allergy, Low Sodium" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Meal Schedule</label>
                        <input 
                            value={formData.mealSchedule} 
                            onChange={(e) => setFormData(prev => ({ ...prev, mealSchedule: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" 
                            placeholder="e.g. 8AM, 12PM, 6PM" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Select Staff</label>
                        <StaffSelector 
                            value={formData.assignedStaffId} 
                            onChange={(staffId) => setFormData(prev => ({ ...prev, assignedStaffId: staffId }))} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Diet Plan Details <span className="text-red-500">*</span></label>
                        <textarea
                            required
                            value={formData.dietPlan}
                            onChange={(e) => setFormData(prev => ({ ...prev, dietPlan: e.target.value }))}
                            className="mt-1 min-h-32 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            placeholder="Breakfast, lunch, dinner, hydration notes..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Additional Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            placeholder="Preferences, cultural requirements..."
                            rows={3}
                        />
                    </div>
                </div>
            </Modal>

            {/* RECORD MEAL MODAL */}
            <Modal
                isOpen={recordMealModal.isOpen}
                onClose={() => setRecordMealModal({ isOpen: false, meal: '', status: 'CONSUMED', remarks: '' })}
                title={`Record ${recordMealModal.meal}`}
                confirmLabel="Save Record"
                onConfirm={handleRecordMealSubmit as any}
                confirmDisabled={createRecord.isPending}
            >
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Intake Status <span className="text-red-500">*</span></label>
                        <select
                            value={recordMealModal.status}
                            onChange={(e) => setRecordMealModal(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="CONSUMED">Consumed</option>
                            <option value="PARTIALLY_CONSUMED">Partially Consumed</option>
                            <option value="REFUSED">Refused</option>
                            <option value="NIL_BY_MOUTH">Nil by Mouth / Fasting</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Remarks</label>
                        <textarea
                            value={recordMealModal.remarks}
                            onChange={(e) => setRecordMealModal(prev => ({ ...prev, remarks: e.target.value }))}
                            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Patient feedback, alternative items given..."
                            rows={4}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
