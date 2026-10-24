import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { visitorService } from '../services';

import { PageHeader } from '../../../components/PageHeader';
import { useToast } from '../../../components/Toast';
import { VisitorPassCard } from '../components/VisitorPassCard';
import { VisitorMaterialEntry } from '../components/VisitorMaterialEntry';
import { VisitorSelfCheckInCard } from '../components/VisitorSelfCheckInCard';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { formatVisitorCategory } from '../../../lib/utils';

const isOtpRequired = import.meta.env.VITE_VISITOR_OTP_ENABLED !== 'false';

const CATEGORY_PURPOSES: Record<string, string[]> = {
    RESIDENT_FAMILY_RELATIVE: ['Family Visit', 'Care Discussion', 'Personal Matter', 'Document / Item Handover', 'Other'],
    RESIDENT_CAREGIVER_ATTENDANT: ['Resident Care', 'Personal Assistance', 'Daily Care Support', 'Accompaniment', 'Other'],
    OLD_AGE_CARE_ADMISSION_ENQUIRY: ['New Admission Enquiry', 'Facility Visit', 'Pricing / Service Enquiry', 'Documentation Enquiry', 'Counselling / Discussion', 'Other'],
    HEALTHCARE_PROFESSIONAL: ['Patient Consultation', 'Clinical Review', 'Medical Visit', 'Treatment / Procedure', 'Professional Meeting', 'Other'],
    MEDICAL_PHARMA_REPRESENTATIVE: ['Product Discussion', 'Medicine / Product Presentation', 'Doctor / Clinical Meeting', 'Sample / Information Submission', 'Other'],
    VENDOR_SUPPLIER: ['Material Delivery', 'Vendor Meeting', 'Service Discussion', 'Product Discussion', 'Payment / Documentation', 'Other'],
    CONTRACTOR_TEMPORARY_WORKER: ['Maintenance', 'Repair', 'Installation', 'Inspection', 'Construction / Project Work', 'Other'],
    OUTSOURCED_AGENCY_WORKER: ['Assigned Work', 'Service Delivery', 'Routine Duty', 'Replacement / Temporary Duty', 'Other'],
    DAILY_REGULAR_WORKER: ['Routine Work', 'Maintenance', 'Cleaning', 'Gardening', 'Support Service', 'Other'],
    STUDENT_INTERN_TRAINEE: ['Internship', 'Training', 'Academic Visit', 'Research', 'Observation', 'Other'],
    VOLUNTEER_NGO_COMMUNITY: ['Volunteering', 'Community Service', 'Resident Support', 'Donation / Community Activity', 'Awareness / Outreach', 'Other'],
    DELIVERY_COURIER: ['Parcel Delivery', 'Document Delivery', 'Medicine Delivery', 'Material Delivery', 'Food Delivery', 'Other'],
    TRANSPORT_DRIVER: ['Resident Transport', 'Patient Transport', 'Pickup / Drop-off', 'Material Transport', 'Official Transport', 'Other'],
    GOVERNMENT_OFFICIAL_INSPECTOR: ['Inspection', 'Official Visit', 'Verification', 'Government Service', 'Compliance Check', 'Other'],
    AUDITOR_CONSULTANT: ['Audit', 'Consultation', 'Assessment', 'Professional Meeting', 'Review', 'Other'],
    EVENT_INSTITUTIONAL_GUEST: ['Event', 'Institutional Visit', 'Meeting', 'Partnership Discussion', 'Official Function', 'Other'],
    OTHER: ['General Visit', 'Personal Matter', 'Other']
};

const MEDICAL_SPECIALIZATIONS = [
    'General Physician',
    'Cardiologist',
    'Neurologist',
    'Orthopedic Surgeon',
    'Physiotherapist',
    'Psychiatrist',
    'Dentist',
    'Nurse / Caregiver',
    'Pathologist',
    'Radiologist',
    'Other'
];

export function VisitorManagement() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Form State
    const [mobile, setMobile] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [whatsappSameAsMobile, setWhatsappSameAsMobile] = useState(true);
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [category, setCategory] = useState('OTHER');
    const [purpose, setPurpose] = useState('');
    const [customPurpose, setCustomPurpose] = useState('');
    const [hostName, setHostName] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [addressFlat, setAddressFlat] = useState('');
    const [addressBuilding, setAddressBuilding] = useState('');
    const [addressStreet, setAddressStreet] = useState('');
    const [addressLocality, setAddressLocality] = useState('');
    const [addressCity, setAddressCity] = useState('');
    const [addressState, setAddressState] = useState('');
    const [pincode, setPincode] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [customSpecialization, setCustomSpecialization] = useState('');

    const [hasMaterials, setHasMaterials] = useState(false);
    const [materialDetails, setMaterialDetails] = useState<string | null>(null);
    const [isMaterialsValid, setIsMaterialsValid] = useState(false);

    // UI State
    const [isCheckingProfile, setIsCheckingProfile] = useState(false);
    const [pass, setPass] = useState<any>(null);

    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpReference, setOtpReference] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [isRequestingOtp, setIsRequestingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    const createMutation = useMutation({
        mutationFn: visitorService.createPass,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['visitorPasses'] });
            setPass(data);
            toast({ title: 'Success', message: 'Visitor Pass Generated Successfully!', type: 'success' });
        },
        onError: (err: any) => {
            toast({ title: 'Error', message: err.response?.data?.error || err.message || 'Failed to create pass', type: 'error' });
        }
    });

    const handleMobileBlur = async () => {
        if (!mobile || mobile.length < 10) return;
        setIsCheckingProfile(true);
        try {
            const profile = await visitorService.getProfile(mobile);
            if (profile) {
                setName(profile.name || '');
                if (profile.category) setCategory(profile.category);
                if (profile.whatsapp) {
                    setWhatsapp(profile.whatsapp);
                    setWhatsappSameAsMobile(profile.whatsapp === mobile);
                }
                if (profile.dob) {
                    setDob(profile.dob);
                }
                setBloodGroup(profile.bloodGroup || '');
                setAddressFlat(profile.addressFlat || '');
                setAddressBuilding(profile.addressBuilding || '');
                setAddressStreet(profile.addressStreet || '');
                setAddressLocality(profile.addressLocality || '');
                setAddressCity(profile.addressCity || '');
                setAddressState(profile.addressState || '');
                setPincode(profile.pincode || '');
                
                if (profile.specialization) {
                    if (MEDICAL_SPECIALIZATIONS.includes(profile.specialization)) {
                        setSpecialization(profile.specialization);
                        setCustomSpecialization('');
                    } else {
                        setSpecialization('Other');
                        setCustomSpecialization(profile.specialization);
                    }
                } else {
                    setSpecialization('');
                    setCustomSpecialization('');
                }
                
                toast({ title: 'Autofilled', message: 'Returning visitor found. Details auto-filled.', type: 'info' });
            }
        } catch (err) {
            console.error('Profile fetch failed:', err);
        } finally {
            setIsCheckingProfile(false);
        }
    };

    const handleRequestOtp = async () => {
        if (!mobile || mobile.length < 10) {
            toast({ title: 'Error', message: 'Valid mobile number required to request OTP', type: 'error' });
            return;
        }
        setIsRequestingOtp(true);
        try {
            const data = await visitorService.requestOtp(mobile);
            if (data?.referenceId) {
                setOtpReference(data.referenceId);
                setOtpSent(true);
                toast({ title: 'OTP Sent', message: 'Please enter the OTP sent to the mobile number', type: 'success' });
            }
        } catch (err: any) {
            toast({ title: 'OTP Error', message: err.response?.data?.error || err.message, type: 'error' });
        } finally {
            setIsRequestingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpReference || !otpValue) return;
        setIsVerifyingOtp(true);
        try {
            await visitorService.verifyOtp(otpReference, otpValue);
            setOtpVerified(true);
            toast({ title: 'Verified', message: 'Mobile number verified successfully', type: 'success' });
        } catch (err: any) {
            toast({ title: 'Verification Failed', message: err.response?.data?.error || err.message, type: 'error' });
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isOtpRequired && !otpVerified) {
            toast({ title: 'Error', message: 'OTP verification is mandatory', type: 'error' });
            return;
        }

        if (hasMaterials && !isMaterialsValid) {
            return;
        }

        const finalPurpose = purpose === 'Other' ? customPurpose : purpose;

        createMutation.mutate({
            mobile,
            whatsapp: whatsappSameAsMobile ? mobile : whatsapp,
            dob: dob || undefined,
            name,
            category,
            purpose: finalPurpose,
            hostName,
            durationHours: '2',
            bloodGroup,
            addressFlat,
            addressBuilding,
            addressStreet,
            addressLocality,
            addressCity,
            addressState,
            pincode,
            specialization: category === 'HEALTHCARE_PROFESSIONAL' ? (specialization === 'Other' ? customSpecialization : specialization) : undefined,
            ...(hasMaterials && materialDetails ? { materialDetails } : {})
        });
    };

    const handleReset = () => {
        setMobile('');
        setWhatsapp('');
        setWhatsappSameAsMobile(true);
        setDob('');
        setName('');
        setCategory('OTHER');
        setPurpose('');
        setCustomPurpose('');
        setHostName('');
        setBloodGroup('');
        setAddressFlat('');
        setAddressBuilding('');
        setAddressStreet('');
        setAddressLocality('');
        setAddressCity('');
        setAddressState('');
        setPincode('');
        setSpecialization('');
        setCustomSpecialization('');
        setPass(null);
        setOtpSent(false);
        setOtpVerified(false);
        setOtpReference('');
        setOtpValue('');
        setHasMaterials(false);
        setMaterialDetails(null);
        setIsMaterialsValid(false);
    };

    return (
        <div className="flex min-h-full flex-col space-y-6 bg-transparent">
            <PageHeader
                title="Visitor Management"
                subtitle="Live visitor entry tracking, OTP verification, and pass generation."
                breadcrumbs={[{ label: 'Visitor Management' }, { label: 'Registration' }]}
                action={
                    <button
                        onClick={() => navigate('/visitor/dashboard')}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        View Dashboard
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {pass ? (
                        <VisitorPassCard pass={pass} onReset={handleReset} />
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* 1. VISITOR DETAILS */}
                            <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-bold text-indigo-800 uppercase tracking-wide border-b pb-2 border-indigo-50">1. Visitor Details</h2>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Mobile Number *</label>
                                        <div className="flex gap-2">
                                            <input
                                                required
                                                type="text"
                                                value={mobile}
                                                onChange={(e) => {
                                                    setMobile(e.target.value);
                                                    setOtpSent(false);
                                                    setOtpVerified(false);
                                                }}
                                                onBlur={handleMobileBlur}
                                                disabled={otpVerified}
                                                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500 font-bold disabled:opacity-50"
                                                placeholder="Enter 10 digit mobile number"
                                            />
                                        </div>
                                    </div>

                                    {/* OTP Flow UI */}
                                    <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-700">
                                                OTP Verification {isOtpRequired ? '*' : <span className="text-xs font-normal text-slate-500">(Optional)</span>}
                                            </span>
                                            {otpVerified ? (
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">Verified</span>
                                            ) : !isOtpRequired ? (
                                                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded border border-sky-200">Optional for testing</span>
                                            ) : (
                                                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">Required</span>
                                            )}
                                        </div>
                                        
                                        {!otpVerified && (
                                            <div className="flex gap-2 items-center flex-wrap">
                                                {!otpSent ? (
                                                    <button 
                                                        type="button" 
                                                        onClick={handleRequestOtp} 
                                                        disabled={isRequestingOtp || isCheckingProfile || mobile.length < 10}
                                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        {isRequestingOtp ? 'Sending...' : 'Request OTP'}
                                                    </button>
                                                ) : (
                                                    <>
                                                        <input 
                                                            type="text" 
                                                            value={otpValue} 
                                                            onChange={(e) => setOtpValue(e.target.value)} 
                                                            placeholder="Enter OTP"
                                                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={handleVerifyOtp} 
                                                            disabled={isVerifyingOtp || !otpValue}
                                                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={handleRequestOtp}
                                                            className="text-indigo-600 text-sm font-semibold hover:underline"
                                                        >
                                                            Resend
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-sm font-semibold text-slate-700">WhatsApp Number</label>
                                            <label className="flex items-center text-sm text-slate-600 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="mr-2 rounded text-indigo-600 focus:ring-indigo-500" 
                                                    checked={whatsappSameAsMobile}
                                                    onChange={(e) => setWhatsappSameAsMobile(e.target.checked)}
                                                />
                                                Same as Mobile Number
                                            </label>
                                        </div>
                                        {!whatsappSameAsMobile && (
                                            <input
                                                type="text"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500 font-bold"
                                                placeholder="e.g. +91 9876543210"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Visitor Name *</label>
                                        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Date of Birth</label>
                                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500 bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Category *</label>
                                        <select value={category} onChange={(e) => {
                                            setCategory(e.target.value);
                                            setPurpose('');
                                            setCustomPurpose('');
                                            setSpecialization('');
                                            setCustomSpecialization('');
                                        }} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500 bg-white">
                                            {Object.keys(CATEGORY_PURPOSES).map(cat => (
                                                <option key={cat} value={cat}>{formatVisitorCategory(cat)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Blood Group</label>
                                        <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500 bg-white">
                                            <option value="">Select Blood Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {category === 'HEALTHCARE_PROFESSIONAL' && (
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Specialization</label>
                                            <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500 bg-white mb-2">
                                                <option value="">Select Specialization</option>
                                                {MEDICAL_SPECIALIZATIONS.map(spec => (
                                                    <option key={spec} value={spec}>{spec}</option>
                                                ))}
                                            </select>
                                            {specialization === 'Other' && (
                                                <input type="text" value={customSpecialization} onChange={(e) => setCustomSpecialization(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="Please specify specialization..." />
                                            )}
                                        </div>
                                    )}
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Residential Address</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input type="text" value={addressFlat} onChange={(e) => setAddressFlat(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="Flat / Door No." />
                                            <input type="text" value={addressBuilding} onChange={(e) => setAddressBuilding(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="Building / Apartment" />
                                            <input type="text" value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="Street / Road" />
                                            <input type="text" value={addressLocality} onChange={(e) => setAddressLocality(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="Area / Locality" />
                                            <input type="text" value={addressCity} onChange={(e) => setAddressCity(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="City" />
                                            <div className="flex gap-4">
                                                <input type="text" value={addressState} onChange={(e) => setAddressState(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="State" />
                                                <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="Pincode" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 2. VISIT PURPOSE */}
                            <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-bold text-indigo-800 uppercase tracking-wide border-b pb-2 border-indigo-50">2. Visit Purpose</h2>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Purpose of Visit</label>
                                        <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500 bg-white">
                                            <option value="">Select Purpose</option>
                                            {(CATEGORY_PURPOSES[category] || CATEGORY_PURPOSES['OTHER']).map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        {purpose === 'Other' && (
                                            <input type="text" value={customPurpose} onChange={(e) => setCustomPurpose(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="Please specify..." />
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-col md:flex-row">
                                        <div className="flex-1">
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Elder / Resident Name</label>
                                            <input type="text" value={hostName} onChange={(e) => setHostName(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500" placeholder="Type name..." />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 3. MATERIALS */}
                            <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-bold text-indigo-800 uppercase tracking-wide border-b pb-2 border-indigo-50">3. Materials & Items</h2>
                                <div className="mb-4">
                                    <label className="mb-3 block text-sm font-semibold text-slate-700">Are you carrying any items/materials?</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="hasMaterials" 
                                                checked={!hasMaterials} 
                                                onChange={() => setHasMaterials(false)}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm font-bold text-slate-700">No</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="hasMaterials" 
                                                checked={hasMaterials} 
                                                onChange={() => setHasMaterials(true)}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm font-bold text-slate-700">Yes</span>
                                        </label>
                                    </div>
                                </div>

                                {hasMaterials && (
                                    <div className="mt-4 border-t border-slate-100 pt-4">
                                        <VisitorMaterialEntry 
                                            onChange={setMaterialDetails}
                                            onValidityChange={setIsMaterialsValid}
                                        />
                                        {hasMaterials && !isMaterialsValid && (
                                            <p className="mt-2 text-sm font-semibold text-rose-500">Please provide valid material details before submitting.</p>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* SUBMIT */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || (isOtpRequired && !otpVerified)}
                                    className="rounded-xl bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {createMutation.isPending ? 'Processing...' : 'Generate Visitor Pass'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <VisitorSelfCheckInCard />
                </div>
            </div>
        </div>
    );
}
