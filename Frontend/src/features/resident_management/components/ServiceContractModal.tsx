import React, { useState, useEffect } from 'react';
import { FileText, Save, CheckCircle, ShieldAlert, X } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { useContract, useCreateContract, useUpdateContract, useActivateContract } from '../../crm/services/contract';
import type { AdmissionRecord } from '../../enquiry/types';

interface ServiceContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    admission: AdmissionRecord | null;
}

export function ServiceContractModal({ isOpen, onClose, admission }: ServiceContractModalProps) {
    const { data: contract, isLoading } = useContract(admission?.id);
    const createContract = useCreateContract();
    const updateContract = useUpdateContract();
    const activateContract = useActivateContract();
    
    const [formData, setFormData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        servicePrice: '',
        billingCycle: 'Monthly',
        staffRequired: '1',
        shift: 'Day',
        frequency: 'Daily',
        specialInstructions: ''
    });

    const [generateError, setGenerateError] = useState<string | null>(null);

    useEffect(() => {
        if (contract) {
            setFormData({
                startDate: contract.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                endDate: contract.endDate?.split('T')[0] || '',
                servicePrice: contract.servicePrice?.toString() || '',
                billingCycle: contract.billingCycle || 'Monthly',
                staffRequired: contract.staffRequired?.toString() || '1',
                shift: contract.shift || 'Day',
                frequency: contract.frequency || 'Daily',
                specialInstructions: contract.specialInstructions || ''
            });
        }
    }, [contract]);

    const handleGenerate = () => {
        if (!admission?.id) return;
        setGenerateError(null);
        createContract.mutate({
            admissionId: admission.id,
            startDate: new Date().toISOString()
        }, {
            onError: (err: any) => {
                const msg = err?.response?.data?.message || err?.message || 'Failed to generate contract.';
                setGenerateError(msg);
            }
        });
    };

    const handleSaveDraft = (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract) return;
        updateContract.mutate({
            id: contract.id,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            servicePrice: formData.servicePrice ? Number(formData.servicePrice) : null,
            billingCycle: formData.billingCycle,
            staffRequired: formData.staffRequired ? Number(formData.staffRequired) : null,
            shift: formData.shift,
            frequency: formData.frequency,
            specialInstructions: formData.specialInstructions
        });
    };

    const handleActivate = () => {
        if (!contract) return;
        if (!window.confirm('Are you sure you want to ACTIVATE this contract? Terms will be locked.')) return;
        activateContract.mutate(contract.id);
    };

    if (!isOpen || !admission) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Service Contract: ${admission.patientName || 'Patient'}`}>
            <div className="p-6">
                {isLoading ? (
                    <div className="text-center text-sm text-gray-500">Loading contract...</div>
                ) : !contract ? (
                    <div className="text-center py-8 space-y-4">
                        <FileText className="w-12 h-12 mx-auto text-gray-300" />
                        <h3 className="text-lg font-medium">No Contract Generated</h3>
                        <p className="text-sm text-gray-500">
                            A Service Contract has not been drafted for this admission yet.
                        </p>
                        {generateError && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2 max-w-sm mx-auto text-left">
                                <ShieldAlert className="w-5 h-5 shrink-0" />
                                <span>{generateError}</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={createContract.isPending}
                            className="inline-flex items-center gap-2 bg-[#0F969C] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0A7075] shadow-sm transition-all disabled:opacity-50"
                        >
                            {createContract.isPending ? 'Generating...' : 'Generate Service Contract'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSaveDraft} className="space-y-4">
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <div>
                                <span className="text-xs text-gray-500 block">Contract Ref</span>
                                <span className="font-bold text-sm">{contract.refNo}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block">Status</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${contract.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {contract.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                    disabled={contract.status === 'ACTIVE'}
                                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-black dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                    disabled={contract.status === 'ACTIVE'}
                                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-black dark:border-gray-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Service Price (₹)</label>
                                <input
                                    type="number"
                                    value={formData.servicePrice}
                                    onChange={(e) => setFormData(prev => ({ ...prev, servicePrice: e.target.value }))}
                                    disabled={contract.status === 'ACTIVE'}
                                    placeholder="e.g. 15000"
                                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-black dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Billing Cycle</label>
                                <select
                                    value={formData.billingCycle}
                                    onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                                    disabled={contract.status === 'ACTIVE'}
                                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-black dark:border-gray-700"
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="One-time">One-time</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Staff Req.</label>
                                <input
                                    type="number"
                                    value={formData.staffRequired}
                                    onChange={(e) => setFormData(prev => ({ ...prev, staffRequired: e.target.value }))}
                                    disabled={contract.status === 'ACTIVE'}
                                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-black dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Shift</label>
                                <select
                                    value={formData.shift}
                                    onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value }))}
                                    disabled={contract.status === 'ACTIVE'}
                                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-black dark:border-gray-700"
                                >
                                    <option value="Day">Day</option>
                                    <option value="Night">Night</option>
                                    <option value="24 Hours">24 Hours</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Frequency</label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                                    disabled={contract.status === 'ACTIVE'}
                                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-black dark:border-gray-700"
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Alternate Days">Alternate Days</option>
                                    <option value="Weekly">Weekly</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Special Instructions</label>
                            <textarea
                                value={formData.specialInstructions}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                                disabled={contract.status === 'ACTIVE'}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-black dark:border-gray-700"
                            />
                        </div>

                        {contract.status !== 'ACTIVE' && (
                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <button
                                    type="submit"
                                    disabled={updateContract.isPending}
                                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-black"
                                >
                                    <Save className="w-4 h-4" />
                                    {updateContract.isPending ? 'Saving...' : 'Save Draft'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleActivate}
                                    disabled={activateContract.isPending}
                                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {activateContract.isPending ? 'Activating...' : 'Activate Contract'}
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </Modal>
    );
}
