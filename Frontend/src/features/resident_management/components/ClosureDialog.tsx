// @ts-nocheck
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import { api } from '../../../lib/axios';
import html2pdf from 'html2pdf.js';

export function ClosureDialog({ admission, isOpen, onClose }) {
    const queryClient = useQueryClient();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: closureData, isLoading, isError, error: queryError } = useQuery({
        queryKey: ['closure', admission?.id],
        queryFn: async () => {
            const res = await api.post(`/closing-agreements/admission/${admission.id}`);
            return res.data?.data;
        },
        enabled: isOpen && !!admission,
    });

    const clearanceMutation = useMutation({
        mutationFn: async ({ id, type, notes }) => {
            await api.patch(`/closing-agreements/${id}/clearance`, { type, notes });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['closure', admission?.id] });
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Unable to complete clearance. Please try again.');
        }
    });

    const executeMutation = useMutation({
        mutationFn: async ({ id, closingRemarks }) => {
            await api.post(`/closing-agreements/${id}/execute`, { closingRemarks });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['closure', admission?.id] });
            queryClient.invalidateQueries({ queryKey: ['admissions'] });
            onClose();
        }
    });

    if (!isOpen) return null;

    const handleClearance = (type) => {
        if (!closureData) return;
        setError(null);
        
        if (type === 'FINANCE' && closureData.outstandingBalance > 0) {
            setError(`Finance clearance cannot be completed. Outstanding balance: Rs. ${closureData.outstandingBalance.toFixed(2)}`);
            return;
        }

        clearanceMutation.mutate({ id: closureData.id, type, notes: 'Cleared via UI' });
    };

    const handleExecute = async () => {
        if (!closureData || closureData.status !== 'READY') return;
        
        setIsGenerating(true);
        try {
            const element = document.getElementById('closure-pdf-content');
            const pdfBlob = await html2pdf().from(element).outputPdf('blob');
            
            await executeMutation.mutateAsync({ id: closureData.id, closingRemarks: 'Closure executed and PDF generated.' });
            
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Closure_Agreement_${admission.patient?.name}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#0A2429]">
                <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Service Closing Agreement</h3>
                        <p className="mt-1 text-sm text-gray-500">Patient: {admission?.patient?.name}</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <div className="flex items-center gap-2 font-semibold">
                            <AlertCircle className="h-4 w-4" />
                            Clearance Error
                        </div>
                        <p className="mt-1 text-xs">{error}</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="py-12 text-center text-sm text-gray-500">Loading closure agreement data...</div>
                ) : isError ? (
                    <div className="py-12 text-center text-sm text-red-500">
                        Failed to load closure agreement: {queryError?.response?.data?.message || queryError?.message}
                    </div>
                ) : closureData ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                            <div>
                                <span className="text-xs font-semibold uppercase text-gray-400">Agreement Status</span>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="font-bold text-gray-900 dark:text-white">{closureData.status}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold uppercase text-gray-400">Outstanding Balance</span>
                                <div className={`mt-1 font-bold ${closureData.outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    Rs. {closureData.outstandingBalance?.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Checklist Section */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Clearance Checklist</h4>
                            
                            {/* Medical Clearance */}
                            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Medical Clearance</p>
                                    <p className="text-xs text-gray-500">Verify medical notes, prescriptions & discharge summary</p>
                                </div>
                                {closureData.medicalCleared ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                        <CheckCircle className="h-4 w-4" /> Cleared
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleClearance('MEDICAL')}
                                        disabled={clearanceMutation.isPending}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        Clear Medical
                                    </button>
                                )}
                            </div>

                            {/* Finance Clearance */}
                            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Finance Clearance</p>
                                    <p className="text-xs text-gray-500">Verify zero outstanding balance on daily cost ledger</p>
                                </div>
                                {closureData.financeCleared ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                        <CheckCircle className="h-4 w-4" /> Cleared
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleClearance('FINANCE')}
                                        disabled={clearanceMutation.isPending || closureData.outstandingBalance > 0}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        Clear Finance
                                    </button>
                                )}
                            </div>

                            {/* Asset Clearance */}
                            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Asset Clearance</p>
                                    <p className="text-xs text-gray-500">Verify return of facility assets & equipment</p>
                                </div>
                                {closureData.assetCleared ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                        <CheckCircle className="h-4 w-4" /> Cleared
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleClearance('ASSET')}
                                        disabled={clearanceMutation.isPending}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        Clear Asset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Hidden PDF template container for rendering */}
                        <div className="hidden">
                            <div id="closure-pdf-content" className="p-8 font-sans">
                                <h1 className="text-2xl font-bold">SERVICE CLOSING AGREEMENT</h1>
                                <p className="mt-2 text-sm text-gray-600">Patient: {admission?.patient?.name}</p>
                                <p className="text-sm text-gray-600">Admission ID: {admission?.id}</p>
                                <p className="text-sm text-gray-600">Admitted At: {new Date(admission?.admittedAt).toLocaleDateString()}</p>
                                <hr className="my-4" />
                                <h2 className="text-lg font-semibold">Clearance Confirmation</h2>
                                <p className="mt-2 text-xs">Medical Clearance: {closureData.medicalCleared ? 'YES' : 'NO'}</p>
                                <p className="text-xs">Finance Clearance: {closureData.financeCleared ? 'YES' : 'NO'}</p>
                                <p className="text-xs">Asset Clearance: {closureData.assetCleared ? 'YES' : 'NO'}</p>
                                <p className="mt-4 text-xs">Final Remarks: Closure executed and resident discharged.</p>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                            <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
                                Cancel
                            </button>
                            <button
                                onClick={handleExecute}
                                disabled={closureData.status !== 'READY' || isGenerating || executeMutation.isPending}
                                className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                            >
                                <Download className="h-4 w-4" />
                                {isGenerating || executeMutation.isPending ? 'Executing Closure...' : 'Execute & Discharge Resident'}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
