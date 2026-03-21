import { useEffect, useRef, useState } from 'react'

const FULL_PLAYBACK_REAL_MS = 30000
const SPEEDS = [0.1, 0.25, 0.5, 1, 2, 5]

export default function PlaybackBar({ maxTime, currentTime, isPlaying, speed, onTimeChange, onPlayPause, onSpeedChange }) {
  const rafRef      = useRef(null)
  const lastRef     = useRef(null)
  const [scrubHover, setScrubHover] = useState(false)

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

  const pct        = Math.min((currentTime / maxTime) * 100, 100)
  const currentSec = Math.round((currentTime / maxTime) * 30)
  const totalSec   = 30

  const handleSecInput = (e) => {
    const sec = Math.max(0, Math.min(totalSec, Number(e.target.value)))
    onTimeChange((sec / totalSec) * maxTime)
  }

  return (
    <div style={S.wrap}>

      {/* ── Full-width scrubber (YouTube style) ── */}
      <div
        style={S.scrubZone}
        onMouseEnter={() => setScrubHover(true)}
        onMouseLeave={() => setScrubHover(false)}
      >
        {/* Track + fill */}
        <div style={{ ...S.track, height: scrubHover ? 5 : 3 }}>
          <div style={{ ...S.fill, width: pct + '%' }} />
          {/* Thumb — only visible on hover */}
          <div style={{
            ...S.thumb,
            left: pct + '%',
            opacity: scrubHover ? 1 : 0,
            transform: `translate(-50%, -50%) scale(${scrubHover ? 1 : 0.4})`,
          }} />
        </div>
        {/* Invisible range input on top for interaction */}
        <input
          type="range" min={0} max={maxTime} value={currentTime} step={maxTime / 500}
          onChange={e => onTimeChange(Number(e.target.value))}
          style={S.rangeOverlay}
        />
      </div>

      {/* ── Controls row ── */}
      <div style={S.controls}>

        {/* Left: reset + play + time */}
        <div style={S.left}>
          <button style={S.iconBtn} onClick={() => { onTimeChange(0) }} title="Restart">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </button>

          <button style={{ ...S.iconBtn, ...S.playBtn }} onClick={onPlayPause} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            }
          </button>

          {/* Time: editable current / fixed total */}
          <div style={S.timeDisplay}>
            <input
              type="number" min={0} max={totalSec} step={1}
              value={currentSec}
              onChange={handleSecInput}
              style={S.timeInput}
              title="Type a second to jump"
            />
            <span style={S.timeSep}> / </span>
            <span style={S.timeTotal}>{totalSec}s</span>
          </div>
        </div>

        {/* Right: speed pills */}
        <div style={S.speedRow}>
          {SPEEDS.map(s => (
            <button
              key={s}
              style={{
                ...S.speedPill,
                background:  speed === s ? '#1d4ed8' : 'transparent',
                color:       speed === s ? '#93c5fd' : '#334155',
                borderColor: speed === s ? '#3b82f6' : '#1e2e47',
              }}
              onClick={() => onSpeedChange(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const S = {
  wrap:        { background: '#0d1320', borderRadius: '10px', border: '1px solid #1e2e47', overflow: 'hidden', userSelect: 'none' },

  /* Scrubber */
  scrubZone:   { position: 'relative', width: '100%', height: '18px', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  track:       { position: 'absolute', left: 0, right: 0, background: '#1e2e47', borderRadius: '2px', transition: 'height 0.15s', overflow: 'visible' },
  fill:        { height: '100%', background: 'linear-gradient(90deg,#1d4ed8,#3b82f6)', borderRadius: '2px' },
  thumb:       {
    position: 'absolute', top: '50%',
    width: 14, height: 14, borderRadius: '50%',
    background: '#fff', boxShadow: '0 0 4px rgba(0,0,0,0.5)',
    transition: 'opacity 0.12s, transform 0.12s',
    pointerEvents: 'none',
  },
  rangeOverlay:{ position: 'absolute', left: 0, right: 0, width: '100%', height: '18px', opacity: 0, cursor: 'pointer' },

  /* Controls row */
  controls:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 8px' },
  left:        { display: 'flex', alignItems: 'center', gap: '10px' },

  iconBtn:     {
    width: 28, height: 28, borderRadius: '50%', border: 'none',
    background: 'transparent', color: '#94a3b8', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.12s, color 0.12s',
  },
  playBtn:     { background: '#3b82f6', color: '#fff', width: 30, height: 30 },

  timeDisplay: { display: 'flex', alignItems: 'center', gap: '2px' },
  timeInput:   {
    width: '36px', textAlign: 'center',
    background: 'transparent', border: 'none', outline: 'none',
    color: '#e2e8f0', fontSize: '14px', fontWeight: 700,
    fontFamily: "'Roboto Mono','Courier New',monospace",
    cursor: 'text',
    MozAppearance: 'textfield',
  },
  timeSep:     { fontSize: '13px', color: '#334155', fontWeight: 400 },
  timeTotal:   { fontSize: '13px', color: '#475569', fontFamily: "'Roboto Mono','Courier New',monospace" },

  speedRow:    { display: 'flex', gap: '3px' },
  speedPill:   {
    padding: '3px 8px', borderRadius: '5px', border: '1px solid',
    cursor: 'pointer', fontSize: '11px', fontWeight: 600,
    transition: 'all 0.1s',
  },
}
