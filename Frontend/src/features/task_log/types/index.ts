export interface Task {
    id: string
    refNo?: string
    title: string
    description: string
    createdAt?: string
    assigneeId?: string
    assignedStaffId?: string
    assignedTo: string
    approvalAuthorityId?: string
    assignedBy?: string
    type?: 'DAILY' | 'SCHEDULED' | string
    dueDate: string
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'Pending' | 'In Progress' | 'Completed' | 'Verified' | string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'Low' | 'Medium' | 'High' | string
    completedAt?: string | null
}

export interface UserProfile {
    id: string
    empId: string
    name: string
    role: string
    department: string
    email: string
    phone: string
    avatar?: string
}
