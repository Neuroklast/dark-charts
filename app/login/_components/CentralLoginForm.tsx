'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartLine, Warning } from '@phosphor-icons/react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { resolveRedirectPath } from '@/lib/auth/resolveRedirectPath';
import { useLanguage } from '@/contexts/LanguageContext';

export function CentralLoginForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const errorParam = searchParams.get('error');
  const returnTo = searchParams.get('returnTo');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(t('auth.loginFailed') || 'Login failed');
        return;
      }

      let role: string | null = null;
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        role = profile?.role ?? null;
      }

      window.location.assign(resolveRedirectPath(role, returnTo));
    } catch {
      toast.error(t('auth.loginFailed') || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      toast.error(t('auth.emailRequired') || 'Please enter your email first');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?recovery=1`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) {
        toast.error(t('auth.resetFailed') || 'Could not send reset email');
      } else {
        toast.success(t('auth.resetSent') || 'Password reset email sent');
      }
    } catch {
      toast.error(t('auth.resetFailed') || 'Could not send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <ChartLine size={40} weight="bold" className="text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('auth.loginTitle') || 'Dark Charts Login'}
          </CardTitle>
          <CardDescription>
            {t('auth.loginDescription') || 'Sign in to vote, manage your profile, or access the admin area.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorParam === 'unauthorized' && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <Warning size={18} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{t('auth.unauthorized') || 'You do not have permission to access that area.'}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email') || 'Email'}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-muted border-border"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password') || 'Password'}</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={handleForgot}
                  disabled={isLoading}
                >
                  {t('auth.forgotPassword') || 'Forgot password?'}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-muted border-border"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} size="lg">
              {isLoading ? (t('auth.signingIn') || 'Signing in…') : (t('auth.signIn') || 'Sign in')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}