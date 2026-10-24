export interface HomeCareAllocation {
    id: string
    service: string
    clientName: string
    status: 'Pending' | 'Allocated' | 'Completed'
    contract: string
    staffName?: string
    followUpDetail?: string
}

export interface InHouseCareAllocation {
    id: string
    service: string
    clientName: string
    guardianName: string
    status: 'Pending' | 'Allocated' | 'Completed'
    paymentStatus: 'Paid' | 'Unpaid' | 'Partial'
}
