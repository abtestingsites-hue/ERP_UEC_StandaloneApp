import React from 'react';
import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '../components/ui';
import { useAuthStore } from '../store/useAuthStore';
import { Boxes, ShieldCheck, CheckCircle2, ArrowRight, Layers, Package, ShoppingCart, Send, AlertTriangle, History, TrendingUp, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, activeUnitId, units } = useAuthStore();

  const activeUnit = units.find((u) => u.id === activeUnitId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Command Center"
        description="Unified operations overview, quick access, and logistics telemetry for Elder Care ERP."
        badge={<Badge variant="success">Phase C Active</Badge>}
      />

      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-800/40 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Standalone Application Shell Verified</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Welcome back, {user?.name || 'Administrator'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              InventoryApp is securely operating in standalone mode. All incoming mutations are scoped to the active tenant and unit context.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shrink-0 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-500">Active Tenant:</span>
              <span className="font-mono text-emerald-400 font-semibold">{user?.tenantId?.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-500">Operating Unit:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {activeUnit ? `${activeUnit.name} (${activeUnit.code})` : activeUnitId || 'All Units (Facility-wide)'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-500">Security Mode:</span>
              <span className="font-mono text-emerald-400 font-semibold">JWT Bearer + x-unit-id</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Quick Links */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Inventory Workspace Modules (Feature Migration Foundation)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/app/products">
            <Card className="hover:border-slate-700 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <Badge variant="outline">Catalog</Badge>
                </div>
                <CardTitle className="text-sm mt-3">Product Master</CardTitle>
                <CardDescription>Product catalog, SKU / code uniqueness, category taxonomy.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/stock">
            <Card className="hover:border-slate-700 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-teal-600/15 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <Badge variant="outline">Ledger</Badge>
                </div>
                <CardTitle className="text-sm mt-3">Stock & Batches</CardTitle>
                <CardDescription>Real-time unit balances, FEFO batch allocations, expiry dates.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/purchases">
            <Card className="hover:border-slate-700 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <Badge variant="outline">Procurement</Badge>
                </div>
                <CardTitle className="text-sm mt-3">Purchase Orders</CardTitle>
                <CardDescription>Vendor Master procurement records, unit costs, stock additions.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/issues">
            <Card className="hover:border-slate-700 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Send className="w-5 h-5" />
                  </div>
                  <Badge variant="outline">Requisitions</Badge>
                </div>
                <CardTitle className="text-sm mt-3">Issue Requests</CardTitle>
                <CardDescription>Department consumption and automated Patient Daily Cost ledger posting.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/low-stock">
            <Card className="hover:border-slate-700 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <Badge variant="warning">Alerts</Badge>
                </div>
                <CardTitle className="text-sm mt-3">Low Stock Alerts</CardTitle>
                <CardDescription>Dynamic minStockLevel thresholds and critical shortage warnings.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/movements">
            <Card className="hover:border-slate-700 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-600/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <History className="w-5 h-5" />
                  </div>
                  <Badge variant="info">Audit</Badge>
                </div>
                <CardTitle className="text-sm mt-3">Stock Movements</CardTitle>
                <CardDescription>Audit ledger tracking every debit, credit, and running balanceAfter.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/analytics">
            <Card className="hover:border-slate-700 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <Badge variant="outline">Analytics</Badge>
                </div>
                <CardTitle className="text-sm mt-3">Valuation & Analytics</CardTitle>
                <CardDescription>Verified inventory valuation amounts and consumption trends.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/audit">
            <Card className="hover:border-slate-700 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <Badge variant="outline">Reconciliation</Badge>
                </div>
                <CardTitle className="text-sm mt-3">Physical Stock Audit</CardTitle>
                <CardDescription>Controlled physical counting, variance analysis, and live ledger reconciliation.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
