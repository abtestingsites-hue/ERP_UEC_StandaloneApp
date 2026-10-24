export interface RevenueRecord {
    id: string
    date: string
    clientName: string
    unitId: string
    serviceCategory: 'Room' | 'Pharmacy' | 'Consumables' | 'Physiotherapy'
    amount: number
    status: 'Billed' | 'Paid' | 'Pending'
}

export interface VitalRecord {
    id: string
    timestamp: string
    clientName: string
    unitId: string
    bloodPressure: string
    heartRate: number
    temperature: number
    oxygenLevel: number
    recordedBy: string
}
