import type { Metadata } from 'next';
import { PrivacyPolicyView } from '@/components/PrivacyPolicyView';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | Dark Charts',
  description: 'Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.',
};

export default function PrivacyPage() {
  return <PrivacyPolicyView />;
}