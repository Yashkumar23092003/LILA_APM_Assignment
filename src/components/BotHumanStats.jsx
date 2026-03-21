export default function BotHumanStats({ matchData }) {
  if (!matchData) return null

  const humans = matchData.players.filter(p => !p.is_bot)
  const bots   = matchData.players.filter(p =>  p.is_bot)

  const calc = (players) => {
    if (!players.length) return { avgEvents: 0, avgPositions: 0, kills: 0, deaths: 0, loot: 0 }
    const n = players.length
    return {
      avgEvents:    Math.round(players.reduce((s,p) => s + p.events.length, 0) / n),
      avgPositions: Math.round(players.reduce((s,p) => s + p.events.filter(e => e.event === 'Position' || e.event === 'BotPosition').length, 0) / n),
      kills:  players.reduce((s,p) => s + p.events.filter(e => e.event === 'Kill' || e.event === 'BotKill').length, 0),
      deaths: players.reduce((s,p) => s + p.events.filter(e => ['Killed','BotKilled','KilledByStorm'].includes(e.event)).length, 0),
      loot:   players.reduce((s,p) => s + p.events.filter(e => e.event === 'Loot').length, 0),
    }
  }

  const h = calc(humans)
  const b = calc(bots)

  const rows = [
    { label: 'Avg events',  hv: h.avgEvents,    bv: b.avgEvents    },
    { label: 'Avg pos.',    hv: h.avgPositions, bv: b.avgPositions },
    { label: 'Total kills', hv: h.kills,        bv: b.kills        },
    { label: 'Deaths',      hv: h.deaths,       bv: b.deaths       },
    { label: 'Loot',        hv: h.loot,         bv: b.loot         },
  ]

  return (
    <div style={S.card}>
      {/* Column headers */}
      <div style={S.thead}>
        <span style={S.rowLabel} />
        <span style={{ ...S.colHead, color: '#60a5fa' }}>👤 {humans.length}h</span>
        <span style={{ ...S.colHead, color: '#f472b6' }}>🤖 {bots.length}b</span>
      </div>
      <div style={S.divider} />
      {rows.map(({ label, hv, bv }) => {
        const max = Math.max(hv, bv, 1)
        return (
          <div key={label} style={S.row}>
            <span style={S.rowLabel}>{label}</span>
            <div style={S.cell}>
              <div style={{ ...S.miniBar, width: `${(hv/max)*100}%`, background: '#60a5fa33' }} />
              <span style={{ ...S.val, color: '#60a5fa' }}>{hv}</span>
            </div>
            <div style={S.cell}>
              <div style={{ ...S.miniBar, width: `${(bv/max)*100}%`, background: '#f472b633' }} />
              <span style={{ ...S.val, color: '#f472b6' }}>{bv}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const S = {
  card:     { background: '#0d1320', border: '1px solid #1e2e47', borderRadius: '10px', padding: '12px', marginTop: '8px' },
  thead:    { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' },
  colHead:  { flex: 1, fontSize: '11px', fontWeight: 700, textAlign: 'right' },
  divider:  { borderTop: '1px solid #131c2e', margin: '4px 0 6px' },
  row:      { display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 0' },
  rowLabel: { fontSize: '10px', color: '#2d4060', flex: 1.4, whiteSpace: 'nowrap' },
  cell:     { flex: 1, position: 'relative', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  miniBar:  { position: 'absolute', left: 0, top: 3, bottom: 3, borderRadius: '2px', transition: 'width 0.3s' },
  val:      { fontSize: '11px', fontWeight: 700, position: 'relative', zIndex: 1, paddingRight: '2px' },
}
