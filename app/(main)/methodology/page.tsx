import type { Metadata } from 'next';
import { MethodologyView } from '@/components/MethodologyView';

export const metadata: Metadata = {
  title: 'Chart-Methodik | Dark Charts',
  description: 'Transparente Dokumentation der Dark-Charts-Berechnung: Fan-, Expert- und Streaming-Säulen.',
};

export default function MethodologyPage() {
  return <MethodologyView />;
}