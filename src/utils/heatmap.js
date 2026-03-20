// Simple kernel density heatmap renderer on canvas
export function renderHeatmap(ctx, points, canvasW, canvasH, color = '255,100,50', radius = 30) {
  if (!points.length) return

  // Create offscreen canvas for accumulation
  const off = document.createElement('canvas')
  off.width = canvasW
  off.height = canvasH
  const octx = off.getContext('2d')

  points.forEach(({ cx, cy }) => {
    const grad = octx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    grad.addColorStop(0, 'rgba(255,255,255,0.15)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    octx.fillStyle = grad
    octx.beginPath()
    octx.arc(cx, cy, radius, 0, Math.PI * 2)
    octx.fill()
  })

  // Colorize
  const imageData = octx.getImageData(0, 0, canvasW, canvasH)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i] / 255
    if (alpha > 0) {
      const [r, g, b] = color.split(',').map(Number)
      data[i]     = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = Math.min(255, alpha * 600)
    }
  }
  octx.putImageData(imageData, 0, 0)
  ctx.globalAlpha = 0.65
  ctx.drawImage(off, 0, 0)
  ctx.globalAlpha = 1.0
}