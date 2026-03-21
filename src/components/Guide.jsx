import { useEffect, useState } from 'react'

/* ─── All CSS animations in one block ──────────────────────────── */
const CSS = `
@keyframes g-pageIn  { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:none} }
@keyframes g-pageOut { from{opacity:1;transform:none} to{opacity:0;transform:translateX(-24px)} }
@keyframes g-detailIn{ from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:none} }

/* paths */
@keyframes g-draw1 { 0%,8%{stroke-dashoffset:380} 48%,62%{stroke-dashoffset:0} 88%,100%{stroke-dashoffset:380} }
@keyframes g-draw2 { 0%,16%{stroke-dashoffset:340} 56%,62%{stroke-dashoffset:0} 88%,100%{stroke-dashoffset:340} }
@keyframes g-draw3 { 0%,24%{stroke-dashoffset:300} 62%{stroke-dashoffset:0} 88%,100%{stroke-dashoffset:300} }
.g-mk { transform-box:fill-box; transform-origin:center; }
@keyframes g-mkpop { 0%,64%{opacity:0;transform:scale(0)} 70%{transform:scale(1.3)} 76%,90%{opacity:1;transform:scale(1)} 96%,100%{opacity:0;transform:scale(0)} }

/* filter glow rows */
@keyframes g-fr1 { 0%,4%{background:transparent;border-color:#1e2e47;color:#334155} 10%,22%{background:#3b82f614;border-color:#3b82f6;color:#93c5fd} 28%,100%{background:transparent;border-color:#1e2e47;color:#334155} }
@keyframes g-fr2 { 0%,28%{background:transparent;border-color:#1e2e47;color:#334155} 34%,46%{background:#3b82f614;border-color:#3b82f6;color:#93c5fd} 52%,100%{background:transparent;border-color:#1e2e47;color:#334155} }
@keyframes g-fr3 { 0%,52%{background:transparent;border-color:#1e2e47;color:#334155} 58%,70%{background:#3b82f614;border-color:#3b82f6;color:#93c5fd} 76%,100%{background:transparent;border-color:#1e2e47;color:#334155} }
@keyframes g-fr4 { 0%,76%{background:transparent;border-color:#1e2e47;color:#334155} 82%,90%{background:#3b82f614;border-color:#3b82f6;color:#93c5fd} 96%,100%{background:transparent;border-color:#1e2e47;color:#334155} }

/* heat blobs */
@keyframes g-blob1 { 0%,12%{opacity:0} 45%,72%{opacity:0.85} 100%{opacity:0} }
@keyframes g-blob2 { 0%,24%{opacity:0} 55%,72%{opacity:0.75} 100%{opacity:0} }
@keyframes g-blob3 { 0%,36%{opacity:0} 65%,72%{opacity:0.65} 100%{opacity:0} }
@keyframes g-l2    { 0%,72%{opacity:0} 90%,100%{opacity:0.7} }

/* scrubber */
@keyframes g-scrub { 0%{width:0%} 78%,100%{width:94%} }
@keyframes g-evt1  { 0%,18%{opacity:0;transform:translateX(-50%) scale(0)} 28%,58%{opacity:1;transform:translateX(-50%) scale(1)} 68%,100%{opacity:0;transform:translateX(-50%) scale(0)} }
@keyframes g-evt2  { 0%,36%{opacity:0;transform:translateX(-50%) scale(0)} 46%,72%{opacity:1;transform:translateX(-50%) scale(1)} 82%,100%{opacity:0;transform:translateX(-50%) scale(0)} }

/* clusters */
@keyframes g-pin1 { 0%,6%{opacity:0;transform:translateY(-42px)} 22%{transform:translateY(5px)} 28%,82%{opacity:1;transform:translateY(0)} 92%,100%{opacity:0} }
@keyframes g-pin2 { 0%,24%{opacity:0;transform:translateY(-42px)} 40%{transform:translateY(5px)} 46%,82%{opacity:1;transform:translateY(0)} 92%,100%{opacity:0} }
@keyframes g-pin3 { 0%,44%{opacity:0;transform:translateY(-42px)} 60%{transform:translateY(5px)} 66%,82%{opacity:1;transform:translateY(0)} 92%,100%{opacity:0} }
@keyframes g-rip  { 0%{opacity:0.9;transform:translate(-50%,-50%) scale(0.15)} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.6)} }

/* rect draw */
@keyframes g-rect { 0%,5%{stroke-dashoffset:600} 52%,65%{stroke-dashoffset:0} 90%,100%{stroke-dashoffset:600} }
@keyframes g-statsIn { 0%,54%{opacity:0;transform:translateX(30px)} 70%,90%{opacity:1;transform:none} 98%,100%{opacity:0;transform:translateX(30px)} }

/* scorecard cards */
@keyframes g-sc1 { 0%,6%{opacity:0;transform:translateX(50px)} 26%,80%{opacity:1;transform:none} 92%,100%{opacity:0} }
@keyframes g-sc2 { 0%,22%{opacity:0;transform:translateX(50px)} 42%,80%{opacity:1;transform:none} 92%,100%{opacity:0} }
@keyframes g-sc3 { 0%,40%{opacity:0;transform:translateX(50px)} 60%,80%{opacity:1;transform:none} 92%,100%{opacity:0} }
@keyframes g-red { 0%,100%{box-shadow:0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 16px rgba(239,68,68,0.75)} }

/* dead zones */
@keyframes g-dz1 { 0%,10%{opacity:0} 30%,60%{opacity:0.85} 80%,100%{opacity:0} }
@keyframes g-dz2 { 0%,30%{opacity:0} 50%,60%{opacity:0.85} 80%,100%{opacity:0} }
@keyframes g-dz3 { 0%,50%{opacity:0} 65%,70%{opacity:0.85} 80%,100%{opacity:0} }

/* flow arrows */
@keyframes g-arr { 0%,20%{opacity:0;transform:scale(0.4)} 40%,80%{opacity:1;transform:scale(1)} 95%,100%{opacity:0} }

/* hover card lift */
.g-card:hover { border-color:#2d4060 !important; transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.4); }
.g-card { transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s; cursor:pointer; }
`

/* ─── Animation components (one per feature) ─────────────────── */
const DUR = '7s'

function AnimWhat() {
  return (
    <svg width="240" height="160" viewBox="0 0 240 160" style={SA.svg}>
      <rect width="240" height="160" fill="#0d1320"/>
      <path d="M0,115 Q60,88 120,78 Q175,68 240,45" fill="none" stroke="#141e2e" strokeWidth="14"/>
      <path d="M15,140 Q58,104 108,82 Q152,60 215,42" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeDasharray="380" style={{animation:`g-draw1 ${DUR} ease-in-out infinite`}}/>
      <path d="M15,130 Q55,96 102,76 Q148,56 210,50" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeDasharray="340" style={{animation:`g-draw2 ${DUR} ease-in-out infinite`}}/>
      <path d="M20,145 Q65,112 110,92 Q155,72 215,62" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="8,4" style={{animation:`g-draw3 ${DUR} ease-in-out infinite`}}/>
      <g className="g-mk" style={{animation:`g-mkpop ${DUR} ease infinite`}}>
        <circle cx="108" cy="82" r="6" fill="#ef444420" stroke="#ef4444" strokeWidth="1.5"/>
        <line x1="105" y1="79" x2="111" y2="85" stroke="#ef4444" strokeWidth="1.5"/>
        <line x1="111" y1="79" x2="105" y2="85" stroke="#ef4444" strokeWidth="1.5"/>
      </g>
      <g className="g-mk" style={{animation:`g-mkpop ${DUR} ease infinite`,animationDelay:'-0.6s'}}>
        <circle cx="158" cy="60" r="6" fill="#ef444420" stroke="#ef4444" strokeWidth="1.5"/>
        <line x1="155" y1="57" x2="161" y2="63" stroke="#ef4444" strokeWidth="1.5"/>
        <line x1="161" y1="57" x2="155" y2="63" stroke="#ef4444" strokeWidth="1.5"/>
      </g>
    </svg>
  )
}

function AnimFilters() {
  const rows = [
    { label:'🗺️  Map', a:'g-fr1' }, { label:'📅  Date', a:'g-fr2' },
    { label:'🎮  Match', a:'g-fr3' }, { label:'👤 🤖  Player Type', a:'g-fr4' },
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'8px',width:'220px'}}>
      {rows.map(r => (
        <div key={r.label} style={{padding:'9px 14px',borderRadius:'8px',border:'1px solid',fontSize:'12px',fontWeight:600,
          animation:`${r.a} ${DUR} ease-in-out infinite`}}>
          {r.label}
        </div>
      ))}
    </div>
  )
}

function AnimPaths() {
  return (
    <svg width="240" height="150" viewBox="0 0 240 150" style={SA.svg}>
      <rect width="240" height="150" fill="#0d1320"/>
      <path d="M15,130 Q80,90 130,70 Q175,50 225,35" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="340" style={{animation:`g-draw1 ${DUR} ease-in-out infinite`}}/>
      <path d="M15,140 Q75,108 125,90 Q172,72 225,65" fill="none" stroke="#f472b6" strokeWidth="2" strokeDasharray="10,5" style={{animation:`g-draw2 ${DUR} ease-in-out infinite`}}/>
      <text x="60" y="56" fill="#93c5fd" fontSize="11" fontWeight="700" style={{animation:`g-mkpop ${DUR} ease infinite`,transformBox:'fill-box',transformOrigin:'center'}}>Human 🔵</text>
      <text x="60" y="115" fill="#f9a8d4" fontSize="11" fontWeight="700" style={{animation:`g-mkpop ${DUR} ease infinite`,animationDelay:'-0.8s',transformBox:'fill-box',transformOrigin:'center'}}>Bot 🩷</text>
    </svg>
  )
}

function AnimHeatmap() {
  return (
    <svg width="240" height="150" viewBox="0 0 240 150" style={SA.svg}>
      <rect width="240" height="150" fill="#0d1320"/>
      <defs>
        <radialGradient id="h1"><stop offset="0%" stopColor="#ef4444"/><stop offset="100%" stopColor="#ef444400"/></radialGradient>
        <radialGradient id="h2"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#f59e0b00"/></radialGradient>
        <radialGradient id="h3"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#3b82f600"/></radialGradient>
        <radialGradient id="h4"><stop offset="0%" stopColor="#ef4444"/><stop offset="100%" stopColor="#ef444400"/></radialGradient>
        <radialGradient id="h5"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#f59e0b00"/></radialGradient>
      </defs>
      <ellipse cx="110" cy="75" rx="55" ry="45" fill="url(#h3)" style={{animation:`g-blob1 ${DUR} ease-in-out infinite`}}/>
      <ellipse cx="110" cy="75" rx="35" ry="28" fill="url(#h2)" style={{animation:`g-blob2 ${DUR} ease-in-out infinite`}}/>
      <ellipse cx="110" cy="75" rx="18" ry="14" fill="url(#h1)" style={{animation:`g-blob3 ${DUR} ease-in-out infinite`}}/>
      <ellipse cx="170" cy="55" rx="30" ry="22" fill="url(#h5)" style={{animation:`g-l2 ${DUR} ease-in-out infinite`}}/>
      <ellipse cx="60" cy="105" rx="28" ry="20" fill="url(#h4)" style={{animation:`g-l2 ${DUR} ease-in-out infinite`,animationDelay:'-0.4s'}}/>
    </svg>
  )
}

function AnimPlayback() {
  return (
    <div style={{width:'240px',display:'flex',flexDirection:'column',gap:'10px'}}>
      <div style={{position:'relative',height:'28px',display:'flex',alignItems:'center'}}>
        <div style={{position:'absolute',left:0,right:0,height:'4px',background:'#1e2e47',borderRadius:'2px'}}>
          <div style={{height:'100%',background:'linear-gradient(90deg,#1d4ed8,#3b82f6)',borderRadius:'2px',animation:`g-scrub ${DUR} ease-in-out infinite`}}/>
        </div>
        <div style={{position:'absolute',top:'50%',left:'32%',width:10,height:10,borderRadius:'50%',background:'#ef4444',transform:'translateX(-50%) translateY(-50%)',animation:`g-evt1 ${DUR} ease infinite`}}/>
        <div style={{position:'absolute',top:'50%',left:'62%',width:10,height:10,borderRadius:'50%',background:'#f59e0b',transform:'translateX(-50%) translateY(-50%)',animation:`g-evt2 ${DUR} ease infinite`}}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{width:28,height:28,borderRadius:'50%',background:'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'#fff'}}>▶</div>
        <span style={{fontFamily:'monospace',color:'#e2e8f0',fontSize:'14px',fontWeight:700}}>12 / 30s</span>
        <div style={{marginLeft:'auto',background:'#111827',border:'1px solid #1e2e47',borderRadius:'6px',padding:'3px 10px',color:'#93c5fd',fontSize:'12px',fontWeight:700}}>1×</div>
      </div>
    </div>
  )
}

function AnimClusters() {
  const pins = [
    {cx:85, cy:82, label:'①', pct:'38%', anim:'g-pin1'},
    {cx:145, cy:60, label:'②', pct:'24%', anim:'g-pin2'},
    {cx:60, cy:110, label:'③', pct:'17%', anim:'g-pin3'},
  ]
  return (
    <svg width="240" height="155" viewBox="0 0 240 155" style={SA.svg}>
      <rect width="240" height="155" fill="#0d1320"/>
      {pins.map((p) => (
        <g key={p.label} style={{animation:`${p.anim} ${DUR} ease infinite`}}>
          <ellipse cx={p.cx} cy={p.cy+2} rx="10" ry="4" fill="#00000060"/>
          <circle cx={p.cx} cy={p.cy} r="14" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.5"/>
          <text x={p.cx} y={p.cy+5} textAnchor="middle" fill="white" fontSize="12" fontWeight="800">{p.label}</text>
          <text x={p.cx} y={p.cy+22} textAnchor="middle" fill="#94a3b8" fontSize="9">{p.pct}</text>
          <circle cx={p.cx} cy={p.cy} r="14" fill="none" stroke="#ef4444" strokeWidth="2" style={{animation:`g-rip 2s ease-out infinite`}}/>
        </g>
      ))}
    </svg>
  )
}

function AnimZoneDraw() {
  return (
    <svg width="240" height="155" viewBox="0 0 240 155" style={SA.svg}>
      <rect width="240" height="155" fill="#0d1320"/>
      <rect x="35" y="35" width="105" height="85" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="8,4"
        strokeDashoffset="600" style={{animation:`g-rect ${DUR} ease-in-out infinite`}}/>
      <rect x="35" y="35" width="105" height="85" fill="#3b82f608"/>
      <g style={{animation:`g-statsIn ${DUR} ease-in-out infinite`}}>
        <rect x="150" y="38" width="78" height="78" rx="7" fill="#111827" stroke="#1e2e47" strokeWidth="1"/>
        <text x="189" y="58" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">PLAYERS</text>
        <text x="189" y="72" textAnchor="middle" fill="#60a5fa" fontSize="17" fontWeight="800">14</text>
        <line x1="160" y1="80" x2="218" y2="80" stroke="#1e2e47" strokeWidth="1"/>
        <text x="189" y="93" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">KILLS</text>
        <text x="189" y="106" textAnchor="middle" fill="#ef4444" fontSize="17" fontWeight="800">31</text>
      </g>
    </svg>
  )
}

function AnimScorecard() {
  const cards = [
    {label:'D3', color:'#10b981', rating:'BALANCED', kd:'3.5', visit:'42%', a:'g-sc1'},
    {label:'F2', color:'#f59e0b', rating:'ATTENTION', kd:'21.9', visit:'27%', a:'g-sc2'},
    {label:'A2', color:'#ef4444', rating:'PROBLEM', kd:'2.0', visit:'18%', a:'g-sc3', pulse:true},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'7px',width:'200px'}}>
      {cards.map(c => (
        <div key={c.label} style={{
          display:'flex',alignItems:'center',gap:'10px',
          background:'#0d1320',border:`1px solid ${c.color}40`,borderLeft:`3px solid ${c.color}`,
          borderRadius:'8px',padding:'9px 12px',
          animation:`${c.a} ${DUR} ease infinite`,
          ...(c.pulse ? {boxShadow:'0 0 0 rgba(239,68,68,0)',animationName:`${c.a}, g-red`} : {})
        }}>
          <span style={{fontSize:'13px',fontWeight:800,color:c.color,minWidth:22}}>{c.label}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:'10px',color:'#64748b'}}>{c.rating}</div>
            <div style={{fontSize:'11px',color:'#cbd5e1',fontWeight:600}}>K/D {c.kd} · {c.visit} visited</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AnimDeadZones() {
  const dead = [{x:2,y:1,a:'g-dz1'},{x:4,y:3,a:'g-dz2'},{x:1,y:4,a:'g-dz3'}]
  const cells = Array.from({length:30},(_,i)=>({x:i%6,y:Math.floor(i/6)}))
  return (
    <svg width="230" height="155" viewBox="0 0 230 155" style={SA.svg}>
      <rect width="230" height="155" fill="#0d1320"/>
      {cells.map(c => (
        <rect key={`${c.x}${c.y}`} x={20+c.x*32} y={15+c.y*27} width="28" height="23" rx="3" fill="#111827" stroke="#1a2436" strokeWidth="1"/>
      ))}
      {dead.map(d => (
        <g key={`${d.x}${d.y}`} style={{animation:`${d.a} ${DUR} ease-in-out infinite`}}>
          <rect x={20+d.x*32} y={15+d.y*27} width="28" height="23" rx="3" fill="#ef444430" stroke="#ef4444" strokeWidth="1.5"/>
          <text x={34+d.x*32} y={30+d.y*27} textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="700">DEAD</text>
        </g>
      ))}
    </svg>
  )
}

function AnimFlow() {
  const arrows = [
    {x:50,y:45,dx:14,dy:-8},{x:90,y:45,dx:12,dy:-12},{x:130,y:45,dx:8,dy:-14},
    {x:50,y:85,dx:16,dy:0},{x:90,y:85,dx:14,dy:-6},{x:130,y:85,dx:10,dy:-12},
    {x:50,y:125,dx:16,dy:4},{x:90,y:125,dx:16,dy:-2},{x:130,y:125,dx:12,dy:-10},
    {x:170,y:45,dx:6,dy:-14},{x:170,y:85,dx:8,dy:-12},{x:170,y:125,dx:10,dy:-10},
  ]
  return (
    <svg width="240" height="155" viewBox="0 0 240 155" style={SA.svg}>
      <rect width="240" height="155" fill="#0d1320"/>
      {arrows.map((a,i) => {
        const len = Math.sqrt(a.dx*a.dx+a.dy*a.dy)
        const mag = len/16
        const col = mag > 0.8 ? '#fb923c' : mag > 0.6 ? '#60a5fa' : '#94a3b8'
        return (
          <g key={i} style={{animation:`g-arr ${DUR} ease-in-out infinite`,animationDelay:`${-i*0.25}s`,transformOrigin:`${a.x}px ${a.y}px`}}>
            <line x1={a.x-a.dx/2} y1={a.y-a.dy/2} x2={a.x+a.dx/2} y2={a.y+a.dy/2} stroke={col} strokeWidth="2" strokeLinecap="round" markerEnd={`url(#arr${i%3})`}/>
          </g>
        )
      })}
      <defs>
        {['#94a3b8','#60a5fa','#fb923c'].map((c,i)=>(
          <marker key={i} id={`arr${i}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={c}/>
          </marker>
        ))}
      </defs>
    </svg>
  )
}

function AnimPlayerList() {
  const players = [
    {id:'Player_7f2a',color:'#3b82f6',human:true},{id:'Player_9c1e',color:'#10b981',human:true},
    {id:'Bot_0042',color:'#f472b6',human:false},{id:'Player_3d8b',color:'#a78bfa',human:true},
  ]
  return (
    <div style={{width:'200px',display:'flex',flexDirection:'column',gap:'5px'}}>
      {players.map((p,i) => (
        <div key={p.id} style={{
          display:'flex',alignItems:'center',gap:'9px',padding:'8px 11px',
          background: i===1 ? '#1d4ed822' : '#0d1320',
          border:`1px solid ${i===1 ? '#3b82f6' : '#1a2436'}`,
          borderRadius:'7px',fontSize:'11px',fontWeight:600,
          animation: i===1 ? `g-fr2 6s ease-in-out infinite` : 'none'
        }}>
          <div style={{width:10,height:10,borderRadius:'50%',background:p.color,flexShrink:0}}/>
          <span style={{color:'#cbd5e1',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.id}</span>
          <span style={{fontSize:'9px',color: p.human ? '#60a5fa' : '#f472b6'}}>{p.human ? '👤' : '🤖'}</span>
        </div>
      ))}
    </div>
  )
}

function AnimPhase() {
  const phases = [{label:'Early',c:'#22d3ee'},{label:'Mid',c:'#f59e0b'},{label:'Late',c:'#ef4444'}]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px',width:'220px'}}>
      <div style={{height:'6px',background:'linear-gradient(90deg,#22d3ee,#f59e0b,#ef4444)',borderRadius:'3px'}}/>
      <div style={{display:'flex',gap:'6px'}}>
        {phases.map((p,i) => (
          <div key={p.label} style={{
            flex:1,padding:'10px 6px',borderRadius:'7px',textAlign:'center',
            background:`${p.c}18`,border:`1px solid ${p.c}40`,
            animation:`g-blob${i+1} ${DUR} ease-in-out infinite`,
          }}>
            <div style={{fontSize:'10px',fontWeight:700,color:p.c}}>{p.label}</div>
            <div style={{fontSize:'9px',color:'#475569',marginTop:3}}>{['0–10min','10–20min','20–30min'][i]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Card definitions ───────────────────────────────────────── */
const CARDS = [
  { id:'what',    icon:'🗺️',  title:'What is this?',          group:'Overview',
    short:'A visual tool for Level Designers to understand player behaviour in LILA BLACK.',
    full:'LILA Journey Viewer lets you load any match from 796 recorded games and watch how players moved, fought, and died across your maps. It's built specifically for level design review — not stats dashboards. You're here to ask: are players using my map the way I designed it?',
    Anim: AnimWhat },
  { id:'map',     icon:'🗺️',  title:'Map Filter',              group:'Filters',
    short:'Switch between AmbroseValley, GrandRift, and Lockdown.',
    full:'Select your target map from the left panel dropdown. Changing map resets the match selection and reloads aggregate data. Each map has its own heatmap, scorecard, and flow vector data precomputed across all 796 matches.',
    Anim: AnimFilters },
  { id:'match',   icon:'🎮',  title:'Match & Date Filter',     group:'Filters',
    short:'Filter by date and select a specific match to load.',
    full:'Use the Date filter to narrow down to a specific day of data. Then select a match — each one is a full game session with per-player event data. Once loaded, all tools (playback, heatmaps, clusters) activate for that match.',
    Anim: AnimFilters },
  { id:'bots',    icon:'👤🤖', title:'Humans vs Bots',         group:'Filters',
    short:'Toggle human players, bot players, or both.',
    full:'Bots are detected by numeric user ID prefixes; humans have UUID-style IDs. You can isolate human-only paths to understand real navigation decisions, or view bots separately to audit AI pathing against expected routes.',
    Anim: AnimFilters },
  { id:'paths',   icon:'🛤',  title:'Player Paths',            group:'Visualise',
    short:'Solid lines = humans. Dashed lines = bots. Each player gets a unique colour.',
    full:'Every player\'s position events are connected into a continuous path. Solid coloured lines are humans, dashed pink lines are bots. You can click any player in the right panel to isolate their journey. This is the fastest way to see where players actually go vs where you expected them to go.',
    Anim: AnimPaths },
  { id:'heatmap', icon:'🌡',  title:'Heatmap',                 group:'Visualise',
    short:'Kernel-density map of activity in a single match.',
    full:'Heatmap uses kernel density estimation across all position, kill, death, or loot events in the loaded match. Red = crowded, blue = sparse. Switch between layers: Position, Kills, Deaths, Loot, or First Drop (landing zones). Each layer tells a different story about how the match played out.',
    Anim: AnimHeatmap },
  { id:'cross',   icon:'📊',  title:'Cross-Match Heatmap',     group:'Visualise',
    short:'Aggregate of all 796 matches — the permanent traffic patterns.',
    full:'Instead of one match, this pulls precomputed data across every recorded session. The patterns you see here are statistically stable — these are the corridors players always use, the zones they always avoid, the chokepoints that never stop being chokepoints. Critical for long-term balance reviews.',
    Anim: AnimHeatmap },
  { id:'phase',   icon:'⏱',  title:'Phase Split',             group:'Visualise',
    short:'Split heatmap by Early / Mid / Late match phase.',
    full:'When Heatmap is on, use phase tabs to slice the match into thirds (by time). Early shows landing and first-movement patterns. Mid shows the fighting spread. Late shows final-circle positioning. This reveals whether your map\'s early-game experience and late-game experience actually use different spaces.',
    Anim: AnimPhase },
  { id:'scorecard',icon:'⬡', title:'Zone Balance Scorecard',  group:'Analysis',
    short:'Per-zone traffic, K/D ratio, and loot density across all matches.',
    full:'Precomputed over all 796 matches, the scorecard divides each map into a 6×6 grid and scores every zone on: visit percentage (how many players enter), K/D ratio (how deadly it is), and loot density (how much loot spawns there). Zones are rated Green / Yellow / Red. Red zones need your attention.',
    Anim: AnimScorecard },
  { id:'deadzones',icon:'☠', title:'Dead Zones',              group:'Analysis',
    short:'Red overlay on areas visited by fewer than 30% of players.',
    full:'A 10×10 grid is laid over the map. Any cell where average player traffic falls below the 30th percentile is flagged red with a "DEAD" label. These are areas that real players consistently skip. Could be inaccessible terrain, bad loot spawn, or simply not on any natural path between objectives.',
    Anim: AnimDeadZones },
  { id:'clusters',icon:'🔴', title:'Death Clusters',          group:'Analysis',
    short:'Top 3 death-concentration zones ranked ①②③.',
    full:'A 20×20 grid counts deaths per cell across the match. The top 3 non-adjacent clusters are marked ①②③, ranked by their share of total match deaths. This tells you exactly where your map is punishing — whether that\'s intended (contested hot drop) or a design surprise (unexpected crossfire angle).',
    Anim: AnimClusters },
  { id:'flow',    icon:'↗',  title:'Flow Vectors',            group:'Analysis',
    short:'Arrow map showing dominant movement direction per grid cell.',
    full:'Consecutive position events are used to compute a dominant movement vector for each cell in a 20×20 grid. Arrow length is log-scaled by traffic volume. Blue-white arrows = light traffic, orange = heavy. This is your player routing diagram — it shows the paths players actually create vs the ones you designed.',
    Anim: AnimFlow },
  { id:'scrubber',icon:'▶',  title:'Playback Timeline',       group:'Playback',
    short:'Scrub through the match second by second.',
    full:'The normalised 30-second timeline maps the full match duration into a consistent scale. Drag the scrubber to any point to see exactly which players were alive, where they were, and what events had just happened. All path rendering and event markers update live as you drag. Type a second directly into the time input to jump instantly.',
    Anim: AnimPlayback },
  { id:'speed',   icon:'⚡',  title:'Speed Control',          group:'Playback',
    short:'From 0.1× slow-motion to 5× fast-forward.',
    full:'Hit play then adjust speed with the dropdown. 0.1× gives you frame-by-frame-style analysis of individual fights. 1× is the default normalised pace. 5× lets you watch the whole match in about 6 seconds to spot macro patterns without scrubbing manually.',
    Anim: AnimPlayback },
  { id:'zone',    icon:'🎯',  title:'Zone Draw Tool',         group:'Advanced',
    short:'Draw a rectangle anywhere to get instant area stats.',
    full:'Enable Zone Draw in the Analysis dropdown, then drag a rectangle on the map. You\'ll instantly see: unique players who passed through, total kills, total deaths, and loot pickups within that rectangle. Drag as many as you like to compare two regions side-by-side or measure specific POI performance.',
    Anim: AnimZoneDraw },
  { id:'players', icon:'👥',  title:'Player List',            group:'Advanced',
    short:'Click any player in the right panel to isolate their path.',
    full:'When a match is loaded, all players appear in the right panel list with their colour indicator and human/bot tag. Click a player to filter the map to show only their paths and events. Click again to deselect. Useful when a specific player\'s route looks unusual and you want to trace their full journey.',
    Anim: AnimPlayerList },
]

/* ─── Group the cards ─────────────────────────────────────────── */
const GROUPS = [...new Set(CARDS.map(c => c.group))]

/* ─── Main Guide component ───────────────────────────────────── */
export default function Guide({ onClose }) {
  const [active, setActive] = useState(null) // card id

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') { active ? setActive(null) : onClose() } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [active, onClose])

  const detail = active ? CARDS.find(c => c.id === active) : null

  return (
    <>
      <style>{CSS}</style>
      <div style={S.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
        <div style={S.modal}>

          {/* ── Header ── */}
          <div style={S.header}>
            <div style={S.hLeft}>
              <div style={S.hIcon}>▲</div>
              <div>
                <div style={S.hTitle}>LILA Journey Viewer — Guide</div>
                <div style={S.hSub}>{active ? 'Click anywhere outside or press Esc to go back' : 'Click any card to see an animated explanation'}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              {active && <button style={S.backBtn} onClick={() => setActive(null)}>← Back</button>}
              <button style={S.closeBtn} onClick={onClose}>✕ Close</button>
            </div>
          </div>

          {/* ── Detail view ── */}
          {detail && (
            <div style={{...S.body, animation:'g-detailIn 0.3s ease both'}}>
              <div style={S.detailLayout}>
                {/* Left: animation */}
                <div style={S.animPane}>
                  <detail.Anim />
                </div>
                {/* Right: text */}
                <div style={S.textPane}>
                  <div style={S.detailGroup}>{detail.group}</div>
                  <div style={S.detailIcon}>{detail.icon}</div>
                  <h2 style={S.detailTitle}>{detail.title}</h2>
                  <p style={S.detailBody}>{detail.full}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Card grid ── */}
          {!detail && (
            <div style={{...S.body, animation:'g-pageIn 0.25s ease both'}}>
              {GROUPS.map(group => (
                <div key={group} style={S.section}>
                  <div style={S.sectionLabel}>{group}</div>
                  <div style={S.grid}>
                    {CARDS.filter(c => c.group === group).map(card => (
                      <div
                        key={card.id}
                        className="g-card"
                        style={{...S.card, ...(card.id === 'what' ? S.wideCard : {})}}
                        onClick={() => setActive(card.id)}
                      >
                        <div style={S.cardTop}>
                          <span style={S.cardIcon}>{card.icon}</span>
                          <span style={S.cardTitle}>{card.title}</span>
                          <span style={S.cardArrow}>→</span>
                        </div>
                        <p style={S.cardDesc}>{card.short}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={S.tip}>
                💡 <strong>Start here:</strong> Select a Map → pick a Match in the left panel → then explore Visualise and Analysis tools.
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

const SA = {
  svg: { borderRadius: 8, border: '1px solid #1e2e47', display:'block' }
}

const S = {
  overlay: { position:'fixed', inset:0, background:'rgba(4,8,16,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9000, backdropFilter:'blur(5px)' },
  modal:   { width:'min(880px,95vw)', maxHeight:'90vh', background:'#080c14', border:'1px solid #1e2e47', borderRadius:'14px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 28px 80px rgba(0,0,0,0.9)' },

  header:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid #1e2e47', flexShrink:0 },
  hLeft:   { display:'flex', alignItems:'center', gap:'12px' },
  hIcon:   { width:32, height:32, borderRadius:'8px', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', color:'#fff', fontWeight:700 },
  hTitle:  { fontSize:'14px', fontWeight:700, color:'#f1f5f9' },
  hSub:    { fontSize:'11px', color:'#334155', marginTop:'2px' },
  closeBtn:{ padding:'5px 12px', borderRadius:'6px', border:'1px solid #1e2e47', background:'transparent', color:'#475569', fontSize:'12px', fontWeight:600, cursor:'pointer' },
  backBtn: { padding:'5px 12px', borderRadius:'6px', border:'1px solid #1e2e47', background:'#0d1320', color:'#60a5fa', fontSize:'12px', fontWeight:600, cursor:'pointer' },

  body:    { overflowY:'auto', padding:'18px 22px 26px', display:'flex', flexDirection:'column', gap:'22px', flex:1 },

  section:      { display:'flex', flexDirection:'column', gap:'9px' },
  sectionLabel: { fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', color:'#334155', textTransform:'uppercase', paddingBottom:'4px', borderBottom:'1px solid #0f1923' },
  grid:         { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px' },
  card:         { background:'#0d1320', border:'1px solid #1a2740', borderRadius:'10px', padding:'14px 16px', display:'flex', flexDirection:'column', gap:'7px' },
  wideCard:     { gridColumn:'1 / -1' },
  cardTop:      { display:'flex', alignItems:'center', gap:'8px' },
  cardIcon:     { fontSize:'15px', lineHeight:1 },
  cardTitle:    { fontSize:'13px', fontWeight:700, color:'#cbd5e1', flex:1 },
  cardArrow:    { fontSize:'12px', color:'#2d4060', transition:'color 0.15s' },
  cardDesc:     { fontSize:'12px', color:'#475569', lineHeight:1.65, margin:0 },

  // Detail view
  detailLayout: { display:'flex', gap:'28px', alignItems:'flex-start' },
  animPane:     { flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', background:'#0b1120', borderRadius:'12px', border:'1px solid #1a2436', minWidth:260 },
  textPane:     { flex:1, display:'flex', flexDirection:'column', gap:'10px' },
  detailGroup:  { fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', color:'#334155', textTransform:'uppercase' },
  detailIcon:   { fontSize:'32px', lineHeight:1 },
  detailTitle:  { fontSize:'20px', fontWeight:800, color:'#f1f5f9', margin:0 },
  detailBody:   { fontSize:'13px', color:'#64748b', lineHeight:1.75, margin:0 },

  tip: { fontSize:'12px', color:'#475569', background:'#0d1320', border:'1px solid #1a2740', borderLeft:'3px solid #3b82f6', borderRadius:'8px', padding:'12px 16px', lineHeight:1.6 },
}
