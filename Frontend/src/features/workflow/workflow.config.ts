export type WorkflowStatus = string

export interface WorkflowTransition {
    from: WorkflowStatus
    to: WorkflowStatus
    actionLabel: string
    actionColor?: string
    requireReason?: boolean
}

export interface WorkflowConfig {
    initial: WorkflowStatus
    transitions: WorkflowTransition[]
    terminal: WorkflowStatus[]
}

export const workflows = {
    enquiry: {
        initial: 'NEW',
        terminal: ['CLOSED', 'CONVERTED'],
        transitions: [
            { from: 'NEW', to: 'FOLLOW_UP', actionLabel: 'Begin Follow-Up', actionColor: 'bg-blue-600' },
            { from: 'FOLLOW_UP', to: 'INTERESTED', actionLabel: 'Mark Interested', actionColor: 'bg-green-600' },
            { from: 'FOLLOW_UP', to: 'CLOSED', actionLabel: 'Close Enquiry', requireReason: true, actionColor: 'bg-gray-600' },
            { from: 'INTERESTED', to: 'CONVERTED', actionLabel: 'Convert to Client', actionColor: 'bg-primary-600' },
            { from: 'INTERESTED', to: 'CLOSED', actionLabel: 'Close Enquiry', requireReason: true, actionColor: 'bg-gray-600' }
        ]
    } as WorkflowConfig,

    allocation: {
        initial: 'PENDING',
        terminal: ['COMPLETED', 'CANCELLED'],
        transitions: [
            { from: 'PENDING', to: 'ASSIGNED', actionLabel: 'Assign Staff', actionColor: 'bg-blue-600' },
            { from: 'ASSIGNED', to: 'IN_SERVICE', actionLabel: 'Start Service', actionColor: 'bg-indigo-600' },
            { from: 'IN_SERVICE', to: 'COMPLETED', actionLabel: 'Mark Completed', actionColor: 'bg-green-600' },
            { from: 'PENDING', to: 'CANCELLED', actionLabel: 'Cancel Allocation', requireReason: true, actionColor: 'bg-red-600' }
        ]
    } as WorkflowConfig,

    accounts: {
        initial: 'CREATED',
        terminal: ['POSTED', 'REJECTED'],
        transitions: [
            { from: 'CREATED', to: 'PENDING_APPROVAL', actionLabel: 'Submit for Approval', actionColor: 'bg-yellow-600' },
            { from: 'PENDING_APPROVAL', to: 'APPROVED', actionLabel: 'Approve', actionColor: 'bg-green-600' },
            { from: 'PENDING_APPROVAL', to: 'REJECTED', actionLabel: 'Reject', requireReason: true, actionColor: 'bg-red-600' },
            { from: 'APPROVED', to: 'POSTED', actionLabel: 'Post to Ledger', actionColor: 'bg-blue-600' }
        ]
    } as WorkflowConfig,

    tasks: {
        initial: 'PENDING_APPROVAL',
        terminal: ['APPROVED', 'REJECTED'],
        transitions: [
            { from: 'PENDING_APPROVAL', to: 'APPROVED', actionLabel: 'Approve', actionColor: 'bg-green-600' },
            { from: 'PENDING_APPROVAL', to: 'REJECTED', actionLabel: 'Reject Request', requireReason: true, actionColor: 'bg-red-600' }
        ]
    } as WorkflowConfig
}
