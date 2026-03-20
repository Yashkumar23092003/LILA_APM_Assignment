import { useEffect, useRef } from 'react'

// At 1× speed the full match always plays over 30 seconds real time,
// regardless of how many ms the raw ts_norm_ms data spans.
// This prevents sub-second playback on matches with tight timestamps.
const FULL_PLAYBACK_REAL_MS = 30000

export default function PlaybackBar({ maxTime, currentTime, isPlaying, speed, onTimeChange, onPlayPause, onSpeedChange }) {
  const rafRef = useRef(null)
  const lastRef = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      const tick = (now) => {
        if (lastRef.current !== null) {
          const realDelta = now - lastRef.current
          // Advance game time proportional to real time, scaled to always
          // complete the full match in FULL_PLAYBACK_REAL_MS at 1× speed
          const gameDelta = (realDelta / FULL_PLAYBACK_REAL_MS) * maxTime * speed
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

  // Show elapsed % as a readable time (e.g. "0:15 / 0:30")
  const fmt = (val, max) => {
    const totalSec = FULL_PLAYBACK_REAL_MS / 1000
    const elapsed = Math.floor((val / max) * totalSec)
    const m = Math.floor(elapsed / 60)
    return `${m}:${String(elapsed % 60).padStart(2, '0')}`
  }

  return (
    <div style={styles.bar}>
      <button style={styles.btn} onClick={onPlayPause}>
        {isPlaying ? '⏸' : '▶️'}
      </button>

      <button style={styles.btn} onClick={() => onTimeChange(0)} title="Reset">⏮</button>

      <input
        type="range" min={0} max={maxTime} value={currentTime} step={maxTime / 500}
        onChange={e => onTimeChange(Number(e.target.value))}
        style={styles.slider}
      />

      <span style={styles.time}>
        {fmt(currentTime, maxTime)} / {fmt(maxTime, maxTime)}
      </span>

      <select style={styles.speed} value={speed} onChange={e => onSpeedChange(Number(e.target.value))}>
        <option value={0.1}>0.1×</option>
        <option value={0.25}>0.25×</option>
        <option value={0.5}>0.5×</option>
        <option value={1}>1×</option>
        <option value={2}>2×</option>
        <option value={5}>5×</option>
      </select>
    </div>
  )
}

const styles = {
  bar: { display: 'flex', alignItems: 'center', gap: '10px', background: '#1a1f2e', borderRadius: '8px', padding: '10px 16px', border: '1px solid #334155' },
  btn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '2px 4px' },
  slider: { flex: 1, accentColor: '#60a5fa' },
  time: { fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', fontFamily: 'monospace' },
  speed: { background: '#0f1117', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', padding: '3px 6px', fontSize: '12px' },
}