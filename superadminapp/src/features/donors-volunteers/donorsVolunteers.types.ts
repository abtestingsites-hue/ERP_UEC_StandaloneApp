// Donors, Donations & Volunteer Foundation Domain Interfaces

export interface Donor {
    id: string;
    donorNo: string;
    name: string;
    fatherOrHusbandName?: string | null;
    residentialAddress?: string | null;
    permanentAddress?: string | null;
    mobile?: string | null;
    whatsappNumber?: string | null;
    email?: string | null;
    panNumber?: string | null;
    dob?: string | Date | null;
    isCorporate: boolean;
    tenantId: string;
    unitId?: string | null;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface DonationReference {
    id: string;
    name: string;
    mobile?: string | null;
}

export interface Donation {
    id: string;
    receiptNo: string;
    donorId: string;
    donor?: Donor;
    date: string;
    amount: number;
    amountInWords?: string | null;
    paymentMode: string;
    materialDetails?: string | null;
    category?: string | null;
    purpose?: string | null;
    occasionName?: string | null;
    occasionRelation?: string | null;
    occasionDate?: string | null;
    occasionMobile?: string | null;
    recurringPlan?: string | null;
    preferredPrayerDate?: string | Date | null;
    honouredPersonImage?: string | null;
    specialPrayerMessage?: string | null;
    wishToVisitHome?: boolean;
    preferredVisitDate?: string | Date | null;
    taxDeduction: boolean;
    receivedBy?: string | null;
    verifiedBy?: string | null;
    tenantId: string;
    unitId?: string | null;
    reconciliationStatus?: 'PENDING' | 'CLEARED' | 'RECONCILED' | 'REVERSED';
    reconciledAt?: string | null;
    reconciledById?: string | null;
    allocatedAmount?: number;
    isReceiptSent?: boolean;
    receiptSentAt?: string | null;
    references?: DonationReference[];
    createdAt: string;
    updatedAt: string;
}

export interface FundingSource {
    id: string;
    sourceType: 'DONATION' | 'GENERAL_FUND' | 'GRANT' | 'CSR_GRANT';
    sourceReference: string;
    donorName?: string;
    paymentMode?: string;
    reconciliationStatus: 'PENDING' | 'CLEARED' | 'RECONCILED' | 'REVERSED' | 'UNAVAILABLE';
    totalAmount: number;
    allocatedAmount: number;
    availableBalance: number;
    isEligible: boolean;
    unitId?: string | null;
    restrictions?: {
        category?: string | null;
        purpose?: string | null;
    } | null;
    ineligibilityReason?: string | null;
}

export interface CreateDonationPayload {
    donorId?: string;
    name: string;
    fatherOrHusbandName?: string;
    mobile?: string;
    whatsappNumber?: string;
    email?: string;
    panNumber?: string;
    dob?: string;
    residentialAddress?: string;
    permanentAddress?: string;
    isCorporate?: boolean;

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

    preferredPrayerDate?: string;
    specialPrayerMessage?: string;
    wishToVisitHome?: boolean;
    preferredVisitDate?: string;
    taxDeduction?: boolean;
    receivedBy?: string;
    verifiedBy?: string;

    references?: { name: string; mobile?: string }[];
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    categoryId?: string;
    classificationId?: string;
    totalBudget: number;
    startDate?: string;
    endDate?: string;
    status: string;
    approvalStatus: string;
    createdAt: string;
    category?: { id: string; name: string };
    classification?: { id: string; name: string };
}

export interface FundingAllocation {
    id: string;
    projectId: string;
    unitId?: string | null;
    amount: number;
    sourceType?: 'DONATION' | 'GENERAL_FUND' | 'GRANT' | 'CSR_GRANT';
    sourceDonationId?: string | null;
    sourceAccountId?: string | null;
    sourceReference?: string | null;
    source?: string;
    notes?: string;
    idempotencyKey?: string | null;
    allocatedById?: string | null;
    date: string;
    project?: { id: string; name: string; totalBudget?: number };
    sourceDonation?: { id: string; receiptNo: string; amount: number; paymentMode: string };
    createdAt: string;
}

export interface ProjectExpenditure {
    id: string;
    projectId: string;
    unitId?: string | null;
    amount: number;
    description?: string;
    category?: string;
    date: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedById?: string;
    rejectionReason?: string | null;
    decidedAt?: string | null;
    paymentStatus?: 'UNPAID' | 'PAYMENT_PENDING' | 'VOUCHER_ISSUED' | 'PAID' | 'CANCELLED';
    paymentVoucherRef?: string | null;
    paymentMode?: string | null;
    paidAt?: string | null;
    paidById?: string | null;
    justification?: string | null;
    receiptRef?: string | null;
    project?: { id: string; name: string; totalBudget?: number };
    createdAt: string;
}

export interface CreateExpenditurePayload {
    projectId: string;
    amount: number;
    category: string;
    description: string;
    justification?: string;
    receiptRef?: string;
    idempotencyKey?: string;
}

export interface ApproveExpenditurePayload {
    status: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
}

export interface RecordPaymentPayload {
    paymentMode: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'UPI' | 'ONLINE';
    paymentReference?: string;
    notes?: string;
    idempotencyKey?: string;
}

export interface ConfirmPaymentPayload {
    paymentReference: string;
    disbursementDate?: string;
    notes?: string;
    idempotencyKey?: string;
}

export interface ProjectCapacity {
    projectId: string;
    projectName: string;
    totalBudget: number;
    totalAllocated: number;
    committedAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    paidAmount: number;
    remainingCapacity: number;
    remainingBudget: number;
}

export interface VolunteerMember {
    id: string;
    name: string;
    mobile: string;
    email?: string;
    role: string;
    initiative?: string;
    availability: string;
    status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
    joinedDate: string;
}
