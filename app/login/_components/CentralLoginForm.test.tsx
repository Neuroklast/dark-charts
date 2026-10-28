import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
vi.mock('@/lib/supabase/client', () => ({
  tryCreateBrowserSupabaseClient: () => null,
}));

import { CentralLoginForm } from './CentralLoginForm';

describe('CentralLoginForm', () => {
  it('shows normal email authentication but no demo admin button', () => {
    render(<CentralLoginForm />);
    expect(screen.getByRole('textbox', { name: 'auth.email' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'auth.signIn' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'auth.demoAdmin' })).toBeNull();
    expect(screen.queryByText('auth.demoAdminHint')).toBeNull();
  });
});
