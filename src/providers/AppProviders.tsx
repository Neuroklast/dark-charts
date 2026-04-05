import React from 'react';
import { DataProvider } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <DataProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </DataProvider>
    </AuthProvider>
  );
};
