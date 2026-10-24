import { useState, type ReactNode } from 'react';
import {
    InventoryDomainContext,
    DOMAIN_CONFIG,
    type InventoryDomain
} from './inventoryDomain.context';

const INVENTORY_DOMAIN_STORAGE_KEY = 'superadmin-inventory-domain';

export function InventoryDomainProvider({ children }: { children: ReactNode }) {
    const [activeDomain, setActiveDomainState] = useState<InventoryDomain>(() => {
        if (typeof window !== 'undefined') {
            const stored = window.sessionStorage.getItem(INVENTORY_DOMAIN_STORAGE_KEY);
            if (stored === 'food' || stored === 'medical') {
                return stored;
            }
        }
        return 'medical';
    });

    const setActiveDomain = (domain: InventoryDomain) => {
        setActiveDomainState(domain);
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(INVENTORY_DOMAIN_STORAGE_KEY, domain);
            // Dispatch custom event to notify listeners if needed
            window.dispatchEvent(new CustomEvent('inventory-domain-changed', { detail: domain }));
        }
    };

    const toggleDomain = () => {
        setActiveDomain(activeDomain === 'medical' ? 'food' : 'medical');
    };

    const domainConfig = DOMAIN_CONFIG[activeDomain];

    return (
        <InventoryDomainContext.Provider
            value={{
                activeDomain,
                setActiveDomain,
                toggleDomain,
                domainConfig
            }}
        >
            {children}
        </InventoryDomainContext.Provider>
    );
}

export default InventoryDomainProvider;
