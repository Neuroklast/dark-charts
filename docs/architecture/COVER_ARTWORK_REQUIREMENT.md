# CRITICAL: COVER ARTWORK DISPLAY REQUIREMENT

## ABSOLUTE REQUIREMENT
**ALWAYS display the REAL cover artwork images in ALL chart tiles - NEVER show placeholder initials!**

## Current Implementation Status
- Track data includes real `albumArt` URLs from Spotify CDN (e.g., `https://i.scdn.co/image/ab67616d0000b273...`)
- The AlbumArtwork component MUST display these real images in square format
- Fallback to artist initials is ONLY allowed when NO albumArt URL exists in the track data

## Component Requirements: AlbumArtwork.tsx
1. **Primary Display**: Show the actual `src` (albumArt URL) as an `<img>` tag
2. **Image Format**: Square aspect ratio (1:1)
3. **Fallback Behavior**: Only show artist initial if `src` is undefined/null/empty
4. **Loading State**: Brief loading indicator acceptable, but MUST resolve to showing real image
5. **Error Handling**: If image fails to load, retry or show error - but prefer showing image over placeholder

## Where Cover Art Must Appear
- ✅ ChartEntry.tsx - Full width chart entries (already implemented correctly)
- ✅ ChartCategory.tsx - Top 3 preview cards (already implemented correctly)  
- ✅ GenreCharts.tsx - Genre-specific chart views (uses ChartEntry, inherits correct behavior)
- ✅ TrackDetailModal.tsx - Track detail overlay (should already work)

## Data Flow
```
mockData.ts (albumArt URLs) 
  → Track type (albumArt?: string)
    → AlbumArtwork component (src prop)
      → <img src={track.albumArt} /> ✅ MUST DISPLAY REAL IMAGE
```

## NEVER DO THIS
❌ Show artist initials when albumArt URL exists
❌ Use placeholder avatars when real images are available
❌ Default to initials/placeholders in normal operation

## ALWAYS DO THIS
✅ Display real albumArt images from track.albumArt URL
✅ Square format (w-20 h-20 for medium, adjust for other sizes)
✅ Only use fallback initials when track.albumArt is actually missing from data
✅ Proper error handling and retry logic for failed image loads
