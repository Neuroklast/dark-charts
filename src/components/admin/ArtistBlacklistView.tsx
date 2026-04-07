import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ArtistBlacklistViewProps {
  blacklist?: any[];
  isLoading?: boolean;
  onUpdateStatus?: (artistId: string, status: string) => void;
  onForceSync?: () => void;
}

export function ArtistBlacklistView({ blacklist, isLoading, onUpdateStatus, onForceSync }: ArtistBlacklistViewProps) {
  if (isLoading) {
    return (
      <div data-testid="blacklist-loading">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artist</TableHead>
                <TableHead>Spotify ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2].map(i => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-display uppercase tracking-widest">Artist Blacklist</h2>
        <Button onClick={onForceSync} variant="secondary" className="font-ui uppercase text-xs tracking-wider brutal-shadow">
          Force Odesli Sync
        </Button>
      </div>
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artist Name</TableHead>
              <TableHead>Spotify ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blacklist?.map(artist => (
              <TableRow key={artist.id}>
                <TableCell className="font-bold">{artist.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{artist.spotifyId || 'N/A'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold ${artist.status === 'BANNED' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                    {artist.status}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onUpdateStatus?.(artist.id, 'ACTIVE')}>
                    Restore
                  </Button>
                  {artist.status !== 'BANNED' && (
                    <Button variant="destructive" size="sm" onClick={() => onUpdateStatus?.(artist.id, 'BANNED')}>
                      Ban
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(!blacklist || blacklist.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No artists in blacklist</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
