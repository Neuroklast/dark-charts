'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  VinylRecord,
} from '@phosphor-icons/react';
import { ViewType } from '@/types';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { NAV_ITEMS, ROUTES } from '@/lib/routes';

interface TopNavigationProps {
  currentView?: ViewType;
  onNavigate?: (view: ViewType) => void;
  linkMode?: boolean;
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === ROUTES.home) return pathname === ROUTES.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNavigation({ currentView, onNavigate, linkMode = false }: TopNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    icon:
      item.view === 'home'
        ? ChartLine
        : item.view === 'custom-charts'
          ? Sliders
          : item.view === 'voting'
            ? ChartBar
            : item.view === 'history'
              ? ClockCounterClockwise
              : Info,
    label: t(item.labelKey) || item.fallback,
  }));

  const isActive = (view: ViewType, href: string) =>
    linkMode ? isNavActive(pathname, href) : currentView === view;

  const NavButton = ({
    view,
    href,
    icon: Icon,
    label,
    onClick,
    className,
  }: {
    view: ViewType;
    href: string;
    icon: typeof ChartLine;
    label: string;
    onClick?: () => void;
    className: string;
  }) => {
    const active = isActive(view, href);
    const content = (
      <>
        <Icon weight="bold" className="w-5 h-5" />
        {label}
      </>
    );

    if (linkMode) {
      return (
        <Link
          href={href}
          onClick={onClick}
          className={className}
          aria-current={active ? 'page' : undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        onClick={() => {
          onNavigate?.(view);
          onClick?.();
        }}
        className={className}
        aria-current={active ? 'page' : undefined}
      >
        {content}
      </button>
    );
  };

  const MobileNavContent = () => (
    <div className="flex flex-col h-full bg-background border-t border-border">
      <div className="flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavButton
            key={item.view}
            view={item.view}
            href={item.href}
            icon={item.icon}
            label={item.label}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 w-full px-6 py-4 border-b border-border transition-colors font-ui text-xs uppercase tracking-[0.15em] font-semibold focus:outline-none
              ${isActive(item.view, item.href) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          />
        ))}
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

  const Logo = linkMode ? (
    <Link
      href={ROUTES.home}
      className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-primary outline-none group"
      aria-label="Dark Charts - Home"
    >
      <div className="h-9 w-9 bg-primary flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-105">
        <VinylRecord size={24} weight="fill" />
      </div>
      <span className="hidden sm:inline font-display text-lg uppercase tracking-wider font-bold">
        Dark Charts
      </span>
    </Link>
  ) : (
    <button
      onClick={() => onNavigate?.('home')}
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
  );

  const ProfileButton = linkMode ? (
    <Link
      href={ROUTES.profile}
      className={`p-2 border transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none
        ${isNavActive(pathname, ROUTES.profile) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
      aria-label="Profile"
    >
      <Users size={20} weight="bold" />
    </Link>
  ) : (
    <button
      onClick={() => onNavigate?.('profile')}
      className={`p-2 border transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none
        ${currentView === 'profile' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
      aria-label="Profile"
    >
      <Users size={20} weight="bold" />
    </button>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="w-full px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-16 items-center justify-between gap-4">
            {Logo}

            <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.view, item.href);
                const desktopClass = `flex items-center gap-2 px-3 py-2 font-ui text-[10px] lg:text-xs uppercase tracking-wider font-semibold transition-all border-b-2
                  ${active ? 'text-primary border-primary' : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'}`;

                if (linkMode) {
                  return (
                    <Link
                      key={item.view}
                      href={item.href}
                      className={desktopClass}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon weight="bold" className="w-4 h-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.view}
                    onClick={() => onNavigate?.(item.view)}
                    className={desktopClass}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon weight="bold" className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {ProfileButton}

              <button
                className="md:hidden p-2 text-foreground hover:bg-accent transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
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