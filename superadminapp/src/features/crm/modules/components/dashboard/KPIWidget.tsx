import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPIWidgetProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export function KPIWidget({ label, value, change, isPositive }: KPIWidgetProps) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E1E6E1] rounded-2xl p-5 flex flex-col justify-between h-[140px] hover:border-[#C8E6CA] shadow-xs transition-all">
      <span className="text-xs font-bold text-[#5F6962] uppercase tracking-wider">{label}</span>
      <div className="flex items-end justify-between mt-2">
        <h3 className="text-2xl font-extrabold text-[#202020] tracking-tight">{value}</h3>
        <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full border ${
          isPositive 
            ? 'bg-[#E7F4E8] text-[#026601] border-[#C8E6CA]' 
            : 'bg-[#FDF2F2] text-[#B91C1C] border-[#F8C8C8]'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          <span>{change}</span>
        </div>
      </div>
      {/* Decorative Accent Sparkline Bar */}
      <div className="w-full bg-[#EFF3EF] h-1.5 rounded-full overflow-hidden mt-4">
        <div 
          className={`h-full rounded-full ${isPositive ? 'bg-[#039A01]' : 'bg-[#B91C1C]'}`} 
          style={{ width: `${isPositive ? 75 : 45}%` }}
        ></div>
      </div>
    </div>
  );
}
