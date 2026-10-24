import React from 'react';
import { cn } from '../../lib/utils';
import { useInventoryDomainStore, DOMAIN_CONFIG } from '../../store/useInventoryDomainStore';
import { Pill, Utensils } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  hideDomainBadge?: boolean;
}

export function PageHeader({ title, description, badge, actions, className, hideDomainBadge = false }: PageHeaderProps) {
  const { activeDomain } = useInventoryDomainStore();
  const config = DOMAIN_CONFIG[activeDomain];
  const isMedical = activeDomain === 'medical';

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6',
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
          {!hideDomainBadge && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-sm',
                isMedical
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                  : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
              )}
            >
              {isMedical ? <Pill className="w-3 h-3 text-rose-400" /> : <Utensils className="w-3 h-3 text-amber-400" />}
              {config.label}
            </span>
          )}
          {badge}
        </div>
        {description && <p className="text-xs sm:text-sm text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
