import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { api } from '../../../lib/axios';
import { PatientSelector } from '../../../components/PatientSelector';
import { MasterDataSelector } from '../../../components/MasterDataSelector';
import { Select } from '../../../components/Select';

export default function Admission() {
    const [formData, setFormData] = useState({
        patientId: '',
        admissionPriority: '',
        healthCondition: '',
        clinicalStatus: '',
        unitId: '',
        floor: '',
        room: '',
        bed: ''
    });

    const [consentData, setConsentData] = useState({
        signedByName: '',
        signerRelation: 'GUARDIAN',
        consentType: 'ADMISSION',
        version: '1.0',
        acknowledged: false
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'unitId') { next.floor = ''; next.room = ''; next.bed = ''; }
            if (field === 'floor') { next.room = ''; next.bed = ''; }
            if (field === 'room') { next.bed = ''; }
            return next;
        });
        setError('');
        setSuccess(false);
    };

    const handleConsentChange = (field: string, value: any) => {
        setConsentData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.patientId) {
            setError('Please select a patient to admit');
            return;
        }
        if (!formData.unitId) {
            setError('Please select a Care Facility / Unit');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const consent = consentData.acknowledged ? {
                acknowledged: true,
                signedByName: consentData.signedByName.trim(),
                signerRelation: consentData.signerRelation,
                consentType: consentData.consentType,
                version: consentData.version,
                title: 'Resident Admission Consent & Care Agreement',
                content: 'Resident and guardian acknowledge admission guidelines, medical emergency authorization, and facility terms of service.'
            } : undefined;

            await api.post('/operations/admissions', { ...formData, consent });
            
            setSuccess(true);
            setFormData({
                patientId: '', admissionPriority: '', healthCondition: '', clinicalStatus: '',
                unitId: '', floor: '', room: '', bed: ''
            });
            setConsentData({
                signedByName: '',
                signerRelation: 'GUARDIAN',
                consentType: 'ADMISSION',
                version: '1.0',
                acknowledged: false
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to complete admission');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50/50 p-6 dark:bg-[#0A2429]">
            <PageHeader
                title="Resident Admission & Room Allocation"
                subtitle="Process resident admission, assign priority, and allocate room & bed"
                breadcrumbs={[{ label: 'Resident Management' }, { label: 'Patient Admission' }]}
            />

            <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-4xl space-y-6">
                {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
                
                {success && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium flex-1">Admission completed successfully!</p>
                        <button onClick={() => setSuccess(false)} className="font-bold text-emerald-500 hover:text-emerald-700">X</button>
                    </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30]">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-[#8FB7C8]">
                        Patient Selection
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <PatientSelector
                                value={formData.patientId}
                                onChange={(id) => handleChange('patientId', id)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30]">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-[#8FB7C8]">
                        Clinical & Priority Details
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Select
                            label="Admission Priority"
                            value={formData.admissionPriority}
                            onChange={(e) => handleChange('admissionPriority', e.target.value)}
                            options={[
                                { value: 'HIGH', label: 'High Priority' },
                                { value: 'MEDIUM', label: 'Medium Priority' },
                                { value: 'LOW', label: 'Low Priority' }
                            ]}
                            placeholder="Select priority"
                        />

                        <Select
                            label="Clinical Status"
                            value={formData.clinicalStatus}
                            onChange={(e) => handleChange('clinicalStatus', e.target.value)}
                            options={[
                                { value: 'STABLE', label: 'Stable' },
                                { value: 'CRITICAL', label: 'Critical' },
                                { value: 'OBSERVATION', label: 'Under Observation' }
                            ]}
                            placeholder="Select status"
                        />

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Primary Health Condition / Reason</label>
                            <textarea
                                value={formData.healthCondition}
                                onChange={(e) => handleChange('healthCondition', e.target.value)}
                                rows={2}
                                placeholder="Summary of health condition or care requirements..."
                                className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#0F969C] dark:border-gray-700 dark:bg-black dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30]">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-[#8FB7C8]">
                        Room & Bed Allocation
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <MasterDataSelector
                            type="units"
                            label="Care Facility / Unit"
                            value={formData.unitId}
                            onChange={(id) => handleChange('unitId', id)}
                            required
                        />
                        <MasterDataSelector
                            type="floors"
                            label="Floor"
                            parentId={formData.unitId}
                            value={formData.floor}
                            onChange={(id) => handleChange('floor', id)}
                        />
                        <MasterDataSelector
                            type="rooms"
                            label="Room"
                            parentId={formData.floor}
                            value={formData.room}
                            onChange={(id) => handleChange('room', id)}
                        />
                        <MasterDataSelector
                            type="beds"
                            label="Bed"
                            parentId={formData.room}
                            value={formData.bed}
                            onChange={(id) => handleChange('bed', id)}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30]">
                    <div className="mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#0F969C]" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-[#8FB7C8]">
                            Resident & Guardian Consent Acknowledgement
                        </h3>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Signer Full Name</label>
                            <input
                                type="text"
                                value={consentData.signedByName}
                                onChange={(e) => handleConsentChange('signedByName', e.target.value)}
                                placeholder="Enter name of person signing consent"
                                className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#0F969C] dark:border-gray-700 dark:bg-black dark:text-white"
                            />
                        </div>

                        <Select
                            label="Signer Relation"
                            value={consentData.signerRelation}
                            onChange={(e) => handleConsentChange('signerRelation', e.target.value)}
                            options={[
                                { value: 'SELF', label: 'Resident (Self)' },
                                { value: 'GUARDIAN', label: 'Legal Guardian' },
                                { value: 'FAMILY', label: 'Family Member' },
                                { value: 'OTHER', label: 'Other Authorized Representative' }
                            ]}
                        />

                        <div className="md:col-span-2">
                            <label className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 cursor-pointer dark:border-gray-700/50 dark:bg-gray-800/40">
                                <input
                                    type="checkbox"
                                    checked={consentData.acknowledged}
                                    onChange={(e) => handleConsentChange('acknowledged', e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#0F969C] focus:ring-[#0F969C]"
                                />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    I hereby confirm that the resident / guardian has read, understood, and signed the resident admission guidelines, care agreement v1.0, and medical emergency authorizations.
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#0F969C] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0A7075] disabled:opacity-50">
                        {loading ? 'Processing Admission...' : 'Admit Patient'}
                    </button>
                </div>
            </form>
        </div>
    );
}

