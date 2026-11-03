import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import InvestmentsPage from '../pages/InvestmentsPage';
import InvestmentDetailsPage from '../pages/InvestmentDetailsPage';
import RoiHistoryPage from '../pages/RoiHistoryPage';
import ReferralDashboardPage from '../pages/ReferralDashboardPage';
import ReferralTreePage from '../pages/ReferralTreePage';
import WalletPage from '../pages/WalletPage';
import TransactionsPage from '../pages/TransactionsPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/investments"
        element={
          <ProtectedRoute>
            <AppLayout>
              <InvestmentsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/investments/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <InvestmentDetailsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roi-history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RoiHistoryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReferralDashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals/tree"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReferralTreePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <AppLayout>
              <WalletPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TransactionsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <AdminDashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
