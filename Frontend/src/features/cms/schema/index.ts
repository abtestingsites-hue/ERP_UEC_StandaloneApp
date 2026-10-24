import { z } from 'zod'

export const blogSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    slug: z.string().min(5, 'Slug is required'),
    category: z.string().min(1, 'Category is required'),
    content: z.string().min(20, 'Content must be substantial'),
    status: z.enum(['Draft', 'Published', 'Archived'])
})

export type BlogFormValues = z.infer<typeof blogSchema>

export const faqSchema = z.object({
    question: z.string().min(10, 'Question must be at least 10 characters'),
    answer: z.string().min(10, 'Answer must be at least 10 characters'),
    category: z.string().min(1, 'Category is required'),
    displayOrder: z.coerce.number().min(0, 'Order must be positive'),
    status: z.enum(['Active', 'Inactive'])
})

export type FAQFormValues = z.infer<typeof faqSchema>
