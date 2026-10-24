import { TrendingUp, Users, Target, Zap, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/card';
import { useAutomationStats } from '../hooks/useAutomation';


export const AutomationDashboard = () => {
    const { data: stats, isLoading } = useAutomationStats();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const reportStats = stats || {
        distribution: { hot: 0, warm: 0, cold: 0 },
        topRules: [],
        overallConversionRate: 0,
        totalTriggers: 0
    };

    return (
        <div className="p-6 space-y-6 dark:bg-black min-h-full">
            <PageHeader
                title="Automation Intelligence Dashboard"
                subtitle="Data-driven lead scoring and rule performance analytics"
            />

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    title="HOT Leads"
                    value={`${reportStats.distribution.hot}%`}
                    icon={<Zap className="text-orange-500" />}
                    trend="Based on Score"
                />
                <MetricCard
                    title="Overall Conversion"
                    value={`${reportStats.overallConversionRate}%`}
                    icon={<Target className="text-green-500" />}
                    trend="Global Average"
                />
                <MetricCard
                    title="Total Triggers"
                    value={reportStats.totalTriggers.toString()}
                    icon={<Users className="text-blue-500" />}
                    trend="Lifetime Activity"
                />
                <MetricCard
                    title="Avg. Quality"
                    value="GOOD"
                    icon={<TrendingUp className="text-purple-500" />}
                    trend="Self-improving"
                />
            </div>

            {/* Rule Performance Table */}
            <Card className="p-6 dark:bg-black dark:border-white/10">
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Top Performing Rules</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-white/10">
                                <th className="pb-3 px-2 text-gray-800 dark:text-gray-200">Rule Name</th>
                                <th className="pb-3 px-2 text-center text-gray-800 dark:text-gray-200">Triggers</th>
                                <th className="pb-3 px-2 text-center text-gray-800 dark:text-gray-200">Conv. Rate</th>
                                <th className="pb-3 px-2 text-right text-gray-800 dark:text-gray-200">Adaptive Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportStats.topRules.map((rule: any, i: number) => (
                                <tr key={i} className="border-b dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-2 font-medium text-gray-900 dark:text-gray-100 leading-none">{rule.name}</td>
                                    <td className="py-4 px-2 text-center text-gray-600 dark:text-gray-400">{rule.triggers}</td>
                                    <td className="py-4 px-2 text-center">
                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full text-[11px] font-bold">
                                            {rule.conversion}
                                        </span>
                                    </td>
                                    <td className="py-4 px-2 text-right text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        ADAPTIVE WEIGHTING
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
}

const MetricCard = ({ title, value, icon, trend }: MetricCardProps) => (
    <Card className="p-4 flex flex-col gap-2 shadow-sm border-l-4 border-l-orange-400 dark:bg-black dark:border-y-white/10 dark:border-r-white/10">
        <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
            {icon}
        </div>
        <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{value}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{trend}</div>
    </Card>
);
