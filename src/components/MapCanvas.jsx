import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { MAP_CONFIG, EVENT_CONFIG, scaleToCanvas, getPlayerColor } from '../utils/mapConfig.js'
import { renderHeatmap } from '../utils/heatmap.js'

const MapCanvas = forwardRef(function MapCanvas({
  matchData, filters, playbackTime,
  heatmapMode, heatmapType,
  aggregateMode, aggregateData,
  showPaths, canvasSize = 700,
  zoneMode, onZoneSelect,
}, ref) {
  const canvasRef = useRef(null)
  const imgRef = useRef({})
  const [zoneRect, setZoneRect] = useState(null)   // { x1, y1, x2, y2 } in canvas px
  const isDrawingRef = useRef(false)
  const zoneStartRef = useRef(null)

  const mapId = matchData?.map_id || filters?.selectedMap || 'AmbroseValley'
  const mapCfg = MAP_CONFIG[mapId]

  // Expose canvas element to parent
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }))

  // Load minimap image (cache by mapId)
  useEffect(() => {
    if (!imgRef.current[mapId]) {
      const ext = mapId === 'Lockdown' ? 'jpg' : 'png'
      const img = new Image()
      img.src = `./minimaps/${mapId}_Minimap.${ext}`
      img.onload = () => {
        imgRef.current[mapId] = img
        draw()
      }
    }
  }, [mapId])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvasSize, H = canvasSize

    ctx.clearRect(0, 0, W, H)

    // 1. Draw minimap background
    const bg = imgRef.current[mapId]
    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H)
    } else {
      ctx.fillStyle = '#1a1f2e'
      ctx.fillRect(0, 0, W, H)
    }

    // ─── AGGREGATE MODE (cross-match heatmap) ──────────────────────────────
    if (aggregateMode && aggregateData) {
      const catMap = {
        position: 'position',
        kills:    'kills',
        deaths:   'deaths',
        loot:     'loot',
      }
      const cat = catMap[heatmapType] || 'position'
      const rawPts = aggregateData.categories?.[cat] || []
      const pts = rawPts.map(([px, py]) => scaleToCanvas(px, py, mapId, W, H))

      const colors = {
        position: '60,120,255',
        kills:    '255,80,80',
        deaths:   '255,140,0',
        loot:     '80,255,140',
      }
      renderHeatmap(ctx, pts, W, H, colors[heatmapType] || '60,120,255', 22)

      // Label overlay
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(8, 8, 220, 36)
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`📊 Cross-Match · ${aggregateData.total_matches} matches · ${cat}`, 16, 26)
      return  // skip per-match rendering in aggregate mode
    }

    if (!matchData) return

    const players = matchData.players.filter(p => {
      if (!filters.showHumans && !p.is_bot) return false
      if (!filters.showBots && p.is_bot) return false
      if (filters.selectedPlayer && p.user_id !== filters.selectedPlayer) return false
      return true
    })

    // 2. Heatmap overlay (per-match)
    if (heatmapMode) {
      const heatTypes = {
        position: ['Position','BotPosition'],
        kills:    ['Kill','BotKill'],
        deaths:   ['Killed','BotKilled','KilledByStorm'],
        loot:     ['Loot'],
      }
      const types = heatTypes[heatmapType] || heatTypes.position
      const colors = {
        position: '60,120,255',
        kills:    '255,80,80',
        deaths:   '255,140,0',
        loot:     '80,255,140',
      }
      const pts = []
      players.forEach(p => {
        p.events.forEach(ev => {
          if (types.includes(ev.event) && ev.ts_norm_ms <= playbackTime) {
            const { cx, cy } = scaleToCanvas(ev.px, ev.py, mapId, W, H)
            pts.push({ cx, cy })
          }
        })
      })
      renderHeatmap(ctx, pts, W, H, colors[heatmapType] || '60,120,255', 20)
    }

    // 3. Draw paths
    if (showPaths) {
      players.forEach((player, idx) => {
        const color = getPlayerColor(idx)
        const pathEvents = player.events.filter(ev =>
          (ev.event === 'Position' || ev.event === 'BotPosition') && ev.ts_norm_ms <= playbackTime
        )
        if (pathEvents.length < 2) return

        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = player.is_bot ? 1.5 : 2.5
        ctx.globalAlpha = 0.85
        if (player.is_bot) {
          ctx.setLineDash([6, 4])
        } else {
          ctx.setLineDash([])
        }

        pathEvents.forEach((ev, i) => {
          const { cx, cy } = scaleToCanvas(ev.px, ev.py, mapId, W, H)
          if (i === 0) ctx.moveTo(cx, cy)
          else ctx.lineTo(cx, cy)
        })
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1.0

        // Draw start dot
        if (pathEvents.length > 0) {
          const first = pathEvents[0]
          const { cx, cy } = scaleToCanvas(first.px, first.py, mapId, W, H)
          ctx.beginPath()
          ctx.fillStyle = color
          ctx.arc(cx, cy, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    }

    // 4. Draw event markers
    const markerEvents = ['Kill','Killed','BotKill','BotKilled','KilledByStorm','Loot']
    players.forEach((player, idx) => {
      player.events.forEach(ev => {
        if (!markerEvents.includes(ev.event)) return
        if (ev.ts_norm_ms > playbackTime) return
        if (!filters.activeEvents.includes(ev.event)) return

        const { cx, cy } = scaleToCanvas(ev.px, ev.py, mapId, W, H)
        const cfg = EVENT_CONFIG[ev.event]
        ctx.fillStyle = cfg.color
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5

        ctx.beginPath()
        ctx.arc(cx, cy, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Small letter inside marker
        ctx.fillStyle = '#000'
        ctx.font = 'bold 8px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ev.event[0], cx, cy)
      })
    })

    // 5. DEATH CLUSTER DETECTION — top 3 zones
    const GRID = 20
    const deathGrid = Array.from({length: GRID}, () => new Array(GRID).fill(0))
    let totalDeaths = 0
    players.forEach(p => {
      p.events.forEach(ev => {
        if (!['Killed','BotKilled','KilledByStorm'].includes(ev.event)) return
        if (ev.ts_norm_ms > playbackTime) return
        const {cx, cy} = scaleToCanvas(ev.px, ev.py, mapId, W, H)
        const gx = Math.min(Math.floor((cx / W) * GRID), GRID-1)
        const gy = Math.min(Math.floor((cy / H) * GRID), GRID-1)
        deathGrid[gy][gx]++
        totalDeaths++
      })
    })

    if (totalDeaths > 0) {
      const cells = []
      deathGrid.forEach((row, gy) => row.forEach((count, gx) => { if (count > 0) cells.push({gx, gy, count}) }))
      cells.sort((a,b) => b.count - a.count)

      const clusters = []
      for (const cell of cells) {
        if (clusters.length >= 3) break
        const cx = ((cell.gx + 0.5) / GRID) * W
        const cy = ((cell.gy + 0.5) / GRID) * H
        const tooClose = clusters.some(c => Math.hypot(c.cx - cx, c.cy - cy) < W * 0.15)
        if (!tooClose) clusters.push({cx, cy, count: cell.count})
      }

      clusters.forEach((cl, i) => {
        const label = ['①','②','③'][i]
        const pct = Math.round((cl.count / totalDeaths) * 100)

        ctx.beginPath()
        ctx.arc(cl.cx, cl.cy, 18, 0, Math.PI*2)
        ctx.fillStyle = 'rgba(255,80,80,0.2)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(cl.cx, cl.cy, 13, 0, Math.PI*2)
        ctx.fillStyle = '#ff4444'
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#fff'
        ctx.font = 'bold 13px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, cl.cx, cl.cy)

        const badgeW = 36, badgeH = 16, badgeX = cl.cx - badgeW/2, badgeY = cl.cy + 17
        ctx.fillStyle = 'rgba(0,0,0,0.75)'
        ctx.beginPath()
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4)
        ctx.fill()
        ctx.fillStyle = '#ff9999'
        ctx.font = 'bold 10px sans-serif'
        ctx.fillText(`${pct}%`, cl.cx, badgeY + 8)
      })
    }

  }, [matchData, filters, playbackTime, heatmapMode, heatmapType, aggregateMode, aggregateData, showPaths, mapId, canvasSize])

  useEffect(() => { draw() }, [draw])

  // ─── ZONE DRAW TOOL ───────────────────────────────────────────────────────
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasSize / rect.width
    const scaleY = canvasSize / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handleMouseDown = (e) => {
    if (!zoneMode) return
    const pos = getCanvasPos(e)
    isDrawingRef.current = true
    zoneStartRef.current = pos
    setZoneRect({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
  }

  const handleMouseMove = (e) => {
    if (!isDrawingRef.current || !zoneMode) return
    const pos = getCanvasPos(e)
    setZoneRect(prev => prev ? { ...prev, x2: pos.x, y2: pos.y } : null)
  }

  const handleMouseUp = (e) => {
    if (!isDrawingRef.current || !zoneMode) return
    isDrawingRef.current = false
    const pos = getCanvasPos(e)
    const rect = {
      x1: Math.min(zoneStartRef.current.x, pos.x),
      y1: Math.min(zoneStartRef.current.y, pos.y),
      x2: Math.max(zoneStartRef.current.x, pos.x),
      y2: Math.max(zoneStartRef.current.y, pos.y),
    }
    setZoneRect(rect)

    // Skip tiny accidental clicks
    if (Math.abs(rect.x2 - rect.x1) < 10 || Math.abs(rect.y2 - rect.y1) < 10) {
      setZoneRect(null)
      return
    }

    // Compute zone stats from matchData
    if (!matchData || !onZoneSelect) return

    const W = canvasSize, H = canvasSize
    const uniquePlayers = new Set()
    let positions = 0, kills = 0, deaths = 0, loot = 0

    const inZone = (px, py) => {
      const { cx, cy } = scaleToCanvas(px, py, mapId, W, H)
      return cx >= rect.x1 && cx <= rect.x2 && cy >= rect.y1 && cy <= rect.y2
    }

    matchData.players.forEach(p => {
      let playerVisited = false
      p.events.forEach(ev => {
        if (ev.ts_norm_ms > playbackTime) return
        if (!inZone(ev.px, ev.py)) return

        if (ev.event === 'Position' || ev.event === 'BotPosition') {
          positions++
          playerVisited = true
        } else if (ev.event === 'Kill' || ev.event === 'BotKill') {
          kills++
        } else if (ev.event === 'Killed' || ev.event === 'BotKilled' || ev.event === 'KilledByStorm') {
          deaths++
        } else if (ev.event === 'Loot') {
          loot++
        }
        if (playerVisited) uniquePlayers.add(p.user_id)
      })
    })

    onZoneSelect({ uniquePlayers: uniquePlayers.size, positions, kills, deaths, loot })
  }

  // Convert canvas-space rect to CSS rect (canvas may be displayed smaller than actual size)
  const toDisplayRect = (r) => {
    if (!r || !canvasRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = rect.width / canvasSize
    const scaleY = rect.height / canvasSize
    return {
      left: Math.min(r.x1, r.x2) * scaleX,
      top: Math.min(r.y1, r.y2) * scaleY,
      width: Math.abs(r.x2 - r.x1) * scaleX,
      height: Math.abs(r.y2 - r.y1) * scaleY,
    }
  }

  const displayZone = zoneMode ? toDisplayRect(zoneRect) : null

  return (
    <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          borderRadius: '8px',
          display: 'block',
          maxWidth: '100%',
          cursor: zoneMode ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {displayZone && (
        <div style={{
          position: 'absolute',
          left: displayZone.left,
          top: displayZone.top,
          width: displayZone.width,
          height: displayZone.height,
          border: '2px dashed #60a5fa',
          background: 'rgba(96,165,250,0.08)',
          pointerEvents: 'none',
          boxSizing: 'border-box',
          borderRadius: '2px',
        }} />
      )}
    </div>
  )
})

export default MapCanvas
