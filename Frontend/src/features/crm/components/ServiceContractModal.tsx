import React, { useState, useEffect } from 'react';
import { FileText, Save, CheckCircle, ShieldAlert, X } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { useContract, useCreateContract, useUpdateContract, useActivateContract } from '../services/contract';
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
                            onClick={handleGenerate}
                            disabled={createContract.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                            {createContract.isPending ? 'Generating...' : 'Generate Service Contract'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Contract Number</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{contract.contractNumber}</p>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {contract.status}
                                </span>
                            </div>
                        </div>

                        {contract.status === 'ACTIVE' && (
                            <div className="bg-green-50 text-green-800 p-4 rounded-lg flex gap-3 text-sm border border-green-200">
                                <CheckCircle className="w-5 h-5 shrink-0" />
                                <div>
                                    <strong>Contract is Active and Locked.</strong><br/>
                                    Accepted by {contract.termsAcceptedBy?.firstName} {contract.termsAcceptedBy?.lastName} on {contract.termsAcceptedAt ? new Date(contract.termsAcceptedAt).toLocaleDateString() : ''}.
                                    Billing is now enabled.
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSaveDraft} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Start Date</label>
                                    <input 
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                        disabled={contract.status !== 'DRAFT'}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">End Date (Optional)</label>
                                    <input 
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                        disabled={contract.status !== 'DRAFT'}
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            
                            <h4 className="text-sm font-bold text-gray-700 border-b pb-2">Pricing & Billing</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Service Price</label>
                                    <input 
                                        type="number"
                                        value={formData.servicePrice}
                                        onChange={(e) => setFormData({...formData, servicePrice: e.target.value})}
                                        disabled={contract.status !== 'DRAFT'}
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Billing Cycle</label>
                                    <select
                                        value={formData.billingCycle}
                                        onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                                        disabled={contract.status !== 'DRAFT'}
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                                    >
                                        <option value="Daily">Daily</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Lumpsum">Lumpsum</option>
                                    </select>
                                </div>
                            </div>

                            <h4 className="text-sm font-bold text-gray-700 border-b pb-2">Scope of Work Snapshot</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Staff Required</label>
                                    <input 
                                        type="number"
                                        value={formData.staffRequired}
                                        onChange={(e) => setFormData({...formData, staffRequired: e.target.value})}
                                        disabled={contract.status !== 'DRAFT'}
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Shift</label>
                                    <input 
                                        type="text"
                                        value={formData.shift}
                                        onChange={(e) => setFormData({...formData, shift: e.target.value})}
                                        disabled={contract.status !== 'DRAFT'}
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Frequency</label>
                                    <input 
                                        type="text"
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                                        disabled={contract.status !== 'DRAFT'}
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Special Instructions</label>
                                    <input 
                                        type="text"
                                        value={formData.specialInstructions}
                                        onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                                        disabled={contract.status !== 'DRAFT'}
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {contract.status === 'DRAFT' && (
                                <div className="flex gap-4 justify-end pt-4 border-t">
                                    <button
                                        type="submit"
                                        disabled={updateContract.isPending}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {updateContract.isPending ? 'Saving...' : 'Save Draft'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleActivate}
                                        disabled={activateContract.isPending}
                                        className="px-4 py-2 bg-[#0F969C] hover:bg-[#0d858a] text-white rounded font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        {activateContract.isPending ? 'Activating...' : 'Activate Contract'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </Modal>
    );
}
