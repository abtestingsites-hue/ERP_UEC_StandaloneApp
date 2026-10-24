import { useState, useEffect, useCallback } from 'react';
import {
    Pill,
    PackageCheck,
    Search,
    Plus,
    X
} from 'lucide-react';
import { careService } from '../care.service';
import type { StockIssueRequest, CarePatient } from '../care.types';

interface MedicineRequestsTabProps {
    activeUnitId?: string | null;
    isManager?: boolean;
}

export function MedicineRequestsTab({ activeUnitId, isManager = false }: MedicineRequestsTabProps) {
    const [requests, setRequests] = useState<StockIssueRequest[]>([]);
    const [patients, setPatients] = useState<CarePatient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Modal state for raising new request
    const [isRaiseOpen, setIsRaiseOpen] = useState(false);
    const [targetPatientId, setTargetPatientId] = useState('');
    const [productName, setProductName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [requestNotes, setRequestNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Load patients based on role mode: staff only sees their assigned resident
    useEffect(() => {
        let isMounted = true;
        const fetchPatients = isManager
            ? careService.getActivePatients(activeUnitId)
            : careService.getStaffAssignedPatients(activeUnitId);

        fetchPatients.then((pts) => {
            if (!isMounted) return;
            setPatients(pts);
            if (pts.length > 0) {
                if (!isManager) {
                    setSelectedPatientId(pts[0].id);
                    setTargetPatientId(pts[0].id);
                } else {
                    setTargetPatientId(pts[0].id);
                }
            } else {
                setSelectedPatientId('');
                setTargetPatientId('');
            }
        });

        return () => {
            isMounted = false;
        };
    }, [activeUnitId, isManager]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await careService.getMedicineRequests(selectedPatientId || undefined, activeUnitId);
            setRequests(data);
        } catch {
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedPatientId, activeUnitId]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await loadData();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [loadData]);

    const handleRaiseRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const pId = targetPatientId || selectedPatientId;
        if (!pId) {
            setFeedback({ type: 'error', message: 'Please select a resident for this medicine request.' });
            return;
        }
        if (!productName.trim()) {
            setFeedback({ type: 'error', message: 'Medication product name is required.' });
            return;
        }
        const qtyNum = parseInt(quantity, 10);
        if (isNaN(qtyNum) || qtyNum < 1) {
            setFeedback({ type: 'error', message: 'Quantity must be at least 1.' });
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);
        try {
            await careService.createMedicineRequest({
                patientId: pId,
                productName: productName.trim(),
                quantity: qtyNum,
                notes: requestNotes.trim() || undefined,
                unitId: activeUnitId
            });

            setIsRaiseOpen(false);
            setProductName('');
            setQuantity('1');
            setRequestNotes('');
            setFeedback({ type: 'success', message: `Medicine request for ${productName} submitted to Inventory.` });
            await loadData();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to submit medicine request.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filtered = requests.filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (r.requestNumber || '').toLowerCase().includes(q) ||
            (r.productName || '').toLowerCase().includes(q) ||
            (r.patientName || '').toLowerCase().includes(q)
        );
    });

    const activePatient = patients.find((p) => p.id === selectedPatientId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {feedback && (
                <div
                    style={{
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                        border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}
                >
                    {feedback.message}
                </div>
            )}

            {/* Header info bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#e0f2fe', padding: 8, borderRadius: 8, color: '#0284c7' }}>
                        <PackageCheck size={20} />
                    </div>
                    <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                            Nursing Medicine Stock Requests & Issue Log
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                {isManager ? 'Filter Resident:' : 'Assigned Resident:'}
                            </span>
                            {patients.length === 0 ? (
                                <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                                    No residents assigned to your shift.
                                </span>
                            ) : (
                                <select
                                    className="adm-select"
                                    value={selectedPatientId}
                                    onChange={(e) => {
                                        setSelectedPatientId(e.target.value);
                                        setTargetPatientId(e.target.value);
                                    }}
                                    style={{ fontSize: 13, fontWeight: 600, padding: '2px 8px', height: 'auto' }}
                                >
                                    {isManager && <option value="">All Residents</option>}
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.elderId ? `(${p.elderId})` : ''} {p.room ? `· Room ${p.room}` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {!isManager && activePatient && (
                                <span className="adm-badge adm-badge--primary" style={{ fontSize: 11 }}>
                                    Exclusive Shift Scope
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', width: 220 }}>
                        <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="adm-input"
                            placeholder="Search requests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 32, fontSize: 13 }}
                        />
                    </div>
                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={() => {
                            setFeedback(null);
                            setTargetPatientId(selectedPatientId || (patients[0]?.id ?? ''));
                            setIsRaiseOpen(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
                    >
                        <Plus size={16} /> Raise Medicine Request
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="adm-table-wrap">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Request Ref</th>
                            <th>Resident / Patient</th>
                            <th>Medication Product</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Requested At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                                    Loading medicine requests...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                                    No medicine stock issue requests found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <span style={{ fontWeight: 600, color: '#0284c7' }}>
                                            {row.requestNumber || row.id.slice(0, 8)}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{row.patientName || 'Inpatient'}</span>
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                            <Pill size={14} color="#2563eb" /> {row.productName}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 700 }}>{row.quantity} Units</span>
                                    </td>
                                    <td>
                                        <span className={`adm-badge ${
                                            row.status === 'ISSUED' || row.status === 'APPROVED'
                                                ? 'adm-badge--success'
                                                : row.status === 'REJECTED'
                                                ? 'adm-badge--danger'
                                                : 'adm-badge--warning'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td>
                                        {row.requestedAt
                                            ? new Date(row.requestedAt).toLocaleDateString([], {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                              })
                                            : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Raise Medicine Request Modal */}
            {isRaiseOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 16
                    }}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            width: '100%',
                            maxWidth: 500,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '16px 20px',
                                borderBottom: '1px solid #e2e8f0',
                                background: '#f8fafc'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: 6, borderRadius: 6 }}>
                                    <PackageCheck size={18} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                    Raise Medicine Stock Request
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRaiseOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRaiseRequest} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Resident Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                    Resident:
                                </label>
                                <select
                                    className="adm-select"
                                    value={targetPatientId}
                                    onChange={(e) => setTargetPatientId(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                    disabled={!isManager && patients.length === 1}
                                >
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.elderId ? `(${p.elderId})` : ''} {p.room ? `· Room ${p.room}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Medication Name & Quantity */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                        Medication Name *
                                    </label>
                                    <input
                                        type="text"
                                        className="adm-input"
                                        placeholder="e.g. Paracetamol 500mg, Amoxicillin"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="adm-input"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* Clinical Reason / Justification */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                    Clinical Justification / Remarks
                                </label>
                                <textarea
                                    className="adm-textarea"
                                    rows={3}
                                    placeholder="e.g. Daily inpatient dose replenishment for assigned resident"
                                    value={requestNotes}
                                    onChange={(e) => setRequestNotes(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Modal Footer */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                                <button
                                    type="button"
                                    className="adm-btn adm-btn--secondary"
                                    onClick={() => setIsRaiseOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="adm-btn adm-btn--primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit to Inventory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
