import { z } from 'zod'

export const complaintSchema = z.object({
    clientName: z.string().min(2, "Client name is required"),
    unitId: z.string().min(1, "Unit is required"),
    category: z.string().min(1, "Category is required"),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    description: z.string().min(10, "Description must be at least 10 characters"),
    status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']),
    assignedTo: z.string().optional()
})

export type ComplaintFormValues = z.infer<typeof complaintSchema>
