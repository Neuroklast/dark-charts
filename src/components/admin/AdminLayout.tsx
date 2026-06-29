'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  ChartLineUp,
  Users,
  PauseCircle,
  ShieldSlash,
  CurrencyDollar,
  Gear,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { ROUTES } from '@/lib/routes';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView?: string;
  onNavigate?: (view: string) => void;
  linkMode?: boolean;
}

const menuItems = [
  { id: 'admin-metrics', href: ROUTES.adminMetrics, label: 'Dashboard', icon: <ChartLineUp size={20} /> },
  { id: 'admin-users', href: ROUTES.adminUsers, label: 'Users', icon: <Users size={20} /> },
  { id: 'admin-artists', href: ROUTES.adminArtists, label: 'Artists & Blacklist', icon: <ShieldSlash size={20} /> },
  { id: 'admin-charts', href: ROUTES.adminCharts, label: 'Charts Control', icon: <PauseCircle size={20} /> },
  { id: 'admin-promotions', href: ROUTES.adminPromotions, label: 'Promotions', icon: <CurrencyDollar size={20} /> },
  { id: 'admin-anomalies', href: ROUTES.adminAnomalies, label: 'Anomalies', icon: <ShieldSlash size={20} /> },
  { id: 'admin-settings', href: ROUTES.adminSettings, label: 'Settings', icon: <Gear size={20} /> },
];

export function AdminLayout({
  children,
  currentView,
  onNavigate,
  linkMode = false,
}: AdminLayoutProps) {
  const [openCommand, setOpenCommand] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommand((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const activeId = linkMode
    ? menuItems.find((m) => pathname === m.href)?.id ?? 'admin-metrics'
    : currentView ?? 'admin-metrics';
  const currentMenu = menuItems.find((m) => m.id === activeId) || menuItems[0];

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
                  {linkMode ? (
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className="font-ui uppercase tracking-wider text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <Link href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      isActive={currentView === item.id}
                      onClick={() => onNavigate?.(item.id)}
                      className="font-ui uppercase tracking-wider text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  )}
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
                    {linkMode ? (
                      <BreadcrumbLink asChild>
                        <Link href={ROUTES.adminMetrics}>Admin</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate?.('admin-metrics');
                        }}
                      >
                        Admin
                      </BreadcrumbLink>
                    )}
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

          <div className="flex-1 overflow-auto p-6 brutal-bg-pattern">{children}</div>
        </main>

        <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {menuItems.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    if (linkMode) {
                      window.location.href = item.href;
                    } else {
                      onNavigate?.(item.id);
                    }
                    setOpenCommand(false);
                  }}
                >
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