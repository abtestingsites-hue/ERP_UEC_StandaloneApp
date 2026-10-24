// @ts-nocheck
import { useState, useEffect } from "react";
import { FileText, Smartphone, Save, Check, CheckCircle } from "lucide-react";
import { PageHeader } from "../../../components/PageHeader";
import { api } from "../../../lib/axios";
import html2pdf from "html2pdf.js";


const Field = ({ label, value, onChange, placeholder, type = "text", disabled = false }: any) => (
  <div>
    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      disabled={disabled}
      className={`h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20 ${disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
    />
  </div>
);

const RateField = ({ label, priceObj, onChange }: any) => {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </label>
      <input
        type="number"
        placeholder="Rate (₹)"
        value={priceObj?.rate || priceObj?.rs || ""}
        onChange={(e) => onChange({ ...priceObj, rate: e.target.value, rs: e.target.value })}
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20 bg-white"
      />
    </div>
  );
};

const SubsidyField = ({ label, priceObj, onChange }: any) => {
  const hasSubsidy = !!priceObj?.subsidy;
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="number"
            placeholder="Rate (₹)"
            value={priceObj?.rate || ""}
            onChange={(e) => onChange({ ...priceObj, rate: e.target.value })}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20"
          />
        </div>
        <div className="flex-1">
          <input
            type="number"
            placeholder="Subsidy (₹)"
            value={priceObj?.subsidy || ""}
            onChange={(e) => onChange({ ...priceObj, subsidy: e.target.value })}
            className={`h-10 w-full rounded-lg px-3 text-sm font-semibold outline-none transition-colors ${hasSubsidy ? "border-2 border-orange-500 bg-orange-100 text-orange-900 shadow-sm" : "border border-orange-200 bg-orange-50 text-orange-700 focus:border-orange-500 placeholder:text-orange-300"}`}
          />
        </div>
      </div>
    </div>
  );
};

const Select = ({ label, value, onChange, options }: any) => (
  <div>
    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#0F969C] focus:ring-2 focus:ring-[#0F969C]/20 bg-white"
    >
      <option value="">Select...</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const htmlEscape = (str: string | number) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const invoiceMoney = (val: number | string | null | undefined) =>
  Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function PatientManualBilling() {
  const [isSending, setIsSending] = useState(false);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);
  const [isMarkedSent, setIsMarkedSent] = useState(false);
  const [billType, setBillType] = useState<"ELDER_CARE" | "HOME_CARE">(
    "ELDER_CARE",
  );

  // Header Fields
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [patientId, setPatientId] = useState("");
  const [elderId, setElderId] = useState("");
  
  // Patient Resolution State
  const [patientSearchStatus, setPatientSearchStatus] = useState<'idle'|'searching'|'found-single'|'found-multiple'|'not-found'|'created'>('idle');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");

  const [membershipPlan, setMembershipPlan] = useState("");
  const [membershipCategory, setMembershipCategory] = useState("");
  const [bedSharing, setBedSharing] = useState("");

  const [billId, setBillId] = useState("");
  const [billingMonthYear, setBillingMonthYear] = useState("");
  const [billingFrequency, setBillingFrequency] = useState("Monthly");
  const [billingDays, setBillingDays] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const [guardianName, setGuardianName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [guardianAddress, setGuardianAddress] = useState({
    flat: "",
    building: "",
    street: "",
    area: "",
    city: "",
    district: "",
    state: "",
    pin: ""
  });
  const [upiId, setUpiId] = useState("mab.037347029020081@axisbank");

  useEffect(() => {
    if (patientDob) {
      const dobDate = new Date(patientDob);
      if (!isNaN(dobDate.getTime())) {
        const age = Math.floor((new Date().getTime() - dobDate.getTime()) / 31557600000);
        setPatientAge(String(age));
      }
    }
  }, [patientDob]);

  const handleResolvePatient = async () => {
    if (!patientName || patientName.length < 3) {
      setPatientSearchStatus('idle');
      return;
    }
    setPatientSearchStatus('searching');
    try {
      const res = await api.get(`/patient-billing/patient-lookup?query=${encodeURIComponent(patientName)}`);
      const results = res.data?.data || [];
      if (results.length === 1) {
        const p = results[0];
        setPatientId(p.id);
        setElderId(p.elderId || '');
        if (p.age) setPatientAge(String(p.age));
        if (p.gender) setPatientSex(p.gender);
        setPatientSearchStatus('found-single');
      } else if (results.length === 0) {
        setPatientSearchStatus('not-found');
      } else {
        setSearchResults(results);
        setPatientSearchStatus('found-multiple');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to resolve patient.");
      setPatientSearchStatus('idle');
    }
  };

  const handleCreatePatient = async () => {
    try {
      setPatientSearchStatus('searching');
      const res = await api.post("/operations/patients", { name: patientName });
      if (res.data?.success && res.data?.data) {
        setPatientId(res.data.data.id);
        setElderId(res.data.data.elderId || '');
        setPatientSearchStatus('created');
      } else {
        setPatientSearchStatus('not-found');
        alert("Failed to create patient: " + (res.data?.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error(err);
      setPatientSearchStatus('not-found');
      alert(err.response?.data?.message || "Failed to create patient.");
    }
  };

  // --- NEW 19-CATEGORY STATE ---
  // 1. Care Staff Services
  const [careStaff, setCareStaff] = useState({
    careGiver: { shift: "", type: "", rate: "", subsidy: "" },
    nursingCare: { shift: "", rate: "", subsidy: "" },
    specialCare: { shift: "", rate: "", subsidy: "" },
    palliativeCare: { type: "", rate: "", subsidy: "" },
    dementiaCare: { type: "", rate: "", subsidy: "" },
    alzheimersCare: { type: "", rate: "", subsidy: "" },
    dressing: { qty: "", rate: "", subsidy: "" },
    firstAid: { qty: "", rate: "", subsidy: "" },
  });

  // 2. Therapy & Consultation
  const [therapy, setTherapy] = useState({
    doctorVisit: { type: "", mode: "", rate: "", subsidy: "" },
    physiotherapy: { sessionType: "", sessions: "", rate: "", subsidy: "" },
    occupationalTherapy: {
      sessionType: "",
      sessions: "",
      rate: "",
      subsidy: "",
    },
    speechTherapy: { sessionType: "", sessions: "", rate: "", subsidy: "" },
    geriatricCounseling: {
      sessionType: "",
      sessions: "",
      rate: "",
      subsidy: "",
    },
    psychiatricCounseling: {
      sessionType: "",
      sessions: "",
      rate: "",
      subsidy: "",
    },
    yoga: { sessionType: "", sessions: "", rate: "", subsidy: "" },
  });

  // 3. Medical Support
  const [medicalSupport, setMedicalSupport] = useState({
    medicines: [{ id: Date.now(), name: "", qty: "", rate: "", subsidy: "" }],
    labTests: [{ id: Date.now(), name: "", qty: "", rate: "", subsidy: "" }],
    icuAtHome: { duration: "", rate: "", subsidy: "" },
    surgicalEquipment: [
      { id: Date.now(), name: "", qty: "", type: "", rate: "", subsidy: "" },
    ],
  });

  // 4. Transportation
  const [transportation, setTransportation] = useState({
    ambulance: { type: "", oxygen: "", trips: "", rate: "", subsidy: "" },
    taxi: { distance: "", trips: "", rate: "" },
    auto: { distance: "", trips: "", rate: "" },
    seniorCab: { distance: "", trips: "", rate: "" },
  });

  // 5. Personal & Lifestyle Services
  const [lifestyle, setLifestyle] = useState({
    beauty: { service: "", rate: "600", subsidy: "" },
    legal: { consultation: "", documentation: "", other: "" },
    pooja: { templeVisit: "", homePooja: "", specialEvent: "" },
    tours: { pilgrimage: "", outing: "", tourism: "" },
    rendering: {
      temple: "",
      bank: "",
      shopping: "",
      hospital: "",
      movie: "",
      food: "",
      other: "",
    },
    essentialsService: {
      plumbing: "",
      electrical: "",
      civil: "",
      cctv: "",
      carpentry: "",
      welding: "",
      other: "",
    },
  });

  // 6. Accommodation
  const [accommodation, setAccommodation] = useState({
    bedCharges: { stayType: "", roomSharing: "", rate: "", subsidy: "" },
    upcomingBedCharge: {
      enable: "NO",
      stayType: "",
      roomSharing: "",
      rate: "",
      subsidy: "",
    },
  });

  useEffect(() => {
    const getRate = (sharing: string) => {
      if (sharing === "Single Sharing") return "3500";
      if (sharing === "Double Sharing") return "2500";
      if (sharing === "Four Sharing") return "1500";
      return accommodation.bedCharges.rate || "";
    };

    const newRate = getRate(bedSharing);
    if (newRate !== accommodation.bedCharges.rate) {
      setAccommodation((prev) => ({
        ...prev,
        bedCharges: { ...prev.bedCharges, rate: newRate },
      }));
    }
  }, [bedSharing]);

  // 7. Laundry & Utility
  const [utility, setUtility] = useState({
    laundry: [{ id: Date.now(), type: "", qty: "", rate: "", subsidy: "" }],
    electricity: { units: "", rate: "700", subsidy: "" },
    gas: { cylinder: "", qty: "", rate: "1000" },
    tvAndMosquito: { rate: "300", subsidy: "" },
    cleaning: { type: "", rate: "" },
    windingUpCleaning: { rate: "" },
    breakage: { itemName: "", qty: "", rate: "" },
  });

  // 8. Food & Nutrition
  const [food, setFood] = useState({
    milk: { qty: "", rate: "500", subsidy: "" },
    juice: { qty: "", rate: "" },
    snacks: { qty: "", rate: "300" },
    herbalDrinks: { qty: "", rate: "200" },
  });

  // 9. Linen & Personal Items
  const [linen, setLinen] = useState({
    newDress: { qty: "", rate: "", subsidy: "" },
    newTowel: { qty: "", rate: "", subsidy: "" },
    newBedspread: { qty: "", rate: "", subsidy: "" },
    newBlanket: { qty: "", rate: "", subsidy: "" },
    newPillowCover: { qty: "", rate: "", subsidy: "" },
    newAirbed: { qty: "", rate: "", subsidy: "" },
    stitching: { qty: "", rate: "", subsidy: "" },
  });

  // 10. Medical Consumables
  const [medicalConsumables, setMedicalConsumables] = useState({
    diapers: { qty: "", rate: "70", subsidy: "" },
    gloves: { qty: "", rate: "7.50", subsidy: "" },
    mask: { qty: "", rate: "4", subsidy: "" },
    underPad: { qty: "", rate: "60", subsidy: "" },
    bedWipes: { qty: "", rate: "", subsidy: "" },
    catheter: { qty: "", rate: "", subsidy: "" },
    uroBag: { qty: "", rate: "", subsidy: "" },
    rubberSheet: { qty: "", rate: "", subsidy: "" },
    oxygen: { qty: "", rate: "", subsidy: "" },
    nebulizer: { qty: "", rate: "", subsidy: "" },
  });

  // 11. Monthly Essentials
  const [monthlyEssentials, setMonthlyEssentials] = useState({
    availPackage: "NO",
    toothpaste: { qty: "", status: "Pending" },
    toothbrush: { qty: "", status: "Pending" },
    bathSoap: { qty: "", status: "Pending" },
    talcumPowder: { qty: "", status: "Pending" },
    vibhoothi: { qty: "", status: "Pending" },
    coconutOil: { qty: "", status: "Pending" },
    washingPowder: { qty: "", status: "Pending" },
    fabricFreshener: { qty: "", status: "Pending" },
    dettol: { qty: "", status: "Pending" },
    sanitiser: { qty: "", status: "Pending" },
  });

  // 12. Material Receipt
  const [materialReceipt, setMaterialReceipt] = useState({
    receivedDate: "",
    receivedMode: "Self",
    diapers: { qty: "" },
    gloves: { qty: "" },
    mask: { qty: "" },
    underPad: { qty: "" },
    rubberSheet: { qty: "" },
    medicine: { qty: "" },
  });

  // 13. Balance Summary
  const [balanceSummary, setBalanceSummary] = useState({
    balanceAmount: "",
    monthlyEssentials: "",
    diapers: "",
    gloves: "",
    mask: "",
    underPad: "",
    rubberSheet: "",
  });

  // 14. Billing Summary & 16. Payment Details
  const [billingSummary, setBillingSummary] = useState({
    previousPending: "",
    lateFee: "",
    lateMaterialFee: "",
    paymentDate: "",
    paymentMode: "",
    upiApp: "",
    paidAmount: "",
    transactionId: "",
    bankName: "",
    remarks: "",
  });

  // 15. Material Dispatch
  const [materialDispatch, setMaterialDispatch] = useState({
    diapers: { qty: "" },
    gloves: { qty: "" },
    mask: { qty: "" },
    underPad: { qty: "" },
    rubberSheet: { qty: "" },
  });

  // 17. Problem & Resolution
  const [problemResolution, setProblemResolution] = useState({
    reportedBy: "",
    category: "",
    details: "",
    resolution: "",
    resolutionDate: "",
    status: "",
  });

  // 18. Feedback & Grievance
  const [feedback, setFeedback] = useState({
    feedback: "",
    rating: "",
    complaint: "",
    followUp: "",
    remarks: "",
  });

  // 19. Payment Instructions (Config)
  const [paymentInstructions, setPaymentInstructions] = useState({
    qr: "",
    upiId: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    screenshot: "",
    ref: "",
    tnc: "",
  });

  // HOME CARE FIELDS
  const [homeFields, setHomeFields] = useState<any>({
    "Monthly Membership": { rs: "" },
    "Quarterly Membership": { rs: "" },
    "Half-Yearly Membership": { rs: "" },
    "Annual Membership": { rs: "" },
    "Silver Membership": { rs: "" },
    "Gold Membership": { rs: "" },
    "Platinum Membership": { rs: "" },
    "Home Nursing": { rs: "" },
    Caregiver: { rs: "" },
    "Doctor Visit": { rs: "" },
    Physiotherapy: { rs: "" },
    "Occupational Therapy": { rs: "" },
    "Speech Therapy": { rs: "" },
    Counseling: { rs: "" },
    Yoga: { rs: "" },
    "Palliative Care": { rs: "" },
    "Dementia Care": { rs: "" },
    "Alzheimer's Care": { rs: "" },
    "Lab Tests": { rs: "" },
    "Medicine Delivery": { rs: "" },
    Transport: { rs: "" },
    Ambulance: { rs: "" },
    "Beauty Service": { rs: "" },
    "Legal Service": { rs: "" },
    "Pooja Service": { rs: "" },
    "Tours & Travels": { rs: "" },
    "Rendering Service": { rs: "" },
    "Essentials Service": { rs: "" },
    "LATE FEE": { rs: "" },
  });

  // Calculators
  const calcQtyRate = (item: any) => {
    if (!item || !item.rate) return { price: 0, subsidy: 0 };
    const qStr = item.qty !== undefined && item.qty !== null ? String(item.qty).trim() : "";
    const q = qStr === "" ? 0 : (parseFloat(qStr) || 0);
    const r = parseFloat(item.rate) || 0;
    const d = parseFloat(item.disposalCharge) || 0;
    const s = parseFloat(item.subsidy) || 0;
    return { price: q * r + d, subsidy: s };
  };

  const calcFlat = (item: any) => {
    if (!item || !item.rate) return { price: 0, subsidy: 0 };
    const r = parseFloat(item.rate) || 0;
    const s = parseFloat(item.subsidy) || 0;

    let multiplier = 1;
    if (billingFrequency === "Daily") {
      multiplier = parseInt(billingDays) || 0;
    }
    return { price: r * multiplier, subsidy: s * multiplier };
  };

  const calculateTotals = () => {
    let grossTotal = 0;
    let totalSubsidy = 0;

    if (billType === "ELDER_CARE") {
      const add = (val: any) => {
        if (val && val.price !== undefined) {
          grossTotal += parseFloat(val.price) || 0;
          totalSubsidy += parseFloat(val.subsidy) || 0;
        }
      };

      // 1. Care Staff
      add(calcFlat(careStaff.careGiver));
      add(calcFlat(careStaff.nursingCare));
      add(calcFlat(careStaff.specialCare));
      add(calcFlat(careStaff.palliativeCare));
      add(calcFlat(careStaff.dementiaCare));
      add(calcFlat(careStaff.alzheimersCare));
      add(calcQtyRate(careStaff.dressing));
      add(calcQtyRate(careStaff.firstAid));

      // 2. Therapy
      Object.values(therapy).forEach((v) => add(calcFlat(v)));

      // 3. Medical Support
      medicalSupport.medicines.forEach((m) => add(calcQtyRate(m)));
      medicalSupport.labTests.forEach((l) => add(calcQtyRate(l)));
      add(calcFlat(medicalSupport.icuAtHome));
      medicalSupport.surgicalEquipment.forEach((s) => add(calcQtyRate(s)));

      // 4. Transportation
      add(calcFlat(transportation.ambulance));
      add(calcFlat(transportation.taxi));
      add(calcFlat(transportation.auto));
      add(calcFlat(transportation.seniorCab));

      // 5. Lifestyle
      add(calcFlat(lifestyle.beauty));

      // 6. Accommodation
      add(calcFlat(accommodation.bedCharges));
      if (accommodation.upcomingBedCharge.enable === "YES") {
        add(calcFlat(accommodation.upcomingBedCharge));
      }

      // 7. Utility
      utility.laundry.forEach((l) => add(calcQtyRate(l)));
      add(calcFlat(utility.electricity));
      add(calcFlat(utility.tvAndMosquito));
      add(calcFlat(utility.gas));
      add(calcFlat(utility.cleaning));
      add(calcFlat(utility.windingUpCleaning));

      // 8. Food
      add(calcQtyRate(food.milk));

      // 9. Linen
      Object.values(linen).forEach((v) => add(calcQtyRate(v)));

      // 10. Consumables
      Object.values(medicalConsumables).forEach((v) => add(calcQtyRate(v)));

      // 11. Monthly Essentials Package
      if (monthlyEssentials.availPackage === "YES") {
        grossTotal += 1000;
      }

      // 14. Billing Summary (Late fees)
      grossTotal += parseFloat(billingSummary.lateFee) || 0;
      grossTotal += parseFloat(billingSummary.lateMaterialFee) || 0;
      grossTotal += parseFloat(billingSummary.previousPending) || 0;
    } else {
        Object.keys(homeFields).forEach((key) => {
          const rate = parseFloat(String(homeFields[key].rate || homeFields[key].rs || "0").replace(/[^0-9.]/g, "")) || 0;
          const hasQty = homeFields[key].qty !== undefined;
          let qty = 1;
          if (hasQty) {
            const qStr = String(homeFields[key].qty).trim();
            qty = qStr === "" ? 0 : (parseFloat(qStr) || 0);
          }
          grossTotal += (qty * rate);
        });
    }

    return { grossTotal, totalSubsidy, netPayable: grossTotal - totalSubsidy };
  };

  const {
    grossTotal: totalAmount,
    totalSubsidy: subsidy,
    netPayable: totalPayable,
  } = calculateTotals();

  const generateHtml = (dynamicBillId?: string) => {
    const generatedAt = new Date();
    const totalsCalculated = calculateTotals();
    const currentMonthName =
      billingMonthYear ||
      `${generatedAt.toLocaleString("default", { month: "long" })} - ${generatedAt.getFullYear()}`;

    const activeBillId = dynamicBillId || billId;

    const htmlEscape = (str: any) =>
      String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const accountHolder =
      paymentInstructions.accountName || "Universal Elder Care";
    const upi = upiId || paymentInstructions.upiId || "universaleldercare@upi";
    const upiUri = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(accountHolder)}&am=${totalPayable.toFixed(2)}&cu=INR&tn=MonthlyPatientInvoice`;
    const qrSrc =
      paymentInstructions.qr ||
      `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;
    const logoSrc = `${window.location.origin}/logo-uec.png`;

    const isValid = (priceObj: any) => {
      if (!priceObj) return false;
      const p = parseFloat(priceObj.price) || 0;
      return p > 0;
    };

    const renderRow = (desc: string, priceObj: any) => {
      if (!isValid(priceObj)) return "";
      const price = parseFloat(priceObj.price) || 0;
      const sub = parseFloat(priceObj.subsidy) || 0;
      const payable = price - sub;
      return `
                <tr>
                    <td>${htmlEscape(desc)}</td>
                    <td class="text-right">Rs ${invoiceMoney(price)}</td>
                    ${billType === "ELDER_CARE" ? `<td class="text-right">Rs ${invoiceMoney(sub)}</td>` : ""}
                    <td class="text-right">Rs ${invoiceMoney(payable)}</td>
                </tr>
            `;
    };

    const renderSection = (title: string, rowsHtml: string) => {
      if (!rowsHtml.trim()) return "";
      return `
                <tr class="section-header">
                    <td colspan="4">${htmlEscape(title)}</td>
                </tr>
                ${rowsHtml}
            `;
    };

    let elderRows = "";

    // 1. Care Staff
    let careRows = "";
    careRows += renderRow(
      `Care Giver (${careStaff.careGiver.shift || "Shift"})`,
      calcFlat(careStaff.careGiver),
    );
    careRows += renderRow(
      `Nursing Care (${careStaff.nursingCare.shift || "Shift"})`,
      calcFlat(careStaff.nursingCare),
    );
    careRows += renderRow(
      `Special Care (${careStaff.specialCare.shift || "Shift"})`,
      calcFlat(careStaff.specialCare),
    );
    careRows += renderRow(
      "Palliative Care",
      calcFlat(careStaff.palliativeCare),
    );
    careRows += renderRow("Dementia Care", calcFlat(careStaff.dementiaCare));
    careRows += renderRow(
      "Alzheimer's Care",
      calcFlat(careStaff.alzheimersCare),
    );
    careRows += renderRow(
      `Dressing (Qty: ${careStaff.dressing.qty })`,
      calcQtyRate(careStaff.dressing),
    );
    careRows += renderRow(
      `First Aid (Qty: ${careStaff.firstAid.qty })`,
      calcQtyRate(careStaff.firstAid),
    );
    elderRows += renderSection("CARE STAFF SERVICES", careRows);

    // 2. Therapy
    let therapyRows = "";
    therapyRows += renderRow("Doctor Visit", calcFlat(therapy.doctorVisit));
    therapyRows += renderRow("Physiotherapy", calcFlat(therapy.physiotherapy));
    therapyRows += renderRow(
      "Occupational Therapy",
      calcFlat(therapy.occupationalTherapy),
    );
    therapyRows += renderRow("Speech Therapy", calcFlat(therapy.speechTherapy));
    therapyRows += renderRow(
      "Geriatric Counseling",
      calcFlat(therapy.geriatricCounseling),
    );
    therapyRows += renderRow(
      "Psychiatric Counseling",
      calcFlat(therapy.psychiatricCounseling),
    );
    therapyRows += renderRow("Yoga", calcFlat(therapy.yoga));
    elderRows += renderSection("THERAPY & CONSULTATION", therapyRows);

    // 3. Medical Support
    let medRows = "";
    medicalSupport.medicines.forEach(
      (m: any) =>
        (medRows += renderRow(
          `Medicine: ${m.name} (Qty: ${m.qty })`,
          calcQtyRate(m),
        )),
    );
    medicalSupport.labTests.forEach(
      (l: any) =>
        (medRows += renderRow(
          `Lab Test: ${l.name} (Qty: ${l.qty })`,
          calcQtyRate(l),
        )),
    );
    medRows += renderRow("ICU at Home", calcFlat(medicalSupport.icuAtHome));
    medicalSupport.surgicalEquipment.forEach(
      (s: any) =>
        (medRows += renderRow(
          `Surgical Eq: ${s.name} (Qty: ${s.qty })`,
          calcQtyRate(s),
        )),
    );
    elderRows += renderSection("MEDICAL SUPPORT", medRows);

    // 4. Transportation
    let transportRows = "";
    transportRows += renderRow("Ambulance", calcFlat(transportation.ambulance));
    transportRows += renderRow("Taxi", calcFlat(transportation.taxi));
    transportRows += renderRow("Auto", calcFlat(transportation.auto));
    transportRows += renderRow(
      "Senior Friendly Cab",
      calcFlat(transportation.seniorCab),
    );
    elderRows += renderSection("TRANSPORTATION", transportRows);

    // 5. Lifestyle
    let lifeRows = "";
    lifeRows += renderRow("Beauty Service", calcFlat(lifestyle.beauty));
    elderRows += renderSection("PERSONAL & LIFESTYLE SERVICES", lifeRows);

    // 6. Accommodation
    let accRows = "";
    accRows += renderRow("Bed Charges", calcFlat(accommodation.bedCharges));
    if (accommodation.upcomingBedCharge.enable === "YES") {
      accRows += renderRow(
        "Upcoming Month Bed Charge",
        calcFlat(accommodation.upcomingBedCharge),
      );
    }
    elderRows += renderSection("ACCOMMODATION", accRows);

    // 7. Utility
    let utilRows = "";
    utility.laundry.forEach(
      (l: any) =>
        (utilRows += renderRow(
          `Laundry (${l.type || "Item"})`,
          calcQtyRate(l),
        )),
    );
    utilRows += renderRow("Electricity", calcFlat(utility.electricity));
    utilRows += renderRow("Gas", calcFlat(utility.gas));
    utilRows += renderRow("TV & Mosquito", calcFlat(utility.tvAndMosquito));
    utilRows += renderRow("Cleaning", calcFlat(utility.cleaning));
    utilRows += renderRow(
      "Winding-up Cleaning",
      calcFlat(utility.windingUpCleaning),
    );
    elderRows += renderSection("LAUNDRY & UTILITY", utilRows);

    // 8. Food
    let foodRows = "";
    foodRows += renderRow(
      `Milk (Qty: ${food.milk.qty })`,
      calcQtyRate(food.milk),
    );
    elderRows += renderSection("FOOD & NUTRITION", foodRows);

    // 9. Linen
    let linenRows = "";
    linenRows += renderRow(
      `New Dress (Qty: ${linen.newDress.qty })`,
      calcQtyRate(linen.newDress),
    );
    linenRows += renderRow(
      `New Towel (Qty: ${linen.newTowel.qty })`,
      calcQtyRate(linen.newTowel),
    );
    linenRows += renderRow(
      `New Bedspread (Qty: ${linen.newBedspread.qty })`,
      calcQtyRate(linen.newBedspread),
    );
    linenRows += renderRow(
      `New Blanket (Qty: ${linen.newBlanket.qty })`,
      calcQtyRate(linen.newBlanket),
    );
    linenRows += renderRow(
      `New Pillow Cover (Qty: ${linen.newPillowCover.qty })`,
      calcQtyRate(linen.newPillowCover),
    );
    linenRows += renderRow(
      `New Airbed (Qty: ${linen.newAirbed.qty })`,
      calcQtyRate(linen.newAirbed),
    );
    linenRows += renderRow(
      `Stitching (Qty: ${linen.stitching.qty })`,
      calcQtyRate(linen.stitching),
    );
    elderRows += renderSection("LINEN & PERSONAL ITEMS", linenRows);

    // 10. Consumables
    let consRows = "";
    consRows += renderRow(
      `Diapers (Qty: ${medicalConsumables.diapers.qty } @${medicalConsumables.diapers.rate})`,
      calcQtyRate(medicalConsumables.diapers),
    );
    consRows += renderRow(
      `Gloves (Qty: ${medicalConsumables.gloves.qty })`,
      calcQtyRate(medicalConsumables.gloves),
    );
    consRows += renderRow(
      `Mask (Qty: ${medicalConsumables.mask.qty })`,
      calcQtyRate(medicalConsumables.mask),
    );
    consRows += renderRow(
      `Under Pad (Qty: ${medicalConsumables.underPad.qty })`,
      calcQtyRate(medicalConsumables.underPad),
    );
    consRows += renderRow(
      `Bed Wipes (Qty: ${medicalConsumables.bedWipes.qty })`,
      calcQtyRate(medicalConsumables.bedWipes),
    );
    consRows += renderRow(
      `Catheter (Qty: ${medicalConsumables.catheter.qty })`,
      calcQtyRate(medicalConsumables.catheter),
    );
    consRows += renderRow(
      `Uro Bag (Qty: ${medicalConsumables.uroBag.qty })`,
      calcQtyRate(medicalConsumables.uroBag),
    );
    consRows += renderRow(
      `Rubber Sheet (Qty: ${medicalConsumables.rubberSheet.qty })`,
      calcQtyRate(medicalConsumables.rubberSheet),
    );
    consRows += renderRow(
      `Oxygen (Qty: ${medicalConsumables.oxygen.qty })`,
      calcQtyRate(medicalConsumables.oxygen),
    );
    consRows += renderRow(
      `Nebulizer (Qty: ${medicalConsumables.nebulizer.qty })`,
      calcQtyRate(medicalConsumables.nebulizer),
    );
    elderRows += renderSection("MEDICAL CONSUMABLES", consRows);

    // Late Fees
    let feesRows = "";
    feesRows += renderRow("Previous Pending", {
      price: billingSummary.previousPending,
      subsidy: 0,
    });
    feesRows += renderRow("Late Fee", {
      price: billingSummary.lateFee,
      subsidy: 0,
    });
    feesRows += renderRow("Late Material Fee", {
      price: billingSummary.lateMaterialFee,
      subsidy: 0,
    });
    elderRows += renderSection("FEES & BALANCES", feesRows);

    // HOME CARE ROWS
    let homeRows = "";
    if (billType === "HOME_CARE") {
        const renderHomeGroup = (keys: string[], title: string) => {
          let grpRows = "";
          keys.forEach((key) => {
            const rate = parseFloat(String(homeFields[key]?.rate || homeFields[key]?.rs || "0").replace(/[^0-9.]/g, "")) || 0;
            const hasQty = homeFields[key]?.qty !== undefined;
            let qty = 1;
            if (hasQty) {
              const qStr = String(homeFields[key].qty).trim();
              qty = qStr === "" ? 0 : (parseFloat(qStr) || 0);
            }
            const price = qty * rate;
            
            if (price > 0 || (rate > 0 && qty > 0)) {
              grpRows += renderRow(
                `${key} ${hasQty && homeFields[key].qty ? "(Qty: " + homeFields[key].qty + ")" : ""}`,
                { price, subsidy: 0 },
              );
            }
          });
          return renderSection(title, grpRows);
        };

      homeRows += renderHomeGroup(
        [
          "Monthly Membership",
          "Quarterly Membership",
          "Half-Yearly Membership",
          "Annual Membership",
          "Silver Membership",
          "Gold Membership",
          "Platinum Membership",
        ],
        "MEMBERSHIP",
      );
      homeRows += renderHomeGroup(
        [
          "Home Nursing",
          "Caregiver",
          "Doctor Visit",
          "Physiotherapy",
          "Occupational Therapy",
          "Speech Therapy",
          "Counseling",
          "Yoga",
          "Palliative Care",
          "Dementia Care",
          "Alzheimer's Care",
        ],
        "SUBSCRIPTION",
      );
      homeRows += renderHomeGroup(
        [
          "Lab Tests",
          "Medicine Delivery",
          "Transport",
          "Ambulance",
          "Beauty Service",
          "Legal Service",
          "Pooja Service",
          "Tours & Travels",
          "Rendering Service",
          "Essentials Service",
        ],
        "OTHER SERVICES",
      );
    }

    const invoiceTableHtml = `
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th style="text-align: left;">Description</th>
                        <th style="text-align: right; width: 100px;">Amount</th>
                        ${billType === "ELDER_CARE" ? `<th style="text-align: right; width: 100px;">UNCF Subsidy</th>` : ""}
                        <th style="text-align: right; width: 100px;">Net Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${billType === "ELDER_CARE" ? elderRows : homeRows}
                </tbody>
            </table>
        `;

    let paymentInfoHtml = "";
    // Payment info is collected for the backend only, not shown on the bill.

    const dispatchItems = [
      { name: "Diapers", qty: materialDispatch.diapers?.qty },
      { name: "Gloves", qty: materialDispatch.gloves?.qty },
      { name: "Mask", qty: materialDispatch.mask?.qty },
      { name: "Under Pad", qty: materialDispatch.underPad?.qty },
      { name: "Rubber Sheet", qty: materialDispatch.rubberSheet?.qty },
    ].filter((item) => parseFloat(item.qty as string) > 0);

    let dispatchHtml = "";
    if (dispatchItems.length > 0) {
      const rows = dispatchItems
        .map(
          (item) =>
            `<tr><td>${htmlEscape(item.name)}</td><td>${htmlEscape(item.qty as string)} Nos</td></tr>`,
        )
        .join("");

      dispatchHtml = `
            <div class="mt-4" style="border: 1px solid #dbe5ef; border-radius: 6px; padding: 14px; background: #fafcff; margin-bottom: 24px;">
                <h3 style="margin: 0 0 10px; color: #334155; font-size: 11px; text-transform: uppercase; letter-spacing: .06em;">Materials to be Sent Before 5th of Every Month</h3>
                <table class="patient-table">
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    return `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${billType === "ELDER_CARE" ? "ELDER CARE" : "HOME CARE"} PATIENT CONTRIBUTION - ${htmlEscape(patientName)}</title>
    <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #fff; color: #172033; font-family: "Times New Roman", Times, serif; font-size: 11px; }
        .sheet { width: 670px; margin: 0 auto; background: #fff; padding: 22px; }
        tr, .panel, .box, .payment-total, .footer { page-break-inside: avoid; break-inside: avoid; }
        
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f766e; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { display: flex; flex-direction: column; align-items: flex-start; }
        .logo { width: 220px; height: auto; object-fit: contain; }
        h1 { margin: 0; font-size: 18px; color: #0f2f3f; }
        .muted { color: #64748b; line-height: 1.45; }
        .title { text-align: right; background: #0f766e; color: white; padding: 12px 24px; border-radius: 8px 0 8px 0; box-shadow: 0 4px 6px -1px rgba(15, 118, 110, 0.2); }
        .title h2 { margin: 0; font-size: 16px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge { display: inline-block; margin-top: 8px; border-radius: 999px; padding: 5px 12px; background: #ecfdf5; color: #047857; font-weight: 800; text-transform: uppercase; font-size: 10px; }
        
        .profile-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; border: 1px solid #dbe5ef; }
        .profile-table td { padding: 8px; border: 1px solid #dbe5ef; font-size: 11px; }
        .profile-table td:nth-child(odd) { font-weight: bold; background: #f8fafc; color: #334155; width: 25%; }
        .profile-table td:nth-child(even) { width: 25%; }

        .panel { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
        .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; background: #f8fafc; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .box h3 { margin: 0 0 12px; color: #0f766e; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
        
        .patient-table { width: 100%; border-collapse: collapse; }
        .patient-table td { padding: 6px 0; font-size: 11px; border-bottom: 1px dashed #e2e8f0; }
        .patient-table tr:last-child td { border-bottom: none; }
        .patient-table td:first-child { width: 120px; color: #475569; font-weight: bold; }
        .patient-table td:last-child { font-weight: bold; color: #0f172a; }

        .invoice-table { width: 100%; border-collapse: collapse; margin-top: 24px; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1; }
        .invoice-table th, .invoice-table td { padding: 10px 12px; font-size: 11px; border: 1px solid #e2e8f0; }
        .invoice-table th { background: #0f766e; font-weight: bold; color: #ffffff; border-color: #0f766e; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
        .invoice-table tr:nth-child(even) { background-color: #f8fafc; }
        .invoice-table tr.section-header td { background: #ccfbf1 !important; font-weight: bold; color: #115e59; text-transform: uppercase; letter-spacing: .05em; text-align: left; padding: 12px; border-top: 2px solid #99f6e4; border-bottom: 2px solid #99f6e4; }
        
        .totals-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; border: 1px solid #cbd5e1; }
        .totals-table td { padding: 10px 12px; border: 1px solid #e2e8f0; font-size: 12px; }
        .totals-table tr.grand-total td { background: #047857; font-weight: bold; color: #ffffff; border-color: #047857; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em; }
        
        .payment-table { width: 100%; border-collapse: collapse; }
        .payment-table td { padding: 6px 12px; border: 1px solid #e2e8f0; font-size: 11px; background: #f8fafc; }

        .payment-total { display: grid; grid-template-columns: 1fr 220px; gap: 24px; align-items: stretch; margin-top: 24px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .qr { text-align: center; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; background: #ffffff; }
        .qr img { width: 180px; height: 180px; object-fit: contain; }
        
        .footer { display: grid; grid-template-columns: 1fr 220px; gap: 18px; margin-top: 32px; border-top: 2px solid #e2e8f0; padding-top: 20px; font-size: 10px; }
        .signature { height: 72px; border-bottom: 1px solid #94a3b8; display: flex; align-items: end; justify-content: center; color: #64748b; font-weight: 700; }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .italic { font-style: italic; }
        .mt-2 { margin-top: 8px; }
        .mt-3 { margin-top: 12px; }
        .mt-4 { margin-top: 16px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="header">
            <div class="brand">
                <img class="logo" src="${htmlEscape(logoSrc)}" />
            </div>
            <div class="title">
                <h2>${billType === "ELDER_CARE" ? "ELDER CARE" : "HOME CARE"} PATIENT CONTRIBUTION</h2>
            </div>
        </div>

        <div class="panel">
            <div class="box">
                <h3>Elder Details</h3>
                <table class="patient-table">
                    <tbody>
                        ${patientName ? `<tr><td>Patient Name</td><td>${htmlEscape(patientName)}</td></tr>` : ""}
                        ${patientAge ? `<tr><td>Age</td><td>${htmlEscape(patientAge)}</td></tr>` : ""}
                        ${patientSex ? `<tr><td>Sex</td><td>${htmlEscape(patientSex)}</td></tr>` : ""}
                        ${patientDob ? `<tr><td>DOB</td><td>${htmlEscape(patientDob)}</td></tr>` : ""}
                        ${membershipPlan ? `<tr><td>Membership Plan</td><td>${htmlEscape(membershipPlan)}</td></tr>` : ""}
                        ${membershipCategory ? `<tr><td>Membership Category</td><td>${htmlEscape(membershipCategory)}</td></tr>` : ""}
                        ${contractStartDate ? `<tr><td>Service Contract Start Date</td><td>${htmlEscape(contractStartDate)}</td></tr>` : ""}
                        ${contractEndDate ? `<tr><td>Service Contract End Date</td><td>${htmlEscape(contractEndDate)}</td></tr>` : ""}
                        ${patientId ? `<tr><td>Patient ID</td><td>${htmlEscape(patientId)}</td></tr>` : ""}
                        ${elderId ? `<tr><td>Elder ID</td><td>${htmlEscape(elderId)}</td></tr>` : ""}
                        ${(bedSharing && billType === "ELDER_CARE") ? `<tr><td>Bed Sharing</td><td>${htmlEscape(bedSharing)}</td></tr>` : ""}
                        <tr><td>Service Type</td><td>${htmlEscape(billType.replace("_", " "))}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="box">
                <h3>Guardian Details</h3>
                <table class="patient-table">
                    <tbody>
                        ${activeBillId ? `<tr><td>Bill ID</td><td>${htmlEscape(activeBillId)}</td></tr>` : ""}
                        <tr><td>Bill Date</td><td>${htmlEscape(generatedAt.toLocaleDateString())}</td></tr>
                        ${guardianName ? `<tr><td>Guardian Name</td><td>${htmlEscape(guardianName)}</td></tr>` : ""}
                        ${guardianContact ? `<tr><td>Contact Number</td><td>${htmlEscape(guardianContact)}</td></tr>` : ""}
                        ${(() => {
                          const parts = [
                            guardianAddress.flat && `<div style="padding: 2px 0;"><span style="color: #64748b; margin-right: 4px;">Flat / House No. :</span> ${htmlEscape(guardianAddress.flat)}</div>`,
                            guardianAddress.building && `<div style="padding: 2px 0;"><span style="color: #64748b; margin-right: 4px;">Building :</span> ${htmlEscape(guardianAddress.building)}</div>`,
                            guardianAddress.street && `<div style="padding: 2px 0;"><span style="color: #64748b; margin-right: 4px;">Street :</span> ${htmlEscape(guardianAddress.street)}</div>`,
                            guardianAddress.area && `<div style="padding: 2px 0;"><span style="color: #64748b; margin-right: 4px;">Area :</span> ${htmlEscape(guardianAddress.area)}</div>`,
                            guardianAddress.city && `<div style="padding: 2px 0;"><span style="color: #64748b; margin-right: 4px;">City :</span> ${htmlEscape(guardianAddress.city)}</div>`,
                            guardianAddress.district && `<div style="padding: 2px 0;"><span style="color: #64748b; margin-right: 4px;">District :</span> ${htmlEscape(guardianAddress.district)}</div>`,
                            guardianAddress.state && `<div style="padding: 2px 0;"><span style="color: #64748b; margin-right: 4px;">State :</span> ${htmlEscape(guardianAddress.state)}</div>`,
                            guardianAddress.pin && `<div style="padding: 2px 0;"><span style="color: #64748b; margin-right: 4px;">PIN Code :</span> ${htmlEscape(guardianAddress.pin)}</div>`
                          ].filter(Boolean);
                          return parts.length > 0 
                            ? `<tr><td colspan="2"><div style="margin-bottom: 6px; font-weight: bold; color: #64748b;">Address</div><div style="display: grid; grid-template-columns: 1fr 1fr; font-weight: normal; font-size: 11px; margin-left: 2px;">${parts.join("")}</div></td></tr>` 
                            : "";
                        })()}
                        <tr><td>Billing Month</td><td>${htmlEscape(currentMonthName)}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        ${invoiceTableHtml}

        <table class="totals-table">
            <tbody>
                <tr>
                    <td><strong>Gross Total Amount</strong></td>
                    <td class="text-right"><strong>Rs ${htmlEscape(invoiceMoney(totalsCalculated.grossTotal))}</strong></td>
                </tr>
                ${totalsCalculated.totalSubsidy > 0 ? `
                <tr>
                    <td style="color: #ea580c;"><strong>UNCF Subsidy Amount</strong></td>
                    <td class="text-right" style="color: #ea580c;"><strong>- Rs ${htmlEscape(invoiceMoney(totalsCalculated.totalSubsidy))}</strong></td>
                </tr>` : ""}
                <tr class="grand-total">
                    <td>Total Payable Amount</td>
                    <td class="text-right">Rs ${htmlEscape(invoiceMoney(totalsCalculated.netPayable))}</td>
                </tr>
            </tbody>
        </table>

        ${dispatchHtml}

        ${paymentInfoHtml}

        <div class="mt-4" style="font-size: 14px; line-height: 1.5;">
            <div class="bold italic" style="font-size: 16px;">Feedbacks and issues:</div>
            <div class="mt-1">Please write letter (post or direct letter to UEC) and mail <span class="bold">universaleldercare2010@gmail.com</span>.<br/>Please follow up with us, within one or two weeks issues or queries are cleared.</div>
            <div class="mt-2 mb-2 italic" style="font-size: 14px">It will be kind enough if we receive the payments within "5th of every month", it will be supportive to get the materials.<br/>After 7th of every month, late payment will be collected.</div>
            
            <div class="bold mt-3" style="color: #b91c1c; font-size: 14px;">IF PAYMENT RECEIPT HAVEN'T SENT TO THE SAME NUMBER, IT WON'T BE ACCOUNTABLE.<br/>THE AMOUNT WILL BE ADDED IN NEXT MONTH BILL.</div>
            <div class="bold mt-1" style="color: #b91c1c; font-size: 14px;">பணம் செலுத்தும் ரசீது இந்த எண்ணுக்கு அனுப்பப்படாவிட்டால், அது கணக்கிடப்படாது,<br/>அடுத்த மாத கணக்கில் தொகை சேர்க்கப்படும்.</div>
        </div>

        <div class="payment-total">
            <div>
                <div class="bold">Payment facilities:</div>
                <div>Net banking or <span class="bold">UPI Google pay, PhonePe</span></div>
                <div class="bold mt-2">After payment kindly send:</div>
                <div style="margin-left: 12px;">
                    1) transfer id<br/>
                    2) screenshot of payment<br/>
                    3) transferred date<br/>
                    4) transferred amount
                </div>
            </div>
            <div class="qr">
                <img src="${htmlEscape(qrSrc)}" />
                <div class="bold mt-2">UPI QR Code</div>
                <div style="font-size: 10px; color: #64748b;">${htmlEscape(upi)}</div>
            </div>
        </div>

        <div class="footer" style="display: block; text-align: center; margin-top: 40px; color: #64748b; font-size: 12px; font-style: italic; border-top: 1px solid #dbe5ef; padding-top: 16px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #334155;">Terms & Conditions</div>
            <div style="margin-bottom: 12px; font-size: 10px;">Once generated and finalized, NO revisions or corrections are allowed.</div>
            This is a system generated bill.
        </div>
    </div>
    <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
  };

  const openPreview = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(generateHtml());
      win.document.close();
    }
  };

  const openWhatsApp = async () => {
    if (!guardianContact) {
      alert("Please enter a Guardian Contact number before sending.");
      return;
    }

    setIsSending(true);
    try {
      const message = [
        `Dear ${guardianName || "Family"},`,
        "",
        `Please find the ${billType === "ELDER_CARE" ? "Elder Care" : "Home Care"} bill for ${patientName || "the patient"} for ${billingMonthYear || "this month"}.`,
        "",
        `Amount Due: ${invoiceMoney(totalPayable)}`,
        "",
        `*(Please see the attached PDF invoice for the detailed breakdown)*`,
        "",
        "Regards,",
        "Universal Elder Care",
      ].join("\n");

      // Create temporary container for PDF generation
      const element = document.createElement("div");
      element.innerHTML = generateHtml();

      // html2pdf options
      const opt: any = {
        margin: 16,
        filename: "Patient_Bill.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 670 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      // Generate blob
      const pdfBlob = await html2pdf().set(opt).from(element).output("blob");

      // Download PDF automatically
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Patient_Bill.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Open WhatsApp Web with text
      const target = guardianContact
        ? `https://wa.me/${guardianContact.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(target, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const markAsSent = async () => {
    if (!generatedInvoiceId) return alert("Please click Final Print to generate and lock the bill first.");
    setIsSending(true);
    try {
      await api.patch(`/uec/billing/${generatedInvoiceId}/mark-sent`);
      setIsMarkedSent(true);
      alert("Bill has been successfully marked as sent!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to mark as sent: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Manual Billing Generator"
        subtitle="Generate instant PDF invoices with dynamic structures."
        breadcrumbs={[{ label: "Finance" }, { label: "Manual Billing" }]}
      />

      <div className="flex-1 overflow-auto bg-[#F5F8FA] p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Mode Toggle */}
          <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex gap-4 border-b border-slate-200 pb-4">
              <button
                onClick={() => setBillType("ELDER_CARE")}
                className={`rounded-lg px-4 py-2 font-bold ${billType === "ELDER_CARE" ? "bg-[#0F969C] text-white" : "bg-slate-100 text-slate-600"}`}
              >
                Elder Care Bill
              </button>
              <button
                onClick={() => setBillType("HOME_CARE")}
                className={`rounded-lg px-4 py-2 font-bold ${billType === "HOME_CARE" ? "bg-[#0F969C] text-white" : "bg-slate-100 text-slate-600"}`}
              >
                Home Care Bill
              </button>
            </div>

            {/* Patient & Guardian Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col space-y-5">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2">
                  Patient Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Field
                          label="Elder Name / Guest Name (with Initials)"
                          value={patientName}
                          onChange={(val: string) => { setPatientName(val); setPatientSearchStatus('idle'); }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleResolvePatient}
                        className="h-10 px-4 bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200 rounded-lg hover:bg-slate-200 whitespace-nowrap transition-colors"
                      >
                        Resolve Patient
                      </button>
                    </div>
                    {patientSearchStatus === 'searching' && <p className="text-xs text-slate-500 mt-2 font-semibold">Resolving patient...</p>}
                    {patientSearchStatus === 'not-found' && (
                      <div className="mt-2 rounded bg-amber-50 p-3 border border-gray-100">
                        <p className="text-sm text-slate-900 font-extrabold mb-2 font-semibold">No existing patient found with this name.</p>
                        <button type="button" onClick={handleCreatePatient} className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded font-bold transition-colors">Create New Patient</button>
                      </div>
                    )}
                    {patientSearchStatus === 'found-multiple' && (
                      <div className="mt-2 rounded bg-blue-50 p-3 border border-blue-200">
                        <p className="text-sm text-blue-800 mb-2 font-semibold">Multiple patients found. Please select one or create new:</p>
                        <div className="flex flex-col gap-2">
                          {searchResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setPatientId(p.id);
                                setElderId(p.elderId || '');
                                if (p.age) setPatientAge(String(p.age));
                                if (p.gender) setPatientSex(p.gender);
                                setPatientSearchStatus('found-single');
                              }}
                              className="flex justify-between items-center text-left bg-white p-2 rounded border border-blue-100 hover:border-blue-300 text-xs transition-colors"
                            >
                              <span className="font-bold text-slate-700">{p.name}</span>
                              <span className="text-slate-500 font-medium">Ph: {p.phone || 'N/A'}</span>
                              <span className="text-[#0F969C] 600 font-mono font-bold">{p.elderId || 'No Elder ID'}</span>
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={handleCreatePatient} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-bold transition-colors">Create New Patient Instead</button>
                      </div>
                    )}
                    {patientSearchStatus === 'found-single' && (
                      <p className="text-xs text-emerald-600 font-bold mt-2">Patient resolved successfully.</p>
                    )}
                    {patientSearchStatus === 'created' && (
                      <p className="text-xs text-emerald-600 font-bold mt-2">New patient created successfully.</p>
                    )}
                  </div>
                  <Field
                    label="Elder Age"
                    placeholder="e.g. 75"
                    value={patientAge}
                    onChange={setPatientAge}
                  />
                  <Select
                    label="Elder Sex"
                    value={patientSex}
                    onChange={setPatientSex}
                    options={["Male", "Female", "Other"]}
                  />
                  <Field
                    label="DOB"
                    type="date"
                    value={patientDob}
                    onChange={setPatientDob}
                  />
                  <Field
                    label="Patient ID (UUID)"
                    value={patientId}
                    onChange={setPatientId}
                  />
                  <Field
                    label="Elder ID (Auto-generated)"
                    value={elderId}
                    disabled={true}
                  />
                  <Field
                    label="Contract Start Date"
                    type="date"
                    value={contractStartDate}
                    onChange={setContractStartDate}
                  />
                  <Field
                    label="Contract End Date"
                    type="date"
                    value={contractEndDate}
                    onChange={setContractEndDate}
                  />
                  <Select
                    label="Membership Plan"
                    value={membershipPlan}
                    onChange={setMembershipPlan}
                    options={["Monthly", "Quarterly", "Half-Yearly", "Annual"]}
                  />
                  <Select
                    label="Membership Category"
                    value={membershipCategory}
                    onChange={setMembershipCategory}
                    options={["Silver", "Gold", "Platinum"]}
                  />
                  {billType === "ELDER_CARE" && (
                    <Select
                      label="Bed Sharing"
                      value={bedSharing}
                      onChange={setBedSharing}
                      options={["Single Sharing", "Double Sharing", "Four Sharing"]}
                    />
                  )}
                </div>
              </div>
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col space-y-5">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2">
                  Guardian Details & Bill Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Guardian Name"
                    value={guardianName}
                    onChange={setGuardianName}
                  />
                  <Field
                    label="Guardian Contact"
                    value={guardianContact}
                    onChange={setGuardianContact}
                  />
                  <div className="col-span-2">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Guardian Address
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Field label="Flat / House No." value={guardianAddress.flat} onChange={(v: string) => setGuardianAddress({ ...guardianAddress, flat: v })} />
                      <Field label="Building" value={guardianAddress.building} onChange={(v: string) => setGuardianAddress({ ...guardianAddress, building: v })} />
                      <Field label="Street" value={guardianAddress.street} onChange={(v: string) => setGuardianAddress({ ...guardianAddress, street: v })} />
                      <Field label="Area" value={guardianAddress.area} onChange={(v: string) => setGuardianAddress({ ...guardianAddress, area: v })} />
                      <Field label="City" value={guardianAddress.city} onChange={(v: string) => setGuardianAddress({ ...guardianAddress, city: v })} />
                      <Field label="District" value={guardianAddress.district} onChange={(v: string) => setGuardianAddress({ ...guardianAddress, district: v })} />
                      <Field label="State" value={guardianAddress.state} onChange={(v: string) => setGuardianAddress({ ...guardianAddress, state: v })} />
                      <Field label="PIN Code" value={guardianAddress.pin} onChange={(v: string) => setGuardianAddress({ ...guardianAddress, pin: v })} />
                    </div>
                  </div>
                  <Field label="Bill ID" value={billId || "Auto-generated on save"} disabled={true} />
                  <Field
                    label="Billing Month & Year"
                    placeholder="August - 2026"
                    value={billingMonthYear}
                    onChange={setBillingMonthYear}
                  />
                  <Select
                    label="Billing Frequency"
                    value={billingFrequency}
                    onChange={setBillingFrequency}
                    options={["Monthly", "Daily"]}
                  />
                  {billingFrequency === "Daily" && (
                    <Field
                      label="Number of Days"
                      type="number"
                      value={billingDays}
                      onChange={setBillingDays}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-6">
              <Field
                label="UPI ID for Payment QR"
                value={upiId}
                onChange={setUpiId}
                placeholder="universaleldercare@upi"
              />
            </div>
          </div>

          {billType === "ELDER_CARE" && (
            <div className="space-y-6">
              {/* 1. Care Staff Services */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  1. Care Staff Services
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg">
                    <div className="mb-2">
                      <Select
                        label="Care Giver Shift"
                        value={careStaff.careGiver.shift}
                        onChange={(v: any) =>
                          setCareStaff({
                            ...careStaff,
                            careGiver: { ...careStaff.careGiver, shift: v },
                          })
                        }
                        options={["Day", "Night", "24/7"]}
                      />
                    </div>
                    <SubsidyField
                      label="Care Giver"
                      priceObj={careStaff.careGiver}
                      onChange={(v: any) =>
                        setCareStaff({
                          ...careStaff,
                          careGiver: { ...careStaff.careGiver, ...v },
                        })
                      }
                    />
                  </div>
                  <div className="col-span-1 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg">
                    <div className="mb-2">
                      <Select
                        label="Nursing Care Shift"
                        value={careStaff.nursingCare.shift}
                        onChange={(v: any) =>
                          setCareStaff({
                            ...careStaff,
                            nursingCare: { ...careStaff.nursingCare, shift: v },
                          })
                        }
                        options={["Day", "Night", "24/7"]}
                      />
                    </div>
                    <SubsidyField
                      label="Nursing Care"
                      priceObj={careStaff.nursingCare}
                      onChange={(v: any) =>
                        setCareStaff({
                          ...careStaff,
                          nursingCare: { ...careStaff.nursingCare, ...v },
                        })
                      }
                    />
                  </div>
                  <div className="col-span-1 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg">
                    <div className="mb-2">
                      <Select
                        label="Special Care Shift"
                        value={careStaff.specialCare.shift}
                        onChange={(v: any) =>
                          setCareStaff({
                            ...careStaff,
                            specialCare: { ...careStaff.specialCare, shift: v },
                          })
                        }
                        options={["Day", "Night", "24/7"]}
                      />
                    </div>
                    <SubsidyField
                      label="Special Care"
                      priceObj={careStaff.specialCare}
                      onChange={(v: any) =>
                        setCareStaff({
                          ...careStaff,
                          specialCare: { ...careStaff.specialCare, ...v },
                        })
                      }
                    />
                  </div>
                  <SubsidyField
                    label="Palliative Care"
                    priceObj={careStaff.palliativeCare}
                    onChange={(v: any) =>
                      setCareStaff({ ...careStaff, palliativeCare: v })
                    }
                  />
                  <SubsidyField
                    label="Dementia Care"
                    priceObj={careStaff.dementiaCare}
                    onChange={(v: any) =>
                      setCareStaff({ ...careStaff, dementiaCare: v })
                    }
                  />
                  <SubsidyField
                    label="Alzheimer's Care"
                    priceObj={careStaff.alzheimersCare}
                    onChange={(v: any) =>
                      setCareStaff({ ...careStaff, alzheimersCare: v })
                    }
                  />

                  <div className="col-span-1 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg">
                    <Field
                      label="Dressing (Qty)"
                      value={careStaff.dressing.qty}
                      onChange={(v: any) =>
                        setCareStaff({
                          ...careStaff,
                          dressing: { ...careStaff.dressing, qty: v },
                        })
                      }
                    />
                    <SubsidyField
                      label="Dressing (Rate)"
                      priceObj={careStaff.dressing}
                      onChange={(v: any) =>
                        setCareStaff({
                          ...careStaff,
                          dressing: { ...careStaff.dressing, ...v },
                        })
                      }
                    />
                  </div>
                  <div className="col-span-1 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg">
                    <Field
                      label="First Aid (Qty)"
                      value={careStaff.firstAid.qty}
                      onChange={(v: any) =>
                        setCareStaff({
                          ...careStaff,
                          firstAid: { ...careStaff.firstAid, qty: v },
                        })
                      }
                    />
                    <SubsidyField
                      label="First Aid (Rate)"
                      priceObj={careStaff.firstAid}
                      onChange={(v: any) =>
                        setCareStaff({
                          ...careStaff,
                          firstAid: { ...careStaff.firstAid, ...v },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 2. Therapy & Consultation */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  2. Therapy & Consultation
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <SubsidyField
                    label="Doctor Visit"
                    priceObj={therapy.doctorVisit}
                    onChange={(v: any) =>
                      setTherapy({ ...therapy, doctorVisit: v })
                    }
                  />
                  <SubsidyField
                    label="Physiotherapy"
                    priceObj={therapy.physiotherapy}
                    onChange={(v: any) =>
                      setTherapy({ ...therapy, physiotherapy: v })
                    }
                  />
                  <SubsidyField
                    label="Occupational Therapy"
                    priceObj={therapy.occupationalTherapy}
                    onChange={(v: any) =>
                      setTherapy({ ...therapy, occupationalTherapy: v })
                    }
                  />
                  <SubsidyField
                    label="Speech Therapy"
                    priceObj={therapy.speechTherapy}
                    onChange={(v: any) =>
                      setTherapy({ ...therapy, speechTherapy: v })
                    }
                  />
                  <SubsidyField
                    label="Geriatric Counseling"
                    priceObj={therapy.geriatricCounseling}
                    onChange={(v: any) =>
                      setTherapy({ ...therapy, geriatricCounseling: v })
                    }
                  />
                  <SubsidyField
                    label="Psychiatric Counseling"
                    priceObj={therapy.psychiatricCounseling}
                    onChange={(v: any) =>
                      setTherapy({ ...therapy, psychiatricCounseling: v })
                    }
                  />
                  <SubsidyField
                    label="Yoga"
                    priceObj={therapy.yoga}
                    onChange={(v: any) => setTherapy({ ...therapy, yoga: v })}
                  />
                </div>
              </div>

              {/* 3. Medical Support */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  3. Medical Support
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center border-b pb-2 mb-2">
                      <h4 className="font-bold text-slate-600 text-xs">
                        Medicines
                      </h4>
                      <button
                        className="text-xs text-[#0F969C] 600 font-bold"
                        onClick={() =>
                          setMedicalSupport({
                            ...medicalSupport,
                            medicines: [
                              ...medicalSupport.medicines,
                              {
                                id: Date.now(),
                                name: "",
                                qty: "",
                                rate: "",
                                subsidy: "",
                              },
                            ],
                          })
                        }
                      >
                        + Add Medicine
                      </button>
                    </div>
                    <div className="space-y-2">
                      {medicalSupport.medicines.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-5 gap-2 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg"
                        >
                          <div className="col-span-2">
                            <Field
                              label="Name"
                              value={item.name}
                              onChange={(v: any) => {
                                const newArr = [...medicalSupport.medicines];
                                newArr[idx].name = v;
                                setMedicalSupport({
                                  ...medicalSupport,
                                  medicines: newArr,
                                });
                              }}
                            />
                          </div>
                          <Field
                            label="Qty"
                            value={item.qty}
                            onChange={(v: any) => {
                              const newArr = [...medicalSupport.medicines];
                              newArr[idx].qty = v;
                              setMedicalSupport({
                                ...medicalSupport,
                                medicines: newArr,
                              });
                            }}
                          />
                          <Field
                            label="Rate"
                            value={item.rate}
                            onChange={(v: any) => {
                              const newArr = [...medicalSupport.medicines];
                              newArr[idx].rate = v;
                              setMedicalSupport({
                                ...medicalSupport,
                                medicines: newArr,
                              });
                            }}
                          />
                          <Field
                            label="Subsidy"
                            value={item.subsidy}
                            onChange={(v: any) => {
                              const newArr = [...medicalSupport.medicines];
                              newArr[idx].subsidy = v;
                              setMedicalSupport({
                                ...medicalSupport,
                                medicines: newArr,
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center border-b pb-2 mb-2 mt-4">
                      <h4 className="font-bold text-slate-600 text-xs">
                        Lab Tests
                      </h4>
                      <button
                        className="text-xs text-[#0F969C] 600 font-bold"
                        onClick={() =>
                          setMedicalSupport({
                            ...medicalSupport,
                            labTests: [
                              ...medicalSupport.labTests,
                              {
                                id: Date.now(),
                                name: "",
                                qty: "",
                                rate: "",
                                subsidy: "",
                              },
                            ],
                          })
                        }
                      >
                        + Add Lab Test
                      </button>
                    </div>
                    <div className="space-y-2">
                      {medicalSupport.labTests.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-5 gap-2 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg"
                        >
                          <div className="col-span-2">
                            <Field
                              label="Name"
                              value={item.name}
                              onChange={(v: any) => {
                                const newArr = [...medicalSupport.labTests];
                                newArr[idx].name = v;
                                setMedicalSupport({
                                  ...medicalSupport,
                                  labTests: newArr,
                                });
                              }}
                            />
                          </div>
                          <Field
                            label="Qty"
                            value={item.qty}
                            onChange={(v: any) => {
                              const newArr = [...medicalSupport.labTests];
                              newArr[idx].qty = v;
                              setMedicalSupport({
                                ...medicalSupport,
                                labTests: newArr,
                              });
                            }}
                          />
                          <Field
                            label="Rate"
                            value={item.rate}
                            onChange={(v: any) => {
                              const newArr = [...medicalSupport.labTests];
                              newArr[idx].rate = v;
                              setMedicalSupport({
                                ...medicalSupport,
                                labTests: newArr,
                              });
                            }}
                          />
                          <Field
                            label="Subsidy"
                            value={item.subsidy}
                            onChange={(v: any) => {
                              const newArr = [...medicalSupport.labTests];
                              newArr[idx].subsidy = v;
                              setMedicalSupport({
                                ...medicalSupport,
                                labTests: newArr,
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <SubsidyField
                      label="ICU at Home"
                      priceObj={medicalSupport.icuAtHome}
                      onChange={(v: any) =>
                        setMedicalSupport({ ...medicalSupport, icuAtHome: v })
                      }
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center border-b pb-2 mb-2 mt-4">
                      <h4 className="font-bold text-slate-600 text-xs">
                        Surgical Equipment Rental
                      </h4>
                      <button
                        className="text-xs text-[#0F969C] 600 font-bold"
                        onClick={() =>
                          setMedicalSupport({
                            ...medicalSupport,
                            surgicalEquipment: [
                              ...medicalSupport.surgicalEquipment,
                              {
                                id: Date.now(),
                                name: "",
                                qty: "",
                                type: "",
                                rate: "",
                                subsidy: "",
                              },
                            ],
                          })
                        }
                      >
                        + Add Equipment
                      </button>
                    </div>
                    <div className="space-y-2">
                      {medicalSupport.surgicalEquipment.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-5 gap-2 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg"
                        >
                          <div className="col-span-2">
                            <Field
                              label="Name"
                              value={item.name}
                              onChange={(v: any) => {
                                const newArr = [
                                  ...medicalSupport.surgicalEquipment,
                                ];
                                newArr[idx].name = v;
                                setMedicalSupport({
                                  ...medicalSupport,
                                  surgicalEquipment: newArr,
                                });
                              }}
                            />
                          </div>
                          <Field
                            label="Qty"
                            value={item.qty}
                            onChange={(v: any) => {
                              const newArr = [
                                ...medicalSupport.surgicalEquipment,
                              ];
                              newArr[idx].qty = v;
                              setMedicalSupport({
                                ...medicalSupport,
                                surgicalEquipment: newArr,
                              });
                            }}
                          />
                          <Field
                            label="Rate"
                            value={item.rate}
                            onChange={(v: any) => {
                              const newArr = [
                                ...medicalSupport.surgicalEquipment,
                              ];
                              newArr[idx].rate = v;
                              setMedicalSupport({
                                ...medicalSupport,
                                surgicalEquipment: newArr,
                              });
                            }}
                          />
                          <Field
                            label="Subsidy"
                            value={item.subsidy}
                            onChange={(v: any) => {
                              const newArr = [
                                ...medicalSupport.surgicalEquipment,
                              ];
                              newArr[idx].subsidy = v;
                              setMedicalSupport({
                                ...medicalSupport,
                                surgicalEquipment: newArr,
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Transportation */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  4. Transportation
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <SubsidyField
                    label="Ambulance"
                    priceObj={transportation.ambulance}
                    onChange={(v: any) =>
                      setTransportation({ ...transportation, ambulance: v })
                    }
                  />
                  <SubsidyField
                    label="Taxi"
                    priceObj={transportation.taxi}
                    onChange={(v: any) =>
                      setTransportation({ ...transportation, taxi: v })
                    }
                  />
                  <SubsidyField
                    label="Auto"
                    priceObj={transportation.auto}
                    onChange={(v: any) =>
                      setTransportation({ ...transportation, auto: v })
                    }
                  />
                  <SubsidyField
                    label="Senior Friendly Cab"
                    priceObj={transportation.seniorCab}
                    onChange={(v: any) =>
                      setTransportation({ ...transportation, seniorCab: v })
                    }
                  />
                </div>
              </div>

              {/* 5. Personal & Lifestyle */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  5. Personal & Lifestyle
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <SubsidyField
                    label="Beauty Service"
                    priceObj={lifestyle.beauty}
                    onChange={(v: any) =>
                      setLifestyle({ ...lifestyle, beauty: v })
                    }
                  />
                </div>
              </div>

              {/* 6. Accommodation */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  6. Accommodation
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <SubsidyField
                    label="Bed Charges"
                    priceObj={accommodation.bedCharges}
                    onChange={(v: any) =>
                      setAccommodation({ ...accommodation, bedCharges: v })
                    }
                  />
                  <div className="col-span-1 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg">
                    <div className="mb-2">
                      <Select
                        label="Upcoming Bed Charge?"
                        value={accommodation.upcomingBedCharge.enable}
                        onChange={(v: any) =>
                          setAccommodation({
                            ...accommodation,
                            upcomingBedCharge: {
                              ...accommodation.upcomingBedCharge,
                              enable: v,
                            },
                          })
                        }
                        options={["NO", "YES"]}
                      />
                    </div>
                    {accommodation.upcomingBedCharge.enable === "YES" && (
                      <SubsidyField
                        label="Amount"
                        priceObj={accommodation.upcomingBedCharge}
                        onChange={(v: any) =>
                          setAccommodation({
                            ...accommodation,
                            upcomingBedCharge: {
                              ...accommodation.upcomingBedCharge,
                              ...v,
                            },
                          })
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 7. Laundry & Utility */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  7. Laundry & Utility
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-4 border p-4 bg-slate-50 rounded mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-600 text-xs">
                        Laundry Service
                      </h4>
                      <button
                        className="text-xs text-[#0F969C] 600 font-bold"
                        onClick={() =>
                          setUtility({
                            ...utility,
                            laundry: [
                              ...utility.laundry,
                              {
                                id: Date.now(),
                                type: "",
                                qty: "",
                                rate: "",
                                subsidy: "",
                              },
                            ],
                          })
                        }
                      >
                        + Add Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {utility.laundry.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="grid grid-cols-4 gap-2 border p-2 bg-white rounded"
                        >
                          <Select
                            label="Type"
                            value={item.type}
                            onChange={(v: any) => {
                              const newArr = [...utility.laundry];
                              newArr[idx].type = v;
                              if (
                                v === "Shirt" ||
                                v === "Trouser" ||
                                v === "Towel" ||
                                v === "Gown" ||
                                v === "Night Dress" ||
                                v === "Petticoat / Inskirt"
                              )
                                newArr[idx].rate = "10";
                              if (
                                v === "Urine-Soiled Garment" ||
                                v === "Bedsheet / Bedspread"
                              )
                                newArr[idx].rate = "20";
                              if (v === "Urine-Soiled Bedsheet")
                                newArr[idx].rate = "30";
                              setUtility({ ...utility, laundry: newArr });
                            }}
                            options={[
                              "Shirt",
                              "Trouser",
                              "Towel",
                              "Gown",
                              "Night Dress",
                              "Petticoat / Inskirt",
                              "Urine-Soiled Garment",
                              "Bedsheet / Bedspread",
                              "Urine-Soiled Bedsheet",
                            ]}
                          />
                          <Field
                            label="Qty"
                            value={item.qty}
                            onChange={(v: any) => {
                              const newArr = [...utility.laundry];
                              newArr[idx].qty = v;
                              setUtility({ ...utility, laundry: newArr });
                            }}
                          />
                          <Field
                            label="Rate"
                            value={item.rate}
                            onChange={(v: any) => {
                              const newArr = [...utility.laundry];
                              newArr[idx].rate = v;
                              setUtility({ ...utility, laundry: newArr });
                            }}
                          />
                          <Field
                            label="Subsidy"
                            value={item.subsidy}
                            onChange={(v: any) => {
                              const newArr = [...utility.laundry];
                              newArr[idx].subsidy = v;
                              setUtility({ ...utility, laundry: newArr });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <SubsidyField
                    label="Electricity"
                    priceObj={utility.electricity}
                    onChange={(v: any) =>
                      setUtility({ ...utility, electricity: v })
                    }
                  />
                  <SubsidyField
                    label="Gas"
                    priceObj={utility.gas}
                    onChange={(v: any) =>
                      setUtility({ ...utility, gas: { ...utility.gas, ...v } })
                    }
                  />
                  <SubsidyField
                    label="TV & Mosquito"
                    priceObj={utility.tvAndMosquito}
                    onChange={(v: any) =>
                      setUtility({ ...utility, tvAndMosquito: v })
                    }
                  />
                  <SubsidyField
                    label="Cleaning"
                    priceObj={utility.cleaning}
                    onChange={(v: any) =>
                      setUtility({ ...utility, cleaning: v })
                    }
                  />
                  <SubsidyField
                    label="Winding-Up Cleaning"
                    priceObj={utility.windingUpCleaning}
                    onChange={(v: any) =>
                      setUtility({ ...utility, windingUpCleaning: v })
                    }
                  />
                </div>
              </div>

              {/* 8. Food & Nutrition */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  8. Food & Nutrition
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2 grid grid-cols-4 gap-2 border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg">
                    <div className="col-span-4 font-bold text-xs">Milk</div>
                    <Field
                      label="Qty"
                      value={food.milk.qty}
                      onChange={(v: any) =>
                        setFood({ ...food, milk: { ...food.milk, qty: v } })
                      }
                    />
                    <Field
                      label="Rate"
                      value={food.milk.rate}
                      onChange={(v: any) =>
                        setFood({ ...food, milk: { ...food.milk, rate: v } })
                      }
                    />

                    <Field
                      label="Subsidy"
                      value={food.milk.subsidy}
                      onChange={(v: any) =>
                        setFood({ ...food, milk: { ...food.milk, subsidy: v } })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 9. Linen */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  9. Linen
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(linen).map(([key, item]) => (
                    <div
                      key={key}
                      className="grid grid-cols-4 gap-2 border p-2 rounded-lg bg-slate-50"
                    >
                      <div className="col-span-4 font-bold text-xs capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </div>
                      <Field
                        label="Qty"
                        value={item.qty}
                        onChange={(v: any) =>
                          setLinen({ ...linen, [key]: { ...item, qty: v } })
                        }
                      />
                      <Field
                        label="Rate"
                        value={item.rate}
                        onChange={(v: any) =>
                          setLinen({ ...linen, [key]: { ...item, rate: v } })
                        }
                      />

                      <Field
                        label="Subsidy"
                        value={item.subsidy}
                        onChange={(v: any) =>
                          setLinen({ ...linen, [key]: { ...item, subsidy: v } })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 10. Medical Consumables */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  10. Medical Consumables
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(medicalConsumables).map(([key, item]) => (
                    <div
                      key={key}
                      className="grid grid-cols-4 gap-2 border p-2 rounded-lg bg-slate-50"
                    >
                      <div className="col-span-4 font-bold text-xs capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </div>
                      <Field
                        label="Qty"
                        value={item.qty}
                        onChange={(v: any) =>
                          setMedicalConsumables({
                            ...medicalConsumables,
                            [key]: { ...item, qty: v },
                          })
                        }
                      />
                      <Field
                        label="Rate"
                        value={item.rate}
                        onChange={(v: any) =>
                          setMedicalConsumables({
                            ...medicalConsumables,
                            [key]: { ...item, rate: v },
                          })
                        }
                      />

                      <Field
                        label="Subsidy"
                        value={item.subsidy}
                        onChange={(v: any) =>
                          setMedicalConsumables({
                            ...medicalConsumables,
                            [key]: { ...item, subsidy: v },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 14. Billing Summary (Fees) */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  Fees & Previous Balances
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <Field
                    label="Previous Pending"
                    value={billingSummary.previousPending}
                    onChange={(v: any) =>
                      setBillingSummary({
                        ...billingSummary,
                        previousPending: v,
                      })
                    }
                  />
                  <Field
                    label="Late Fee"
                    value={billingSummary.lateFee}
                    onChange={(v: any) =>
                      setBillingSummary({ ...billingSummary, lateFee: v })
                    }
                  />
                  <Field
                    label="Late Material Fee"
                    value={billingSummary.lateMaterialFee}
                    onChange={(v: any) =>
                      setBillingSummary({
                        ...billingSummary,
                        lateMaterialFee: v,
                      })
                    }
                  />
                </div>
              </div>

              {/* 11 & 12. Internal Tracking: Monthly Essentials & Material Receipt */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-bold text-slate-900 font-extrabold uppercase text-xs tracking-wider border-b border-gray-100 pb-2 mb-4">
                  Internal Tracking (Not in PDF)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-slate-600 mb-2">
                      Monthly Essentials Status
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 border rounded p-2">
                      {Object.entries(monthlyEssentials)
                        .filter(([key]) => key !== "availPackage")
                        .map(([key, item]: [string, any]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between border-b pb-1"
                          >
                            <span className="capitalize text-xs">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                className="border w-16 text-xs p-1"
                                placeholder="Qty"
                                value={item?.qty || ""}
                                onChange={(e) =>
                                  setMonthlyEssentials({
                                    ...monthlyEssentials,
                                    [key]: { ...item, qty: e.target.value },
                                  })
                                }
                              />
                              <select
                                className="border text-xs p-1"
                                value={item?.status || "Pending"}
                                onChange={(e) =>
                                  setMonthlyEssentials({
                                    ...monthlyEssentials,
                                    [key]: { ...item, status: e.target.value },
                                  })
                                }
                              >
                                <option>Pending</option>
                                <option>Sent</option>
                              </select>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-600 mb-2">
                      Material Receipt
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <Field
                        label="Received Date"
                        value={materialReceipt.receivedDate}
                        onChange={(v: any) =>
                          setMaterialReceipt({
                            ...materialReceipt,
                            receivedDate: v,
                          })
                        }
                      />
                      <Select
                        label="Received Mode"
                        value={materialReceipt.receivedMode}
                        onChange={(v: any) =>
                          setMaterialReceipt({
                            ...materialReceipt,
                            receivedMode: v,
                          })
                        }
                        options={["Self", "Courier", "Online"]}
                      />
                    </div>
                    <div className="space-y-2 border rounded p-2">
                      {[
                        "diapers",
                        "gloves",
                        "mask",
                        "underPad",
                        "rubberSheet",
                        "medicine",
                      ].map((key) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <span className="capitalize text-xs">
                            {key.replace(/([A-Z])/g, " $1")} Received
                          </span>
                          <input
                            type="text"
                            className="border w-24 text-xs p-1"
                            placeholder="Qty"
                            value={(materialReceipt as any)[key].qty}
                            onChange={(e) =>
                              setMaterialReceipt({
                                ...materialReceipt,
                                [key]: { qty: e.target.value },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 15. Material Dispatch (Shows on PDF) */}
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  Materials to be Sent Before 5th
                </h3>
                <div className="grid grid-cols-5 gap-4">
                  <Field
                    label="Diapers (Qty)"
                    value={materialDispatch.diapers.qty}
                    onChange={(v: any) =>
                      setMaterialDispatch({
                        ...materialDispatch,
                        diapers: { qty: v },
                      })
                    }
                  />
                  <Field
                    label="Gloves (Qty)"
                    value={materialDispatch.gloves.qty}
                    onChange={(v: any) =>
                      setMaterialDispatch({
                        ...materialDispatch,
                        gloves: { qty: v },
                      })
                    }
                  />
                  <Field
                    label="Mask (Qty)"
                    value={materialDispatch.mask.qty}
                    onChange={(v: any) =>
                      setMaterialDispatch({
                        ...materialDispatch,
                        mask: { qty: v },
                      })
                    }
                  />
                  <Field
                    label="Under Pad (Qty)"
                    value={materialDispatch.underPad.qty}
                    onChange={(v: any) =>
                      setMaterialDispatch({
                        ...materialDispatch,
                        underPad: { qty: v },
                      })
                    }
                  />
                  <Field
                    label="Rubber Sheet (Qty)"
                    value={materialDispatch.rubberSheet.qty}
                    onChange={(v: any) =>
                      setMaterialDispatch({
                        ...materialDispatch,
                        rubberSheet: { qty: v },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {billType === "HOME_CARE" && (
            <div className="space-y-6">
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  MEMBERSHIP
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    "Monthly Membership",
                    "Quarterly Membership",
                    "Half-Yearly Membership",
                    "Annual Membership",
                    "Silver Membership",
                    "Gold Membership",
                    "Platinum Membership",
                  ].map((k) => (
                    <RateField
                      key={k}
                      label={k}
                      priceObj={homeFields[k]}
                      onChange={(v: any) =>
                        setHomeFields({ ...homeFields, [k]: v })
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  SUBSCRIPTION
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    "Home Nursing",
                    "Caregiver",
                    "Doctor Visit",
                    "Physiotherapy",
                    "Occupational Therapy",
                    "Speech Therapy",
                    "Counseling",
                    "Yoga",
                    "Palliative Care",
                    "Dementia Care",
                    "Alzheimer's Care",
                  ].map((k) => (
                    <div key={k} className="border border-gray-100 p-2 bg-[#F5F8FA] rounded-lg">
                      <div className="mb-2">
                        <Field
                          label={k + " (Qty)"}
                          value={homeFields[k].qty}
                          onChange={(v: any) =>
                            setHomeFields({
                              ...homeFields,
                              [k]: { ...homeFields[k], qty: v },
                            })
                          }
                        />
                      </div>
                      <RateField
                        label="Price"
                        priceObj={homeFields[k]}
                        onChange={(v: any) =>
                          setHomeFields({
                            ...homeFields,
                            [k]: {
                              ...homeFields[k],
                              rate: v.rate,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-slate-700 uppercase text-[13px] tracking-wider border-b border-slate-200 pb-2 mb-4">
                  OTHER SERVICES
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    "Lab Tests",
                    "Medicine Delivery",
                    "Transport",
                    "Ambulance",
                    "Beauty Service",
                    "Legal Service",
                    "Pooja Service",
                    "Tours & Travels",
                    "Rendering Service",
                    "Essentials Service",
                  ].map((k) => (
                    <RateField
                      key={k}
                      label={k}
                      priceObj={homeFields[k]}
                      onChange={(v: any) =>
                        setHomeFields({
                          ...homeFields,
                          [k]: {
                            ...homeFields[k],
                            rate: v.rate,
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-6">
            <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="font-bold text-slate-900 font-extrabold uppercase text-xs tracking-wider border-b border-gray-100 pb-2 mb-4">
                Balance Summary (Internal Carried Forward)
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <Field
                  label="Balance Amount"
                  value={balanceSummary.balanceAmount}
                  onChange={(v: string) =>
                    setBalanceSummary({ ...balanceSummary, balanceAmount: v })
                  }
                />
                <Field
                  label="Monthly Essentials Bal."
                  value={balanceSummary.monthlyEssentials}
                  onChange={(v: string) =>
                    setBalanceSummary({
                      ...balanceSummary,
                      monthlyEssentials: v,
                    })
                  }
                />
                <Field
                  label="Diapers Bal."
                  value={balanceSummary.diapers}
                  onChange={(v: string) =>
                    setBalanceSummary({ ...balanceSummary, diapers: v })
                  }
                />
                <Field
                  label="Gloves Bal."
                  value={balanceSummary.gloves}
                  onChange={(v: string) =>
                    setBalanceSummary({ ...balanceSummary, gloves: v })
                  }
                />
                <Field
                  label="Mask Bal."
                  value={balanceSummary.mask}
                  onChange={(v: string) =>
                    setBalanceSummary({ ...balanceSummary, mask: v })
                  }
                />
                <Field
                  label="Under Pad Bal."
                  value={balanceSummary.underPad}
                  onChange={(v: string) =>
                    setBalanceSummary({ ...balanceSummary, underPad: v })
                  }
                />
                <Field
                  label="Rubber Sheet Bal."
                  value={balanceSummary.rubberSheet}
                  onChange={(v: string) =>
                    setBalanceSummary({ ...balanceSummary, rubberSheet: v })
                  }
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="font-bold text-slate-900 font-extrabold uppercase text-xs tracking-wider border-b border-gray-100 pb-2 mb-4">
                Payment Details (Internal)
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <Field
                  label="Payment Date"
                  type="date"
                  value={billingSummary.paymentDate}
                  onChange={(v: string) =>
                    setBillingSummary({ ...billingSummary, paymentDate: v })
                  }
                />
                <Select
                  label="Payment Mode"
                  value={billingSummary.paymentMode}
                  onChange={(v: string) =>
                    setBillingSummary({ ...billingSummary, paymentMode: v })
                  }
                  options={["Cash", "UPI", "Bank Transfer", "Cheque"]}
                />
                <Field
                  label="UPI App"
                  value={billingSummary.upiApp}
                  onChange={(v: string) =>
                    setBillingSummary({ ...billingSummary, upiApp: v })
                  }
                />
                <Field
                  label="Paid Amount"
                  value={billingSummary.paidAmount}
                  onChange={(v: string) =>
                    setBillingSummary({ ...billingSummary, paidAmount: v })
                  }
                />
                <Field
                  label="Transaction ID"
                  value={billingSummary.transactionId}
                  onChange={(v: string) =>
                    setBillingSummary({ ...billingSummary, transactionId: v })
                  }
                />
                <Field
                  label="Bank Name"
                  value={billingSummary.bankName}
                  onChange={(v: string) =>
                    setBillingSummary({ ...billingSummary, bankName: v })
                  }
                />
                <div className="col-span-2">
                  <Field
                    label="Remarks"
                    value={billingSummary.remarks}
                    onChange={(v: string) =>
                      setBillingSummary({ ...billingSummary, remarks: v })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="font-bold text-slate-900 font-extrabold uppercase text-xs tracking-wider border-b border-gray-100 pb-2 mb-4">
                Problem Resolution & Feedback (Internal)
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-600 text-xs">
                    Problem Resolution
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Field
                      label="Reported By"
                      value={problemResolution.reportedBy}
                      onChange={(v: string) =>
                        setProblemResolution({
                          ...problemResolution,
                          reportedBy: v,
                        })
                      }
                    />
                    <Field
                      label="Category"
                      value={problemResolution.category}
                      onChange={(v: string) =>
                        setProblemResolution({
                          ...problemResolution,
                          category: v,
                        })
                      }
                    />
                    <div className="col-span-2">
                      <Field
                        label="Details"
                        value={problemResolution.details}
                        onChange={(v: string) =>
                          setProblemResolution({
                            ...problemResolution,
                            details: v,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Field
                        label="Resolution"
                        value={problemResolution.resolution}
                        onChange={(v: string) =>
                          setProblemResolution({
                            ...problemResolution,
                            resolution: v,
                          })
                        }
                      />
                    </div>
                    <Field
                      label="Resolution Date"
                      type="date"
                      value={problemResolution.resolutionDate}
                      onChange={(v: string) =>
                        setProblemResolution({
                          ...problemResolution,
                          resolutionDate: v,
                        })
                      }
                    />
                    <Select
                      label="Status"
                      value={problemResolution.status}
                      onChange={(v: string) =>
                        setProblemResolution({
                          ...problemResolution,
                          status: v,
                        })
                      }
                      options={["Open", "In Progress", "Resolved"]}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-600 text-xs">Feedback</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      label="Rating"
                      value={feedback.rating}
                      onChange={(v: string) =>
                        setFeedback({ ...feedback, rating: v })
                      }
                      options={["Excellent", "Good", "Average", "Poor"]}
                    />
                    <div className="col-span-2">
                      <Field
                        label="Feedback"
                        value={feedback.feedback}
                        onChange={(v: string) =>
                          setFeedback({ ...feedback, feedback: v })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Field
                        label="Complaint"
                        value={feedback.complaint}
                        onChange={(v: string) =>
                          setFeedback({ ...feedback, complaint: v })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Field
                        label="Follow-up Required?"
                        value={feedback.followUp}
                        onChange={(v: string) =>
                          setFeedback({ ...feedback, followUp: v })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Field
                        label="Remarks"
                        value={feedback.remarks}
                        onChange={(v: string) =>
                          setFeedback({ ...feedback, remarks: v })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="font-bold text-slate-900 font-extrabold uppercase text-xs tracking-wider border-b border-gray-100 pb-2 mb-4">
                Payment Instructions Configuration
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <Field
                  label="UPI ID"
                  value={paymentInstructions.upiId}
                  onChange={(v: string) =>
                    setPaymentInstructions({ ...paymentInstructions, upiId: v })
                  }
                />
                <Field
                  label="Account Name"
                  value={paymentInstructions.accountName}
                  onChange={(v: string) =>
                    setPaymentInstructions({
                      ...paymentInstructions,
                      accountName: v,
                    })
                  }
                />
                <Field
                  label="Account Number"
                  value={paymentInstructions.accountNumber}
                  onChange={(v: string) =>
                    setPaymentInstructions({
                      ...paymentInstructions,
                      accountNumber: v,
                    })
                  }
                />
                <Field
                  label="IFSC Code"
                  value={paymentInstructions.ifsc}
                  onChange={(v: string) =>
                    setPaymentInstructions({ ...paymentInstructions, ifsc: v })
                  }
                />
                <Field
                  label="Bank Name"
                  value={paymentInstructions.bankName}
                  onChange={(v: string) =>
                    setPaymentInstructions({
                      ...paymentInstructions,
                      bankName: v,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gross Amount
            </div>
            <div className="text-xl font-bold text-slate-900">
              {invoiceMoney(totalAmount)}
            </div>
          </div>
          {billType === "ELDER_CARE" && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                UNCF Subsidy
              </div>
              <div className="text-xl font-bold text-red-600">
                - {invoiceMoney(subsidy)}
              </div>
            </div>
          )}
          <div className="border-l border-slate-200 pl-6">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0F969C] 600">
              Total Payable
            </div>
            <div className="text-2xl font-black text-[#0F969C] 700">
              {invoiceMoney(totalPayable)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPreviewHtml(generateHtml());
              setShowPreview(true);
            }}
            className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Preview Bill
          </button>
          <button
            onClick={openPreview}
            className="flex h-11 items-center gap-2 rounded-lg bg-slate-100 px-5 text-sm font-bold text-slate-700 hover:bg-slate-200"
          >
            <FileText className="h-4 w-4" />
            Preview Window
          </button>
          <button
            onClick={async () => {
              if (!patientName) return alert("Please enter Elder Name / Guest Name first.");
              setIsSending(true);
              try {
                // 1. Save to Backend to Lock
                const res = await api.post("/uec/billing/manual-generate", {
                   patientId,
                   patientName,
                   contractStartDate,
                   contractEndDate,
                   totalAmount: totalPayable,
                   billingMonthYear,
                   billType,
                   patientAge,
                   patientSex,
                   patientDob,
                   membershipPlan,
                   membershipCategory,
                   bedSharing,
                   guardianName,
                   guardianContact,
                   guardianAddress,
                   billId,
                   billingFrequency,
                   billingDays,
                   careStaff,
                   therapy,
                   medicalSupport,
                   transportation,
                   lifestyle,
                   accommodation,
                   utility,
                   food,
                   linen,
                   medicalConsumables,
                   homeFields,
                   monthlyEssentials,
                   materialReceipt,
                   balanceSummary,
                   billingSummary,
                   materialDispatch,
                   problemResolution,
                   feedback,
                   paymentInstructions
                });

                let officialRefNo = billId;
                if (res.data?.data?.refNo) {
                   officialRefNo = res.data.data.refNo;
                   setBillId(officialRefNo);
                }
                
                if (res.data?.data?.id) {
                   setGeneratedInvoiceId(res.data.data.id);
                }

                // 2. Generate PDF dynamically
                const element = document.createElement("div");
                element.innerHTML = generateHtml(officialRefNo);
                const opt = {
                    margin: 16,
                    filename: `UEC_${patientName.replace(/\s+/g, "_")}_${new Date().getDate()}Aug.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, windowWidth: 670 },
                    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                    pagebreak: { mode: ['css', 'legacy'] }
                };
                const pdfBlob = await html2pdf().set(opt).from(element).output("blob");
                const url = window.URL.createObjectURL(pdfBlob);
                const a = document.createElement("a");
                a.href = url;
                a.download = opt.filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                alert("Final bill saved and PDF generated. Revisions are no longer permitted.");
              } catch (err: any) {
                console.error(err);
                alert("Failed to save and generate final bill: " + (err.response?.data?.message || err.message));
              } finally {
                setIsSending(false);
              }
            }}
            disabled={isSending}
            className={`flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-bold text-white ${isSending ? "bg-[#0F969C]/60 cursor-not-allowed" : "bg-[#0F969C] hover:bg-[#0C7A7E]"}`}
          >
            <Save className="h-4 w-4" />
            Final Print (Lock & Download)
          </button>
          <button
            onClick={openWhatsApp}
            disabled={isSending}
            className={`flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-bold text-white ${isSending ? "bg-slate-400 cursor-not-allowed" : "bg-[#25D366] hover:bg-[#1DA851]"}`}
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
            ) : (
              <>
                <Smartphone className="h-4 w-4" /> Send via WhatsApp
              </>
            )}
          </button>
            {generatedInvoiceId && (
              <button
                onClick={markAsSent}
                disabled={isMarkedSent || isSending}
                className={`flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-bold text-white ${
                  isMarkedSent ? "bg-emerald-500" : "bg-slate-800 hover:bg-slate-900"
                }`}
              >
                {isMarkedSent ? <CheckCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {isMarkedSent ? "Marked Sent" : "Mark Sent"}
              </button>
            )}
          </div>
        </div>

        {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm transition-opacity">
          <div className="flex h-[95vh] w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-800">Bill Preview Viewer</h2>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-200/60 p-8">
              <div
                className="mx-auto min-h-full max-w-[800px] bg-white p-8 shadow-md ring-1 ring-slate-900/5 print:shadow-none print:ring-0"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              ></div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-right">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg bg-slate-800 px-6 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




