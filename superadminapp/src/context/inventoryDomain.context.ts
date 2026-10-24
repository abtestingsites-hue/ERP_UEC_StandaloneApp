import { createContext } from 'react';

export type InventoryDomain = 'medical' | 'food';

export interface DomainCategoryConfig {
    domain: InventoryDomain;
    label: string;
    shortLabel: string;
    description: string;
    color: 'rose' | 'amber';
    verifiedCategories: string[];
}

export const DOMAIN_CONFIG: Record<InventoryDomain, DomainCategoryConfig> = {
    medical: {
        domain: 'medical',
        label: 'Medical Inventory',
        shortLabel: 'Medical',
        description: 'Medicines & clinical consumables',
        color: 'rose',
        verifiedCategories: ['medical', 'medicine', 'medicines', 'clinical', 'clinical-consumables', 'medical supplies']
    },
    food: {
        domain: 'food',
        label: 'Food & Ration Inventory',
        shortLabel: 'Food & Ration',
        description: 'Food, rations & kitchen supplies',
        color: 'amber',
        verifiedCategories: ['ration', 'fresh food', 'food', 'food & ration', 'ration & kitchen', 'kitchen supplies']
    }
};

export const MEDICAL_CATEGORIES = new Set([
    'medical',
    'medicine',
    'medicines',
    'clinical',
    'clinical-consumables',
    'medical supplies'
]);

export const FOOD_RATION_CATEGORIES = new Set([
    'ration',
    'fresh food',
    'food',
    'food & ration',
    'ration & kitchen',
    'kitchen supplies'
]);

export const GENERAL_FACILITY_CATEGORIES = new Set([
    'stationary',
    'electrical',
    'plumbing',
    'electrical-plumbing',
    'assets',
    'asset',
    'kitchen',
    'general'
]);

export const normalizeCategory = (cat?: string | null): string =>
    String(cat || '').trim().toLowerCase();

export const isCategoryInDomain = (category: string | null | undefined, domain: InventoryDomain): boolean => {
    const norm = normalizeCategory(category);
    if (domain === 'medical') {
        return MEDICAL_CATEGORIES.has(norm);
    }
    if (domain === 'food') {
        return FOOD_RATION_CATEGORIES.has(norm);
    }
    return false;
};

export const isAmbiguousCategory = (category: string | null | undefined): boolean => {
    const norm = normalizeCategory(category);
    return !MEDICAL_CATEGORIES.has(norm) && !FOOD_RATION_CATEGORIES.has(norm);
};

export interface InventoryDomainContextType {
    activeDomain: InventoryDomain;
    setActiveDomain: (domain: InventoryDomain) => void;
    toggleDomain: () => void;
    domainConfig: DomainCategoryConfig;
}

export const InventoryDomainContext = createContext<InventoryDomainContextType | undefined>(undefined);
