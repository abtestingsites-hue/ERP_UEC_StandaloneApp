"use client";

import React from 'react';
import Link from '../../nextShim';
import { usePathname } from '../../nextShim';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Headphones,
  TrendingUp,
  Database,
  Sliders,
  FileText,
  BarChart3,
} from 'lucide-react';

interface SopNavProps {
  badgeCounts?: {
    daily?: number;
    hr?: number;
    ccr?: number;
    sales?: number;
    dataEntry?: number;
    pendingApprovals?: number;
  };
}

export function SopNav({ badgeCounts }: SopNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/sop',
      label: 'Overview',
      icon: LayoutDashboard,
      isActive: pathname === '/sop',
    },
    {
      href: '/sop/daily-operations',
      label: 'Daily Operations',
      icon: CalendarCheck,
      badge: badgeCounts?.daily,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      isActive: pathname === '/sop/daily-operations',
    },
    {
      href: '/sop/hr',
      label: 'HR SOP',
      icon: Users,
      badge: badgeCounts?.hr,
      isActive: pathname === '/sop/hr',
    },
    {
      href: '/sop/ccr',
      label: 'CCR SOP',
      icon: Headphones,
      badge: badgeCounts?.ccr,
      isActive: pathname === '/sop/ccr',
    },
    {
      href: '/sop/sales',
      label: 'Sales SOP',
      icon: TrendingUp,
      badge: badgeCounts?.sales,
      isActive: pathname === '/sop/sales',
    },
    {
      href: '/sop/data-entry',
      label: 'Data Entry SOP',
      icon: Database,
      badge: badgeCounts?.dataEntry,
      isActive: pathname === '/sop/data-entry',
    },
    {
      href: '/sop/builder',
      label: 'SOP Builder',
      icon: Sliders,
      isActive: pathname === '/sop/builder',
    },
    {
      href: '/sop/documents',
      label: 'SOP Documents',
      icon: FileText,
      isActive: pathname === '/sop/documents',
    },
    {
      href: '/sop/reports',
      label: 'Reports & Audit',
      icon: BarChart3,
      badge: badgeCounts?.pendingApprovals,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      isActive: pathname === '/sop/reports',
    },
  ];

  return (
    <div className="w-full bg-white border-b border-[#E1E6E1] px-4 py-2 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-1.5 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  item.isActive
                    ? 'bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA] shadow-xs font-semibold'
                    : 'text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.isActive ? 'text-[#039A01]' : 'text-[#849389]'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      item.badgeColor || 'bg-[#EFF3EF] text-[#202020]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
