import { useState } from 'react';
import { User, ChartLine, Info, Sliders, List, X, ChartBar, ClockCounterClockwise, Translate } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ViewType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export function Navigation({ currentView, onNavigate }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const NavContent = () => (
    <>
      <button
        onClick={() => {
          onNavigate('home');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold
          ${currentView === 'home' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-primary/20'}`}
      >
        <ChartLine weight="bold" className="w-5 h-5" />
        {t('nav.home')}
      </button>

      <button
        onClick={() => {
          onNavigate('custom-charts');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold
          ${currentView === 'custom-charts' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
      >
        <Sliders weight="bold" className="w-5 h-5" />
        {t('nav.custom')}
      </button>

      <button
        onClick={() => {
          onNavigate('voting');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold
          ${currentView === 'voting' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
      >
        <ChartBar weight="bold" className="w-5 h-5" />
        {t('nav.voting')}
      </button>

      <button
        onClick={() => {
          onNavigate('history');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold
          ${currentView === 'history' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
      >
        <ClockCounterClockwise weight="bold" className="w-5 h-5" />
        {t('nav.history')}
      </button>

      <button
        onClick={() => {
          onNavigate('profile');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold
          ${currentView === 'profile' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
      >
        <User weight="bold" className="w-5 h-5" />
        {t('nav.profile')}
      </button>

      <button
        onClick={() => {
          onNavigate('about');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold
          ${currentView === 'about' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
      >
        <Info weight="bold" className="w-5 h-5" />
        {t('nav.about')}
      </button>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-2 mb-2">
          <Translate weight="bold" className="w-4 h-4" />
          <span className="font-ui text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">
            {t('profile.language')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
            className="font-ui text-xs uppercase tracking-wider"
          >
            EN
          </Button>
          <Button
            variant={language === 'de' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('de')}
            className="font-ui text-xs uppercase tracking-wider"
          >
            DE
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <button 
          className="fixed top-4 left-4 z-50 p-3 bg-card border border-border hover:bg-primary snap-transition"
          aria-label="Open menu"
        >
          <List weight="bold" className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-card border-r border-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-ui text-sm uppercase tracking-[0.15em] font-bold">{t('nav.home')}</span>
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-2 hover:bg-primary/20 snap-transition"
          >
            <X weight="bold" className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <NavContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
