import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatVisitorCategory(cat?: string | null): string {
    if (!cat) return 'Guest';
    switch (cat.toUpperCase()) {
        case 'RESIDENT_FAMILY_RELATIVE': return 'Family / Relative';
        case 'RESIDENT_CAREGIVER_ATTENDANT': return 'Caregiver / Attendant';
        case 'OLD_AGE_CARE_ADMISSION_ENQUIRY': return 'Admission Enquiry';
        case 'HEALTHCARE_PROFESSIONAL': return 'Healthcare Professional';
        case 'MEDICAL_PHARMA_REPRESENTATIVE': return 'Pharma Representative';
        case 'VENDOR_SUPPLIER': return 'Vendor / Supplier';
        case 'CONTRACTOR_TEMPORARY_WORKER': return 'Contractor / Worker';
        case 'OUTSOURCED_AGENCY_WORKER': return 'Agency Worker';
        case 'DAILY_REGULAR_WORKER': return 'Daily Worker';
        case 'STUDENT_INTERN_TRAINEE': return 'Student / Intern';
        case 'VOLUNTEER_NGO_COMMUNITY': return 'Volunteer / NGO';
        case 'DELIVERY_COURIER': return 'Delivery / Courier';
        case 'TRANSPORT_DRIVER': return 'Driver / Transport';
        case 'GOVERNMENT_OFFICIAL_INSPECTOR': return 'Govt Official';
        case 'AUDITOR_CONSULTANT': return 'Auditor / Consultant';
        case 'EVENT_INSTITUTIONAL_GUEST': return 'Event Guest';
        case 'GUEST': return 'Guest';
        case 'VENDOR': return 'Vendor';
        case 'OTHER': return 'Other';
        default: return cat.replace(/_/g, ' ');
    }
}
