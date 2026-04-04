# ARTWORK LOADING REQUIREMENTS

## CRITICAL: REAL ARTWORKS MUST BE DISPLAYED

### Requirements:
1. **ALWAYS display REAL album artwork** from iTunes/Odesli APIs
2. **NEVER use mock/placeholder artworks** in the chart tiles
3. **Show loading animation** (spinning music icon) while artwork is loading
4. **Display artwork in square format** in all chart entries
5. Artworks must be loaded for EVERY track using the trackEnrichmentService

### What must be shown in each chart tile:
- **Album artwork** (square image, NOT initials)
- **Track title** (large, prominent)
- **Artist name** (below title)
- **Chart position** (rank number)
- **Position change** (movement indicator)
- **Weeks in chart** (Wochen)
- **Votes count** (display only, not editable)

### Technical Implementation:
- Use `trackEnrichmentService.enrichTrack()` to fetch artwork from iTunes API
- Store artwork URL in `track.albumArt` field
- AlbumArtwork component shows loading animation while image loads
- Once loaded, display the real artwork image
- If loading fails, show music note icon as fallback (NOT initials)

### APIs Used:
- iTunes Search API: https://itunes.apple.com/search
- Odesli API: https://api.song.link/v1-alpha.1/links
- Both are queued and rate-limited in trackEnrichmentService

## DO NOT FORGET THIS!
