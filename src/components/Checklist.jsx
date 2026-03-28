/**
 * Checklist.jsx
 * Interactive Five Finger Retell checklist for Year 2 students.
 * Persists completion state to LocalStorage keyed by story id.
 */
import { useState, useEffect } from 'react'

const FINGERS = [
  {
    id: 'characters',
    finger: '👍',
    fingerLabel: 'Thumb',
    title: 'Characters',
    question: 'Who was in the story?',
    hint: 'Think about the main character and any helpers or friends.',
    colour: 'from-pink-100 to-pink-50 border-pink-300',
    check: 'bg-pink-400',
  },
  {
    id: 'setting',
    finger: '☝️',
    fingerLabel: 'Pointer',
    title: 'Setting',
    question: 'Where did it take place?',
    hint: 'Was it a forest, a city, outer space, or somewhere else?',
    colour: 'from-yellow-100 to-yellow-50 border-yellow-300',
    check: 'bg-yellow-400',
  },
  {
    id: 'problem',
    finger: '🖕',
    fingerLabel: 'Middle',
    title: 'Problem',
    question: 'What went wrong?',
    hint: 'Every story has a problem — what was the big challenge?',
    colour: 'from-orange-100 to-orange-50 border-orange-300',
    check: 'bg-orange-400',
  },
  {
    id: 'events',
    finger: '💍',
    fingerLabel: 'Ring',
    title: 'Events',
    question: 'What happened — beginning, middle, end?',
    hint: 'Tell the story in order: first… then… finally…',
    colour: 'from-koala-sky/40 to-blue-50 border-blue-300',
    check: 'bg-blue-400',
  },
  {
    id: 'solution',
    finger: '🤙',
    fingerLabel: 'Pinkie',
    title: 'Solution',
    question: 'How was the problem solved?',
    hint: 'How did things get better at the end?',
    colour: 'from-green-100 to-green-50 border-green-300',
    check: 'bg-koala-green',
  },
]

function storageKey(storyId) {
  return `littick_checklist_${storyId}`
}

export default function Checklist({ storyId }) {
  const [checked, setChecked] = useState({})
  const [notes, setNotes] = useState({})
  const [expanded, setExpanded] = useState({})

  // Load saved state from LocalStorage
  useEffect(() => {
    if (!storyId) return
    let raw = null
    try {
      raw = localStorage.getItem(storageKey(storyId))
      // One-time migration: if new key is empty, check the legacy key
      if (!raw) {
        const legacyKey = `koalaread-checklist-${storyId}`
        const legacyRaw = localStorage.getItem(legacyKey)
        if (legacyRaw) {
          raw = legacyRaw
          try { localStorage.setItem(storageKey(storyId), legacyRaw) } catch { /* ignore */ }
          try { localStorage.removeItem(legacyKey) } catch { /* ignore */ }
        }
      }
    } catch {
      // localStorage unavailable (e.g. private browsing SecurityError) – start fresh
      return
    }
    try {
      const saved = JSON.parse(raw || '{}')
      setChecked(saved.checked || {})
      setNotes(saved.notes || {})
    } catch {
      // ignore corrupt / non-JSON data
    }
  }, [storyId])

  // Persist to LocalStorage whenever checked/notes change
  useEffect(() => {
    if (!storyId) return
    try {
      localStorage.setItem(storageKey(storyId), JSON.stringify({ checked, notes }))
    } catch {
      // localStorage unavailable – storage restriction
    }
  }, [storyId, checked, notes])

  const toggle = (id) =>
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))

  const setNote = (id, value) =>
    setNotes(prev => ({ ...prev, [id]: value }))

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const completedCount = FINGERS.filter(f => checked[f.id]).length
  const allDone = completedCount === FINGERS.length

  const handleClear = () => {
    setChecked({})
    setNotes({})
    setExpanded({})
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🖐</span>
          <span className="font-bold text-koala-teal text-lg">Five Finger Retell</span>
        </div>
        <span className="rounded-full bg-koala-green/20 px-3 py-1 text-sm font-bold text-koala-teal">
          {completedCount} / 5
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-koala-green to-koala-teal transition-all duration-500"
          style={{ width: `${(completedCount / 5) * 100}%` }}
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-label={`${completedCount} of 5 retell steps completed`}
        />
      </div>

      {/* Finger cards */}
      {FINGERS.map((f) => (
        <div
          key={f.id}
          className={`rounded-2xl border-2 bg-gradient-to-br ${f.colour} shadow-sm transition-all duration-200 ${checked[f.id] ? 'opacity-90' : ''}`}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Checkbox */}
            <button
              onClick={() => toggle(f.id)}
              aria-label={`Mark ${f.title} as ${checked[f.id] ? 'incomplete' : 'complete'}`}
              className={`flex-shrink-0 w-8 h-8 rounded-full border-2 border-white shadow flex items-center justify-center text-white font-bold transition-all active:scale-90 ${
                checked[f.id] ? `${f.check} scale-110` : 'bg-white/60 border-gray-300'
              }`}
            >
              {checked[f.id] ? '✓' : ''}
            </button>

            {/* Finger emoji + title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xl" aria-hidden="true">{f.finger}</span>
                <span className="font-bold text-gray-700 text-base leading-tight">
                  {f.title}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium truncate">{f.question}</p>
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => toggleExpand(f.id)}
              aria-expanded={expanded[f.id] ? 'true' : 'false'}
              aria-label={`${expanded[f.id] ? 'Collapse' : 'Expand'} ${f.title} section`}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-gray-500 hover:bg-white active:scale-90 transition-all"
            >
              {expanded[f.id] ? '▲' : '▼'}
            </button>
          </div>

          {/* Expanded note area */}
          {expanded[f.id] && (
            <div className="px-4 pb-4 flex flex-col gap-2">
              <p className="text-xs text-gray-500 italic">💡 {f.hint}</p>
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-white/80 p-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-koala-green/50 min-h-[60px]"
                placeholder={`Write your answer about ${f.title.toLowerCase()} here…`}
                value={notes[f.id] || ''}
                onChange={(e) => setNote(f.id, e.target.value)}
                aria-label={`Notes for ${f.title}`}
              />
            </div>
          )}
        </div>
      ))}

      {/* Completion celebration */}
      {allDone && (
        <div className="rounded-2xl bg-gradient-to-r from-koala-green to-koala-teal p-4 text-white text-center shadow-lg">
          <div className="text-3xl mb-1">🎉🐨🎉</div>
          <p className="font-extrabold text-lg">Fantastic! You remembered the whole story!</p>
          <p className="text-sm opacity-90 mt-0.5">You are an amazing reader! ⭐</p>
        </div>
      )}

      {/* Clear button */}
      {(completedCount > 0 || Object.keys(notes).length > 0) && (
        <button
          onClick={handleClear}
          className="self-end text-xs text-gray-400 hover:text-gray-600 underline"
          aria-label="Clear all checklist answers"
        >
          Clear answers
        </button>
      )}
    </div>
  )
}
