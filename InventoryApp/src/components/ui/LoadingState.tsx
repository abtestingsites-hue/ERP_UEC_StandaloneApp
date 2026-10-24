import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center space-y-3', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      <p className="text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
}
