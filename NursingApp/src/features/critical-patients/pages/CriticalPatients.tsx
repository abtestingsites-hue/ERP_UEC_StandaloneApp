import { useMemo, useState } from 'react';
import { AlertTriangle, HeartPulse, Activity } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { usePatients } from '../../patients/hooks/usePatients';
import { useNursingVitalsForPatients } from '../../vitals/hooks/useVitals';
import { formatDateTime, getVitalRisk, latestVitalForPatient, patientServiceLabel } from '../utils';
import { useNavigate } from 'react-router-dom';

export default function CriticalPatients() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const { data: patients = [], isLoading: patientsLoading } = usePatients();
    
    const patientIds = useMemo(() => patients.map(p => p.id), [patients]);
    const vitalsQueries = useNursingVitalsForPatients(patientIds);

    const vitals = useMemo(() => vitalsQueries.flatMap(q => q.data || []), [vitalsQueries]);
    const vitalsLoading = vitalsQueries.some(q => q.isLoading);

    const criticalPatients = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return patients
            .map((patient) => {
                const vital = latestVitalForPatient(patient.id, vitals);
                const risk = getVitalRisk(vital);
                return { patient, vital, risk };
            })
            .filter((item) => item.risk.level === 'critical')
            .filter((item) => !query || [
                item.patient.name,
                patientServiceLabel(item.patient),
                item.risk.reasons.join(' '),
                item.vital?.notes || ''
            ].some((value) => String(value).toLowerCase().includes(query)));
    }, [patients, searchQuery, vitals]);

    const patientsWithoutVitals = patients.filter((patient) => !latestVitalForPatient(patient.id, vitals)).length;
    const isLoading = patientsLoading || vitalsLoading;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Critical Patients"
                subtitle="Live critical list calculated from the latest recorded patient vitals."
                breadcrumbs={[{ label: 'Nursing Care' }, { label: 'Critical Patients' }]}
            />

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
                    <p className="text-3xl font-black text-rose-600">{criticalPatients.length}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-rose-500">Critical Now</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                    <p className="text-3xl font-black text-emerald-600">{patients.length}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-500">Patients Tracked</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                    <p className="text-3xl font-black text-amber-600">{patientsWithoutVitals}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-amber-500">Needs Vitals</p>
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800 shadow-sm flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                <p>A patient becomes critical when BP, pulse, temperature, or SpO2 crosses the configured safe range.</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 p-4">
                    <input
                        type="text"
                        placeholder="Search critical patient, reason, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                </div>

                <div className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-emerald-600">
                            <Activity className="h-10 w-10 animate-bounce text-emerald-400 mb-3" />
                            <p className="text-sm font-bold animate-pulse">Loading live vitals data...</p>
                        </div>
                    ) : criticalPatients.length === 0 ? (
                        <div className="py-16 text-center text-gray-500">
                            <HeartPulse className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p className="text-base font-bold text-gray-700">No critical patients from live vitals.</p>
                            <p className="text-sm text-gray-500 mt-1">Record vitals in the Vitals page to update this list.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Patient</th>
                                        <th className="px-6 py-4 font-bold">Critical Vitals</th>
                                        <th className="px-6 py-4 font-bold">Reason</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold">Recorded At</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {criticalPatients.map((item) => (
                                        <tr key={item.patient.id} className="hover:bg-rose-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-gray-900">{item.patient.name}</span>
                                                    <span className="text-xs font-semibold text-gray-500">PT-{item.patient.id.substring(0, 4).toUpperCase()} &middot; {patientServiceLabel(item.patient)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-semibold text-gray-600 space-y-1">
                                                    <p>BP: <span className={item.risk.reasons.some(r => r.includes('BP')) ? 'text-rose-600 font-bold' : ''}>{item.vital?.bp || '-'}</span> / Pulse: <span className={item.risk.reasons.some(r => r.includes('Pulse')) ? 'text-rose-600 font-bold' : ''}>{item.vital?.pulse || '-'}</span></p>
                                                    <p>Temp: <span className={item.risk.reasons.some(r => r.includes('Temp')) ? 'text-rose-600 font-bold' : ''}>{item.vital?.temp || '-'}</span> / SpO2: <span className={item.risk.reasons.some(r => r.includes('SpO2')) ? 'text-rose-600 font-bold' : ''}>{item.vital?.spO2 || '-'}</span></p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-rose-600">{item.risk.reasons.join(', ')}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                                                    CRITICAL
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                                                {formatDateTime(item.vital?.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/vitals?patientId=${item.patient.id}`)}
                                                    className="inline-flex items-center justify-center rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                >
                                                    View Vitals
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-xs font-semibold text-emerald-800 flex items-start gap-3">
                <HeartPulse className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <p>This page uses live data. It reads patients and vital signs directly from the ERP backend.</p>
            </div>
        </div>
    );
}
