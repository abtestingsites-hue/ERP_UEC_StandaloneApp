import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatVisitorCategory(category?: string): string {
    if (!category) return 'Visitor';
    const mapping: Record<string, string> = {
        'HEALTHCARE_PROFESSIONAL': 'Healthcare Professional',
        'STUDENT_INTERN_TRAINEE': 'Student / Intern / Trainee',
        'OUTSOURCED_AGENCY_WORKER': 'Outsourced Agency Worker',
        'RESIDENT_FAMILY_RELATIVE': 'Resident Family Relative',
        'VOLUNTEER_NGO_COMMUNITY': 'Volunteer / NGO / Community',
        'VENDOR_SUPPLIER': 'Vendor / Supplier',
        'RESIDENT_CAREGIVER_ATTENDANT': 'Resident Caregiver / Attendant',
        'OLD_AGE_CARE_ADMISSION_ENQUIRY': 'Admission Enquiry',
        'MEDICAL_PHARMA_REPRESENTATIVE': 'Medical / Pharma Rep',
        'CONTRACTOR_TEMPORARY_WORKER': 'Contractor / Temp Worker',
        'DAILY_REGULAR_WORKER': 'Daily / Regular Worker',
        'DELIVERY_COURIER': 'Delivery / Courier',
        'TRANSPORT_DRIVER': 'Transport / Driver',
        'GOVERNMENT_OFFICIAL_INSPECTOR': 'Govt Official / Inspector',
        'AUDITOR_CONSULTANT': 'Auditor / Consultant',
        'EVENT_INSTITUTIONAL_GUEST': 'Event / Guest',
        'OTHER': 'Other'
    };
    
    return mapping[category] || category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

