import fs from 'fs';

const path = 'g:/ERP/Frontend/src/features/patient_billing/pages/PatientManualBilling.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add History Mode to State
content = content.replace(
  'const [billType, setBillType] = useState<"ELDER_CARE" | "HOME_CARE">(\n    "ELDER_CARE",\n  );',
  'const [billType, setBillType] = useState<"ELDER_CARE" | "HOME_CARE" | "HISTORY">(\n    "ELDER_CARE",\n  );'
);

// 2. Add History State variables
content = content.replace(
  'const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);',
  'const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);\n  const [historySearchId, setHistorySearchId] = useState("");\n  const [historicalInvoice, setHistoricalInvoice] = useState<any>(null);'
);

// 3. Add getStateFallback and update buildInvoiceData
const stateFallback = `  const getStateFallback = () => ({ billType, careStaff, therapy, medicalSupport, transportation, lifestyle, accommodation, utility, food, linen, medicalConsumables, homeFields, monthlyEssentials, materialReceipt, balanceSummary, billingSummary, materialDispatch, problemResolution, feedback, paymentInstructions, patientName, patientAge, patientSex, patientDob, guardianName, guardianContact, guardianAddress, contractStartDate, contractEndDate, membershipPlan, membershipCategory, bedSharing, billingFrequency, billingDays, billingMonthYear, upiId });\n\n  const buildInvoiceData = (source?: any) => {\n    const { billType, careStaff, therapy, medicalSupport, transportation, lifestyle, accommodation, utility, food, linen, medicalConsumables, homeFields, monthlyEssentials, materialReceipt, balanceSummary, billingSummary, materialDispatch, problemResolution, feedback, paymentInstructions, patientName, patientAge, patientSex, patientDob, guardianName, guardianContact, guardianAddress, contractStartDate, contractEndDate, membershipPlan, membershipCategory, bedSharing, billingFrequency, billingDays, billingMonthYear, upiId } = source || getStateFallback();`;

content = content.replace('  const buildInvoiceData = () => {', stateFallback);

// 4. Update calculateTotals
content = content.replace(
  '  const calculateTotals = () => {\n    const { grossTotal, totalSubsidy, netPayable } = buildInvoiceData();',
  '  const calculateTotals = (source?: any) => {\n    const { grossTotal, totalSubsidy, netPayable } = buildInvoiceData(source);'
);

// 5. Update calculateTotals invocation inside the component (we don't change this, it still uses no args for the form)

// 6. Update generateHtml
const generateHtmlStart = `  const generateHtml = (resolvedBillId?: string, source?: any) => {\n    const { billType, careStaff, therapy, medicalSupport, transportation, lifestyle, accommodation, utility, food, linen, medicalConsumables, homeFields, monthlyEssentials, materialReceipt, balanceSummary, billingSummary, materialDispatch, problemResolution, feedback, paymentInstructions, patientName, patientAge, patientSex, patientDob, guardianName, guardianContact, guardianAddress, contractStartDate, contractEndDate, membershipPlan, membershipCategory, bedSharing, billingFrequency, billingDays, billingMonthYear, upiId } = source || getStateFallback();\n    const generatedAt = source?.createdAt ? new Date(source.createdAt) : new Date();\n    const { grossTotal, totalSubsidy, netPayable, sections } = buildInvoiceData(source);`;

content = content.replace(
  '  const generateHtml = (resolvedBillId?: string) => {\n    const generatedAt = new Date();\n    const { grossTotal, totalSubsidy, netPayable, sections } = buildInvoiceData();',
  generateHtmlStart
);

// 7. Update PDF WhatsApp generator to pass the historical state if viewing a historical invoice!
// Wait! `openWhatsApp` shouldn't be available if historical? Or wait, if `historicalInvoice` is set, `openWhatsApp` generates HTML from historicalInvoice!
content = content.replace(
  'element.innerHTML = generateHtml();',
  'element.innerHTML = generateHtml(historicalInvoice?.refNo, historicalInvoice?.metadata || null);'
);
content = content.replace(
  'element.innerHTML = generateHtml();', // For the second one if any
  'element.innerHTML = generateHtml(historicalInvoice?.refNo, historicalInvoice?.metadata || null);'
);

// 8. Update UI Mode Toggle
const historyToggle = `
              <button
                onClick={() => { setBillType("HISTORY"); setHistoricalInvoice(null); }}
                className={\`rounded-lg px-4 py-2 font-bold \${billType === "HISTORY" ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600"}\`}
              >
                Bill History
              </button>
`;
content = content.replace(
  'Home Care Bill\n              </button>\n            </div>',
  `Home Care Bill\n              </button>${historyToggle}            </div>`
);

// 9. Add History Search UI and View logic
const handleSearchHistory = `
  const handleSearchHistory = async () => {
    if (!historySearchId.trim()) return alert("Enter a Bill ID");
    try {
      const res = await api.get(\`/uec/billing/history?refNo=\${historySearchId.trim()}\`);
      if (res.data?.success && res.data?.data) {
        setHistoricalInvoice(res.data.data);
      } else {
        alert("Bill not found.");
      }
    } catch (e: any) {
      if (e.response?.status === 404) {
        alert("Bill not found.");
      } else {
        alert("Failed to retrieve bill.");
      }
    }
  };
`;

content = content.replace('  const markAsSent = async () => {', handleSearchHistory + '\n  const markAsSent = async () => {');

// 10. Hide Form when in History mode, Show History UI
const formStart = `            {/* Patient & Guardian Info */}`;
const historyUI = `
            {billType === "HISTORY" && (
              <div className="mt-6 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 max-w-md">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Search Bill ID</label>
                    <input
                      type="text"
                      placeholder="UEC-INV-2026-000001"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-semibold text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={historySearchId}
                      onChange={(e) => setHistorySearchId(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleSearchHistory} className="h-10 rounded-lg bg-primary-600 px-6 font-bold text-white hover:bg-primary-700">Search</button>
                  </div>
                </div>
                {historicalInvoice && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="mb-4 text-lg font-bold text-slate-800">Historical Invoice Found</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-slate-500 font-bold text-xs uppercase">Bill ID</p>
                        <p className="font-bold text-slate-800">{historicalInvoice.refNo}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-xs uppercase">Patient</p>
                        <p className="font-bold text-slate-800">{historicalInvoice.metadata?.patientName || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-xs uppercase">Amount</p>
                        <p className="font-bold text-slate-800">Rs {historicalInvoice.amount?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-xs uppercase">Sent Status</p>
                        <p className="font-bold text-slate-800">{historicalInvoice.isSent ? \`Yes (\${new Date(historicalInvoice.sentAt).toLocaleDateString()})\` : "No"}</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          const meta = historicalInvoice.metadata || {};
                          meta.createdAt = historicalInvoice.createdAt;
                          setPreviewHtml(generateHtml(historicalInvoice.refNo, meta));
                          setShowPreview(true);
                        }}
                        className="rounded-lg bg-slate-800 px-6 py-2 font-bold text-white hover:bg-slate-900"
                      >
                        View Bill
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {billType !== "HISTORY" && (<>
`;

content = content.replace(formStart, historyUI);

// End the conditional form block before the Action Buttons
content = content.replace(
  '          {/* Action Bar */}',
  '            </>)}\n\n          {/* Action Bar */}'
);

// 11. Hide "Save & Generate PDF" if billType === "HISTORY"
content = content.replace(
  '          {/* Action Bar */}\n      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10">',
  '          {/* Action Bar */}\n      {billType !== "HISTORY" && <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10">'
);

content = content.replace(
  '        </div>\n      </div>\n\n      {/* Preview Modal */}',
  '        </div>}\n      </div>\n\n      {/* Preview Modal */}'
);

// 12. Fix the PDF Download inside the preview modal
content = content.replace(
  '                const element = document.createElement("div");\n                element.innerHTML = generateHtml();',
  '                const element = document.createElement("div");\n                element.innerHTML = generateHtml(historicalInvoice?.refNo || undefined, historicalInvoice?.metadata || null);'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched successfully");
