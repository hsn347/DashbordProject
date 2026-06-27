import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "./Context/AuthContext";
import { useLanguage } from "./Context/LanguageContext";

import { Suspense, lazy } from "react";

// Layouts (keep static for faster shell rendering)
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

// Auth
import Login from "./pages/Login";

// Lazy-loaded Client pages
const AccountsPage = lazy(() => import("./pages/client/AccountsPage"));

// Lazy-loaded Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const SubscriptionsAdmin = lazy(() => import("./pages/admin/SubscriptionsAdmin"));
const UserSubscriptionDetail = lazy(() => import("./pages/admin/UserSubscriptionDetail"));
const SettingsAdmin = lazy(() => import("./pages/admin/SettingsAdmin"));
const ExpiringAccounts = lazy(() => import("./pages/admin/ExpiringAccounts"));
const DomainsStats = lazy(() => import("./pages/admin/DomainsStats"));

function ProtectedRoute({ children, adminRequired = false }) {
  const { user, isAdmin, isLoading } = useAuthContext();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        <p style={{ color: 'var(--text-muted)' }}>{t("loading")}</p>
      </div>
    );
  }

  if (adminRequired) {
    if (!isAdmin) return <Navigate to="/login" replace />;
    return children;
  }

  if (!user && !isAdmin) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function PageLoader() {
  const { t } = useLanguage();
  return (
    <div className="page-loader">
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <p style={{ color: 'var(--text-muted)' }}>{t("loading")}</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Client Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/accounts" replace />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="*" element={<Navigate to="/accounts" replace />} />
        </Route>

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminRequired>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="subscriptions" element={<SubscriptionsAdmin />} />
          <Route path="subscriptions/:userId" element={<UserSubscriptionDetail />} />
          <Route path="expiring-accounts" element={<ExpiringAccounts />} />
          <Route path="domains-stats" element={<DomainsStats />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
