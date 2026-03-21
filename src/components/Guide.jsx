import { useEffect } from 'react'

const SECTIONS = [
  {
    group: 'Overview',
    items: [
      {
        icon: '🗺️',
        title: 'What is this?',
        desc: 'LILA Journey Viewer is a level design tool for LILA BLACK. It lets you visually understand how players navigate your maps — where they move, where they fight, where they die, and which areas never get visited.',
        wide: true,
      },
    ],
  },
  {
    group: 'Filters (Left Panel)',
    items: [
      { icon: '🗺️', title: 'Map', desc: 'Switch between AmbroseValley, GrandRift, and Lockdown. Changing map resets the match selection.' },
      { icon: '📅', title: 'Date', desc: 'Filter matches by day. Useful when comparing how player behaviour shifts over time.' },
      { icon: '🎮', title: 'Match', desc: 'Select a specific match file to load. Each match contains full per-player event data.' },
      { icon: '👤 🤖', title: 'Humans vs Bots', desc: 'Toggle human players, bot players, or both. Bots are detected by numeric user IDs.' },
    ],
  },
  {
    group: 'Visualise',
    items: [
      { icon: '🛤', title: 'Player Paths', desc: 'Draws every player\'s movement trail. Solid coloured lines = humans. Dashed pink lines = bots. Each player gets a unique colour.' },
      { icon: '🌡', title: 'Heatmap', desc: 'Kernel-density map of player activity in a single match. Hot red = crowded. Cold blue = sparse. Switch between position, kills, deaths, loot, and first-drop landing zones.' },
      { icon: '📊', title: 'Cross-Match Heatmap', desc: 'Same as heatmap but aggregates all 796 matches at once. Reveals the long-term patterns that a single match can\'t show — the truly dominant corridors and dead zones.' },
      { icon: '⏱', title: 'Phase Split', desc: 'When heatmap is on, split by Early / Mid / Late phase of the match to see how player density shifts as the storm closes.' },
    ],
  },
  {
    group: 'Analysis',
    items: [
      { icon: '⬡', title: 'Zone Balance Scorecard', desc: 'Auto-generated report for every named zone. Shows traffic %, kill/death ratio, and loot density. Green = balanced. Yellow = needs attention. Red = problem zone. Based on all matches.' },
      { icon: '☠', title: 'Dead Zones', desc: 'Red overlay on cells of the map that were visited by fewer than 30% of players on average. These are likely wasted or inaccessible design space.' },
      { icon: '🔴', title: 'Death Clusters', desc: 'Auto-detects the top 3 locations where deaths concentrate most. Pins ①②③ are ranked by share of total match deaths. Opt-in — only visible when toggled.' },
      { icon: '↗', title: 'Flow Vectors', desc: 'Arrows showing the dominant movement direction in each grid cell. Blue-white = low traffic. Orange = heavy traffic. Reveals natural player routing through the map.' },
    ],
  },
  {
    group: 'Playback',
    items: [
      { icon: '▶', title: 'Timeline Scrubber', desc: 'Drag the scrubber to any point in the 30-second normalised match timeline. All paths and events update live to show exactly what was happening at that moment.' },
      { icon: '⚡', title: 'Speed Control', desc: 'Change playback speed from 0.1× (slow-mo) to 5× (fast-forward). Useful for spotting bursts of activity or watching the full match unfold naturally.' },
    ],
  },
  {
    group: 'Advanced',
    items: [
      { icon: '🎯', title: 'Zone Draw Tool', desc: 'Drag a rectangle anywhere on the map to get instant stats for that custom area — unique players, kills, deaths, and loot pickups. Great for comparing two regions side by side.' },
      { icon: '👥', title: 'Player List (Right Panel)', desc: 'Shows all players in the loaded match. Click any player to isolate their path and events on the map. Click again to deselect.' },
    ],
  },
]

export default function Guide({ onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={S.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={S.modal}>

        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.headerIcon}>▲</div>
            <div>
              <div style={S.headerTitle}>LILA Journey Viewer — Guide</div>
              <div style={S.headerSub}>Everything you need to know, on one page</div>
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕ Close</button>
        </div>

        {/* Scrollable body */}
        <div style={S.body}>
          {SECTIONS.map(section => (
            <div key={section.group} style={S.section}>
              <div style={S.sectionLabel}>{section.group}</div>
              <div style={S.grid}>
                {section.items.map(item => (
                  <div key={item.title} style={{ ...S.card, ...(item.wide ? S.wideCard : {}) }}>
                    <div style={S.cardTop}>
                      <span style={S.cardIcon}>{item.icon}</span>
                      <span style={S.cardTitle}>{item.title}</span>
                    </div>
                    <p style={S.cardDesc}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer tip */}
          <div style={S.tip}>
            💡 <strong>Tip:</strong> Start by selecting a Map → then a Match in the left panel. Load a match first before enabling Heatmap, Clusters, or Playback.
          </div>
        </div>

      </div>
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(4,8,16,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9000, backdropFilter: 'blur(4px)',
  },
  modal: {
    width: 'min(860px, 94vw)', maxHeight: '88vh',
    background: '#080c14', border: '1px solid #1e2e47', borderRadius: '14px',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.85)',
  },

  // Header
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 24px', borderBottom: '1px solid #1e2e47', flexShrink: 0,
  },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: '12px' },
  headerIcon:  {
    width: 32, height: 32, borderRadius: '8px',
    background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', color: '#fff', fontWeight: 700, flexShrink: 0,
  },
  headerTitle: { fontSize: '15px', fontWeight: 700, color: '#f1f5f9' },
  headerSub:   { fontSize: '11px', color: '#334155', marginTop: '2px' },
  closeBtn: {
    padding: '6px 14px', borderRadius: '6px', border: '1px solid #1e2e47',
    background: 'transparent', color: '#475569', fontSize: '12px',
    fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  },

  // Body
  body: { overflowY: 'auto', padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' },

  section:      { display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
    color: '#334155', textTransform: 'uppercase', paddingBottom: '2px',
    borderBottom: '1px solid #0f1923',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' },

  card: {
    background: '#0d1320', border: '1px solid #1a2740', borderRadius: '10px',
    padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '7px',
    transition: 'border-color 0.15s',
  },
  wideCard: { gridColumn: '1 / -1' },
  cardTop:  { display: 'flex', alignItems: 'center', gap: '8px' },
  cardIcon: { fontSize: '16px', lineHeight: 1, flexShrink: 0 },
  cardTitle: { fontSize: '13px', fontWeight: 700, color: '#cbd5e1' },
  cardDesc:  { fontSize: '12px', color: '#475569', lineHeight: 1.65, margin: 0 },

  tip: {
    fontSize: '12px', color: '#475569', background: '#0d1320',
    border: '1px solid #1a2740', borderLeft: '3px solid #3b82f6',
    borderRadius: '8px', padding: '12px 16px', lineHeight: 1.6,
  },
}
