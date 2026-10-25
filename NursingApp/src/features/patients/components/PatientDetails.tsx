import type { NursingPatient } from '../types';
import { X, Activity, Pill, Coffee, FileText, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PatientDetailsProps {
    patient: NursingPatient | null;
    onClose: () => void;
}

export function PatientDetails({ patient, onClose }: PatientDetailsProps) {
    if (!patient) return null;

    const activeAdmission = patient.admissions?.[0];

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                <div className="relative w-screen max-w-md bg-white shadow-xl flex flex-col h-full overflow-y-auto">
                    <div className="px-4 py-6 sm:px-6 bg-blue-50 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900" id="slide-over-title">
                                {patient.name}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">ID: {patient.id}</p>
                        </div>
                        <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close panel</span>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Patient Information</h3>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-6 mb-8">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Age</dt>
                                <dd className="mt-1 text-sm text-gray-900">{patient.patientAge || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                                <dd className="mt-1 text-sm text-gray-900">{patient.patientGender || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Elder ID</dt>
                                <dd className="mt-1 text-sm text-gray-900">{patient.elderId || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {activeAdmission?.status || 'Admitted'}
                                    </span>
                                </dd>
                            </div>
                        </dl>

                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 mt-8">Nursing Workflows</h3>
                        <div className="space-y-3">
                            <Link
                                to={`/vitals?patientId=${patient.id}`}
                                className="flex items-center p-3 w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors group"
                            >
                                <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center group-hover:bg-rose-100">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900">Vitals & Monitoring</p>
                                    <p className="text-xs text-gray-500">Record BP, pulse, temp</p>
                                </div>
                            </Link>

                            <Link
                                to={`/medication?patientId=${patient.id}`}
                                className="flex items-center p-3 w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors group"
                            >
                                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-100">
                                    <Pill className="h-5 w-5" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900">Medications</p>
                                    <p className="text-xs text-gray-500">View & administer dosages</p>
                                </div>
                            </Link>

                            <Link
                                to={`/adl?patientId=${patient.id}`}
                                className="flex items-center p-3 w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors group"
                            >
                                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:bg-amber-100">
                                    <Coffee className="h-5 w-5" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900">Activities of Daily Living</p>
                                    <p className="text-xs text-gray-500">Hygiene, feeding, mobility</p>
                                </div>
                            </Link>

                            <Link
                                to={`/nutrition?patientId=${patient.id}`}
                                className="flex items-center p-3 w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors group"
                            >
                                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-100">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900">Nutrition & Diet</p>
                                    <p className="text-xs text-gray-500">Meal plans and intake</p>
                                </div>
                            </Link>

                            <Link
                                to={`/critical-patients?patientId=${patient.id}`}
                                className="flex items-center p-3 w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors group"
                            >
                                <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-100">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900">Clinical Summary</p>
                                    <p className="text-xs text-gray-500">Comprehensive overview</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
