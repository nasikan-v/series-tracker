# Series Tracker — Design Spec
**Date:** 2026-05-17

## Overview

A single-page web app for tracking Asian drama series. Displays a monthly calendar showing which series air on each day, alongside a collapsible sidebar of all tracked shows. Data is stored in localStorage; no backend required. Optional integration with an unofficial MyDramaList API to auto-fill show details.

---

## Architecture

**Approach:** Vanilla JS ES modules, no build step. Run locally with `npx serve .` or VS Code Live Server.

```
series-tracker/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js        — entry point, wires modules together, initialises state
    ├── calendar.js   — renders monthly grid, handles prev/next navigation
    ├── shows.js      — show CRUD, card rendering, expanded panel, sidebar filters
    ├── storage.js    — localStorage read/write wrapper
    └── mdl.js        — MyDramaList API calls and response mapping
```

**Default viewport:** 1440px wide.

---

## Data Model

Stored in localStorage as a single JSON object under the key `seriesTracker`.

```jsonc
{
  "shows": [
    {
      "id": "uuid-v4",
      "title": "Queen of Tears",
      "status": "watching",           // "plan_to_watch" | "watching" | "completed" | "dropped"
      "watchedEpisodes": 8,
      "totalEpisodes": 16,
      "platform": "Netflix",          // from fixed list
      "airDays": ["Fri", "Sat"],      // days of week this show airs
      "airStartDate": "2024-03-23",   // ISO date string
      "airEndDate": "2024-05-12",     // ISO date string

      // Optional — populated from MDL API
      "mdlUrl": "https://mydramalist.com/738281-queen-of-tears",
      "synopsis": "...",
      "genres": ["Romance", "Comedy", "Drama"],
      "country": "South Korea",
      "network": "tvN",
      "rating": 8.8,
      "posterUrl": null               // reserved, not fetched in v1
    }
  ]
}
```

**Calendar logic:** a show appears on a calendar day if that day falls within `airStartDate`–`airEndDate` and the day-of-week matches one of `airDays`.

---

## Platform List

Fixed dropdown options (in order):
Netflix, Viki, WeTV, iQIYI, Crunchyroll, Disney+, Amazon Prime, YouTube, GagaOOLala, Other

Each platform has a colour-coded logo badge (initials on coloured background) used on calendar chips and sidebar cards:

| Platform    | Badge | Colour  |
|-------------|-------|---------|
| Netflix     | N     | #E50914 |
| Viki        | V     | #1aacff |
| WeTV        | W     | #00bd96 |
| iQIYI       | iQ    | #00be06 |
| Crunchyroll | CR    | #F47521 |
| Disney+     | D+    | #1133cc |
| Amazon Prime| AP    | #FF9900 |
| YouTube     | YT    | #FF0000 |
| GagaOOLala  | GG    | #c9006b |
| Other       | ?     | #555555 |

---

## UI Components

### 1. Header Bar
- Left: month navigation (← Prev / month+year / Next →)
- Right: `+ Add Show` (primary button) · `☰ My Shows` (secondary toggle button)
- The toggle button collapses/expands the sidebar; gets a subtle purple tint when the sidebar is hidden

### 2. Calendar Grid
- 7-column grid (Mon–Sun), full width when sidebar is collapsed
- Each day cell shows:
  - Day number (today highlighted with ◉ indicator and purple border)
  - List of show chips for series airing that day, each chip shows: platform logo badge + show title
  - Each show gets a consistent chip colour derived from its position in the show list
- Empty cells (days before month start / after month end) rendered as dim placeholders

### 3. Sidebar — My Shows
- Width: 280px, collapsible via header toggle
- Filter tabs: All · Watching · Done · Plan (single-select; "Done" maps to `completed` status)
- Show cards (compact):
  - Platform logo + title
  - Episode count (e.g. "Ep 8 / 16")
  - Status badge (colour-coded)
  - Progress bar
  - Click opens expanded panel

### 4. Add / Edit Show Modal
Opens as a centred overlay with backdrop.

Sections:
1. **MyDramaList (optional)** — URL input + "Pull Data" button; auto-fills fields below on success
2. **Show details:**
   - Title (text input)
   - Status (pill toggle: Plan to Watch / Watching / Completed / Dropped)
   - Episodes watched + Total episodes (number inputs)
   - Platform (dropdown from fixed list)
   - Air start date + Air end date (date pickers)
   - Airs on (Mon–Sun day toggles, multi-select)

Buttons: Cancel · Save Show

### 5. Expanded Show Panel
Opens as a right-side overlay when clicking a show card. Contains:

- **Header:** poster placeholder · platform logo + title · country / network / year · status badge · Edit and Delete buttons · ✕ close
- **Progress section:** progress bar + episode stepper (− / episode N / + buttons)
- **Air schedule:** airs on days, platform, start/end dates (read-only grid)
- **Details (from MDL):** rating, country, network, year, genres, synopsis — shown only after MDL pull
- **MyDramaList section:**
  - If URL saved: link + "↻ Refresh" button
  - If no URL: dashed prompt box with "+ Add MDL Link" button

---

## MyDramaList API Integration

**API base:** `https://my-drama-list-api-ten.vercel.app`

**Trigger points:**
1. "Pull Data" in the Add/Edit modal — extracts show slug from pasted MDL URL, calls the API, maps response onto form fields; user reviews before saving
2. "↻ Refresh" in expanded panel — re-fetches and merges updated data, preserving user fields (status, watched episodes, platform, air days)

**Field mapping** (API response → data model):
- title → `title`
- episodes → `totalEpisodes`
- synopsis/description → `synopsis`
- genres → `genres`
- country → `country`
- network → `network`
- rating → `rating`

**Error handling:** if the API call fails (network error or non-200), show a non-blocking inline message: *"Couldn't reach MDL — fill fields manually."* The form remains fully usable. No retries.

**CORS:** the Vercel-hosted API is expected to have permissive CORS. If blocked, document a workaround in the README (e.g. browser extension or simple proxy).

---

## Storage

`storage.js` exposes five functions:
- `loadShows()` → array of shows from localStorage
- `saveShows(shows)` → serialise and persist
- `addShow(show)` → append and save
- `updateShow(id, patch)` → merge patch and save
- `deleteShow(id)` → filter out and save

All other modules call these functions; no module accesses localStorage directly.

---

## Error Handling & Edge Cases

- **Empty month:** calendar renders normally with no chips
- **Overlapping air dates:** multiple shows on the same day stack vertically in the cell; no cap on count (cell height expands)
- **Missing MDL data:** all MDL fields are optional; the app works entirely without them
- **Invalid date range:** if `airEndDate` is before `airStartDate`, show a validation error on save
- **localStorage unavailable:** catch `SecurityError` on write; show a one-time warning banner

---

## Out of Scope (v1)

- Poster image fetching
- Multiple users / sync across devices
- Notifications / reminders for air dates
- Search / filter within the calendar
- Dark/light theme toggle (dark only)
