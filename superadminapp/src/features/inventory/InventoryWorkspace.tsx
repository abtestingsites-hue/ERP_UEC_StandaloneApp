import { useSearchParams } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Boxes,
    TrendingUp,
    Clock,
    ClipboardCheck,
    History,
    Building2,
    Send,
    Users,
    ShoppingCart
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useActiveUnit } from '../../context/useActiveUnit';
import { useInventoryDomain } from '../../context/useInventoryDomain';
import { DomainSwitcher } from '../../components/DomainSwitcher';
import { InventoryOverviewTab } from './tabs/InventoryOverviewTab';
import { ProductMasterTab } from './tabs/ProductMasterTab';
import { StockBatchesTab } from './tabs/StockBatchesTab';
import { StockValuationTab } from './tabs/StockValuationTab';
import { ConsumptionAnalyticsTab } from './tabs/ConsumptionAnalyticsTab';
import { PhysicalAuditsTab } from './tabs/PhysicalAuditsTab';
import { StockMovementsTab } from './tabs/StockMovementsTab';
import { StockIssueRequestsTab } from './tabs/StockIssueRequestsTab';
import { VendorDirectoryTab } from './tabs/VendorDirectoryTab';
import { PurchasesProcurementTab } from './tabs/PurchasesProcurementTab';

export function InventoryWorkspace() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const { activeUnitName, hasExplicitAllUnits, activeUnitId } = useActiveUnit();
    const { domainConfig } = useInventoryDomain();

    const handleTabChange = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    const tabs = [
        { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
        { id: 'products', label: 'Product Master', icon: Package },
        { id: 'stock', label: 'Stock & Batches', icon: Boxes },
        { id: 'issues', label: 'Issue Requests', icon: Send },
        { id: 'vendors', label: 'Vendor Directory', icon: Users },
        { id: 'purchases', label: 'Purchases & Procurement', icon: ShoppingCart },
        { id: 'valuation', label: 'Stock Valuation', icon: TrendingUp },
        { id: 'consumption', label: 'Consumption', icon: Clock },
        { id: 'audits', label: 'Physical Audits', icon: ClipboardCheck },
        { id: 'movements', label: 'Movements Ledger', icon: History }
    ];

    return (
        <div className="inventory-workspace">
            <PageHeader
                eyebrow={`BUSINESS DOMAIN · ${domainConfig.label.toUpperCase()}`}
                title={`${domainConfig.label}`}
                description={`${domainConfig.description} · Unified catalog, multi-unit warehouse stocks, financial valuation, and consumption telemetry.`}
                action={
                    <div className="inv-header-action-group">
                        <DomainSwitcher />
                        <div className="inv-scope-badge" title="Active Operating Scope">
                            <Building2 size={14} />
                            <span>{activeUnitName}</span>
                            {activeUnitId === null && hasExplicitAllUnits && (
                                <span className="inv-badge inv-badge--success" style={{ marginLeft: 6 }}>
                                    Organization Wide
                                </span>
                            )}
                        </div>
                    </div>
                }
            />

            {/* Navigation Tabs */}
            <div className="inv-tabs-nav-bar">
                <nav className="inv-tabs-list" aria-label="Inventory Workspaces">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                className={`inv-tab-btn ${isActive ? 'inv-tab-btn--active' : ''}`}
                                onClick={() => handleTabChange(tab.id)}
                                type="button"
                            >
                                <Icon size={15} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Panels */}
            <div className="inv-tab-body">
                {activeTab === 'overview' && (
                    <InventoryOverviewTab onSelectTab={handleTabChange} />
                )}
                {activeTab === 'products' && (
                    <ProductMasterTab />
                )}
                {activeTab === 'stock' && (
                    <StockBatchesTab />
                )}
                {activeTab === 'issues' && (
                    <StockIssueRequestsTab />
                )}
                {activeTab === 'vendors' && (
                    <VendorDirectoryTab />
                )}
                {activeTab === 'purchases' && (
                    <PurchasesProcurementTab />
                )}
                {activeTab === 'valuation' && (
                    <StockValuationTab />
                )}
                {activeTab === 'consumption' && (
                    <ConsumptionAnalyticsTab />
                )}
                {activeTab === 'audits' && (
                    <PhysicalAuditsTab />
                )}
                {activeTab === 'movements' && (
                    <StockMovementsTab />
                )}
            </div>
        </div>
    );
}

export default InventoryWorkspace;
