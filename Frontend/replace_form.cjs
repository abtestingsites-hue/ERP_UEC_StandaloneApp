const fs = require('fs');
let code = fs.readFileSync('d:/ERP/frontend/src/features/uncf_donations/pages/DonationForm.tsx', 'utf8');

const startIdx = code.indexOf('{/* 0. PLANNING TO DONATE */}');
const endIdx = code.indexOf('<div className="flex justify-end pt-4 pb-12">');

if (startIdx === -1 || endIdx === -1) {
  console.log('Failed to find indices');
  process.exit(1);
}

const replacement = `{/* 1. PURPOSE & OCCASION */}
                <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-emerald-800 uppercase tracking-wide border-b pb-2 border-emerald-50">1. Purpose & Occasion Details</h2>
                    
                    <div className="mb-6">
                        <label className="mb-3 block text-sm font-semibold text-slate-700">Occasion</label>
                        <div className="flex flex-wrap gap-3">
                            {['Birthday', 'Wedding', 'Anniversary', 'General'].map(purp => (
                                <label key={purp} className={\`cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors \${formData.purpose === purp ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}\`}>
                                    <input type="radio" name="purpose" value={purp} checked={formData.purpose === purp} onChange={handleChange} className="hidden" />
                                    {purp}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Person Honoured</label>
                            <input type="text" name="occasionName" value={formData.occasionName} onChange={handleChange} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500 bg-white" placeholder="e.g. Dheena" />
                        </div>
                        {(formData.purpose === 'Anniversary' || formData.purpose === 'Wedding') && (
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Partner Name</label>
                                <input type="text" name="occasionPartnerName" value={formData.occasionPartnerName} onChange={handleChange} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500 bg-white" />
                            </div>
                        )}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Relationship</label>
                            <input type="text" name="occasionRelation" value={formData.occasionRelation} onChange={handleChange} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500 bg-white" placeholder="e.g. Friend" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Occasion Date</label>
                            <input type="date" name="occasionDate" value={formData.occasionDate} onChange={handleChange} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500 bg-white" />
                        </div>
                        <div className={(formData.purpose === 'Anniversary' || formData.purpose === 'Wedding') ? 'md:col-span-4' : ''}>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile No (Occasion)</label>
                            <input type="text" name="occasionMobile" value={formData.occasionMobile} onChange={handleChange} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500 bg-white" />
                        </div>
                    </div>
                </section>

                {/* 2. SPONSORSHIP CATEGORY & PLANNING */}
                <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-emerald-800 uppercase tracking-wide border-b pb-2 border-emerald-50">2. Sponsorship Category</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="mb-3 block text-sm font-semibold text-slate-700">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {['Food', 'Medicines', 'Medical Camp', 'Essential Needs', 'Other'].map(cat => (
                                    <label key={cat} className={\`cursor-pointer rounded-lg border px-4 py-2 text-sm font-bold transition-colors \${formData.category === cat || (cat==='Food' && formData.category==='Meal Sponsorship') ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}\`}>
                                        <input type="radio" name="category" value={cat === 'Food' ? 'Meal Sponsorship' : cat} checked={formData.category === cat || (cat==='Food' && formData.category==='Meal Sponsorship')} onChange={handleChange} className="hidden" />
                                        {cat === 'Food' ? 'Meal Sponsorship' : cat}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="mb-3 block text-sm font-semibold text-slate-700">Planning to Donate</label>
                            <div className="flex flex-wrap gap-4 pt-2">
                                {['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'].map(plan => (
                                    <label key={plan} className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 hover:text-emerald-700 transition-colors">
                                        <input type="radio" name="recurringPlan" value={plan.toUpperCase().replace('-', '_')} checked={formData.recurringPlan === plan.toUpperCase().replace('-', '_')} onChange={handleChange} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                                        {plan}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. DONOR DETAILS */}
                <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-emerald-800 uppercase tracking-wide border-b pb-2 border-emerald-50">3. Donor Details</h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Donor Name *</label>
                            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Father / Husband Name</label>
                            <input type="text" name="fatherOrHusbandName" value={formData.fatherOrHusbandName} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" />
                        </div>
                        
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Donor Mobile No</label>
                            <div className="flex gap-2">
                                <select name="mobileCountryCode" value={formData.mobileCountryCode} onChange={handleChange} className="w-24 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500 bg-white">
                                    <option value="+91">🇮🇳 +91</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+971">🇦🇪 +971</option>
                                    <option value="+65">🇸🇬 +65</option>
                                    <option value="+61">🇦🇺 +61</option>
                                </select>
                                <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="flex-1 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">WhatsApp No</label>
                            <div className="flex gap-2">
                                <select name="whatsappCountryCode" value={formData.whatsappCountryCode} onChange={handleChange} className="w-24 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500 bg-white">
                                    <option value="+91">🇮🇳 +91</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+971">🇦🇪 +971</option>
                                    <option value="+65">🇸🇬 +65</option>
                                    <option value="+61">🇦🇺 +61</option>
                                </select>
                                <input type="text" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} className="flex-1 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">PAN Number</label>
                            <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">DOB</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Donor Address</label>
                            <textarea name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" rows={2} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Donor Mail ID</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500 h-[62px]" />
                        </div>
                    </div>
                </section>

                {/* 4. MODE OF DONATION & AMOUNT */}
                <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-emerald-800 uppercase tracking-wide border-b pb-2 border-emerald-50">4. Mode of Donation & Amount</h2>
                    
                    <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 p-4 bg-slate-50">
                        <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                            <input type="radio" name="paymentMode" value="CASH" checked={formData.paymentMode === 'CASH'} onChange={handleChange} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                            Cash
                        </label>
                        <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                            <input type="radio" name="paymentMode" value="UPI" checked={formData.paymentMode === 'UPI'} onChange={handleChange} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                            UPI
                        </label>
                        <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                            <input type="radio" name="paymentMode" value="NET_BANKING" checked={formData.paymentMode === 'NET_BANKING'} onChange={handleChange} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                            Net Banking
                        </label>
                        <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                            <input type="radio" name="paymentMode" value="CHEQUE" checked={formData.paymentMode === 'CHEQUE'} onChange={handleChange} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                            Cheque
                        </label>
                        <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer border-l border-slate-300 pl-6">
                            <input type="radio" name="paymentMode" value="MATERIALS" checked={formData.paymentMode === 'MATERIALS'} onChange={handleChange} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                            Materials
                        </label>
                        
                        {formData.paymentMode === 'MATERIALS' && (
                            <div className="flex items-center gap-4 ml-4 px-4 py-1.5 bg-emerald-100/50 rounded-lg border border-emerald-200">
                                <label className="flex items-center gap-2 font-bold text-emerald-800 cursor-pointer text-sm">
                                    <input type="radio" name="materialCondition" value="Old" checked={formData.materialCondition === 'Old'} onChange={handleChange} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                                    Old
                                </label>
                                <label className="flex items-center gap-2 font-bold text-emerald-800 cursor-pointer text-sm">
                                    <input type="radio" name="materialCondition" value="New" checked={formData.materialCondition === 'New'} onChange={handleChange} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                                    New
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {formData.paymentMode !== 'MATERIALS' && (
                            <>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Donation Amount (₹) *</label>
                                    <input required type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full rounded-xl border border-emerald-300 p-2.5 outline-none focus:border-emerald-600 text-lg font-bold bg-emerald-50/30 text-emerald-900" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Rupees in Words</label>
                                    <input type="text" name="amountInWords" value={formData.amountInWords} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500 font-medium" />
                                </div>
                            </>
                        )}
                        {['UPI', 'CHEQUE', 'NET_BANKING'].includes(formData.paymentMode) && (
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                                {['UPI', 'CHEQUE', 'NET_BANKING'].includes(formData.paymentMode) && (
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-emerald-800">{formData.paymentMode === 'CHEQUE' ? 'Cheque Number' : 'Transaction ID / UTR'} *</label>
                                        <input required type="text" name="transactionId" value={formData.transactionId} onChange={handleChange} className="w-full rounded-lg border border-emerald-200 p-2 outline-none focus:border-emerald-500 bg-white" />
                                    </div>
                                )}
                                {['CHEQUE', 'NET_BANKING'].includes(formData.paymentMode) && (
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-emerald-800">Bank Name *</label>
                                        <input required type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full rounded-lg border border-emerald-200 p-2 outline-none focus:border-emerald-500 bg-white" />
                                    </div>
                                )}
                                {formData.paymentMode === 'CHEQUE' && (
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-emerald-800">Cheque Date *</label>
                                        <input required type="date" name="chequeDate" value={formData.chequeDate} onChange={handleChange} className="w-full rounded-lg border border-emerald-200 p-2 outline-none focus:border-emerald-500 bg-white" />
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {formData.paymentMode === 'MATERIALS' && (
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Material Details</label>
                                <textarea required name="materialDetails" value={formData.materialDetails} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" rows={2} placeholder="e.g. Gold, Silver, Books, Clothes" />
                            </div>
                        )}
                    </div>
                </section>

                {/* 5. REFERENCES & ADMIN */}
                <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-emerald-800 uppercase tracking-wide border-b pb-2 border-emerald-50">5. References & Admin</h2>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 border-b border-slate-100 pb-6 mb-6">
                        <div>
                            <label className="mb-3 block text-sm font-bold text-slate-700">80G Tax Receipt Required?</label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                                    <input type="radio" name="taxDeductionRadio" checked={formData.taxDeduction === true} onChange={() => setFormData(prev => ({ ...prev, taxDeduction: true }))} className="h-5 w-5 text-emerald-600 focus:ring-emerald-500" />
                                    Yes
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                                    <input type="radio" name="taxDeductionRadio" checked={formData.taxDeduction === false} onChange={() => setFormData(prev => ({ ...prev, taxDeduction: false }))} className="h-5 w-5 text-emerald-600 focus:ring-emerald-500" />
                                    No
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="mb-3 block text-sm font-bold text-slate-700">Corporate Donation?</label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                                    <input type="radio" name="isCorporate" checked={formData.isCorporate === true} onChange={() => setFormData(prev => ({ ...prev, isCorporate: true }))} className="h-5 w-5 text-emerald-600 focus:ring-emerald-500" />
                                    Yes
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                                    <input type="radio" name="isCorporate" checked={formData.isCorporate === false} onChange={() => setFormData(prev => ({ ...prev, isCorporate: false }))} className="h-5 w-5 text-emerald-600 focus:ring-emerald-500" />
                                    No
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">References (Name & Mobile No)</label>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {formData.references.map((ref, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <span className="flex items-center font-bold text-slate-400">{idx + 1}.</span>
                                    <div className="flex-1 space-y-2">
                                        <input type="text" placeholder="Name" value={ref.name} onChange={(e) => handleRefChange(idx, 'name', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-emerald-500 bg-slate-50" />
                                        <input type="text" placeholder="Mobile" value={ref.mobile} onChange={(e) => handleRefChange(idx, 'mobile', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-emerald-500 bg-slate-50" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Received By</label>
                            <input type="text" name="receivedBy" value={formData.receivedBy} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" placeholder="Your Name" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Verified By</label>
                            <input type="text" name="verifiedBy" value={formData.verifiedBy} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-emerald-500" placeholder="Manager Name" />
                        </div>
                    </div>
                </section>
`;

code = code.substring(0, startIdx) + replacement + '\n                ' + code.substring(endIdx);
fs.writeFileSync('d:/ERP/frontend/src/features/uncf_donations/pages/DonationForm.tsx', code);
console.log('Form replaced successfully!');
