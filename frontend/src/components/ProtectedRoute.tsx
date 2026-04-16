import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Wraps any route that requires authentication.
// While the session check is in-flight (isLoading), renders nothing to avoid flash of login page.
// Once resolved: redirect to /login if not authenticated, otherwise render children.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
