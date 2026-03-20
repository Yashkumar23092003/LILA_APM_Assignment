import { useEffect, useRef } from 'react'

export default function PlaybackBar({ maxTime, currentTime, isPlaying, speed, onTimeChange, onPlayPause, onSpeedChange }) {
  const rafRef = useRef(null)
  const lastRef = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      const tick = (now) => {
        if (lastRef.current !== null) {
          const delta = (now - lastRef.current) * speed
          onTimeChange(prev => Math.min(prev + delta, maxTime))
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

  const fmt = ms => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2,'0')}`
  }

  return (
    <div style={styles.bar}>
      <button style={styles.btn} onClick={onPlayPause}>
        {isPlaying ? '⏸' : '▶️'}
      </button>

      <button style={styles.btn} onClick={() => onTimeChange(0)} title="Reset">⏮</button>

      <input
        type="range" min={0} max={maxTime} value={currentTime} step={50}
        onChange={e => onTimeChange(Number(e.target.value))}
        style={styles.slider}
      />

      <span style={styles.time}>{fmt(currentTime)} / {fmt(maxTime)}</span>

      <select style={styles.speed} value={speed} onChange={e => onSpeedChange(Number(e.target.value))}>
        <option value={0.5}>0.5×</option>
        <option value={1}>1×</option>
        <option value={2}>2×</option>
        <option value={5}>5×</option>
        <option value={10}>10×</option>
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