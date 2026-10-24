import React from 'react';
import { Check, Clock, PlayCircle, XCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface VisitStatusTimelineProps {
    status: string;
}

export const VisitStatusTimeline: React.FC<VisitStatusTimelineProps> = ({ status }) => {
    const norm = String(status || '').toUpperCase();

    const isAssigned = ['ASSIGNED', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(norm);
    const isInProgress = ['IN_PROGRESS', 'COMPLETED'].includes(norm);
    const isCompleted = norm === 'COMPLETED';
    const isCancelled = norm === 'CANCELLED';

    if (isCancelled) {
        return (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-4 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-400">
                <XCircle className="w-5 h-5 shrink-0" />
                <div>
                    <span className="font-bold text-xs block">Visit Cancelled</span>
                    <span className="text-[11px] opacity-90">This scheduled operational visit was cancelled and requires no further action.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800/60 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Visit Workflow Status</span>
            
            <div className="flex items-center justify-between relative">
                {/* Line background */}
                <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-gray-200 dark:bg-gray-800 z-0"></div>
                <div 
                    className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-[#0F969C] transition-all duration-500 z-0"
                    style={{
                        width: isCompleted ? 'calc(100% - 2rem)' : isInProgress ? '50%' : '0%'
                    }}
                ></div>

                {/* Step 1: Assigned */}
                <div className="relative z-10 flex flex-col items-center gap-1.5 bg-gray-50 dark:bg-[#072E33] px-2">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                        isAssigned 
                            ? "bg-[#0F969C] text-white shadow-sm" 
                            : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                    )}>
                        <Clock className="w-4 h-4" />
                    </div>
                    <span className={cn("text-[11px] font-semibold", isAssigned ? "text-[#0F969C]" : "text-gray-400")}>
                        Scheduled
                    </span>
                </div>

                {/* Step 2: In Progress */}
                <div className="relative z-10 flex flex-col items-center gap-1.5 bg-gray-50 dark:bg-[#072E33] px-2">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                        isInProgress 
                            ? "bg-[#0F969C] text-white shadow-sm" 
                            : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                    )}>
                        <PlayCircle className="w-4 h-4" />
                    </div>
                    <span className={cn("text-[11px] font-semibold", isInProgress ? "text-[#0F969C]" : "text-gray-400")}>
                        In Progress
                    </span>
                </div>

                {/* Step 3: Completed */}
                <div className="relative z-10 flex flex-col items-center gap-1.5 bg-gray-50 dark:bg-[#072E33] px-2">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                        isCompleted 
                            ? "bg-emerald-600 text-white shadow-sm" 
                            : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                    )}>
                        <Check className="w-4 h-4" />
                    </div>
                    <span className={cn("text-[11px] font-semibold", isCompleted ? "text-emerald-600" : "text-gray-400")}>
                        Completed
                    </span>
                </div>
            </div>
        </div>
    );
};
