import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { PageLoader } from "./components/ui/LoadingSpinner";
import { LoginPage } from "./pages/LoginPage";
import { POSPage } from "./pages/POSPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { SalesPage } from "./pages/SalesPage";
import { CustomersPage } from "./pages/CustomersPage";
import { PurchasesPage } from "./pages/PurchasesPage";
import { SuppliersPage } from "./pages/SuppliersPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotAuthorized } from "./pages/NotAuthorized";

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <NotAuthorized />;

  return <>{children}</>;
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === "admin" ? "/" : "/pos"} replace /> : <LoginPage />}
      />
      <Route path="/pos" element={<ProtectedRoute><POSPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute adminOnly><DashboardPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute adminOnly><ProductsPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute adminOnly><InventoryPage /></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/purchases" element={<ProtectedRoute adminOnly><PurchasesPage /></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute adminOnly><SuppliersPage /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute adminOnly><ExpensesPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? (user.role === "admin" ? "/" : "/pos") : "/login"} replace />} />
    </Routes>
  );
}
