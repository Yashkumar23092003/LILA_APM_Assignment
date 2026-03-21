import { getPlayerColor } from '../utils/mapConfig.js'

export default function PlayerList({ players, selectedPlayer, onSelect }) {
  if (!players?.length) return null

  const maxEvents = Math.max(...players.map(p => p.events.length), 1)

  return (
    <div style={S.container}>
      <div style={S.header}>
        <span style={S.title}>Players</span>
        <span style={S.badge}>{players.length}</span>
      </div>
      <div style={S.list}>
        {players.map((p, idx) => {
          const color    = getPlayerColor(idx)
          const isActive = selectedPlayer === p.user_id
          const evCount  = p.events.length
          const posCount = p.events.filter(e => e.event === 'Position' || e.event === 'BotPosition').length
          const killCount= p.events.filter(e => e.event === 'Kill' || e.event === 'BotKill').length
          const barPct   = Math.round((evCount / maxEvents) * 100)
          return (
            <div
              key={p.user_id}
              style={{
                ...S.row,
                borderColor: isActive ? color + '88' : 'transparent',
                background:  isActive ? color + '12' : 'transparent',
              }}
              onClick={() => onSelect(isActive ? null : p.user_id)}
            >
              {/* Color swatch / type indicator */}
              <div style={{ ...S.swatch, background: color, opacity: isActive ? 1 : 0.7 }}>
                {p.is_bot ? '⚙' : '◈'}
              </div>

              {/* Info */}
              <div style={S.info}>
                <div style={S.nameRow}>
                  <span style={{ ...S.name, color: isActive ? color : '#cbd5e1' }}>
                    {p.user_id.slice(0, 9)}…
                  </span>
                  {killCount > 0 && (
                    <span style={S.killTag}>⚔ {killCount}</span>
                  )}
                </div>
                <div style={S.barTrack}>
                  <div style={{ ...S.barFill, width: barPct + '%', background: color }} />
                </div>
                <div style={S.metaRow}>
                  <span style={S.meta}>{evCount} evt</span>
                  <span style={S.meta}>{posCount} pos</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const S = {
  container: { display: 'flex', flexDirection: 'column', gap: '0' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 8px' },
  title:     { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#2d4060' },
  badge:     { fontSize: '11px', fontWeight: 700, background: '#131c2e', color: '#3b82f6', borderRadius: '10px', padding: '1px 7px', border: '1px solid #1e2e47' },
  list:      { display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: 'calc(100vh - 380px)', overflowY: 'auto', paddingRight: '2px' },

  row: {
    display: 'flex', alignItems: 'flex-start', gap: '9px',
    padding: '8px 9px', borderRadius: '8px', cursor: 'pointer',
    border: '1px solid', transition: 'all 0.12s',
  },
  swatch: {
    width: 24, height: 24, borderRadius: '6px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', color: 'rgba(0,0,0,0.7)', fontWeight: 700,
  },
  info:     { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  nameRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' },
  name:     { fontSize: '12px', fontFamily: "'Roboto Mono','Courier New',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.12s' },
  killTag:  { fontSize: '10px', color: '#ef4444', background: '#ef444418', borderRadius: '4px', padding: '1px 5px', flexShrink: 0 },
  barTrack: { height: 3, background: '#131c2e', borderRadius: '2px', overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: '2px', transition: 'width 0.3s', opacity: 0.7 },
  metaRow:  { display: 'flex', gap: '8px' },
  meta:     { fontSize: '10px', color: '#2d4060' },
}
