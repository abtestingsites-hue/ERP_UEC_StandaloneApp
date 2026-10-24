import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, Save, Play, ChevronRight, Zap, Info, Filter,
    Copy, Power, Search, CheckCircle2, XCircle,
    FileJson, Layout
} from 'lucide-react';

interface Condition {
    field: string;
    operator: string;
    value: string;
}

interface Rule {
    id?: string;
    name: string;
    module: string;
    conditions: {
        logic: string;
        conditions: Condition[];
    };
    action: string;
    actionValue: string;
    priority: number;
    status: boolean;
}

const FIELD_OPTIONS = [
    { value: 'input.serviceType', label: 'Service Type' },
    { value: 'input.enquiryMode', label: 'Enquiry Mode' },
    { value: 'input.clientComments', label: 'Client Comments' },
    { value: 'computed.score', label: 'Automation Score' },
    { value: 'source', label: 'Lead Source' },
    { value: 'message', label: 'Incoming Message' }
];

const OPERATORS = [
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Does Not Equal' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: 'contains', label: 'Contains' }
];

const ACTIONS = [
    { value: 'add_score', label: 'Add Score' },
    { value: 'set_priority', label: 'Set Priority' },
    { value: 'auto_approve', label: 'Auto Approve' },
    { value: 'flag_anomaly', label: 'Flag Anomaly' }
];

const ConditionRow = ({
    condition,
    index,
    onUpdate,
    onRemove
}: {
    condition: Condition,
    index: number,
    onUpdate: (index: number, field: string, value: string) => void,
    onRemove: (index: number) => void
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-black p-3 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm group animate-in slide-in-from-left-2 transition-all">
            <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Field</label>
                <select
                    value={condition.field}
                    onChange={e => onUpdate(index, 'field', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-primary-500 text-sm appearance-none"
                >
                    {FIELD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            <div className="w-full sm:w-32 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Operator</label>
                <select
                    value={condition.operator}
                    onChange={e => onUpdate(index, 'operator', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-1 focus:ring-primary-500"
                >
                    {OPERATORS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Value</label>
                <input
                    value={condition.value}
                    onChange={e => onUpdate(index, 'value', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Match value..."
                />
            </div>

            <button
                onClick={() => onRemove(index)}
                className="mt-5 text-gray-400 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove Condition"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

export const RuleBuilder = () => {
    const [rules, setRules] = useState<Rule[]>([]);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [activeModule, setActiveModule] = useState('enquiry');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showTestModal, setShowTestModal] = useState(false);
    const [testInput, setTestInput] = useState('{\n  "serviceType": "In-House Care",\n  "clientComments": "urgent case"\n}');
    const [testResult, setTestResult] = useState<{ triggered: boolean } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const emptyRule: Rule = {
        name: '',
        module: activeModule,
        conditions: { logic: 'AND', conditions: [{ field: 'input.serviceType', operator: '=', value: '' }] },
        action: 'add_score',
        actionValue: '10',
        priority: 0,
        status: true
    };

    useEffect(() => {
        fetchRules();
    }, [activeModule]);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/automation/rules?module=${activeModule}`);
            const data = await res.json();
            setRules(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch rules', err);
            setRules([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingRule || !editingRule.name) return;
        setLoading(true);
        try {
            const method = editingRule.id ? 'PUT' : 'POST';
            const url = editingRule.id ? `/api/automation/rules/${editingRule.id}` : '/api/automation/rules';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingRule)
            });

            if (res.ok) {
                setEditingRule(null);
                fetchRules();
            }
        } catch (err) {
            console.error('Save failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/automation/rules/${id}/duplicate`, { method: 'POST' });
            if (res.ok) {
                fetchRules();
            }
        } catch (err) {
            console.error('Duplicate failed', err);
        }
    };

    const handleToggleStatus = async (rule: Rule, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/automation/rules/${rule.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: !rule.status })
            });
            if (res.ok) {
                fetchRules();
            }
        } catch (err) {
            console.error('Toggle status failed', err);
        }
    };

    const runTest = async () => {
        if (!editingRule) return;
        setIsTesting(true);
        setTestResult(null);
        try {
            let inputJson;
            try {
                inputJson = JSON.parse(testInput);
            } catch (e) {
                alert("Invalid JSON input");
                setIsTesting(false);
                return;
            }

            const res = await fetch('/api/automation/rules/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conditions: editingRule.conditions,
                    input: inputJson,
                    module: editingRule.module
                })
            });
            const data = await res.json();
            setTestResult(data);
        } catch (err) {
            console.error('Test failed', err);
        } finally {
            setIsTesting(false);
        }
    };

    const addCondition = () => {
        if (!editingRule) return;
        const newConditions = [...editingRule.conditions.conditions, { field: 'input.serviceType', operator: '=', value: '' }];
        setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, conditions: newConditions } });
    };

    const removeCondition = (index: number) => {
        if (!editingRule || editingRule.conditions.conditions.length <= 1) return;
        const newConditions = editingRule.conditions.conditions.filter((_, i) => i !== index);
        setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, conditions: newConditions } });
    };

    const updateCondition = (index: number, field: string, value: string) => {
        if (!editingRule) return;
        const newConditions = [...editingRule.conditions.conditions];
        newConditions[index] = { ...newConditions[index], [field as keyof Condition]: value };
        setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, conditions: newConditions } });
    };

    const filteredRules = rules.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-full w-full min-w-0 flex-col space-y-5 p-4 dark:bg-black sm:p-6 xl:space-y-6 2xl:space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-500/10 p-3 rounded-2xl">
                        <Zap className="text-primary-500" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Automation Engine
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Fine-tune your business intelligence rules.</p>
                    </div>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search rules..."
                            className="pl-10 pr-4 py-2 bg-white dark:bg-black border dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-64 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <button
                        onClick={() => setEditingRule(emptyRule)}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95 font-bold flex-shrink-0"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Create New Rule</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-6 2xl:gap-8">
                {/* Left Sidebar: Rule List */}
                <div className="flex flex-col space-y-4 lg:col-span-4">
                    {/* Module Selectors */}
                    <div className="flex p-1 bg-gray-100 dark:bg-white/5 border dark:border-white/10 rounded-xl flex-shrink-0">
                        {['enquiry', 'accounts', 'hr'].map(mod => (
                            <button
                                key={mod}
                                onClick={() => setActiveModule(mod)}
                                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg capitalize transition-all ${activeModule === mod ? 'bg-white dark:bg-black shadow-sm text-primary-600 border dark:border-white/10' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {mod}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable Rule Cards */}
                    <div className="space-y-3 pr-2">
                        {loading && !editingRule ? (
                            <div className="animate-pulse space-y-3">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl"></div>)}
                            </div>
                        ) : filteredRules.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl border-gray-100 dark:border-white/5 text-gray-400">
                                <Layout size={40} className="mb-2 opacity-20" />
                                <p className="text-sm">No rules match your search.</p>
                            </div>
                        ) : (
                            filteredRules.map(rule => (
                                <div
                                    key={rule.id}
                                    onClick={() => setEditingRule(rule)}
                                    className={`group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${editingRule?.id === rule.id ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-500/10 shadow-md' : 'bg-white dark:bg-black border-gray-100 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-xl'}`}
                                >
                                    {!rule.status && (
                                        <div className="absolute top-0 right-0 px-3 py-1 bg-red-500/10 text-red-500 text-[9px] font-extrabold uppercase rounded-bl-xl tracking-widest">
                                            Paused
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="max-w-[80%]">
                                            <h3 className="font-bold text-sm truncate group-hover:text-primary-500 transition-colors uppercase tracking-tight">{rule.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono text-gray-400">PRIORITY {rule.priority}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleToggleStatus(rule, e)}
                                                className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 ${rule.status ? 'text-green-500' : 'text-gray-400'}`}
                                                title={rule.status ? "Pause Rule" : "Activate Rule"}
                                            >
                                                <Power size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDuplicate(rule.id!, e)}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-blue-400"
                                                title="Duplicate Rule"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 text-[10px]">
                                        <div className="flex gap-1.5 overflow-hidden max-w-[70%]">
                                            {rule.conditions.conditions.map((_, i) => (
                                                <div key={i} className="w-4 h-1 rounded-full bg-gray-200 dark:bg-white/10"></div>
                                            ))}
                                        </div>
                                        <span className="bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                                            {rule.action.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Editor */}
                <div className="relative flex min-h-[560px] flex-col rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-black lg:col-span-8">
                    {editingRule ? (
                        <div className="flex h-full min-h-0 flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Editor Header */}
                            <div className="p-6 border-b dark:border-white/10 bg-gray-50/50 dark:bg-black flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-3">
                                        {editingRule.id ? 'Refine Logic' : 'New Strategic Rule'}
                                        <span className="text-[10px] bg-primary-500 text-white px-2 py-0.5 rounded-full uppercase font-extrabold tracking-widest">{activeModule}</span>
                                    </h2>
                                </div>
                                <button onClick={() => setEditingRule(null)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 dark:hover:bg-white/5 rounded-full transition-all">&times;</button>
                            </div>

                            {/* Editor Body */}
                            <div className="space-y-6 p-4 sm:p-6 2xl:space-y-8">
                                {/* Configuration Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                            <Info size={12} /> Rule Label
                                        </label>
                                        <input
                                            value={editingRule.name}
                                            onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm shadow-inner text-gray-900 dark:text-gray-100"
                                            placeholder="e.g., HIGH PRIORITY URGENT CARE"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                            Priority
                                        </label>
                                        <input
                                            type="number"
                                            value={editingRule.priority}
                                            onChange={e => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-gray-100 outline-none font-mono text-sm shadow-inner"
                                        />
                                    </div>
                                </div>

                                {/* Conditions Builder */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b pb-3 dark:border-white/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                                <Filter className="text-orange-500" size={16} />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-sm uppercase tracking-widest text-gray-600 dark:text-gray-300">Conditions</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">If these requirements match...</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={addCondition}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-primary-500 hover:text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-1.5"
                                        >
                                            <Plus size={12} /> Add Condition
                                        </button>
                                    </div>

                                    <div className="space-y-3 rounded-[2rem] border-2 border-dashed border-gray-100 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-black sm:p-6">
                                        {editingRule.conditions.conditions.map((c, i) => (
                                            <ConditionRow
                                                key={i}
                                                index={i}
                                                condition={c}
                                                onUpdate={updateCondition}
                                                onRemove={removeCondition}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Action Panel */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-3 dark:border-white/10">
                                        <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                                            <Play className="text-green-500" size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-sm uppercase tracking-widest text-gray-600 dark:text-gray-300">Action Output</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Then perform the following...</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 rounded-[2rem] border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm transition-all dark:from-black dark:to-black dark:border-white/10 sm:flex-row sm:p-6">
                                        <div className="flex-grow space-y-2">
                                            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Task Action</label>
                                            <select
                                                value={editingRule.action}
                                                onChange={e => setEditingRule({ ...editingRule, action: e.target.value })}
                                                className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                {ACTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-grow space-y-2">
                                            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Value Payload</label>
                                            <input
                                                value={editingRule.actionValue}
                                                onChange={e => setEditingRule({ ...editingRule, actionValue: e.target.value })}
                                                className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-gray-100 outline-none font-mono text-sm focus:ring-2 focus:ring-primary-500"
                                                placeholder="e.g., 30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Live Human-Readable Preview */}
                                <div className="group relative overflow-hidden rounded-[2rem] bg-primary-500 p-5 text-white shadow-2xl sm:p-8 sm:rounded-[2.5rem]">
                                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                        <FileJson size={120} />
                                    </div>
                                    <h4 className="text-[11px] font-extrabold uppercase tracking-[0.2em] opacity-60 mb-4 flex items-center gap-2">
                                        <Layout size={14} /> Intelligence Overview
                                    </h4>
                                    <div className="space-y-4 relative">
                                        <div className="text-lg leading-relaxed font-bold">
                                            IF <span className="text-white/70 italic">{editingRule.conditions.logic}</span>
                                            <div className="mt-2 space-y-1">
                                                {editingRule.conditions.conditions.map((c, i) => (
                                                    <div key={i} className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl text-sm w-fit border border-white/10">
                                                        <span className="text-primary-100">{FIELD_OPTIONS.find(f => f.value === c.field)?.label}</span>
                                                        <span className="text-primary-300 font-mono text-[10px]">{c.operator}</span>
                                                        <span className="text-yellow-300">"{c.value || '...'}"</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                                                <span className="text-white/40 uppercase text-xs tracking-widest flex-shrink-0">Then Execute</span>
                                                <div className="bg-white text-primary-600 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl transform group-hover:-translate-y-1 transition-transform">
                                                    <Zap size={18} />
                                                    <span className="uppercase text-xs font-extrabold tracking-widest">{ACTIONS.find(a => a.value === editingRule.action)?.label}</span>
                                                    <div className="w-1 h-4 bg-primary-200 rounded-full"></div>
                                                    <span className="font-mono">{editingRule.actionValue}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Editor Footer */}
                            <div className="flex flex-col items-center justify-between gap-4 border-t bg-gray-50/50 p-4 dark:border-white/10 dark:bg-black sm:flex-row sm:p-6 2xl:p-8">
                                <button
                                    onClick={() => setShowTestModal(true)}
                                    className="w-full sm:w-auto px-6 py-3 border dark:border-white/10 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center gap-2 font-extrabold text-xs uppercase tracking-widest transition-all"
                                >
                                    <Play size={16} className="text-blue-500" />
                                    Debug Logic
                                </button>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <button
                                        onClick={() => setEditingRule(null)}
                                        className="flex-1 sm:flex-initial px-6 py-3 text-gray-400 hover:text-gray-600 font-extrabold text-xs uppercase tracking-widest"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || !editingRule.name}
                                        className="flex-[2] sm:flex-initial bg-primary-600 hover:bg-primary-500 text-white px-12 py-3 rounded-2xl font-extrabold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        <Save size={18} />
                                        Commit Rule
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400 space-y-6">
                            <div className="relative">
                                <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                    <ChevronRight size={48} className="text-gray-200 dark:text-white/10" />
                                </div>
                                <Zap className="absolute -bottom-2 -right-2 text-primary-500" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight uppercase tracking-widest">Awaiting Selection</h3>
                                <p className="max-w-xs mx-auto text-sm font-medium text-gray-500 mt-2">Select a strategic rule from the panel to manage or innovate new business automation.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Test Logic Modal */}
            {showTestModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
                    <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[3rem] border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-white/10 dark:bg-black">
                        <div className="flex shrink-0 items-center justify-between border-b bg-gray-50 p-8 dark:border-white/10 dark:bg-black">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Play size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold tracking-tight">Debug Automation Logic</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verify rule against sample event payload</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowTestModal(false); setTestResult(null); }} className="p-2 hover:bg-gray-200 dark:hover:bg-white/5 rounded-full transition-all">&times;</button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-8">
                            <div className="space-y-3">
                                <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileJson size={14} /> Sample Request Payload (JSON)
                                </label>
                                <textarea
                                    value={testInput}
                                    onChange={e => setTestInput(e.target.value)}
                                    className="w-full h-48 p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 rounded-3xl border border-gray-100 dark:border-white/10 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner"
                                />
                            </div>

                            {testResult !== null && (
                                <div className={`p-6 rounded-3xl border flex items-center gap-4 animate-in slide-in-from-bottom-4 ${testResult.triggered ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                    <div className={`p-3 rounded-2xl ${testResult.triggered ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {testResult.triggered ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-extrabold uppercase tracking-tight">{testResult.triggered ? 'Rule Triggered!' : 'Conditions Not Met'}</h4>
                                        <p className="text-sm opacity-80 font-medium">{testResult.triggered ? 'The system would execute the defined action for this input.' : 'The criteria did not match the provided payload.'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 p-8 bg-gray-50 dark:bg-black border-t dark:border-white/10 flex justify-end gap-4">
                            <button
                                onClick={() => { setShowTestModal(false); setTestResult(null); }}
                                className="px-6 py-3 text-gray-400 hover:text-gray-600 font-extrabold text-[10px] uppercase tracking-widest"
                            >
                                Close
                            </button>
                            <button
                                onClick={runTest}
                                disabled={isTesting}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-2xl font-extrabold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
                            >
                                {isTesting ? 'Evaluating...' : 'Run Simulation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(155, 155, 155, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(155, 155, 155, 0.4);
                }
            `}</style>
        </div>
    );
};
