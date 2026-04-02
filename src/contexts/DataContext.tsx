import React, { createContext, useContext, ReactNode } from 'react';
import { IDataService, IAuthService } from '@/types';
import { MockDataService } from '@/services/mockDataService';
import { MockAuthService } from '@/services/mockAuthService';

interface DataContextType {
  dataService: IDataService;
  authService: IAuthService;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
  dataService?: IDataService;
  authService?: IAuthService;
}

export const DataProvider: React.FC<DataProviderProps> = ({ 
  children, 
  dataService = new MockDataService(),
  authService = new MockAuthService()
}) => {
  return (
    <DataContext.Provider value={{ dataService, authService }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataService = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataService must be used within DataProvider');
  }
  return context.dataService;
};

export const useAuthService = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useAuthService must be used within DataProvider');
  }
  return context.authService;
};
