import { useState } from 'react'
import { FileText, IndianRupee, Send } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { api } from '../../../lib/axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'

const useGenerateElderBill = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post('/uec/billing/generate', payload)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts-invoices'] })
            toast({ type: 'success', title: 'Generated', message: 'Billing invoice generated successfully' })
        }
    })
}

export function ElderBilling() {
    const [patientId, setPatientId] = useState('123e4567-e89b-12d3-a456-426614174000') // Placeholder UUID
    const [amount, setAmount] = useState<number | ''>('')
    const [type, setType] = useState('MONTHLY_BOARDING')
    const [description, setDescription] = useState('Monthly Boarding Fee')

    const generateBill = useGenerateElderBill()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || Number(amount) <= 0) return
        generateBill.mutate({
            patientId,
            amount: Number(amount),
            type,
            description
        })
    }

    return (
        <div className="w-full min-w-0 space-y-4 px-2 pb-6 sm:px-4 2xl:px-6">
            <PageHeader
                title="Elder Care Billing"
                subtitle="Generate recurring boarding fees and specialized elder invoices."
                breadcrumbs={[{ label: 'UEC' }, { label: 'Elder Finance' }, { label: 'Billing' }]}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Generate Invoice</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Create a direct unified invoice for an elder care resident.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="col-span-1 sm:col-span-2">
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Patient ID</label>
                            <input
                                type="text"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                                <FileText className="inline h-4 w-4 mr-1 text-[#0F969C]" /> Billing Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                <option value="MONTHLY_BOARDING">Monthly Boarding Fee</option>
                                <option value="SECURITY_DEPOSIT">Security Deposit</option>
                                <option value="ADDITIONAL_CARE">Additional Care Services</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                                <IndianRupee className="inline h-4 w-4 mr-1 text-[#0F969C]" /> Amount
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value) || '')}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                required
                            />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={generateBill.isPending}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0F969C] px-4 text-sm font-extrabold text-white transition hover:bg-[#0C7A7E] disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                        Generate Invoice
                    </button>
                </form>

                <div className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Billing Overview</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Summary of UEC billing policies.</p>
                    </div>

                    <div className="rounded-lg border border-primary-100 bg-[#0F969C]/10 p-4 text-sm text-primary-800 dark:border-primary-900/30 dark:bg-primary-900/10 dark:text-primary-300">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Monthly Boarding:</strong> Includes room, standard meals, and basic care. Generates a unified invoice.</li>
                            <li><strong>Security Deposit:</strong> Refundable deposit collected at admission.</li>
                            <li><strong>Additional Care:</strong> Extra services like physiotherapy, special diets, or escorted transport.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
