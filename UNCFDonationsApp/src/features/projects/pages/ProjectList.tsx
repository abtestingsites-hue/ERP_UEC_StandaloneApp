import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject } from '../services/projectService';
import { PageHeader } from '../../../components/PageHeader';
import { DataTable } from '../../../components/DataTable';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { useToast } from '../../../components/Toast';
import { Plus, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';

const currency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

export function ProjectList() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [description, setDescription] = useState('');

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    const createMutation = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast({ title: 'Success', message: 'Foundation project created successfully', type: 'success' });
            setIsModalOpen(false);
            setName('');
            setTotalBudget('');
            setDescription('');
        },
        onError: (err: any) => {
            toast({ title: 'Error', message: err.message || 'Failed to create project', type: 'error' });
        },
    });

    const columns = [
        {
            key: 'name',
            header: 'Project Name',
            cell: (row: any) => (
                <div>
                    <p className="font-extrabold text-slate-900">{row.name}</p>
                    {row.description && <p className="text-xs text-slate-500 mt-0.5">{row.description}</p>}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row: any) => (
                <span className="inline-flex rounded-md bg-sky-50 px-2.5 py-1 text-xs font-extrabold text-sky-800 border border-sky-200">
                    {row.status || 'PLANNED'}
                </span>
            ),
        },
        {
            key: 'totalBudget',
            header: 'Target Budget',
            cell: (row: any) => <span className="font-black text-slate-900">{currency(row.totalBudget)}</span>,
        },
        {
            key: 'createdAt',
            header: 'Created On',
            cell: (row: any) => (row.createdAt ? format(new Date(row.createdAt), 'dd MMM yyyy') : '-'),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Foundation Projects"
                subtitle="Manage charitable projects, targets, and social initiative budgets."
                breadcrumbs={[{ label: 'UNCF' }, { label: 'Projects' }]}
                action={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] hover:bg-[#0D8287] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors"
                    >
                        <Plus size={18} />
                        New Project
                    </button>
                }
            />

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#072E33]/60 shadow-xs">
                <DataTable
                    columns={columns}
                    data={projects}
                    isLoading={isLoading}
                    keyExtractor={(r: any) => r.id}
                    emptyStateMessage="No foundation projects created yet."
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Foundation Project">
                <div className="space-y-4">
                    <Input
                        label="Project Name *"
                        placeholder="e.g. Medical Aid Drive 2026"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                        label="Target Budget (₹) *"
                        type="number"
                        placeholder="e.g. 500000"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(e.target.value)}
                    />
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Goal</label>
                        <textarea
                            rows={3}
                            placeholder="Project scope and beneficiary goals..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05161A] p-3 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0F969C] focus:outline-none focus:ring-1 focus:ring-[#0F969C] transition-colors"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100 dark:border-white/10">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={createMutation.isPending || !name || !totalBudget}
                            onClick={() =>
                                createMutation.mutate({
                                    name,
                                    totalBudget: Number(totalBudget) || 0,
                                    description,
                                    status: 'PLANNED',
                                })
                            }
                            className="rounded-xl bg-[#0F969C] hover:bg-[#0D8287] px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
