import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProjectExpenditures,
    createProjectExpenditure,
    approveProjectExpenditure,
} from '../services/expenditureService';
import { getProjects } from '../../projects/services/projectService';
import { PageHeader } from '../../../components/PageHeader';
import { DataTable } from '../../../components/DataTable';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { useToast } from '../../../components/Toast';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const currency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

export function ExpenditureList() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectId, setProjectId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Execution');

    const { data: expenditures = [], isLoading } = useQuery({
        queryKey: ['projectExpenditures'],
        queryFn: getProjectExpenditures,
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    const createMutation = useMutation({
        mutationFn: createProjectExpenditure,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectExpenditures'] });
            toast({ title: 'Success', message: 'Expenditure request submitted', type: 'success' });
            setIsModalOpen(false);
            setProjectId('');
            setAmount('');
            setDescription('');
        },
        onError: (err: any) => {
            toast({ title: 'Error', message: err.message || 'Failed to record expenditure', type: 'error' });
        },
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
            approveProjectExpenditure(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectExpenditures'] });
            toast({ title: 'Success', message: 'Expenditure status updated', type: 'success' });
        },
        onError: (err: any) => {
            toast({ title: 'Error', message: err.message || 'Failed to update approval status', type: 'error' });
        },
    });

    const columns = [
        {
            key: 'project',
            header: 'Project',
            cell: (row: any) => <span className="font-extrabold text-slate-900">{row.project?.name || 'General Project'}</span>,
        },
        {
            key: 'category',
            header: 'Category',
            cell: (row: any) => row.category || 'Execution',
        },
        {
            key: 'description',
            header: 'Description',
            cell: (row: any) => row.description || '-',
        },
        {
            key: 'amount',
            header: 'Amount',
            cell: (row: any) => <span className="font-black text-rose-700">{currency(row.amount)}</span>,
        },
        {
            key: 'approvalStatus',
            header: 'Approval Status',
            cell: (row: any) => {
                const status = row.approvalStatus || 'PENDING';
                return (
                    <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold border ${
                            status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                    >
                        {status}
                    </span>
                );
            },
        },
        {
            key: 'date',
            header: 'Date',
            cell: (row: any) => (row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-'),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Project Expenditures"
                subtitle="Record and approve project expenses incurred during charitable execution."
                breadcrumbs={[{ label: 'UNCF' }, { label: 'Expenditures' }]}
                action={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] hover:bg-[#0D8287] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors"
                    >
                        <Plus size={18} />
                        Log Expenditure
                    </button>
                }
            />

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 shadow-xs">
                <DataTable
                    columns={columns}
                    data={expenditures}
                    isLoading={isLoading}
                    keyExtractor={(r: any) => r.id}
                    emptyStateMessage="No project expenditures logged yet."
                    actions={(row: any) =>
                        row.approvalStatus === 'PENDING' ? (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => approveMutation.mutate({ id: row.id, status: 'APPROVED' })}
                                    disabled={approveMutation.isPending}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                >
                                    <CheckCircle size={13} />
                                    Approve
                                </button>
                                <button
                                    onClick={() => approveMutation.mutate({ id: row.id, status: 'REJECTED' })}
                                    disabled={approveMutation.isPending}
                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 px-2.5 py-1 text-xs font-bold text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                                >
                                    <XCircle size={13} />
                                    Reject
                                </button>
                            </div>
                        ) : null
                    }
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Project Expenditure">
                <div className="space-y-4">
                    <Select
                        label="Project *"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        options={projects.map((p: any) => ({ value: p.id, label: p.name }))}
                        placeholder="Select Project..."
                    />
                    <Input
                        label="Expense Amount (₹) *"
                        type="number"
                        placeholder="e.g. 25000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Input
                        label="Expense Category"
                        placeholder="e.g. Food Purchase, Medical Supplies, Transport"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                    <Input
                        label="Description / Purpose"
                        placeholder="Expenditure proof notes or vendor detail"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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
                                    category,
                                    description,
                                })
                            }
                            className="rounded-xl bg-[#0F969C] hover:bg-[#0D8287] px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Submitting...' : 'Log Expense'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
