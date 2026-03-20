import { useState, useEffect, useCallback } from 'react'
import MapCanvas from './components/MapCanvas.jsx'
import FilterPanel from './components/FilterPanel.jsx'
import PlaybackBar from './components/PlaybackBar.jsx'
import PlayerList from './components/PlayerList.jsx'

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
        setLoading(false)
      })
      .catch(e => { console.error(e); setLoading(false) })
  }, [filters.selectedMatch])

  const updateFilters = useCallback((changes) => {
    setFilters(prev => ({ ...prev, ...changes }))
  }, [])

  const maxTime = matchData
    ? Math.max(...matchData.players.flatMap(p => p.events.map(e => e.ts_norm_ms)), 1000)
    : 10000

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
          <button style={layerBtn(heatmapMode)} onClick={() => setHeatmapMode(!heatmapMode)}>🔥 Heatmap</button>
          {heatmapMode && (
            <select style={styles.hmSelect} value={heatmapType} onChange={e => setHeatmapType(e.target.value)}>
              <option value="position">Position Density</option>
              <option value="kills">Kill Zones</option>
              <option value="deaths">Death Zones</option>
              <option value="loot">Loot Zones</option>
            </select>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={styles.main}>
        {/* Left: filters */}
        <FilterPanel filters={filters} onChange={updateFilters} matchList={matchList} />

        {/* Center: map + playback */}
        <div style={styles.center}>
          {!filters.selectedMatch ? (
            <div style={styles.placeholder}>
              <div style={{ fontSize: '48px' }}>🗺️</div>
              <p style={{ color: '#475569', marginTop: '12px' }}>Select a match to begin</p>
              <p style={{ color: '#334155', fontSize: '13px' }}>{matchList.length} matches loaded</p>
            </div>
          ) : loading ? (
            <div style={styles.placeholder}>
              <p style={{ color: '#475569' }}>Loading match data...</p>
            </div>
          ) : (
            <MapCanvas
              matchData={matchData}
              filters={{ ...filters, selectedPlayer: filters.selectedPlayer }}
              playbackTime={playbackTime}
              heatmapMode={heatmapMode}
              heatmapType={heatmapType}
              showPaths={showPaths}
            />
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
        </div>

        {/* Right: player list */}
        {matchData && (
          <PlayerList
            players={matchData.players}
            selectedPlayer={filters.selectedPlayer}
            onSelect={uid => updateFilters({ selectedPlayer: uid })}
          />
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
  app: { minHeight: '100vh', background: '#0f1117', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1f2937', flexWrap: 'wrap', gap: '12px' },
  h1: { fontSize: '20px', fontWeight: 700, color: '#f8fafc', margin: 0 },
  sub: { fontSize: '12px', color: '#475569', margin: '4px 0 0' },
  headerControls: { display: 'flex', gap: '8px', alignItems: 'center' },
  hmSelect: { background: '#1a1f2e', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '13px' },
  main: { display: 'flex', gap: '20px', padding: '20px 24px', flex: 1, alignItems: 'flex-start', flexWrap: 'wrap' },
  center: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: '300px' },
  placeholder: { width: '700px', height: '700px', maxWidth: '100%', background: '#1a1f2e', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #1f2937' },
  statsRow: { display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' },
  stat: { fontSize: '12px', color: '#64748b' },
}
