import React, { useState } from 'react';
import { Play, Pause } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SpotifyEmbedProps {
  spotifyUri?: string;
  artist: string;
  title: string;
  className?: string;
}

export const SpotifyEmbed: React.FC<SpotifyEmbedProps> = ({ spotifyUri, artist, title, className }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!spotifyUri) {
    return null;
  }

  const trackId = spotifyUri.replace('spotify:track:', '');
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;

  const handleToggle = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={cn("relative group", className)}>
      {!isPlaying ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-8 px-3 gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 snap-transition"
        >
          <Play weight="fill" className="w-3 h-3" />
          <span className="data-font text-xs uppercase tracking-wider">Preview</span>
        </Button>
      ) : (
        <Card className="bg-card border border-primary/50 p-2 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="data-font text-[10px] uppercase tracking-wider text-muted-foreground">
              Spotify Preview
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="h-6 w-6 p-0"
            >
              <Pause weight="fill" className="w-3 h-3" />
            </Button>
          </div>
          <iframe
            src={embedUrl}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`${artist} - ${title}`}
            className="rounded"
          />
        </Card>
      )}
    </div>
  );
};
