import { getPlayerColor } from '../utils/mapConfig.js'

export default function PlayerList({ players, selectedPlayer, onSelect }) {
  if (!players?.length) return null

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Players ({players.length})</h3>
      {players.map((p, idx) => {
        const color = getPlayerColor(idx)
        const isSelected = selectedPlayer === p.user_id
        const eventCount = p.events.length
        const posCount = p.events.filter(e => e.event === 'Position' || e.event === 'BotPosition').length
        return (
          <div
            key={p.user_id}
            style={{ ...styles.row, borderColor: isSelected ? color : '#1f2937', background: isSelected ? color + '15' : '#111827' }}
            onClick={() => onSelect(isSelected ? null : p.user_id)}
          >
            <span style={{ ...styles.dot, background: color }} />
            <div style={styles.info}>
              <span style={styles.name}>{p.is_bot ? '🤖' : '👤'} {p.user_id.slice(0, 8)}…</span>
              <span style={styles.meta}>{eventCount} events · {posCount} positions</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '6px', width: '200px', flexShrink: 0 },
  title: { fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px' },
  row: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', transition: 'all 0.1s' },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  info: { display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' },
  name: { fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: '11px', color: '#475569' },
}