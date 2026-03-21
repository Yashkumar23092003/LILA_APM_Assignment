// Floating stats card shown after user draws a zone rectangle
export default function ZoneStats({ stats, onClear }) {
  if (!stats) return null

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>📐 Zone Analysis</span>
        <button style={styles.close} onClick={onClear}>✕</button>
      </div>
      <div style={styles.grid}>
        <Stat label="Unique Players" value={stats.uniquePlayers} color="#60a5fa" />
        <Stat label="Positions Logged" value={stats.positions} color="#94a3b8" />
        <Stat label="Kills" value={stats.kills} color="#ff4444" />
        <Stat label="Deaths" value={stats.deaths} color="#ff8800" />
        <Stat label="Loot Pickups" value={stats.loot} color="#44ff88" />
      </div>
      {stats.uniquePlayers === 0 && (
        <p style={styles.hint}>No events in selected zone. Try a larger area.</p>
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={styles.stat}>
      <span style={{ ...styles.val, color }}>{value}</span>
      <span style={styles.lbl}>{label}</span>
    </div>
  )
}

const styles = {
  card: {
    background: '#1a1f2e',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 14px',
    minWidth: '180px',
    marginTop: '10px',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  title: { fontSize: '12px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.5px' },
  close: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', padding: '0 2px', lineHeight: 1 },
  grid: { display: 'flex', flexDirection: 'column', gap: '6px' },
  stat: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' },
  val: { fontSize: '16px', fontWeight: 700 },
  lbl: { fontSize: '11px', color: '#64748b' },
  hint: { fontSize: '11px', color: '#475569', marginTop: '8px', fontStyle: 'italic' },
}
