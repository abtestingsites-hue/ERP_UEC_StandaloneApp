"use client";

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download } from 'lucide-react';
import { useSocket } from '../../providers/SocketProvider';

import { OverallDashboard } from './OverallDashboard';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { SalesDashboard } from './SalesDashboard';
import { AgentDashboard } from './AgentDashboard';
import { OmnichannelDashboard } from './OmnichannelDashboard';
import { ContactCenterDashboard } from './ContactCenterDashboard';
import { CustomerExperienceDashboard } from './CustomerExperienceDashboard';
import { AIInsightsDashboard } from './AIInsightsDashboard';
import { ReportsAnalyticsDashboard } from './ReportsAnalyticsDashboard';
import { CustomBuilderDashboard } from './CustomBuilderDashboard';
import { TodaysActionsDashboard } from './TodaysActionsDashboard';

export function DashboardSwitcher({ 
  allowedTypes = ['overall', 'actions', 'executive', 'sales_lead', 'agent_performance', 'omnichannel', 'contact_center', 'customer_experience', 'ai_insights', 'reports', 'custom'],
  defaultType = 'overall'
}: {
  allowedTypes?: string[];
  defaultType?: string;
}) {
  const { 
    activeType, setActiveType, metrics, fetchMetrics, isLoading,
    startDate, endDate, department, team, setFilters
  } = useDashboardStore();

  const [isOpen, setIsOpen] = useState(false);

  const allDashboards = [
    { type: 'overall', label: 'Overall Dashboard' },
    { type: 'executive', label: 'Executive Dashboard' },
    { type: 'sales_lead', label: 'Sales & Lead Dashboard' },
    { type: 'agent_performance', label: 'Agent Performance' },
    { type: 'omnichannel', label: 'Messaging Hub Dashboard' },
    { type: 'contact_center', label: 'Contact Center Live' },
    { type: 'customer_experience', label: 'Customer Experience' },
    { type: 'ai_insights', label: 'AI Insights' },
    { type: 'reports', label: 'Reports & Analytics' },
    { type: 'custom', label: 'Custom Builder' },
  ];

  const dashboards = allDashboards.filter(d => allowedTypes.includes(d.type));
  
  useEffect(() => {
    if (!allowedTypes.includes(activeType)) {
      setActiveType(defaultType);
    }
  }, [allowedTypes, activeType, defaultType, setActiveType]);

  const currentLabel = activeType === 'actions' 
    ? (dashboards[0]?.label || 'Dashboard') 
    : dashboards.find(d => d.type === activeType)?.label || dashboards[0]?.label || 'Dashboard';

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7F5] text-[#202020]">
      {/* Filters Dock & Swapping Selector */}
      <header className="border-b border-[#E1E6E1] bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 relative z-30">
        <div className="flex flex-wrap items-center gap-3.5">
          {/* Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F7F5] hover:bg-[#E7F4E8] border border-[#E1E6E1] rounded-xl text-sm font-bold text-[#202020] transition-all outline-none"
            >
              <span>{currentLabel}</span>
              <ChevronDown className={`w-4 h-4 text-[#039A01] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-64 bg-white border border-[#E1E6E1] rounded-xl shadow-xl overflow-hidden z-50 p-1"
                >
                  {dashboards.map((d) => (
                    <button
                      key={d.type}
                      onClick={() => {
                        setActiveType(d.type);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeType === d.type 
                          ? 'bg-[#E7F4E8] text-[#026601]' 
                          : 'text-[#5F6962] hover:bg-[#F5F7F5] hover:text-[#202020]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setActiveType('actions')}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-sm font-bold transition-all outline-none ${
              activeType === 'actions' 
                ? 'bg-[#E7F4E8] text-[#026601] border-[#C8E6CA] shadow-sm' 
                : 'bg-[#F5F7F5] hover:bg-[#E7F4E8] text-[#5F6962] hover:text-[#202020] border-[#E1E6E1]'
            }`}
          >
            Today's Actions
          </button>

          <div className="h-6 w-px bg-[#E1E6E1] hidden md:block"></div>

          {/* Start Date */}
          <div className="flex flex-col">
            <span className="text-[9px] text-[#5F6962] font-bold uppercase tracking-wider mb-1">Start Date</span>
            <input 
              aria-label="Dashboard filter start date" 
              type="date" 
              value={startDate}
              onChange={(e) => setFilters({ startDate: e.target.value })}
              className="bg-[#F5F7F5] border border-[#E1E6E1] rounded-lg px-2.5 py-0.5 text-xs text-[#202020] outline-none focus:border-[#039A01]"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <span className="text-[9px] text-[#5F6962] font-bold uppercase tracking-wider mb-1">End Date</span>
            <input 
              aria-label="Dashboard filter end date" 
              type="date" 
              value={endDate}
              onChange={(e) => setFilters({ endDate: e.target.value })}
              className="bg-[#F5F7F5] border border-[#E1E6E1] rounded-lg px-2.5 py-0.5 text-xs text-[#202020] outline-none focus:border-[#039A01]"
            />
          </div>

          {/* Dept */}
          <div className="flex flex-col">
            <span className="text-[9px] text-[#5F6962] font-bold uppercase tracking-wider mb-1">Department</span>
            <select 
              aria-label="Dashboard Department Filter" 
              value={department}
              onChange={(e) => setFilters({ department: e.target.value })}
              className="bg-[#F5F7F5] border border-[#E1E6E1] rounded-lg px-2 py-0.5 text-xs text-[#202020] outline-none focus:border-[#039A01]"
            >
              <option value="All">All Departments</option>
              <option value="Sales">Sales Division</option>
              <option value="Care">Care Support</option>
            </select>
          </div>
        </div>

        <button 
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F7F5] hover:bg-[#E7F4E8] border border-[#E1E6E1] rounded-xl text-xs font-bold text-[#202020] hover:text-[#039A01] transition-all self-end md:self-auto shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#039A01]" />
          <span>Export Report</span>
        </button>
      </header>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative bg-[#F5F7F5]">
        {isLoading && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-[#E1E6E1] px-3 py-1.5 rounded-full flex items-center shadow-md z-50">
            <span className="w-3.5 h-3.5 border-2 border-[#C8E6CA] border-t-[#039A01] rounded-full animate-spin mr-2"></span>
            <span className="text-[10px] text-[#202020] font-bold tracking-wider uppercase">Syncing</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeType === 'agent_performance' && <AgentDashboard metrics={metrics} />}
          {activeType === 'actions' && <TodaysActionsDashboard />}
          {activeType === 'overall' && <OverallDashboard data={metrics} metrics={metrics} />}
          {activeType === 'executive' && <ExecutiveDashboard metrics={metrics} />}
          {activeType === 'sales_lead' && <SalesDashboard metrics={metrics} />}
          {activeType === 'omnichannel' && <OmnichannelDashboard metrics={metrics} />}
          {activeType === 'contact_center' && <ContactCenterDashboard metrics={metrics} />}
          {activeType === 'customer_experience' && <CustomerExperienceDashboard metrics={metrics} />}
          {activeType === 'ai_insights' && <AIInsightsDashboard metrics={metrics} />}
          {activeType === 'reports' && <ReportsAnalyticsDashboard metrics={metrics} />}
          {activeType === 'custom' && <CustomBuilderDashboard />}
        </AnimatePresence>
      </div>
    </div>
  );
}
