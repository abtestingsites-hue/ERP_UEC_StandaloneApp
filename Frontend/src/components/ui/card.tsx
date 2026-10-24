import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, className }: CardProps) => {
    return (
        <div className={cn(
            "bg-white dark:bg-[#1E1E1E] border border-gray-100 dark:border-white/10 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)]",
            className
        )}>
            {children}
        </div>
    );
};
