import { useState, useEffect } from 'react';
import {
    Activity, CheckCircle2, XCircle, Zap, ShieldCheck,
    Clock, Cpu, ChevronRight, BarChart3, AlertCircle
} from 'lucide-react';
import { api } from '../../../lib/axios';

interface TraceRule {
    name: string;
    matched: boolean;
    action?: string;
    scoreContribution?: number;
}

interface TraceData {
    rules: TraceRule[];
    finalScore: number;
    label: string;
    actions: string[];
    timestamps: {
        started: string;
        completed: string;
    };
}

export const ExecutionTracePanel = ({ entityId }: { entityId: string }) => {
    const [trace, setTrace] = useState<TraceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrace = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/automation/trace/${entityId}`);
                const data = res.data;
                setTrace(data.data);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (entityId) fetchTrace();
    }, [entityId]);

    if (loading) return (
        <div className="p-8 flex flex-col items-center justify-center space-y-4 animate-pulse">
            <Cpu className="text-primary-400 animate-spin" size={32} />
            <p className="text-gray-400 font-extrabold text-xs uppercase tracking-widest">Reconstructing Logic Trace...</p>
        </div>
    );

    if (error || !trace || !trace.rules?.length) return (
        <div className="p-12 text-center space-y-4">
            <div className="bg-gray-50 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <AlertCircle size={32} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No Intelligence Trace Detected</h3>
                <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">Either this interaction hasn't been processed by the automation engine yet, or it predates the explainability layer.</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Score Card */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                    <Zap size={100} />
                </div>
                <div className="relative flex justify-between items-end">
                    <div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-[0.25em] opacity-60 mb-2">Final Automation Score</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-extrabold">{trace.finalScore}</span>
                            <span className="text-xl font-bold opacity-80 uppercase tracking-widest">{trace.label}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-md flex items-center gap-2 border border-white/20">
                            <ShieldCheck size={18} />
                            <span className="text-xs font-extrabold uppercase tracking-widest">Verified Logic</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rule Evaluation Breakdown */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 border-b dark:border-white/10 pb-3 ml-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <BarChart3 className="text-orange-500" size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-600 dark:text-gray-300">Rule Evaluation Matrix</h3>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Audit of conditional logic matches</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {trace.rules.map((rule, i) => (
                        <div
                            key={i}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${rule.matched ? 'bg-green-500/5 border-green-500/20' : 'bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-60'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rule.matched ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-gray-200 dark:bg-white/10 text-gray-400'}`}>
                                    {rule.matched ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                </div>
                                <div>
                                    <h5 className="text-sm font-extrabold uppercase tracking-tight text-gray-800 dark:text-gray-200">{rule.name}</h5>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Action: {rule.action?.replace('_', ' ')}</p>
                                </div>
                            </div>
                            {rule.scoreContribution !== 0 && (
                                <div className={`text-sm font-mono font-extrabold ${rule.scoreContribution! > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {rule.scoreContribution! > 0 ? `+${rule.scoreContribution}` : rule.scoreContribution}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Execution Meta */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border dark:border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-gray-400" size={14} />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Time to Decision</span>
                    </div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {Math.max(0, new Date(trace.timestamps.completed).getTime() - new Date(trace.timestamps.started).getTime())}ms
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border dark:border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-gray-400" size={14} />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Decision Point</span>
                    </div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {new Date(trace.timestamps.completed).toLocaleTimeString()}
                    </p>
                </div>
            </div>

            {/* Actions Triggered */}
            <div className="p-6 bg-[#0F0F0F] rounded-[2rem] text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-all duration-1000">
                    <Activity size={100} />
                </div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary-500 mb-4 flex items-center gap-2">
                    <Zap size={14} /> Autonomous Actions Issued
                </h4>
                <div className="space-y-2">
                    {trace.actions && trace.actions.length > 0 ? trace.actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-bold text-gray-300">
                            <ChevronRight className="text-primary-500" size={14} />
                            {action}
                        </div>
                    )) : (
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest italic">No external actions required</p>
                    )}
                </div>
            </div>
        </div>
    );
};
