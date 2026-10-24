const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/features/patient_billing/pages/PatientManualBilling.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// We will do string replacements to safely restructure the file.

// 1. STATE REPLACEMENT
const oldStateStart = `    // Core Elder Care Fields`;
const oldStateEnd = `    // Calculators`;
const newState = `    // --- NEW ELDER CARE STATE ---
    const initField = (price?: any) => ({ price: String(price || ''), subsidy: '' });
    
    // A. Accommodation
    const [accommodation, setAccommodation] = useState({
        monthlyBedCharge: initField(''), roomSharing: '', laundry: initField('1800'), eb: initField('700'), gas: initField('1000'), tv: initField(''), cleaning: initField(''), windingUp: initField(''), breakage: initField('')
    })

    // B. Nursing & Care Services
    const [careServices, setCareServices] = useState<{ id: number; role: string; shift: string; type: string; price: string; subsidy: string }>([
        { id: 1, role: 'Care Giver', shift: 'Day', type: 'Inside', price: '', subsidy: '' }
    ])
    const [nursingFixed, setNursingFixed] = useState({
        specialCare: initField(''), alzheimersCare: initField(''), dressing: initField(''), firstAid: initField('')
    })

    // C. Therapy
    const [therapy, setTherapy] = useState({
        doctorVisit: initField('500'), physiotherapy: initField(''), occupational: initField(''), speech: initField(''), geriatricCounseling: initField(''), psychiatricCounseling: initField(''), yoga: initField('')
    })

    // D. Medical Support
    const [medicalSupport, setMedicalSupport] = useState({
        labTest: initField(''), medicine: initField(''), icuAtHome: initField(''), surgicalEquipment: initField(''), ambulance: initField(''), transport: initField('')
    })

    // E. Food & Nutrition
    const [food, setFood] = useState({
        milk: initField('500'), juice: initField(''), snacks: initField('300'), herbalDrinks: initField('200')
    })

    // F. Linen & Personal Care
    const [personalCare, setPersonalCare] = useState({
        newDress: initField(''), towel: initField(''), bedsheets: initField(''), bedspread: initField(''), blanket: initField(''), pillowCover: initField(''), airbed: initField(''), stitching: initField(''), beauty: initField('600')
    })

    // G. Medical Consumables
    const [consumables, setConsumables] = useState({
        diapers: { qty: '', rate: '70', disposal: '', subsidy: '' },
        gloves: { qty: '', rate: '75', disposal: '', subsidy: '' },
        mask: { qty: '', rate: '4', disposal: '', subsidy: '' },
        underpad: { qty: '', rate: '60', disposal: '', subsidy: '' },
        bedWipes: { qty: '', rate: '', disposal: '', subsidy: '' },
        rubbersheet: { qty: '', rate: '700', disposal: '', subsidy: '' },
        catheter: initField(''), uroBag: initField(''), oxygen: initField(''), nebulizer: initField('')
    })

    // H. Monthly Essentials
    const [monthlyEssentials, setMonthlyEssentials] = useState(initField(''))

    // Common Totals & Additions
    const [balances, setBalances] = useState({ amount: initField('') })
    const [additionalCharges, setAdditionalCharges] = useState({
        previousPendingPayable: initField(''),
        upcomingBedCharge: { include: 'NO', amount: initField('') }
    })
    const [totals, setTotals] = useState({
        lateFee: '', lateMaterialFee: '', uncfSubsidyAmount: '0', uncfSubsidiaryItems: '', totalReversibleItems: ''
    })

    // HOME CARE FIELDS
    const [homeFields, setHomeFields] = useState<Record<string, { rs: string; qty?: string; subsidy?: string }>>({
        'Monthly Membership': { rs: '' }, 'Half-Yearly Membership': { rs: '' }, 'Annual Membership': { rs: '' },
        'Silver Membership': { rs: '' }, 'Gold Membership': { rs: '' }, 'Platinum Membership': { rs: '' },
        'Home Nursing': { rs: '' }, 'Caregiver': { rs: '' }, 'Doctor Visit': { rs: '' },
        'Physiotherapy': { rs: '' }, 'Occupational Therapy': { rs: '' }, 'Speech Therapy': { rs: '' },
        'Counseling': { rs: '' }, 'Yoga': { rs: '' }, 'Palliative Care': { rs: '' },
        'Dementia Care': { rs: '' }, 'Alzheimer\\'s Care': { rs: '' },
        'Lab Tests': { rs: '' }, 'Medicine Delivery': { rs: '' }, 'Transport': { rs: '' },
        'Ambulance': { rs: '' }, 'Beauty Service': { rs: '' }, 'Legal Service': { rs: '' },
        'Pooja Service': { rs: '' }, 'Tours & Travels': { rs: '' }, 'Rendering Service': { rs: '' },
        'Essentials Service': { rs: '' }, 'LATE FEE': { rs: '' }, 'UNCF Subsidy': { rs: '0' }
    })
`;
content = content.substring(0, content.indexOf(oldStateStart)) + newState + '\n    ' + content.substring(content.indexOf(oldStateEnd));


// 2. CALCULATOR REPLACEMENT
const oldCalcStart = `    // Calculators`;
const oldCalcEnd = `    const { grossTotal: totalAmount, totalSubsidy: subsidy, netPayable: totalPayable } = calculateTotals();`;
const newCalc = `    // Calculators
    const calcMedTotal = (item: any) => {
        if ('qty' in item && 'rate' in item && 'disposal' in item) {
            return ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)) + (parseFloat(item.disposal) || 0)
        }
        return parseFloat(item.price) || 0
    }

    const calculateTotals = () => {
        let grossTotal = 0;
        let totalSubsidy = 0;

        if (billType === 'ELDER_CARE') {
            const addFromObj = (obj: any) => {
                Object.values(obj).forEach(val => {
                    if (typeof val === 'object' && val !== null) {
                        grossTotal += (parseFloat((val as any).price) || 0);
                        totalSubsidy += (parseFloat((val as any).subsidy) || 0);
                    } else if (typeof val === 'string' || typeof val === 'number') {
                        grossTotal += (parseFloat(String(val)) || 0);
                    }
                });
            };

            addFromObj(accommodation);
            
            careServices.forEach(cs => {
                grossTotal += parseFloat(cs.price) || 0;
                totalSubsidy += parseFloat(cs.subsidy) || 0;
            });
            addFromObj(nursingFixed);
            addFromObj(therapy);
            addFromObj(medicalSupport);
            addFromObj(food);
            addFromObj(personalCare);
            
            Object.keys(consumables).forEach(k => {
                const item = (consumables as any)[k];
                if ('qty' in item && 'rate' in item && 'disposal' in item) {
                    grossTotal += ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)) + (parseFloat(item.disposal) || 0);
                    totalSubsidy += parseFloat(item.subsidy) || 0;
                } else {
                    grossTotal += parseFloat(item.price) || 0;
                    totalSubsidy += parseFloat(item.subsidy) || 0;
                }
            });

            addFromObj({ prev: additionalCharges.previousPendingPayable });
            if (additionalCharges.upcomingBedCharge.include === 'YES') {
                addFromObj({ upcoming: additionalCharges.upcomingBedCharge.amount })
            }
            
            grossTotal += parseFloat(monthlyEssentials.price) || 0;
            totalSubsidy += parseFloat(monthlyEssentials.subsidy) || 0;

            grossTotal += parseFloat(totals.lateFee) || 0;
            grossTotal += parseFloat(totals.lateMaterialFee) || 0;
            totalSubsidy += parseFloat(totals.uncfSubsidyAmount) || 0;

        } else {
            Object.keys(homeFields).forEach((key) => {
                if (key !== 'UNCF Subsidy') {
                    grossTotal += parseFloat(String(homeFields[key].rs).replace(/[^0-9.]/g, '')) || 0;
                }
            });
            totalSubsidy += parseFloat(String(homeFields['UNCF Subsidy']?.rs || '').replace(/[^0-9.]/g, '')) || 0;
        }

        return { grossTotal, totalSubsidy, netPayable: grossTotal - totalSubsidy };
    };
`;
content = content.substring(0, content.indexOf(oldCalcStart)) + newCalc + '\n    ' + content.substring(content.indexOf(oldCalcEnd));


// 3. HTML TABLE REPLACEMENT
const oldHtmlStart = `        let elderRows = '';`;
const oldHtmlEnd = `        const invoiceTableHtml = \``;
const newHtml = `        let elderRows = '';

        // A. Accommodation
        let accRows = '';
        accRows += renderRow('Bed Charge', accommodation.monthlyBedCharge)
        accRows += renderRow('Room Sharing', accommodation.roomSharing)
        accRows += renderRow('Laundry', accommodation.laundry)
        accRows += renderRow('Electricity', accommodation.eb)
        accRows += renderRow('Gas', accommodation.gas)
        accRows += renderRow('TV & All Out', accommodation.tv)
        accRows += renderRow('Cleaning', accommodation.cleaning)
        accRows += renderRow('Winding-up Cleaning', accommodation.windingUp)
        accRows += renderRow('Breakage Charges', accommodation.breakage)
        elderRows += renderSection('A. ACCOMMODATION SERVICES', accRows)

        // B. Nursing & Care Services
        let nurseRows = '';
        careServices.forEach(cs => {
            if (parseFloat(cs.price) > 0) {
                nurseRows += renderRow(\`\${cs.role} (\${cs.shift}, \${cs.type})\`, { price: cs.price, subsidy: cs.subsidy })
            }
        });
        nurseRows += renderRow('Special Care', nursingFixed.specialCare)
        nurseRows += renderRow("Alzheimer's Care", nursingFixed.alzheimersCare)
        nurseRows += renderRow('Dressing', nursingFixed.dressing)
        nurseRows += renderRow('First Aid', nursingFixed.firstAid)
        elderRows += renderSection('B. NURSING & CARE SERVICES', nurseRows)

        // C. Therapy Services
        let therRows = '';
        therRows += renderRow('Doctor Visit', therapy.doctorVisit)
        therRows += renderRow('Physiotherapy', therapy.physiotherapy)
        therRows += renderRow('Occupational Therapy', therapy.occupational)
        therRows += renderRow('Speech Therapy', therapy.speech)
        therRows += renderRow('Geriatric Counseling', therapy.geriatricCounseling)
        therRows += renderRow('Psychiatric Counseling', therapy.psychiatricCounseling)
        therRows += renderRow('Yoga', therapy.yoga)
        elderRows += renderSection('C. THERAPY SERVICES', therRows)

        // D. Medical Support Services
        let medSupRows = '';
        medSupRows += renderRow('Lab Tests', medicalSupport.labTest)
        medSupRows += renderRow('Medicine', medicalSupport.medicine)
        medSupRows += renderRow('ICU at Home', medicalSupport.icuAtHome)
        medSupRows += renderRow('Surgical Equipment', medicalSupport.surgicalEquipment)
        medSupRows += renderRow('Ambulance', medicalSupport.ambulance)
        medSupRows += renderRow('Transport', medicalSupport.transport)
        elderRows += renderSection('D. MEDICAL SUPPORT SERVICES', medSupRows)

        // E. Food & Nutrition
        let foodRows = '';
        foodRows += renderRow('Milk', food.milk)
        foodRows += renderRow('Juice Preparation', food.juice)
        foodRows += renderRow('Snacks', food.snacks)
        foodRows += renderRow('Herbal Drinks', food.herbalDrinks)
        elderRows += renderSection('E. FOOD & NUTRITION', foodRows)

        // F. Linen & Personal Care
        let perRows = '';
        perRows += renderRow('New Dress', personalCare.newDress)
        perRows += renderRow('New Towel', personalCare.towel)
        perRows += renderRow('New Bedspread', personalCare.bedspread)
        perRows += renderRow('New Blanket', personalCare.blanket)
        perRows += renderRow('Pillow Cover', personalCare.pillowCover)
        perRows += renderRow('Airbed', personalCare.airbed)
        perRows += renderRow('Stitching', personalCare.stitching)
        elderRows += renderSection('F. LINEN & PERSONAL CARE', perRows)

        // G. Medical Consumables
        let consRows = '';
        ['diapers', 'gloves', 'mask', 'underpad', 'bedWipes', 'rubbersheet'].forEach((k) => {
            const item = (consumables as any)[k];
            const val = calcMedTotal(item);
            if (val > 0) {
                const labelMap: any = { diapers: 'Diapers', gloves: 'Gloves', mask: 'Masks', underpad: 'Under Pad', bedWipes: 'Bed Wipes', rubbersheet: 'Rubber Sheet' };
                consRows += renderRow(\`\${labelMap[k]} (Qty: \${item.qty || 0})\`, { price: val, subsidy: item.subsidy });
            }
        });
        consRows += renderRow('Catheter', consumables.catheter)
        consRows += renderRow('Uro Bag', consumables.uroBag)
        consRows += renderRow('Oxygen', consumables.oxygen)
        consRows += renderRow('Nebulizer', consumables.nebulizer)
        elderRows += renderSection('G. MEDICAL CONSUMABLES', consRows)

        // H. Monthly Essentials
        let essenRows = '';
        essenRows += renderRow('Monthly Essentials', monthlyEssentials)
        elderRows += renderSection('H. MONTHLY ESSENTIALS', essenRows)

        // PREVIOUS PAYABLE AMOUNT
        let additionalRows = '';
        additionalRows += renderRow('Previous Pending Payable Amount', additionalCharges.previousPendingPayable)
        if (additionalCharges.upcomingBedCharge.include === 'YES') {
            additionalRows += renderRow(\`\${nextMonthName} Bed Charge\`, additionalCharges.upcomingBedCharge.amount)
        }
        if (additionalRows && billType === 'ELDER_CARE') {
            elderRows += renderSection('PREVIOUS PAYABLE AMOUNT', additionalRows)
        }

        // HOME CARE ROWS
        let homeRows = '';
        if (billType === 'HOME_CARE') {
            const renderHomeGroup = (keys: string[], title: string) => {
                let grpRows = '';
                keys.forEach((key) => {
                    if (isValid(homeFields[key])) {
                        grpRows += renderRow(\`\${key} \${homeFields[key].qty ? '(Qty: ' + homeFields[key].qty + ')' : ''}\`, homeFields[key])
                    }
                });
                return renderSection(title, grpRows);
            }

            homeRows += renderHomeGroup(['Monthly Membership', 'Half-Yearly Membership', 'Annual Membership', 'Silver Membership', 'Gold Membership', 'Platinum Membership'], 'A. MEMBERSHIP');
            homeRows += renderHomeGroup(['Home Nursing', 'Caregiver', 'Doctor Visit', 'Physiotherapy', 'Occupational Therapy', 'Speech Therapy', 'Counseling', 'Yoga', 'Palliative Care', 'Dementia Care', "Alzheimer's Care"], 'B. HOME CARE SERVICES');
            homeRows += renderHomeGroup(['Lab Tests', 'Medicine Delivery', 'Transport', 'Ambulance', 'Beauty Service', 'Legal Service', 'Pooja Service', 'Tours & Travels', 'Rendering Service', 'Essentials Service'], 'C. HOME SUPPORT SERVICES');
        }

`;
content = content.substring(0, content.indexOf(oldHtmlStart)) + newHtml + '\n        ' + content.substring(content.indexOf(oldHtmlEnd));


// 4. JSX UI REPLACEMENT
const oldJsxStart = `                    {billType === 'ELDER_CARE' && (`;
const oldJsxEnd = `                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">Balance Summary (Carried Forward)</h3>`;
const newJsx = `                    {billType === 'ELDER_CARE' && (
                        <div className="space-y-6">
                            {/* A. Accommodation */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">A. Accommodation Services</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <SubsidyField label="Bed Charge" priceObj={accommodation.monthlyBedCharge} onChange={(v: any) => setAccommodation({ ...accommodation, monthlyBedCharge: v })} />
                                    <Select label="Room Sharing" value={accommodation.roomSharing} onChange={(v: string) => setAccommodation({ ...accommodation, roomSharing: v })} options={['Single', 'Two Sharing', 'Four Sharing']} />
                                    <SubsidyField label="Laundry" priceObj={accommodation.laundry} onChange={(v: any) => setAccommodation({ ...accommodation, laundry: v })} />
                                    <SubsidyField label="Electricity" priceObj={accommodation.eb} onChange={(v: any) => setAccommodation({ ...accommodation, eb: v })} />
                                    <SubsidyField label="Gas" priceObj={accommodation.gas} onChange={(v: any) => setAccommodation({ ...accommodation, gas: v })} />
                                    <SubsidyField label="TV & All Out" priceObj={accommodation.tv} onChange={(v: any) => setAccommodation({ ...accommodation, tv: v })} />
                                    <SubsidyField label="Cleaning" priceObj={accommodation.cleaning} onChange={(v: any) => setAccommodation({ ...accommodation, cleaning: v })} />
                                    <SubsidyField label="Winding-up Cleaning" priceObj={accommodation.windingUp} onChange={(v: any) => setAccommodation({ ...accommodation, windingUp: v })} />
                                    <SubsidyField label="Breakage Charges" priceObj={accommodation.breakage} onChange={(v: any) => setAccommodation({ ...accommodation, breakage: v })} />
                                </div>
                            </div>

                            {/* B. Nursing & Care Services */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex justify-between items-center border-b pb-2 mb-4">
                                    <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">B. Nursing & Care Services</h3>
                                    <button onClick={() => setCareServices([...careServices, { id: Date.now(), role: 'Care Giver', shift: 'Day', type: 'Inside', price: '', subsidy: '' }])} className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded font-bold hover:bg-primary-200">
                                        + Add Personnel
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {careServices.map((cs, i) => (
                                        <div key={cs.id} className="grid grid-cols-5 gap-4 bg-slate-50 p-3 rounded-lg border">
                                            <Select label="Role" value={cs.role} onChange={(v: string) => { const nc = [...careServices]; nc[i].role = v; setCareServices(nc); }} options={['Care Giver', 'Nursing Care', 'Attender']} />
                                            <Select label="Shift" value={cs.shift} onChange={(v: string) => { const nc = [...careServices]; nc[i].shift = v; setCareServices(nc); }} options={['Day', 'Night', '24/7', 'Partial']} />
                                            <Select label="Type" value={cs.type} onChange={(v: string) => { const nc = [...careServices]; nc[i].type = v; setCareServices(nc); }} options={['Inside', 'Outside']} />
                                            <div className="col-span-2 flex gap-4 items-end">
                                                <div className="flex-1">
                                                    <SubsidyField label="Price & Subsidy" priceObj={{ price: cs.price, subsidy: cs.subsidy }} onChange={(v: any) => { const nc = [...careServices]; nc[i].price = v.price; nc[i].subsidy = v.subsidy; setCareServices(nc); }} />
                                                </div>
                                                <button onClick={() => setCareServices(careServices.filter(c => c.id !== cs.id))} className="text-red-500 mb-2 font-bold px-2 py-1 bg-red-50 rounded hover:bg-red-100">X</button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-4 gap-4 mt-4 border-t pt-4">
                                        <SubsidyField label="Special Care" priceObj={nursingFixed.specialCare} onChange={(v: any) => setNursingFixed({ ...nursingFixed, specialCare: v })} />
                                        <SubsidyField label="Alzheimer's Care" priceObj={nursingFixed.alzheimersCare} onChange={(v: any) => setNursingFixed({ ...nursingFixed, alzheimersCare: v })} />
                                        <SubsidyField label="Dressing" priceObj={nursingFixed.dressing} onChange={(v: any) => setNursingFixed({ ...nursingFixed, dressing: v })} />
                                        <SubsidyField label="First Aid" priceObj={nursingFixed.firstAid} onChange={(v: any) => setNursingFixed({ ...nursingFixed, firstAid: v })} />
                                    </div>
                                </div>
                            </div>

                            {/* C. Therapy Services */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">C. Therapy Services</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <SubsidyField label="Doctor Visit" priceObj={therapy.doctorVisit} onChange={(v: any) => setTherapy({ ...therapy, doctorVisit: v })} />
                                    <SubsidyField label="Physiotherapy" priceObj={therapy.physiotherapy} onChange={(v: any) => setTherapy({ ...therapy, physiotherapy: v })} />
                                    <SubsidyField label="Occupational Therapy" priceObj={therapy.occupational} onChange={(v: any) => setTherapy({ ...therapy, occupational: v })} />
                                    <SubsidyField label="Speech Therapy" priceObj={therapy.speech} onChange={(v: any) => setTherapy({ ...therapy, speech: v })} />
                                    <SubsidyField label="Geriatric Counseling" priceObj={therapy.geriatricCounseling} onChange={(v: any) => setTherapy({ ...therapy, geriatricCounseling: v })} />
                                    <SubsidyField label="Psychiatric Counseling" priceObj={therapy.psychiatricCounseling} onChange={(v: any) => setTherapy({ ...therapy, psychiatricCounseling: v })} />
                                    <SubsidyField label="Yoga" priceObj={therapy.yoga} onChange={(v: any) => setTherapy({ ...therapy, yoga: v })} />
                                </div>
                            </div>

                            {/* D. Medical Support */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">D. Medical Support Services</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <SubsidyField label="Lab Tests" priceObj={medicalSupport.labTest} onChange={(v: any) => setMedicalSupport({ ...medicalSupport, labTest: v })} />
                                    <SubsidyField label="Medicine" priceObj={medicalSupport.medicine} onChange={(v: any) => setMedicalSupport({ ...medicalSupport, medicine: v })} />
                                    <SubsidyField label="ICU at Home" priceObj={medicalSupport.icuAtHome} onChange={(v: any) => setMedicalSupport({ ...medicalSupport, icuAtHome: v })} />
                                    <SubsidyField label="Surgical Equipment" priceObj={medicalSupport.surgicalEquipment} onChange={(v: any) => setMedicalSupport({ ...medicalSupport, surgicalEquipment: v })} />
                                    <SubsidyField label="Ambulance" priceObj={medicalSupport.ambulance} onChange={(v: any) => setMedicalSupport({ ...medicalSupport, ambulance: v })} />
                                    <SubsidyField label="Transport" priceObj={medicalSupport.transport} onChange={(v: any) => setMedicalSupport({ ...medicalSupport, transport: v })} />
                                </div>
                            </div>

                            {/* E. Food & Nutrition */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">E. Food & Nutrition</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <SubsidyField label="Milk" priceObj={food.milk} onChange={(v: any) => setFood({ ...food, milk: v })} />
                                    <SubsidyField label="Juice Preparation" priceObj={food.juice} onChange={(v: any) => setFood({ ...food, juice: v })} />
                                    <SubsidyField label="Snacks" priceObj={food.snacks} onChange={(v: any) => setFood({ ...food, snacks: v })} />
                                    <SubsidyField label="Herbal Drinks" priceObj={food.herbalDrinks} onChange={(v: any) => setFood({ ...food, herbalDrinks: v })} />
                                </div>
                            </div>

                            {/* F. Linen & Personal Care */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">F. Linen & Personal Care</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <SubsidyField label="New Dress" priceObj={personalCare.newDress} onChange={(v: any) => setPersonalCare({ ...personalCare, newDress: v })} />
                                    <SubsidyField label="New Towel" priceObj={personalCare.towel} onChange={(v: any) => setPersonalCare({ ...personalCare, towel: v })} />
                                    <SubsidyField label="New Bedspread" priceObj={personalCare.bedspread} onChange={(v: any) => setPersonalCare({ ...personalCare, bedspread: v })} />
                                    <SubsidyField label="New Blanket" priceObj={personalCare.blanket} onChange={(v: any) => setPersonalCare({ ...personalCare, blanket: v })} />
                                    <SubsidyField label="Pillow Cover" priceObj={personalCare.pillowCover} onChange={(v: any) => setPersonalCare({ ...personalCare, pillowCover: v })} />
                                    <SubsidyField label="Airbed" priceObj={personalCare.airbed} onChange={(v: any) => setPersonalCare({ ...personalCare, airbed: v })} />
                                    <SubsidyField label="Stitching" priceObj={personalCare.stitching} onChange={(v: any) => setPersonalCare({ ...personalCare, stitching: v })} />
                                </div>
                            </div>

                            {/* G. Medical Consumables */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">G. Medical Consumables</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid grid-cols-3 gap-2 border p-2 rounded-lg bg-slate-50">
                                        <Field label="Diapers (Qty)" value={consumables.diapers.qty} onChange={(v: string) => setConsumables({ ...consumables, diapers: { ...consumables.diapers, qty: v } })} />
                                        <Field label="Rate (70)" value={consumables.diapers.rate} onChange={(v: string) => setConsumables({ ...consumables, diapers: { ...consumables.diapers, rate: v } })} />
                                        <Field label="Disposal Chg" value={consumables.diapers.disposal} onChange={(v: string) => setConsumables({ ...consumables, diapers: { ...consumables.diapers, disposal: v } })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border p-2 rounded-lg bg-slate-50">
                                        <Field label="Gloves (Qty)" value={consumables.gloves.qty} onChange={(v: string) => setConsumables({ ...consumables, gloves: { ...consumables.gloves, qty: v } })} />
                                        <Field label="Rate (75)" value={consumables.gloves.rate} onChange={(v: string) => setConsumables({ ...consumables, gloves: { ...consumables.gloves, rate: v } })} />
                                        <Field label="Disposal Chg" value={consumables.gloves.disposal} onChange={(v: string) => setConsumables({ ...consumables, gloves: { ...consumables.gloves, disposal: v } })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border p-2 rounded-lg bg-slate-50">
                                        <Field label="Masks (Qty)" value={consumables.mask.qty} onChange={(v: string) => setConsumables({ ...consumables, mask: { ...consumables.mask, qty: v } })} />
                                        <Field label="Rate (4)" value={consumables.mask.rate} onChange={(v: string) => setConsumables({ ...consumables, mask: { ...consumables.mask, rate: v } })} />
                                        <Field label="Disposal Chg" value={consumables.mask.disposal} onChange={(v: string) => setConsumables({ ...consumables, mask: { ...consumables.mask, disposal: v } })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border p-2 rounded-lg bg-slate-50">
                                        <Field label="Under Pad (Qty)" value={consumables.underpad.qty} onChange={(v: string) => setConsumables({ ...consumables, underpad: { ...consumables.underpad, qty: v } })} />
                                        <Field label="Rate (60)" value={consumables.underpad.rate} onChange={(v: string) => setConsumables({ ...consumables, underpad: { ...consumables.underpad, rate: v } })} />
                                        <Field label="Disposal Chg" value={consumables.underpad.disposal} onChange={(v: string) => setConsumables({ ...consumables, underpad: { ...consumables.underpad, disposal: v } })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border p-2 rounded-lg bg-slate-50">
                                        <Field label="Bed Wipes (Qty)" value={consumables.bedWipes.qty} onChange={(v: string) => setConsumables({ ...consumables, bedWipes: { ...consumables.bedWipes, qty: v } })} />
                                        <Field label="Rate" value={consumables.bedWipes.rate} onChange={(v: string) => setConsumables({ ...consumables, bedWipes: { ...consumables.bedWipes, rate: v } })} />
                                        <Field label="Disposal Chg" value={consumables.bedWipes.disposal} onChange={(v: string) => setConsumables({ ...consumables, bedWipes: { ...consumables.bedWipes, disposal: v } })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border p-2 rounded-lg bg-slate-50">
                                        <Field label="Rubber Sheet (m)" value={consumables.rubbersheet.qty} onChange={(v: string) => setConsumables({ ...consumables, rubbersheet: { ...consumables.rubbersheet, qty: v } })} />
                                        <Field label="Rate (700)" value={consumables.rubbersheet.rate} onChange={(v: string) => setConsumables({ ...consumables, rubbersheet: { ...consumables.rubbersheet, rate: v } })} />
                                        <Field label="Disposal Chg" value={consumables.rubbersheet.disposal} onChange={(v: string) => setConsumables({ ...consumables, rubbersheet: { ...consumables.rubbersheet, disposal: v } })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4 mt-4">
                                    <SubsidyField label="Catheter" priceObj={consumables.catheter} onChange={(v: any) => setConsumables({ ...consumables, catheter: v })} />
                                    <SubsidyField label="Uro Bag" priceObj={consumables.uroBag} onChange={(v: any) => setConsumables({ ...consumables, uroBag: v })} />
                                    <SubsidyField label="Oxygen" priceObj={consumables.oxygen} onChange={(v: any) => setConsumables({ ...consumables, oxygen: v })} />
                                    <SubsidyField label="Nebulizer" priceObj={consumables.nebulizer} onChange={(v: any) => setConsumables({ ...consumables, nebulizer: v })} />
                                </div>
                            </div>

                            {/* H. Monthly Essentials */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">H. Monthly Essentials</h3>
                                <div className="w-1/3">
                                    <SubsidyField label="Monthly Essentials Charge" priceObj={monthlyEssentials} onChange={setMonthlyEssentials} />
                                </div>
                            </div>
                        </div>
                    )}

                    {billType === 'HOME_CARE' && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">A. Membership</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Monthly Membership', 'Half-Yearly Membership', 'Annual Membership', 'Silver Membership', 'Gold Membership', 'Platinum Membership'].map((k) => (
                                        <SubsidyField key={k} label={k} priceObj={homeFields[k]} onChange={(v: any) => setHomeFields({ ...homeFields, [k]: v })} />
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">B. Home Care Services</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Home Nursing', 'Caregiver', 'Doctor Visit', 'Physiotherapy', 'Occupational Therapy', 'Speech Therapy', 'Counseling', 'Yoga', 'Palliative Care', 'Dementia Care', "Alzheimer's Care"].map((k) => (
                                        <div key={k} className="border p-2 bg-slate-50 rounded">
                                            <div className="mb-2"><Field label={k + " (Qty)"} value={homeFields[k].qty} onChange={(v: any) => setHomeFields({ ...homeFields, [k]: { ...homeFields[k], qty: v } })} /></div>
                                            <SubsidyField label="Price" priceObj={homeFields[k]} onChange={(v: any) => setHomeFields({ ...homeFields, [k]: { ...homeFields[k], price: v.price, subsidy: v.subsidy, rs: v.price } })} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">C. Home Support Services</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Lab Tests', 'Medicine Delivery', 'Transport', 'Ambulance', 'Beauty Service', 'Legal Service', 'Pooja Service', 'Tours & Travels', 'Rendering Service', 'Essentials Service'].map((k) => (
                                        <SubsidyField key={k} label={k} priceObj={homeFields[k]} onChange={(v: any) => setHomeFields({ ...homeFields, [k]: { ...homeFields[k], price: v.price, subsidy: v.subsidy, rs: v.price } })} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-8 space-y-6">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b pb-2 mb-4">Balance Summary (Carried Forward)</h3>`;

content = content.substring(0, content.indexOf(oldJsxStart)) + newJsx + '\n' + content.substring(content.indexOf(oldJsxEnd) + oldJsxEnd.length);


fs.writeFileSync(targetFile, content);
console.log('Successfully updated file.');
