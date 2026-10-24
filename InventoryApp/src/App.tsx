import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './features/auth/pages/Login';
import InventoryLayout from './layouts/InventoryLayout';
import DashboardPage from './pages/DashboardPage';
import ProductMasterPage from './features/inventory/pages/ProductMasterPage';
import StockBatchesPage from './features/inventory/pages/StockBatchesPage';
import PurchaseOrdersPage from './features/inventory/pages/PurchaseOrdersPage';
import StockIssuePage from './features/inventory/pages/StockIssuePage';
import VendorDirectoryPage from './features/inventory/pages/VendorDirectoryPage';
import LowStockAlertsPage from './features/inventory/pages/LowStockAlertsPage';
import ExpiryAlertsPage from './features/inventory/pages/ExpiryAlertsPage';
import StockMovementsPage from './features/inventory/pages/StockMovementsPage';
import StockValuationAnalyticsPage from './features/inventory/pages/StockValuationAnalyticsPage';
import PhysicalStockAuditPage from './features/inventory/pages/PhysicalStockAuditPage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';
import { LoadingState } from './components/ui';
import {
  Package,
  Layers,
  ShoppingCart,
  Send,
  AlertTriangle,
  History,
  Users,
} from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <LoadingState message="Restoring Inventory session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <LoadingState message="Loading InventoryApp..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Application Workspace */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <InventoryLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="products" element={<ProductMasterPage />} />

          <Route path="stock" element={<StockBatchesPage />} />

          <Route path="purchases" element={<PurchaseOrdersPage />} />
          <Route path="issues" element={<StockIssuePage />} />

          <Route path="low-stock" element={<LowStockAlertsPage />} />
          <Route path="expiry-alerts" element={<ExpiryAlertsPage />} />

          <Route path="movements" element={<StockMovementsPage />} />

          <Route path="analytics" element={<StockValuationAnalyticsPage />} />
          <Route path="audit" element={<PhysicalStockAuditPage />} />

          <Route path="vendors" element={<VendorDirectoryPage />} />
        </Route>

        {/* Shorthand Redirects */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/products" element={<Navigate to="/app/products" replace />} />
        <Route path="/stock" element={<Navigate to="/app/stock" replace />} />
        <Route path="/purchases" element={<Navigate to="/app/purchases" replace />} />
        <Route path="/issues" element={<Navigate to="/app/issues" replace />} />
        <Route path="/low-stock" element={<Navigate to="/app/low-stock" replace />} />
        <Route path="/expiry-alerts" element={<Navigate to="/app/expiry-alerts" replace />} />
        <Route path="/alerts" element={<Navigate to="/app/low-stock" replace />} />
        <Route path="/movements" element={<Navigate to="/app/movements" replace />} />
        <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
        <Route path="/reports" element={<Navigate to="/app/analytics" replace />} />
        <Route path="/audit" element={<Navigate to="/app/audit" replace />} />
        <Route path="/vendors" element={<Navigate to="/app/vendors" replace />} />

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
