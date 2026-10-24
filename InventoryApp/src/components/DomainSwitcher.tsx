import React, { useState, useRef, useEffect } from 'react';
import { useInventoryDomainStore, DOMAIN_CONFIG, InventoryDomain } from '../store/useInventoryDomainStore';
import { Pill, Utensils, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export interface DomainSwitcherProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const DomainSwitcher: React.FC<DomainSwitcherProps> = ({ className, variant = 'full' }) => {
  const { activeDomain, setActiveDomain } = useInventoryDomainStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (domain: InventoryDomain) => {
    if (domain !== activeDomain) {
      setActiveDomain(domain);
      // Invalidate queries so all data refreshes for the selected domain
      queryClient.invalidateQueries();
    }
    setIsOpen(false);
  };

  const isMedical = activeDomain === 'medical';

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch Inventory Domain"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border shadow-sm cursor-pointer select-none',
          isMedical
            ? 'bg-rose-950/50 hover:bg-rose-950/80 border-rose-800/60 text-rose-200 hover:border-rose-700'
            : 'bg-amber-950/50 hover:bg-amber-950/80 border-amber-800/60 text-amber-200 hover:border-amber-700'
        )}
      >
        {isMedical ? (
          <Pill className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
        )}

        <span className="truncate font-semibold tracking-wide">
          {variant === 'compact' ? DOMAIN_CONFIG[activeDomain].shortLabel : DOMAIN_CONFIG[activeDomain].label}
        </span>

        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-200 shrink-0',
            isMedical ? 'text-rose-400' : 'text-amber-400',
            isOpen ? 'rotate-180' : ''
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 mb-1 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Switch Inventory Domain
          </div>

          {/* Medical Option */}
          <button
            type="button"
            onClick={() => handleSelect('medical')}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer',
              isMedical
                ? 'bg-rose-950/70 text-rose-200 border border-rose-800/50'
                : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  isMedical ? 'bg-rose-900/60 text-rose-300' : 'bg-slate-800 text-slate-400'
                )}
              >
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">Medical Inventory</p>
                <p className="text-[10px] text-slate-400">Medicines, clinical consumables</p>
              </div>
            </div>
            {isMedical && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
          </button>

          {/* Food Option */}
          <button
            type="button"
            onClick={() => handleSelect('food')}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer mt-1',
              !isMedical
                ? 'bg-amber-950/70 text-amber-200 border border-amber-800/50'
                : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  !isMedical ? 'bg-amber-900/60 text-amber-300' : 'bg-slate-800 text-slate-400'
                )}
              >
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">Food & Ration Inventory</p>
                <p className="text-[10px] text-slate-400">Rations, fresh food, kitchen stores</p>
              </div>
            </div>
            {!isMedical && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
          </button>
        </div>
      )}
    </div>
  );
};
