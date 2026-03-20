export const MAP_CONFIG = {
  AmbroseValley: { scale: 900,  originX: -370, originZ: -473, imgW: 4320, imgH: 4320 },
  GrandRift:     { scale: 581,  originX: -290, originZ: -290, imgW: 2160, imgH: 2158 },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500, imgW: 9000, imgH: 9000 },
}

export const MAPS = Object.keys(MAP_CONFIG)
export const DATES = ['February_10','February_11','February_12','February_13','February_14']

export const EVENT_CONFIG = {
  Position:      { color: null,      label: 'Position',       shape: 'dot'    },
  BotPosition:   { color: null,      label: 'Bot Position',   shape: 'dot'    },
  Kill:          { color: '#ff4444', label: 'Kill (PvP)',      shape: 'star'   },
  Killed:        { color: '#ff8800', label: 'Killed (PvP)',    shape: 'cross'  },
  BotKill:       { color: '#ffcc00', label: 'Bot Kill',        shape: 'circle' },
  BotKilled:     { color: '#ff6666', label: 'Killed by Bot',   shape: 'cross'  },
  KilledByStorm: { color: '#aa44ff', label: 'Storm Death',     shape: 'x'      },
  Loot:          { color: '#44ff88', label: 'Loot',            shape: 'diamond'},
}

// Scale precomputed pixel coords to canvas coords
export function scaleToCanvas(px, py, mapId, canvasW, canvasH) {
  const cfg = MAP_CONFIG[mapId]
  return {
    cx: (px / cfg.imgW) * canvasW,
    cy: (py / cfg.imgH) * canvasH,
  }
}

// Assign a unique color per player
const PLAYER_COLORS = [
  '#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa',
  '#fb923c','#22d3ee','#f87171','#4ade80','#e879f9',
  '#facc15','#38bdf8','#f9a8d4','#6ee7b7','#c084fc',
]
export function getPlayerColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}