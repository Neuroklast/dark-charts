import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { ChartLineUp, Users, PauseCircle, ShieldSlash, CurrencyDollar, Gear, MagnifyingGlass } from '@phosphor-icons/react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function AdminLayout({ children, currentView, onNavigate }: AdminLayoutProps) {
  const [openCommand, setOpenCommand] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommand((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const menuItems = [
    { id: 'admin-metrics', label: 'Dashboard', icon: <ChartLineUp size={20} /> },
    { id: 'admin-users', label: 'Users', icon: <Users size={20} /> },
    { id: 'admin-artists', label: 'Artists & Blacklist', icon: <ShieldSlash size={20} /> },
    { id: 'admin-charts', label: 'Charts Control', icon: <PauseCircle size={20} /> },
    { id: 'admin-promotions', label: 'Promotions', icon: <CurrencyDollar size={20} /> },
    { id: 'admin-settings', label: 'Settings', icon: <Gear size={20} /> },
  ];

  const currentMenu = menuItems.find(m => m.id === currentView) || menuItems[0];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden brutal-border">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="border-b border-border p-4 bg-primary text-primary-foreground font-display font-bold uppercase tracking-widest text-lg">
            Command Center
          </SidebarHeader>
          <SidebarContent className="bg-card">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => onNavigate(item.id)}
                    className="font-ui uppercase tracking-wider text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); onNavigate('admin-metrics'); }}>Admin</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentMenu.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div>
              <button
                onClick={() => setOpenCommand(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1.5 border border-border hover:bg-accent transition-colors brutal-shadow"
              >
                <MagnifyingGlass />
                <span className="font-ui uppercase text-xs">Search (Cmd+K)</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6 brutal-bg-pattern">
            {children}
          </div>
        </main>

        <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {menuItems.map(item => (
                <CommandItem key={item.id} onSelect={() => { onNavigate(item.id); setOpenCommand(false); }}>
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </SidebarProvider>
  );
}
