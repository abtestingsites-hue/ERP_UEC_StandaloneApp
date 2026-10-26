"use client";

import React, { useState, useEffect } from 'react';
import Link from '../../nextShim';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Building,
  TrendingUp,
  Users,
  Headphones,
  Database,
  Plus,
  RefreshCw,
  ArrowRight,
  FileText,
  Sliders,
  Calendar,
} from 'lucide-react';
import { SopNav } from '../../components/sop/SopNav';
import { SopTaskModal } from '../../components/sop/SopTaskModal';
import { SopCreateTaskModal } from '../../components/sop/SopCreateTaskModal';
import { SopHandoffModal } from '../../components/sop/SopHandoffModal';
import { apiFetch, API_BASE_URL } from '../../lib/api';

export default function SopOverviewPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [handoffTask, setHandoffTask] = useState<any | null>(null);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE_URL}/api/v1/sop/overview`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load SOP overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleOpenTask = async (task: any) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/v1/sop/executions/${task.id}`);
      if (res.ok) {
        const fullTask = await res.json();
        setSelectedTask(fullTask);
        setIsTaskModalOpen(true);
      } else {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
      }
    } catch {
      setSelectedTask(task);
      setIsTaskModalOpen(true);
    }
  };

  const metrics = data?.metrics || {};
  const departmentWorkload = data?.departmentWorkload || {};
  const staffWorkload = data?.staffWorkload || [];
  const pendingApprovals = data?.pendingApprovals || [];
  const recentExecutions = data?.recentExecutions || [];

  const deptMeta: Record<string, { label: string; icon: any; color: string }> = {
    HR: { label: 'HR Department', icon: Users, color: 'emerald' },
    CCR: { label: 'Care Center (CCR)', icon: Headphones, color: 'blue' },
    SALES: { label: 'Sales Pipeline', icon: TrendingUp, color: 'amber' },
    DATA_ENTRY: { label: 'Data Entry & Quality', icon: Database, color: 'purple' },
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F7F5] overflow-hidden text-[#202020]">
      <SopNav
        badgeCounts={{
          daily: metrics.dueTodayCount,
          pendingApprovals: metrics.pendingApprovalCount,
        }}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E1E6E1]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA]">
                Unified Operations
              </span>
              <h1 className="text-2xl font-bold text-[#202020] tracking-tight">SOP & Daily Operations Dashboard</h1>
            </div>
            <p className="text-xs text-[#5F6962] mt-1">
              Cross-departmental standard operating procedures, daily execution tracking, and workflow orchestration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOverview}
              className="p-2 rounded-xl bg-white hover:bg-[#F5F7F5] text-[#5F6962] hover:text-[#202020] border border-[#E1E6E1] transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#039A01]' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#039A01] hover:bg-[#028001] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Operational Task
            </button>
          </div>
        </div>

        {/* Top Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-[#E1E6E1] rounded-xl p-3.5 shadow-xs">
            <span className="text-[11px] text-[#5F6962] font-medium block">Total Tasks</span>
            <span className="text-2xl font-bold text-[#202020] mt-1 block">{metrics.totalTasks || 0}</span>
            <span className="text-[10px] text-[#849389] mt-0.5 block">All active SOPs</span>
          </div>

          <div className="bg-white border border-[#E1E6E1] rounded-xl p-3.5 shadow-xs">
            <span className="text-[11px] text-[#5F6962] font-medium block">Due Today</span>
            <span className="text-2xl font-bold text-[#B45309] mt-1 block">{metrics.dueTodayCount || 0}</span>
            <span className="text-[10px] text-[#D97706] mt-0.5 block">Shift deadlines</span>
          </div>

          <div className="bg-white border border-[#E1E6E1] rounded-xl p-3.5 shadow-xs">
            <span className="text-[11px] text-[#5F6962] font-medium block">In Progress</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{metrics.inProgressCount || 0}</span>
            <span className="text-[10px] text-blue-500 mt-0.5 block">Under execution</span>
          </div>

          <div className="bg-white border border-[#E1E6E1] rounded-xl p-3.5 shadow-xs">
            <span className="text-[11px] text-[#5F6962] font-medium block">Pending Approval</span>
            <span className="text-2xl font-bold text-purple-600 mt-1 block">{metrics.pendingApprovalCount || 0}</span>
            <span className="text-[10px] text-purple-500 mt-0.5 block">Awaiting sign-off</span>
          </div>

          <div className="bg-white border border-[#E1E6E1] rounded-xl p-3.5 shadow-xs">
            <span className="text-[11px] text-[#5F6962] font-medium block">Completed</span>
            <span className="text-2xl font-bold text-[#039A01] mt-1 block">{metrics.completedCount || 0}</span>
            <span className="text-[10px] text-[#026601] mt-0.5 block">
              {metrics.completionRate || 0}% Completion
            </span>
          </div>

          <div className="bg-white border border-[#E1E6E1] rounded-xl p-3.5 shadow-xs">
            <span className="text-[11px] text-[#5F6962] font-medium block">Overdue / Blocked</span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">
              {(metrics.overdueCount || 0) + (metrics.blockedCount || 0)}
            </span>
            <span className="text-[10px] text-rose-500 mt-0.5 block">Requires escalation</span>
          </div>
        </div>

        {/* Department Workload Summary Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#202020] flex items-center gap-2">
              <Building className="w-4 h-4 text-[#039A01]" />
              Department-Wise Operational Workload
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['HR', 'CCR', 'SALES', 'DATA_ENTRY'].map((deptKey) => {
              const meta = deptMeta[deptKey] || { label: deptKey, icon: Building, color: 'emerald' };
              const Icon = meta.icon;
              const stats = departmentWorkload[deptKey] || { total: 0, completed: 0, inProgress: 0, overdue: 0, pendingApproval: 0 };
              const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 100;

              return (
                <Link key={deptKey} href={`/sop/${deptKey.toLowerCase().replace('_', '-')}`}>
                  <div className="bg-white hover:bg-[#F5F7F5] border border-[#E1E6E1] hover:border-[#039A01] rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-xs group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[#EFF3EF] group-hover:bg-[#E7F4E8] text-[#5F6962] group-hover:text-[#026601] border border-[#E1E6E1] transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-[#202020] group-hover:text-[#039A01] transition-colors">
                            {meta.label}
                          </h3>
                          <span className="text-[10px] text-[#5F6962]">{stats.total} Total Tasks</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#849389] group-hover:text-[#039A01] transition-transform group-hover:translate-x-0.5" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#5F6962]">Completion</span>
                        <span className="font-bold text-[#039A01]">{rate}%</span>
                      </div>
                      <div className="w-full bg-[#EFF3EF] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#039A01] h-full rounded-full transition-all" style={{ width: `${rate}%` }} />
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#E1E6E1] text-[10px] text-center">
                        <div>
                          <span className="text-[#5F6962] block">Active</span>
                          <span className="font-semibold text-blue-600">{stats.inProgress}</span>
                        </div>
                        <div>
                          <span className="text-[#5F6962] block">Approval</span>
                          <span className="font-semibold text-purple-600">{stats.pendingApproval}</span>
                        </div>
                        <div>
                          <span className="text-[#5F6962] block">Done</span>
                          <span className="font-semibold text-[#039A01]">{stats.completed}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Split Grid: Pending Approvals & Staff Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approvals Queue */}
          <div className="bg-white border border-[#E1E6E1] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#202020] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Pending Manager Approvals ({pendingApprovals.length})
              </h2>
              <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Action Required
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-[#5F6962] text-xs">
                No tasks currently waiting for manager sign-off.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingApprovals.map((task: any) => (
                  <div
                    key={task.id}
                    onClick={() => handleOpenTask(task)}
                    className="p-3 bg-[#141416] hover:bg-[#1a1a1e] border border-[#222] hover:border-purple-500/40 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary">{task.taskNumber}</span>
                        <span className="text-xs font-semibold text-white truncate">{task.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Assigned to {task.assignedAgent?.name || 'Unassigned'} | {task.department}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTask(task);
                      }}
                      className="px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold shrink-0"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Staff Workload Distribution */}
          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Personnel Workload & Deployment
              </h2>
              <span className="text-[10px] text-slate-500">Active Task Queue</span>
            </div>

            {staffWorkload.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active staff assignments recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {staffWorkload.slice(0, 5).map((staff: any) => (
                  <div
                    key={staff.agentId}
                    className="p-3 bg-[#141416] border border-[#222] rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">{staff.name}</span>
                        <span className="text-[10px] text-slate-500">{staff.department}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {staff.urgentCount > 0 && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          {staff.urgentCount} Urgent
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {staff.activeTasksCount} Tasks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent SOP Task Executions */}
        <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent SOP Task Executions
            </h2>
            <Link href="/sop/daily-operations" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All Operations <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#1e1e22]">
            {recentExecutions.map((task: any) => (
              <div
                key={task.id}
                onClick={() => handleOpenTask(task)}
                className="py-3 hover:bg-[#141416] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-primary">{task.taskNumber}</span>
                  <span className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                    {task.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded bg-[#1e1e22] text-slate-400">
                    {task.department}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : task.status === 'PENDING_APPROVAL'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      {selectedTask && (
        <SopTaskModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={() => {
            fetchOverview();
            handleOpenTask(selectedTask);
          }}
          onOpenHandoff={(task) => {
            setHandoffTask(task);
            setIsHandoffModalOpen(true);
          }}
        />
      )}

      <SopCreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={fetchOverview}
      />

      {handoffTask && (
        <SopHandoffModal
          task={handoffTask}
          isOpen={isHandoffModalOpen}
          onClose={() => {
            setIsHandoffModalOpen(false);
            setHandoffTask(null);
          }}
          onHandoffComplete={fetchOverview}
        />
      )}
    </div>
  );
}
