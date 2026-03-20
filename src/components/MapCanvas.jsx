import { useRef, useEffect, useCallback } from 'react'
import { MAP_CONFIG, EVENT_CONFIG, scaleToCanvas, getPlayerColor } from '../utils/mapConfig.js'
import { renderHeatmap } from '../utils/heatmap.js'

export default function MapCanvas({ matchData, filters, playbackTime, heatmapMode, heatmapType, showPaths, canvasSize = 700 }) {
  const canvasRef = useRef(null)
  const imgRef = useRef({})

  const mapId = matchData?.map_id || 'AmbroseValley'
  const mapCfg = MAP_CONFIG[mapId]

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

    if (!matchData) return

    const players = matchData.players.filter(p => {
      if (!filters.showHumans && !p.is_bot) return false
      if (!filters.showBots && p.is_bot) return false
      if (filters.selectedPlayer && p.user_id !== filters.selectedPlayer) return false
      return true
    })

    // 2. Heatmap overlay
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

  }, [matchData, filters, playbackTime, heatmapMode, heatmapType, showPaths, mapId, canvasSize])

  useEffect(() => { draw() }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{ borderRadius: '8px', display: 'block', maxWidth: '100%', cursor: 'crosshair' }}
    />
  )
}