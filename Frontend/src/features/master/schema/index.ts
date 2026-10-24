import { z } from 'zod'

export const citySchema = z.object({
    name: z.string().min(2, "City name must be at least 2 characters"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    status: z.enum(['active', 'inactive'])
})

export type CityFormValues = z.infer<typeof citySchema>

export const unitSchema = z.object({
    logo: z.any().optional(), // In real app, proper file validation
    name: z.string().min(2, "Unit name is required"),
    shortName: z.string().min(1, "Short name is required"),
    type: z.string().min(1, "Type is required"),
    locationId: z.string().min(1, "Location is required"),
    locationLabel: z.string().min(1, "Location is required"),
    address: z.string().min(5, "Address is required"),
    pincode: z.string().min(5, "Valid pincode is required"),
    email: z.string().email("Valid email required"),
    phone: z.string().min(10, "Valid phone required"),
    status: z.enum(['active', 'inactive'])
})

export type UnitFormValues = z.infer<typeof unitSchema>

export const paymentCategorySchema = z.object({
    accountType: z.enum(['Patient', 'Vendor', 'Staff']),
    gateway: z.string().min(1, "Gateway is required"),
    subCategory: z.string().min(1, "Sub-category is required"),
    trust: z.string().min(1, "Trust is required"),
    status: z.enum(['active', 'inactive'])
})

export type PaymentCategoryFormValues = z.infer<typeof paymentCategorySchema>
