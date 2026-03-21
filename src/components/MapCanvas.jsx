import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { MAP_CONFIG, EVENT_CONFIG, scaleToCanvas, getPlayerColor } from '../utils/mapConfig.js'
import { renderHeatmap } from '../utils/heatmap.js'
import { renderFlowVectors } from '../utils/flowVectors.js'

const MapCanvas = forwardRef(function MapCanvas({
  matchData, filters, playbackTime,
  heatmapMode, heatmapType,
  phaseMode,            // 'all' | 'early' | 'mid' | 'late'
  aggregateMode, aggregateData,
  showPaths, canvasSize = 700,
  showClusters  = false,
  showDeadZones = false,
  showFlowVectors = false, flowVectorData = null,
  zoneMode, onZoneSelect,
}, ref) {
  const canvasRef    = useRef(null)
  const imgRef       = useRef({})
  const [zoneRect,   setZoneRect]   = useState(null)
  const isDrawingRef = useRef(false)
  const zoneStartRef = useRef(null)

  const mapId  = matchData?.map_id || filters?.selectedMap || 'AmbroseValley'
  const mapCfg = MAP_CONFIG[mapId]

  useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }))

  useEffect(() => {
    if (!imgRef.current[mapId]) {
      const ext = mapId === 'Lockdown' ? 'jpg' : 'png'
      const img = new Image()
      img.src = `./minimaps/${mapId}_Minimap.${ext}`
      img.onload = () => { imgRef.current[mapId] = img; draw() }
    }
  }, [mapId])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvasSize, H = canvasSize

    ctx.clearRect(0, 0, W, H)

    // 1. Minimap background
    const bg = imgRef.current[mapId]
    if (bg) ctx.drawImage(bg, 0, 0, W, H)
    else { ctx.fillStyle = '#1a1f2e'; ctx.fillRect(0, 0, W, H) }

    // ─── AGGREGATE MODE ────────────────────────────────────────────
    if (aggregateMode && aggregateData) {
      const catMap = { position: 'position', kills: 'kills', deaths: 'deaths', loot: 'loot' }
      const cat    = catMap[heatmapType] || 'position'
      const rawPts = aggregateData.categories?.[cat] || []
      const pts    = rawPts.map(([px, py]) => scaleToCanvas(px, py, mapId, W, H))
      const colors = { position: '60,120,255', kills: '255,80,80', deaths: '255,140,0', loot: '80,255,140' }
      renderHeatmap(ctx, pts, W, H, colors[heatmapType] || '60,120,255', 22)

      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(8, 8, 230, 36)
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`📊 Cross-Match · ${aggregateData.total_matches} matches · ${cat}`, 16, 26)

      // Flow vectors overlay (works in aggregate mode too)
      if (showFlowVectors && flowVectorData) renderFlowVectors(ctx, flowVectorData, W, H)
      return
    }

    if (!matchData) return

    // Determine phase time bounds
    const maxT = Math.max(...matchData.players.flatMap(p => p.events.map(e => e.ts_norm_ms)), 1)
    let tMin = 0, tMax = playbackTime
    if (phaseMode && phaseMode !== 'all') {
      const third = maxT / 3
      if (phaseMode === 'early')      { tMin = 0;           tMax = Math.min(third, playbackTime) }
      else if (phaseMode === 'mid')   { tMin = third;       tMax = Math.min(third * 2, playbackTime) }
      else if (phaseMode === 'late')  { tMin = third * 2;   tMax = playbackTime }
    }

    const players = matchData.players.filter(p => {
      if (!filters.showHumans && !p.is_bot) return false
      if (!filters.showBots && p.is_bot)    return false
      if (filters.selectedPlayer && p.user_id !== filters.selectedPlayer) return false
      return true
    })

    const inPhase = (ts) => ts >= tMin && ts <= tMax

    // 2. Per-match heatmap (including Landing mode)
    if (heatmapMode) {
      const pts = []
      if (heatmapType === 'landing') {
        // First recorded position per player
        players.forEach(p => {
          const first = p.events.find(e => (e.event === 'Position' || e.event === 'BotPosition'))
          if (first && first.ts_norm_ms <= playbackTime) {
            pts.push(scaleToCanvas(first.px, first.py, mapId, W, H))
          }
        })
        renderHeatmap(ctx, pts, W, H, '200,100,255', 28)
        // Label
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(8, 8, 180, 28)
        ctx.fillStyle = '#e879f9'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(`🪂 Landing zones · ${pts.length} players`, 14, 22)
      } else {
        const heatTypes = {
          position: ['Position','BotPosition'],
          kills:    ['Kill','BotKill'],
          deaths:   ['Killed','BotKilled','KilledByStorm'],
          loot:     ['Loot'],
        }
        const colors = { position: '60,120,255', kills: '255,80,80', deaths: '255,140,0', loot: '80,255,140' }
        const types = heatTypes[heatmapType] || heatTypes.position
        players.forEach(p => {
          p.events.forEach(ev => {
            if (types.includes(ev.event) && inPhase(ev.ts_norm_ms))
              pts.push(scaleToCanvas(ev.px, ev.py, mapId, W, H))
          })
        })
        renderHeatmap(ctx, pts, W, H, colors[heatmapType] || '60,120,255', 20)

        // Phase label
        if (phaseMode && phaseMode !== 'all') {
          const pLabel = { early: 'Early game', mid: 'Mid game', late: 'Late game' }[phaseMode]
          ctx.fillStyle = 'rgba(0,0,0,0.55)'
          ctx.fillRect(8, 8, 160, 28)
          ctx.fillStyle = '#fbbf24'
          ctx.font = 'bold 11px sans-serif'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(`⏱ ${pLabel}`, 14, 22)
        }
      }
    }

    // 3. Dead Zone Radar — low-traffic cells
    if (showDeadZones) {
      const DGRID = 10
      const visitGrid = Array.from({length: DGRID}, () => new Array(DGRID).fill(0))
      let totalVisits = 0
      players.forEach(p => {
        p.events.forEach(ev => {
          if ((ev.event === 'Position' || ev.event === 'BotPosition') && ev.ts_norm_ms <= playbackTime) {
            const gx = Math.min(Math.floor((ev.px / mapCfg.imgW) * DGRID), DGRID - 1)
            const gy = Math.min(Math.floor((ev.py / mapCfg.imgH) * DGRID), DGRID - 1)
            visitGrid[gy][gx]++
            totalVisits++
          }
        })
      })
      if (totalVisits > 0) {
        const cellW = W / DGRID
        const cellH = H / DGRID
        const threshold = totalVisits / (DGRID * DGRID) * 0.3  // below 30% of average
        for (let r = 0; r < DGRID; r++) {
          for (let c = 0; c < DGRID; c++) {
            if (visitGrid[r][c] < threshold) {
              ctx.fillStyle = 'rgba(239,68,68,0.13)'
              ctx.fillRect(c * cellW, r * cellH, cellW, cellH)
              ctx.strokeStyle = 'rgba(239,68,68,0.35)'
              ctx.lineWidth = 1
              ctx.strokeRect(c * cellW + 0.5, r * cellH + 0.5, cellW - 1, cellH - 1)
              // Dead zone label for very empty cells
              if (visitGrid[r][c] === 0) {
                ctx.fillStyle = 'rgba(239,68,68,0.45)'
                ctx.font = 'bold 9px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('DEAD', c * cellW + cellW / 2, r * cellH + cellH / 2)
              }
            }
          }
        }
      }
    }

    // 4. Player paths
    if (showPaths) {
      players.forEach((player, idx) => {
        const color = getPlayerColor(idx)
        const pathEvs = player.events.filter(ev =>
          (ev.event === 'Position' || ev.event === 'BotPosition') && inPhase(ev.ts_norm_ms)
        )
        if (pathEvs.length < 2) return

        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth   = player.is_bot ? 1.5 : 2.5
        ctx.globalAlpha = 0.85
        ctx.setLineDash(player.is_bot ? [6, 4] : [])

        pathEvs.forEach((ev, i) => {
          const { cx, cy } = scaleToCanvas(ev.px, ev.py, mapId, W, H)
          if (i === 0) ctx.moveTo(cx, cy)
          else ctx.lineTo(cx, cy)
        })
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1.0

        if (pathEvs.length > 0) {
          const { cx, cy } = scaleToCanvas(pathEvs[0].px, pathEvs[0].py, mapId, W, H)
          ctx.beginPath()
          ctx.fillStyle = color
          ctx.arc(cx, cy, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    }

    // 5. Event markers
    const markerEvents = ['Kill','Killed','BotKill','BotKilled','KilledByStorm','Loot']
    players.forEach(player => {
      player.events.forEach(ev => {
        if (!markerEvents.includes(ev.event)) return
        if (!inPhase(ev.ts_norm_ms)) return
        if (!filters.activeEvents.includes(ev.event)) return
        const { cx, cy } = scaleToCanvas(ev.px, ev.py, mapId, W, H)
        const cfg = EVENT_CONFIG[ev.event]
        ctx.fillStyle   = cfg.color
        ctx.strokeStyle = '#fff'
        ctx.lineWidth   = 1.5
        ctx.beginPath()
        ctx.arc(cx, cy, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#000'
        ctx.font = 'bold 8px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ev.event[0], cx, cy)
      })
    })

    // 6. Death Cluster Detection (opt-in)
    if (!showClusters) {
      // Flow vectors overlay (per-match mode)
      if (showFlowVectors && flowVectorData) renderFlowVectors(ctx, flowVectorData, W, H)
      return
    }

    const GRID = 20
    const deathGrid = Array.from({length: GRID}, () => new Array(GRID).fill(0))
    let totalDeaths = 0
    players.forEach(p => {
      p.events.forEach(ev => {
        if (!['Killed','BotKilled','KilledByStorm'].includes(ev.event)) return
        if (!inPhase(ev.ts_norm_ms)) return
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
        if (!clusters.some(c => Math.hypot(c.cx - cx, c.cy - cy) < W * 0.15))
          clusters.push({cx, cy, count: cell.count})
      }

      clusters.forEach((cl, i) => {
        const label = ['①','②','③'][i]
        const pct   = Math.round((cl.count / totalDeaths) * 100)

        ctx.beginPath()
        ctx.arc(cl.cx, cl.cy, 18, 0, Math.PI*2)
        ctx.fillStyle = 'rgba(255,80,80,0.2)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(cl.cx, cl.cy, 13, 0, Math.PI*2)
        ctx.fillStyle   = '#ff4444'
        ctx.strokeStyle = '#fff'
        ctx.lineWidth   = 2
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#fff'
        ctx.font = 'bold 13px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, cl.cx, cl.cy)

        const bW = 36, bH = 16, bX = cl.cx - bW/2, bY = cl.cy + 17
        ctx.fillStyle = 'rgba(0,0,0,0.75)'
        ctx.beginPath()
        ctx.roundRect(bX, bY, bW, bH, 4)
        ctx.fill()
        ctx.fillStyle = '#ff9999'
        ctx.font = 'bold 10px sans-serif'
        ctx.fillText(`${pct}%`, cl.cx, bY + 8)
      })
    }

    // Flow vectors overlay (per-match mode, after clusters)
    if (showFlowVectors && flowVectorData) renderFlowVectors(ctx, flowVectorData, W, H)

  }, [matchData, filters, playbackTime, phaseMode, heatmapMode, heatmapType,
      aggregateMode, aggregateData, showPaths, showClusters, showDeadZones,
      showFlowVectors, flowVectorData, mapId, canvasSize])

  useEffect(() => { draw() }, [draw])

  // ─── ZONE DRAW TOOL ────────────────────────────────────────────
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvasSize / rect.width),
      y: (e.clientY - rect.top)  * (canvasSize / rect.height),
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
    if (Math.abs(rect.x2 - rect.x1) < 10 || Math.abs(rect.y2 - rect.y1) < 10) {
      setZoneRect(null); return
    }
    if (!matchData || !onZoneSelect) return

    const W = canvasSize, H = canvasSize
    const uniquePlayers = new Set()
    let positions = 0, kills = 0, deaths = 0, loot = 0

    const inZone = (px, py) => {
      const { cx, cy } = scaleToCanvas(px, py, mapId, W, H)
      return cx >= rect.x1 && cx <= rect.x2 && cy >= rect.y1 && cy <= rect.y2
    }

    matchData.players.forEach(p => {
      let visited = false
      p.events.forEach(ev => {
        if (ev.ts_norm_ms > playbackTime || !inZone(ev.px, ev.py)) return
        if (ev.event === 'Position' || ev.event === 'BotPosition') { positions++; visited = true }
        else if (ev.event === 'Kill' || ev.event === 'BotKill')    kills++
        else if (['Killed','BotKilled','KilledByStorm'].includes(ev.event)) deaths++
        else if (ev.event === 'Loot') loot++
        if (visited) uniquePlayers.add(p.user_id)
      })
    })

    onZoneSelect({ uniquePlayers: uniquePlayers.size, positions, kills, deaths, loot })
  }

  const toDisplayRect = (r) => {
    if (!r || !canvasRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = rect.width  / canvasSize
    const sy = rect.height / canvasSize
    return { left: Math.min(r.x1, r.x2) * sx, top: Math.min(r.y1, r.y2) * sy, width: Math.abs(r.x2 - r.x1) * sx, height: Math.abs(r.y2 - r.y1) * sy }
  }

  const displayZone = zoneMode ? toDisplayRect(zoneRect) : null

  return (
    <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <canvas
        ref={canvasRef} width={canvasSize} height={canvasSize}
        style={{ borderRadius: '8px', display: 'block', maxWidth: '100%', cursor: zoneMode ? 'crosshair' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {displayZone && (
        <div style={{
          position: 'absolute', left: displayZone.left, top: displayZone.top,
          width: displayZone.width, height: displayZone.height,
          border: '2px dashed #60a5fa', background: 'rgba(96,165,250,0.08)',
          pointerEvents: 'none', boxSizing: 'border-box', borderRadius: '2px',
        }} />
      )}
    </div>
  )
})

export default MapCanvas
