export interface City {
    id: string
    name: string
    state: string
    country: string
    status: 'active' | 'inactive'
}

export interface Location {
    id: string
    name: string
    state: string
    country: string
    pincode?: string | null
    label: string
}

export interface Unit {
    id: string
    unitId: string
    logo?: string
    name: string
    shortName: string
    type: string
    locationId: string
    location: Location
    address: string
    pincode: string
    email: string
    phone: string
    status: 'active' | 'inactive'
}

export interface PaymentCategory {
    id: string
    accountType: 'Patient' | 'Vendor' | 'Staff'
    gateway: string
    subCategory: string
    trust: string
    status: 'active' | 'inactive'
}
