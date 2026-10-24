export interface Donor {
    id: string;
    donorNo: string;
    name: string;
    residentialAddress?: string;
    permanentAddress?: string;
    mobile?: string;
    whatsappNumber?: string;
    email?: string;
    panNumber?: string;
    dob?: string | Date;
    fatherOrHusbandName?: string;
    isCorporate: boolean;
    createdAt: string;
}

export interface DonationReference {
    id: string;
    name: string;
    mobile?: string;
}

export interface Donation {
    id: string;
    receiptNo: string;
    donorId: string;
    donor?: Donor;
    
    date: string;
    amount: number;
    amountInWords?: string;
    
    paymentMode: string;
    materialDetails?: string;
    
    category?: string;
    purpose?: string;
    
    occasionName?: string;
    occasionRelation?: string;
    occasionDate?: string;
    occasionMobile?: string;
    
    recurringPlan?: string;
    
    preferredPrayerDate?: string | Date;
    honouredPersonImage?: string;
    specialPrayerMessage?: string;
    wishToVisitHome?: boolean;
    preferredVisitDate?: string | Date;
    
    taxDeduction: boolean;
    
    receivedBy?: string;
    verifiedBy?: string;

    isReceiptSent?: boolean;
    receiptSentAt?: string;

    references?: DonationReference[];
    
    createdAt: string;
}
