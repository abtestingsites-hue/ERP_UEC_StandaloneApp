import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Building2, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface UnitSwitcherProps {
  className?: string;
}

export const UnitSwitcher: React.FC<UnitSwitcherProps> = ({ className }) => {
  const { user, activeUnitId, setActiveUnitId, units } = useAuthStore();

  const userAccess = user?.unitAccess || [];
  const hasUnrestrictedAccess =
    userAccess.includes('*') ||
    user?.role === 'Admin' ||
    (typeof user?.role === 'object' && user?.role?.name === 'Admin');

  // Filter accessible units
  const accessibleUnits = hasUnrestrictedAccess
    ? units
    : units.filter((u) => userAccess.includes(u.id) || u.id === user?.unitId);

  // If user has no units loaded yet but has a unit object on their user record, use that as a fallback
  const displayUnits =
    accessibleUnits.length > 0
      ? accessibleUnits
      : user?.unit
      ? [user.unit]
      : [];

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setActiveUnitId(val === '' ? null : val);
  };

  const activeUnit = displayUnits.find((u) => u.id === activeUnitId);

  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 transition-colors shadow-inner',
        className
      )}
    >
      <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <div className="relative flex items-center">
        <select
          value={activeUnitId || ''}
          onChange={handleUnitChange}
          aria-label="Select Operating Unit"
          className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer pr-6 appearance-none max-w-[150px] sm:max-w-[200px] truncate"
        >
          {hasUnrestrictedAccess && (
            <option value="" className="bg-slate-900 text-slate-200">
              All Units (Facility-wide)
            </option>
          )}

          {displayUnits.map((u) => (
            <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
              {u.name} {u.code ? `(${u.code})` : ''}
            </option>
          ))}

          {!hasUnrestrictedAccess && displayUnits.length === 0 && (
            <option value="" className="bg-slate-900 text-slate-400">
              {user?.unitId ? `Unit: ${user.unitId.slice(0, 8)}...` : 'Default Unit'}
            </option>
          )}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-0 pointer-events-none" />
      </div>
    </div>
  );
};
