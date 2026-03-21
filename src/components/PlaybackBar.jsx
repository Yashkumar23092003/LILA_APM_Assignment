import { useEffect, useRef } from 'react'

const FULL_PLAYBACK_REAL_MS = 30000
const SPEEDS = [0.1, 0.25, 0.5, 1, 2, 5]

export default function PlaybackBar({ maxTime, currentTime, isPlaying, speed, onTimeChange, onPlayPause, onSpeedChange }) {
  const rafRef  = useRef(null)
  const lastRef = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      const tick = (now) => {
        if (lastRef.current !== null) {
          const gameDelta = ((now - lastRef.current) / FULL_PLAYBACK_REAL_MS) * maxTime * speed
          onTimeChange(prev => Math.min(prev + gameDelta, maxTime))
        }
        lastRef.current = now
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      lastRef.current = null
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, speed, maxTime])

  const fmt = (val, max) => {
    const sec = Math.floor((val / max) * (FULL_PLAYBACK_REAL_MS / 1000))
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  }

  const pct = Math.min((currentTime / maxTime) * 100, 100)

  return (
    <div style={S.bar}>
      {/* Play / Reset */}
      <div style={S.btns}>
        <IconBtn onClick={() => onTimeChange(0)} title="Reset">⏮</IconBtn>
        <IconBtn onClick={onPlayPause} title={isPlaying ? 'Pause' : 'Play'} primary>
          {isPlaying ? '⏸' : '▶'}
        </IconBtn>
      </div>

      {/* Scrubber */}
      <div style={S.scrubberWrap}>
        <div style={S.track}>
          <div style={{ ...S.fill, width: pct + '%' }} />
          <div style={{ ...S.thumb, left: pct + '%' }} />
        </div>
        <input
          type="range" min={0} max={maxTime} value={currentTime} step={maxTime / 500}
          onChange={e => onTimeChange(Number(e.target.value))}
          style={S.range}
        />
      </div>

      {/* Time display */}
      <span style={S.time}>
        <span style={S.timeVal}>{fmt(currentTime, maxTime)}</span>
        <span style={S.timeSep}>/</span>
        <span style={S.timeTot}>{fmt(maxTime, maxTime)}</span>
      </span>

      {/* Speed pills */}
      <div style={S.speedPills}>
        {SPEEDS.map(s => (
          <button
            key={s}
            style={{
              ...S.speedPill,
              background: speed === s ? '#1d4ed8' : 'transparent',
              color:      speed === s ? '#93c5fd' : '#334155',
              borderColor: speed === s ? '#3b82f6' : '#1e2e47',
            }}
            onClick={() => onSpeedChange(s)}
          >
            {s < 1 ? s + '×' : s + '×'}
          </button>
        ))}
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, title, primary }) {
  return (
    <button
      style={{
        width: 30, height: 30, borderRadius: '7px', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
        background: primary ? '#1d4ed8' : '#131c2e',
        color: primary ? '#93c5fd' : '#475569',
        transition: 'all 0.12s',
      }}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

const S = {
  bar:         { display: 'flex', alignItems: 'center', gap: '10px', background: '#0d1320', borderRadius: '10px', padding: '10px 14px', border: '1px solid #1e2e47' },
  btns:        { display: 'flex', gap: '6px', flexShrink: 0 },
  scrubberWrap:{ flex: 1, position: 'relative', height: '20px', display: 'flex', alignItems: 'center' },
  track:       { position: 'absolute', left: 0, right: 0, height: '4px', background: '#131c2e', borderRadius: '2px', overflow: 'visible' },
  fill:        { height: '100%', background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)', borderRadius: '2px', transition: 'width 0.05s' },
  thumb:       { position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', background: '#60a5fa', border: '2px solid #080c14', boxShadow: '0 0 6px #3b82f688', transition: 'left 0.05s' },
  range:       { position: 'absolute', left: 0, right: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '20px' },
  time:        { display: 'flex', gap: '4px', alignItems: 'baseline', flexShrink: 0 },
  timeVal:     { fontSize: '13px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 600 },
  timeSep:     { fontSize: '11px', color: '#2d4060' },
  timeTot:     { fontSize: '11px', fontFamily: 'monospace', color: '#334155' },
  speedPills:  { display: 'flex', gap: '3px', flexShrink: 0 },
  speedPill:   { padding: '3px 7px', borderRadius: '5px', border: '1px solid', cursor: 'pointer', fontSize: '10px', fontWeight: 600, transition: 'all 0.1s' },
}
