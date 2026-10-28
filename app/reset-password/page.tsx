'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LockKey, ArrowRight } from '@phosphor-icons/react';
import { tryCreateBrowserSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const de = language.startsWith('de');
  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = tryCreateBrowserSupabaseClient();
    if (!supabase) { setReady(true); return; }
    void supabase.auth.getUser().then(({ data }) => {
      if (active) { setValidSession(!!data.user); setReady(true); }
    }).catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 12 || password.length > 72) {
      toast.error(de ? 'Das Passwort muss 12–72 Zeichen lang sein.' : 'Use a password of 12–72 characters.');
      return;
    }
    if (password !== repeat) {
      toast.error(de ? 'Die Passwörter stimmen nicht überein.' : 'Passwords do not match.');
      return;
    }
    setWorking(true);
    try {
      const supabase = tryCreateBrowserSupabaseClient();
      if (!supabase) throw new Error('Authentication not available');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success(de ? 'Dein Passwort wurde geändert.' : 'Your password has been changed.');
      router.replace('/login?reset=success');
    } catch {
      toast.error(de ? 'Passwortänderung fehlgeschlagen. Fordere einen neuen Link an.' : 'Password update failed. Request a new link.');
    } finally {
      setWorking(false);
    }
  }

  return <main className="min-h-[75vh] px-4 py-16 sm:py-24 flex items-start justify-center">
    <section className="w-full max-w-md rounded-xl border border-[#393353] bg-[#191727] p-6 sm:p-9 shadow-2xl">
      <span className="mb-5 inline-grid h-12 w-12 place-items-center rounded-lg border border-[#5c4585] bg-[#302244] text-[#d4bfff]"><LockKey size={24} /></span>
      <p className="text-xs tracking-[.18em] font-bold text-[#bc9aeb]">DARKCHARTS / ACCOUNT SECURITY</p>
      <h1 className="mt-3 mb-3 text-2xl font-bold">{de ? 'Neues Passwort' : 'Set a new password'}</h1>
      {!ready ? <p className="text-muted-foreground">{de ? 'Sitzung wird geprüft ...' : 'Checking session ...'}</p> : !validSession ?
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">{de ? 'Dieser Link ist abgelaufen oder ungültig. Fordere über die Anmeldung einen neuen Link an.' : 'This link has expired or is invalid. Request a new one from the login page.'}</p>
          <Link href="/login" className="inline-flex items-center gap-2 font-semibold text-[#cfb6ff]">{de ? 'Zur Anmeldung' : 'Go to login'}<ArrowRight size={16}/></Link>
        </div> :
        <form onSubmit={submit} className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{de ? 'Wähle ein neues Passwort mit mindestens 12 Zeichen.' : 'Choose a new password with at least 12 characters.'}</p>
          <div className="space-y-2">
            <Label htmlFor="new-password">{de ? 'Neues Passwort' : 'New password'}</Label>
            <Input id="new-password" type="password" minLength={12} maxLength={72} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} disabled={working}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{de ? 'Passwort wiederholen' : 'Confirm password'}</Label>
            <Input id="confirm-password" type="password" minLength={12} maxLength={72} required autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} disabled={working}/>
          </div>
          <Button type="submit" className="w-full" disabled={working}>{working ? (de ? 'Speichern ...' : 'Saving ...') : (de ? 'Passwort ändern' : 'Change password')}</Button>
        </form>}
    </section>
  </main>;
}
