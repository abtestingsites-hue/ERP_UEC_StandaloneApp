export interface Complaint {
    id: string
    ticketNo: string
    date: string
    clientName: string
    unitId: string
    category: string
    priority: 'Low' | 'Medium' | 'High' | 'Critical'
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
    description: string
    assignedTo?: string
    assignedStaffId?: string
    complaintTaskId?: string
    resolutionNotes?: string
    resolvedAt?: string
    closedAt?: string
}
