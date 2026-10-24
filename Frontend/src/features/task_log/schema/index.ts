import { z } from 'zod'

export const taskSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional(),
    assigneeId: z.string().min(1, 'Assignee is required'),
    approvalAuthorityId: z.string().min(1, 'Approval Authority is required'),
    type: z.enum(['DAILY', 'SCHEDULED']),
    dueDate: z.string().optional(),
    priority: z.string().optional()
})

export type TaskFormValues = z.infer<typeof taskSchema>

export const assignTasksSchema = z.object({
    approvalAuthorityId: z.string().min(1, 'Approval Authority is required'),
    tasks: z.array(z.object({
        title: z.string().min(3, 'Task description is required')
    })).min(1, 'At least one task is required')
})

export type AssignTasksFormValues = z.infer<typeof assignTasksSchema>
