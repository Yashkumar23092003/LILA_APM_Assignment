import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import MapCanvas from './components/MapCanvas.jsx'
import FilterPanel from './components/FilterPanel.jsx'
import PlaybackBar from './components/PlaybackBar.jsx'
import PlayerList from './components/PlayerList.jsx'
import ZoneStats from './components/ZoneStats.jsx'

const DEFAULT_FILTERS = {
  selectedMap: 'AmbroseValley',
  selectedDate: '',
  selectedMatch: '',
  showHumans: true,
  showBots: true,
  selectedPlayer: null,
  activeEvents: ['Kill','Killed','BotKill','BotKilled','KilledByStorm','Loot'],
}

// Compute optimal square canvas size using BOTH viewport width and height
function computeCanvasSize() {
  const LEFT_W  = 220   // filter sidebar
  const RIGHT_W = 260   // player panel
  const H_PAD   = 24 * 2 + 16 * 2  // outer padding + gaps
  const V_PAD   = 60 + 70 + 36 + 24 // header + playback + stats + padding
  const availW = window.innerWidth  - LEFT_W - RIGHT_W - H_PAD
  const availH = window.innerHeight - V_PAD
  return Math.min(Math.max(Math.min(availW, availH), 320), 840)
}

export default function App() {
  const [matchList,   setMatchList]   = useState([])
  const [matchData,   setMatchData]   = useState(null)
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS)
  const [playbackTime,setPlaybackTime]= useState(Infinity)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [speed,       setSpeed]       = useState(1)
  const [heatmapMode, setHeatmapMode] = useState(false)
  const [heatmapType, setHeatmapType] = useState('position')
  const [showPaths,   setShowPaths]   = useState(true)
  const [loading,       setLoading]       = useState(false)
  const [canvasSize,    setCanvasSize]    = useState(600)
  const [showClusters,  setShowClusters]  = useState(false)   // F2 — opt-in toggle

  const [aggregateMode, setAggregateMode] = useState(false)
  const [aggregateData, setAggregateData] = useState(null)
  const [aggLoading,    setAggLoading]    = useState(false)
  const [zoneMode,      setZoneMode]      = useState(false)   // F3 — power-user tool
  const [zoneStats,     setZoneStats]     = useState(null)

  useLayoutEffect(() => {
    const update = () => setCanvasSize(computeCanvasSize())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    fetch('./data/matches.json').then(r => r.json()).then(setMatchList).catch(console.error)
  }, [])

  useEffect(() => {
    if (!filters.selectedMatch) { setMatchData(null); return }
    setLoading(true)
    fetch(`./data/${filters.selectedMatch}.json`)
      .then(r => r.json())
      .then(data => { setMatchData(data); setPlaybackTime(Infinity); setIsPlaying(false); setZoneStats(null); setLoading(false) })
      .catch(e => { console.error(e); setLoading(false) })
  }, [filters.selectedMatch])

  useEffect(() => {
    const mapId = filters.selectedMap || matchData?.map_id
    if (!aggregateMode || !mapId) return
    setAggLoading(true)
    fetch(`./data/aggregate_${mapId}.json`)
      .then(r => r.json())
      .then(data => { setAggregateData(data); setAggLoading(false) })
      .catch(e => { console.error(e); setAggLoading(false) })
  }, [aggregateMode, filters.selectedMap, matchData?.map_id])

  useEffect(() => { if (!aggregateMode) setAggregateData(null) }, [aggregateMode])

  const updateFilters = useCallback(changes => setFilters(prev => ({ ...prev, ...changes })), [])
  const handleZoneSelect = useCallback(stats => setZoneStats(stats), [])

  const maxTime = matchData
    ? Math.max(...matchData.players.flatMap(p => p.events.map(e => e.ts_norm_ms)), 1000)
    : 10000

  const activeMapId = filters.selectedMap || matchData?.map_id || '—'

  const hasMatch    = !!matchData && !loading
  const showAggOnly = aggregateMode && !filters.selectedMatch

  return (
    <div style={T.app}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={T.header}>
        <div style={T.brand}>
          <div style={T.brandIcon}>▲</div>
          <div>
            <div style={T.brandName}>LILA Journey Viewer</div>
            <div style={T.brandSub}>LILA BLACK · Telemetry Explorer</div>
          </div>
        </div>

        {/* Match context pill */}
        {matchData && (
          <div style={T.matchPill}>
            <span style={T.mapBadge}>{matchData.map_id}</span>
            <span style={T.pilldot}></span>
            <span style={T.pillText}>{matchData.date?.replace('_',' ')}</span>
            <span style={T.pilldot}></span>
            <span style={{ ...T.pillText, color: '#60a5fa' }}>👤 {matchData.human_count}</span>
            <span style={T.pilldot}></span>
            <span style={{ ...T.pillText, color: '#f472b6' }}>🤖 {matchData.bot_count}</span>
            <span style={T.pilldot}></span>
            <span style={{ ...T.pillText, color: '#94a3b8' }}>⚡ {matchData.total_events}</span>
          </div>
        )}

        {/* Layer + tool controls */}
        <div style={T.controls}>
          {/* Primary layer tools */}
          <div style={T.ctrlGroup}>
            <ToolBtn active={showPaths} onClick={() => setShowPaths(v => !v)} icon="🛤" label="Paths" />
            <ToolBtn
              active={heatmapMode && !aggregateMode}
              onClick={() => { setHeatmapMode(v => !v); setAggregateMode(false) }}
              icon="🌡" label="Heatmap"
            />
            <ToolBtn
              active={aggregateMode}
              onClick={() => { setAggregateMode(v => !v); setHeatmapMode(false) }}
              icon="📊" label="Cross-Match"
              accent="#a78bfa"
            />
          </div>

          {(heatmapMode || aggregateMode) && (
            <select style={T.catSelect} value={heatmapType} onChange={e => setHeatmapType(e.target.value)}>
              <option value="position">Position</option>
              <option value="kills">Kills</option>
              <option value="deaths">Deaths</option>
              <option value="loot">Loot</option>
            </select>
          )}

          {/* Secondary analysis toggle — F2 clusters as explicit opt-in */}
          <div style={T.ctrlGroup}>
            <ToolBtn
              active={showClusters}
              onClick={() => setShowClusters(v => !v)}
              icon="🔴" label="Clusters"
              accent="#ef4444"
            />
          </div>

          {/* Power-user / advanced — F3 zone tool, visually demoted */}
          <div style={T.ctrlGroupGhost}>
            <button
              style={{
                ...T.ghostBtn,
                borderColor: zoneMode ? '#475569' : '#1a2333',
                color:       zoneMode ? '#94a3b8' : '#2d4060',
                background:  zoneMode ? '#1e2e4722' : 'transparent',
              }}
              onClick={() => { setZoneMode(v => !v); if (zoneMode) setZoneStats(null) }}
              title="Advanced: drag a zone rectangle on the map to compute area stats"
            >
              🎯 Zone analysis
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────── */}
      <div style={T.main}>

        {/* LEFT: Filters */}
        <aside style={T.aside}>
          <FilterPanel filters={filters} onChange={updateFilters} matchList={matchList} />
        </aside>

        {/* CENTER: Canvas + Playback */}
        <div style={T.center}>
          {showAggOnly ? (
            aggLoading ? (
              <div style={{ ...T.emptyState, width: canvasSize, height: canvasSize }}>
                <Spinner /><p style={T.emptyText}>Loading {activeMapId} aggregate…</p>
              </div>
            ) : aggregateData ? (
              <MapCanvas
                matchData={null} filters={filters} playbackTime={Infinity}
                heatmapMode={false} heatmapType={heatmapType}
                aggregateMode={aggregateMode} aggregateData={aggregateData}
                showPaths={false} canvasSize={canvasSize}
                showClusters={false} zoneMode={false} onZoneSelect={handleZoneSelect}
              />
            ) : (
              <div style={{ ...T.emptyState, width: canvasSize, height: canvasSize }}>
                <div style={T.emptyIcon}>📊</div>
                <p style={T.emptyText}>Select a map to load<br/>cross-match aggregate</p>
              </div>
            )
          ) : !filters.selectedMatch ? (
            <div style={{ ...T.emptyState, width: canvasSize, height: canvasSize }}>
              <div style={T.emptyIcon}>🗺️</div>
              <p style={T.emptyText}>Select a match to begin</p>
              <p style={T.emptyHint}>{matchList.length} matches available</p>
            </div>
          ) : loading ? (
            <div style={{ ...T.emptyState, width: canvasSize, height: canvasSize }}>
              <Spinner /><p style={T.emptyText}>Loading match…</p>
            </div>
          ) : (
            <MapCanvas
              matchData={matchData} filters={filters} playbackTime={playbackTime}
              heatmapMode={heatmapMode && !aggregateMode} heatmapType={heatmapType}
              aggregateMode={aggregateMode} aggregateData={aggregateData}
              showPaths={showPaths} canvasSize={canvasSize}
              showClusters={showClusters}
              zoneMode={zoneMode} onZoneSelect={handleZoneSelect}
            />
          )}

          {zoneMode && !hasMatch && aggregateMode && (
            <p style={T.hint}>Load a match to use zone analysis</p>
          )}
          {zoneMode && hasMatch && (
            <p style={T.hint}>🎯 Drag a rectangle on the map to analyse that area</p>
          )}

          {/* Playback bar */}
          {hasMatch && (
            <div style={{ marginTop: 12 }}>
              <PlaybackBar
                maxTime={maxTime}
                currentTime={playbackTime === Infinity ? maxTime : playbackTime}
                isPlaying={isPlaying}
                speed={speed}
                onTimeChange={setPlaybackTime}
                onPlayPause={() => {
                  if (playbackTime === Infinity || playbackTime >= maxTime) setPlaybackTime(0)
                  setIsPlaying(v => !v)
                }}
                onSpeedChange={setSpeed}
              />
            </div>
          )}

          {/* Aggregate stats strip */}
          {aggregateMode && aggregateData && (
            <div style={T.aggStrip}>
              <AggPill color="#a78bfa" icon="📊" label={aggregateData.map_id} />
              <AggPill color="#94a3b8" icon="🗂" label={`${aggregateData.total_matches} matches`} />
              <AggPill color="#60a5fa" icon="📍" label={`${aggregateData.categories.position.length.toLocaleString()} positions`} />
              <AggPill color="#ef4444" icon="⚔️" label={`${aggregateData.categories.kills.length} kills`} />
              <AggPill color="#f59e0b" icon="💀" label={`${aggregateData.categories.deaths.length} deaths`} />
              <AggPill color="#10b981" icon="🎁" label={`${aggregateData.categories.loot.length} loot`} />
            </div>
          )}
        </div>

        {/* RIGHT: Player list + stats */}
        {(hasMatch || (aggregateMode && aggregateData)) && (
          <aside style={T.rightPanel}>
            {hasMatch && (
              <PlayerList
                players={matchData.players}
                selectedPlayer={filters.selectedPlayer}
                onSelect={uid => updateFilters({ selectedPlayer: uid })}
              />
            )}
            {zoneMode && <ZoneStats stats={zoneStats} onClear={() => setZoneStats(null)} />}
          </aside>
        )}
      </div>
    </div>
  )
}

// ── Shared small components ─────────────────────────────────────

function ToolBtn({ active, onClick, icon, label, accent = '#60a5fa' }) {
  return (
    <button
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
        fontSize: '12px', fontWeight: 600, border: '1.5px solid',
        transition: 'all 0.15s',
        borderColor: active ? accent : '#1e2e47',
        background:  active ? accent + '22' : 'transparent',
        color:       active ? accent : '#475569',
      }}
      onClick={onClick}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function AggPill({ color, icon, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color }}>
      {icon} {label}
    </span>
  )
}

function Spinner() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #1e2e47', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Theme tokens ────────────────────────────────────────────────

const T = {
  app:       { height: '100vh', overflow: 'hidden', background: '#080c14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", display: 'flex', flexDirection: 'column' },

  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '60px', borderBottom: '1px solid #1e2e47', gap: '16px', flexShrink: 0 },
  brand:     { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  brandIcon: { width: 28, height: 28, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: 700 },
  brandName: { fontSize: '15px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 },
  brandSub:  { fontSize: '11px', color: '#334155', lineHeight: 1.2 },

  matchPill: { display: 'flex', alignItems: 'center', gap: '10px', background: '#0d1320', border: '1px solid #1e2e47', borderRadius: '20px', padding: '5px 14px', flexShrink: 0 },
  mapBadge:  { fontSize: '11px', fontWeight: 700, background: '#1e2e47', color: '#60a5fa', borderRadius: '4px', padding: '2px 6px' },
  pilldot:   { width: 3, height: 3, borderRadius: '50%', background: '#2d3f5a', display: 'inline-block' },
  pillText:  { fontSize: '12px', color: '#64748b' },

  controls:      { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  ctrlGroup:     { display: 'flex', gap: '6px', padding: '0 4px', borderLeft: '1px solid #1e2e47' },
  ctrlGroupGhost:{ display: 'flex', gap: '6px', padding: '0 4px', borderLeft: '1px solid #131c2e', marginLeft: '4px' },
  catSelect:     { background: '#0d1320', border: '1px solid #1e2e47', color: '#a78bfa', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' },
  ghostBtn:      { padding: '5px 10px', borderRadius: '6px', border: '1px dashed', cursor: 'pointer', fontSize: '11px', fontWeight: 500, transition: 'all 0.15s' },

  main:      { display: 'flex', gap: '16px', padding: '16px 24px', flex: 1, minHeight: 0, overflow: 'hidden' },
  aside:     { width: '220px', flexShrink: 0, overflowY: 'auto' },
  center:    { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, alignItems: 'flex-start' },
  rightPanel:{ width: '260px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0' },

  emptyState:{ maxWidth: '100%', background: '#0d1320', borderRadius: '12px', border: '1px dashed #1e2e47', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  emptyIcon: { fontSize: '40px', lineHeight: 1 },
  emptyText: { fontSize: '14px', color: '#475569', textAlign: 'center', lineHeight: 1.6 },
  emptyHint: { fontSize: '12px', color: '#2d3f5a' },

  hint:      { fontSize: '12px', color: '#3b82f6', marginTop: '8px', fontStyle: 'italic' },
  aggStrip:  { display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap', padding: '8px 12px', background: '#0d1320', borderRadius: '8px', border: '1px solid #1e2e47' },
}
