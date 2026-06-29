'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { VoteConfirmationView } from '@/components/VoteConfirmationView';

export default function VotingConfirmationPage() {
  return (
    <ErrorBoundary level="component">
      <VoteConfirmationView linkMode />
    </ErrorBoundary>
  );
}