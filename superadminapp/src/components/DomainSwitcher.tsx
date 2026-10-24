import { useState, useRef, useEffect } from 'react';
import { Pill, Utensils, ChevronDown, Check } from 'lucide-react';
import { useInventoryDomain } from '../context/useInventoryDomain';
import type { InventoryDomain } from '../context/inventoryDomain.context';

interface DomainSwitcherProps {
    className?: string;
    variant?: 'compact' | 'full';
}

export function DomainSwitcher({ className = '', variant = 'full' }: DomainSwitcherProps) {
    const { activeDomain, setActiveDomain, domainConfig } = useInventoryDomain();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleSelect = (domain: InventoryDomain) => {
        if (domain !== activeDomain) {
            setActiveDomain(domain);
        }
        setIsOpen(false);
    };

    const isMedical = activeDomain === 'medical';

    return (
        <div ref={containerRef} className={`domain-switcher-container ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Switch Inventory Domain"
                aria-expanded={isOpen}
                className={`domain-switcher-trigger domain-switcher-trigger--${isMedical ? 'medical' : 'food'}`}
            >
                <span className="domain-switcher-trigger__icon" aria-hidden="true">
                    {isMedical ? <Pill size={14} /> : <Utensils size={14} />}
                </span>

                <span className="domain-switcher-trigger__label">
                    {variant === 'compact' ? domainConfig.shortLabel : domainConfig.label}
                </span>

                <ChevronDown
                    size={12}
                    className={`domain-switcher-trigger__chevron ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="domain-switcher-menu" role="menu">
                    <div className="domain-switcher-menu__header">
                        Switch Inventory Domain
                    </div>

                    {/* Medical Option */}
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleSelect('medical')}
                        className={`domain-switcher-option ${isMedical ? 'domain-switcher-option--selected-medical' : ''}`}
                    >
                        <div className="domain-switcher-option__content">
                            <div className="domain-switcher-option__icon domain-switcher-option__icon--medical">
                                <Pill size={15} />
                            </div>
                            <div className="domain-switcher-option__text">
                                <div className="domain-switcher-option__title">Medical Inventory</div>
                                <div className="domain-switcher-option__desc">Medicines, clinical consumables</div>
                            </div>
                        </div>
                        {isMedical && (
                            <Check size={14} className="domain-switcher-option__check domain-switcher-option__check--medical" />
                        )}
                    </button>

                    {/* Food & Ration Option */}
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleSelect('food')}
                        className={`domain-switcher-option ${!isMedical ? 'domain-switcher-option--selected-food' : ''}`}
                    >
                        <div className="domain-switcher-option__content">
                            <div className="domain-switcher-option__icon domain-switcher-option__icon--food">
                                <Utensils size={15} />
                            </div>
                            <div className="domain-switcher-option__text">
                                <div className="domain-switcher-option__title">Food & Ration Inventory</div>
                                <div className="domain-switcher-option__desc">Food, rations, kitchen supplies</div>
                            </div>
                        </div>
                        {!isMedical && (
                            <Check size={14} className="domain-switcher-option__check domain-switcher-option__check--food" />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

export default DomainSwitcher;
