"use client";

import React from 'react';
import { DashboardSwitcher } from './dashboard/DashboardSwitcher';

export function Dashboard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7F5] text-[#202020] h-full">
      <DashboardSwitcher />
    </div>
  );
}
