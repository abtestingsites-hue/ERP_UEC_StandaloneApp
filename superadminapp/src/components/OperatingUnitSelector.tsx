import { Building2, ChevronDown, Lock } from 'lucide-react';
import { useActiveUnit } from '../context/useActiveUnit';

interface OperatingUnitSelectorProps {
    className?: string;
}

export function OperatingUnitSelector({ className = '' }: OperatingUnitSelectorProps) {
    const {
        activeUnitId,
        setActiveUnitId,
        units,
        hasExplicitAllUnits,
        isLoadingUnits,
        activeUnitName
    } = useActiveUnit();

    // Mode A: User assigned to only one operating unit (read-only context label)
    if (!hasExplicitAllUnits && units.length <= 1) {
        return (
            <div
                className={`unit-selector-pill unit-selector-pill--readonly ${className}`}
                title={`Operating Scope: ${activeUnitName} (Assigned unit)`}
                aria-label={`Operating Scope: ${activeUnitName}`}
            >
                <span className="unit-selector-pill__icon" aria-hidden="true">
                    <Building2 size={14} />
                </span>
                <span className="unit-selector-pill__readonly-text">
                    {activeUnitName}
                </span>
                <span className="unit-selector-pill__lock" title="Fixed operating unit" aria-hidden="true">
                    <Lock size={11} />
                </span>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setActiveUnitId(val === 'ALL' ? null : val);
    };

    // Mode B: User authorized for multiple specific units (strictly authorized units, no All Units)
    // Mode C: Explicitly authorized All-Units user (Super Admin / unitAccess: ["*"])
    return (
        <div className={`unit-selector-pill ${className}`}>
            <span className="unit-selector-pill__icon" aria-hidden="true">
                <Building2 size={14} />
            </span>
            <div className="unit-selector-pill__select-wrapper">
                <select
                    className="unit-selector-pill__select"
                    value={activeUnitId === null ? 'ALL' : activeUnitId}
                    onChange={handleChange}
                    disabled={isLoadingUnits}
                    aria-label="Select Operating Unit Scope"
                >
                    {hasExplicitAllUnits && (
                        <option value="ALL">All Units (Facility-wide)</option>
                    )}
                    {units.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name} {u.code ? `(${u.code})` : ''}
                        </option>
                    ))}
                </select>
                <ChevronDown size={13} className="unit-selector-pill__chevron" aria-hidden="true" />
            </div>
        </div>
    );
}

export default OperatingUnitSelector;
