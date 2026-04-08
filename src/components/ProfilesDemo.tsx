import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FanProfile, BandProfile, DJProfile, UserProfile, Badge as BadgeType } from '@/types';
import { ProfileDrawerManager } from '@/components/profiles/ProfileDrawerManager';
import { User, Users, Microphone, MusicNotes } from '@phosphor-icons/react';

const mockFanProfile: FanProfile = {
  id: 'fan-001',
  userType: 'fan',
  username: 'DarkWaveEnthusiast',
  biography: 'Passionate fan of gothic and dark wave music. Been in the scene for over 10 years. Always hunting for hidden gems in the underground.',
  avatarUrl: '',
  externalLinks: [
    { platform: 'Spotify', url: 'https://spotify.com', verified: true },
    { platform: 'Instagram', url: 'https://instagram.com', verified: false },
  ],
  displayedBadges: ['early-supporter', 'genre-explorer', 'mega-voter'],
  allBadges: [
    { id: 'early-supporter', name: 'Early Supporter', description: 'Voted for 5 tracks before they hit Top 10', icon: '🎯', earnedAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
    { id: 'genre-explorer', name: 'Genre Explorer', description: 'Voted in 10+ different subgenres', icon: '🗺️', earnedAt: Date.now() - 60 * 24 * 60 * 60 * 1000 },
    { id: 'mega-voter', name: 'Mega Voter', description: 'Cast over 500 votes', icon: '⚡', earnedAt: Date.now() - 90 * 24 * 60 * 60 * 1000 },
  ],
  createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now(),
  votingCredits: 120,
  votingHistory: Array.from({ length: 150 }, (_, i) => ({
    trackId: `track-${i}`,
    credits: Math.floor(Math.random() * 10) + 1,
    timestamp: Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000,
  })),
  favoritesList: ['track-001', 'track-002', 'track-003'],
  personalCharts: ['my-favorites', 'dark-wave-essentials'],
  curatedCharts: [],
  followingIds: [],
  followerIds: [],
  isPublicProfile: true,
};

const mockBandProfile: BandProfile = {
  id: 'band-001',
  userType: 'band',
  username: 'Shadowmere',
  biography: 'Dark metal band from Berlin. Combining gothic atmosphere with crushing metal riffs since 2015. Our latest album "Eternal Night" is out now.',
  avatarUrl: '',
  externalLinks: [
    { platform: 'Spotify', url: 'https://spotify.com', verified: true },
    { platform: 'Bandcamp', url: 'https://bandcamp.com', verified: true },
    { platform: 'Instagram', url: 'https://instagram.com', verified: true },
    { platform: 'YouTube', url: 'https://youtube.com', verified: false },
  ],
  displayedBadges: [],
  allBadges: [],
  createdAt: Date.now() - 730 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now(),
  genres: ['Gothic Metal', 'Dark Metal', 'Doom Metal'],
  spotifyArtistId: 'spotify-artist-123',
  latestReleases: [
    { title: 'Eternal Night', releaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000, spotifyUri: 'spotify:track:123' },
    { title: 'Shadows Fall', releaseDate: Date.now() - 180 * 24 * 60 * 60 * 1000, spotifyUri: 'spotify:track:124' },
    { title: 'Dark Horizons', releaseDate: Date.now() - 365 * 24 * 60 * 60 * 1000, spotifyUri: 'spotify:track:125' },
  ],
  isPremium: true,
  followerIds: [],
  isPublicProfile: true,
  analytics: {
    totalVotes: 2847,
    chartPositions: [
      { chartType: 'fan', position: 3 },
      { chartType: 'expert', position: 7 },
      { chartType: 'streaming', position: 12 },
    ],
    demographics: {},
    weeksInChart: 0,
    peakPosition: 0,
  },
};

const mockDJProfile: DJProfile = {
  id: 'dj-001',
  userType: 'dj',
  username: 'DJ_Nocturne',
  biography: 'Professional DJ and curator specializing in dark electronic and EBM. Resident DJ at Schwarze Nacht club. Trusted voice in the scene for over 15 years.',
  avatarUrl: '',
  externalLinks: [
    { platform: 'Mixcloud', url: 'https://mixcloud.com', verified: true },
    { platform: 'Instagram', url: 'https://instagram.com', verified: true },
  ],
  displayedBadges: [],
  allBadges: [],
  createdAt: Date.now() - 1460 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now(),
  expertWeight: 2.5,
  references: ['ref-1', 'ref-2', 'ref-3', 'ref-4', 'ref-5'],
  curatedPlaylists: [
    { name: 'Dark Techno Essentials', trackIds: Array(25).fill('track'), createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000 },
    { name: 'EBM Classics', trackIds: Array(30).fill('track'), createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000 },
    { name: 'Industrial Underground', trackIds: Array(20).fill('track'), createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000 },
  ],
  supportedTracks: ['track-001', 'track-015', 'track-023', 'track-042', 'track-087'],
  reputation: 87,
  followerIds: [],
  followingIds: [],
  curatedCharts: [],
  earnedBadges: [],
  isPublicProfile: false,
};

export function ProfilesDemo() {
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openProfile = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsDrawerOpen(true);
  };

  const closeProfile = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedProfile(null), 300);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-font text-4xl uppercase tracking-tight text-foreground mb-3">
          Profile Drawers Demo
        </h1>
        <p className="font-ui text-sm text-muted-foreground">
          Click on any profile card to open the profile drawer. These are isolated components that overlay the existing charts without affecting them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border border-border p-6 hover:border-accent transition-colors cursor-pointer group" onClick={() => openProfile(mockFanProfile)}>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-secondary border-2 border-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <User weight="duotone" className="w-10 h-10 text-accent" />
            </div>
            <h3 className="display-font text-xl uppercase tracking-tight text-foreground mb-2">
              {mockFanProfile.username}
            </h3>
            <Badge variant="outline" className="font-ui text-[10px] uppercase tracking-widest border-accent text-accent mb-3">
              Fan Profile
            </Badge>
            <p className="font-ui text-xs text-muted-foreground mb-4">
              Features: Credits Wallet, Activity Graph, Badges
            </p>
            <Button variant="outline" className="w-full border-border hover:border-accent" onClick={(e) => {
              e.stopPropagation();
              openProfile(mockFanProfile);
            }}>
              View Profile
            </Button>
          </div>
        </Card>

        <Card className="bg-card border border-border p-6 hover:border-accent transition-colors cursor-pointer group" onClick={() => openProfile(mockBandProfile)}>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-secondary border-2 border-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <MusicNotes weight="duotone" className="w-10 h-10 text-accent" />
            </div>
            <h3 className="display-font text-xl uppercase tracking-tight text-foreground mb-2">
              {mockBandProfile.username}
            </h3>
            <Badge variant="outline" className="font-ui text-[10px] uppercase tracking-widest border-accent text-accent mb-3">
              Artist Profile
            </Badge>
            <p className="font-ui text-xs text-muted-foreground mb-4">
              Features: Hero Section, Genre Tags, Chart Positions
            </p>
            <Button variant="outline" className="w-full border-border hover:border-accent" onClick={(e) => {
              e.stopPropagation();
              openProfile(mockBandProfile);
            }}>
              View Profile
            </Button>
          </div>
        </Card>

        <Card className="bg-card border border-border p-6 hover:border-accent transition-colors cursor-pointer group" onClick={() => openProfile(mockDJProfile)}>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-secondary border-2 border-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Microphone weight="duotone" className="w-10 h-10 text-accent" />
            </div>
            <h3 className="display-font text-xl uppercase tracking-tight text-foreground mb-2">
              {mockDJProfile.username}
            </h3>
            <Badge variant="outline" className="font-ui text-[10px] uppercase tracking-widest border-accent text-accent mb-3">
              DJ / Curator Profile
            </Badge>
            <p className="font-ui text-xs text-muted-foreground mb-4">
              Features: Reputation Score, Track Record, Genre Expertise
            </p>
            <Button variant="outline" className="w-full border-border hover:border-accent" onClick={(e) => {
              e.stopPropagation();
              openProfile(mockDJProfile);
            }}>
              View Profile
            </Button>
          </div>
        </Card>
      </div>

      <Card className="bg-secondary/30 border border-border p-6">
        <h3 className="display-font text-lg uppercase tracking-tight text-foreground mb-3">
          Implementation Notes
        </h3>
        <ul className="space-y-2 font-ui text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>These profile components are completely isolated and do not affect existing chart functionality</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>They use Sheet/Drawer components that overlay the current view</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Fan profiles include a GitHub-style contribution graph showing voting activity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Artist profiles feature a hero section, genre tag cloud, and performance metrics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>DJ profiles show reputation scores, track records, and genre expertise</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>All profiles include skeleton loading states for smooth UX</span>
          </li>
        </ul>
      </Card>

      <ProfileDrawerManager
        profile={selectedProfile}
        isOpen={isDrawerOpen}
        onClose={closeProfile}
      />
    </div>
  );
}
