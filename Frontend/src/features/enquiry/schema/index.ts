import { z } from 'zod'

export const enquirySchema = z.object({
    unitId: z.string().min(1, "Unit is required"),
    service: z.string().min(1, "Service is required"),
    mode: z.enum(['Call', 'Walk-in', 'Website', 'Reference']),
    clientName: z.string().min(2, "Client name is required"),
    mobile: z.string().min(10, "Valid mobile number is required"),
    email: z.string().email("Valid email required").optional().or(z.literal('')),
    comments: z.string().optional(),
    status: z.enum(['Open', 'In Progress', 'Converted', 'Lost', 'Emergency', 'Important', 'Just Enquiry']),
    leadQuality: z.enum(['Hot', 'Warm', 'Cold', 'Fake / Invalid']),
    enquiryIntent: z.enum(['Ready to start service', 'Needs pricing discussion', 'Needs family discussion', 'Just checking', 'Wrong / fake enquiry']),
    followUpPriority: z.enum(['Today', 'Within 24 hours', 'This week', 'No follow-up needed']),
    patientName: z.string().optional(),
    patientAge: z.string().optional(),
    patientGender: z.string().optional(),
    patientHealthCondition: z.string().optional(),
    clientAddress: z.string().optional(),
    clientLocation: z.string().optional(),
    remarks: z.string().optional(),
    followupMode: z.string().optional(),
    followupStatus: z.string().optional(),
    leadValidity: z.string().optional(),
    conversionReadiness: z.string().optional(),
    urgency: z.string().optional(),
    clientInterest: z.string().optional(),
    readyToPayAmount: z.string().optional(),
    paymentMode: z.string().optional(),
    nextFollowupDate: z.string().optional(),
    staffId: z.string().optional(),
    attachmentName: z.string().optional(),
    followupComments: z.string().optional()
})

export type EnquiryFormValues = z.infer<typeof enquirySchema>
