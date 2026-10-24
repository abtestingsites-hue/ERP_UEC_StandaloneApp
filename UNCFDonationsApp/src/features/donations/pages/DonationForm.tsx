import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDonation } from '../services/donationService';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';

export const DonationForm = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        // Donor Details
        category: 'General',
        purpose: '',
        name: '',
        fatherOrHusbandName: '',
        mobileCountryCode: '+91',
        mobile: '',
        whatsappCountryCode: '+91',
        whatsappNumber: '',
        residentialAddress: '',
        occasionName: '',
        occasionDate: '',
        panNumber: '',
        dob: '',
        email: '',

        // Payment Details
        paymentMode: 'CASH',
        materialCondition: 'Old',
        amount: '',
        amountInWords: '',
        materialDetails: '',
        transactionId: '',
        bankName: '',
        chequeDate: '',

        // References & Tax & Admin
        references: [
            { name: '', mobile: '' },
            { name: '', mobile: '' },
            { name: '', mobile: '' }
        ],
        taxDeduction: false,
        isCorporate: false,
        receivedBy: '',
        verifiedBy: '',

        // Extras
        recurringPlan: '',
        permanentAddress: '',
        occasionRelation: '',
        occasionMobile: '',
        occasionPartnerName: '',

        // Prayer / Visit
        preferredPrayerDate: '',
        honouredPersonImage: '',
        specialPrayerMessage: '',
        wishToVisitHome: false,
        preferredVisitDate: ''
    });

    const mutation = useMutation({
        mutationFn: createDonation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['uncf-donations'] });
            navigate('/donations');
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRefChange = (index: number, field: string, value: string) => {
        const newRefs = [...formData.references];
        newRefs[index] = { ...newRefs[index], [field]: value };
        setFormData((prev) => ({ ...prev, references: newRefs }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalMaterialDetails = formData.materialDetails;
        if (formData.paymentMode === 'UPI') {
            finalMaterialDetails = `UPI TXN: ${formData.transactionId}`;
        } else if (formData.paymentMode === 'CHEQUE') {
            finalMaterialDetails = `Cheque No: ${formData.transactionId} | Bank: ${formData.bankName} | Date: ${formData.chequeDate}`;
        } else if (formData.paymentMode === 'NET_BANKING') {
            finalMaterialDetails = `TXN: ${formData.transactionId} | Bank: ${formData.bankName}`;
        }

        let finalOccasionName = formData.occasionName;
        if ((formData.purpose === 'Anniversary' || formData.purpose === 'Wedding') && formData.occasionPartnerName) {
            finalOccasionName = `${formData.occasionName} & ${formData.occasionPartnerName}`;
        }

        mutation.mutate({
            ...formData,
            amount: Number(formData.amount || 0),
            materialDetails: finalMaterialDetails,
            occasionName: finalOccasionName,
            mobile: formData.mobile ? `${formData.mobileCountryCode} ${formData.mobile}` : '',
            whatsappNumber: formData.whatsappNumber ? `${formData.whatsappCountryCode} ${formData.whatsappNumber}` : ''
        });
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <PageHeader
                title="New Donation Receipt"
                subtitle="Enter donor contact details, payment mode, 80G tax claim, and generate official receipt."
                breadcrumbs={[{ label: 'Donations', href: '/donations' }, { label: 'New Receipt' }]}
                action={
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                        <ArrowLeft size={16} />
                        Back to Register
                    </button>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Purpose & Category */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 p-6 shadow-xs">
                    <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-[#0F969C] dark:text-[#0F969C] border-b border-slate-100 dark:border-white/10 pb-2">
                        1. Purpose & Occasion Details
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Donation Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            >
                                <option value="General" className="dark:bg-[#072E33]">General Support</option>
                                <option value="Elder Food Support" className="dark:bg-[#072E33]">Elder Food Support</option>
                                <option value="Medical Aid Drive" className="dark:bg-[#072E33]">Medical Aid Drive</option>
                                <option value="Community Care Camp" className="dark:bg-[#072E33]">Community Care Camp</option>
                                <option value="Emergency Relief Fund" className="dark:bg-[#072E33]">Emergency Relief Fund</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Occasion / Purpose</label>
                            <select
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            >
                                <option value="" className="dark:bg-[#072E33]">General Contribution</option>
                                <option value="Birthday" className="dark:bg-[#072E33]">Birthday</option>
                                <option value="Anniversary" className="dark:bg-[#072E33]">Anniversary</option>
                                <option value="Wedding" className="dark:bg-[#072E33]">Wedding</option>
                                <option value="Memorial" className="dark:bg-[#072E33]">In Memory Of</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Occasion Date</label>
                            <input
                                type="date"
                                name="occasionDate"
                                value={formData.occasionDate}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Donor Details */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 p-6 shadow-xs">
                    <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-[#0F969C] dark:text-[#0F969C] border-b border-slate-100 dark:border-white/10 pb-2">
                        2. Donor Details
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Donor Name *</label>
                            <input
                                type="text"
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Full Name or Organization Name"
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">S/o, D/o, W/o</label>
                            <input
                                type="text"
                                name="fatherOrHusbandName"
                                value={formData.fatherOrHusbandName}
                                onChange={handleChange}
                                placeholder="Father / Spouse Name"
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="donor@example.com"
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">PAN Number (for 80G Tax Exemption)</label>
                            <input
                                type="text"
                                name="panNumber"
                                value={formData.panNumber}
                                onChange={handleChange}
                                placeholder="ABCDE1234F"
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium uppercase text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    name="taxDeduction"
                                    checked={formData.taxDeduction}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-slate-300 text-[#0F969C] focus:ring-[#0F969C]"
                                />
                                Claim 80G Tax Exemption
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    name="isCorporate"
                                    checked={formData.isCorporate}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-slate-300 text-[#0F969C] focus:ring-[#0F969C]"
                                />
                                Corporate / CSR Donor
                            </label>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Residential Address</label>
                        <textarea
                            rows={2}
                            name="residentialAddress"
                            value={formData.residentialAddress}
                            onChange={handleChange}
                            placeholder="Full postal address"
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                        />
                    </div>
                </section>

                {/* 3. Payment Details */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 p-6 shadow-xs">
                    <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-[#0F969C] dark:text-[#0F969C] border-b border-slate-100 dark:border-white/10 pb-2">
                        3. Payment Details
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Payment Mode *</label>
                            <select
                                name="paymentMode"
                                value={formData.paymentMode}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            >
                                <option value="CASH" className="dark:bg-[#072E33]">Cash</option>
                                <option value="UPI" className="dark:bg-[#072E33]">UPI / GPay / PhonePe</option>
                                <option value="NET_BANKING" className="dark:bg-[#072E33]">Net Banking / NEFT</option>
                                <option value="CHEQUE" className="dark:bg-[#072E33]">Cheque</option>
                                <option value="MATERIALS" className="dark:bg-[#072E33]">In-Kind Material</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Donation Amount (₹) *</label>
                            <input
                                type="number"
                                required
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="e.g. 5000"
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-extrabold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            />
                        </div>

                        {formData.paymentMode !== 'CASH' && (
                            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2 bg-slate-50 dark:bg-white/5 p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction ID / Cheque No</label>
                                    <input
                                        type="text"
                                        name="transactionId"
                                        value={formData.transactionId}
                                        onChange={handleChange}
                                        placeholder="TXN Ref or Cheque Number"
                                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2 text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                                {formData.paymentMode === 'CHEQUE' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            name="bankName"
                                            value={formData.bankName}
                                            onChange={handleChange}
                                            placeholder="Bank Name"
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2 text-sm text-slate-900 dark:text-white"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. Special Notes & Prayer Requests */}
                <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 p-6 shadow-xs">
                    <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-[#0F969C] dark:text-[#0F969C] border-b border-slate-100 dark:border-white/10 pb-2">
                        4. Special Notes & Prayer Requests
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Special Prayer Message</label>
                            <textarea
                                rows={2}
                                name="specialPrayerMessage"
                                value={formData.specialPrayerMessage}
                                onChange={handleChange}
                                placeholder="Enter any prayer intention requested by the donor..."
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    name="wishToVisitHome"
                                    checked={formData.wishToVisitHome}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-slate-300 text-[#0F969C] focus:ring-[#0F969C]"
                                />
                                Donor wishes to visit the foundation home
                            </label>
                        </div>
                    </div>
                </section>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/donations')}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] hover:bg-[#0D8287] px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition-colors disabled:opacity-50"
                    >
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Generating Receipt...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                <span>Save & Issue Receipt</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
