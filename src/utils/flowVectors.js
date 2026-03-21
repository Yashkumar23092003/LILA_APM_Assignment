/**
 * renderFlowVectors — draw movement direction arrows on a Canvas 2D context
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} vectorData  — flow_vectors_<MapId>.json content
 * @param {number} canvasW
 * @param {number} canvasH
 */
export function renderFlowVectors(ctx, vectorData, canvasW, canvasH) {
  if (!vectorData?.cells?.length) return

  const { grid, cells } = vectorData

  for (const cell of cells) {
    const cx = (cell.col + 0.5) / grid * canvasW
    const cy = (cell.row + 0.5) / grid * canvasH

    const t       = Math.min(cell.mag / 10, 1)
    const arrowLen = 4 + t * 14   // 4–18 px
    const lineW   = 1 + t * 1.5   // 1–2.5 px

    // Color: blue-white (low) → orange (high)
    const r  = Math.round(100 + t * 155)   // 100→255
    const g  = Math.round(180 - t * 30)    // 180→150
    const b  = Math.round(255 - t * 205)   // 255→50
    const a  = 0.4 + t * 0.5               // 0.4→0.9
    const color = `rgba(${r},${g},${b},${a})`

    const dx = cell.dx
    const dy = cell.dy
    const halfLen = arrowLen / 2

    const x1 = cx - dx * halfLen
    const y1 = cy - dy * halfLen
    const x2 = cx + dx * halfLen
    const y2 = cy + dy * halfLen

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth   = lineW
    ctx.lineCap     = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    // Arrowhead at tip (x2, y2)
    const angle = Math.atan2(dy, dx)
    const headLen = Math.max(arrowLen * 0.38, 3)
    const headAngle = Math.PI / 6  // 30 degrees

    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - headAngle),
      y2 - headLen * Math.sin(angle - headAngle)
    )
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + headAngle),
      y2 - headLen * Math.sin(angle + headAngle)
    )
    ctx.stroke()

    ctx.restore()
  }
}
