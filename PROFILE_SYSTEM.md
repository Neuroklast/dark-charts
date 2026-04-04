# User Profile System Documentation

## Overview

The Dark Charts application now features a complete, isolated profile system with dedicated components for different user types. These profile components are completely separate from the existing chart functionality and overlay on top of the current view using side drawers (Sheet components).

## Profile Types

### 1. Fan Profiles (`FanProfileDrawer`)

**Purpose**: Display fan user profiles with voting activity and achievement tracking.

**Key Features**:
- **Voice Credits Wallet**: Shows available credits for quadratic voting (e.g., "120/150 Credits")
- **Achievement Showcase**: Displays earned badges with icons (following WOW Framework: Want, Own, Work)
- **GitHub-Style Contribution Graph**: 365-day activity grid showing voting patterns
  - Color intensity indicates activity level (0-4 scale)
  - Hover to see specific day details
- **Social Links**: External platform connections with verification status
- **Biography**: User description and scene involvement

**Design**: 
- Opens as a right-side drawer (Sheet component)
- Includes skeleton loading states for smooth UX
- Color-coded activity levels (darker = more activity)

### 2. Artist/Band Profiles (`ArtistProfileDrawer`)

**Purpose**: Showcase band/artist information with professional metrics and performance data.

**Key Features**:
- **Hero Section**: Large banner image with overlaid profile picture
- **Verified Badge**: Shows official verification status
- **Genre Tag Cloud**: Dynamic genre tags with varying sizes based on prominence
- **Performance Metrics**:
  - Current chart position
  - Peak/best chart position
  - Total votes received
  - Chart positions across different chart types
- **Latest Releases**: Recent album/single releases with release dates
- **Social & Streaming Links**: Multiple platform connections (Spotify, Bandcamp, YouTube, etc.)
- **Analytics Dashboard**: Vote counts and demographic insights (if available)

**Design**:
- Hero image section at top (gradient overlay if no image)
- Larger drawer (max-width: 2xl) to accommodate more content
- Verified artists get accent-colored "Verified" badge
- Skeleton loading for smooth data presentation

### 3. DJ/Curator Profiles (`DJProfileDrawer`)

**Purpose**: Display expertise and reputation metrics for scene curators and expert voters.

**Key Features**:
- **Reputation Score**: 0-100 score with progress bar showing curator credibility
- **Expert Weight**: Multiplier showing voting influence (Bayesian weighting)
- **Track Record**: List of tracks supported before they entered Top 10 (demonstrates expertise)
- **Top Subgenres**: Percentage breakdown of genre expertise with accuracy ratings
- **Curated Playlists**: Personal playlists created by the curator
- **References**: Number of professional references/endorsements

**Design**:
- Crown icon badge to distinguish curator status
- Emphasis on metrics and data visualization
- Progress bars for reputation and genre accuracy
- Early supporter tracking to showcase trendsetting ability

## Architecture

### Component Structure

```
src/components/profiles/
├── FanProfileDrawer.tsx          # Fan profile component
├── ArtistProfileDrawer.tsx       # Artist/Band profile component
├── DJProfileDrawer.tsx           # DJ/Curator profile component
├── ProfileDrawerManager.tsx      # Router component for profile types
└── index.ts                      # Export barrel
```

### ProfileDrawerManager

The `ProfileDrawerManager` component acts as a smart router that determines which profile component to render based on the `userType` property:

```typescript
<ProfileDrawerManager
  profile={userProfile}    // Can be FanProfile | BandProfile | DJProfile | LabelProfile
  isOpen={isOpen}
  onClose={closeHandler}
/>
```

### Integration Example

```typescript
import { ProfileDrawerManager } from '@/components/profiles/ProfileDrawerManager';
import { UserProfile } from '@/types';

function MyComponent() {
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleProfileClick = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsDrawerOpen(true);
  };

  return (
    <>
      {/* Your existing UI */}
      <button onClick={() => handleProfileClick(someProfile)}>
        View Profile
      </button>

      {/* Profile drawer overlay */}
      <ProfileDrawerManager
        profile={selectedProfile}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
```

## Type Definitions

All profile types extend the `BaseUserProfile` interface:

```typescript
interface BaseUserProfile {
  id: string;
  userType: 'fan' | 'band' | 'dj' | 'label';
  username: string;
  biography?: string;
  avatarUrl?: string;
  externalLinks: ExternalLink[];
  displayedBadges: string[];
  allBadges: Badge[];
  createdAt: number;
  updatedAt: number;
}
```

### FanProfile extends BaseUserProfile
```typescript
{
  votingCredits: number;        // Current available credits
  votingHistory: Vote[];        // Historical voting data
  favoritesList: string[];      // Favorite track IDs
  personalCharts: string[];     // Custom chart IDs
}
```

### BandProfile extends BaseUserProfile
```typescript
{
  genres: Genre[];              // Associated genres
  spotifyArtistId?: string;     // Spotify artist ID
  latestReleases: Release[];    // Recent releases
  isPremium: boolean;           // Verification status
  analytics?: {
    totalVotes: number;
    chartPositions: Position[];
    demographics: Record<string, number>;
  };
}
```

### DJProfile extends BaseUserProfile
```typescript
{
  expertWeight: number;         // Voting multiplier (Bayesian)
  references: string[];         // Professional references
  curatedPlaylists: Playlist[];  // Created playlists
  supportedTracks: string[];    // Early-supported tracks
  reputation: number;           // 0-100 reputation score
}
```

## Key Design Principles

### 1. Complete Isolation
- Profile components are **completely isolated** from chart rendering logic
- They overlay using Sheet/Drawer components - no impact on existing views
- Can be opened/closed without affecting chart state

### 2. Skeleton Loading
- All profiles include skeleton loading states
- Simulated 800ms delay for smooth transitions
- Maintains layout structure during loading

### 3. Responsive Design
- Mobile-optimized with appropriate breakpoints
- Smaller drawers on mobile (w-3/4, max-w-sm on desktop)
- Touch-friendly hit areas

### 4. Dark Aesthetic Consistency
- Follows existing Dark Charts design language
- Uses theme colors (accent, primary, secondary)
- Sharp edges (no rounded corners per theme)
- Cyber/industrial aesthetic maintained

## Usage in Charts

To add profile functionality to chart entries, you can make artist/fan names clickable:

```typescript
// In a chart entry component
<button 
  onClick={() => handleOpenProfile(artistProfile)}
  className="hover:text-accent transition-colors"
>
  {track.artist}
</button>
```

## Demo Page

Access the demo at `/profiles-demo` (via Navigation menu) to see:
- All three profile types with realistic mock data
- Interactive examples of each profile drawer
- Implementation notes and usage guidelines

## Important Notes

### DO NOT Modify These Files
The profile system is isolated. **Do not modify** any of these existing systems:
- Chart rendering components (ChartEntry, ChartCategory, etc.)
- Chart data services
- Weighting/slider logic
- Dashboard views
- Error boundaries

### Safe Integration Points
You CAN safely integrate profiles by:
- Adding onClick handlers to artist/user names
- Creating profile links in modals
- Adding profile buttons in user interfaces
- Using the ProfileDrawerManager anywhere in the app

## Performance Considerations

- Skeleton loading prevents layout shift
- Lazy generation of contribution graphs (computed on open)
- No data fetching on closed state
- Cleanup on unmount prevents memory leaks

## Future Enhancements

Potential additions (not yet implemented):
- Profile editing functionality
- Badge earning logic
- Real-time reputation updates
- Profile comparison views
- Follow/unfollow system
- Activity feeds
- Notification integration
