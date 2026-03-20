# LILA Player Journey Viewer — Architecture

## System Overview

The LILA Player Journey Viewer is a production-grade telemetry visualization tool for level designers. It ingests pre-processed player event data (position, kills, deaths, loot) and renders interactive player journeys on game minimaps using Canvas rendering.

**Key Goals:**
- Visualize 796 match timelines without backend infrastructure
- Support real-time scrubbing and filtering with 60 FPS playback
- Scale to 5+ players × 10k+ events per match
- Enable level design analysis (hotspots, flow patterns, death zones)

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Raw Player Telemetry (Parquet files)                            │
│ - Position samples (X, Y, Z, timestamp)                         │
│ - Events (Kill, Loot, Storm, etc.)                              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ scripts/preprocess.py                                           │
│ - Normalize timestamps (relative to match start)                │
│ - Map game coords (X,Z) → minimap pixel coords (px, py)        │
│ - Deduplicate events, filter by map/date                        │
│ - Output: matches.json + per-match JSON files                   │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ public/data/                                                    │
│ ├── matches.json (796 entries: map, date, player counts)        │
│ └── [match_id].json × 796 (players, events, timestamps)         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ React App (src/)                                                │
│ - Fetch matches.json on load                                   │
│ - Lazy-load per-match JSON on selection                         │
│ - Manage playback state (time, filters, heatmap mode)           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ MapCanvas (HTML5 Canvas)                                        │
│ - Draw minimap background (preloaded PNG/JPG)                   │
│ - Render player paths (polylines, color-coded)                  │
│ - Overlay event markers (circles, colored by event type)        │
│ - Apply heatmap filter (kernel density estimation)              │
│ - Scrub timeline: redraw only events ≤ playbackTime             │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Browser Display                                                 │
│ - 700×700 canvas viewport (responsive scaling)                  │
│ - Left sidebar: filters (map, date, match, events)              │
│ - Right sidebar: player roster (clickable to isolate)           │
│ - Bottom: playback bar (timeline, speed, reset)                 │
└─────────────────────────────────────────────────────────────────┘
```

## Stack Choices & Tradeoffs

| Choice | Alternative | Rationale |
|--------|-------------|-----------|
| **React 18 + Hooks** | Vue, Svelte, vanilla JS | Hooks simplify state logic; wide ecosystem; no backend coupling |
| **Canvas** | SVG, WebGL, D3 | Canvas excels at dense datasets (5k+ points); SVG DOM overhead too high; WebGL overkill for 2D |
| **Vite** | Webpack, Create React App | Fast HMR; 10x faster builds; minimal config; modern ESM tooling |
| **JSON + fetch** | GraphQL, REST API | Zero backend overhead; static deployment (Vercel); works offline; matches.json is cheap index |
| **Lazy loading** | Single bundle | Matches.json indexes all 796 → fetch only selected match → memory efficient |
| **Inline styles** | CSS modules, Tailwind | Rapid iteration; style coupling to component logic acceptable at this scale |

## Coordinate Mapping

### The Problem
Game world uses Unreal-style coordinates: X (west-east), Y (vertical, unused), Z (north-south).
Minimaps are pre-rendered PNG/JPG with fixed image dimensions (4320×4320, 2160×2158, 9000×9000).

### The Solution
**Per-map linear transformation:**

Given:
- Game origin (originX, originZ): world coordinate where minimap (0, 0) pixel should map
- Scale factor: ratio of world units per pixel
- Image dimensions: actual minimap image size (imgW, imgH)

Formula:
```
px = (gameX - originX) * scale
py = (gameZ - originZ) * scale
```

**Canvas scaling** (no distortion):
```
canvasPx = (px / imgW) * canvasWidth    // always 700
canvasPy = (py / imgH) * canvasHeight   // always 700
```

### Validation
All coordinates are pre-computed in the JSON (px, py fields). The preprocessing pipeline validates against known POIs (landmarks, spawn points). No runtime math required in the UI.

### Configuration
```js
MAP_CONFIG = {
  AmbroseValley: { scale: 900,  originX: -370, originZ: -473, imgW: 4320, imgH: 4320 },
  GrandRift:     { scale: 581,  originX: -290, originZ: -290, imgW: 2160, imgH: 2158 },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500, imgW: 9000, imgH: 9000 },
}
```

## Component Breakdown

| Component | Props | State | Role |
|-----------|-------|-------|------|
| **App.jsx** | none | matchList, matchData, filters, playbackTime, isPlaying, speed, heatmapMode | Container; fetches matches.json; manages all global state |
| **MapCanvas.jsx** | matchData, filters, playbackTime, heatmapMode, heatmapType, showPaths | imgRef (cache) | Core renderer; canvas drawing; path polylines; event markers; heatmap |
| **FilterPanel.jsx** | filters, onChange, matchList | none (stateless) | Map/date/match/event selectors; user input delegation |
| **PlaybackBar.jsx** | maxTime, currentTime, isPlaying, speed, callbacks | rafRef, lastRef | Timeline scrubber; playback animation; speed control |
| **PlayerList.jsx** | players, selectedPlayer, onSelect | none (stateless) | Player roster; click-to-isolate; event/position counts |

## Data Format Specifications

### matches.json
```json
[
  {
    "match_id": "abc123def456",
    "map_id": "AmbroseValley",
    "date": "February_10",
    "human_count": 3,
    "bot_count": 2,
    "total_events": 847,
    "player_count": 5
  }
  // ... 795 more entries
]
```

### [match_id].json
```json
{
  "match_id": "abc123def456",
  "map_id": "AmbroseValley",
  "date": "February_10",
  "human_count": 3,
  "bot_count": 2,
  "players": [
    {
      "user_id": "uuid-or-numeric-id",
      "is_bot": false,
      "events": [
        { "ts_norm_ms": 0,     "px": 1200.5, "py": 2100.3, "event": "Position" },
        { "ts_norm_ms": 500,   "px": 1210.2, "py": 2105.1, "event": "Position" },
        { "ts_norm_ms": 5000,  "px": 1500.0, "py": 2300.0, "event": "Kill" },
        { "ts_norm_ms": 15000, "px": 1450.0, "py": 2280.0, "event": "Killed" }
      ]
    },
    // ... more players
  ]
}
```

**Event Types:**
- Position, BotPosition: movement samples (polyline path)
- Kill, Killed, BotKill, BotKilled: PvP interactions (markers)
- KilledByStorm: storm casualty (marker)
- Loot: item pickup (marker)

## Performance Considerations

### Canvas Rendering
- **Why Canvas over DOM**: 5k+ points → would create 5k+ DOM nodes. Canvas single buffer for all.
- **Batching**: All path segments drawn in one ctx.stroke() call per player.
- **Heatmap**: Offscreen canvas with gradient blur; composited once at 0.65 alpha.
- **Optimization**: Only redraw on state change (filters, playback); useCallback prevents unnecessary canvas redraws.

### Data Loading
- **Lazy loading**: matches.json small (~50 KB); per-match files fetched on demand (~100–500 KB each).
- **Caching**: Image cache (imgRef) prevents re-fetching minimaps.
- **Timeline scrubbing**: Filter events client-side (ts_norm_ms ≤ playbackTime) rather than storing frame layers.

### Limitations & Mitigations
- **Large matches** (100+ players, 50k+ events): Consider server-side aggregation or event sampling.
- **Mobile**: 700px canvas is responsive; touch controls not implemented (design for desktop).
- **Playback animation**: requestAnimationFrame runs at 60 FPS; speed multiplier works by scaling delta time.

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│ npm run build                            │
│ → dist/ (index.html + JS bundle + CSS)   │
└──────────────────────┬───────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────┐
│ Static Hosting (Vercel, Netlify, S3)     │
│ - No compute required                    │
│ - Serve index.html on 404 (SPA)          │
│ - Cache-bust JS/CSS with content hashes  │
└──────────────────────┬───────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────┐
│ Browser                                  │
│ - Fetch index.html                       │
│ - Load JS bundle                         │
│ - Fetch public/data/matches.json         │
│ - Lazy-fetch per-match data              │
│ - Stream minimap PNGs/JPG                │
└──────────────────────────────────────────┘
```

**Cost Profile:**
- Static hosting: $0–20/month (Vercel free tier, Netlify free tier, or S3 + CloudFront)
- Data storage: ~50 MB (matches.json + 796 match files + 3 minimaps)
- Bandwidth: Low (no redundant re-fetches; browser caching headers)

## Assumptions & Limitations

### Assumptions
1. **Coordinates are validated**: preprocessing pipeline confirms px, py are within minimap bounds.
2. **Timestamps are monotonic**: ts_norm_ms always increases within a player's event stream.
3. **No real-time updates**: all data is static snapshots; no live ingestion.
4. **Single-player perspective**: UI shows multiple players but not true multiplayer simulation (like team fog-of-war).

### Known Limitations
1. **No multi-user synchronization**: Not designed for collaborative team analysis; single analyst at a time.
2. **Minimap distortion**: Unreal coordinate → 2D pixel mapping assumes orthographic projection; visual errors near map edges.
3. **No replay export**: Can record screenshots but not MP4 exports.
4. **Heatmap resolution**: Fixed radius=20px; no UI control for kernel smoothness.
5. **Event de-duplication**: If a player has Kill + Killed at same timestamp, both render; potential marker overlap.

### Future Enhancements
- Multi-player replay synchronization
- Event timeline graph (kill rate over time)
- Heat intensity calibration UI
- Vector field visualization (flow direction)
- Replay file export (JSON + PNG sequence)

## Development Workflow

```bash
# Install & develop
npm install
npm run dev          # Vite dev server, HMR on file change

# Pre-flight checks
npm run build        # Verify production bundle (no errors)
npm run preview      # Test production build locally

# Deployment
# Push to GitHub → Vercel auto-deploys main branch
```

**Key Files to Edit:**
- `src/utils/mapConfig.js`: Add maps, tweak colors/dates
- `src/components/MapCanvas.jsx`: Rendering logic (paths, markers, heatmap)
- `src/App.jsx`: Global state + data loading
- `public/data/`: Pre-process new match data here

