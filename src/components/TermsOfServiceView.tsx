'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getTermsContent } from '@/lib/legal-content';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export function TermsOfServiceView() {
  const { language } = useLanguage();
  return <LegalPageLayout content={getTermsContent(language)} />;
}