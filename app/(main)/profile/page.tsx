'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProfileView } from '@/components/ProfileView';

export default function ProfilePage() {
  return (
    <ErrorBoundary level="component">
      <ProfileView />
    </ErrorBoundary>
  );
}