export const demoAccountTransactions = [
    {
        id: 'DEMO-TXN-1001',
        date: '2026-05-14',
        receiptNo: 'RCPT-2401',
        clientName: 'Meera Nair',
        category: 'Admission Fee',
        amount: 18000,
        mode: 'UPI',
        status: 'APPROVED',
        type: 'RECEIPT',
        notes: 'Initial admission advance',
        recordedBy: 'Admin',
        currentStatus: 'APPROVED'
    },
    {
        id: 'DEMO-TXN-1002',
        date: '2026-05-14',
        receiptNo: 'VCH-3308',
        clientName: 'Sri Medicals',
        category: 'Medical Supplies',
        amount: -4250,
        mode: 'Bank Transfer',
        status: 'PENDING_APPROVAL',
        type: 'EXPENSE',
        notes: 'Medicine and dressing stock refill',
        recordedBy: 'Admin',
        currentStatus: 'PENDING_APPROVAL'
    },
    {
        id: 'DEMO-TXN-1003',
        date: '2026-05-13',
        receiptNo: 'VCH-3312',
        clientName: 'Kitchen Vendor',
        category: 'In-House',
        amount: -2800,
        mode: 'Cash',
        status: 'APPROVED',
        type: 'EXPENSE',
        notes: 'Resident meal provisions',
        recordedBy: 'Admin',
        currentStatus: 'APPROVED',
        vendor: 'Kitchen Vendor',
        remarks: 'Breakfast and dinner supplies'
    },
    {
        id: 'DEMO-TXN-1004',
        date: '2026-05-12',
        receiptNo: 'RCPT-2408',
        clientName: 'Rohan Menon',
        category: 'Recurring Service',
        amount: 12500,
        mode: 'Cash',
        status: 'PENDING_APPROVAL',
        type: 'RECEIPT',
        notes: 'Monthly care payment',
        recordedBy: 'Admin',
        currentStatus: 'PENDING_APPROVAL'
    }
]

export const demoHomeCareAllocations = [
    { id: 'DEMO-HC-101', service: 'Home Nursing', clientName: 'Lakshmi Rao', status: 'Pending', contract: 'Monthly', staffName: undefined },
    { id: 'DEMO-HC-102', service: 'Physiotherapy Visit', clientName: 'Suresh Iyer', status: 'Allocated', contract: 'Weekly', staffName: 'Nurse Kavya' },
    { id: 'DEMO-HC-103', service: 'Elder Companion Care', clientName: 'Janani Bose', status: 'Completed', contract: 'One-time', staffName: 'Caregiver Nila' }
]

export const demoOtherAllocations = [
    { id: 'DEMO-OTH-101', ref: 'ENQ-2451', service: 'Medicine Pickup', clientName: 'Arjun Das', status: 'Pending', staffName: 'Assigned Staff' },
    { id: 'DEMO-OTH-102', ref: 'ENQ-2456', service: 'Lab Sample Collection', clientName: 'Priya Menon', status: 'Allocated', staffName: 'Ravi Menon' },
    { id: 'DEMO-OTH-103', ref: 'ENQ-2462', service: 'Doctor Escort', clientName: 'George Thomas', status: 'Completed', staffName: 'Meera Joseph' }
]

export const demoClinicalAllocations = [
    { id: 'DEMO-CLN-101', ref: 'ENQ-2601', service: 'Doctor Consultation', clientName: 'Vikram S', mode: 'Phone', createdBy: 'Reception', patient: 'Vikram S / 72 yrs' },
    { id: 'DEMO-CLN-102', ref: 'ENQ-2607', service: 'Wound Dressing', clientName: 'Kamala Devi', mode: 'Walk-in', createdBy: 'Nurse Desk', patient: 'Kamala Devi / 68 yrs' },
    { id: 'DEMO-CLN-103', ref: 'ENQ-2612', service: 'Vitals Review', clientName: 'Naveen Patel', mode: 'WhatsApp', createdBy: 'Care Desk', patient: 'Naveen Patel / 64 yrs' }
]

export const demoInHouseCareAllocations = [
    { id: 'DEMO-IHC-101', service: 'Assisted Living', clientName: 'Meera Nair', guardian: 'Anil Nair', status: 'Allocated', payment: 'Paid / Room A-204' },
    { id: 'DEMO-IHC-102', service: 'Memory Care', clientName: 'Rohan Menon', guardian: 'Priya Menon', status: 'Pending', payment: 'Partial / Room pending' },
    { id: 'DEMO-IHC-103', service: 'Post Operative Care', clientName: 'Lakshmi Rao', guardian: 'Karthik Rao', status: 'Completed', payment: 'Paid / Discharged' }
]

export const demoInHouseRevenue = [
    { id: 'DEMO-REV-101', service: 'Assisted Living', clientName: 'Meera Nair', guardian: 'Anil Nair', revenue: 'Rs 2,800 / day' },
    { id: 'DEMO-REV-102', service: 'Memory Care', clientName: 'Rohan Menon', guardian: 'Priya Menon', revenue: 'Rs 3,400 / day' },
    { id: 'DEMO-REV-103', service: 'Post Operative Care', clientName: 'Lakshmi Rao', guardian: 'Karthik Rao', revenue: 'Rs 3,100 / day' }
]

export const demoWelcomeCalls = [
    { id: 'DEMO-WC-101', clientId: 'CL-1001', ref: 'ENQ-2401', clientName: 'Meera Nair', service: 'In-House Care', status: 'PENDING', notes: 'Intro call pending', callDate: '2026-05-14', createdAt: '2026-05-14T09:00:00.000Z' },
    { id: 'DEMO-WC-102', clientId: 'CL-1002', ref: 'ENQ-2408', clientName: 'Rohan Menon', service: 'Home Nursing', status: 'COMPLETED', notes: 'Family confirmed service interest', callDate: '2026-05-13', createdAt: '2026-05-13T10:30:00.000Z' },
    { id: 'DEMO-WC-103', clientId: 'CL-1003', ref: 'ENQ-2412', clientName: 'Lakshmi Rao', service: 'Physiotherapy', status: 'PENDING', notes: 'Callback requested after 5 PM', callDate: '2026-05-14', createdAt: '2026-05-14T11:15:00.000Z' }
]

export const demoComplaints = [
    { id: 'DEMO-CMP-101', ticketNo: 'CMP-3101', ref: 'CL-1001', date: '2026-05-14', clientName: 'Meera Nair', phone: '9876543210', category: 'Service Delay', priority: 'MEDIUM', status: 'New Complaint', description: 'Nurse visit delayed by 30 minutes', staff: 'Nurse Kavya', unitId: '11111111-1111-1111-1111-111111111111' },
    { id: 'DEMO-CMP-102', ticketNo: 'CMP-3106', ref: 'CL-1002', date: '2026-05-13', clientName: 'Rohan Menon', phone: '9876501122', category: 'Billing Query', priority: 'LOW', status: 'Issue Rectified', description: 'Invoice copy resent to family', staff: 'Finance Team', unitId: '11111111-1111-1111-1111-111111111111' },
    { id: 'DEMO-CMP-103', ticketNo: 'CMP-3110', ref: 'CL-1003', date: '2026-05-12', clientName: 'Lakshmi Rao', phone: '9876503344', category: 'Care Feedback', priority: 'HIGH', status: 'Under Review', description: 'Care plan change requested', staff: 'Care Coordinator', unitId: '22222222-2222-2222-2222-222222222222' }
]

export const demoPendingFeedback = [
    { id: 'DEMO-FB-101', ref: 'CL-1001', service: 'Home Nursing', clientName: 'Meera Nair', status: 'Allocated', allocatedDetails: 'Nurse Kavya / Today 6 PM' },
    { id: 'DEMO-FB-102', ref: 'CL-1002', service: 'Physiotherapy', clientName: 'Rohan Menon', status: 'Pending', allocatedDetails: 'Awaiting visit completion' },
    { id: 'DEMO-FB-103', ref: 'CL-1003', service: 'In-House Care', clientName: 'Lakshmi Rao', status: 'Completed', allocatedDetails: 'Care Coordinator follow-up due' }
]

export const demoServiceHistory = [
    { id: 'DEMO-HIS-101', ref: 'CL-1001', service: 'In-House Care', clientName: 'Meera Nair', status: 'Completed', allocatedDetails: 'Room A-204 / May cycle completed' },
    { id: 'DEMO-HIS-102', ref: 'CL-1002', service: 'Home Nursing', clientName: 'Rohan Menon', status: 'Completed', allocatedDetails: '12 visits completed by Nurse Kavya' },
    { id: 'DEMO-HIS-103', ref: 'CL-1003', service: 'Medicine Pickup', clientName: 'Lakshmi Rao', status: 'Completed', allocatedDetails: 'Delivered by Ravi Menon' }
]

export const demoCalls = [
    { id: 'DEMO-CALL-101', callSid: 'CALL-DEMO-101', customerName: 'Meera Nair', customerPhone: '+919876543210', direction: 'outbound', status: 'answered', duration: 214, provider: 'exotel', agentName: 'Care Desk', agentEmail: 'care@example.com', startedAt: '2026-05-14T09:20:00.000Z', recordingUrl: '' },
    { id: 'DEMO-CALL-102', callSid: 'CALL-DEMO-102', customerName: 'Rohan Menon', customerPhone: '+919876501122', direction: 'inbound', status: 'missed', duration: 0, provider: 'exotel', agentName: 'Reception', agentEmail: 'frontdesk@example.com', startedAt: '2026-05-14T10:05:00.000Z', recordingUrl: '' },
    { id: 'DEMO-CALL-103', callSid: 'CALL-DEMO-103', customerName: 'Lakshmi Rao', customerPhone: '+919876503344', direction: 'outbound', status: 'answered', duration: 96, provider: 'twilio', agentName: 'Finance Team', agentEmail: 'finance@example.com', startedAt: '2026-05-13T16:40:00.000Z', recordingUrl: '' }
]

export const demoCallAnalytics = {
    totalCalls: demoCalls.length,
    answeredCalls: demoCalls.filter((call) => call.status === 'answered').length,
    missedCalls: demoCalls.filter((call) => call.status === 'missed').length,
    averageDuration: Math.round(demoCalls.reduce((total, call) => total + call.duration, 0) / demoCalls.length)
}

export const demoAutomationRules = [
    {
        id: 'DEMO-RULE-101',
        name: 'High Priority In-House Care',
        module: 'enquiry',
        conditions: { logic: 'AND', conditions: [{ field: 'input.serviceType', operator: '=', value: 'In-House Care' }, { field: 'input.clientComments', operator: 'contains', value: 'urgent' }] },
        action: 'set_priority',
        actionValue: 'HIGH',
        priority: 90,
        status: true
    },
    {
        id: 'DEMO-RULE-102',
        name: 'Large Expense Approval',
        module: 'accounts',
        conditions: { logic: 'AND', conditions: [{ field: 'computed.score', operator: '>', value: '75' }] },
        action: 'auto_approve',
        actionValue: 'finance_review',
        priority: 70,
        status: true
    },
    {
        id: 'DEMO-RULE-103',
        name: 'HR Follow-Up Flag',
        module: 'hr',
        conditions: { logic: 'AND', conditions: [{ field: 'message', operator: 'contains', value: 'leave' }] },
        action: 'flag_anomaly',
        actionValue: 'hr_attention',
        priority: 40,
        status: false
    }
]

export const demoTaskStaff = [
    {
        id: 'DEMO-STF-101',
        empId: 'UEC-STF-101',
        name: 'Kavya Rao',
        photoUrl: undefined,
        role: 'Nurse',
        department: 'Care Operations',
        unitId: '11111111-1111-1111-1111-111111111111',
        phone: '9876501001',
        email: 'kavya.rao@example.com',
        joiningDate: '2026-04-01',
        status: 'Active',
        isDeleted: false,
        metadata: {},
        user: { id: 'DEMO-USR-101', email: 'kavya.rao@example.com', isActive: true }
    },
    {
        id: 'DEMO-STF-102',
        empId: 'UEC-STF-102',
        name: 'Ravi Menon',
        photoUrl: undefined,
        role: 'Caregiver',
        department: 'Resident Support',
        unitId: '11111111-1111-1111-1111-111111111111',
        phone: '9876501002',
        email: 'ravi.menon@example.com',
        joiningDate: '2026-04-08',
        status: 'Active',
        isDeleted: false,
        metadata: {},
        user: { id: 'DEMO-USR-102', email: 'ravi.menon@example.com', isActive: true }
    },
    {
        id: 'DEMO-STF-103',
        empId: 'UEC-STF-103',
        name: 'Meera Joseph',
        photoUrl: undefined,
        role: 'Housekeeping Lead',
        department: 'Elder Operations',
        unitId: '11111111-1111-1111-1111-111111111111',
        phone: '9876501003',
        email: 'meera.joseph@example.com',
        joiningDate: '2026-04-12',
        status: 'Active',
        isDeleted: false,
        metadata: {},
        user: { id: 'DEMO-USR-103', email: 'meera.joseph@example.com', isActive: true }
    }
]

export const demoTaskLogTasks = [
    {
        id: 'DEMO-DTASK-101',
        title: 'Morning vitals round for Room A wing',
        description: 'Record BP, pulse, SpO2, and temperature for assigned residents.',
        createdAt: '2026-05-14T08:00:00.000Z',
        assigneeId: 'DEMO-USR-101',
        assignedStaffId: 'DEMO-STF-101',
        assignedTo: 'Kavya Rao',
        approvalAuthorityId: 'DEMO-USR-103',
        assignedBy: 'Meera Joseph',
        type: 'DAILY',
        dueDate: '2026-05-14',
        status: 'COMPLETED',
        priority: 'HIGH'
    },
    {
        id: 'DEMO-DTASK-102',
        title: 'Update resident hydration chart',
        description: 'Check and update hydration intake for afternoon shift.',
        createdAt: '2026-05-14T09:15:00.000Z',
        assigneeId: 'DEMO-USR-102',
        assignedStaffId: 'DEMO-STF-102',
        assignedTo: 'Ravi Menon',
        approvalAuthorityId: 'DEMO-USR-103',
        assignedBy: 'Meera Joseph',
        type: 'DAILY',
        dueDate: '2026-05-14',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM'
    },
    {
        id: 'DEMO-DTASK-103',
        title: 'Laundry handover checklist',
        description: 'Verify linen count and room-wise handover.',
        createdAt: '2026-05-13T17:20:00.000Z',
        assigneeId: 'DEMO-USR-103',
        assignedStaffId: 'DEMO-STF-103',
        assignedTo: 'Meera Joseph',
        approvalAuthorityId: 'DEMO-USR-101',
        assignedBy: 'Kavya Rao',
        type: 'DAILY',
        dueDate: '2026-05-13',
        status: 'REJECTED',
        priority: 'LOW'
    },
    {
        id: 'DEMO-STASK-101',
        title: 'Weekly room safety audit',
        description: 'Inspect call bells, bed rails, and fall-risk markers.',
        createdAt: '2026-05-12T10:00:00.000Z',
        assigneeId: 'DEMO-USR-103',
        assignedStaffId: 'DEMO-STF-103',
        assignedTo: 'Meera Joseph',
        approvalAuthorityId: 'DEMO-USR-101',
        assignedBy: 'Kavya Rao',
        type: 'SCHEDULED',
        dueDate: '2026-05-16',
        status: 'COMPLETED',
        priority: 'HIGH'
    },
    {
        id: 'DEMO-STASK-102',
        title: 'Monthly medication trolley deep clean',
        description: 'Clean trolley, verify labels, and update checklist.',
        createdAt: '2026-05-10T14:30:00.000Z',
        assigneeId: 'DEMO-USR-101',
        assignedStaffId: 'DEMO-STF-101',
        assignedTo: 'Kavya Rao',
        approvalAuthorityId: 'DEMO-USR-103',
        assignedBy: 'Meera Joseph',
        type: 'SCHEDULED',
        dueDate: '2026-05-20',
        status: 'ASSIGNED',
        priority: 'MEDIUM'
    },
    {
        id: 'DEMO-STASK-103',
        title: 'Resident activity board update',
        description: 'Update weekly engagement schedule and attendance plan.',
        createdAt: '2026-05-11T11:45:00.000Z',
        assigneeId: 'DEMO-USR-102',
        assignedStaffId: 'DEMO-STF-102',
        assignedTo: 'Ravi Menon',
        approvalAuthorityId: 'DEMO-USR-103',
        assignedBy: 'Meera Joseph',
        type: 'SCHEDULED',
        dueDate: '2026-05-18',
        status: 'APPROVED',
        priority: 'LOW'
    }
]
