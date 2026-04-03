# Dark Charts - Heavy Metal & Gothic Music Charts Platform

Dark Charts is a brutal, unapologetically dark music charting platform for the Heavy Metal, Gothic, Dark Wave, and EBM underground scene.

**Experience Qualities**:
1. **Brutal** - Raw, aggressive design that doesn't apologize for its darkness, with sharp edges and high-contrast brutalist aesthetics
2. **Immersive** - Deep, atmospheric experience that pulls users into the underground music scene with tactile interactions and visceral feedback
3. **Precise** - Clinical data presentation with industrial mono fonts and exact metrics that respect the user's intelligence

**Complexity Level**: Light Application (multiple features with basic state)
The app presents chart data across multiple categories with custom weighting controls and tab-based navigation, maintaining moderate state without requiring complex backend integration initially.

## Essential Features

**Multi-Category Chart Display**
- Functionality: Display Top 3 tracks from Fan Charts, Expert Charts, and Streaming Charts simultaneously
- Purpose: Provide immediate overview of music trends across different authority sources
- Trigger: Initial page load / category tab selection
- Progression: User lands on dashboard → Top 3 from each category rendered side-by-side → User scans data → Clicks for detail
- Success criteria: All three chart categories render within 200ms, data clearly differentiated

**Chart Category Tabs**
- Functionality: Tab navigation to switch between Fan Charts, Expert Charts, Streaming Charts, and Custom Overall
- Purpose: Allow focused exploration of specific chart types without overwhelming the interface
- Trigger: User clicks tab header
- Progression: User clicks tab → Active state changes → Chart data filters → Results animate in
- Success criteria: Tab switching feels instant (<100ms), active state clearly visible

**Custom Weighting Slider Panel**
- Functionality: Three sliders (0-100%) allowing users to blend Fan/Expert/Streaming data into personalized Overall Chart
- Purpose: Empower users to create their own chart authority by mixing data sources
- Trigger: User adjusts any slider
- Progression: User drags slider → Percentage updates → Chart recalculates in real-time → Rankings shift smoothly
- Success criteria: Rankings update within 100ms of slider release, calculations feel responsive

**Genre Tag System**
- Functionality: Visual tags/badges for subgenres (Dark Wave, EBM, Death Metal, Gothic Rock, etc.)
- Purpose: Quick genre identification and potential filtering capability
- Trigger: Renders automatically with each track entry
- Progression: Track displays → Genre tags render below/beside → User can identify subgenre at a glance
- Success criteria: Tags visually distinct, readable, and consistent across all chart views

**Track Entry Display**
- Functionality: Show rank number, artist name, track title, genre tags, chart movement indicator, Spotify preview player, and voting buttons
- Purpose: Provide complete track information at a glance with visual hierarchy and interactive elements
- Trigger: Chart data loads
- Progression: Data fetches → Entries render with staggered animation → User reads information → Clicks play for preview or votes → Selects for more detail
- Success criteria: Information hierarchy clear, movement indicators (↑↓) instantly recognizable, Spotify embed loads smoothly

**Genre Filter System**
- Functionality: Filter tracks by genre with smooth transitions and category switching
- Purpose: Allow users to focus on specific subgenres within the dark music scene
- Trigger: User clicks genre filter button
- Progression: User clicks genre → Active filter updates → Chart filters with smooth animation → Filtered results display
- Success criteria: Filter switching feels instant, smooth category transitions, clear active state indication

**Voting System**
- Functionality: Anonymized vote counter with upvote/downvote buttons and animated count updates
- Purpose: Enable community engagement while maintaining user privacy
- Trigger: User clicks vote button (up or down arrow)
- Progression: User clicks vote → Vote registers → Count animates up/down → Visual feedback confirms action → Vote persists
- Success criteria: Vote animations smooth (spring physics), counts update within 100ms, no user identification exposed

**Spotify Integration**
- Functionality: Embedded Spotify player for real song previews
- Purpose: Allow users to listen to tracks directly within the chart interface
- Trigger: User clicks play button or track entry
- Progression: User clicks play → Spotify embed loads → 30s preview plays → User can pause/resume → Player collapses when done
- Success criteria: Embeds load within 500ms, playback is smooth, controls are intuitive

**Chart History View**
- Functionality: Weekly snapshots of chart rankings showing track movements over past 12 weeks
- Purpose: Track artist progression and historical chart performance
- Trigger: User navigates to History view via menu
- Progression: User selects history → View loads with current week → User selects chart type (Fan/Expert/Streaming) → Sees movers section (risers, fallers, new entries, re-entries) → Browses past weeks via dropdown → Rankings display with movement indicators
- Success criteria: History loads within 300ms, movement indicators (arrows with +/- values) clearly visible, week selection responsive, visual distinction between risers (green), fallers (red), and stable (neutral)

## Edge Case Handling

- **Empty Chart Data**: Display haunting empty state with skull iconography and "No souls ranked yet" message
- **Slider Total > 100%**: Auto-normalize sliders proportionally so sum always equals 100%
- **Network Failure**: Show brutal error state with stark red borders and retry mechanism
- **Tie Rankings**: Display tied tracks at same rank with equal visual weight
- **Genre Overflow**: Limit to 3 most relevant tags, add "+N more" indicator if needed
- **Loading States**: Show skeleton loaders with dark pulse animation, never blank white screens

## Design Direction

The design should feel like entering an underground metal venue—dark, uncompromising, industrial, and intentionally uncomfortable for mainstream tastes. Every element should communicate weight, substance, and rebellion against sanitized modern web design. The interface should feel tactile and physical, like rusted metal and worn concrete, while maintaining clinical precision in data presentation.

## Color Selection

A brutalist palette built on extreme darkness with violent accent colors that scream against the void.

- **Primary Color**: Blood Red `oklch(0.55 0.22 25)` - Aggressive, visceral, commands attention for primary actions and active states
- **Secondary Colors**: 
  - Deep Void Black `oklch(0.12 0 0)` - Primary background, the abyss
  - Industrial Anthracite `oklch(0.18 0 0)` - Card backgrounds, layered depth
  - Concrete Gray `oklch(0.35 0 0)` - Inactive elements, borders
- **Accent Color**: Toxic Neon Violet `oklch(0.65 0.28 310)` - Electric, unnatural, used for sliders and interactive hover states
- **Foreground/Background Pairings**: 
  - Deep Void Black `oklch(0.12 0 0)`: Stark White `oklch(0.95 0 0)` - Ratio 13.8:1 ✓
  - Industrial Anthracite `oklch(0.18 0 0)`: Light Gray `oklch(0.85 0 0)` - Ratio 10.2:1 ✓
  - Blood Red `oklch(0.55 0.22 25)`: White `oklch(0.95 0 0)` - Ratio 4.9:1 ✓
  - Toxic Neon Violet `oklch(0.65 0.28 310)`: Black `oklch(0.12 0 0)` - Ratio 6.2:1 ✓

## Font Selection

Typography should be brutally functional—industrial for display, clinical for data.

- **Display Font**: Righteous (Google Fonts) - Heavy, blocky, industrial display font for headlines and chart titles
- **Data Font**: JetBrains Mono (Google Fonts) - Clinical monospace for track listings, rankings, and slider percentages
- **UI Font**: Space Grotesk (Google Fonts) - Geometric sans for body text and navigation

- **Typographic Hierarchy**: 
  - H1 (App Title): Righteous Bold / 48px / tight tracking / uppercase
  - H2 (Chart Category): Righteous Bold / 32px / normal tracking / uppercase
  - H3 (Section Headers): Space Grotesk Bold / 20px / wide tracking / uppercase
  - Track Artist: JetBrains Mono Medium / 18px / normal tracking
  - Track Title: JetBrains Mono Regular / 16px / normal tracking
  - Rank Numbers: Righteous Bold / 56px / ultra-tight tracking
  - Slider Values: JetBrains Mono Bold / 14px / tabular-nums
  - Genre Tags: Space Grotesk Medium / 12px / uppercase / wide tracking

## Animations

Animations should feel mechanical and deliberate, like industrial machinery engaging—no organic easing curves, only precise mechanical motion and satisfying snap interactions.

- Tab switches use sharp 150ms transitions with linear easing
- Slider interactions trigger immediate visual feedback with 100ms snap-back on release
- Chart ranking changes slide vertically with staggered 200ms delays for dramatic effect
- Hover states engage instantly with color shifts and subtle scale transforms
- Loading states pulse with slow 2s dark-to-darker breathing effect
- Page transitions cut sharply without blur, 250ms maximum

## Component Selection

- **Components**: 
  - Tabs (Shadcn) - Modified with sharp edges, blood-red active indicator bar
  - Slider (Shadcn) - Heavily customized with toxic violet track, oversized thumb with percentage display
  - Card (Shadcn) - Stripped of default padding, sharp corners, concrete gray borders
  - Badge (Shadcn) - Transformed into brutal genre tags with mono font and borders
  - Separator (Shadcn) - Rendered as harsh horizontal rules dividing sections
  - Skeleton (Shadcn) - Dark pulse animation for loading states
  
- **Customizations**: 
  - Custom ChartEntry component with rank badge, movement indicator, and genre tag array
  - WeightingPanel component housing three synchronized sliders with real-time calculation display
  - CategoryGrid component for side-by-side Top 3 display with equal column widths
  - EmptyState component with skull icon and haunting messaging
  
- **States**: 
  - Buttons: Default has concrete border, hover shifts to blood red with toxic violet glow, active state adds inner shadow
  - Sliders: Dragging shows percentage tooltip above thumb, track fills with violet gradient
  - Tabs: Inactive gray text, active has blood red underline bar and white text
  - Cards: Subtle lift on hover with 2px toxic violet border appearing
  
- **Icon Selection**: 
  - Phosphor Icons: CaretUp/CaretDown for rank movement, Skull for empty states, Fire for trending, Crown for #1 rank, Sliders for weighting panel icon, ChartBar for chart categories
  
- **Spacing**: 
  - Base unit: 4px (1 tailwind unit)
  - Card padding: 6 (24px) 
  - Section gaps: 8 (32px)
  - Grid gaps: 6 (24px)
  - Tag spacing: 2 (8px)
  - Consistent 4 (16px) for inline element spacing
  
- **Mobile**: 
  - Dashboard stacks Top 3 categories vertically instead of horizontally
  - Tabs become horizontal scrollable strip with snap points
  - Sliders stack vertically with full-width labels above
  - Font sizes scale down 20% at mobile breakpoint
  - Touch targets minimum 44px for sliders and tabs
  - Side margins reduced to 4 (16px) on mobile
