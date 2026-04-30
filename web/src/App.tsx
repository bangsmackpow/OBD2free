import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {AuthProvider, useAuth} from "./hooks/use-auth";
import {Spinner} from "./components/ui/spinner";
import RootLayout from "./layouts/RootLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import SessionsPage from "./pages/sessions/SessionsPage";
import SessionDetailPage from "./pages/sessions/SessionDetailPage";
import AdminPage from "./pages/admin/AdminPage";
import SettingsPage from "./pages/settings/SettingsPage";
import DocsPage from "./pages/docs/DocsPage";
import DocViewPage from "./pages/docs/DocViewPage";

const queryClient = new QueryClient({
  defaultOptions: {queries: {retry: 1, staleTime: 30000}},
});

function ProtectedRoute({children}: {children: React.ReactNode}) {
  const {user, loading} = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="h-8 w-8" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({children}: {children: React.ReactNode}) {
  const {user, loading} = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="h-8 w-8" /></div>;
  if (!user || user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/docs/:slug/*" element={<DocViewPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <RootLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/sessions/:id" element={<SessionDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
