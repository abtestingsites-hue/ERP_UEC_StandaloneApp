import React, { useMemo, useState, useEffect } from 'react';
import { Eye, LogIn } from 'lucide-react';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { StatusHighlighter } from '../../../components/ui/StatusHighlighter';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { VisitorMaterialEntry } from '../../visitor/components/VisitorMaterialEntry';
import { useResidentOutings, useRecordResidentExit, useRecordResidentReturn, useCreateResidentOuting } from '../hooks/useSecurity';
import type { ResidentOuting } from '../types';
import { FilterSection } from '../../../components/ui/FilterSection';
import api from '../../../lib/axios';

const formatTime = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export function ResidentOutingsList() {
    const { data: outings = [], isLoading, isFetching, refetch } = useResidentOutings();
    const recordExit = useRecordResidentExit();
    const recordReturn = useRecordResidentReturn();
    const createOuting = useCreateResidentOuting();

    const [patients, setPatients] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionModal, setActionModal] = useState<{ type: 'exit' | 'return' | 'view'; outing: ResidentOuting } | null>(null);
    const [isNewOutingModalOpen, setIsNewOutingModalOpen] = useState(false);
    const [newOuting, setNewOuting] = useState({
        patientId: '',
        reasonSelection: '',
        customReason: '',
        destinationSelection: '',
        customDestination: '',
        expectedReturnDate: '',
        expectedReturnTime: '',
        companionType: '',
        companionStaffId: '',
        companionName: '',
        materials: null as any
    });

    useEffect(() => {
        api.get('/patients').then((res) => setPatients(res.data?.data || [])).catch(() => {});
        api.get('/hr/staff', { params: { scope: 'all' } }).then((res) => setStaffList(res.data?.data || [])).catch(() => {});
    }, []);

    const handleOpenNewOutingModal = () => {
        setNewOuting({
            patientId: '',
            reasonSelection: '',
            customReason: '',
            destinationSelection: '',
            customDestination: '',
            expectedReturnDate: '',
            expectedReturnTime: '',
            companionType: '',
            companionStaffId: '',
            companionName: '',
            materials: null
        });
        setIsNewOutingModalOpen(true);
    };

    const handleMaterialsChange = React.useCallback((val: any) => {
        setNewOuting(prev => prev.materials === val ? prev : { ...prev, materials: val });
    }, []);

    const handleValidityChange = React.useCallback(() => {}, []);

    const filteredOutings = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return outings.filter((outing) => 
            String(outing.patient?.name || '').toLowerCase().includes(query) ||
            String(outing.patient?.elderId || '').toLowerCase().includes(query) ||
            String(outing.destination || '').toLowerCase().includes(query)
        );
    }, [outings, searchQuery]);

    const handleConfirmAction = async () => {
        if (!actionModal) return;

        if (actionModal.type === 'return') {
            const movement = actionModal.outing.movements.find(m => m.status === 'OUTSIDE');
            if (movement) {
                await recordReturn.mutateAsync(movement.id);
            }
        }
        setActionModal(null);
    };

    const handleCreateOuting = async () => {
        const payload: Partial<ResidentOuting> = {
            patientId: newOuting.patientId,
            reason: newOuting.reasonSelection === 'Other' ? newOuting.customReason.trim() : newOuting.reasonSelection,
            destination: newOuting.destinationSelection === 'Other' ? newOuting.customDestination.trim() : newOuting.destinationSelection,
            expectedExitAt: new Date().toISOString(),
            expectedReturnAt: new Date(`${newOuting.expectedReturnDate}T${newOuting.expectedReturnTime}`).toISOString(),
            companionType: newOuting.companionType || undefined,
            companionStaffId: newOuting.companionType === 'STAFF' ? newOuting.companionStaffId : undefined,
            companionName: (newOuting.companionType === 'VISITOR' || newOuting.companionType === 'EXTERNAL') ? newOuting.companionName : undefined,
            materials: newOuting.materials
        };

        try {
            await createOuting.mutateAsync(payload);
            setIsNewOutingModalOpen(false);
            refetch();
        } catch (error) {
            // Error handled by hook
        }
    };

    const activeOutings = useMemo(() => {
        return filteredOutings.filter(o => o.displayStatus === 'OUTSIDE' || o.displayStatus === 'OVERDUE');
    }, [filteredOutings]);

    const completedOutings = useMemo(() => {
        return filteredOutings.filter(o => o.status === 'COMPLETED' || o.displayStatus === 'RETURNED');
    }, [filteredOutings]);

    const baseColumns: Column<ResidentOuting>[] = [
        {
            key: 'patient',
            header: 'Resident',
            cell: (outing) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 shadow-sm">
                        {(outing.patient?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="block font-extrabold text-slate-900">{outing.patient?.name || 'Resident'}</span>
                        {outing.patient?.elderId && (
                            <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                {outing.patient.elderId}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'destination',
            header: 'Destination & Reason',
            cell: (outing) => (
                <div>
                    <span className="block font-bold text-slate-900">{outing.destination}</span>
                    <span className="block text-xs text-slate-500">{outing.reason}</span>
                </div>
            )
        },
        {
            key: 'companion',
            header: 'Companion',
            cell: (outing) => {
                if (!outing.companionType || outing.companionType === 'ALONE') return <span className="text-sm font-bold text-slate-500">Alone</span>;
                if (outing.companionType === 'STAFF' && outing.companionStaff) {
                    return <span className="text-sm font-bold text-slate-800">{outing.companionStaff.user?.firstName} {outing.companionStaff.user?.lastName} (Staff)</span>;
                }
                if (outing.companionType === 'VISITOR' && outing.companionVisitorProfile) {
                    return <span className="text-sm font-bold text-slate-800">{outing.companionVisitorProfile.name} (Visitor)</span>;
                }
                if (outing.companionType === 'EXTERNAL' && outing.companionName) {
                    return <span className="text-sm font-bold text-slate-800">{outing.companionName} (External)</span>;
                }
                return <span className="text-sm font-bold text-slate-500">{outing.companionType}</span>;
            }
        },
        {
            key: 'time',
            header: 'Expected Time',
            cell: (outing) => (
                <div className="flex flex-col space-y-0.5">
                    <span className="text-xs text-slate-500">Exit: {formatTime(outing.expectedExitAt)}</span>
                    <span className="text-xs font-bold text-slate-800">Return: {formatTime(outing.expectedReturnAt)}</span>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            cell: (outing) => <StatusHighlighter value={outing.displayStatus} />
        }
    ];

    const activeColumns: Column<ResidentOuting>[] = [
        ...baseColumns,
        {
            key: 'actor',
            header: 'Recorded By',
            cell: (outing) => {
                const latestMovement = outing.movements?.[0];
                if (latestMovement?.status === 'OUTSIDE' && (latestMovement as any).exitRecordedByUser) {
                    const user = (latestMovement as any).exitRecordedByUser;
                    return (
                        <div>
                            <span className="block text-xs font-bold text-slate-800">{user.firstName} {user.lastName || ''}</span>
                            <span className="block text-[10px] text-slate-500">Exit Recorded By</span>
                        </div>
                    );
                }
                return '-';
            }
        }
    ];

    const completedColumns: Column<ResidentOuting>[] = [
        ...baseColumns,
        {
            key: 'actualTime',
            header: 'Actual Time',
            cell: (outing) => {
                const latestMovement = outing.movements?.[0];
                return (
                    <div className="flex flex-col space-y-0.5">
                        <span className="text-xs text-slate-500">Exit: {formatTime(latestMovement?.exitAt)}</span>
                        <span className="text-xs font-bold text-slate-800">Return: {formatTime(latestMovement?.actualReturnAt)}</span>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
                {[
                    { label: 'Total Outings', value: outings.length, tone: 'bg-slate-50 text-slate-700' },
                    { label: 'Currently Outside', value: outings.filter(o => o.displayStatus === 'OUTSIDE').length, tone: 'bg-indigo-50 text-indigo-700' },
                    { label: 'Overdue Returns', value: outings.filter(o => o.displayStatus === 'OVERDUE').length, tone: 'bg-rose-50 text-rose-700' }
                ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 px-4 py-3 ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <FilterSection searchQuery={searchQuery} onSearchChange={(event) => setSearchQuery(event.target.value)} searchPlaceholder="Search resident outings..." />
                    <button
                        type="button"
                        onClick={handleOpenNewOutingModal}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700"
                    >
                        <span className="text-lg leading-none">+</span> New Outing
                    </button>
                </div>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">ACTIVE OUTINGS</h2>
                        <DataTable
                            data={activeOutings}
                            columns={activeColumns}
                            keyExtractor={(outing) => outing.id}
                            isLoading={isLoading || isFetching}
                            actions={(outing) => (
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setActionModal({ type: 'view', outing })}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        View
                                    </button>
                                    {(outing.displayStatus === 'OUTSIDE' || outing.displayStatus === 'OVERDUE') && (
                                        <button
                                            type="button"
                                            onClick={() => setActionModal({ type: 'return', outing })}
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-600 hover:bg-emerald-100"
                                        >
                                            <LogIn className="h-3.5 w-3.5" />
                                            ARRIVED
                                        </button>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">COMPLETED OUTINGS</h2>
                        <DataTable
                            data={completedOutings}
                            columns={completedColumns}
                            keyExtractor={(outing) => outing.id}
                            isLoading={isLoading || isFetching}
                            actions={(outing) => (
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setActionModal({ type: 'view', outing })}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        View
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                </div>
            </section>

            <Modal
                isOpen={actionModal?.type === 'return'}
                onClose={() => setActionModal(null)}
                title="Confirm Resident ARRIVAL"
                type="success"
                confirmLabel={recordExit.isPending || recordReturn.isPending ? 'Recording...' : 'Confirm'}
                confirmDisabled={recordExit.isPending || recordReturn.isPending}
                onConfirm={handleConfirmAction}
            >
                {actionModal?.outing && (
                    <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                        <p>
                            Are you sure you want to record the physical <strong>RETURN</strong> of 
                            resident <span className="font-extrabold text-slate-950">{actionModal.outing.patient?.name}</span>?
                        </p>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={actionModal?.type === 'view'}
                onClose={() => setActionModal(null)}
                title="Resident Outing Details"
                type="info"
            >
                {actionModal?.outing && (
                    <div className="mt-4 space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <div>
                                <p className="font-extrabold text-slate-900 text-base">{actionModal.outing.patient?.name}</p>
                                {actionModal.outing.patient?.elderId && <p className="text-xs font-bold text-slate-500">ID: {actionModal.outing.patient.elderId}</p>}
                            </div>
                            <StatusHighlighter value={actionModal.outing.displayStatus} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-xs font-bold text-slate-400">Reason</span>
                                <span className="font-bold text-slate-800">{actionModal.outing.reason}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-400">Destination</span>
                                <span className="font-bold text-slate-800">{actionModal.outing.destination}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-400">Expected Exit</span>
                                <span className="font-bold text-slate-800">{formatTime(actionModal.outing.expectedExitAt)}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-400">Expected Return</span>
                                <span className="font-bold text-slate-800">{formatTime(actionModal.outing.expectedReturnAt)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isNewOutingModalOpen}
                onClose={() => setIsNewOutingModalOpen(false)}
                title="New Resident Outing"
                type="info"
                confirmLabel={createOuting.isPending ? 'Saving...' : 'Save Outing'}
                confirmDisabled={
                    createOuting.isPending || 
                    !newOuting.patientId || 
                    !(newOuting.reasonSelection === 'Other' ? newOuting.customReason.trim() : newOuting.reasonSelection) || 
                    !(newOuting.destinationSelection === 'Other' ? newOuting.customDestination.trim() : newOuting.destinationSelection) || 
                    !newOuting.expectedReturnDate ||
                    !newOuting.expectedReturnTime
                }
                onConfirm={handleCreateOuting}
            >
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                            Select Resident *
                        </label>
                        <select
                            value={newOuting.patientId}
                            onChange={(e) => setNewOuting({ ...newOuting, patientId: e.target.value })}
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-900"
                        >
                            <option value="">Select Resident...</option>
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name || (p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : 'Unknown')}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Select
                                label="Reason *"
                                value={newOuting.reasonSelection}
                                onChange={(e) => setNewOuting({ ...newOuting, reasonSelection: e.target.value })}
                                placeholder="Select Reason..."
                                required
                                options={[
                                    { label: 'Family Visit', value: 'Family Visit' },
                                    { label: 'Medical Appointment', value: 'Medical Appointment' },
                                    { label: 'Hospital Visit', value: 'Hospital Visit' },
                                    { label: 'Personal Work', value: 'Personal Work' },
                                    { label: 'Religious Visit', value: 'Religious Visit' },
                                    { label: 'Shopping / Essentials', value: 'Shopping / Essentials' },
                                    { label: 'Social Visit', value: 'Social Visit' },
                                    { label: 'Other', value: 'Other' }
                                ]}
                            />
                            {newOuting.reasonSelection === 'Other' && (
                                <Input
                                    label="Custom Reason *"
                                    value={newOuting.customReason}
                                    onChange={(e) => setNewOuting({ ...newOuting, customReason: e.target.value })}
                                    required
                                />
                            )}
                        </div>

                        <div className="space-y-3">
                            <Select
                                label="Destination *"
                                value={newOuting.destinationSelection}
                                onChange={(e) => setNewOuting({ ...newOuting, destinationSelection: e.target.value })}
                                placeholder="Select Destination..."
                                required
                                options={[
                                    { label: 'Hospital', value: 'Hospital' },
                                    { label: 'Clinic', value: 'Clinic' },
                                    { label: 'Home / Family Residence', value: 'Home / Family Residence' },
                                    { label: 'Temple / Religious Place', value: 'Temple / Religious Place' },
                                    { label: 'Shopping / Market', value: 'Shopping / Market' },
                                    { label: 'Bank / Financial Institution', value: 'Bank / Financial Institution' },
                                    { label: 'Government Office', value: 'Government Office' },
                                    { label: 'Other', value: 'Other' }
                                ]}
                            />
                            {newOuting.destinationSelection === 'Other' && (
                                <Input
                                    label="Custom Destination *"
                                    value={newOuting.customDestination}
                                    onChange={(e) => setNewOuting({ ...newOuting, customDestination: e.target.value })}
                                    required
                                />
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Expected Return Date *"
                            type="date"
                            value={newOuting.expectedReturnDate}
                            onChange={(e) => setNewOuting({ ...newOuting, expectedReturnDate: e.target.value })}
                            required
                        />
                        <Input
                            label="Expected Return Time *"
                            type="time"
                            value={newOuting.expectedReturnTime}
                            onChange={(e) => setNewOuting({ ...newOuting, expectedReturnTime: e.target.value })}
                            required
                        />
                    </div>
                    
                    <div>
                        <Select
                            label="Companion Type"
                            value={newOuting.companionType}
                            onChange={(e) => setNewOuting({ ...newOuting, companionType: e.target.value })}
                            options={[
                                { label: 'None (Alone)', value: '' },
                                { label: 'Staff Member', value: 'STAFF' },
                                { label: 'External / Family', value: 'EXTERNAL' },
                                { label: 'Registered Visitor', value: 'VISITOR' }
                            ]}
                        />
                    </div>
                    
                    {newOuting.companionType === 'STAFF' && (
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                Select Staff Companion *
                            </label>
                            <select
                                value={newOuting.companionStaffId}
                                onChange={(e) => setNewOuting({ ...newOuting, companionStaffId: e.target.value })}
                                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-900"
                            >
                                <option value="">Select Staff Member...</option>
                                {staffList.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()} ({s.empId})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {(newOuting.companionType === 'EXTERNAL' || newOuting.companionType === 'VISITOR') && (
                        <Input
                            label="Companion Name *"
                            value={newOuting.companionName}
                            onChange={(e) => setNewOuting({ ...newOuting, companionName: e.target.value })}
                            required
                        />
                    )}
                    
                    <div className="pt-2 border-t border-slate-100">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Materials (Optional)</label>
                        <VisitorMaterialEntry
                            onChange={handleMaterialsChange}
                            onValidityChange={handleValidityChange}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
