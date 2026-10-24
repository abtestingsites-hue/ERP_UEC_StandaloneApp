import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/card';
import { ShieldAlert, Users, TrendingUp, Handshake } from 'lucide-react';

export const EnterpriseIntelligence = () => {
    // Breadcrumbs matching the PageHeader interface
    const breadcrumbs = [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Automation", href: "/automation/dashboard" },
        { label: "Enterprise Intelligence" }
    ];

    return (
        <div className="p-6 space-y-6 dark:bg-black min-h-full">
            <PageHeader
                title="Enterprise Intelligence Platform"
                breadcrumbs={breadcrumbs}
            />

            {/* Global Intelligence Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ModuleStatusCard
                    title="Lead Intelligence"
                    value="HOT"
                    desc="32 Strong leads"
                    icon={<Handshake className="text-orange-500" />}
                />
                <ModuleStatusCard
                    title="Finance Anomaly"
                    value="SECURE"
                    desc="0 Anomalies detected"
                    icon={<ShieldAlert className="text-green-500" />}
                />
                <ModuleStatusCard
                    title="HR Attrition"
                    value="LOW"
                    desc="Stable workforce"
                    icon={<Users className="text-blue-500" />}
                />
                <ModuleStatusCard
                    title="System Insights"
                    value="STABLE"
                    desc="AI Agents operational"
                    icon={<TrendingUp className="text-purple-500" />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Copilot Insights Panel */}
                <Card className="p-6 bg-slate-900 dark:bg-black text-white border-none dark:border dark:border-white/10 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-bold">AI Copilot Insights</h3>
                    </div>
                    <div className="space-y-4 font-mono text-sm text-slate-300 dark:text-gray-400">
                        <p className="text-slate-500 dark:text-gray-500">&gt; ANALYZING ENTERPRISE DATA...</p>
                        <p className="text-cyan-400 dark:text-cyan-300 italic">"Finance module shows high security. However, Lead scores for 'In-House Care' are 15% above target. Suggest increasing marketing budget for this segment."</p>
                        <p className="text-slate-500 dark:text-gray-500">&gt; HR RISK: LOW (98% stability)</p>
                        <p className="text-slate-500 dark:text-gray-500">&gt; LATEST AGENT ACTION: ESCALATE_SALES (Entity: LEAD-4012)</p>
                    </div>
                </Card>

                {/* Agent Activity Feed */}
                <Card className="p-6 dark:bg-black dark:border-white/10">
                    <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Autonomous Agent Log</h3>
                    <div className="space-y-4">
                        <AgentLogItem
                            agent="LeadAgent"
                            action="Escalated to Sales"
                            entity="Enquiry #PH2-9102"
                            time="2m ago"
                        />
                        <AgentLogItem
                            agent="FinanceAgent"
                            action="Secure - Cleared"
                            entity="Payment #TX-482"
                            time="15m ago"
                        />
                        <AgentLogItem
                            agent="HRAgent"
                            action="Risk Profile: STABLE"
                            entity="Staff #EMP-001"
                            time="1h ago"
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
};

const ModuleStatusCard = ({ title, value, desc, icon }: any) => (
    <Card className="p-4 flex flex-col gap-2 border-t-4 border-t-orange-400 dark:bg-black dark:border-x-white/10 dark:border-b-white/10 shadow-sm">
        <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{title}</span>
            {icon}
        </div>
        <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{value}</div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{desc}</div>
    </Card>
);

const AgentLogItem = ({ agent, action, entity, time }: any) => (
    <div className="flex justify-between items-center text-sm border-b dark:border-white/10 pb-2">
        <div>
            <span className="font-bold text-slate-700 dark:text-gray-300">{agent}</span>
            <span className="text-gray-500 mx-2">→</span>
            <span className="text-gray-600 dark:text-gray-400 italic">{action}</span>
        </div>
        <div className="text-right">
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{entity}</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500">{time}</div>
        </div>
    </div>
);
