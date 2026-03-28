/**
 * Timer.jsx
 * 15-minute countdown timer for LitTick.
 * Uses the Web Audio API to play a celebratory chime when time is up,
 * shows a full-screen confetti effect, and awards a virtual badge.
 * Timer state persists across page refreshes via littick_timer_state in LocalStorage.
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const TOTAL_SECONDS = 15 * 60 // 15 minutes
const TIMER_STATE_KEY = 'littick_timer_state'
const BADGES_KEY = 'littick_user_badges'

// ---------------------------------------------------------------------------
// Helper – safely read/write timer state from LocalStorage
// ---------------------------------------------------------------------------
function loadTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
    return null
  } catch {
    return null
  }
}

function saveTimerState(state) {
  try {
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state))
  } catch { /* localStorage unavailable – storage restriction */ }
}

function clearTimerState() {
  try {
    localStorage.removeItem(TIMER_STATE_KEY)
  } catch { /* localStorage unavailable */ }
}

// ---------------------------------------------------------------------------
// Helper – award a badge to the user's badge collection
// ---------------------------------------------------------------------------
function awardBadge(badgeId) {
  try {
    const raw = localStorage.getItem(BADGES_KEY)
    const parsed = JSON.parse(raw || '[]')
    const badges = Array.isArray(parsed) ? parsed : []
    if (!badges.includes(badgeId)) {
      localStorage.setItem(BADGES_KEY, JSON.stringify([...badges, badgeId]))
    }
  } catch { /* localStorage unavailable */ }
}

// ---------------------------------------------------------------------------
// Helper – play a celebratory chime on an already-created AudioContext.
// Passing the context in (rather than creating a new one here) guarantees
// it was initialised during a user gesture and won't be blocked by browsers.
// The context is closed automatically once playback finishes (~2.5 s).
// ---------------------------------------------------------------------------
function playRewardChime(ctx) {
  if (!ctx || ctx.state === 'closed') return
  try {
    const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve()
    resume.then(() => {
      // Notes: C5 – E5 – G5 – C6 (major arpeggio)
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18)
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18)
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + i * 0.18 + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5)
        osc.start(ctx.currentTime + i * 0.18)
        osc.stop(ctx.currentTime + i * 0.18 + 0.6)
      })

      // A second sparkly burst after the arpeggio
      setTimeout(() => {
        if (ctx.state === 'closed') return
        const notes2 = [1046.5, 1318.5, 1567.98]
        notes2.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1)
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.1 + 0.04)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4)
          osc.start(ctx.currentTime + i * 0.1)
          osc.stop(ctx.currentTime + i * 0.1 + 0.5)
        })
        // Close the context after all audio finishes to free resources
        setTimeout(() => { try { ctx.close() } catch { /* ignore */ } }, 1500)
      }, 800)
    }).catch(() => { /* audio blocked – fail silently */ })
  } catch {
    // Audio not supported – fail silently
  }
}

// ---------------------------------------------------------------------------
// Full-screen confetti overlay
// ---------------------------------------------------------------------------
const CONFETTI_EMOJIS = ['🎉', '⭐', '🌟', '🎊', '🏆', '🌈', '✨', '🎈']

function ConfettiOverlay() {
  const pieces = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
    left: `${Math.random() * 100}%`,
    animDuration: `${1.5 + Math.random() * 2}s`,
    animDelay: `${Math.random() * 1.5}s`,
    fontSize: `${1 + Math.random() * 1.5}rem`,
  }))

  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-2rem',
            left: p.left,
            fontSize: p.fontSize,
            animation: `confettiFall ${p.animDuration} ${p.animDelay} ease-in forwards`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reward badge overlay
// ---------------------------------------------------------------------------
function RewardBadge({ onDismiss }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Reading complete reward"
    >
      <div className="relative flex flex-col items-center gap-4 rounded-3xl bg-white px-10 py-10 shadow-2xl text-center max-w-sm mx-4">
        {/* Confetti-style emoji ring */}
        <div className="text-5xl animate-bounce">🎉</div>
        <div className="badge-shine w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-lg border-4 border-yellow-300">
          ⭐
        </div>
        <h2 className="text-2xl font-extrabold text-koala-teal">
          Amazing Reading! 🐨
        </h2>
        <p className="text-lg text-gray-600 font-semibold">
          You read for 15 whole minutes!<br />You earned a Reading Star! 🌟
        </p>
        <div className="flex gap-2 text-2xl">
          {['🦘', '🐨', '🦎', '🦜', '🌺'].map((e, i) => (
            <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
              {e}
            </span>
          ))}
        </div>
        <button
          onClick={onDismiss}
          className="mt-2 rounded-2xl bg-koala-green px-8 py-3 text-white font-bold text-lg shadow-md hover:bg-koala-teal active:scale-95 transition-all"
        >
          Keep Going! 🚀
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Timer component
// ---------------------------------------------------------------------------
export default function Timer({ onTimerComplete }) {
  // Initialise from persisted state so the timer survives page refreshes
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const saved = loadTimerState()
    if (!saved) return TOTAL_SECONDS
    if (saved.hasFinished) return 0
    // If the timer was actively running, account for the time elapsed since the
    // last save (not since run start) to avoid double-counting decremented seconds.
    if (saved.isTimerActive && typeof saved.lastSavedAt === 'number') {
      const elapsed = Math.floor((Date.now() - saved.lastSavedAt) / 1000)
      return Math.max(0, saved.secondsLeft - elapsed)
    }
    return typeof saved.secondsLeft === 'number' ? saved.secondsLeft : TOTAL_SECONDS
  })
  const [isTimerActive, setIsTimerActive] = useState(() => {
    const saved = loadTimerState()
    // Resume running if the timer was active and hasn't finished
    if (!saved) return false
    if (saved.hasFinished) return false
    return saved.isTimerActive === true
  })
  const [hasFinished, setHasFinished] = useState(() => {
    const saved = loadTimerState()
    return saved?.hasFinished === true
  })
  const [showBadge, setShowBadge] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const intervalRef = useRef(null)
  const audioCtxRef = useRef(null)

  // Create (or reuse) an AudioContext during a user gesture so the browser
  // allows audio playback later when the timer fires.
  const ensureAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx()
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
    } catch { /* unsupported – fail silently */ }
  }, [])

  // Format mm:ss
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Progress percentage (0 → 100 as time elapses)
  const progress = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100

  // Colour of the ring: green → amber in the last 2 min (≤ 120 s) → red in the last 1 min (≤ 60 s)
  const ringColour =
    secondsLeft > 120 ? '#5BAD8F'
    : secondsLeft > 60  ? '#F59E0B'
    : '#EF4444'

  // Persist timer state whenever relevant values change.
  // `lastSavedAt` records the wall-clock time of this snapshot so that on the
  // next load we can compute exactly how much time elapsed while the tab was
  // away, without double-counting seconds already decremented before the save.
  useEffect(() => {
    if (hasFinished) {
      saveTimerState({ secondsLeft: 0, hasFinished: true, isTimerActive: false, lastSavedAt: null })
    } else {
      saveTimerState({
        secondsLeft,
        hasFinished: false,
        isTimerActive,
        lastSavedAt: isTimerActive ? Date.now() : null,
      })
    }
  }, [secondsLeft, isTimerActive, hasFinished])

  // Tick
  useEffect(() => {
    if (isTimerActive && !hasFinished) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setIsTimerActive(false)
            setHasFinished(true)
            setShowBadge(true)
            setShowConfetti(true)
            playRewardChime(audioCtxRef.current)
            awardBadge('reading_star')
            if (onTimerComplete) onTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isTimerActive, hasFinished, onTimerComplete])
  // Dismiss confetti after 4 seconds automatically
  useEffect(() => {
    if (!showConfetti) return
    const t = setTimeout(() => setShowConfetti(false), 4000)
    return () => clearTimeout(t)
  }, [showConfetti])

  const handleStart = useCallback(() => {
    ensureAudioContext()
    setIsTimerActive(true)
  }, [ensureAudioContext])
  const handlePause = useCallback(() => setIsTimerActive(false), [])
  const handleReset = useCallback(() => {
    clearInterval(intervalRef.current)
    setIsTimerActive(false)
    setHasFinished(false)
    setSecondsLeft(TOTAL_SECONDS)
    clearTimerState()
    // Close any open AudioContext so it can be freshly created on next Start
    try { audioCtxRef.current?.close() } catch { /* ignore */ }
    audioCtxRef.current = null
  }, [])

  // SVG ring params
  const r = 54
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <>
      {showConfetti && <ConfettiOverlay />}
      {showBadge && (
        <RewardBadge onDismiss={() => setShowBadge(false)} />
      )}

      <div className="flex flex-col items-center gap-4">
        {/* Circular progress ring */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44" aria-hidden="true">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Track */}
            <circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            {/* Progress arc */}
            <circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke={ringColour}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.6s ease' }}
            />
          </svg>
          {/* Time display in centre */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl sm:text-3xl font-extrabold tabular-nums"
              style={{ color: ringColour }}
              aria-live="polite"
              aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
            >
              {timeString}
            </span>
            <span className="text-xs text-gray-400 font-semibold mt-0.5">
              {hasFinished ? 'Done! 🎉' : isTimerActive ? 'Reading…' : 'Ready?'}
            </span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          {!isTimerActive && !hasFinished && (
            <button
              onClick={handleStart}
              className="rounded-2xl bg-koala-green px-6 py-3 text-white font-bold text-base shadow-md hover:bg-koala-teal active:scale-95 transition-all"
              aria-label="Start reading timer"
            >
              ▶ Start
            </button>
          )}
          {isTimerActive && (
            <button
              onClick={handlePause}
              className="rounded-2xl bg-amber-400 px-6 py-3 text-white font-bold text-base shadow-md hover:bg-amber-500 active:scale-95 transition-all"
              aria-label="Pause reading timer"
            >
              ⏸ Pause
            </button>
          )}
          {(!isTimerActive && secondsLeft < TOTAL_SECONDS) && (
            <>
              {!hasFinished && (
                <button
                  onClick={handleStart}
                  className="rounded-2xl bg-koala-blue px-6 py-3 text-white font-bold text-base shadow-md hover:bg-blue-600 active:scale-95 transition-all"
                  aria-label="Resume reading timer"
                >
                  ▶ Resume
                </button>
              )}
              <button
                onClick={handleReset}
                className="rounded-2xl bg-gray-200 px-6 py-3 text-gray-700 font-bold text-base shadow-md hover:bg-gray-300 active:scale-95 transition-all"
                aria-label="Reset reading timer"
              >
                ↺ Reset
              </button>
            </>
          )}
          {hasFinished && (
            <button
              onClick={handleReset}
              className="rounded-2xl bg-purple-500 px-6 py-3 text-white font-bold text-base shadow-md hover:bg-purple-600 active:scale-95 transition-all"
              aria-label="Start a new reading session"
            >
              🔄 New Session
            </button>
          )}
        </div>

        {/* Motivational message */}
        {isTimerActive && (
          <p className="text-sm text-koala-teal font-semibold animate-pulse-slow text-center">
            📖 Great job reading! Keep going! 🌟
          </p>
        )}
      </div>
    </>
  )
}
