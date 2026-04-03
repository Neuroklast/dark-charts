import { useState } from 'react';
import { User, ChartLine, Info, Sliders, List, X, ChartBar } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ViewType } from '@/types';

interface NavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export function Navigation({ currentView, onNavigate }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        Startseite
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
        Custom Charts
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
        Profile
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
        About
      </button>

      <button
        onClick={() => {
          onNavigate('about');
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold bg-card hover:bg-accent/20`}
      >
        <ChartBar weight="bold" className="w-5 h-5" />
        Voting System
      </button>
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
      <SheetContent side="left" className="w-[280px] p-0 bg-card border-r border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-ui text-sm uppercase tracking-[0.15em] font-bold">Menu</span>
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-2 hover:bg-primary/20 snap-transition"
          >
            <X weight="bold" className="w-5 h-5" />
          </button>
        </div>
        <div className="pt-4">
          <NavContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
