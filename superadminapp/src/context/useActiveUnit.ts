import { useContext } from 'react';
import { ActiveUnitContext } from './activeUnit.context';

export function useActiveUnit() {
    const context = useContext(ActiveUnitContext);
    if (!context) {
        throw new Error('useActiveUnit must be used within an ActiveUnitProvider');
    }
    return context;
}
