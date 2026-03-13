import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '@ibms/types';

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, accessToken, isHydrated } = useAuthStore();
  const location = useLocation();

  if (!isHydrated)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  if (!user || !accessToken) return <Navigate to="/login" state={{ from: location }} replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/feed" replace />;

  return <>{children}</>;
};
