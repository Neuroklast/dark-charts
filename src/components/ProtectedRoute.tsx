import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center">Lade Berechtigungen...</div>;
  }

  if (!user || !user.profile) {
    // If we're not logged in, we shouldn't show the protected route content.
    // As per requirements: "Wenn ein Nutzer mit Rolle 'FAN' versucht, die Route '/admin' oder '/dj-inbox' aufzurufen, muss er sofort auf die Startseite umgeleitet werden."
    // In React SPA without react-router we can just render null or an error message and let the parent component manage the active view. But to properly implement "immediately redirect to home page", we should probably manipulate window.location or if the app uses a custom routing hook, use that.

    // For now, since the main app uses a simple view state, let's just trigger a reload to home or return null.
    setTimeout(() => { window.location.href = '/'; }, 0);
    return null;
  }

  // Assuming user.profile.userType is the role in this system (from earlier types seen, like 'fan')
  const role = user.profile.userType.toUpperCase();

  if (!allowedRoles.includes(role)) {
    setTimeout(() => { window.location.href = '/'; }, 0);
    return null;
  }

  return <>{children}</>;
}
