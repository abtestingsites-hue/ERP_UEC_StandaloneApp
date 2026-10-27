"use client";

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { 
  Settings, Play, Pause, Zap, Workflow, Plus, Search, 
  Filter, Download, MessageSquare, Camera, Globe, 
  Mail, MessageCircle, Phone, ArrowLeft, Check, CheckCircle2,
  ChevronDown, ChevronRight, FileText, Image, Bot, Eye, Edit2,
  Clock, PlayCircle, RefreshCw, Trash2
} from 'lucide-react';

// ==========================================
// 1. NAVIGATION METADATA
// ==========================================
const OMNICHANNEL_NAV = [
  {
    group: 'Automation Rules', id: 'omni-auto', icon: Zap,
    items: [
      { id: 'auto-replies', label: 'Auto Replies', desc: 'Configure global trigger-based replies across all channels' },
      { id: 'chatbot', label: 'Chatbot Brain', desc: 'Enterprise AI conversational flows and human escalation' },
    ]
  },
  {
    group: 'Asset Library', id: 'omni-assets', icon: FileText,
    items: [
      { id: 'templates', label: 'Message Templates', desc: 'Design and manage approved templates for cross-channel use' },
      { id: 'media', label: 'Media Library', desc: 'Central repository for attachments, PDFs, and multimedia' },
    ]
  }
];

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'instagram', label: 'Instagram', icon: Camera, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'facebook', label: 'Facebook', icon: Globe, color: 'text-blue-700', bg: 'bg-blue-50' },
  { id: 'livechat', label: 'Live Chat', icon: MessageSquare, color: 'text-[#039A01]', bg: 'bg-emerald-50' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-100' },
  { id: 'voice', label: 'Voice IVR', icon: Phone, color: 'text-purple-600', bg: 'bg-purple-50' },
];

// ==========================================
// 2. GENERIC ENTERPRISE WORKSPACE LAYOUTS
// ==========================================
const EnterpriseTableWorkspace = ({ columns, data, primaryAction, searchPlaceholder, emptyMessage }: any) => {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex justify-between items-center mb-4 bg-white p-4 border border-[#E1E6E1] rounded-xl shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E9A91] absolute left-3 top-1/2 -translate-y-1/2" />
          <input aria-label="Search automation workflows" 
            type="text" 
            placeholder={searchPlaceholder || "Search records..."}
            className="bg-[#FAFCFA] border border-[#D5DDD5] rounded-lg pl-9 pr-4 py-2 text-xs text-[#202020] placeholder:text-[#8E9A91] outline-none focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] w-72 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D5DDD5] text-[#3B443F] hover:bg-[#F5F7F5] rounded-lg text-xs font-semibold transition-colors">
            <Filter className="w-3.5 h-3.5 text-[#5F6962]" /> Filters
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D5DDD5] text-[#3B443F] hover:bg-[#F5F7F5] rounded-lg text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5 text-[#5F6962]" /> Export
          </button>
          {primaryAction && (
            <button className="flex items-center gap-1.5 px-4 py-2 bg-[#039A01] hover:bg-[#028001] text-white rounded-lg text-xs font-bold transition-all shadow-xs">
              <Plus className="w-3.5 h-3.5" /> {primaryAction}
            </button>
          )}
        </div>
      </div>

      <div className="border border-[#E1E6E1] rounded-xl overflow-hidden bg-white shadow-xs">
        <table aria-label="Automation workflow rules table" className="w-full text-left text-xs">
          <thead className="bg-[#FAFCFA] border-b border-[#E1E6E1]">
            <tr>
              {columns.map((col: string, idx: number) => (
                <th key={idx} className={`px-5 py-3 font-bold text-[#5F6962] uppercase tracking-wider ${idx === columns.length - 1 ? 'text-right' : ''}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1E6E1]">
            {data.length > 0 ? data.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-[#F5F7F5] transition-colors">
                {row.map((cell: any, cellIdx: number) => (
                  <td key={cellIdx} className={`px-5 py-4 ${cellIdx === row.length - 1 ? 'text-right' : 'text-[#202020] font-medium'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-[#8E9A91] font-medium border-dashed">
                  {emptyMessage || "No data records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EnterpriseFormWorkspace = ({ children, saveText, testText }: any) => {
  return (
    <div className="max-w-4xl bg-white border border-[#E1E6E1] rounded-xl overflow-hidden shadow-xs animate-in fade-in">
      <div className="p-6 space-y-6">
        {children}
      </div>
      <div className="p-5 bg-[#FAFCFA] border-t border-[#E1E6E1] flex items-center justify-between">
        <button type="button" className="text-xs text-[#5F6962] hover:text-[#202020] transition-colors">Discard Changes</button>
        <div className="flex items-center gap-3">
          {testText && (
            <button type="button" className="px-4 py-2.5 bg-white border border-[#D5DDD5] hover:border-[#039A01] text-[#202020] rounded-lg text-xs font-bold transition-all">
              {testText}
            </button>
          )}
          <button type="button" className="px-5 py-2.5 bg-[#039A01] hover:bg-[#028001] text-white rounded-lg text-xs font-bold transition-all shadow-xs">
            {saveText || "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function AutomationPage() {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'omni-auto': true, 'omni-assets': true });
  const [activeSetting, setActiveSetting] = useState<string>('auto-replies');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real backend workflow state
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // States for Auto Replies workflow creation
  const [view, setView] = useState<'list' | 'create'>('list');
  const [selectedChannels, setSelectedChannels] = useState<Record<string, boolean>>({
    whatsapp: true, email: true, instagram: true, livechat: true,
  });

  // Form input states
  const [ruleName, setRuleName] = useState('Global Welcome Message');
  const [triggerEvent, setTriggerEvent] = useState('New Conversation Started');
  const [rulePriority, setRulePriority] = useState('P2 - High');
  const [replyContent, setReplyContent] = useState("Welcome to ElderCare! How can we assist you today? Please reply with your inquiry or type 'Menu' to see our services.");

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/v1/automations');
      if (Array.isArray(data)) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          trigger: item.triggerType || 'New Inbound Conversation',
          action: (item.actionConfig?.replyContent) 
            ? `Send "${item.actionConfig.replyContent.slice(0, 32)}..."` 
            : (item.actionType || 'Auto Reply'),
          channels: Array.isArray(item.actionConfig?.channels) && item.actionConfig.channels.length > 0
            ? item.actionConfig.channels 
            : ['whatsapp', 'email'],
          status: item.isActive ? 'Active' : 'Inactive',
          priority: item.actionConfig?.priority || 'P2',
          createdAt: item.createdAt,
        }));
        setWorkflows(mapped);
      }
    } catch (err: any) {
      console.warn('[Automation API Fetch Warning]:', err.message);
      // Fallback display if network issue
      setWorkflows([
        { id: 'default-1', name: 'Global Welcome Message', trigger: 'New Conversation Started', action: 'Send "Welcome to ElderCare"', channels: ['whatsapp', 'email', 'livechat', 'instagram'], status: 'Active', priority: 'P1' },
        { id: 'default-2', name: 'After-Hours Auto Reply', trigger: 'Outside Business Hours', action: 'Send "We are currently away"', channels: ['whatsapp', 'facebook', 'instagram', 'sms'], status: 'Active', priority: 'P2' },
        { id: 'default-3', name: 'VIP Customer SLA Warning', trigger: 'No response > 15 mins', action: 'Escalate to Department Head', channels: ['livechat', 'whatsapp'], status: 'Inactive', priority: 'P1' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleSaveAutomation = async () => {
    if (!ruleName.trim()) {
      setNotification({ type: 'error', message: 'Rule name is required' });
      return;
    }
    const enabledChannels = Object.entries(selectedChannels)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    setActionLoading('save');
    try {
      await api.post('/api/v1/automations', {
        name: ruleName.trim(),
        description: `Auto reply via ${enabledChannels.join(', ')}`,
        triggerType: triggerEvent,
        actionType: 'AUTO_REPLY',
        actionConfig: {
          replyContent,
          channels: enabledChannels,
          priority: rulePriority.split(' ')[0] || 'P2'
        },
        isActive: true
      });
      setNotification({ type: 'success', message: 'Automation rule deployed successfully to backend!' });
      await fetchWorkflows();
      setView('list');
    } catch (err: any) {
      console.error('[Create Automation Error]', err);
      setNotification({ type: 'error', message: err.message || 'Failed to save automation rule' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    if (id.startsWith('default-')) {
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'Active' ? 'Inactive' : 'Active' } : w));
      return;
    }
    setActionLoading(id);
    try {
      await api.patch(`/api/v1/automations/${id}/toggle`);
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'Active' ? 'Inactive' : 'Active' } : w));
      setNotification({ type: 'success', message: 'Automation rule status toggled' });
    } catch (err: any) {
      console.error('[Toggle Automation Error]', err);
      setNotification({ type: 'error', message: err.message || 'Failed to toggle status' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('default-')) {
      setWorkflows(prev => prev.filter(w => w.id !== id));
      return;
    }
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    setActionLoading(id);
    try {
      await api.delete(`/api/v1/automations/${id}`);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      setNotification({ type: 'success', message: 'Automation rule deleted successfully' });
    } catch (err: any) {
      console.error('[Delete Automation Error]', err);
      setNotification({ type: 'error', message: err.message || 'Failed to delete automation rule' });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getActiveSettingInfo = () => {
    for (const group of OMNICHANNEL_NAV) {
      for (const item of group.items) {
        if (item.id === activeSetting) return { group: group.group, label: item.label, desc: item.desc };
      }
    }
    return { group: 'Messaging Hub Admin', label: 'Dashboard', desc: 'Overview' };
  };

  const activeInfo = getActiveSettingInfo();

  const renderAutoReplies = () => {
    if (view === 'create') {
      return (
        <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('list')} className="p-2 hover:bg-[#F5F7F5] rounded-lg text-[#5F6962] hover:text-[#202020] transition-colors" aria-label="Back to automation list">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#202020] mb-1">Create Auto Reply Rule</h2>
              <p className="text-xs text-[#5F6962]">Define the conditions, message payload, and select which communication channels this rule applies to.</p>
            </div>
          </div>

          {notification && (
            <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between mb-4 ${
              notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} className="text-[#5F6962] hover:text-[#202020]">&times;</button>
            </div>
          )}

          <div className="bg-white border border-[#E1E6E1] rounded-xl p-6 mb-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#202020] mb-4">1. Rule Configuration</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Rule Name</label>
                <input 
                  aria-label="Rule Name" 
                  type="text" 
                  value={ruleName} 
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-[#FAFCFA] border border-[#D5DDD5] focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] rounded-lg px-4 py-2 text-sm text-[#202020] outline-none transition-colors" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Trigger Event</label>
                <select 
                  aria-label="Automation trigger event" 
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="w-full bg-[#FAFCFA] border border-[#D5DDD5] focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] rounded-lg px-4 py-2 text-sm text-[#202020] outline-none transition-colors"
                >
                  <option value="New Conversation Started">New Conversation Started</option>
                  <option value="Outside Business Hours">Outside Business Hours</option>
                  <option value="Customer Idle > 15 mins">Customer Idle &gt; 15 mins</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Rule Priority</label>
                <select 
                  aria-label="Automation rule priority" 
                  value={rulePriority}
                  onChange={(e) => setRulePriority(e.target.value)}
                  className="w-full bg-[#FAFCFA] border border-[#D5DDD5] focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] rounded-lg px-4 py-2 text-sm text-[#202020] outline-none transition-colors"
                >
                  <option value="P1 - Critical (Overrides all)">P1 - Critical (Overrides all)</option>
                  <option value="P2 - High">P2 - High</option>
                  <option value="P3 - Normal">P3 - Normal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E1E6E1] rounded-xl p-6 mb-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#202020] mb-4 flex items-center justify-between">
              2. Message Payload
              <button type="button" className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-bold border border-emerald-200">Enable AI Optimization</button>
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Reply Content</label>
              <textarea 
                aria-label="Template content" 
                rows={4} 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full bg-[#FAFCFA] border border-[#D5DDD5] focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] rounded-lg px-4 py-3 text-sm text-[#202020] outline-none custom-scrollbar transition-colors" 
              />
            </div>
          </div>

          <div className="bg-white border border-[#E1E6E1] rounded-xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#202020] mb-4">3. Channel Distribution</h3>
            <p className="text-xs text-[#5F6962] mb-4">Select the platforms where this auto-reply should be active. The message payload will be automatically formatted for the destination channel.</p>
            <div className="grid grid-cols-2 gap-4">
              {CHANNELS.map(channel => {
                const Icon = channel.icon;
                const isSelected = selectedChannels[channel.id];
                return (
                  <div 
                    key={channel.id} onClick={() => toggleChannel(channel.id)}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      isSelected ? 'bg-emerald-50/60 border-[#039A01]' : 'bg-white border-[#D5DDD5] hover:border-[#C8E6CA]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${channel.bg}`}><Icon className={`w-4 h-4 ${channel.color}`} /></div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-[#026601]' : 'text-[#5F6962]'}`}>{channel.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-[#039A01] border-[#039A01] text-white' : 'border-[#D5DDD5]'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setView('list')} className="px-5 py-2.5 bg-white border border-[#D5DDD5] text-[#202020] hover:bg-[#F5F7F5] rounded-lg text-sm font-bold transition-colors">Cancel</button>
            <button 
              onClick={handleSaveAutomation} 
              disabled={actionLoading === 'save'}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#039A01] hover:bg-[#028001] disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all shadow-xs"
            >
              {actionLoading === 'save' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {actionLoading === 'save' ? 'Deploying...' : 'Save Automation Rule'}
            </button>
          </div>
        </div>
      );
    }

    const filteredWorkflows = workflows.filter(wf => 
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      wf.trigger.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-4 animate-in fade-in">
        {notification && (
          <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between mb-4 ${
            notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-[#5F6962] hover:text-[#202020]">&times;</button>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 bg-white p-4 border border-[#E1E6E1] rounded-xl shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E9A91] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              aria-label="Search auto-replies" 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search auto-replies..." 
              className="bg-[#FAFCFA] border border-[#D5DDD5] rounded-lg pl-9 pr-4 py-2 text-xs text-[#202020] placeholder:text-[#8E9A91] outline-none focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] w-72 transition-colors"
            />
          </div>
          <button onClick={() => setView('create')} className="flex items-center gap-1.5 px-4 py-2 bg-[#039A01] hover:bg-[#028001] text-white rounded-lg text-xs font-bold transition-all shadow-xs">
            <Plus className="w-3.5 h-3.5" /> Create Auto Reply
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#5F6962] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#039A01]" />
            <span>Loading active automations...</span>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="p-12 text-center text-[#8E9A91] border border-dashed border-[#D5DDD5] bg-white rounded-xl">
            No automation rules found matching &quot;{searchQuery}&quot;. Click &quot;Create Auto Reply&quot; to add one.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWorkflows.map((wf) => (
              <div key={wf.id} className="bg-white border border-[#E1E6E1] p-5 rounded-xl flex items-center justify-between hover:border-[#C8E6CA] transition-colors group shadow-xs">
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-xl ${wf.status === 'Active' ? 'bg-[#E7F4E8] text-[#026601] border border-[#C8E6CA]' : 'bg-[#F5F7F5] text-[#8E9A91] border border-[#E1E6E1]'}`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-[#202020] text-sm">{wf.name}</h3>
                      <span className="px-1.5 py-0.5 bg-[#F5F7F5] border border-[#E1E6E1] rounded text-[9px] font-bold text-[#5F6962]">{wf.priority}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-[#5F6962]">Trigger: <strong className="text-[#202020]">{wf.trigger}</strong></span>
                      <span className="text-[#8E9A91]">→</span>
                      <span className="text-[#5F6962]">Action: <strong className="text-[#202020]">{wf.action}</strong></span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="flex -space-x-2">
                    {wf.channels.map((chanId: string) => {
                      const channel = CHANNELS.find(c => c.id === chanId);
                      if (!channel) return null;
                      const Icon = channel.icon;
                      return (
                        <div key={chanId} className={`w-8 h-8 rounded-full ${channel.bg} border-2 border-white flex items-center justify-center z-10 shadow-xs`}>
                          <Icon className={`w-3.5 h-3.5 ${channel.color}`} />
                        </div>
                      );
                    })}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${wf.status === 'Active' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-slate-500 border-slate-200 bg-slate-100'}`}>
                    {wf.status}
                  </span>
                  <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleToggleActive(wf.id)}
                      disabled={actionLoading === wf.id}
                      aria-label="Toggle automation status"
                      title={wf.status === 'Active' ? 'Pause rule' : 'Activate rule'}
                      className="p-2 bg-white border border-[#D5DDD5] text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5] rounded-lg transition-colors"
                    >
                      {actionLoading === wf.id ? <RefreshCw className="w-4 h-4 animate-spin text-[#039A01]" /> : wf.status === 'Active' ? <Pause className="w-4 h-4 text-amber-600" /> : <Play className="w-4 h-4 text-[#039A01]" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(wf.id)}
                      disabled={actionLoading === wf.id}
                      aria-label="Delete automation rule"
                      title="Delete rule"
                      className="p-2 bg-white border border-[#D5DDD5] text-[#5F6962] hover:text-rose-600 hover:bg-[#F5F7F5] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWorkspace = () => {
    switch (activeSetting) {
      case 'auto-replies':
        return renderAutoReplies();

      case 'chatbot':
        return (
          <EnterpriseFormWorkspace saveText="Deploy Bot Configuration" testText="Test in Sandbox">
            <div className="flex items-center justify-between border-b border-[#E1E6E1] pb-6 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#202020] flex items-center gap-2"><Bot className="w-5 h-5 text-[#039A01]"/> Messaging Hub Chatbot Brain</h3>
                <p className="text-xs text-[#5F6962] mt-1">Configure AI intent mapping, welcome flows, and human escalation rules for all text channels.</p>
              </div>
              <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Active & Routing</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Welcome Message Flow (New Sessions)</label>
                <select aria-label="Automation condition" className="w-full bg-[#FAFCFA] border border-[#D5DDD5] focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] rounded-lg px-4 py-2.5 text-sm text-[#202020] outline-none transition-colors">
                  <option>Global Welcome Flow (Interactive Menu)</option>
                  <option>Direct Agent Routing (No Bot)</option>
                  <option>Holiday Away Message</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Human Handover Intent Confidence</label>
                <div className="flex items-center gap-3">
                  <input aria-label="Human Handover Intent Confidence" type="range" min="0" max="100" defaultValue="75" className="flex-1 accent-[#039A01]" />
                  <span className="text-sm font-bold text-[#039A01] w-12">&lt; 75%</span>
                </div>
                <p className="text-[10px] text-[#5F6962]">Route to human if NLP intent confidence is below threshold.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#5F6962] uppercase tracking-wider">Escalation Department</label>
                <select aria-label="Automation action" className="w-full bg-[#FAFCFA] border border-[#D5DDD5] focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] rounded-lg px-4 py-2 text-sm text-[#202020] outline-none transition-colors">
                  <option>Customer Support (Default)</option>
                  <option>Sales & Conversions</option>
                  <option>Technical Triage</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#E1E6E1]">
              <h4 className="text-xs font-bold text-[#5F6962] uppercase tracking-wider mb-4">Fallback & Generative AI</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-[#FAFCFA] border border-[#E1E6E1] rounded-xl col-span-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#202020] flex items-center gap-2">Enable AI Generative Fallback</h4>
                    <p className="text-xs text-[#5F6962] mt-1">If no exact intent matches, allow ChatGPT engine to generate a safe response based on KB.</p>
                  </div>
                  <div className="w-12 h-6 bg-[#039A01] rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </EnterpriseFormWorkspace>
        );

      case 'templates':
        return (
          <EnterpriseTableWorkspace 
            columns={['Template Name', 'Category', 'Language', 'Quality Rating', 'Approval Status', 'Usage 30d', 'Actions']}
            data={[
              [<span key="1" className="font-bold text-[#202020]">marketing_promo_v1</span>, 'MARKETING', 'en_US', <span key="q1" className="text-emerald-700 font-bold">High</span>, <span key="s1" className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-bold uppercase flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>, '4,231', <div key="a1" className="flex justify-end gap-2"><button aria-label="View rule" className="p-1 text-[#5F6962] hover:text-[#039A01]"><Eye className="w-4 h-4"/></button><button aria-label="Edit rule" className="p-1 text-[#5F6962] hover:text-[#039A01]"><Edit2 className="w-4 h-4"/></button></div>],
              [<span key="2" className="font-bold text-[#202020]">ticket_resolution_alert</span>, 'UTILITY', 'en_GB', <span key="q2" className="text-emerald-700 font-bold">High</span>, <span key="s2" className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-bold uppercase flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>, '892', <div key="a2" className="flex justify-end gap-2"><button aria-label="View rule" className="p-1 text-[#5F6962] hover:text-[#039A01]"><Eye className="w-4 h-4"/></button><button aria-label="Edit rule" className="p-1 text-[#5F6962] hover:text-[#039A01]"><Edit2 className="w-4 h-4"/></button></div>],
              [<span key="3" className="font-bold text-[#202020]">lead_welcome_video</span>, 'MARKETING', 'es_ES', <span key="q3" className="text-[#5F6962] font-bold">-</span>, <span key="s3" className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-bold uppercase flex items-center w-fit gap-1"><Clock className="w-3 h-3"/> Pending</span>, '0', <div key="a3" className="flex justify-end gap-2"><button aria-label="View rule" className="p-1 text-[#5F6962] hover:text-[#039A01]"><Eye className="w-4 h-4"/></button><button aria-label="Edit rule" className="p-1 text-[#5F6962] hover:text-[#039A01]"><Edit2 className="w-4 h-4"/></button></div>],
              [<span key="4" className="font-bold text-[#202020]">otp_verification_2fa</span>, 'AUTHENTICATION', 'en_US', <span key="q4" className="text-emerald-700 font-bold">High</span>, <span key="s4" className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-bold uppercase flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>, '12,504', <div key="a4" className="flex justify-end gap-2"><button aria-label="View rule" className="p-1 text-[#5F6962] hover:text-[#039A01]"><Eye className="w-4 h-4"/></button><button aria-label="Edit rule" className="p-1 text-[#5F6962] hover:text-[#039A01]"><Edit2 className="w-4 h-4"/></button></div>],
            ]}
            primaryAction="Create Template"
            searchPlaceholder="Search Omnichannel templates by name or category..."
          />
        );

      case 'media':
        return (
          <EnterpriseTableWorkspace 
            columns={['Media Asset', 'Type', 'Size', 'Linked Templates', 'Last Updated', 'Actions']}
            data={[
              [<div key="m1" className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#F5F7F5] border border-[#E1E6E1] flex items-center justify-center"><Image className="w-4 h-4 text-emerald-600"/></div><span className="font-bold text-[#202020]">diwali_promo_header.png</span></div>, 'IMAGE', '1.2 MB', 'marketing_promo_v1', 'Oct 15, 2025', <div key="a1" className="flex justify-end gap-2"><button aria-label="Refresh media asset" className="p-1 text-[#5F6962] hover:text-[#039A01]"><RefreshCw className="w-4 h-4"/></button><button aria-label="Delete media asset" className="p-1 text-[#5F6962] hover:text-rose-600"><Trash2 className="w-4 h-4"/></button></div>],
              [<div key="m2" className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#F5F7F5] border border-[#E1E6E1] flex items-center justify-center"><PlayCircle className="w-4 h-4 text-blue-600"/></div><span className="font-bold text-[#202020]">product_demo.mp4</span></div>, 'VIDEO', '14.5 MB', 'lead_welcome_video', 'Nov 02, 2025', <div key="a2" className="flex justify-end gap-2"><button aria-label="Refresh media asset" className="p-1 text-[#5F6962] hover:text-[#039A01]"><RefreshCw className="w-4 h-4"/></button><button aria-label="Delete media asset" className="p-1 text-[#5F6962] hover:text-rose-600"><Trash2 className="w-4 h-4"/></button></div>],
              [<div key="m3" className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#F5F7F5] border border-[#E1E6E1] flex items-center justify-center"><FileText className="w-4 h-4 text-emerald-600"/></div><span className="font-bold text-[#202020]">company_brochure.pdf</span></div>, 'DOCUMENT', '4.1 MB', 'brochure_outreach', 'Sep 10, 2025', <div key="a3" className="flex justify-end gap-2"><button aria-label="Refresh media asset" className="p-1 text-[#5F6962] hover:text-[#039A01]"><RefreshCw className="w-4 h-4"/></button><button aria-label="Delete media asset" className="p-1 text-[#5F6962] hover:text-rose-600"><Trash2 className="w-4 h-4"/></button></div>],
            ]}
            primaryAction="Upload Media"
            searchPlaceholder="Search media by filename or type..."
          />
        );

      default:
        return (
          <div className="h-64 border-2 border-dashed border-[#E1E6E1] bg-white rounded-xl flex flex-col items-center justify-center text-[#8E9A91] animate-in fade-in">
            <Settings className="w-8 h-8 text-[#D5DDD5] mb-3" />
            <h3 className="text-[#202020] font-bold mb-1">{activeInfo.label} Configuration</h3>
            <p className="text-xs">This enterprise module configuration is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#F5F7F5] text-[#202020] overflow-hidden p-4">
      {/* Centralized Workspace Container */}
      <div className="flex-1 flex border border-[#E1E6E1] rounded-2xl bg-white overflow-hidden shadow-xs">
        
        {/* LEFT NAV PANEL */}
        <div className="w-[280px] bg-[#FAFCFA] border-r border-[#E1E6E1] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#E1E6E1]">
            <h1 className="text-base font-black text-[#202020] flex items-center gap-2 tracking-wide">
              <Workflow className="text-[#039A01] w-5 h-5" /> MESSAGING HUB ADMIN
            </h1>
            <div className="relative mt-4">
              <Search className="w-3.5 h-3.5 text-[#8E9A91] absolute left-3 top-1/2 -translate-y-1/2" />
              <input aria-label="Search settings and rules" 
                type="text" 
                placeholder="Search settings..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#D5DDD5] rounded-lg pl-9 pr-3 py-2 text-xs text-[#202020] placeholder:text-[#8E9A91] outline-none focus:border-[#039A01] focus:ring-1 focus:ring-[#039A01] transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {OMNICHANNEL_NAV.map((group) => {
              const isExpanded = expandedGroups[group.id];
              const matchesSearch = searchQuery === '' || 
                                    group.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    group.items.some(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
              
              if (!matchesSearch) return null;

              return (
                <div key={group.id} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-[#3B443F] hover:bg-[#F0F5F0] transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <group.icon className="w-4 h-4 text-[#5F6962] group-hover:text-[#039A01] transition-colors" />
                      {group.group}
                    </div>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#5F6962]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#5F6962]" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-0.5 ml-3 pl-3 border-l border-[#E1E6E1] space-y-0.5">
                      {group.items.map((item) => {
                        if (searchQuery !== '' && !item.label.toLowerCase().includes(searchQuery.toLowerCase())) return null;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveSetting(item.id);
                              setView('list'); // Reset view state when navigating
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                              activeSetting === item.id 
                                ? 'bg-[#E7F4E8] text-[#026601] font-bold border border-[#C8E6CA]' 
                                : 'text-[#5F6962] hover:text-[#202020] hover:bg-[#F0F5F0]'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F5F7F5]">
          
          <div className="h-20 border-b border-[#E1E6E1] p-6 shrink-0 flex items-center justify-between bg-white">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#5F6962] uppercase tracking-wider mb-1">
                <span>Messaging Hub Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span>{activeInfo.group}</span>
              </div>
              <h2 className="text-xl font-bold text-[#202020] tracking-tight">{activeInfo.label}</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <p className="text-xs text-[#5F6962]">{activeInfo.desc}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative">
            {renderWorkspace()}
          </div>
        </div>

      </div>
    </div>
  );
}
