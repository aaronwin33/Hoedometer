import { useState, useEffect, useRef } from 'react'
import './App.css'

// ── Word lists (not exposed in UI) ────────────────────────────────────────────
const CURSE_WORDS = [
  'fuck', 'shit', 'bitch', 'damn', 'crap', 'piss', 'cock', 'dick',
  'cunt', 'fag', 'nigga', 'nigger', 'hell', 'bastard',
]
const RULE4_WORDS = [
  'ho', 'whore', 'slut', 'ass', 'sex', 'cum', 'pussy',
  'spicy', 'juic', 'ju1', 'horn', ...CURSE_WORDS,
]
const RULE5_NUMS  = ['94', '95', '96', '98']
const RULE6_WORDS = ['bad', 'boo', 'jess', 'crystal', 'bam', 'destiny', 'divine']
const RULE7_WORDS = [
  'astr', 'light', 'l1', 'l!', 'bright', 'love', 'baby', 'cat', 'kat',
  'girl', 'chick', 'ch1', 'witch', 'w1', 'mad', 'mermaid', 'pai', 'christ',
]
const RULE8_WORDS = ['good', 'ex', 'me', 'm3', 'mi', 'des', 'ki', 'key', 'k5', 'chas', 'ash', 'rach']

// ── Validation ────────────────────────────────────────────────────────────────
function isValidInstagramUsername(raw: string): boolean {
  const u = raw.trim()
  if (u.length < 1 || u.length > 30) return false
  if (!/^[a-zA-Z0-9._]+$/.test(u)) return false
  if (/\.\./.test(u)) return false
  if (u.startsWith('.') || u.endsWith('.')) return false
  return true
}

// ── Scoring ───────────────────────────────────────────────────────────────────
function calcScore(raw: string): number {
  const u = raw.toLowerCase()
  let score = 1

  for (const ch of u) {
    if (['e', 'n', 'w', 'k', '5'].includes(ch)) score += 1
  }

  const counts: Record<string, number> = {}
  for (const ch of u) counts[ch] = (counts[ch] ?? 0) + 1
  if (Object.values(counts).some(c => c > 2)) score += 1

  if (RULE4_WORDS.some(w => u.includes(w))) score += 6
  if (RULE5_NUMS.some(n => u.includes(n))) score += 5
  if (RULE6_WORDS.some(w => u.includes(w))) score += 4
  if (RULE7_WORDS.some(w => u.includes(w))) score += 3
  if (RULE8_WORDS.some(w => u.includes(w))) score += 2

  for (const ch of u) {
    if (['c', 'l', 'u', '_', '.'].includes(ch)) score += 0.5
  }

  return Math.min(Math.round(score * 10) / 10, 10)
}

// ── Tier data ─────────────────────────────────────────────────────────────────
const TIERS = [
  { min: 1,    max: 2.4, label: 'Pure as Snow',          emoji: '😇', color: '#a8d8ea', desc: 'Suspiciously innocent. Are you even real?' },
  { min: 2.5,  max: 4.4, label: 'Lil Curious',           emoji: '🤔', color: '#b8f0c8', desc: "You've thought about it. We know." },
  { min: 4.5,  max: 5.9, label: 'Hoe in Training',       emoji: '📚', color: '#ffe08a', desc: 'Currently enrolled. Graduation pending.' },
  { min: 6,    max: 7.4, label: 'Seasoned Professional', emoji: '💅', color: '#ffb347', desc: 'The résumé speaks for itself.' },
  { min: 7.5,  max: 8.9, label: 'Advanced Hoe',          emoji: '🌶️',  color: '#ff6b6b', desc: 'Mentor. Icon. Legend.' },
  { min: 9,    max: 10,  label: 'CERTIFIED HOE™',        emoji: '🔥', color: '#ff2d6b', desc: 'The algorithm has never been more certain.' },
]

function getTier(score: number) {
  return TIERS.find(t => score >= t.min && score <= t.max) ?? TIERS[0]
}

function fmtScore(s: number) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1)
}

// ── Loading messages ──────────────────────────────────────────────────────────
const LOADING_MSGS = [
  '🔍 Cross-referencing the Hoe Index...',
  '📡 Pinging the Thot Database...',
  '🧬 Analyzing username DNA...',
  '📊 Calibrating the Ho-Meter...',
  '🕵️ Running a full background check...',
  '💻 Hacking the mainframe...',
  '✨ Consulting the Council of Hoes...',
  '📂 Reviewing your permanent file...',
  '🔬 Running final spectral analysis...',
  '📈 Crunching the numbers...',
  '🗂️ Cross-checking the archives...',
]

// ── Particle type ─────────────────────────────────────────────────────────────
interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  dur: number
  color: string
}

// ── Component ─────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'searching' | 'result' | 'error'

export default function App() {
  const [username, setUsername]           = useState('')
  const [phase, setPhase]                 = useState<Phase>('idle')
  const [score, setScore]                 = useState<number | null>(null)
  const [msgIndex, setMsgIndex]           = useState(0)
  const [displayScore, setDisplayScore]   = useState(0)
  const [particles, setParticles]         = useState<Particle[]>([])
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreStepRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const COLORS = ['#ff69b4', '#ffffff', '#ff2d6b', '#ffb347', '#e879f9']
    setParticles(
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 5,
        dur: 2 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
    )
  }, [])

  const handleSearch = () => {
    const trimmed = username.trim()
    if (!trimmed || phase === 'searching') return
    if (!isValidInstagramUsername(trimmed)) {
      setPhase('error')
      return
    }

    setPhase('searching')
    setScore(null)
    setMsgIndex(0)

    let idx = 0
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % LOADING_MSGS.length
      setMsgIndex(idx)
    }, 780)

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      const s = calcScore(trimmed)
      setScore(s)
      setDisplayScore(0)
      setPhase('result')

      let step = 0
      const STEPS = 22
      if (scoreStepRef.current) clearInterval(scoreStepRef.current)
      scoreStepRef.current = setInterval(() => {
        step++
        const eased = 1 - Math.pow(1 - step / STEPS, 3)
        setDisplayScore(parseFloat((eased * s).toFixed(1)))
        if (step >= STEPS) {
          if (scoreStepRef.current) clearInterval(scoreStepRef.current)
          setDisplayScore(s)
        }
      }, 55)
    }, 8300)
  }

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (scoreStepRef.current) clearInterval(scoreStepRef.current)
    setPhase('idle')
    setScore(null)
    setUsername('')
    setDisplayScore(0)
  }

  const tier = score !== null ? getTier(score) : null
  const needlePct = Math.max(0, Math.min(1, (displayScore - 1) / 9))
  const needleDeg = -90 + needlePct * 180

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,900&family=Courier+Prime:wght@400;700&display=swap');
        @keyframes twinkle  { 0%,100%{opacity:.12;transform:scale(1)} 50%{opacity:1;transform:scale(1.6)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn    { 0%{opacity:0;transform:scale(.3)} 65%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(110vh)} }
        @keyframes msgFade  { 0%{opacity:0;transform:translateY(6px)} 15%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes growBar  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes errPop   { 0%{opacity:0;transform:scale(.82)} 60%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
        @keyframes pulse    { 0%,100%{opacity:.7} 50%{opacity:1} }

        * { box-sizing: border-box; }

        .app-root {
          min-height: 100vh;
          background: #080010;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Georgia', 'Times New Roman', serif;
          padding: 28px 16px 40px;
          position: relative;
          overflow: hidden;
        }

        .title-text {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-style: italic;
          font-size: clamp(2.6rem, 10vw, 5.2rem);
          background: linear-gradient(90deg, #ff69b4 0%, #ff2d6b 28%, #ff9f43 58%, #e879f9 82%, #ff69b4 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
          letter-spacing: 2px;
          line-height: 1;
        }

        .subtitle {
          font-family: 'Courier Prime', monospace;
          color: rgba(255,255,255,.12);
          font-size: .62rem;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-top: 12px;
        }

        .card {
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,45,107,.22);
          border-radius: 22px;
          padding: 34px 30px;
          width: 100%;
          max-width: 440px;
          backdrop-filter: blur(14px);
          box-shadow: 0 0 60px rgba(255,45,107,.06), 0 24px 48px rgba(0,0,0,.4);
        }

        .lbl {
          font-family: 'Courier Prime', monospace;
          color: rgba(255,255,255,.4);
          font-size: .72rem;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,.04);
          border: 1.5px solid rgba(255,45,107,.3);
          border-radius: 13px;
          overflow: hidden;
          transition: border-color .2s, box-shadow .2s;
        }
        .input-wrap:focus-within {
          border-color: #ff2d6b;
          box-shadow: 0 0 24px rgba(255,45,107,.22);
        }

        .at-sign {
          padding: 0 13px;
          color: #ff69b4;
          font-family: 'Courier Prime', monospace;
          font-size: 1.1rem;
          user-select: none;
          flex-shrink: 0;
        }

        .u-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-family: 'Courier Prime', monospace;
          font-size: 1rem;
          padding: 15px 0;
          caret-color: #ff2d6b;
          min-width: 0;
        }
        .u-input::placeholder { color: rgba(255,105,180,.3); }

        .rate-btn {
          background: linear-gradient(135deg, #ff2d6b, #ff6b2d);
          border: none;
          color: #fff;
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: .82rem;
          letter-spacing: 1.5px;
          padding: 15px 20px;
          cursor: pointer;
          transition: opacity .2s, transform .1s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .rate-btn:hover:not(:disabled) { opacity: .85; transform: scale(1.02); }
        .rate-btn:active:not(:disabled) { transform: scale(.96); }
        .rate-btn:disabled { opacity: .35; cursor: not-allowed; }

        .loading-msg {
          font-family: 'Courier Prime', monospace;
          color: #ff69b4;
          font-size: .84rem;
          text-align: center;
          animation: msgFade .78s ease forwards;
          min-height: 22px;
        }

        .spinner {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 3px solid rgba(255,45,107,.15);
          border-top-color: #ff2d6b;
          margin: 0 auto 18px;
          animation: spin .85s linear infinite;
        }

        .progress-track {
          margin-top: 20px;
          height: 3px;
          background: rgba(255,255,255,.07);
          border-radius: 99px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #ff2d6b, #ff9f43, #e879f9);
          border-radius: 99px;
          width: 100%;
          transform-origin: left;
          transform: scaleX(0);
          animation: growBar 8.3s linear forwards;
        }

        .score-big {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-size: 5.8rem;
          line-height: 1;
          animation: popIn .6s cubic-bezier(.34,1.56,.64,1) forwards;
        }

        .tier-label {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-style: italic;
          font-size: 1.4rem;
          animation: fadeUp .4s .2s both;
        }

        .tier-desc {
          font-family: 'Courier Prime', monospace;
          color: rgba(255,255,255,.42);
          font-size: .83rem;
          animation: fadeUp .4s .28s both;
          margin-bottom: 30px;
        }

        .reset-btn {
          background: transparent;
          border: 1px solid rgba(255,45,107,.35);
          color: #ff69b4;
          font-family: 'Courier Prime', monospace;
          font-size: .78rem;
          letter-spacing: 2.5px;
          padding: 11px 26px;
          border-radius: 9px;
          cursor: pointer;
          transition: all .2s;
          text-transform: uppercase;
        }
        .reset-btn:hover {
          background: rgba(255,45,107,.1);
          border-color: #ff2d6b;
          color: #fff;
        }

        .err-pop { animation: errPop .38s ease forwards; }

        .footer {
          font-family: 'Courier Prime', monospace;
          color: rgba(255,255,255,.08);
          font-size: .58rem;
          margin-top: 26px;
          letter-spacing: 2.5px;
          text-align: center;
          animation: fadeUp .6s .35s both;
        }
      `}</style>

      {/* Stars */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: p.color,
            animation: `twinkle ${p.dur}s ${p.delay}s infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Scanline overlay */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '70px',
        background: 'linear-gradient(transparent, rgba(255,45,107,.03), transparent)',
        animation: 'scanline 7s linear infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '34px', animation: 'fadeUp .6s both' }}>
        <div className="title-text">THE HO-DOMETER</div>
        <div className="subtitle">comedy purposes only · results not scientifically validated</div>
      </div>

      {/* Card */}
      <div className="card" style={{ animation: 'fadeUp .6s .12s both' }}>

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <>
            <div className="lbl">Enter Instagram Username</div>
            <div className="input-wrap">
              <span className="at-sign">@</span>
              <input
                className="u-input"
                placeholder="your_username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                maxLength={40}
                autoComplete="off"
                spellCheck={false}
              />
              <button className="rate-btn" onClick={handleSearch} disabled={!username.trim()}>
                RATE ME
              </button>
            </div>
          </>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div style={{ textAlign: 'center' }} className="err-pop">
            <div style={{ fontSize: '2.8rem', marginBottom: '16px' }}>⛔</div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#ff4444',
              fontSize: '1.15rem',
              marginBottom: '12px',
            }}>
              Invalid Username
            </div>
            <div style={{
              fontFamily: "'Courier Prime', monospace",
              color: 'rgba(255,255,255,.45)',
              fontSize: '.84rem',
              lineHeight: 1.75,
              marginBottom: '8px',
            }}>
              You must type in a valid Instagram username.
            </div>
            <div style={{
              fontFamily: "'Courier Prime', monospace",
              color: 'rgba(255,255,255,.2)',
              fontSize: '.7rem',
              lineHeight: 1.65,
              marginBottom: '28px',
            }}>
              1–30 characters · letters, numbers,<br />underscores &amp; periods only
            </div>
            <button className="reset-btn" onClick={handleReset}>↩ Try Again</button>
          </div>
        )}

        {/* ── SEARCHING ── */}
        {phase === 'searching' && (
          <>
            <div className="lbl">Enter Instagram Username</div>
            <div className="input-wrap" style={{ marginBottom: '24px' }}>
              <span className="at-sign">@</span>
              <input className="u-input" value={username} disabled />
              <button className="rate-btn" disabled>· · ·</button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" />
              <div className="loading-msg" key={msgIndex}>{LOADING_MSGS[msgIndex]}</div>
              <div className="progress-track">
                <div className="progress-bar" />
              </div>
            </div>
          </>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && score !== null && tier && (
          <div style={{ textAlign: 'center' }}>
            {/* Gauge */}
            <div style={{ width: '230px', margin: '0 auto 8px' }}>
              <svg viewBox="0 0 230 125" width="230" height="125">
                <defs>
                  <linearGradient id="arcG" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#a8d8ea" />
                    <stop offset="38%"  stopColor="#ffe08a" />
                    <stop offset="68%"  stopColor="#ff6b6b" />
                    <stop offset="100%" stopColor="#ff2d6b" />
                  </linearGradient>
                </defs>
                {/* Track */}
                <path
                  d="M 20 115 A 96 96 0 0 1 210 115"
                  fill="none"
                  stroke="rgba(255,255,255,.07)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                {/* Colored arc */}
                <path
                  d="M 20 115 A 96 96 0 0 1 210 115"
                  fill="none"
                  stroke="url(#arcG)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  opacity=".88"
                />
                {/* Tick marks */}
                {[1, 3, 5, 7, 10].map(v => {
                  const a = (-180 + ((v - 1) / 9) * 180) * Math.PI / 180
                  const r = 96, cx = 115, cy = 115
                  return (
                    <line
                      key={v}
                      x1={cx + r * Math.cos(a)}
                      y1={cy + r * Math.sin(a)}
                      x2={cx + (r - 15) * Math.cos(a)}
                      y2={cy + (r - 15) * Math.sin(a)}
                      stroke="rgba(255,255,255,.3)"
                      strokeWidth="1.5"
                    />
                  )
                })}
                {/* Needle */}
                <g style={{
                  transformOrigin: '115px 115px',
                  transform: `rotate(${needleDeg}deg)`,
                  transition: 'transform .06s ease-out',
                }}>
                  <line
                    x1="115" y1="115"
                    x2="115" y2="26"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity=".92"
                  />
                </g>
                {/* Pivot */}
                <circle cx="115" cy="115" r="7.5" fill="#ff2d6b" />
                <circle cx="115" cy="115" r="3.5" fill="#fff" />
                {/* Labels */}
                <text x="10"  y="122" fill="rgba(255,255,255,.3)" fontSize="9" fontFamily="Courier Prime,monospace">1</text>
                <text x="202" y="122" fill="#ff2d6b"              fontSize="9" fontFamily="Courier Prime,monospace">10</text>
              </svg>
            </div>

            {/* Score number */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
              <div className="score-big" style={{ color: tier.color }}>{fmtScore(displayScore)}</div>
              <div style={{ fontFamily: "'Courier Prime',monospace", color: 'rgba(255,255,255,.28)', fontSize: '1.3rem' }}>/10</div>
            </div>

            {/* Username */}
            <div style={{
              fontFamily: "'Courier Prime',monospace",
              color: 'rgba(255,255,255,.25)',
              fontSize: '.78rem',
              marginBottom: '12px',
              animation: 'fadeUp .3s both',
            }}>
              @{username.trim()}
            </div>

            {/* Tier */}
            <div className="tier-label" style={{ color: tier.color, marginBottom: '8px' }}>
              {tier.emoji} {tier.label} {tier.emoji}
            </div>
            <div className="tier-desc">{tier.desc}</div>

            <button className="reset-btn" onClick={handleReset}>↩ Try Another</button>
          </div>
        )}
      </div>

      <div className="footer">
        HO-DOMETER™ IS NOT RESPONSIBLE FOR ANY HURT FEELINGS
      </div>
    </div>
  )
}
