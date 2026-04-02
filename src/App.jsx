import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "./Context/AuthContext";
import { useLanguage } from "./Context/LanguageContext";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

// Auth
import Login from "./pages/Login";

// Client pages
import AccountsPage from "./pages/client/AccountsPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

import SubscriptionsAdmin from "./pages/admin/SubscriptionsAdmin";
import UserSubscriptionDetail from "./pages/admin/UserSubscriptionDetail";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import ExpiringAccounts from "./pages/admin/ExpiringAccounts";

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

function App() {
  return (
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
        <Route path="settings" element={<SettingsAdmin />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
