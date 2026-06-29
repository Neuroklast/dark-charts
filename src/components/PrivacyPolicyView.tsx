'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getPrivacyContent } from '@/lib/legal-content';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export function PrivacyPolicyView() {
  const { language } = useLanguage();
  return (
    <LegalPageLayout
      content={getPrivacyContent(language)}
      showOperatorAddress
    />
  );
}