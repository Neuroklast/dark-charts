import { ROUTES } from '@/lib/routes';

const ADMIN_ROLES = new Set(['ADMIN', 'admin', 'editor']);

export function resolveRedirectPath(role?: string | null, returnTo?: string | null): string {
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }

  if (role && ADMIN_ROLES.has(role)) {
    return ROUTES.admin;
  }

  return ROUTES.home;
}