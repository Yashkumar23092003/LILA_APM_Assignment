import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import MapCanvas from './components/MapCanvas.jsx'
import FilterPanel from './components/FilterPanel.jsx'
import PlaybackBar from './components/PlaybackBar.jsx'
import PlayerList from './components/PlayerList.jsx'
import ZoneStats from './components/ZoneStats.jsx'
import ZoneScorecard from './components/ZoneScorecard.jsx'

const DEFAULT_FILTERS = {
  selectedMap: 'AmbroseValley',
  selectedDate: '',
  selectedMatch: '',
  showHumans: true,
  showBots: true,
  selectedPlayer: null,
  activeEvents: ['Kill','Killed','BotKill','BotKilled','KilledByStorm','Loot'],
}

function computeCanvasSize() {
  const LEFT_W  = 280   // widened sidebar
  const RIGHT_W = 280   // widened sidebar
  const H_PAD   = 24 * 2 + 16 * 2  // outer padding + column gaps
  const V_PAD   = 60 + 70 + 36 + 28 // header + playback + strip + padding
  const availW  = window.innerWidth  - LEFT_W - RIGHT_W - H_PAD
  const availH  = window.innerHeight - V_PAD
  return Math.min(Math.max(Math.min(availW, availH), 320), 860)
}

export default function App() {
  const [matchList,    setMatchList]    = useState([])
  const [matchData,    setMatchData]    = useState(null)
  const [filters,      setFilters]      = useState(DEFAULT_FILTERS)
  const [playbackTime, setPlaybackTime] = useState(Infinity)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [speed,        setSpeed]        = useState(1)
  const [canvasSize,   setCanvasSize]   = useState(600)

  // ── Layer toggles ───────────────────────────────────────────────
  const [showPaths,      setShowPaths]      = useState(true)
  const [heatmapMode,    setHeatmapMode]    = useState(false)
  const [heatmapType,    setHeatmapType]    = useState('position')
  const [phaseMode,      setPhaseMode]      = useState('all')   // F#3 phase split
  const [showClusters,   setShowClusters]   = useState(false)   // F2 opt-in
  const [showDeadZones,  setShowDeadZones]  = useState(false)   // F#4
  const [showFlowVectors,setShowFlowVectors]= useState(false)   // F#5

  // ── Cross-match aggregate ───────────────────────────────────────
  const [aggregateMode,  setAggregateMode]  = useState(false)
  const [aggregateData,  setAggregateData]  = useState(null)
  const [aggLoading,     setAggLoading]     = useState(false)

  // ── Zone draw (advanced) ────────────────────────────────────────
  const [zoneMode,  setZoneMode]  = useState(false)
  const [zoneStats, setZoneStats] = useState(null)

  // ── Zone Balance Scorecard (F#1) ────────────────────────────────
  const [showScorecard,   setShowScorecard]   = useState(false)
  const [scorecardData,   setScorecardData]   = useState(null)
  const [scorecardLoading,setScorecardLoading]= useState(false)

  // ── Flow vector data (F#5) ──────────────────────────────────────
  const [flowVectorData, setFlowVectorData] = useState(null)

  const [loading, setLoading] = useState(false)

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

  // Load aggregate data
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

  // Load zone scorecard data
  useEffect(() => {
    const mapId = filters.selectedMap || matchData?.map_id
    if (!showScorecard || !mapId) return
    setScorecardLoading(true)
    fetch(`./data/zone_scorecard_${mapId}.json`)
      .then(r => r.json())
      .then(data => { setScorecardData(data); setScorecardLoading(false) })
      .catch(e => { console.error(e); setScorecardLoading(false) })
  }, [showScorecard, filters.selectedMap, matchData?.map_id])
  useEffect(() => { if (!showScorecard) setScorecardData(null) }, [showScorecard])

  // Load flow vector data
  useEffect(() => {
    const mapId = filters.selectedMap || matchData?.map_id
    if (!showFlowVectors || !mapId) return
    fetch(`./data/flow_vectors_${mapId}.json`)
      .then(r => r.json())
      .then(setFlowVectorData)
      .catch(console.error)
  }, [showFlowVectors, filters.selectedMap, matchData?.map_id])
  useEffect(() => { if (!showFlowVectors) setFlowVectorData(null) }, [showFlowVectors])

  const updateFilters  = useCallback(changes => setFilters(prev => ({ ...prev, ...changes })), [])
  const handleZoneSelect = useCallback(stats => setZoneStats(stats), [])

  const maxTime = matchData
    ? Math.max(...matchData.players.flatMap(p => p.events.map(e => e.ts_norm_ms)), 1000)
    : 10000

  const activeMapId = filters.selectedMap || matchData?.map_id || '—'
  const hasMatch    = !!matchData && !loading
  const showAggOnly = aggregateMode && !filters.selectedMatch

  // Effective heatmap type: includes 'landing' as a first-drop option
  const effectiveHeatType = heatmapType

  return (
    <div style={T.app}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={T.header}>
        <div style={T.brand}>
          <div style={T.brandIcon}>▲</div>
          <div>
            <div style={T.brandName}>LILA Journey Viewer</div>
            <div style={T.brandSub}>LILA BLACK · Level Design Tool</div>
          </div>
        </div>

        {matchData && (
          <div style={T.matchPill}>
            <span style={T.mapBadge}>{matchData.map_id}</span>
            <Dot/><span style={T.pillText}>{matchData.date?.replace('_',' ')}</span>
            <Dot/><span style={{ ...T.pillText, color:'#60a5fa' }}>👤 {matchData.human_count}</span>
            <Dot/><span style={{ ...T.pillText, color:'#f472b6' }}>🤖 {matchData.bot_count}</span>
            <Dot/><span style={{ ...T.pillText, color:'#94a3b8' }}>⚡ {matchData.total_events}</span>
          </div>
        )}

        <div style={T.controls}>
          {/* Primary layers */}
          <div style={T.ctrlGroup}>
            <ToolBtn active={showPaths} onClick={() => setShowPaths(v=>!v)} icon="🛤" label="Paths"
              tip="Draws each player's movement trail. Solid lines = humans, dashed = bots." />
            <ToolBtn
              active={heatmapMode && !aggregateMode}
              onClick={() => { setHeatmapMode(v=>!v); setAggregateMode(false) }}
              icon="🌡" label="Heatmap"
              tip="Shows density of player activity in this match. Hotter = more players passed through here."
            />
            <ToolBtn
              active={aggregateMode}
              onClick={() => { setAggregateMode(v=>!v); setHeatmapMode(false) }}
              icon="📊" label="Cross-Match"
              accent="#a78bfa"
              tip="Aggregates all 796 matches into one heatmap. Reveals long-term patterns across the entire map."
            />
          </div>

          {/* Heatmap type selector */}
          {(heatmapMode || aggregateMode) && (
            <select style={T.catSelect} value={heatmapType} onChange={e => { setHeatmapType(e.target.value); setPhaseMode('all') }}>
              <optgroup label="Standard">
                <option value="position">Position density</option>
                <option value="kills">Kill zones</option>
                <option value="deaths">Death zones</option>
                <option value="loot">Loot zones</option>
              </optgroup>
              {heatmapMode && !aggregateMode && (
                <optgroup label="Special">
                  <option value="landing">🪂 Landing / First drop</option>
                </optgroup>
              )}
            </select>
          )}

          {/* Phase tabs — only when single-match heatmap is on */}
          {heatmapMode && !aggregateMode && heatmapType !== 'landing' && (
            <div style={T.phaseTabs}>
              {(['all','early','mid','late']).map(p => (
                <button
                  key={p}
                  style={{ ...T.phaseTab, background: phaseMode === p ? '#1d4ed8' : 'transparent', color: phaseMode === p ? '#93c5fd' : '#334155', borderColor: phaseMode === p ? '#3b82f6' : '#1a2333' }}
                  onClick={() => setPhaseMode(p)}
                >
                  {{ all:'All', early:'Early', mid:'Mid', late:'Late' }[p]}
                </button>
              ))}
            </div>
          )}

          {/* Analysis overlays */}
          <div style={T.ctrlGroup}>
            <ToolBtn
              active={showScorecard}
              onClick={() => setShowScorecard(v=>!v)}
              icon="⬡" label="Scorecard"
              accent="#10b981"
              tip="Zone Balance Scorecard — K/D ratio, visit % and loot density per map zone, across all matches."
            />
            <ToolBtn
              active={showClusters}
              onClick={() => setShowClusters(v=>!v)}
              icon="🔴" label="Clusters"
              accent="#ef4444"
              tip="Top 3 locations where the most deaths occurred in this match. ①②③ = rank by % share of total deaths."
            />
            <ToolBtn
              active={showDeadZones}
              onClick={() => setShowDeadZones(v=>!v)}
              icon="☠" label="Dead zones"
              accent="#ef4444"
              tip="Highlights areas of the map rarely visited by players — potential wasted design space."
            />
            <ToolBtn
              active={showFlowVectors}
              onClick={() => setShowFlowVectors(v=>!v)}
              icon="↗" label="Flow"
              accent="#fb923c"
              tip="Shows the dominant movement direction per grid cell. Reveals how players navigate the map."
            />
          </div>

          {/* Advanced / power-user */}
          <div style={T.ctrlGroupGhost}>
            <Tooltip text="Advanced: drag a rectangle on the map to get stats (players, kills, deaths, loot) for any custom area.">
              <button
                style={{ ...T.ghostBtn, borderColor: zoneMode ? '#475569' : '#1a2333', color: zoneMode ? '#94a3b8' : '#2d4060', background: zoneMode ? '#1e2e4722' : 'transparent' }}
                onClick={() => { setZoneMode(v=>!v); if (zoneMode) setZoneStats(null) }}
              >
                🎯 Zone analysis
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────── */}
      <div style={T.main}>

        {/* LEFT: Filters */}
        <aside style={T.aside}>
          <FilterPanel filters={filters} onChange={updateFilters} matchList={matchList} />
        </aside>

        {/* CENTER: Canvas + Playback + Scorecard */}
        <div style={T.center}>
          {showAggOnly ? (
            aggLoading ? (
              <div style={{ ...T.emptyState, width: canvasSize, height: canvasSize }}>
                <Spinner /><p style={T.emptyText}>Loading {activeMapId} aggregate…</p>
              </div>
            ) : aggregateData ? (
              <MapCanvas
                matchData={null} filters={filters} playbackTime={Infinity}
                heatmapMode={false} heatmapType={heatmapType} phaseMode="all"
                aggregateMode={aggregateMode} aggregateData={aggregateData}
                showPaths={false} canvasSize={canvasSize}
                showClusters={false} showDeadZones={false}
                showFlowVectors={showFlowVectors} flowVectorData={flowVectorData}
                zoneMode={false} onZoneSelect={handleZoneSelect}
              />
            ) : (
              <div style={{ ...T.emptyState, width: canvasSize, height: canvasSize }}>
                <div style={T.emptyIcon}>📊</div>
                <p style={T.emptyText}>Select a map to load cross-match data</p>
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
              heatmapMode={heatmapMode && !aggregateMode} heatmapType={effectiveHeatType}
              phaseMode={phaseMode}
              aggregateMode={aggregateMode} aggregateData={aggregateData}
              showPaths={showPaths} canvasSize={canvasSize}
              showClusters={showClusters} showDeadZones={showDeadZones}
              showFlowVectors={showFlowVectors} flowVectorData={flowVectorData}
              zoneMode={zoneMode} onZoneSelect={handleZoneSelect}
            />
          )}

          {zoneMode && hasMatch && (
            <p style={T.hint}>🎯 Drag a rectangle to analyse that area</p>
          )}

          {/* Zone Balance Scorecard — below map */}
          {showScorecard && (
            scorecardLoading ? (
              <div style={{ ...T.aggStrip, alignItems: 'center', gap: '10px', marginTop: 12 }}>
                <Spinner /> <span style={{ fontSize: '12px', color: '#475569' }}>Loading scorecard for {activeMapId}…</span>
              </div>
            ) : (
              <ZoneScorecard scorecardData={scorecardData} visible={showScorecard} />
            )
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
                  setIsPlaying(v=>!v)
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
            </div>
          )}
        </div>

        {/* RIGHT: Player list + zone stats — always rendered to keep grid stable */}
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
      </div>
    </div>
  )
}

// ── Shared components ────────────────────────────────────────────

// Tooltip — shows on hover, auto-hides on mouse-out
function Tooltip({ text, children }) {
  const [show, setShow] = useState(false)
  if (!text) return children
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#0d1320', border: '1px solid #1e2e47', borderRadius: '7px',
          padding: '8px 12px', fontSize: '11px', color: '#94a3b8',
          maxWidth: '220px', width: 'max-content', zIndex: 1000,
          pointerEvents: 'none', lineHeight: 1.55,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}>
          {text}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1e2e47' }} />
        </div>
      )}
    </div>
  )
}

function ToolBtn({ active, onClick, icon, label, accent = '#60a5fa', tip }) {
  return (
    <Tooltip text={tip}>
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
        <span>{icon}</span><span>{label}</span>
      </button>
    </Tooltip>
  )
}

function Dot() {
  return <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#2d3f5a', display: 'inline-block' }} />
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

// ── Theme tokens ─────────────────────────────────────────────────

const T = {
  app:           { height: '100vh', overflow: 'hidden', background: '#080c14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", display: 'flex', flexDirection: 'column' },
  header:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '60px', borderBottom: '1px solid #1e2e47', gap: '16px', flexShrink: 0, flexWrap: 'wrap' },
  brand:         { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  brandIcon:     { width: 28, height: 28, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: 700 },
  brandName:     { fontSize: '15px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 },
  brandSub:      { fontSize: '11px', color: '#334155', lineHeight: 1.2 },
  matchPill:     { display: 'flex', alignItems: 'center', gap: '10px', background: '#0d1320', border: '1px solid #1e2e47', borderRadius: '20px', padding: '5px 14px', flexShrink: 0 },
  mapBadge:      { fontSize: '11px', fontWeight: 700, background: '#1e2e47', color: '#60a5fa', borderRadius: '4px', padding: '2px 6px' },
  pillText:      { fontSize: '12px', color: '#64748b' },
  controls:      { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  ctrlGroup:     { display: 'flex', gap: '4px', padding: '0 6px', borderLeft: '1px solid #1e2e47' },
  ctrlGroupGhost:{ display: 'flex', gap: '4px', padding: '0 6px', borderLeft: '1px solid #131c2e', marginLeft: '2px' },
  catSelect:     { background: '#0d1320', border: '1px solid #1e2e47', color: '#a78bfa', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' },
  phaseTabs:     { display: 'flex', gap: '2px', background: '#0d1320', borderRadius: '7px', padding: '3px', border: '1px solid #1e2e47' },
  phaseTab:      { padding: '3px 9px', borderRadius: '5px', border: '1px solid', cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'all 0.12s' },
  ghostBtn:      { padding: '5px 10px', borderRadius: '6px', border: '1px dashed', cursor: 'pointer', fontSize: '11px', fontWeight: 500, transition: 'all 0.15s' },
  main:          { display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: '16px', padding: '16px 24px', flex: 1, minHeight: 0, overflow: 'hidden' },
  aside:         { overflowY: 'auto', minWidth: 0 },
  center:        { display: 'flex', flexDirection: 'column', minWidth: 0, alignItems: 'center', overflowY: 'auto' },
  rightPanel:    { overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 },
  emptyState:    { maxWidth: '100%', background: '#0d1320', borderRadius: '12px', border: '1px dashed #1e2e47', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  emptyIcon:     { fontSize: '40px', lineHeight: 1 },
  emptyText:     { fontSize: '14px', color: '#475569', textAlign: 'center', lineHeight: 1.6 },
  emptyHint:     { fontSize: '12px', color: '#2d3f5a' },
  hint:          { fontSize: '12px', color: '#3b82f6', marginTop: '8px', fontStyle: 'italic' },
  aggStrip:      { display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap', padding: '8px 12px', background: '#0d1320', borderRadius: '8px', border: '1px solid #1e2e47' },
}
