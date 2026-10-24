import { z } from 'zod'

export const transactionSchema = z.object({
    clientName: z.string().min(2, "Client name is required"),
    category: z.string().min(1, "Category is required"),
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    mode: z.enum(['Cash', 'Card', 'UPI', 'Bank Transfer']),
    remarks: z.string().optional()
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
