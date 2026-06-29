'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Microphone,
  VinylRecord,
  ChartBar,
  ArrowRight,
  Gear,
  Megaphone,
  ChartLineUp,
} from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client-fetch';
import { ADMIN_SECTION_LINKS } from '@/lib/admin/nav';

interface MetricsSummary {
  users: { total: number; fans: number; djs: number };
  artists: number;
  releases: number;
  voting: { fanVotesThisWeek: number; expertVotesThisWeek: number };
}

const SECTION_ICONS: Record<string, typeof Users> = {
  Artists: Microphone,
  'Chart Control': ChartBar,
  Users: Users,
  Spotlight: Megaphone,
  Analytics: ChartLineUp,
  Settings: Gear,
};

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | null;
  icon: typeof Users;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors glow-card"
    >
      <div className="rounded-md bg-primary/10 p-2.5 text-primary">
        <Icon size={22} weight="duotone" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold tabular-nums">
          {value === null ? '–' : value.toLocaleString()}
        </p>
      </div>
      <ArrowRight
        size={16}
        className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
        aria-hidden="true"
      />
    </Link>
  );
}

export function AdminOverview() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await authFetch('/api/admin/metrics');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMetrics(data.metrics);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-label="Platform statistics">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Platform at a glance
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Users" value={metrics?.users.total ?? 0} icon={Users} href="/admin/users" />
          <StatCard label="Artists" value={metrics?.artists ?? 0} icon={Microphone} href="/admin/artists" />
          <StatCard label="Releases" value={metrics?.releases ?? 0} icon={VinylRecord} href="/admin/releases" />
          <StatCard
            label="Fan Votes (Week)"
            value={metrics?.voting.fanVotesThisWeek ?? 0}
            icon={ChartBar}
            href="/admin/charts"
          />
        </div>
      </section>

      <section aria-label="Admin sections">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Quick access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ADMIN_SECTION_LINKS.map(({ label, href, description }) => {
            const Icon = SECTION_ICONS[label] ?? Gear;
            return (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                <div className="rounded-md bg-muted p-2 mt-0.5 group-hover:bg-primary/10 transition-colors">
                  <Icon
                    size={18}
                    weight="duotone"
                    aria-hidden="true"
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}