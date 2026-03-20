# LILA Player Journey Viewer

A production-ready web-based telemetry visualization tool for level designers to explore player movement and interaction data on game minimaps. Part of the LILA BLACK game analytics pipeline.

## Features

- **Interactive Minimap Viewer**: Load and explore 3D game worlds mapped to 2D minimaps (AmbroseValley, GrandRift, Lockdown)
- **Player Path Visualization**: Trace player movement with color-coded paths; distinct visual styles for humans vs bots (solid vs dashed lines)
- **Event Markers**: Overlay kills, deaths, loot pickups, and storm casualties with color-coded circles
- **Playback Control**: Scrub through match timeline with play/pause, speed controls (0.5x–10x), and time display
- **Advanced Filtering**: Filter by map, date, player type (human/bot), and event categories
- **Heatmap Overlay**: Visualize position density, kill zones, death zones, or loot clusters with kernel density estimation
- **Player Inspector**: Click players in the sidebar to isolate their journey; view event counts and position samples
- **Batch Match Selection**: Load from 796 pre-processed matches across 3 maps and 5 dates

## Stack

- **Frontend**: React 18 with Hooks
- **Rendering**: HTML5 Canvas (optimized for large datasets)
- **Build Tool**: Vite (fast HMR, production bundling)
- **Data Format**: JSON (matches.json index + per-match event data)
- **Deployment**: Static Vercel (no backend required)

## Quick Start

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  App.jsx                      # Main app container, state management
  components/
    MapCanvas.jsx              # Canvas rendering (paths, markers, heatmap)
    FilterPanel.jsx            # Map/date/match/event filters
    PlaybackBar.jsx            # Timeline scrubber + playback controls
    PlayerList.jsx             # Clickable player roster
  utils/
    mapConfig.js               # Coordinate mappings, color palette, event types
    heatmap.js                 # Kernel density heatmap renderer
public/
  data/
    matches.json               # Index of 796 matches
    [match_id].json            # Per-match player events (lazy-loaded)
  minimaps/
    AmbroseValley_Minimap.png  # 4320×4320 RGBA
    GrandRift_Minimap.png      # 2160×2158 RGBA
    Lockdown_Minimap.jpg       # 9000×9000 RGB
```

## Data Pipeline

1. **Raw Source**: Player telemetry parquet files (position, event, timestamp)
2. **Preprocessing**: `scripts/preprocess.py` converts parquet → JSON with coordinate mapping
3. **Indexing**: matches.json catalogs all 796 matches (map, date, player counts)
4. **Per-Match Data**: Individual JSON files loaded on-demand (lazy loading)
5. **UI Rendering**: React + Canvas renders paths and events in real time

Run preprocessing with:
```bash
python scripts/preprocess.py
```

## Coordinate Mapping

Game world coordinates (X, Y, Z) are mapped to minimap pixels using per-map configuration:

```js
const MAP_CONFIG = {
  AmbroseValley: { scale: 900,  originX: -370, originZ: -473, imgW: 4320, imgH: 4320 },
  GrandRift:     { scale: 581,  originX: -290, originZ: -290, imgW: 2160, imgH: 2158 },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500, imgW: 9000, imgH: 9000 },
}
```

Formula: `px = (X - originX) * scale`, `py = (Z - originZ) * scale`

**Note**: Coordinates are pre-computed in the JSON (px, py fields). The UI simply scales them to the canvas size:
```js
canvasPx = (px / imgW) * canvasWidth
canvasPy = (py / imgH) * canvasHeight
```

## Data Notes

- **Dates**: February 10–14, 2025. February 14 contains partial data (only first few matches).
- **Players**: Mix of humans and AI bots; each identified by user_id with is_bot flag.
- **Events**: Position samples (path), plus Kill/Killed/BotKill/BotKilled/KilledByStorm/Loot markers.
- **Event Timing**: All timestamps normalized to milliseconds (ts_norm_ms) from match start.

## Deployment

Deploy as a static site to Vercel, Netlify, or S3:

```bash
npm run build
# dist/ folder contains index.html and all assets
# Upload dist/ to your static host
```

No backend required. All data fetched from public/data/ and public/minimaps/.

## Known Limitations

- Canvas-based rendering does not support native browser text selection on overlays
- Heatmap performance degrades with 50k+ points; consider filtering to specific players
- Minimap images are not projection-corrected; visual distortion may occur near edges
- Timestamp synchronization relies on preprocessed ts_norm_ms values

## License

Internal tool for LILA BLACK development.
