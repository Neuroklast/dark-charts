# Backend Architecture - Spotify Release Import System

This backend module implements an automated system for importing music releases from Spotify into the Dark Charts database.

## Architecture Overview

The system follows a strict **three-layer architecture** to ensure maximum decoupling and easy migration:

```
┌─────────────────────────────────────────────┐
│         Service Layer                       │
│  ├─ ReleaseImportService                   │
│  └─ ReleaseImportScheduler                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Repository Layer (Interfaces)       │
│  ├─ IArtistRepository                      │
│  ├─ IReleaseRepository                     │
│  └─ ISpotifyRepository                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Repository Implementations          │
│  ├─ SparkKVArtistRepository                │
│  ├─ SparkKVReleaseRepository               │
│  └─ SpotifyWebAPIRepository                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Data Layer                          │
│  ├─ Spark KV Store                         │
│  └─ Spotify Web API                        │
└─────────────────────────────────────────────┘
```

## Components

### 1. Models (`/backend/models`)

**Release.ts**
- Core domain model for music releases
- DTOs for creating releases
- Spotify API response types

### 2. Repositories (`/backend/repositories`)

**Interfaces:**
- `IArtistRepository` - Artist data access operations
- `IReleaseRepository` - Release data access operations  
- `ISpotifyRepository` - Spotify API operations

**Implementations:**
- `SparkKVReleaseRepository` - Persists releases using Spark KV
- `SpotifyWebAPIRepository` - Interfaces with Spotify Web API
  - Implements Client Credentials Flow authentication
  - Handles rate limiting (100ms delay between requests)
  - Implements pagination for large result sets
  - Respects HTTP 429 rate limit responses

### 3. Services (`/backend/services`)

**ReleaseImportService**
- Core business logic for importing releases
- Steps:
  1. Fetches all artists from Artist Repository
  2. Filters artists with Spotify links
  3. For each artist, queries Spotify for albums
  4. Filters releases by date (configurable)
  5. Checks for duplicates via Release Repository
  6. Saves new releases to database
- Returns detailed import results including errors

**ReleaseImportScheduler**
- Automated cron job scheduler
- Configurable via environment variable `VITE_RELEASE_IMPORT_CRON`
- Validates cron expressions (5-field format)
- Stores last run time and next run time in KV
- Provides manual trigger capability
- Runs import every minute to check schedule

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Spotify API Credentials (Required)
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Cron Schedule (Optional - defaults to disabled)
# Format: minute hour day-of-month month day-of-week
# Example: "0 2 * * *" = Daily at 2:00 AM
# Example: "0 */6 * * *" = Every 6 hours
# Example: "0 0 * * 0" = Weekly on Sunday at midnight
VITE_RELEASE_IMPORT_CRON=0 2 * * *
```

### Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Note your Client ID and Client Secret
4. Add them to your environment variables

## Usage

### Initializing the Scheduler

```typescript
import { SparkKVArtistRepository } from '@/backend/repositories/SparkKVArtistRepository';
import { SparkKVReleaseRepository } from '@/backend/repositories/SparkKVReleaseRepository';
import { SpotifyWebAPIRepository } from '@/backend/repositories/SpotifyWebAPIRepository';
import { ReleaseImportService } from '@/backend/services/ReleaseImportService';
import { ReleaseImportScheduler } from '@/backend/services/ReleaseImportScheduler';

// Create repository instances
const artistRepo = new SparkKVArtistRepository();
const releaseRepo = new SparkKVReleaseRepository();
const spotifyRepo = new SpotifyWebAPIRepository();

// Create service instance
const importService = new ReleaseImportService(
  artistRepo,
  releaseRepo,
  spotifyRepo
);

// Create and initialize scheduler
const scheduler = new ReleaseImportScheduler(importService);
await scheduler.initialize();
```

### Manual Import Trigger

```typescript
// Trigger manual import (imports last 3 months)
const result = await scheduler.manualTrigger();

console.log(`
  Artists Processed: ${result.totalArtistsProcessed}
  Releases Imported: ${result.totalReleasesImported}
  Duplicates Skipped: ${result.skippedDuplicates}
  Errors: ${result.errors.length}
`);
```

### Custom Import Options

```typescript
const sinceDate = new Date();
sinceDate.setMonth(sinceDate.getMonth() - 1); // Last month

const result = await importService.importNewReleases({
  sinceDate: sinceDate,
  maxReleasesPerArtist: 10
});
```

## Data Flow

### Import Process

1. **Authentication**
   - Spotify Repository authenticates via Client Credentials
   - Access token cached in KV with expiration
   
2. **Artist Iteration**
   - Fetches all artists with Spotify links
   - Extracts Spotify Artist ID from URL or direct ID
   
3. **Release Fetching**
   - Calls `GET /artists/{id}/albums` endpoint
   - Handles pagination automatically
   - Filters by `album`, `single`, and `ep` types
   
4. **Duplicate Detection**
   - Checks by artist ID + title + release date
   - Checks by Spotify ID
   
5. **Persistence**
   - Saves to KV with structured keys
   - Updates multiple indexes for fast lookups

## Rate Limiting & Error Handling

### Spotify API Rate Limiting
- 100ms delay between all requests
- Respects HTTP 429 responses with Retry-After header
- Continues from last position after rate limit

### Error Recovery
- Per-artist error isolation
- Failed artists logged but don't stop import
- Detailed error reporting in results

## Cron Expression Format

The scheduler uses standard 5-field cron syntax:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday=0)
│ │ │ │ │
* * * * *
```

### Examples:
- `0 2 * * *` - Every day at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `30 1 * * 0` - Every Sunday at 1:30 AM
- `0 0 1 * *` - First day of every month at midnight

## Database Schema

### Release Object Structure

```typescript
{
  id: string;                    // Unique release ID
  artistId: string;              // Reference to artist
  artistName: string;            // Denormalized for performance
  title: string;                 // Release title
  releaseDate: Date;             // Original release date
  albumType: 'album' | 'single' | 'ep' | 'compilation';
  totalTracks: number;           // Track count
  spotifyId?: string;            // Spotify album ID
  spotifyUrl?: string;           // Spotify album URL
  artworkUrl?: string;           // Album artwork URL
  genres: string[];              // Artist genres
  label?: string;                // Record label
  createdAt: Date;               // Import timestamp
  updatedAt: Date;               // Last update
}
```

### KV Storage Keys

- `backend:releases:all` - Array of all releases
- `backend:release:id:{id}` - Individual release by ID
- `backend:release:artist:{artistId}` - Array of release IDs per artist
- `backend:release:spotify:{spotifyId}` - Release ID by Spotify ID
- `backend:spotify:access_token` - Cached Spotify token
- `backend:scheduler:config` - Scheduler configuration
- `backend:scheduler:last_run` - Last import timestamp

## Migration Guide

To migrate to a different database system:

1. **Implement new repository classes** that satisfy the interfaces:
   - `PostgreSQLReleaseRepository implements IReleaseRepository`
   - Keep the service layer unchanged

2. **Update dependency injection** in initialization code:
   ```typescript
   const releaseRepo = new PostgreSQLReleaseRepository(connectionString);
   const importService = new ReleaseImportService(artistRepo, releaseRepo, spotifyRepo);
   ```

3. **No changes needed** to business logic or scheduler

## Future Enhancements

- [ ] Batch Spotify API calls (when available)
- [ ] Webhook support for real-time updates
- [ ] Release deduplication across artist collaborations
- [ ] Track-level import for detailed analytics
- [ ] Artist discovery from release collaborations
- [ ] Automatic genre tagging from Spotify
- [ ] Release popularity tracking over time

## Troubleshooting

### No releases being imported

Check:
1. Artists have valid Spotify links in database
2. Spotify credentials are correct
3. Date range is appropriate (default: last 3 months)

### Rate limiting errors

- The system handles this automatically
- Check logs for excessive `Rate limited by Spotify` warnings
- Consider reducing frequency of scheduled imports

### Cron not running

- Verify `VITE_RELEASE_IMPORT_CRON` is set
- Check browser console for initialization messages
- Confirm scheduler was initialized in app startup

## License

Part of Dark Charts Backend System
