# Artwork Caching & Progressive Image Loading Implementation

## Overview
Comprehensive implementation of WSRV.nl-based artwork caching with progressive image loading (blur-up technique) and skeleton loading for voting and profile areas.

## 1. WSRV.nl Integration for Artwork Caching

### Updated: `/src/services/artworkCacheService.ts`
- **WSRV.nl URL Generation**: Integrated WSRV.nl CDN for image optimization and caching
  - Generates optimized WebP images at configurable widths and quality levels
  - Format: `https://wsrv.nl/?url={encodedUrl}&w={width}&q={quality}&output=webp&we`
  - Default settings: 400px width, 85% quality for high-quality images
  
- **Multi-Resolution Image Support**:
  - Thumbnail: 40px width, 20% quality (for blur placeholders)
  - Low quality: 150px width, 50% quality (initial load)
  - High quality: 400px width, 85% quality (final display)
  
- **Enhanced Caching**:
  - Stores both original URLs and generated WSRV URLs
  - Timestamp tracking for cache management
  - Automatic eviction of oldest entries when cache exceeds 200 items
  - Priority-based preloading queue

### Methods:
- `generateWsrvUrl(url, width, quality)`: Creates WSRV.nl optimized URLs
- `preloadArtwork(url, priority, width)`: Loads and caches individual images
- `preloadMultiple(urls, priority, width)`: Batch preloading with priority
- `getWsrvUrl(url)`: Retrieves cached WSRV URL or generates new one
- `getCachedUrl(url)`: Gets cached WSRV URL if available

## 2. Progressive Image Loading with Blur-Up Technique

### Updated: `/src/components/AlbumArtwork.tsx`
Implements smooth progressive image loading with blur-up effect:

#### Features:
1. **Dual-Image Loading**:
   - Low-quality placeholder (40px, 20% quality) loads first with blur effect
   - High-quality image (400px, 85% quality) fades in when ready
   
2. **Visual States**:
   - **Loading**: Shows spinner overlay while images load
   - **Blur placeholder**: Pixelated, blurred low-res image (scale: 110%, blur-md)
   - **High quality**: Crisp final image fades in smoothly
   - **Error**: Fallback to icon placeholder

3. **Performance Optimizations**:
   - Lazy loading attribute
   - Crisp-edges image rendering
   - Instant transitions (100ms)
   - Cached image detection

4. **Props**:
   - `priority`: Controls preload priority (default: 5)
   - `showLoadingIndicator`: Toggle spinner visibility
   - Existing props maintained for backward compatibility

## 3. Progressive Image Hook

### New: `/src/hooks/use-progressive-image.ts`
Reusable React hook for progressive image loading:

```typescript
useProgressiveImage({
  lowQualityUrl: string,
  highQualityUrl: string,
  priority: number
})
```

Returns:
- `src`: Current image source (low or high quality)
- `isLoading`: Loading state
- `hasError`: Error state
- `isHighQualityLoaded`: Whether high-quality version is loaded

**Helper Functions**:
- `generateWsrvUrl(url, width, quality)`: Creates WSRV URLs
- `generateImageUrls(url)`: Generates thumbnail, low, high, and original URLs

## 4. Skeleton Loading Components

### New: `/src/components/skeletons/VotingAreaSkeleton.tsx`
Dark-themed skeleton loading components with staggered animations:

#### Components:

1. **VotingAreaSkeleton**:
   - Search bar skeleton
   - Genre filter pills (5 items with staggered delays)
   - Grid of 9 voting track cards
   - Matches actual voting area layout

2. **VotingTrackCardSkeleton**:
   - 20x20 album artwork placeholder
   - Track title and artist text blocks
   - Genre badges (3 items)
   - Vote controls (buttons + counter)
   - Staggered animation delays (50ms increments)

3. **ProfileStatsSkeleton**:
   - 3-column grid of stat cards
   - Icon + label + value placeholders
   - Staggered delays (100ms increments)

4. **ProfileActivitySkeleton**:
   - Section header skeleton
   - 5 activity cards with:
     - 16x16 album artwork
     - Title, artist, timestamp text blocks
   - Staggered delays (80ms increments)

#### Design Features:
- **Dark Metal Aesthetic**: Uses `bg-secondary/50`, `bg-secondary/60`, etc.
- **Pulsing Animation**: Built-in `animate-pulse` class
- **Staggered Reveals**: Different animation delays prevent simultaneous pulsing
- **Exact Geometry**: Matches final component dimensions precisely

### Updated: `/src/components/skeletons/index.ts`
Exports all skeleton components for easy importing.

## 5. Integration with Existing Components

### Updated: `/src/components/VotingArea.tsx`
- Added `isLoading` state (1.2s simulated load time)
- Shows `VotingAreaSkeleton` during initial load
- Imported skeleton component from `/components/skeletons`

### Updated: `/src/components/ProfileView.tsx`
- Added `isLoadingStats` state (800ms simulated load time)
- Imported `ProfileStatsSkeleton` and `ProfileActivitySkeleton`
- Ready for integration in profile rendering logic

## 6. Benefits

### Performance:
- ✅ All images cached via WSRV.nl CDN
- ✅ WebP format for smaller file sizes
- ✅ Multi-resolution support (responsive images)
- ✅ Priority-based preloading
- ✅ Automatic cache management

### User Experience:
- ✅ Smooth blur-up transitions (no flash of missing content)
- ✅ Professional skeleton loading states
- ✅ Staggered animations feel organic
- ✅ Maintains dark metal aesthetic
- ✅ Immediate visual feedback

### Code Quality:
- ✅ Reusable hooks and components
- ✅ TypeScript type safety
- ✅ Maintains existing functionality
- ✅ Clean separation of concerns
- ✅ No breaking changes

## 7. Usage Examples

### Album Artwork with Progressive Loading:
```typescript
<AlbumArtwork
  src={track.albumArt}
  alt={`${track.artist} - ${track.title}`}
  size="medium"
  priority={8}  // Higher priority for visible tracks
  showLoadingIndicator={true}
/>
```

### Skeleton Loading in Components:
```typescript
import { VotingAreaSkeleton } from '@/components/skeletons';

if (isLoading) {
  return <VotingAreaSkeleton />;
}
```

### Direct WSRV URL Generation:
```typescript
import { artworkCacheService } from '@/services/artworkCacheService';

const lowResUrl = artworkCacheService.generateWsrvUrl(originalUrl, 40, 20);
const highResUrl = artworkCacheService.generateWsrvUrl(originalUrl, 400, 85);
```

## 8. Configuration

### Cache Settings (artworkCacheService):
- `maxCacheSize`: 200 images
- `batchSize`: 3 concurrent preloads
- `batchDelay`: 100ms between batches

### WSRV.nl Parameters:
- `w`: Width in pixels
- `q`: Quality (0-100)
- `output`: webp
- `we`: Without enlargement flag

### Image Sizes:
- Thumbnail: 40px @ 20% quality
- Low quality: 150px @ 50% quality
- High quality: 400px @ 85% quality

## 9. Next Steps

To complete the integration:
1. Add skeleton loading to remaining profile views (Band, DJ, Label)
2. Update chart loading states to show skeletons
3. Monitor WSRV.nl cache hit rates
4. Adjust quality/size settings based on performance metrics
5. Add error boundaries for failed image loads

## 10. Files Modified/Created

### Created:
- `/src/hooks/use-progressive-image.ts`
- `/src/components/skeletons/VotingAreaSkeleton.tsx`

### Modified:
- `/src/services/artworkCacheService.ts`
- `/src/components/AlbumArtwork.tsx`
- `/src/components/VotingArea.tsx`
- `/src/components/ProfileView.tsx`
- `/src/components/skeletons/index.ts`

All changes maintain backward compatibility and preserve existing functionality.
