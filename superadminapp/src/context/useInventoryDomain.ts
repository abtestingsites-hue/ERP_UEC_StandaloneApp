import { useContext } from 'react';
import { InventoryDomainContext } from './inventoryDomain.context';

export function useInventoryDomain() {
    const context = useContext(InventoryDomainContext);
    if (!context) {
        throw new Error('useInventoryDomain must be used within an InventoryDomainProvider');
    }
    return context;
}
