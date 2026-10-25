import type { NursingPatient } from '../types';
import { UserRound, Activity, Calendar } from 'lucide-react';

interface PatientCardProps {
    patient: NursingPatient;
    onViewDetails: (patient: NursingPatient) => void;
}

export function PatientCard({ patient, onViewDetails }: PatientCardProps) {
    const activeAdmission = patient.admissions?.[0]; // Assuming latest or active is first
    const careStatus = activeAdmission?.status || 'Admitted';
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <UserRound className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                            {patient.name}
                            {patient.elderId && <span className="ml-2 text-sm font-normal text-gray-500">({patient.elderId})</span>}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <span>{patient.patientGender || 'Unknown Gender'}</span>
                            <span>•</span>
                            <span>{patient.patientAge ? `${patient.patientAge} yrs` : 'Unknown Age'}</span>
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {careStatus}
                    </span>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <span>Medications: {patient.medications?.length || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Admitted: {activeAdmission?.admittedAt ? new Date(activeAdmission.admittedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>

            <div className="mt-5">
                <button
                    onClick={() => onViewDetails(patient)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    View Patient
                </button>
            </div>
        </div>
    );
}
