// @ts-nocheck
import { useEffect, useState } from 'react';
import { Activity, Pill, Utensils, ReceiptText, AlertCircle } from 'lucide-react';
import { PatientPortalService } from '../services';
import type { VitalSign, Medication, Nutrition, Invoice } from '../types';

const PatientDashboard = () => {
    const [vitals, setVitals] = useState<VitalSign[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [nutritions, setNutritions] = useState<Nutrition[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardData, billingData] = await Promise.all([
                    PatientPortalService.getDashboard(),
                    PatientPortalService.getBilling()
                ]);
                setVitals(dashboardData.vitals);
                setMedications(dashboardData.medications);
                setNutritions(dashboardData.nutritions);
                setInvoices(billingData.invoices);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Vitals Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <Activity className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-slate-500">Latest Vitals</h2>
                            <p className="text-lg font-semibold text-slate-900">
                                {vitals.length > 0 ? `${vitals[0].bloodPressure} mmHg` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Medications Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Pill className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-slate-500">Active Meds</h2>
                            <p className="text-lg font-semibold text-slate-900">
                                {medications.length} Prescribed
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nutrition Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <Utensils className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-slate-500">Diet Plan</h2>
                            <p className="text-lg font-semibold text-slate-900">
                                {nutritions.length > 0 ? nutritions[0].mealType : 'Not Set'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Billing Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 bg-amber-50 rounded-lg">
                            <ReceiptText className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-slate-500">Pending Bills</h2>
                            <p className="text-lg font-semibold text-slate-900">
                                {invoices.filter(i => i.status !== 'PAID').length} Invoices
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detailed Sections */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center">
                        <Pill className="h-5 w-5 text-slate-500 mr-2" />
                        <h3 className="text-lg font-medium text-slate-900">Medication Schedule</h3>
                    </div>
                    <div className="p-6">
                        {medications.length === 0 ? (
                            <p className="text-slate-500 italic text-sm">No active medications.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {medications.map(med => (
                                    <li key={med.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-slate-800">{med.name}</p>
                                            <p className="text-sm text-slate-500">Dosage: {med.dosage}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center">
                        <ReceiptText className="h-5 w-5 text-slate-500 mr-2" />
                        <h3 className="text-lg font-medium text-slate-900">Recent Invoices</h3>
                    </div>
                    <div className="p-6">
                        {invoices.length === 0 ? (
                            <p className="text-slate-500 italic text-sm">No recent invoices.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {invoices.map(inv => (
                                    <li key={inv.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-slate-800">Invoice {inv.invoiceNo}</p>
                                            <p className="text-sm text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-slate-800">${inv.amount.toFixed(2)}</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;


