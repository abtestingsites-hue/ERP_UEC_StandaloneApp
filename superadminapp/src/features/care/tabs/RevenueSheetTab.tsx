import { useState, useEffect, useMemo, useCallback, Component, type ReactNode } from 'react';
import {
    IndianRupee,
    Save,
    Calendar,
    User,
    CheckCircle2,
    FileSpreadsheet,
    Plus,
    RefreshCw,
    ShieldCheck,
    AlertCircle,
    Printer,
    Lock,
    Unlock,
    Sparkles,
    X,
    FileText,
    ArrowRight
} from 'lucide-react';
import { careService } from '../care.service';
import type { CaregiverRevenueItem, CarePatient } from '../care.types';

interface RevenueSheetTabProps {
    activeUnitId?: string | null;
}

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class TabErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Error in RevenueSheetTab:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 12, padding: 30, textAlign: 'center', margin: '20px 0' }}>
                    <AlertCircle size={36} color="#e53e3e" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: '0 0 8px', color: '#9b2c2c', fontSize: 18, fontWeight: 700 }}>
                        Revenue Sheet Error
                    </h3>
                    <p style={{ color: '#742a2a', fontSize: 13, marginBottom: 16 }}>
                        {this.state.error?.message || 'An error occurred while displaying the revenue sheet.'}
                    </p>
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const standardRevenueTemplates = [
    { key: 'diaper', label: 'Diaper', unit: 'Nos', defaultRate: 45 },
    { key: 'gloves', label: 'Surgical / Exam Gloves', unit: 'Pairs', defaultRate: 20 },
    { key: 'mask', label: 'Protective Face Mask', unit: 'Nos', defaultRate: 10 },
    { key: 'ec_bath', label: 'EC Bath / Bed Sponge', unit: 'Sessions', defaultRate: 150 },
    { key: 'underpad_rubber_sheet', label: 'Underpad / Rubber Sheet', unit: 'Nos', defaultRate: 60 },
    { key: 'catheter_uro_bag', label: 'Catheter / Uro Bag Set', unit: 'Sets', defaultRate: 350 },
    { key: 'doctor_checkup', label: 'Doctor Visit / Consult', unit: 'Visit', defaultRate: 500 },
    { key: 'injection', label: 'Injection / IV Cannula Admin', unit: 'Nos', defaultRate: 100 },
    { key: 'ambulance', label: 'Ambulance Transit', unit: 'Trip', defaultRate: 1200 },
    { key: 'lab', label: 'Laboratory Diagnostic Specimen', unit: 'Test', defaultRate: 450 },
    { key: 'dressing', label: 'Wound Dressing & Antiseptic', unit: 'Nos', defaultRate: 200 },
    { key: 'hygiene_items', label: 'Hygiene & Personal Care Kit', unit: 'Nos', defaultRate: 80 },
    { key: 'other_care_items', label: 'Specialized Nursing Care Consumable', unit: 'Nos', defaultRate: 120 }
];

const getCurrentMonthKey = () => new Date().toISOString().slice(0, 7);

const getDaysInMonth = (monthStr: string) => {
    try {
        const [year, month] = (monthStr || '').split('-').map(Number);
        if (!year || !month) return 31;
        return new Date(year, month, 0).getDate();
    } catch {
        return 31;
    }
};

interface SyncModalData {
    isOpen: boolean;
    residentName: string;
    month: string;
    status: 'DRAFT' | 'VERIFIED' | 'APPROVED';
    totalAmount: number;
    totalItems: number;
    syncedRows: number;
    skipped: boolean;
}

function RevenueSheetTabContent({ activeUnitId }: RevenueSheetTabProps) {
    const [month, setMonth] = useState(getCurrentMonthKey());
    const [patients, setPatients] = useState<CarePatient[]>([]);
    const [billingServices, setBillingServices] = useState<Array<{ allocationId: string; patientId: string; patientName: string; clientName?: string; serviceLabel: string }>>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [revenueItems, setRevenueItems] = useState<CaregiverRevenueItem[]>([]);
    const [sheetStatus, setSheetStatus] = useState<'DRAFT' | 'VERIFIED' | 'APPROVED'>('DRAFT');
    const [signatures, setSignatures] = useState({
        caregiverDay: '',
        caregiverNight: '',
        nurse: '',
        manager: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [syncModal, setSyncModal] = useState<SyncModalData | null>(null);

    const daysCount = useMemo(() => getDaysInMonth(month), [month]);
    const daysArray = useMemo(() => Array.from({ length: daysCount }, (_, i) => i + 1), [daysCount]);

    // Load residents list & active billing services
    useEffect(() => {
        let isMounted = true;
        Promise.all([
            careService.getActivePatients(activeUnitId),
            careService.getPatientBillingServices(activeUnitId)
        ]).then(([patientList, serviceList]) => {
            if (!isMounted) return;
            const validPatients = Array.isArray(patientList) ? patientList : [];
            const validServices = Array.isArray(serviceList) ? serviceList : [];
            setPatients(validPatients);
            setBillingServices(validServices);
            if (validPatients.length > 0 && !selectedPatientId) {
                setSelectedPatientId(validPatients[0].id);
            }
        }).catch(() => {
            if (isMounted) {
                setPatients([]);
                setBillingServices([]);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [activeUnitId, selectedPatientId]);

    // Match resident with active service allocation
    const matchedService = useMemo(() => {
        if (!selectedPatientId) return null;
        const patient = patients.find((p) => p.id === selectedPatientId);
        return billingServices.find(
            (s) => s.patientId === selectedPatientId || (patient && s.patientName?.toLowerCase() === patient.name?.toLowerCase())
        ) || null;
    }, [selectedPatientId, patients, billingServices]);

    // Load revenue sheets for selected month & patient
    const loadRevenueSheet = useCallback(async () => {
        if (!selectedPatientId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const sheets = await careService.getCaregiverRevenueSheets(month, activeUnitId);
            const sheetList = Array.isArray(sheets) ? sheets : [];
            const patientName = patients.find((p) => p.id === selectedPatientId)?.name;
            const foundSheet = sheetList.find(
                (s) => s?.patientId === selectedPatientId || (patientName && s?.patientName === patientName)
            );

            let rawItems: any[] = [];
            if (foundSheet && foundSheet.items) {
                if (Array.isArray(foundSheet.items)) {
                    rawItems = foundSheet.items;
                } else if (typeof foundSheet.items === 'string') {
                    try { rawItems = JSON.parse(foundSheet.items); } catch { rawItems = []; }
                }
            }

            let rawSignatures: any = {};
            if (foundSheet && foundSheet.signatures) {
                if (typeof foundSheet.signatures === 'object' && !Array.isArray(foundSheet.signatures)) {
                    rawSignatures = foundSheet.signatures;
                } else if (typeof foundSheet.signatures === 'string') {
                    try { rawSignatures = JSON.parse(foundSheet.signatures); } catch { rawSignatures = {}; }
                }
            }

            const currentStatus = (foundSheet?.status as 'DRAFT' | 'VERIFIED' | 'APPROVED') || 'DRAFT';
            setSheetStatus(currentStatus);

            if (rawItems.length > 0) {
                const savedMap = new Map(rawItems.map((it: any) => [it?.key, it]));
                const merged = standardRevenueTemplates.map((tmpl) => {
                    const saved = savedMap.get(tmpl.key);
                    return {
                        key: tmpl.key,
                        label: tmpl.label,
                        unit: saved?.unit || tmpl.unit,
                        rate: typeof saved?.rate === 'number' ? saved.rate : tmpl.defaultRate,
                        days: (saved?.days && typeof saved.days === 'object') ? saved.days : {}
                    };
                });
                for (const it of rawItems) {
                    if (it?.key && !standardRevenueTemplates.some((t) => t.key === it.key)) {
                        merged.push({
                            key: it.key,
                            label: it.label || 'Custom Item',
                            unit: it.unit || 'Nos',
                            rate: Number(it.rate) || 0,
                            days: (it.days && typeof it.days === 'object') ? it.days : {}
                        });
                    }
                }
                setRevenueItems(merged);
                setSignatures({
                    caregiverDay: String(rawSignatures?.caregiverDay || ''),
                    caregiverNight: String(rawSignatures?.caregiverNight || ''),
                    nurse: String(rawSignatures?.nurse || ''),
                    manager: String(rawSignatures?.manager || '')
                });
            } else {
                setRevenueItems(
                    standardRevenueTemplates.map((t) => ({
                        key: t.key,
                        label: t.label,
                        unit: t.unit,
                        rate: t.defaultRate,
                        days: {}
                    }))
                );
                setSignatures({ caregiverDay: '', caregiverNight: '', nurse: '', manager: '' });
            }
        } catch {
            setRevenueItems(
                standardRevenueTemplates.map((t) => ({
                    key: t.key,
                    label: t.label,
                    unit: t.unit,
                    rate: t.defaultRate,
                    days: {}
                }))
            );
            setSheetStatus('DRAFT');
        } finally {
            setIsLoading(false);
        }
    }, [month, selectedPatientId, activeUnitId, patients]);

    useEffect(() => {
        void loadRevenueSheet();
    }, [loadRevenueSheet]);

    // Update quantity for day
    const handleDayQuantityChange = (itemKey: string, dayNum: number, value: string) => {
        if (sheetStatus === 'APPROVED') return;
        const qty = Math.max(0, parseInt(value, 10) || 0);
        setRevenueItems((prev) =>
            prev.map((it) => {
                if (it.key !== itemKey) return it;
                return {
                    ...it,
                    days: {
                        ...(it.days || {}),
                        [String(dayNum)]: qty
                    }
                };
            })
        );
    };

    // Update rate for item
    const handleRateChange = (itemKey: string, value: string) => {
        if (sheetStatus === 'APPROVED') return;
        const rate = Math.max(0, parseFloat(value) || 0);
        setRevenueItems((prev) =>
            prev.map((it) => (it.key === itemKey ? { ...it, rate } : it))
        );
    };

    // Calculate totals
    const itemTotals = useMemo(() => {
        return (revenueItems || []).map((it) => {
            const daysMap = (it && it.days && typeof it.days === 'object') ? it.days : {};
            const totalQty = Object.values(daysMap).reduce((acc: number, q: unknown) => acc + (Number(q) || 0), 0);
            const lineAmount = totalQty * (Number(it?.rate) || 0);
            return { key: it?.key || '', totalQty, lineAmount };
        });
    }, [revenueItems]);

    const totalSheetAmount = useMemo(() => {
        return itemTotals.reduce((acc, cur) => acc + (cur.lineAmount || 0), 0);
    }, [itemTotals]);

    const totalUnitsCount = useMemo(() => {
        return itemTotals.reduce((acc, cur) => acc + (cur.totalQty || 0), 0);
    }, [itemTotals]);

    const handleSave = async (targetStatus?: 'DRAFT' | 'VERIFIED' | 'APPROVED') => {
        if (!selectedPatientId) {
            alert('Please select a resident.');
            return;
        }
        const patient = patients.find((p) => p.id === selectedPatientId);
        const finalStatus = targetStatus || sheetStatus || 'DRAFT';

        setIsSaving(true);
        try {
            const res = await careService.saveCaregiverRevenueSheet(
                {
                    allocationId: matchedService?.allocationId || null,
                    patientId: selectedPatientId,
                    patientName: patient?.name || 'Inhouse Resident',
                    clientName: matchedService?.clientName || null,
                    month,
                    items: revenueItems,
                    signatures,
                    totalAmount: totalSheetAmount,
                    status: finalStatus
                },
                activeUnitId
            );

            setSheetStatus(finalStatus);
            const syncData = (res as any)?.ledgerSync || {};
            setSyncModal({
                isOpen: true,
                residentName: patient?.name || 'Inhouse Resident',
                month,
                status: finalStatus,
                totalAmount: totalSheetAmount,
                totalItems: totalUnitsCount,
                syncedRows: Number(syncData?.syncedRows || 0),
                skipped: Boolean(syncData?.skipped)
            });
        } catch (error: any) {
            alert(error?.message || 'Failed to save revenue sheet. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnlock = () => {
        if (confirm('Unlock this sheet for revisions? Status will revert to In-Progress Draft.')) {
            void handleSave('DRAFT');
        }
    };

    const handleAddCustomItem = () => {
        if (sheetStatus === 'APPROVED') {
            alert('This sheet is approved and locked. Unlock it to add new items.');
            return;
        }
        const name = window.prompt('Enter custom medical/consumable item name:');
        if (!name || !name.trim()) return;
        const unit = window.prompt('Enter unit of measurement (e.g. Nos, Ampoule, Kit):', 'Nos') || 'Nos';
        const rateStr = window.prompt('Enter default billing rate (₹):', '100');
        const rate = parseFloat(rateStr || '100') || 100;

        const newKey = `custom_${Date.now()}`;
        setRevenueItems((prev) => [
            ...prev,
            {
                key: newKey,
                label: name.trim(),
                unit: unit.trim(),
                rate,
                days: {}
            }
        ]);
    };

    const handlePrint = () => {
        window.print();
    };

    const selectedPatient = (patients || []).find((p) => p.id === selectedPatientId);
    const isLocked = sheetStatus === 'APPROVED';

    return (
        <div className="revenue-sheet-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Print Stylesheet */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .revenue-sheet-printable, .revenue-sheet-printable * {
                        visibility: visible;
                    }
                    .revenue-sheet-printable {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #fff !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    table {
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                }
            `}</style>

            {/* Locked Notice Banner */}
            {isLocked && (
                <div
                    className="no-print"
                    style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: 12,
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={16} />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#065f46' }}>
                                Sheet Approved & Locked for Monthly Invoicing
                            </h4>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#047857' }}>
                                This caregiver sheet is locked to prevent unintentional changes. Clinical ledger rows are active in Patient Billing.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={handleUnlock}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px' }}
                    >
                        <Unlock size={14} /> Unlock for Revisions
                    </button>
                </div>
            )}

            {/* Top Stat Cards */}
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', marginBottom: 6 }}>
                        <IndianRupee size={20} />
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                            Calculated Month Charges
                        </span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                        ₹ {(totalSheetAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        Resident: <strong>{selectedPatient?.name || 'None Selected'}</strong> · {month}
                    </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0284c7', marginBottom: 6 }}>
                        <FileSpreadsheet size={20} />
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                            Total Units Consumed
                        </span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                        {totalUnitsCount} Units
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        Across {(revenueItems || []).length} registered clinical consumable items
                    </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6', marginBottom: 6 }}>
                        <ShieldCheck size={20} />
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                            Workflow & Certification
                        </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {sheetStatus === 'APPROVED' ? (
                            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Lock size={14} /> Approved & Locked
                            </span>
                        ) : sheetStatus === 'VERIFIED' ? (
                            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={14} /> Nurse Verified
                            </span>
                        ) : (
                            <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FileText size={14} /> Draft (In-Progress)
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        {matchedService ? `Linked Allocation: ${matchedService.allocationId.slice(0, 8)}...` : 'Resident Care Profile'}
                    </div>
                </div>
            </div>

            {/* Resident & Month Control Bar */}
            <div
                className="no-print"
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {/* Resident Select */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                            Select Inhouse Resident
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <User size={16} color="#0284c7" />
                            <select
                                className="adm-select"
                                style={{ minWidth: 220, height: 38, padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 600 }}
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                            >
                                {(patients || []).length === 0 ? (
                                    <option value="">No residents found</option>
                                ) : (
                                    patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.elderId ? `(${p.elderId})` : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Month Picker */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                            Billing Month
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={16} color="#64748b" />
                            <input
                                type="month"
                                className="adm-input"
                                style={{ height: 38, padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 600 }}
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Resident Service Details Badge */}
                    {matchedService && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                                Active Allocation & Sponsor
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                                {matchedService.serviceLabel || 'Inhouse Care'} · {matchedService.clientName ? `Sponsor: ${matchedService.clientName}` : 'Self'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={handleAddCustomItem}
                        disabled={isLocked}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}
                        title="Add specialized care item or medicine to sheet"
                    >
                        <Plus size={15} /> Add Custom Item
                    </button>

                    <button
                        type="button"
                        className="adm-btn adm-btn--secondary"
                        onClick={handlePrint}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}
                        title="Print landscape monthly register for physical file"
                    >
                        <Printer size={15} /> Print Sheet
                    </button>

                    {!isLocked && (
                        <>
                            <button
                                type="button"
                                className="adm-btn adm-btn--secondary"
                                onClick={() => handleSave('DRAFT')}
                                disabled={isSaving || !selectedPatientId}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}
                            >
                                {isSaving ? <RefreshCw size={15} className="adm-spin" /> : <Save size={15} />}
                                Save Draft
                            </button>

                            <button
                                type="button"
                                className="adm-btn adm-btn--secondary"
                                onClick={() => handleSave('VERIFIED')}
                                disabled={isSaving || !selectedPatientId}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, borderColor: '#0284c7', color: '#0284c7' }}
                            >
                                <CheckCircle2 size={15} /> Verify Sheet
                            </button>

                            <button
                                type="button"
                                className="adm-btn adm-btn--primary"
                                onClick={() => handleSave('APPROVED')}
                                disabled={isSaving || !selectedPatientId}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, minWidth: 140, justifyContent: 'center', background: '#059669', borderColor: '#059669' }}
                            >
                                <Lock size={15} /> Approve & Lock
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Printable & On-Screen Matrix Section */}
            <div
                className="revenue-sheet-printable"
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                }}
            >
                {/* Printable Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#0284c7' }}>
                            Universal Elder Care · Clinical Operations
                        </div>
                        <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                            Inhouse Caregiver Daily Consumables & Procedure Register
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                            Resident: <strong>{selectedPatient?.name || 'Resident'}</strong> · Month: <strong>{month}</strong> · Total Charges: <strong>₹ {(totalSheetAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 16,
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: sheetStatus === 'APPROVED' ? '#ecfdf5' : sheetStatus === 'VERIFIED' ? '#e0f2fe' : '#fef3c7',
                                color: sheetStatus === 'APPROVED' ? '#065f46' : sheetStatus === 'VERIFIED' ? '#0369a1' : '#92400e'
                            }}
                        >
                            {sheetStatus === 'APPROVED' ? <Lock size={12} /> : sheetStatus === 'VERIFIED' ? <CheckCircle2 size={12} /> : <FileText size={12} />}
                            {sheetStatus}
                        </span>
                    </div>
                </div>

                {/* Matrix Table */}
                <div style={{ overflowX: 'auto', maxHeight: 520, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 2 }}>
                            <tr>
                                <th style={{ position: 'sticky', left: 0, background: '#f1f5f9', zIndex: 3, padding: '10px 12px', textAlign: 'left', minWidth: 200, borderRight: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1' }}>
                                    Particulars / Medical Item
                                </th>
                                <th style={{ padding: '8px 10px', textAlign: 'center', minWidth: 70, borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #cbd5e1' }}>
                                    Unit
                                </th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', minWidth: 80, borderRight: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1' }}>
                                    Rate (₹)
                                </th>
                                {daysArray.map((d) => (
                                    <th
                                        key={d}
                                        style={{
                                            padding: '6px 4px',
                                            textAlign: 'center',
                                            minWidth: 38,
                                            maxWidth: 42,
                                            borderRight: '1px solid #e2e8f0',
                                            borderBottom: '2px solid #cbd5e1',
                                            fontWeight: 700,
                                            color: '#334155'
                                        }}
                                    >
                                        {d}
                                    </th>
                                ))}
                                <th style={{ padding: '8px 12px', textAlign: 'center', minWidth: 60, borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #cbd5e1' }}>
                                    Total Qty
                                </th>
                                <th style={{ padding: '8px 14px', textAlign: 'right', minWidth: 100, borderBottom: '2px solid #cbd5e1', background: '#ecfdf5', color: '#065f46', fontWeight: 800 }}>
                                    Amount (₹)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={daysCount + 5} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                                        Loading revenue sheet...
                                    </td>
                                </tr>
                            ) : (revenueItems || []).length === 0 ? (
                                <tr>
                                    <td colSpan={daysCount + 5} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                                        No items configured for this sheet.
                                    </td>
                                </tr>
                            ) : (
                                (revenueItems || []).map((item, idx) => {
                                    const daysMap = (item && item.days && typeof item.days === 'object') ? item.days : {};
                                    const totalQty = Object.values(daysMap).reduce((acc: number, q: unknown) => acc + (Number(q) || 0), 0);
                                    const lineAmount = totalQty * (Number(item?.rate) || 0);
                                    const isAlt = idx % 2 === 1;

                                    return (
                                        <tr key={item?.key || idx} style={{ background: isAlt ? '#fafafa' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ position: 'sticky', left: 0, background: isAlt ? '#f8fafc' : '#ffffff', zIndex: 1, padding: '8px 12px', fontWeight: 600, color: '#0f172a', borderRight: '2px solid #cbd5e1' }}>
                                                {item?.label || 'Item'}
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'center', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>
                                                {item?.unit || 'Nos'}
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'right', borderRight: '2px solid #cbd5e1' }}>
                                                {isLocked ? (
                                                    <span style={{ fontWeight: 600, color: '#334155' }}>
                                                        {item?.rate?.toFixed(2) ?? '0.00'}
                                                    </span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        style={{ width: 65, textAlign: 'right', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                                                        value={item?.rate ?? ''}
                                                        onChange={(e) => handleRateChange(item.key, e.target.value)}
                                                    />
                                                )}
                                            </td>
                                            {daysArray.map((d) => {
                                                const val = item?.days?.[String(d)];
                                                const hasVal = Boolean(val && val > 0);
                                                return (
                                                    <td
                                                        key={d}
                                                        style={{
                                                            padding: 2,
                                                            textAlign: 'center',
                                                            borderRight: '1px solid #e2e8f0',
                                                            background: hasVal ? '#f0fdf4' : undefined
                                                        }}
                                                    >
                                                        {isLocked ? (
                                                            <span style={{ fontWeight: hasVal ? 700 : 400, color: hasVal ? '#15803d' : '#cbd5e1' }}>
                                                                {val || '-'}
                                                            </span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="99"
                                                                style={{
                                                                    width: 32,
                                                                    height: 26,
                                                                    textAlign: 'center',
                                                                    padding: 0,
                                                                    border: hasVal ? '1px solid #86efac' : '1px solid #e2e8f0',
                                                                    borderRadius: 3,
                                                                    fontWeight: hasVal ? 700 : 400,
                                                                    color: hasVal ? '#15803d' : '#94a3b8'
                                                                }}
                                                                value={val || ''}
                                                                onChange={(e) => handleDayQuantityChange(item.key, d, e.target.value)}
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: totalQty > 0 ? '#0f172a' : '#94a3b8', borderRight: '1px solid #e2e8f0' }}>
                                                {totalQty}
                                            </td>
                                            <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: 700, color: lineAmount > 0 ? '#047857' : '#94a3b8', background: isAlt ? '#f0fdf4' : '#f7fdf9' }}>
                                                ₹ {lineAmount.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                            <tr>
                                <td colSpan={daysCount + 4} style={{ padding: '12px 16px', textAlign: 'right', textTransform: 'uppercase', color: '#475569' }}>
                                    Total Month Revenue Charge:
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 14, color: '#065f46', background: '#dcfce7' }}>
                                    ₹ {(totalSheetAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Audit & Signatures Card */}
                <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <ShieldCheck size={18} color="#0284c7" />
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                            Clinical & Caregiver Verification Signatures
                        </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                                Caregiver (Day Shift)
                            </label>
                            {isLocked ? (
                                <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                    {signatures?.caregiverDay || '—'}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Staff name / signature"
                                    style={{ width: '100%', height: 38, padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                    value={signatures?.caregiverDay || ''}
                                    onChange={(e) => setSignatures((prev) => ({ ...prev, caregiverDay: e.target.value }))}
                                />
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                                Caregiver (Night Shift)
                            </label>
                            {isLocked ? (
                                <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                    {signatures?.caregiverNight || '—'}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Staff name / signature"
                                    style={{ width: '100%', height: 38, padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                    value={signatures?.caregiverNight || ''}
                                    onChange={(e) => setSignatures((prev) => ({ ...prev, caregiverNight: e.target.value }))}
                                />
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                                Staff Nurse In-Charge
                            </label>
                            {isLocked ? (
                                <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                    {signatures?.nurse || '—'}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Nurse name / signature"
                                    style={{ width: '100%', height: 38, padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                    value={signatures?.nurse || ''}
                                    onChange={(e) => setSignatures((prev) => ({ ...prev, nurse: e.target.value }))}
                                />
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                                Nursing Manager Sign-off
                            </label>
                            {isLocked ? (
                                <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                    {signatures?.manager || '—'}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Manager name / signature"
                                    style={{ width: '100%', height: 38, padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                    value={signatures?.manager || ''}
                                    onChange={(e) => setSignatures((prev) => ({ ...prev, manager: e.target.value }))}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Post-Save Confirmation Modal */}
            {syncModal && syncModal.isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 20
                    }}
                    onClick={() => setSyncModal(null)}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            maxWidth: 500,
                            width: '100%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            padding: 24,
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setSyncModal(null)}
                            style={{ position: 'absolute', right: 18, top: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                                    Revenue Sheet Saved
                                </h3>
                                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                                    {syncModal.residentName} · {syncModal.month}
                                </p>
                            </div>
                        </div>

                        {/* Summary Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 0', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                                    Certified Status
                                </span>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {syncModal.status === 'APPROVED' ? <Lock size={13} color="#059669" /> : <FileText size={13} color="#0284c7" />}
                                    {syncModal.status}
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                                    Total Month Charge
                                </span>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#059669', marginTop: 2 }}>
                                    ₹ {syncModal.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                                    Consumable Units
                                </span>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                                    {syncModal.totalItems} Items Logged
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                                    Billing Days
                                </span>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                                    1–{daysCount} Register Matrix
                                </div>
                            </div>
                        </div>

                        {/* Finance & Ledger Integration Box */}
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                                <Sparkles size={16} />
                                Financial Ledger Synchronization
                            </div>
                            {syncModal.syncedRows > 0 ? (
                                <p style={{ margin: 0, fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
                                    <strong>{syncModal.syncedRows} daily itemized cost entries</strong> (Ref: <code>PDC-XXXX</code>) were successfully synchronized to the <strong>Patient Daily Cost Ledger</strong>. These charges will automatically flow into the resident&apos;s monthly invoice in the Finance / Patient Billing module.
                                </p>
                            ) : (
                                <p style={{ margin: 0, fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
                                    Caregiver sheet was recorded successfully into clinical records. (When resident has an active service allocation, daily cost ledger rows will automatically generate for invoicing).
                                </p>
                            )}
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                type="button"
                                className="adm-btn adm-btn--secondary"
                                onClick={() => {
                                    setSyncModal(null);
                                    handlePrint();
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Printer size={15} /> Print Sheet
                            </button>
                            <button
                                type="button"
                                className="adm-btn adm-btn--primary"
                                onClick={() => setSyncModal(null)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100, justifyContent: 'center' }}
                            >
                                Done <ArrowRight size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function RevenueSheetTab(props: RevenueSheetTabProps) {
    return (
        <TabErrorBoundary>
            <RevenueSheetTabContent {...props} />
        </TabErrorBoundary>
    );
}
