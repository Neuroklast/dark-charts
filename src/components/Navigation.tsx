import { useState } from 'react';
import { User, ChartLine, Info, Sliders, List, X } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MainGenre, ViewType } from '@/types';

interface NavigationProps {
  currentView: ViewType;
  currentMainGenre?: MainGenre | null;
  onNavigate: (view: ViewType, mainGenre?: MainGenre) => void;
}

const mainGenres: MainGenre[] = ['Gothic', 'Metal', 'Dark Electro', 'Crossover'];

export function Navigation({ currentView, currentMainGenre, onNavigate }: NavigationProps) {
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
        Overall Charts
      </button>

      <div className="border-b border-border">
        <div className="px-4 py-2 bg-secondary/30">
          <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            Main Genres
          </span>
        </div>
        {mainGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => {
              onNavigate('main-genre', genre);
              setMobileOpen(false);
            }}
            className={`w-full text-left px-6 py-3 border-b border-border snap-transition font-ui text-xs uppercase tracking-[0.12em] font-semibold
              ${currentView === 'main-genre' && currentMainGenre === genre 
                ? 'bg-accent text-accent-foreground' 
                : 'bg-card hover:bg-accent/20'}`}
          >
            {genre}
          </button>
        ))}
      </div>

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
        About / Voting System
      </button>
    </>
  );

  return (
    <>
      <nav className="hidden md:block w-64 border-r border-border bg-card fixed left-0 top-0 bottom-0 overflow-y-auto z-40">
        <div className="pt-8">
          <NavContent />
        </div>
      </nav>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button 
            className="md:hidden fixed top-4 left-4 z-50 p-3 bg-card border border-border hover:bg-primary snap-transition"
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
    </>
  );
}
