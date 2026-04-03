import { Card } from '@/components/ui/card';
import { User } from '@phosphor-icons/react';

export function ProfileView() {
  return (
    <div className="space-y-6">
      <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
        Profile
      </h1>

      <Card className="bg-card border border-border p-8">
        <div className="flex flex-col items-center gap-6">
          <div className="w-32 h-32 bg-secondary border border-border flex items-center justify-center">
            <User weight="bold" className="w-16 h-16 text-muted-foreground" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="font-ui text-xl uppercase tracking-[0.15em] font-bold text-foreground">
              User Profile
            </h2>
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Coming Soon
            </p>
          </div>

          <div className="w-full max-w-md space-y-4 pt-6">
            <div className="border-t border-border pt-4">
              <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                Access your voting history, saved tracks, and personalized chart preferences. 
                Manage your profile and connect with Spotify or Apple Music for authenticated voting.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
