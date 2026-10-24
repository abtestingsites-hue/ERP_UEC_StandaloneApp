import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InventoryDomain = 'medical' | 'food';

export interface DomainCategoryConfig {
  domain: InventoryDomain;
  label: string;
  shortLabel: string;
  color: string;
  verifiedCategories: string[];
}

export const DOMAIN_CONFIG: Record<InventoryDomain, DomainCategoryConfig> = {
  medical: {
    domain: 'medical',
    label: 'Medical Inventory',
    shortLabel: 'Medical',
    color: 'rose',
    verifiedCategories: ['medical', 'medicine', 'medicines', 'clinical', 'clinical-consumables']
  },
  food: {
    domain: 'food',
    label: 'Food & Ration Inventory',
    shortLabel: 'Food & Ration',
    color: 'amber',
    verifiedCategories: ['ration', 'fresh food', 'food', 'food & ration', 'ration & kitchen']
  }
};

interface InventoryDomainState {
  activeDomain: InventoryDomain;
  setActiveDomain: (domain: InventoryDomain) => void;
  toggleDomain: () => void;
}

export const useInventoryDomainStore = create<InventoryDomainState>()(
  persist(
    (set) => ({
      activeDomain: 'medical',
      setActiveDomain: (domain) => set({ activeDomain: domain }),
      toggleDomain: () =>
        set((state) => ({
          activeDomain: state.activeDomain === 'medical' ? 'food' : 'medical'
        }))
    }),
    {
      name: 'inventory-app-domain'
    }
  )
);
