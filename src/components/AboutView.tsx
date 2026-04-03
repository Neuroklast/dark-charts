import { Card } from '@/components/ui/card';
import { Info, Skull, User as UserIcon, ChartBar, Broadcast } from '@phosphor-icons/react';

export function AboutView() {
  return (
    <div className="space-y-6">
      <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
        About Dark Charts
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 border border-primary">
              <Info weight="bold" className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="font-ui text-lg uppercase tracking-[0.12em] font-bold text-foreground">
                Our Mission
              </h2>
              <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                Independent music charts for the Heavy Metal, Gothic, Dark Wave, and EBM scene. 
                Fair, transparent, and free from pay-to-win mechanics.
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-card border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/20 border border-accent">
              <Skull weight="bold" className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="font-ui text-lg uppercase tracking-[0.12em] font-bold text-foreground">
                No Pay-To-Play
              </h2>
              <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                Artists don't pay to be ranked. Rankings are determined solely by authentic fan votes, 
                expert reviews, and streaming engagement.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-card border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="display-font text-2xl uppercase tracking-wider text-foreground font-semibold">
            How Voting Works
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary border border-primary flex items-center justify-center">
                  <UserIcon weight="bold" className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-ui text-sm uppercase tracking-[0.12em] font-bold text-foreground">
                  Fan Charts
                </h3>
              </div>
              <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                Community-driven rankings powered by quadratic voting. Each authenticated user receives 
                monthly vote credits to support their favorite artists.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary border border-primary flex items-center justify-center">
                  <ChartBar weight="bold" className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-ui text-sm uppercase tracking-[0.12em] font-bold text-foreground">
                  Expert Charts
                </h3>
              </div>
              <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                Curated by DJs, producers, and music journalists using bayesian ranking algorithms. 
                Expert reputation scores ensure quality evaluations.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary border border-primary flex items-center justify-center">
                  <Broadcast weight="bold" className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-ui text-sm uppercase tracking-[0.12em] font-bold text-foreground">
                  Streaming Charts
                </h3>
              </div>
              <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                Normalized streaming data from Spotify and YouTube, weighted by listener loyalty 
                rather than raw play counts.
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-ui text-sm uppercase tracking-[0.15em] font-bold text-accent mb-4">
              Principles
            </h3>
            <ul className="space-y-2 font-ui text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>No pay-to-play mechanisms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Community-driven rankings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Transparent methodology</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Scene-focused curation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Protection against manipulation</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
