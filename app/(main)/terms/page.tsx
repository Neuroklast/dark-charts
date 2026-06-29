import type { Metadata } from 'next';
import { TermsOfServiceView } from '@/components/TermsOfServiceView';

export const metadata: Metadata = {
  title: 'AGB | Dark Charts',
  description: 'Allgemeine Geschäftsbedingungen für die Nutzung von Dark Charts.',
};

export default function TermsPage() {
  return <TermsOfServiceView />;
}