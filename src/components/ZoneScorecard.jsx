import { useState } from 'react'

const DANGER_COLOR = { red: '#ef4444', yellow: '#f59e0b', green: '#10b981', grey: '#334155' }
const DANGER_ICON  = { red: '🔴', yellow: '🟡', green: '🟢', grey: '⬜' }
const DANGER_LABEL = { red: 'Hot', yellow: 'Mixed', green: 'Safe', grey: 'Quiet' }

export default function ZoneScorecard({ scorecardData, visible }) {
  const [selected, setSelected] = useState(null)
  const [showAll,  setShowAll]  = useState(false)

  if (!visible || !scorecardData) return null

  const { map_id, total_player_matches, zones } = scorecardData
  const maxVisit = zones.reduce((m, z) => Math.max(m, z.visit_pct), 1)

  const active   = zones.filter(z => z.danger !== 'grey')
  const inactive = zones.filter(z => z.danger === 'grey')
  const display  = showAll ? zones : [...active, ...inactive].slice(0, 12)

  return (
    <div style={S.panel}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.titleRow}>
          <span style={S.title}>⬡ Zone Balance</span>
          <span style={S.subtitle}>{map_id}</span>
        </div>
        <span style={S.meta}>{total_player_matches.toLocaleString()} player-matches</span>
      </div>

      {/* Legend */}
      <div style={S.legend}>
        {Object.entries(DANGER_LABEL).map(([k, v]) => (
          <span key={k} style={{ ...S.legendItem, color: DANGER_COLOR[k] }}>
            {DANGER_ICON[k]} {v}
          </span>
        ))}
      </div>

      <div style={S.divider} />

      {/* Zone cards grid */}
      <div style={S.grid}>
        {display.map(zone => {
          const isSelected = selected === zone.id
          const dc = DANGER_COLOR[zone.danger]
          return (
            <div
              key={zone.id}
              style={{
                ...S.card,
                borderColor: isSelected ? dc : '#1e2e47',
                boxShadow:   isSelected ? `0 0 10px ${dc}44` : 'none',
                opacity:     zone.danger === 'grey' ? 0.55 : 1,
              }}
              onClick={() => setSelected(isSelected ? null : zone.id)}
            >
              {/* Left accent bar */}
              <div style={{ ...S.accent, background: dc }} />

              <div style={S.cardBody}>
                {/* Zone ID + danger */}
                <div style={S.cardHeader}>
                  <span style={{ ...S.zoneId, color: dc }}>{zone.id}</span>
                  <span style={S.dangerIcon}>{DANGER_ICON[zone.danger]}</span>
                </div>

                {/* Visit % bar */}
                <div style={S.barTrack}>
                  <div style={{ ...S.barFill, width: `${(zone.visit_pct / maxVisit) * 100}%`, background: dc }} />
                </div>
                <span style={S.visitPct}>{zone.visit_pct.toFixed(1)}% visited</span>

                {/* Stats row */}
                <div style={S.statsRow}>
                  <Stat label="K/D" value={zone.kd_ratio.toFixed(1)} color={dc} />
                  <Stat label="Loot" value={zone.avg_loot.toFixed(2)} color="#10b981" />
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div style={S.detail}>
                    <DetailRow label="Kills"   value={zone.kills}   color="#ef4444" />
                    <DetailRow label="Deaths"  value={zone.deaths}  color="#f59e0b" />
                    <DetailRow label="Loot ev" value={zone.loot}    color="#10b981" />
                    <DetailRow label="Visits"  value={zone.visits}  color="#60a5fa" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Show more / less */}
      {zones.length > 12 && (
        <button style={S.toggleBtn} onClick={() => setShowAll(v => !v)}>
          {showAll ? '↑ show less' : `↓ show all ${zones.length} zones`}
        </button>
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: '9px', color: '#2d4060', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
  )
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
      <span style={{ fontSize: '10px', color: '#475569' }}>{label}</span>
      <span style={{ fontSize: '10px', fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

const S = {
  panel:     { background: '#0d1320', border: '1px solid #1e2e47', borderRadius: '10px', padding: '12px', marginTop: '8px' },
  header:    { marginBottom: '8px' },
  titleRow:  { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' },
  title:     { fontSize: '12px', fontWeight: 700, color: '#f1f5f9' },
  subtitle:  { fontSize: '10px', color: '#3b82f6', fontWeight: 600 },
  meta:      { fontSize: '10px', color: '#334155' },
  legend:    { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' },
  legendItem:{ fontSize: '10px', fontWeight: 600 },
  divider:   { borderTop: '1px solid #131c2e', marginBottom: '10px' },
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' },
  card:      { position: 'relative', display: 'flex', background: '#080c14', borderRadius: '7px', border: '1px solid', cursor: 'pointer', overflow: 'hidden', transition: 'all 0.15s' },
  accent:    { width: '3px', flexShrink: 0 },
  cardBody:  { flex: 1, padding: '7px 6px 6px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  cardHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  zoneId:    { fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' },
  dangerIcon:{ fontSize: '10px' },
  barTrack:  { height: '3px', background: '#131c2e', borderRadius: '2px', overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: '2px', opacity: 0.8 },
  visitPct:  { fontSize: '9px', color: '#334155' },
  statsRow:  { display: 'flex', gap: '4px' },
  detail:    { marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #1e2e47' },
  toggleBtn: { marginTop: '8px', width: '100%', background: 'none', border: '1px solid #1e2e47', color: '#334155', fontSize: '11px', borderRadius: '5px', padding: '5px', cursor: 'pointer' },
}
