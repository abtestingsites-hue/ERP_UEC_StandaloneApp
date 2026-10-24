import { z } from 'zod'

export const vitalSchema = z.object({
    clientName: z.string().min(2, 'Client name is required'),
    unitId: z.string().min(1, 'Unit is required'),
    bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, 'Must be in XXX/YY format'),
    heartRate: z.coerce.number().min(30).max(250),
    temperature: z.coerce.number().min(90).max(110),
    oxygenLevel: z.coerce.number().min(0).max(100)
})

export type VitalFormValues = z.infer<typeof vitalSchema>

export const revenueSchema = z.object({
    clientName: z.string().min(2, 'Client name is required'),
    unitId: z.string().min(1, 'Unit is required'),
    serviceCategory: z.enum(['Room', 'Pharmacy', 'Consumables', 'Physiotherapy']),
    amount: z.coerce.number().min(1),
    status: z.enum(['Billed', 'Paid', 'Pending'])
})

export type RevenueFormValues = z.infer<typeof revenueSchema>
