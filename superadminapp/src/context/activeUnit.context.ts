import { createContext } from 'react';
import type { UnitInfo } from '../features/inventory/inventory.types';

export interface ActiveUnitContextType {
    activeUnitId: string | null;
    setActiveUnitId: (unitId: string | null) => void;
    units: UnitInfo[];
    hasExplicitAllUnits: boolean;
    isLoadingUnits: boolean;
    activeUnitName: string;
}

export const ActiveUnitContext = createContext<ActiveUnitContextType | undefined>(undefined);
