# Enhanced DJ Profile System Implementation

## Overview

Implemented an advanced DJ profile system with JSON-LD structured data (Schema.org/Person), extended reputation metrics, predictive power tracking, and strict opt-in privacy controls as specified in the requirements.

## Key Components Implemented

### 1. Extended Type Definitions (`src/types/index.ts`)

Added the following interfaces to support the enhanced DJ profile:

**EarlyPrediction Interface:**
```typescript
export interface EarlyPrediction {
  trackId: string;
  trackTitle: string;
  artistName: string;
  supportedAt: number;          // Timestamp when DJ supported the track
  enteredTop10At: number;       // Timestamp when track entered Top 10
  weeksBeforeEntry: number;     // How many weeks early the prediction was
  finalPosition: number;        // Best chart position achieved
  genres: Genre[];             // Track genres for accuracy tracking
}
```

**GenreAccuracy Interface:**
```typescript
export interface GenreAccuracy {
  totalVotes: number;          // Total votes cast in this genre
  successfulVotes: number;     // Votes that resulted in chart success
  accuracy: number;            // Percentage accuracy (0-100)
  lastUpdated: number;         // Last calculation timestamp
}
```

**Enhanced DJProfile:**
- `predictivePower.earlyPredictions`: Array of EarlyPrediction objects
- `subgenreAccuracy`: Record<Genre, GenreAccuracy> for 43 subgenres
- `earnedBadges`: Array of automatically awarded badges
- `nextBadgeProgress`: Progress tracking for upcoming badge
- `isPublicProfile`: Opt-in boolean (defaults to false)

### 2. Enhanced DJ Profile Component (`src/components/profiles/EnhancedDJProfileDrawer.tsx`)

A comprehensive profile view with the following sections:

#### Privacy Controls (Own Profile Only)
- **Public Profile Toggle**: Strict opt-in system
- Default: `isPublicProfile = false` (completely anonymous)
- When enabled: Profile visible, appears in Top Supporters
- When disabled: Votes count, but user remains anonymous

#### Reputation Score Section
- Visual progress bar showing reputation out of 100
- Expert Weight multiplier display (e.g., "2.45x")
- Professional references count
- Comprehensive reputation metrics

#### Predictive Power / Track Record
- **Accuracy Percentage**: Overall prediction success rate
- **Correct vs Total Predictions**: Raw numbers display
- **Early Predictions List**: Shows tracks supported before Top 10 entry
  - Track title and artist
  - Weeks before chart entry
  - Final peak position
  - Visual badges for early supporter status

#### Subgenre Accuracy
- Top 5 subgenres by accuracy
- Detailed metrics per genre:
  - Success ratio (e.g., "47/52 votes")
  - Accuracy percentage
  - Visual progress bars

#### Curated Charts
- Public/private status indicators
- Track count and follower count
- Last updated timestamps
- Follow buttons for visitors

#### Earned Badges
- Grid display of achieved badges
- Badge name, description, and icon
- Timestamp of when badge was earned

#### Next Badge Progress (Own Profile Only)
- Shows closest upcoming badge
- Current progress vs required progress
- Percentage complete with progress bar

#### Biography Editing (Own Profile Only)
- Inline editing with textarea
- 500 character limit
- Save/Cancel buttons

#### Social Stats (Own Profile Only)
- Followers count
- Following count

#### JSON-LD Structured Data
- Automatically injects Schema.org/Person JSON-LD into `<head>`
- Enables Google Knowledge Graph recognition
- Links DJ profile to tracks and bands semantically
- Removes script tag on component unmount

### 3. Updated Mock Auth Service (`src/services/mockAuthService.ts`)

Modified default FanProfile creation to include:
```typescript
isPublicProfile: false,      // Strict opt-in default
curatedCharts: [],
followingIds: [],
followerIds: []
```

## Privacy Implementation

### Opt-In System

**Default Behavior:**
- All new users have `isPublicProfile: false`
- Votes are counted normally
- User does NOT appear in:
  - Top Supporters lists
  - Public leaderboards
  - Search results
  - Social features

**When User Opts In (`isPublicProfile: true`):**
- Profile becomes visible to others
- Appears in Top Supporters on tracks they voted for
- Can be found and followed
- Biography and stats visible

**UI/UX:**
- Clear toggle switch with immediate feedback
- Explanatory text: "When disabled, your votes count, but you remain completely anonymous"
- Toast confirmation on toggle

### Database Query Logic

When rendering Top Supporters (already implemented in TrackDetailModal.tsx):
```typescript
// Backend must filter:
const publicSupporters = track.topSupporters.filter(
  supporter => supporter.isPublicProfile === true
);
```

## Schema.org Integration

The component automatically injects JSON-LD structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "DJ Username",
  "image": "avatar URL",
  "description": "Biography text",
  "url": "Profile URL",
  "sameAs": ["https://spotify.com/...", "https://instagram.com/..."]
}
```

This enables:
- Google Knowledge Graph entity recognition
- Semantic linking between DJ → Tracks → Bands
- Improved organic search visibility
- Authority building for the platform

## Usage Example

```typescript
import { EnhancedDJProfileDrawer } from '@/components/profiles/EnhancedDJProfileDrawer';

// For viewing another DJ's profile
<EnhancedDJProfileDrawer
  profile={djProfile}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  isOwnProfile={false}
/>

// For the DJ viewing their own profile
<EnhancedDJProfileDrawer
  profile={currentUserProfile}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  isOwnProfile={true}  // Enables editing and privacy controls
/>
```

## Backend Requirements (To Be Implemented)

### 1. Badge System
Automatic badge awarding based on:
- Early prediction accuracy thresholds
- Vote count milestones
- Genre expertise levels
- Follower count achievements
- Consistency streaks

### 2. Predictive Power Calculation
Background job that:
- Tracks when DJs vote for tracks
- Monitors when those tracks enter Top 10
- Calculates weeks between vote and chart entry
- Updates `predictivePower.earlyPredictions` array

### 3. Subgenre Accuracy Tracking
Calculation logic:
- For each DJ vote on a track
- Check track's final chart performance
- If track enters Top 10 → successful vote
- Update `subgenreAccuracy` for each genre the track belongs to

### 4. Top Supporters Anonymization
Query modification:
```sql
SELECT u.*
FROM track_votes tv
JOIN users u ON tv.user_id = u.id
WHERE tv.track_id = ?
  AND u.is_public_profile = true  -- Critical filter
ORDER BY tv.vote_count DESC
LIMIT 3
```

## Design Consistency

The enhanced profile maintains Dark Charts' cyber/industrial aesthetic:
- No rounded corners (border-radius: 0)
- White borders on hover instead of red (#previous requirement)
- Sharp transitions and instant feedback
- Cyberpunk-inspired progress bars
- Monospace fonts for data (Space Mono)
- Electrolize for headings
- Accent color (#8B5CF6 purple) for highlights

##  Integration Points

The EnhancedDJProfileDrawer can be integrated:
- In Navigation → Profile menu (for own profile)
- On Track Detail Modal → Top Supporters (click avatar)
- In search/discovery features
- On curated charts (click curator name)

## Next Steps

1. **Create Badge Award Service**: Automated background job
2. **Implement Prediction Tracking**: Vote timestamp + chart entry monitoring
3. **Calculate Genre Accuracy**: Aggregate successful vs total votes per genre
4. **Update Database Queries**: Add `isPublicProfile` filters to all public-facing queries
5. **Add Follow System**: Enable users to follow DJs
6. **Create Activity Feed**: Show followed DJs' recent predictions and achievements

## Files Modified/Created

- ✅ `src/types/index.ts` - Extended type definitions
- ✅ `src/components/profiles/EnhancedDJProfileDrawer.tsx` - New component
- ✅ `src/services/mockAuthService.ts` - Updated default profile

## Testing Checklist

- [ ] Privacy toggle switches between public/private correctly
- [ ] JSON-LD script injected into `<head>` when profile opens
- [ ] JSON-LD script removed when profile closes
- [ ] Biography editing saves correctly
- [ ] Own profile shows editing controls
- [ ] Other profiles hide editing controls
- [ ] Predictive Power displays early predictions
- [ ] Subgenre Accuracy shows top 5 genres correctly
- [ ] Earned badges render in grid
- [ ] Next badge progress shows percentage
- [ ] Follow button appears for other profiles
- [ ] Follower/following counts display for own profile
