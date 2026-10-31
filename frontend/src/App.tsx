import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell, PublicShell } from './components/layout';
import { useAuth, roleLabel } from './lib/auth';
import { ErrorState, LoadingState } from './components/ui';
import { LoginPage, RegisterPage } from './pages/auth';
import { CatalogPage, BookDetailPage } from './pages/catalog';
import { ReaderDashboard, MyBorrowsPage, ReaderFinesPage, FinesPage } from './pages/reader';
import {
  OperationsDashboard,
  ManageBooks,
  ManageCategories,
  CheckoutPage,
  ReturnPage,
  ReportsPage,
  AuditLogsPage,
} from './pages/operations';
import { ProfilePage, CopiesPage } from './pages/profile';
function Protected({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <LoadingState label="Đang xác thực phiên làm việc" />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role))
    return (
      <section className="page">
        <ErrorState
          message={`Tài khoản ${roleLabel(user.role)} không có quyền truy cập khu vực này.`}
          retry={() => history.back()}
        />
      </section>
    );
  return <>{children}</>;
}
function Home() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'READER' ? '/reader/dashboard' : '/operations'} replace />;
}
export default function App() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
      </Route>
      <Route
        element={
          <Protected roles={['READER']}>
            <AppShell />
          </Protected>
        }
      >
        <Route path="/reader/dashboard" element={<ReaderDashboard />} />
        <Route path="/reader/my-borrows" element={<MyBorrowsPage />} />
        <Route path="/reader/fines" element={<ReaderFinesPage />} />
      </Route>
      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route
        element={
          <Protected roles={['LIBRARIAN', 'ADMIN']}>
            <AppShell />
          </Protected>
        }
      >
        <Route path="/operations" element={<OperationsDashboard />} />
        <Route path="/manage/books" element={<ManageBooks />} />
        <Route path="/manage/books/:id/copies" element={<CopiesPage />} />
        <Route path="/manage/categories" element={<ManageCategories />} />
        <Route path="/desk/checkout" element={<CheckoutPage />} />
        <Route path="/desk/return" element={<ReturnPage />} />
        <Route path="/manage/fines" element={<FinesPage reader={false} />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
      <Route
        element={
          <Protected roles={['ADMIN']}>
            <AppShell />
          </Protected>
        }
      >
        <Route path="/audit-logs" element={<AuditLogsPage />} />
      </Route>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
