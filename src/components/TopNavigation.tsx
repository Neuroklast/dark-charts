import { useState } from 'react';
import { User, ChartLine, Info, Sliders, List, ChartBar, ClockCounterClockwise, Translate, Users } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ViewType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import logo from '@/assets/images/Gemini_Generated_Image_fa3defa3defa3def.png';

interface TopNavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export function TopNavigation({ currentView, onNavigate }: TopNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const navItems = [
    { view: 'home' as ViewType, icon: ChartLine, label: t('nav.home') || 'Charts' },
    { view: 'custom-charts' as ViewType, icon: Sliders, label: t('nav.custom') || 'Custom' },
    { view: 'voting' as ViewType, icon: ChartBar, label: t('nav.voting') || 'Vote' },
    { view: 'history' as ViewType, icon: ClockCounterClockwise, label: t('nav.history') || 'History' },
    { view: 'about' as ViewType, icon: Info, label: t('nav.about') || 'About' },
  ];

  const MobileNavContent = () => (
    <>
      <button
        onClick={() => {
          onNavigate('home');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'home' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-primary/20'}`}
        aria-label={`Navigate to ${t('nav.home') || 'Home'}`}
        aria-current={currentView === 'home' ? 'page' : undefined}
      >
        <ChartLine weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.home')}
      </button>

      <button
        onClick={() => {
          onNavigate('custom-charts');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'custom-charts' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={`Navigate to ${t('nav.custom') || 'Custom Charts'}`}
        aria-current={currentView === 'custom-charts' ? 'page' : undefined}
      >
        <Sliders weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.custom')}
      </button>

      <button
        onClick={() => {
          onNavigate('voting');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'voting' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={`Navigate to ${t('nav.voting') || 'Voting Area'}`}
        aria-current={currentView === 'voting' ? 'page' : undefined}
      >
        <ChartBar weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.voting')}
      </button>

      <button
        onClick={() => {
          onNavigate('history');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'history' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={`Navigate to ${t('nav.history') || 'Chart History'}`}
        aria-current={currentView === 'history' ? 'page' : undefined}
      >
        <ClockCounterClockwise weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.history')}
      </button>

      <button
        onClick={() => {
          onNavigate('profile');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'profile' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={`Navigate to ${t('nav.profile') || 'Profile'}`}
        aria-current={currentView === 'profile' ? 'page' : undefined}
      >
        <User weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.profile')}
      </button>

      <button
        onClick={() => {
          onNavigate('profiles-demo');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'profiles-demo' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label="Navigate to Profiles Demo"
        aria-current={currentView === 'profiles-demo' ? 'page' : undefined}
      >
        <Users weight="bold" className="w-5 h-5" aria-hidden="true" />
        Profiles Demo
      </button>

      <button
        onClick={() => {
          onNavigate('about');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${currentView === 'about' ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-accent/20'}`}
        aria-label={`Navigate to ${t('nav.about') || 'About'}`}
        aria-current={currentView === 'about' ? 'page' : undefined}
      >
        <Info weight="bold" className="w-5 h-5" aria-hidden="true" />
        {t('nav.about')}
      </button>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-2 mb-2">
          <Translate weight="bold" className="w-4 h-4" aria-hidden="true" />
          <span className="font-ui text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">
            {t('profile.language')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Language selection">
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
            className="font-ui text-xs uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Switch to English"
            aria-pressed={language === 'en'}
          >
            EN
          </Button>
          <Button
            variant={language === 'de' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('de')}
            className="font-ui text-xs uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Switch to German"
            aria-pressed={language === 'de'}
          >
            DE
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Dark Charts - Go to home"
          >
            <img 
              src={logo} 
              alt="Dark Charts" 
              className="h-10 w-10 object-contain"
            />
            <span className="hidden sm:inline font-display text-lg uppercase tracking-wider font-bold">
              Dark Charts
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-2" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={`flex items-center gap-2 px-4 py-2 font-ui text-xs uppercase tracking-wider font-semibold snap-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    ${currentView === item.view 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-border'}`}
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={currentView === item.view ? 'page' : undefined}
                >
                  <Icon weight="bold" className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('profile')}
              className={`p-2 rounded-full border border-border snap-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${currentView === 'profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20'}`}
              aria-label="User profile"
              aria-current={currentView === 'profile' ? 'page' : undefined}
            >
              <User weight="bold" className="w-5 h-5" aria-hidden="true" />
            </button>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button 
                  className="md:hidden p-2 border border-border hover:bg-primary/20 snap-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Open navigation menu"
                  aria-expanded={mobileOpen}
                >
                  <List weight="bold" className="w-5 h-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-card border-r border-border flex flex-col" aria-label="Main navigation">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-ui text-sm uppercase tracking-[0.15em] font-bold">{t('nav.menu') || 'Menu'}</span>
                </div>
                <nav className="flex-1 flex flex-col overflow-y-auto" aria-label="Mobile navigation">
                  <MobileNavContent />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
