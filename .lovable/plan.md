
## Goal
Fix Health Zone cards to have a **fixed width** and use **flex-wrap** behavior so cards wrap to the next row when there isn't enough space — no text wrapping within cards, no overlapping.

## Problem Analysis
The current CSS grid layout (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`) forces a specific number of columns at each breakpoint. This means:
- On narrow viewports, each card gets squeezed to fit
- Text inside cards wraps/breaks unnaturally (e.g., "Blo\nd", "Metab\noli\nsm")
- The circular progress ring can overlap with wrapped text

## Solution
Switch from CSS Grid to **Flexbox with wrap** and give each card a **fixed minimum width**:

1. Cards will have a fixed width (e.g., `w-[160px]` or `min-w-[160px]`)
2. Container uses `flex flex-wrap gap-4` 
3. Cards that don't fit on the current row wrap to the next row
4. Text inside cards stays on one line (using `whitespace-nowrap`)

## Files to Edit

### 1. `src/components/shared/HealthZoneCard.tsx`
- Remove all `break-words`, `hyphens-auto`, `whitespace-normal` from text elements
- Add `whitespace-nowrap` to ensure text never wraps
- Text will naturally stay on one line since the card has a fixed width

### 2. `src/pages/Dashboard.tsx`
Change the Health Zones grid container (around line 223):
```tsx
// Before
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

// After  
<div className="flex flex-wrap gap-4">
```

Add fixed width to each card via className prop:
```tsx
<SharedHealthZoneCard
  ...
  className="w-[160px]"
/>
```

### 3. `src/components/dashboard/DashboardPlaceholders.tsx`
Apply the same flex-wrap container and fixed-width styling to the placeholder/skeleton cards for consistency.

## Visual Result
- Each card is exactly 160px wide
- Cards sit in a row until they run out of space
- Extra cards wrap to the next row
- Text like "Metabolism", "Hormones" stays on one line
- No overlap with the circular progress ring
