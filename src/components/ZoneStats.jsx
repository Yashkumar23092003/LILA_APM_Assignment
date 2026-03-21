export default function ZoneStats({ stats, onClear }) {
  if (!stats) return (
    <div style={S.empty}>
      <p style={S.emptyText}>Draw a rectangle on the map to analyse that zone</p>
    </div>
  )

  const rows = [
    { label: 'Unique players', value: stats.uniquePlayers, color: '#60a5fa', icon: '👤' },
    { label: 'Positions',      value: stats.positions,     color: '#94a3b8', icon: '📍' },
    { label: 'Kills',          value: stats.kills,         color: '#ef4444', icon: '⚔️' },
    { label: 'Deaths',         value: stats.deaths,        color: '#f59e0b', icon: '💀' },
    { label: 'Loot',           value: stats.loot,          color: '#10b981', icon: '🎁' },
  ]
  const maxVal = Math.max(...rows.map(r => r.value), 1)

  return (
    <div style={S.card}>
      <div style={S.header}>
        <span style={S.title}>📐 Zone Stats</span>
        <button style={S.closeBtn} onClick={onClear} title="Clear zone">✕</button>
      </div>
      <div style={S.divider} />

      {stats.uniquePlayers === 0 ? (
        <p style={S.emptyText}>No events in this zone — try a larger area.</p>
      ) : (
        <div style={S.rows}>
          {rows.map(({ label, value, color, icon }) => (
            <div key={label} style={S.row}>
              <span style={S.icon}>{icon}</span>
              <div style={S.barWrap}>
                <div style={{ ...S.bar, width: `${(value/maxVal)*100}%`, background: color + '33' }} />
                <span style={S.rowLabel}>{label}</span>
              </div>
              <span style={{ ...S.val, color }}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const S = {
  card:      { background: '#0d1320', border: '1px solid #1e2e47', borderRadius: '10px', padding: '12px', marginTop: '8px' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' },
  title:     { fontSize: '11px', fontWeight: 700, color: '#60a5fa' },
  closeBtn:  { background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '13px', padding: '0 2px', lineHeight: 1 },
  divider:   { borderTop: '1px solid #131c2e', margin: '4px 0 8px' },
  rows:      { display: 'flex', flexDirection: 'column', gap: '5px' },
  row:       { display: 'flex', alignItems: 'center', gap: '7px' },
  icon:      { fontSize: '12px', flexShrink: 0, width: '18px', textAlign: 'center' },
  barWrap:   { flex: 1, position: 'relative', height: '18px', display: 'flex', alignItems: 'center' },
  bar:       { position: 'absolute', left: 0, top: 2, bottom: 2, borderRadius: '3px', transition: 'width 0.3s' },
  rowLabel:  { position: 'relative', fontSize: '11px', color: '#475569', zIndex: 1 },
  val:       { fontSize: '13px', fontWeight: 700, flexShrink: 0, minWidth: '24px', textAlign: 'right' },
  empty:     { background: '#0d1320', border: '1px dashed #1e2e47', borderRadius: '10px', padding: '12px', marginTop: '8px' },
  emptyText: { fontSize: '11px', color: '#2d4060', textAlign: 'center', lineHeight: 1.5, margin: 0 },
}
