import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

export default function AdminMetricsRedirectPage() {
  redirect(ROUTES.adminAnalytics);
}