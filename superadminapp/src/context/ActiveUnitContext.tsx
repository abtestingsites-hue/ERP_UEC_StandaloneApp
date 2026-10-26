import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../features/auth/useAuth';
import { inventoryService } from '../features/inventory/inventory.service';
import type { UnitInfo } from '../features/inventory/inventory.types';
import { ActiveUnitContext } from './activeUnit.context';

const ACTIVE_UNIT_STORAGE_KEY = 'superadmin-active-unit';

export function ActiveUnitProvider({ children }: { children: ReactNode }) {
    const { session } = useAuth();
    const user = session?.user;

    const hasExplicitAllUnits = Boolean(
        user?.unitAccess?.includes('*') ||
        user?.role === 'Admin' ||
        (typeof user?.role === 'object' && user?.role !== null && 'name' in user.role && (user.role as { name?: string }).name === 'Admin')
    );

    const [units, setUnits] = useState<UnitInfo[]>([]);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);
    const [activeUnitId, setActiveUnitIdState] = useState<string | null>(() => {
        if (!user) return null;
        if (!hasExplicitAllUnits) {
            return user.unitId || (user.unitAccess && user.unitAccess.length > 0 ? user.unitAccess[0] : null);
        }
        const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem(ACTIVE_UNIT_STORAGE_KEY) : null;
        if (stored === 'ALL_UNITS' || stored === '' || stored === null) {
            return null; // All Units (Facility-wide)
        }
        return stored;
    });

    // Fetch authorized units whenever session changes
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!session?.accessToken) {
                if (isMounted) {
                    setUnits([]);
                    setActiveUnitIdState(null);
                }
                return;
            }

            // CRM-only sessions do not query ERP inventory unit authorized APIs
            if (user?.provider === 'crm') {
                if (isMounted) {
                    setUnits([]);
                    setActiveUnitIdState(null);
                    setIsLoadingUnits(false);
                }
                return;
            }

            setIsLoadingUnits(true);
            try {
                const loadedUnits = await inventoryService.getAuthorizedUnits();
                if (!isMounted) return;
                setUnits(loadedUnits);

                // If user is unit-bound, enforce only their authorized unit
                if (!hasExplicitAllUnits) {
                    const fallback = user?.unitId || (user?.unitAccess && user.unitAccess[0] !== '*' ? user.unitAccess[0] : null);
                    setActiveUnitIdState(fallback);
                    if (typeof window !== 'undefined' && fallback) {
                        window.sessionStorage.setItem(ACTIVE_UNIT_STORAGE_KEY, fallback);
                    }
                } else {
                    // For all-unit accounts, validate stored unit or keep null
                    const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem(ACTIVE_UNIT_STORAGE_KEY) : null;
                    if (stored && stored !== 'ALL_UNITS' && loadedUnits.some(u => u.id === stored)) {
                        setActiveUnitIdState(stored);
                    } else {
                        setActiveUnitIdState(null);
                    }
                }
            } catch (err: unknown) {
                if (!isMounted) return;
                console.warn('Failed to load authorized units in SuperAdminApp:', err);
                if (user?.unit) {
                    setUnits([user.unit]);
                } else if (hasExplicitAllUnits) {
                    // Provide standard fallback units for SuperAdmin so UI is never blocked
                    setUnits([
                        { id: 'all-units-fallback', name: 'Universal Nature Care & Cure Foundation', code: 'UNCF' }
                    ]);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingUnits(false);
                }
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [session?.accessToken, hasExplicitAllUnits, user?.unitId, user?.unitAccess, user?.unit]);

    const setActiveUnitId = (unitId: string | null) => {
        if (!hasExplicitAllUnits && unitId === null) {
            // Unit-bound user cannot select All Units
            return;
        }
        setActiveUnitIdState(unitId);
        if (typeof window !== 'undefined') {
            if (unitId === null) {
                window.sessionStorage.setItem(ACTIVE_UNIT_STORAGE_KEY, 'ALL_UNITS');
            } else {
                window.sessionStorage.setItem(ACTIVE_UNIT_STORAGE_KEY, unitId);
            }
        }
    };

    const currentUnit = units.find(u => u.id === activeUnitId);
    const activeUnitName = activeUnitId === null
        ? 'All Units (Facility-wide)'
        : currentUnit
        ? `${currentUnit.name}${currentUnit.code ? ` (${currentUnit.code})` : ''}`
        : user?.unit?.name || 'Assigned Unit';

    return (
        <ActiveUnitContext.Provider
            value={{
                activeUnitId,
                setActiveUnitId,
                units,
                hasExplicitAllUnits,
                isLoadingUnits,
                activeUnitName
            }}
        >
            {children}
        </ActiveUnitContext.Provider>
    );
}

export default ActiveUnitProvider;
