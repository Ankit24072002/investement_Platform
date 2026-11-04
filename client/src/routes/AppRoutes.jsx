import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const InvestmentsPage = lazy(() => import('../pages/InvestmentsPage'));
const InvestmentDetailsPage = lazy(() => import('../pages/InvestmentDetailsPage'));
const RoiHistoryPage = lazy(() => import('../pages/RoiHistoryPage'));
const ReferralDashboardPage = lazy(() => import('../pages/ReferralDashboardPage'));
const ReferralTreePage = lazy(() => import('../pages/ReferralTreePage'));
const WalletPage = lazy(() => import('../pages/WalletPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));

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
    <Suspense fallback={<div className="m-6 h-48 animate-pulse rounded-3xl border border-white/5 bg-slate-900/60" aria-label="Loading page" />}>
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
    </Suspense>
  );
}
