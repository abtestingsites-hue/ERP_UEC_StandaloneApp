/**
 * Standard Series ID Formatters & Generators for UNCF ERP Command Center
 * 
 * Standard Format: [PREFIX]-[YEAR]-[4-DIGIT SEQUENCE]
 * 
 * 1. Elder Resident:      ELD-YYYY-XXXX  (e.g. ELD-2026-0001)
 * 2. Admission Record:    ADM-YYYY-XXXX  (e.g. ADM-2026-0001)
 * 3. Visitor Pass:        VIS-YYYY-XXXX  (e.g. VIS-2026-0001)
 * 4. Stock Requisition:   REQ-YYYY-XXXX  (e.g. REQ-2026-0001)
 * 5. Maintenance Ticket:  MNT-YYYY-XXXX  (e.g. MNT-2026-0001)
 */

const DEFAULT_YEAR = new Date().getFullYear();

/**
 * Pads a number or numerical string to 4 digits (e.g. 1 -> "0001")
 */
export function padSequence(num: number | string, length = 4): string {
    const parsed = parseInt(String(num), 10);
    if (!isNaN(parsed) && parsed > 0) {
        return String(parsed).padStart(length, '0');
    }
    return String(num).padStart(length, '0');
}

/**
 * Builds a standardized series ID: [PREFIX]-[YEAR]-[XXXX]
 */
export function buildSeriesId(prefix: string, sequence: number | string, year: number = DEFAULT_YEAR): string {
    return `${prefix.toUpperCase()}-${year}-${padSequence(sequence)}`;
}

/**
 * Derives a clean pseudo-sequence from a UUID or string if no sequential integer is available.
 * Keeps IDs deterministic and stable across re-renders while matching the exact format.
 */
function deriveSequenceFromId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0;
    }
    const positiveInt = Math.abs(hash) % 9999 || 1;
    return padSequence(positiveInt);
}

/**
 * 1. ELDER RESIDENT ID
 * Expected: ELD-YYYY-XXXX (e.g. ELD-2026-0001)
 */
export function formatElderId(elderId?: string | null, fallbackUuid?: string | null, index?: number): string {
    if (elderId && elderId.trim() && elderId !== 'UEC-RES-GEN') {
        // If already formatted or customized, return as is
        if (/^[A-Z]{3,4}-\d{4}-\d{4,}$/i.test(elderId.trim())) {
            return elderId.trim().toUpperCase();
        }
        // If it's a number or simple prefix, format it
        const numOnly = elderId.replace(/\D/g, '');
        if (numOnly) {
            return buildSeriesId('ELD', numOnly);
        }
        return elderId.trim();
    }

    if (index !== undefined && index >= 0) {
        return buildSeriesId('ELD', index + 1);
    }

    if (fallbackUuid) {
        return buildSeriesId('ELD', deriveSequenceFromId(fallbackUuid));
    }

    return buildSeriesId('ELD', 1);
}

/**
 * 2. ADMISSION ID / NUMBER
 * Expected: ADM-YYYY-XXXX (e.g. ADM-2026-0001)
 */
export function formatAdmissionNumber(
    admissionNoOrRef?: string | null,
    fallbackUuid?: string | null,
    index?: number
): string {
    if (admissionNoOrRef && admissionNoOrRef.trim()) {
        if (/^[A-Z]{3,4}-\d{4}-\d{4,}$/i.test(admissionNoOrRef.trim())) {
            return admissionNoOrRef.trim().toUpperCase();
        }
        const numOnly = admissionNoOrRef.replace(/\D/g, '');
        if (numOnly) {
            return buildSeriesId('ADM', numOnly);
        }
        return admissionNoOrRef.trim();
    }

    if (index !== undefined && index >= 0) {
        return buildSeriesId('ADM', index + 1);
    }

    if (fallbackUuid) {
        return buildSeriesId('ADM', deriveSequenceFromId(fallbackUuid));
    }

    return buildSeriesId('ADM', 1);
}

/**
 * 3. VISITOR PASS NUMBER
 * Expected: VIS-YYYY-XXXX (e.g. VIS-2026-0001)
 */
export function formatVisitorPassNumber(
    passNumber?: string | null,
    fallbackUuid?: string | null,
    index?: number
): string {
    if (passNumber && passNumber.trim()) {
        if (/^[A-Z]{3,4}-\d{4}-\d{4,}$/i.test(passNumber.trim()) || /^VIS-/i.test(passNumber.trim())) {
            return passNumber.trim().toUpperCase();
        }
        const numOnly = passNumber.replace(/\D/g, '');
        if (numOnly) {
            return buildSeriesId('VIS', numOnly);
        }
        return passNumber.trim();
    }

    if (index !== undefined && index >= 0) {
        return buildSeriesId('VIS', index + 1);
    }

    if (fallbackUuid) {
        return buildSeriesId('VIS', deriveSequenceFromId(fallbackUuid));
    }

    return buildSeriesId('VIS', 1);
}

/**
 * 4. STOCK REQUISITION NUMBER
 * Expected: REQ-YYYY-XXXX (e.g. REQ-2026-0001)
 */
export function formatStockRequisitionNumber(
    requestNumber?: string | null,
    fallbackUuid?: string | null,
    index?: number
): string {
    if (requestNumber && requestNumber.trim()) {
        if (/^[A-Z]{3,4}-\d{4}-\d{4,}$/i.test(requestNumber.trim()) || /^REQ-/i.test(requestNumber.trim())) {
            return requestNumber.trim().toUpperCase();
        }
        const numOnly = requestNumber.replace(/\D/g, '');
        if (numOnly) {
            return buildSeriesId('REQ', numOnly);
        }
        return requestNumber.trim();
    }

    if (index !== undefined && index >= 0) {
        return buildSeriesId('REQ', index + 1);
    }

    if (fallbackUuid) {
        return buildSeriesId('REQ', deriveSequenceFromId(fallbackUuid));
    }

    return buildSeriesId('REQ', 1);
}

/**
 * 5. MAINTENANCE TICKET NUMBER
 * Expected: MNT-YYYY-XXXX (e.g. MNT-2026-0001)
 */
export function formatMaintenanceTicketNumber(
    ticketNumber?: string | null,
    fallbackUuid?: string | null,
    index?: number
): string {
    if (ticketNumber && ticketNumber.trim()) {
        if (/^[A-Z]{3,4}-\d{4}-\d{4,}$/i.test(ticketNumber.trim()) || /^MNT-/i.test(ticketNumber.trim())) {
            return ticketNumber.trim().toUpperCase();
        }
        const numOnly = ticketNumber.replace(/\D/g, '');
        if (numOnly) {
            return buildSeriesId('MNT', numOnly);
        }
        return ticketNumber.trim();
    }

    if (index !== undefined && index >= 0) {
        return buildSeriesId('MNT', index + 1);
    }

    if (fallbackUuid) {
        return buildSeriesId('MNT', deriveSequenceFromId(fallbackUuid));
    }

    return buildSeriesId('MNT', 1);
}
