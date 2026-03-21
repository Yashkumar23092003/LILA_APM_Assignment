import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'
import MapCanvas from './components/MapCanvas.jsx'
import FilterPanel from './components/FilterPanel.jsx'
import PlaybackBar from './components/PlaybackBar.jsx'
import PlayerList from './components/PlayerList.jsx'
import BotHumanStats from './components/BotHumanStats.jsx'
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

export default function App() {
  const [matchList, setMatchList] = useState([])
  const [matchData, setMatchData] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [playbackTime, setPlaybackTime] = useState(Infinity)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [heatmapMode, setHeatmapMode] = useState(false)
  const [heatmapType, setHeatmapType] = useState('position')
  const [showPaths, setShowPaths] = useState(true)
  const [loading, setLoading] = useState(false)
  const [canvasSize, setCanvasSize] = useState(600)
  const mapCanvasRef = useRef(null)

  // Feature 1: Cross-match aggregate heatmap
  const [aggregateMode, setAggregateMode] = useState(false)
  const [aggregateData, setAggregateData] = useState(null)
  const [aggLoading, setAggLoading] = useState(false)

  // Feature 3: Zone draw tool
  const [zoneMode, setZoneMode] = useState(false)
  const [zoneStats, setZoneStats] = useState(null)

  // Dynamically size canvas to fit viewport
  useLayoutEffect(() => {
    const update = () => {
      const available = window.innerHeight - 220
      setCanvasSize(Math.min(Math.max(available, 320), 700))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Load match index
  useEffect(() => {
    fetch('./data/matches.json')
      .then(r => r.json())
      .then(setMatchList)
      .catch(console.error)
  }, [])

  // Load match data when selectedMatch changes
  useEffect(() => {
    if (!filters.selectedMatch) { setMatchData(null); return }
    setLoading(true)
    fetch(`./data/${filters.selectedMatch}.json`)
      .then(r => r.json())
      .then(data => {
        setMatchData(data)
        setPlaybackTime(Infinity)
        setIsPlaying(false)
        setZoneStats(null)
        setLoading(false)
      })
      .catch(e => { console.error(e); setLoading(false) })
  }, [filters.selectedMatch])

  // Load aggregate data when map selection or aggregate mode changes
  useEffect(() => {
    const mapId = filters.selectedMap || (matchData?.map_id)
    if (!aggregateMode || !mapId) return
    setAggLoading(true)
    fetch(`./data/aggregate_${mapId}.json`)
      .then(r => r.json())
      .then(data => { setAggregateData(data); setAggLoading(false) })
      .catch(e => { console.error('Aggregate load error:', e); setAggLoading(false) })
  }, [aggregateMode, filters.selectedMap, matchData?.map_id])

  // Clear aggregate data when mode is toggled off
  useEffect(() => {
    if (!aggregateMode) setAggregateData(null)
  }, [aggregateMode])

  const updateFilters = useCallback((changes) => {
    setFilters(prev => ({ ...prev, ...changes }))
  }, [])

  const handleExport = () => {
    const canvas = mapCanvasRef.current?.getCanvas()
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `lila_${matchData?.map_id}_${matchData?.date}_${filters.selectedMatch?.slice(0,8)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleZoneSelect = useCallback((stats) => {
    setZoneStats(stats)
  }, [])

  const maxTime = matchData
    ? Math.max(...matchData.players.flatMap(p => p.events.map(e => e.ts_norm_ms)), 1000)
    : 10000

  // Active map (for aggregate mode header label)
  const activeMapId = filters.selectedMap || matchData?.map_id || '—'

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>LILA Player Journey Viewer</h1>
          <p style={styles.sub}>LILA BLACK · Telemetry Explorer · Level Design Tool</p>
        </div>
        <div style={styles.headerControls}>
          <button style={layerBtn(showPaths)} onClick={() => setShowPaths(!showPaths)}>🛤 Paths</button>
          <button style={layerBtn(heatmapMode && !aggregateMode)} onClick={() => { setHeatmapMode(!heatmapMode); setAggregateMode(false) }}>🔥 Heatmap</button>
          <button
            style={layerBtn(aggregateMode)}
            onClick={() => { setAggregateMode(!aggregateMode); setHeatmapMode(false) }}
            title="Cross-match aggregate heatmap — all matches on this map"
          >
            📊 Cross-Match
          </button>
          {(heatmapMode || aggregateMode) && (
            <select style={styles.hmSelect} value={heatmapType} onChange={e => setHeatmapType(e.target.value)}>
              <option value="position">Position Density</option>
              <option value="kills">Kill Zones</option>
              <option value="deaths">Death Zones</option>
              <option value="loot">Loot Zones</option>
            </select>
          )}
          <button
            style={layerBtn(zoneMode)}
            onClick={() => { setZoneMode(!zoneMode); if (zoneMode) setZoneStats(null) }}
            title="Draw a zone on the map to get stats for that area"
          >
            🎯 Zone
          </button>
          {matchData && (
            <button style={layerBtn(false)} onClick={handleExport} title="Export current view as PNG">
              📷 Export
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={styles.main}>
        {/* Left: filters */}
        <FilterPanel filters={filters} onChange={updateFilters} matchList={matchList} />

        {/* Center: map + playback */}
        <div style={styles.center}>
          {/* Aggregate mode — shows even without a selected match */}
          {aggregateMode && !filters.selectedMatch ? (
            <div style={{ ...styles.placeholder, width: canvasSize, height: canvasSize, position: 'relative' }}>
              {aggLoading ? (
                <p style={{ color: '#475569' }}>Loading aggregate data for {activeMapId}…</p>
              ) : aggregateData ? (
                <MapCanvas
                  ref={mapCanvasRef}
                  matchData={null}
                  filters={filters}
                  playbackTime={Infinity}
                  heatmapMode={false}
                  heatmapType={heatmapType}
                  aggregateMode={aggregateMode}
                  aggregateData={aggregateData}
                  showPaths={false}
                  canvasSize={canvasSize}
                  zoneMode={false}
                  onZoneSelect={handleZoneSelect}
                />
              ) : (
                <>
                  <div style={{ fontSize: '48px' }}>📊</div>
                  <p style={{ color: '#475569', marginTop: '12px' }}>Select a map to load cross-match data</p>
                </>
              )}
            </div>
          ) : !filters.selectedMatch ? (
            <div style={{ ...styles.placeholder, width: canvasSize, height: canvasSize }}>
              <div style={{ fontSize: '48px' }}>🗺️</div>
              <p style={{ color: '#475569', marginTop: '12px' }}>Select a match to begin</p>
              <p style={{ color: '#334155', fontSize: '13px' }}>{matchList.length} matches loaded</p>
            </div>
          ) : loading ? (
            <div style={{ ...styles.placeholder, width: canvasSize, height: canvasSize }}>
              <p style={{ color: '#475569' }}>Loading match data...</p>
            </div>
          ) : (
            <MapCanvas
              ref={mapCanvasRef}
              matchData={matchData}
              filters={{ ...filters, selectedPlayer: filters.selectedPlayer }}
              playbackTime={playbackTime}
              heatmapMode={heatmapMode && !aggregateMode}
              heatmapType={heatmapType}
              aggregateMode={aggregateMode}
              aggregateData={aggregateData}
              showPaths={showPaths}
              canvasSize={canvasSize}
              zoneMode={zoneMode}
              onZoneSelect={handleZoneSelect}
            />
          )}

          {/* Zone draw hint */}
          {zoneMode && (
            <p style={styles.zoneHint}>🎯 Drag on the map to select a zone and compute area stats</p>
          )}

          {/* Playback bar */}
          {matchData && (
            <div style={{ marginTop: '12px' }}>
              <PlaybackBar
                maxTime={maxTime}
                currentTime={playbackTime === Infinity ? maxTime : playbackTime}
                isPlaying={isPlaying}
                speed={speed}
                onTimeChange={setPlaybackTime}
                onPlayPause={() => {
                  if (playbackTime === Infinity || playbackTime >= maxTime) setPlaybackTime(0)
                  setIsPlaying(!isPlaying)
                }}
                onSpeedChange={setSpeed}
              />
            </div>
          )}

          {/* Match stats */}
          {matchData && (
            <div style={styles.statsRow}>
              <span style={styles.stat}>📍 {matchData.map_id}</span>
              <span style={styles.stat}>📅 {matchData.date?.replace('_',' ')}</span>
              <span style={styles.stat}>👤 {matchData.human_count} humans</span>
              <span style={styles.stat}>🤖 {matchData.bot_count} bots</span>
              <span style={styles.stat}>⚡ {matchData.players?.reduce((s,p)=>s+p.events.length,0)} events</span>
            </div>
          )}

          {/* Aggregate info bar */}
          {aggregateMode && aggregateData && (
            <div style={styles.statsRow}>
              <span style={{ ...styles.stat, color: '#60a5fa' }}>📊 {aggregateData.map_id}</span>
              <span style={styles.stat}>🗂 {aggregateData.total_matches} matches aggregated</span>
              <span style={styles.stat}>📍 {aggregateData.categories.position.length.toLocaleString()} positions</span>
              <span style={styles.stat}>⚔️ {aggregateData.categories.kills.length} kills</span>
              <span style={styles.stat}>💀 {aggregateData.categories.deaths.length} deaths</span>
            </div>
          )}
        </div>

        {/* Right: player list + stats + zone stats */}
        {matchData && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0', flexShrink:0, width:'200px', overflowY:'auto', maxHeight:'calc(100vh - 140px)' }}>
            <PlayerList
              players={matchData.players}
              selectedPlayer={filters.selectedPlayer}
              onSelect={uid => updateFilters({ selectedPlayer: uid })}
            />
            <BotHumanStats matchData={matchData} />
            {zoneMode && (
              <ZoneStats stats={zoneStats} onClear={() => setZoneStats(null)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const layerBtn = (active) => ({
  padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  background: active ? '#1e3a5f' : '#1a1f2e',
  border: `1.5px solid ${active ? '#60a5fa' : '#334155'}`,
  color: active ? '#60a5fa' : '#64748b',
  transition: 'all 0.15s',
})

const styles = {
  app: { height: '100vh', overflow: 'hidden', background: '#0f1117', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1f2937', flexWrap: 'wrap', gap: '12px' },
  h1: { fontSize: '20px', fontWeight: 700, color: '#f8fafc', margin: 0 },
  sub: { fontSize: '12px', color: '#475569', margin: '4px 0 0' },
  headerControls: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  hmSelect: { background: '#1a1f2e', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '13px' },
  main: { display: 'flex', gap: '20px', padding: '16px 24px', flex: 1, alignItems: 'flex-start', flexWrap: 'nowrap', overflow: 'hidden' },
  center: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: '300px' },
  placeholder: { width: '700px', height: '700px', maxWidth: '100%', background: '#1a1f2e', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #1f2937' },
  statsRow: { display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' },
  stat: { fontSize: '12px', color: '#64748b' },
  zoneHint: { fontSize: '12px', color: '#60a5fa', marginTop: '6px', fontStyle: 'italic' },
}
