import { MAPS, DATES, EVENT_CONFIG } from '../utils/mapConfig.js'

export default function FilterPanel({ filters, onChange, matchList }) {
  const { selectedMap, selectedDate, selectedMatch, showHumans, showBots, activeEvents } = filters

  // Get filtered match options
  const matchOptions = matchList.filter(m =>
    (!selectedMap || m.map_id === selectedMap) &&
    (!selectedDate || m.date === selectedDate)
  )

  const toggleEvent = (ev) => {
    const next = activeEvents.includes(ev)
      ? activeEvents.filter(e => e !== ev)
      : [...activeEvents, ev]
    onChange({ activeEvents: next })
  }

  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>Filters</h2>

      {/* Map selector */}
      <div style={styles.group}>
        <label style={styles.label}>Map</label>
        <select style={styles.select} value={selectedMap} onChange={e => onChange({ selectedMap: e.target.value, selectedMatch: '' })}>
          <option value="">All Maps</option>
          {MAPS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Date selector */}
      <div style={styles.group}>
        <label style={styles.label}>Date</label>
        <select style={styles.select} value={selectedDate} onChange={e => onChange({ selectedDate: e.target.value, selectedMatch: '' })}>
          <option value="">All Dates</option>
          {DATES.map(d => (
            <option key={d} value={d}>{d.replace('_', ' ')}{d === 'February_14' ? ' ⚠️ partial' : ''}</option>
          ))}
        </select>
      </div>

      {/* Match selector */}
      <div style={styles.group}>
        <label style={styles.label}>Match ({matchOptions.length} available)</label>
        <select style={styles.select} value={selectedMatch} onChange={e => onChange({ selectedMatch: e.target.value })}>
          <option value="">Select a match...</option>
          {matchOptions.map(m => (
            <option key={m.match_id} value={m.match_id}>
              {m.match_id.slice(0, 8)}... · {m.player_count}p · {m.total_events} evts
            </option>
          ))}
        </select>
      </div>

      {/* Player type toggles */}
      <div style={styles.group}>
        <label style={styles.label}>Player Type</label>
        <div style={styles.row}>
          <button style={btnStyle(showHumans, '#60a5fa')} onClick={() => onChange({ showHumans: !showHumans })}>
            👤 Humans
          </button>
          <button style={btnStyle(showBots, '#f472b6')} onClick={() => onChange({ showBots: !showBots })}>
            🤖 Bots
          </button>
        </div>
      </div>

      {/* Event type toggles */}
      <div style={styles.group}>
        <label style={styles.label}>Event Markers</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(EVENT_CONFIG).filter(([k]) => !['Position','BotPosition'].includes(k)).map(([key, cfg]) => (
            <button
              key={key}
              style={btnStyle(activeEvents.includes(key), cfg.color)}
              onClick={() => toggleEvent(key)}
            >
              <span style={{ background: cfg.color, width: 10, height: 10, borderRadius: '50%', display: 'inline-block', marginRight: 6 }} />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const btnStyle = (active, color) => ({
  padding: '6px 12px',
  borderRadius: '6px',
  border: `1.5px solid ${active ? color : '#334155'}`,
  background: active ? color + '22' : '#1a1f2e',
  color: active ? color : '#64748b',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
  transition: 'all 0.15s',
  textAlign: 'left',
  width: '100%',
})

const styles = {
  panel: { display: 'flex', flexDirection: 'column', gap: '16px', width: '220px', flexShrink: 0 },
  title: { fontSize: '14px', fontWeight: 700, color: '#f1f5f9', margin: 0 },
  group: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#475569' },
  select: { background: '#1a1f2e', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '7px 10px', fontSize: '13px', width: '100%' },
  row: { display: 'flex', gap: '8px' },
}