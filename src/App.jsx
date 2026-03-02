import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "./Context/AuthContext";
import { useLanguage } from "./Context/LanguageContext";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

// Auth
import Login from "./pages/Login";

// Client pages
import EmulatorsPage from "./pages/client/EmulatorsPage";
import EmulatorDetail from "./pages/client/EmulatorDetail";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmulatorsAdmin from "./pages/admin/EmulatorsAdmin";
import SubscriptionsAdmin from "./pages/admin/SubscriptionsAdmin";
import UserSubscriptionDetail from "./pages/admin/UserSubscriptionDetail";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import ExpiringEmulators from "./pages/admin/ExpiringEmulators";

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
        <Route index element={<Navigate to="/emulators" replace />} />
        <Route path="emulators" element={<EmulatorsPage />} />
        <Route path="emulators/:id" element={<EmulatorDetail />} />
        <Route path="*" element={<Navigate to="/emulators" replace />} />
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
        <Route path="emulators" element={<EmulatorsAdmin />} />
        <Route path="subscriptions" element={<SubscriptionsAdmin />} />
        <Route path="subscriptions/:userId" element={<UserSubscriptionDetail />} />
        <Route path="expiring-emulators" element={<ExpiringEmulators />} />
        <Route path="settings" element={<SettingsAdmin />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
