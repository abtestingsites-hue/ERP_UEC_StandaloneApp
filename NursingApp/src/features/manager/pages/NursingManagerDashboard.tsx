import { useMemo } from 'react';
import { Users, Activity, UserPlus, CheckCircle, CalendarClock, AlertCircle } from 'lucide-react';
import { useMedicalStaff, useMedicalPatients } from '../hooks/useNursingManager';
import { useAssignments } from '../hooks/useAssignments';
import { PageHeader } from '../../../components/PageHeader';

const NursingManagerDashboard = () => {
    const { data: staff = [], isLoading: isLoadingStaff } = useMedicalStaff();
    const { data: patients = [], isLoading: isLoadingPatients } = useMedicalPatients();
    const { data: assignments = [], isLoading: isLoadingAssignments } = useAssignments();

    const summary = useMemo(() => {
        const activeAssignments = assignments.filter((item: any) => !['COMPLETED', 'CANCELLED'].includes(item.status));
        const assignedPatientIds = new Set(activeAssignments.map((item: any) => item.patientId).filter(Boolean));
        const unassignedPatients = patients.filter((patient: any) => !assignedPatientIds.has(patient.id));
        const criticalAssignments = assignments.filter((item: any) => item.priority === 'CRITICAL' && !['COMPLETED', 'CANCELLED'].includes(item.status));

        return {
            totalPatients: patients.length,
            totalStaff: staff.length,
            activeAssignments: activeAssignments.length,
            assignedPatients: assignedPatientIds.size,
            unassignedPatients: unassignedPatients.length,
            criticalAssignments: criticalAssignments.length
        };
    }, [staff, patients, assignments]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageHeader 
                title="Nursing Manager Dashboard" 
                subtitle="Overview of nursing operations, staff capacity, and patient assignments."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-6 flex items-center space-x-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-full text-blue-600 dark:text-blue-400">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-[#B8D9E8] font-medium">Total Patients</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{isLoadingPatients ? '-' : summary.totalPatients}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-6 flex items-center space-x-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full text-indigo-600 dark:text-indigo-400">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-[#B8D9E8] font-medium">Total Nursing Staff</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{isLoadingStaff ? '-' : summary.totalStaff}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-6 flex items-center space-x-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-full text-emerald-600 dark:text-emerald-400">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-[#B8D9E8] font-medium">Active Assignments</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{isLoadingAssignments ? '-' : summary.activeAssignments}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-6 flex items-center space-x-4">
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-full text-purple-600 dark:text-purple-400">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-[#B8D9E8] font-medium">Assigned Patients</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{isLoadingPatients || isLoadingAssignments ? '-' : summary.assignedPatients}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-6 flex items-center space-x-4">
                    <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-full text-amber-600 dark:text-amber-400">
                        <CalendarClock className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-[#B8D9E8] font-medium">Unassigned Patients</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{isLoadingPatients || isLoadingAssignments ? '-' : summary.unassignedPatients}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#072E33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#6DA5C0]/15 p-6 flex items-center space-x-4">
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-full text-red-600 dark:text-red-400">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-[#B8D9E8] font-medium">Critical Patients</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{isLoadingAssignments ? '-' : summary.criticalAssignments}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NursingManagerDashboard;
