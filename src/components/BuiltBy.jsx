import { useEffect } from 'react'

export default function BuiltBy({ onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <>
      <style>{CSS}</style>
      <div style={S.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
        <div style={S.card}>

          {/* Top accent bar */}
          <div style={S.bar} />

          {/* Body */}
          <div style={S.body}>

            {/* Eyebrow */}
            <div style={S.eyebrow}>Made with ❤️, mild sleep deprivation, and two AIs</div>

            {/* Main headline */}
            <h1 style={S.headline}>
              LILA Journey Viewer
            </h1>
            <p style={S.byline}>A brief, slightly self-aware message before you go through the heatmaps.</p>

            {/* Story */}
            <div style={S.story}>
              <p style={S.para}>
                Built by{' '}
                <span style={S.name}>Yash</span>
                {' '}— who stared at 87,598 player events long enough that the dead zones
                started staring back.
              </p>
              <p style={S.para}>
                The architecture, heatmaps, animated tooltips, and forty-seven variations of
                "why is the canvas blank" all happened with{' '}
                <span style={S.claude}>Claude</span>
                {' '}(Anthropic{"'"}s AI — yes, the one writing this sentence, yes this is meta,
                no we{"'"}re not stopping). Engineering partner and debugging therapist in equal measure.
              </p>
              <p style={S.para}>
                A respectful nod to{' '}
                <span style={S.openai}>OpenAI</span>
                {' '}too. In 2026, crediting your full AI stack is just good manners.
              </p>
            </div>

            {/* Stats row */}
            <div style={S.statsRow}>
              {[
                { n: '796', label: 'matches' },
                { n: '87,598', label: 'events' },
                { n: '3', label: 'maps' },
                { n: '0', label: 'external chart libs' },
              ].map(s => (
                <div key={s.label} style={S.stat}>
                  <div style={S.statN}>{s.n}</div>
                  <div style={S.statL}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Sign-off */}
            <p style={S.signoff}>
              It was, against all reasonable expectations, genuinely fun.
            </p>
            <p style={S.ps}>
              The dead zones on AmbroseValley are real.{' '}
              <em>They've been waiting for a level designer to notice them.</em>
            </p>

          </div>

          {/* CTA */}
          <div style={S.footer}>
            <button style={S.cta} onClick={onClose} className="bb-cta">
              Enter the map →
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

const CSS = `
@keyframes bb-in {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}
@keyframes bb-bar {
  from { width: 0; }
  to   { width: 100%; }
}
.bb-cta:hover {
  background: #2563eb !important;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(37,99,235,0.35) !important;
}
.bb-cta:active {
  transform: translateY(0);
}
`

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(2,6,15,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9500, backdropFilter: 'blur(6px)',
  },
  card: {
    width: 'min(560px, 92vw)',
    background: '#080c14',
    border: '1px solid #1e2e47',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
    animation: 'bb-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
  },

  bar: {
    height: '3px',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
    animation: 'bb-bar 1s ease both',
  },

  body: {
    padding: '32px 36px 24px',
  },

  eyebrow: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
    color: '#334155', textTransform: 'uppercase', marginBottom: '14px',
  },
  headline: {
    fontSize: '28px', fontWeight: 800, color: '#f1f5f9',
    margin: '0 0 6px', lineHeight: 1.2,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  byline: {
    fontSize: '13px', color: '#475569', margin: '0 0 24px',
  },

  story: {
    borderLeft: '2px solid #1e2e47',
    paddingLeft: '18px',
    marginBottom: '24px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  para: {
    fontSize: '13px', color: '#64748b', lineHeight: 1.7, margin: 0,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  name:   { fontWeight: 700, color: '#f1f5f9' },
  claude: { fontWeight: 700, color: '#60a5fa' },
  openai: { fontWeight: 700, color: '#34d399' },

  statsRow: {
    display: 'flex', gap: '0', marginBottom: '22px',
    background: '#0d1320', borderRadius: '10px', border: '1px solid #1e2e47',
    overflow: 'hidden',
  },
  stat: {
    flex: 1, padding: '14px 8px', textAlign: 'center',
    borderRight: '1px solid #1e2e47',
  },
  statN: { fontSize: '18px', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 },
  statL: { fontSize: '10px', color: '#334155', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' },

  signoff: {
    fontSize: '13px', color: '#475569', fontStyle: 'italic',
    margin: '0 0 8px', lineHeight: 1.6,
  },
  ps: {
    fontSize: '11px', color: '#2d4060', margin: 0, lineHeight: 1.6,
  },

  footer: {
    padding: '16px 36px 28px',
    display: 'flex', justifyContent: 'center',
  },
  cta: {
    padding: '12px 40px', borderRadius: '8px',
    background: '#1d4ed8', border: 'none',
    color: '#fff', fontSize: '14px', fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.18s',
    boxShadow: '0 4px 16px rgba(29,78,216,0.3)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
}
