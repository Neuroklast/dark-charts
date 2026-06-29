import type { Metadata } from 'next';
import { ImprintView } from '@/components/ImprintView';

export const metadata: Metadata = {
  title: 'Impressum | Dark Charts',
  description: 'Anbieterkennzeichnung gemäß § 5 DDG.',
};

export default function ImprintPage() {
  return <ImprintView />;
}