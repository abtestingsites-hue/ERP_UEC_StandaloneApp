import { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import type { HomeCareAllocation, HomeCareAdmission, CaregiverStaff, CreateAllocationPayload } from '../homeCare.types';

interface AssignCaregiverModalProps {
    isOpen: boolean;
    onClose: () => void;
    allocation: HomeCareAllocation | null;
    unallocatedList: HomeCareAdmission[];
    staffList: CaregiverStaff[];
    onAssign: (payload: CreateAllocationPayload) => Promise<void>;
    activeUnitId?: string | null;
}

export function AssignCaregiverModal(props: AssignCaregiverModalProps) {
    if (!props.isOpen) return null;
    return <AssignCaregiverModalContent key={props.allocation?.id || 'new'} {...props} />;
}

function AssignCaregiverModalContent({
    onClose,
    allocation,
    unallocatedList = [],
    staffList = [],
    onAssign,
    activeUnitId
}: AssignCaregiverModalProps) {
    const now = new Date().toISOString().slice(0, 10);
    const firstUnallocated = unallocatedList.length > 0 ? unallocatedList[0] : null;

    const [selectedTargetId, setSelectedTargetId] = useState(() => {
        if (allocation) return allocation.enquiryId || allocation.id;
        if (firstUnallocated) return firstUnallocated.enquiry?.id || firstUnallocated.id;
        return '';
    });
    const [selectedStaffId, setSelectedStaffId] = useState(() => {
        if (allocation) return allocation.staffId || allocation.staff?.id || '';
        return staffList.length > 0 ? staffList[0].id : '';
    });
    const [startDate, setStartDate] = useState(() => {
        if (allocation?.startDate) return new Date(allocation.startDate).toISOString().slice(0, 10);
        if (firstUnallocated?.serviceContract?.startDate) {
            return new Date(firstUnallocated.serviceContract.startDate).toISOString().slice(0, 10);
        }
        return now;
    });
    const [endDate, setEndDate] = useState(() => {
        if (allocation?.endDate) return new Date(allocation.endDate).toISOString().slice(0, 10);
        if (firstUnallocated?.serviceContract?.endDate) {
            return new Date(firstUnallocated.serviceContract.endDate).toISOString().slice(0, 10);
        }
        return '';
    });
    const [notes, setNotes] = useState(() => {
        if (allocation) return allocation.metadata?.notes || '';
        if (firstUnallocated?.serviceContract?.specialInstructions) {
            return firstUnallocated.serviceContract.specialInstructions;
        }
        return '';
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleTargetChange = (targetId: string) => {
        setSelectedTargetId(targetId);
        const found = unallocatedList.find((item) => item.id === targetId || item.enquiry?.id === targetId);
        if (found) {
            if (found.serviceContract?.startDate) {
                setStartDate(new Date(found.serviceContract.startDate).toISOString().slice(0, 10));
            }
            if (found.serviceContract?.endDate) {
                setEndDate(new Date(found.serviceContract.endDate).toISOString().slice(0, 10));
            }
            if (found.serviceContract?.specialInstructions) {
                setNotes(found.serviceContract.specialInstructions);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedTargetId) {
            setError('Please select an active client / contract to allocate.');
            return;
        }

        if (!selectedStaffId) {
            setError('Please select an authorized caregiver staff member.');
            return;
        }

        if (!startDate) {
            setError('Please select an allocation start date.');
            return;
        }

        // Find corresponding enquiry ID
        let enquiryId = selectedTargetId;
        const matchingAdmission = unallocatedList.find(
            (adm) => adm.id === selectedTargetId || adm.enquiry?.id === selectedTargetId
        );
        if (matchingAdmission?.enquiry?.id) {
            enquiryId = matchingAdmission.enquiry.id;
        }

        setIsSubmitting(true);
        try {
            await onAssign({
                enquiryId,
                staffId: selectedStaffId,
                startDate: new Date(startDate).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null,
                metadata: {
                    notes: notes || undefined
                },
                unitId: activeUnitId
            });
            onClose();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to assign caregiver.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true">
            <div className="adm-modal-container adm-modal-container--md" style={{ maxWidth: 540 }}>
                <div className="adm-modal-header">
                    <div className="adm-modal-title-group">
                        <UserCheck className="adm-modal-icon" />
                        <div>
                            <h3 className="adm-modal-title">
                                {allocation ? 'Reassign Caregiver Staff' : 'Allocate Caregiver to Client'}
                            </h3>
                            <p className="adm-modal-subtitle">
                                Assign authorized staff to an active Home Care contract. This will generate daily visit schedules.
                            </p>
                        </div>
                    </div>
                    <button type="button" className="adm-modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="adm-modal-body">
                    {error && (
                        <div className="adm-alert adm-alert--error" style={{ marginBottom: 14 }}>
                            {error}
                        </div>
                    )}

                    <div className="adm-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Target Client Contract Selector */}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Client / Service Contract *</label>
                            {allocation ? (
                                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                        {allocation.clientName || allocation.patient || 'Home Care Client'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>
                                        Ref: {allocation.refNo || allocation.id.slice(0, 8)} · Service: {allocation.service || 'Home Care'}
                                    </div>
                                </div>
                            ) : (
                                <select
                                    className="adm-form-input"
                                    value={selectedTargetId}
                                    onChange={(e) => handleTargetChange(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Active Unallocated Contract --</option>
                                    {unallocatedList.map((adm) => {
                                        const name = adm.patient?.name || adm.enquiry?.client?.name || 'Client';
                                        const cNum = adm.serviceContract?.contractNumber || 'Contract Active';
                                        return (
                                            <option key={adm.id} value={adm.enquiry?.id || adm.id}>
                                                {name} — {cNum} ({adm.enquiry?.service?.name || 'Home Care'})
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>

                        {/* Staff Caregiver Selector */}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Caregiver Staff Member *</label>
                            <select
                                className="adm-form-input"
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                required
                            >
                                <option value="">-- Select Caregiver Staff --</option>
                                {staffList.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.firstName} {st.lastName || ''} ({st.designation || 'Caregiver'}) {st.mobile ? `· ${st.mobile}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Allocation Start Date *</label>
                                <input
                                    type="date"
                                    className="adm-form-input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="adm-form-group">
                                <label className="adm-form-label">Allocation End Date</label>
                                <input
                                    type="date"
                                    className="adm-form-input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Caregiver Instructions / Notes</label>
                            <textarea
                                className="adm-form-input"
                                rows={3}
                                placeholder="Special instructions for the assigned caregiver regarding visits, timing, medication..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="adm-modal-footer" style={{ marginTop: 20 }}>
                        <button
                            type="button"
                            className="adm-btn adm-btn--secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="adm-btn adm-btn--primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving Allocation...' : allocation ? 'Update Allocation' : 'Allocate Staff'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
