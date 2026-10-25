import { useState, useMemo } from 'react';
import { usePatients } from '../hooks/usePatients';
import { PatientCard } from '../components/PatientCard';
import { PatientSearch } from '../components/PatientSearch';
import { PatientDetails } from '../components/PatientDetails';
import type { NursingPatient } from '../types';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Patients() {
    const { data: patients = [], isLoading, error, refetch } = usePatients();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<NursingPatient | null>(null);

    const filteredPatients = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return patients;
        
        return patients.filter((patient) => {
            return (
                patient.name.toLowerCase().includes(query) ||
                patient.id.toLowerCase().includes(query) ||
                (patient.elderId && patient.elderId.toLowerCase().includes(query))
            );
        });
    }, [patients, searchQuery]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load patients</h2>
                <p className="text-gray-500 max-w-md mb-6">
                    There was a problem connecting to the patient database. Please try again.
                </p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
                <p className="text-sm text-gray-500 mt-1">
                    View and manage patients available to Nursing Care
                </p>
            </div>

            <div className="mb-6">
                <PatientSearch value={searchQuery} onChange={setSearchQuery} />
            </div>

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading patients...</p>
                </div>
            ) : filteredPatients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPatients.map((patient) => (
                        <PatientCard
                            key={patient.id}
                            patient={patient}
                            onViewDetails={setSelectedPatient}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-400">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {searchQuery ? 'No matching patients' : 'No patients found'}
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                        {searchQuery 
                            ? `No patients match the search "${searchQuery}". Try a different name or ID.`
                            : "No patients are currently admitted to your Nursing unit."}
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-4 text-blue-600 font-medium hover:text-blue-700"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            )}

            {selectedPatient && (
                <PatientDetails 
                    patient={selectedPatient} 
                    onClose={() => setSelectedPatient(null)} 
                />
            )}
        </div>
    );
}
