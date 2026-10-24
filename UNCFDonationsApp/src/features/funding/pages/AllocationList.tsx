import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFundingAllocations, createFundingAllocation } from '../services/fundingService';
import { getProjects } from '../../projects/services/projectService';
import { PageHeader } from '../../../components/PageHeader';
import { DataTable } from '../../../components/DataTable';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { useToast } from '../../../components/Toast';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

const currency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

export function AllocationList() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectId, setProjectId] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [source, setSource] = useState('General Donation Pool');

    const { data: allocations = [], isLoading } = useQuery({
        queryKey: ['fundingAllocations'],
        queryFn: getFundingAllocations,
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    const createMutation = useMutation({
        mutationFn: createFundingAllocation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fundingAllocations'] });
            toast({ title: 'Success', message: 'Fund allocation created successfully', type: 'success' });
            setIsModalOpen(false);
            setProjectId('');
            setAmount('');
            setNotes('');
        },
        onError: (err: any) => {
            toast({ title: 'Error', message: err.message || 'Failed to allocate funds', type: 'error' });
        },
    });

    const columns = [
        {
            key: 'project',
            header: 'Assigned Project',
            cell: (row: any) => <span className="font-extrabold text-slate-900">{row.project?.name || 'Unassigned'}</span>,
        },
        {
            key: 'amount',
            header: 'Allocated Amount',
            cell: (row: any) => <span className="font-black text-emerald-700">{currency(row.amount)}</span>,
        },
        {
            key: 'source',
            header: 'Funding Source',
            cell: (row: any) => row.source || 'General Pool',
        },
        {
            key: 'notes',
            header: 'Notes',
            cell: (row: any) => row.notes || '-',
        },
        {
            key: 'date',
            header: 'Allocation Date',
            cell: (row: any) => (row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-'),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Funding Allocations"
                subtitle="Track and deploy foundation capital allocations to active social projects."
                breadcrumbs={[{ label: 'UNCF' }, { label: 'Funding' }]}
                action={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] hover:bg-[#0D8287] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors"
                    >
                        <Plus size={18} />
                        New Allocation
                    </button>
                }
            />

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 shadow-xs">
                <DataTable
                    columns={columns}
                    data={allocations}
                    isLoading={isLoading}
                    keyExtractor={(r: any) => r.id}
                    emptyStateMessage="No fund allocations recorded yet."
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Allocate Funds to Project">
                <div className="space-y-4">
                    <Select
                        label="Target Project *"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        options={projects.map((p: any) => ({ value: p.id, label: p.name }))}
                        placeholder="Select Project..."
                    />
                    <Input
                        label="Allocated Amount (₹) *"
                        type="number"
                        placeholder="e.g. 100000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Input
                        label="Funding Source"
                        placeholder="e.g. CSR Grant / Crowdfunding Pool"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                    />
                    <Input
                        label="Allocation Notes"
                        placeholder="Purpose or approval reference"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />

                    <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100 dark:border-white/10">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={createMutation.isPending || !projectId || !amount}
                            onClick={() =>
                                createMutation.mutate({
                                    projectId,
                                    amount: Number(amount) || 0,
                                    notes,
                                    source,
                                })
                            }
                            className="rounded-xl bg-[#0F969C] hover:bg-[#0D8287] px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Allocating...' : 'Allocate Funds'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
