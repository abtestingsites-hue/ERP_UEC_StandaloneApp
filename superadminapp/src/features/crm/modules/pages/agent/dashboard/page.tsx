"use client";

import React from 'react';
import { DashboardSwitcher } from '../../../components/dashboard/DashboardSwitcher';

const AGENT_ALLOWED_TYPES = ['agent_performance'];

export default function AgentDashboardPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7F5] text-[#202020] h-full">
      <DashboardSwitcher 
        allowedTypes={AGENT_ALLOWED_TYPES} 
        defaultType="agent_performance" 
      />
    </div>
  );
}
