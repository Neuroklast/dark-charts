import { useState } from 'react';
import { 
  ChartLine, 
  Info, 
  Sliders, 
  ChartBar, 
  ClockCounterClockwise, 
  Translate, 
  Users,
  List,
  X,
  VinylRecord
} from '@phosphor-icons/react';
import { ViewType } from '@/types';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

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
    { view: 'profiles-demo' as ViewType, icon: Users, label: 'Profiles' },
    { view: 'about' as ViewType, icon: Info, label: t('nav.about') || 'About' },
  ];

  const MobileNavContent = () => (
    <div className="flex flex-col h-full bg-background border-t border-border">
      <div className="flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => {
                onNavigate(item.view);
                setMobileOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-6 py-4 border-b border-border transition-colors font-ui text-xs uppercase tracking-[0.15em] font-semibold focus:outline-none
                ${currentView === item.view ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
              aria-current={currentView === item.view ? 'page' : undefined}
            >
              <Icon weight="bold" className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 border-t border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
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
            className="text-xs font-bold"
          >
            EN
          </Button>
          <Button
            variant={language === 'de' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('de')}
            className="text-xs font-bold"
          >
            DE
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="w-full px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-16 items-center justify-between gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-primary outline-none group"
              aria-label="Dark Charts - Home"
            >
              <div className="h-9 w-9 bg-primary flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-105">
                <VinylRecord size={24} weight="fill" />
              </div>
              <span className="hidden sm:inline font-display text-lg uppercase tracking-wider font-bold">
                Dark Charts
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => onNavigate(item.view)}
                    className={`flex items-center gap-2 px-3 py-2 font-ui text-[10px] lg:text-xs uppercase tracking-wider font-semibold transition-all border-b-2
                      ${isActive 
                        ? 'text-primary border-primary' 
                        : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon weight="bold" className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('profile' as ViewType)}
                className={`p-2 border transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none
                  ${currentView === 'profile' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                aria-label="Profile"
              >
                <Users size={20} weight="bold" />
              </button>

              <button
                className="md:hidden p-2 text-foreground hover:bg-accent transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden animate-in slide-in-from-right duration-200">
          <MobileNavContent />
        </div>
      )}
    </header>
  );
}