import { MAPS, DATES, EVENT_CONFIG } from '../utils/mapConfig.js'

export default function FilterPanel({ filters, onChange, matchList }) {
  const { selectedMap, selectedDate, selectedMatch, showHumans, showBots, activeEvents } = filters

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
    <div style={S.panel}>

      {/* ── MAP ── */}
      <Section label="🗺️ Map">
        <select
          style={{ ...S.select, color: selectedMap ? '#60a5fa' : '#64748b', fontWeight: selectedMap ? 600 : 400 }}
          value={selectedMap}
          onChange={e => onChange({ selectedMap: e.target.value, selectedMatch: '' })}
        >
          <option value="">All maps</option>
          {MAPS.map(m => (
            <option key={m} value={m}>
              {m === 'AmbroseValley' ? '🌿 Ambrose Valley' : m === 'GrandRift' ? '🏔 Grand Rift' : '🏙 Lockdown'}
            </option>
          ))}
        </select>
      </Section>

      {/* ── DATE ── */}
      <Section label="Date">
        <select
          style={S.select}
          value={selectedDate}
          onChange={e => onChange({ selectedDate: e.target.value, selectedMatch: '' })}
        >
          <option value="">All dates</option>
          {DATES.map(d => (
            <option key={d} value={d}>
              {d.replace('_',' ')}{d === 'February_14' ? ' ⚠️' : ''}
            </option>
          ))}
        </select>
      </Section>

      {/* ── MATCH ── */}
      <Section label={`Match  ·  ${matchOptions.length} available`}>
        <select
          style={S.select}
          value={selectedMatch}
          onChange={e => onChange({ selectedMatch: e.target.value })}
        >
          <option value="">Pick a match…</option>
          {matchOptions.map(m => (
            <option key={m.match_id} value={m.match_id}>
              {m.match_id.slice(0, 8)}…  ·  {m.player_count}p  ·  {m.total_events} evt
            </option>
          ))}
        </select>
        {selectedMatch && (
          <button style={S.clearBtn} onClick={() => onChange({ selectedMatch: '', selectedPlayer: null })}>
            ✕ clear match
          </button>
        )}
      </Section>

      {/* ── PLAYER TYPE ── */}
      <Section label="Player Type">
        <div style={S.row}>
          <TypeBtn active={showHumans} color="#60a5fa" icon="👤" label="Humans" onClick={() => onChange({ showHumans: !showHumans })} />
          <TypeBtn active={showBots}   color="#f472b6" icon="🤖" label="Bots"   onClick={() => onChange({ showBots: !showBots })} />
        </div>
      </Section>

      {/* ── EVENT MARKERS ── */}
      <Section label="Event Markers">
        <div style={S.eventList}>
          {Object.entries(EVENT_CONFIG)
            .filter(([k]) => !['Position','BotPosition'].includes(k))
            .map(([key, cfg]) => {
              const on = activeEvents.includes(key)
              return (
                <button key={key} style={{ ...S.evtBtn, borderColor: on ? cfg.color + '88' : '#1e2e47', background: on ? cfg.color + '14' : 'transparent' }} onClick={() => toggleEvent(key)}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? cfg.color : '#334155', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: '11px', color: on ? cfg.color : '#475569', fontWeight: on ? 600 : 400 }}>{cfg.label}</span>
                </button>
              )
            })}
        </div>
      </Section>

    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={S.section}>
      <span style={S.sectionLabel}>{label}</span>
      {children}
    </div>
  )
}

function TypeBtn({ active, color, icon, label, onClick }) {
  return (
    <button
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        padding: '7px 8px', borderRadius: '7px', cursor: 'pointer',
        fontSize: '12px', fontWeight: 600, border: '1.5px solid', transition: 'all 0.15s',
        borderColor: active ? color : '#1e2e47',
        background:  active ? color + '18' : '#0d1320',
        color:       active ? color : '#475569',
      }}
      onClick={onClick}
    >
      {icon} {label}
    </button>
  )
}

const S = {
  panel:        { display: 'flex', flexDirection: 'column', gap: '2px' },
  section:      { display: 'flex', flexDirection: 'column', gap: '7px', padding: '12px 0', borderBottom: '1px solid #131c2e' },
  sectionLabel: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#2d4060' },
  select:       { background: '#0d1320', border: '1px solid #1e2e47', borderRadius: '7px', color: '#cbd5e1', padding: '7px 10px', fontSize: '12px', width: '100%', cursor: 'pointer', appearance: 'auto' },
  clearBtn:     { background: 'none', border: 'none', color: '#334155', fontSize: '11px', cursor: 'pointer', textAlign: 'left', padding: '2px 0', marginTop: '-2px' },
  row:          { display: 'flex', gap: '8px' },
  eventList:    { display: 'flex', flexDirection: 'column', gap: '3px' },
  evtBtn:       { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left' },
}
