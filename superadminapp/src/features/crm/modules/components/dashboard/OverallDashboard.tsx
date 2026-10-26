"use client";

import React, { useState, useEffect } from 'react';
import { AdvancedKpiCards } from './AdvancedKpiCards';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { OmnichannelTrends } from './OmnichannelTrends';
import { AgentLeaderboard } from './AgentLeaderboard';
import { SlaGauge } from './SlaGauge';
import { CallVolumeHeatmap } from './CallVolumeHeatmap';
import { SentimentTrend } from './SentimentTrend';
import { OmnichannelEnquiriesChart } from './OmnichannelEnquiriesChart';
import { RightSidebarPanels } from './RightSidebarPanels';

export function OverallDashboard({ data, metrics }: { data?: any; metrics?: any }) {
  const activeData = data || metrics;
  if (!activeData || (!activeData.kpis && !activeData.metrics && !activeData.charts)) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-xs text-[#5F6962] gap-4">
        <span className="w-6 h-6 border-2 border-[#C8E6CA] border-t-[#039A01] rounded-full animate-spin"></span>
        <span>Loading Command Center Data...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F7F5] text-[#202020]">
      <div className="flex h-full">
        {/* Main Dashboard Area */}
        <div className="flex-1 p-4 border-r border-[#E1E6E1] relative">

          {/* KPI Grid (12 cards) */}
          <div className="mb-3">
            <AdvancedKpiCards data={activeData} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2 bg-white border border-[#E1E6E1] rounded-xl p-3 h-[250px] shadow-sm">
              <PerformanceHeatmap data={activeData} />
            </div>
            <div className="bg-white border border-[#E1E6E1] rounded-xl p-3 h-[250px] shadow-sm">
              <OmnichannelTrends data={activeData} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2 bg-white border border-[#E1E6E1] rounded-xl p-3 shadow-sm">
              <AgentLeaderboard data={activeData} />
            </div>
            <div className="bg-white border border-[#E1E6E1] rounded-xl p-3 flex flex-col justify-between shadow-sm">
              <SlaGauge percentage={activeData?.metrics?.slaMet ? parseInt(activeData.metrics.slaMet, 10) : 100} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2">
              <OmnichannelEnquiriesChart />
            </div>
            <div>
              <SentimentTrend data={activeData} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white border border-[#E1E6E1] rounded-xl p-3 shadow-sm">
              <CallVolumeHeatmap data={activeData} />
            </div>
          </div>
        </div>

        {/* Right Info Panels */}
        <div className="w-[280px] p-4 hidden lg:block overflow-y-auto custom-scrollbar bg-white border-l border-[#E1E6E1]">
          <RightSidebarPanels />
        </div>
      </div>
    </div>
  );
}
export default OverallDashboard;
