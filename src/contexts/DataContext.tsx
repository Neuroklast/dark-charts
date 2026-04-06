import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { IDataService, IAuthService } from '@/types';
import { ComprehensiveDataService } from '@/services/comprehensiveDataService';

// Fallback stub for authService if providedAuthService isn't passed
const dummyAuthService: IAuthService = {
  getCurrentUser: async () => null,
  login: async () => { throw new Error("Real auth is in AuthContext"); },
  logout: async () => {},
  updateProfile: async () => { throw new Error("Real auth is in AuthContext"); }
};

interface DataContextType {
  dataService: IDataService;
  authService: IAuthService;
  error: Error | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
  dataService?: IDataService;
  authService?: IAuthService;
}

export const DataProvider: React.FC<DataProviderProps> = ({ 
  children, 
  dataService: providedDataService,
  authService: providedAuthService
}) => {
  const [dataService] = useState<IDataService>(() => {
    try {
      return providedDataService || new ComprehensiveDataService();
    } catch (error) {
      console.error('Failed to initialize DataService:', error);
      return new ComprehensiveDataService();
    }
  });

  const [authService] = useState<IAuthService>(() => {
    try {
      return providedAuthService || dummyAuthService;
    } catch (error) {
      console.error('Failed to initialize AuthService:', error);
      return dummyAuthService;
    }
  });

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!dataService || !authService) {
      setError(new Error('Failed to initialize services'));
    }
  }, [dataService, authService]);

  return (
    <DataContext.Provider value={{ dataService, authService, error }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataService = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataService must be used within DataProvider');
  }
  if (context.error) {
    console.warn('DataContext has errors:', context.error);
  }
  return context.dataService;
};

export const useAuthService = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useAuthService must be used within DataProvider');
  }
  if (context.error) {
    console.warn('DataContext has errors:', context.error);
  }
  return context.authService;
};
