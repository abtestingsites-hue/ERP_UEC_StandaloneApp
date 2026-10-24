// @ts-nocheck
import React, { useState } from 'react';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { api } from '../../../lib/axios';
import { MasterDataSelector } from '../../../components/MasterDataSelector';
import { Select } from '../../../components/Select';
import { Input } from '../../../components/Input';
import { useToast } from '../../../components/Toast';

export default function PatientRegistration() {
    const [formData, setFormData] = useState({
        name: '', dob: '', age: '', gender: '', bloodGroup: '',
        primaryContact: '', emergencyContact: '', email: '', phone: '', address: '', unitId: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name) {
            setError('Patient name is required');
            return;
        }
        if (!formData.unitId) {
            setError('Care Facility / Unit is required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            await api.post('/operations/patients', formData);
            
            toast({ type: 'success', title: 'Success', message: 'Patient registered successfully!' });
            setFormData({
                name: '', dob: '', age: '', gender: '', bloodGroup: '',
                primaryContact: '', emergencyContact: '', email: '', phone: '', address: '', unitId: formData.unitId
            });
            
            // Navigate to Admission page to allocate room and bed
            navigate('/healthcare/admission');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50/50 p-6 dark:bg-[#0A2429]">
            <PageHeader
                title="Patient / Resident Registration"
                subtitle="Register a new resident master profile in the system"
                icon={<UserPlus className="h-6 w-6 text-[#0F969C]" />}
            />

            <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-4xl space-y-6">
                {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30]">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-[#8FB7C8]">
                        Demographics
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Input label="Full Name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required placeholder="e.g. Jane Doe" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Date of Birth" type="date" value={formData.dob} onChange={(e) => handleChange('dob', e.target.value)} />
                            <Input label="Age" type="number" value={formData.age} onChange={(e) => handleChange('age', e.target.value)} placeholder="e.g. 75" />
                        </div>
                        <Select label="Gender" value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} placeholder="Select gender" />
                        <Select label="Blood Group" value={formData.bloodGroup} onChange={(e) => handleChange('bloodGroup', e.target.value)} options={[{ value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }]} placeholder="Select blood group" />
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30]">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-[#8FB7C8]">
                        Contact Information
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Input label="Phone Number" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="e.g. +1 234 567 8900" />
                        <Input label="Email Address" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="e.g. jane@example.com" />
                        <Input label="Primary Contact (Name/Relation)" value={formData.primaryContact} onChange={(e) => handleChange('primaryContact', e.target.value)} placeholder="e.g. John Doe (Son)" />
                        <Input label="Emergency Contact" value={formData.emergencyContact} onChange={(e) => handleChange('emergencyContact', e.target.value)} placeholder="e.g. +1 987 654 3210" />
                        <div className="md:col-span-2">
                            <Input label="Address" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Full residential address" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30]">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-[#8FB7C8]">
                        Facility Allocation
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <MasterDataSelector type="units" value={formData.unitId} onChange={(id) => handleChange('unitId', id)} required />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#0F969C] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0A7075] hover:shadow focus:outline-none focus:ring-2 focus:ring-[#0F969C]/50 disabled:opacity-50">
                        {loading ? 'Saving...' : 'Register Patient'}
                    </button>
                </div>
            </form>
        </div>
    );
}
