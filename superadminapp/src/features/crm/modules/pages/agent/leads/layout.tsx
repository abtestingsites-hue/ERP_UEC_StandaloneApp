"use client";

import React from 'react';
import Link from '../../../nextShim';
import { usePathname } from '../../../nextShim';
import { Users, KanbanSquare, CalendarClock, Globe } from 'lucide-react';

export default function AgentLeadsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Lead Pool', href: '/agent/leads/pool', icon: Users },
    { name: 'Conversion Board', href: '/agent/leads/conversion', icon: KanbanSquare },
    { name: 'Follow-ups', href: '/agent/leads/follow-ups', icon: CalendarClock },
    { name: 'Website Integrations', href: '/agent/leads/website-sync', icon: Globe },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F7F5] text-[#202020]">
      <div className="border-b border-[#E1E6E1] bg-white px-6 py-4 pt-6">
        <div className="flex gap-6">
          {tabs.map(tab => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link 
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 pb-4 -mb-4 px-2 border-b-2 transition-colors ${
                  isActive ? 'border-[#039A01] text-[#039A01] font-semibold' : 'border-transparent text-[#5F6962] hover:text-[#202020]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
