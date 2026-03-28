/**
 * App.jsx
 * LitTick – main application shell.
 * Manages story selection, active tab, and timer state.
 */
import { useState, useEffect, useRef } from 'react'
import Timer from './components/Timer'
import Checklist from './components/Checklist'
import PuzzleGame from './components/PuzzleGame'
import Achievements from './components/Achievements'
import stories from './content/Year2Texts.json'

// ---------------------------------------------------------------------------
// One-time migration: move legacy koalaread-* keys to littick_* equivalents
// so returning users don't lose their progress after the rename.
// Called at module load (not inside a component) so it runs exactly once.
// ---------------------------------------------------------------------------
function migrateStorageKeys() {
  try {
    // Selected story
    if (!localStorage.getItem('littick_selected_story')) {
      const legacy = localStorage.getItem('koalaread-story')
      if (legacy) {
        try { localStorage.setItem('littick_selected_story', legacy) } catch { /* ignore */ }
        try { localStorage.removeItem('koalaread-story') } catch { /* ignore */ }
      }
    }
    // Unlocked stories
    if (!localStorage.getItem('littick_unlocked_stories')) {
      const legacy = localStorage.getItem('koalaread-unlocked')
      if (legacy) {
        try { localStorage.setItem('littick_unlocked_stories', legacy) } catch { /* ignore */ }
        try { localStorage.removeItem('koalaread-unlocked') } catch { /* ignore */ }
      }
    }
  } catch { /* localStorage unavailable – skip migration */ }
}
migrateStorageKeys()

// ---------------------------------------------------------------------------
// Helper – safely parse the unlocked-stories array from localStorage
// ---------------------------------------------------------------------------
function safeParseUnlocked() {
  try {
    const raw = localStorage.getItem('littick_unlocked_stories')
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Story card for selection screen
// ---------------------------------------------------------------------------
function StoryCard({ story, onSelect }) {
  return (
    <button
      onClick={() => onSelect(story)}
      className="group flex flex-col items-center gap-3 rounded-3xl border-2 border-transparent bg-white/80 p-5 shadow-md hover:shadow-xl hover:border-koala-green/50 active:scale-[0.98] transition-all text-left w-full"
      aria-label={`Select story: ${story.title}`}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shadow-inner"
        style={{ background: story.coverColor + '33' }}
        aria-hidden="true"
      >
        {story.emoji}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
          {story.theme}
        </p>
        <h3 className="font-extrabold text-gray-800 text-base leading-snug">
          {story.title}
        </h3>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Reading view – story text with font-size control
// ---------------------------------------------------------------------------
function StoryReader({ story }) {
  const [fontSize, setFontSize] = useState(18)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-koala-teal text-xl flex items-center gap-2">
          {story.emoji} {story.title}
        </h2>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setFontSize(s => Math.max(14, s - 2))}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 text-sm active:scale-90 transition-all"
            aria-label="Decrease font size"
          >A−</button>
          <button
            onClick={() => setFontSize(s => Math.min(28, s + 2))}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 active:scale-90 transition-all"
            aria-label="Increase font size"
          >A+</button>
        </div>
      </div>
      <div
        className="rounded-2xl bg-koala-cream/80 border border-yellow-200 p-4 leading-relaxed text-gray-700 max-h-[45vh] overflow-y-auto"
        style={{ fontSize: `${fontSize}px` }}
        role="article"
        aria-label={`Story text: ${story.title}`}
      >
        {story.text.split('\n').map((para, i) =>
          para.trim() ? <p key={i} className="mb-3">{para}</p> : null
        )}
      </div>

      {/* Comprehension questions */}
      <details className="rounded-2xl border border-koala-green/30 bg-white/70 p-3">
        <summary className="font-bold text-koala-teal cursor-pointer text-sm">
          💬 Comprehension Questions
        </summary>
        <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-gray-700">
          {story.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </details>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------
const TABS = [
  { id: 'read',    label: 'Read',     emoji: '📖' },
  { id: 'timer',   label: 'Timer',    emoji: '⏱' },
  { id: 'retell',  label: 'Retell',   emoji: '🖐' },
  { id: 'puzzle',  label: 'Puzzle',   emoji: '🔍' },
]

function TabBar({ active, onChange, puzzleLocked }) {
  return (
    <div className="flex rounded-2xl bg-white/60 p-1 gap-0.5 shadow-inner" role="tablist">
      {TABS.map(t => {
        const isLocked = t.id === 'puzzle' && puzzleLocked
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => !isLocked && onChange(t.id)}
            disabled={isLocked}
            title={isLocked ? 'Finish your 15-minute read to unlock!' : undefined}
            className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              active === t.id
                ? 'bg-koala-green text-white shadow-md scale-105'
                : isLocked
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-white/80 hover:text-koala-teal'
            }`}
          >
            <span className="text-lg leading-none">{isLocked ? '🔒' : t.emoji}</span>
            <span className="mt-0.5 hidden sm:block">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [selectedStory, setSelectedStory] = useState(null)
  const [activeTab, setActiveTab] = useState('read')
  const [puzzleUnlocked, setPuzzleUnlocked] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const puzzleTabTimeoutRef = useRef(null)

  // Clear the auto-switch timeout when the component unmounts
  useEffect(() => {
    return () => clearTimeout(puzzleTabTimeoutRef.current)
  }, [])

  // Persist story selection
  useEffect(() => {
    let saved = null
    try {
      saved = localStorage.getItem('littick_selected_story')
    } catch (err) {
      // localStorage unavailable (e.g. private browsing SecurityError) – start fresh
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
        // Log in development so non-storage issues are visible
        console.error('Failed to read littick_selected_story from localStorage', err)
      }
      return
    }

    if (saved) {
      const found = stories.find(s => s.id === saved)
      if (found) setSelectedStory(found)
    }
    // Check if puzzle was previously unlocked for this story
    const ul = safeParseUnlocked()
    if (saved && ul.includes(saved)) setPuzzleUnlocked(true)
  }, [])

  const handleSelectStory = (story) => {
    setSelectedStory(story)
    setActiveTab('read')
    try { localStorage.setItem('littick_selected_story', story.id) } catch { /* localStorage unavailable – storage restriction */ }
    // Restore puzzle unlock state
    const ul = safeParseUnlocked()
    setPuzzleUnlocked(ul.includes(story.id))
  }

  const handleTimerComplete = () => {
    if (!selectedStory) return
    setPuzzleUnlocked(true)
    const ul = safeParseUnlocked()
    if (!ul.includes(selectedStory.id)) {
      try {
        localStorage.setItem('littick_unlocked_stories', JSON.stringify([...ul, selectedStory.id]))
      } catch { /* localStorage unavailable – storage restriction */ }
    }
    // Auto-switch to puzzle tab after a short delay; store id so we can cancel it
    puzzleTabTimeoutRef.current = setTimeout(() => setActiveTab('puzzle'), 1200)
  }

  const handleBackToMenu = () => {
    // Cancel any pending auto-switch before unmounting the reading interface
    clearTimeout(puzzleTabTimeoutRef.current)
    setSelectedStory(null)
    setActiveTab('read')
    setPuzzleUnlocked(false)
    try { localStorage.removeItem('littick_selected_story') } catch { /* localStorage unavailable – storage restriction */ }
  }

  // ── Achievements screen ───────────────────────────────────────────────────
  if (showAchievements) {
    return <Achievements onBack={() => setShowAchievements(false)} />
  }

  // ── Story selection screen ────────────────────────────────────────────────
  if (!selectedStory) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🐨</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-koala-teal">
            LitTick
          </h1>
          <p className="text-gray-500 font-semibold mt-1">
            Your 15-Minute Reading Adventure!
          </p>
        </div>

        {/* Story grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {stories.map(story => (
            <StoryCard key={story.id} story={story} onSelect={handleSelectStory} />
          ))}
        </div>

        {/* Achievements link */}
        <button
          onClick={() => setShowAchievements(true)}
          className="mt-6 flex items-center gap-2 rounded-2xl bg-yellow-400/80 px-5 py-2.5 font-bold text-yellow-900 shadow hover:bg-yellow-400 active:scale-95 transition-all"
          aria-label="View my achievements"
        >
          🏆 My Achievements
        </button>

        <p className="mt-4 text-xs text-gray-400 text-center max-w-xs">
          Pick a story to start reading! ⭐ All stories are curriculum-aligned for Year 2 students.
        </p>
      </div>
    )
  }

  // ── Main reading interface ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      {/* App header */}
      <header className="w-full max-w-2xl flex items-center justify-between mb-4">
        <button
          onClick={handleBackToMenu}
          className="flex items-center gap-1.5 rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold text-gray-600 shadow hover:bg-white active:scale-95 transition-all"
          aria-label="Back to story selection"
        >
          ← Stories
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🐨</span>
          <span className="font-extrabold text-koala-teal text-lg hidden sm:block">
            LitTick
          </span>
        </div>

        <button
          onClick={() => setShowAchievements(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-yellow-400/70 px-3 py-2 text-sm font-bold text-yellow-900 shadow hover:bg-yellow-400 active:scale-95 transition-all"
          aria-label="View my achievements"
        >
          🏆
        </button>
      </header>

      {/* Main card */}
      <main className="w-full max-w-2xl flex flex-col gap-4">
        {/* Tab navigation */}
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          puzzleLocked={!puzzleUnlocked}
        />

        {/* Tab panels */}
        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          className="rounded-3xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-lg p-4 sm:p-6"
        >
          {activeTab === 'read' && (
            <StoryReader story={selectedStory} />
          )}

          {activeTab === 'timer' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-center font-bold text-koala-teal text-lg">
                ⏱ Set your 15-minute reading timer!
              </p>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Press <strong>Start</strong> and read your story. When the timer ends, a
                special surprise awaits! 🎁
              </p>
              <Timer onTimerComplete={handleTimerComplete} />
              {puzzleUnlocked && (
                <div className="rounded-2xl bg-koala-yellow/30 border border-yellow-300 px-4 py-3 text-center">
                  <p className="text-sm font-bold text-yellow-700">
                    🔓 Word Puzzle unlocked! Check the 🔍 Puzzle tab!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'retell' && (
            <Checklist storyId={selectedStory.id} />
          )}

          {activeTab === 'puzzle' && (
            <PuzzleGame
              keywords={selectedStory.keywords}
              storyTitle={selectedStory.title}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-6 text-xs text-gray-400 text-center">
        LitTick 🐨 · Made for Year 2 readers in Australia 🇦🇺
      </footer>
    </div>
  )
}
