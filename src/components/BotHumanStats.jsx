export default function BotHumanStats({ matchData }) {
  if (!matchData) return null

  const humans = matchData.players.filter(p => !p.is_bot)
  const bots   = matchData.players.filter(p => p.is_bot)

  const stats = (players) => {
    if (!players.length) return { avgEvents: 0, avgPositions: 0, kills: 0, deaths: 0 }
    const avgEvents    = Math.round(players.reduce((s,p) => s + p.events.length, 0) / players.length)
    const avgPositions = Math.round(players.reduce((s,p) => s + p.events.filter(e => e.event === 'Position' || e.event === 'BotPosition').length, 0) / players.length)
    const kills  = players.reduce((s,p) => s + p.events.filter(e => e.event === 'Kill' || e.event === 'BotKill').length, 0)
    const deaths = players.reduce((s,p) => s + p.events.filter(e => ['Killed','BotKilled','KilledByStorm'].includes(e.event)).length, 0)
    const loot   = players.reduce((s,p) => s + p.events.filter(e => e.event === 'Loot').length, 0)
    return { avgEvents, avgPositions, kills, deaths, loot }
  }

  const h = stats(humans)
  const b = stats(bots)

  const Row = ({ label, hVal, bVal }) => (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <span style={{...s.val, color: '#60a5fa'}}>{hVal}</span>
      <span style={{...s.val, color: '#f472b6'}}>{bVal}</span>
    </div>
  )

  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>Behaviour Comparison</span>
      </div>
      <div style={s.row}>
        <span style={s.label}></span>
        <span style={{...s.val, color:'#60a5fa', fontWeight:700}}>👤 {humans.length}</span>
        <span style={{...s.val, color:'#f472b6', fontWeight:700}}>🤖 {bots.length}</span>
      </div>
      <div style={s.divider}/>
      <Row label="Avg events"    hVal={h.avgEvents}    bVal={b.avgEvents} />
      <Row label="Avg positions" hVal={h.avgPositions} bVal={b.avgPositions} />
      <Row label="Total kills"   hVal={h.kills}        bVal={b.kills} />
      <Row label="Total deaths"  hVal={h.deaths}       bVal={b.deaths} />
      <Row label="Total loot"    hVal={h.loot}         bVal={b.loot} />
    </div>
  )
}

const s = {
  card:    { background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '12px', marginTop: '12px' },
  header:  { marginBottom: '8px' },
  title:   { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#475569' },
  row:     { display: 'flex', justifyContent: 'space-between', padding: '3px 0', alignItems: 'center' },
  label:   { fontSize: '11px', color: '#64748b', flex: 1 },
  val:     { fontSize: '12px', fontWeight: 600, width: '40px', textAlign: 'right' },
  divider: { borderTop: '1px solid #1f2937', margin: '6px 0' },
}
