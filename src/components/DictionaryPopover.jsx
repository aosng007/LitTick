/**
 * DictionaryPopover.jsx
 * Shared word-definition popover that queries the Free Dictionary API.
 *
 * Props:
 *   word     – the word to look up (cleaned internally)
 *   onClose  – callback invoked when the popover should be dismissed
 *   maxWords – optional; if set, the displayed definition is truncated to this
 *              many words (useful for younger readers, e.g. Year 2)
 *
 * Also exports:
 *   getSelectedWord() – reads the current browser text selection and returns
 *                       the selected single alphabetic word, or null otherwise.
 */
import { useState, useEffect, useRef } from 'react'

/** Validates that a URL is a well-formed https URL; returns normalised href or null. */
function safeHttpsUrl(url) {
  try {
    const parsed = new URL(url || '')
    return parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}

/**
 * Reads the current browser text selection and returns the selected word if
 * it is a single alphabetic word (letters, hyphens, apostrophes only).
 * Returns null for empty selections or multi-word selections.
 */
export function getSelectedWord() {
  const sel = window.getSelection()
  const selected = sel ? sel.toString().trim() : ''
  return selected && /^[a-zA-Z'-]+$/.test(selected) ? selected : null
}

// ---------------------------------------------------------------------------
// Helper – track word lookups and award word_wizard badge after 5 unique lookups
// ---------------------------------------------------------------------------
function trackWordLookup(word) {
  try {
    const raw = localStorage.getItem('littick_word_lookups')
    const parsed = JSON.parse(raw || '[]')
    const words = Array.isArray(parsed) ? parsed : []
    const lower = word.toLowerCase()
    if (!words.includes(lower)) {
      const updated = [...words, lower]
      localStorage.setItem('littick_word_lookups', JSON.stringify(updated))
      if (updated.length >= 5) {
        // Award word_wizard badge
        try {
          const badgesRaw = localStorage.getItem('littick_user_badges')
          const badgesParsed = JSON.parse(badgesRaw || '[]')
          const badges = Array.isArray(badgesParsed) ? badgesParsed : []
          if (!badges.includes('word_wizard')) {
            localStorage.setItem('littick_user_badges', JSON.stringify([...badges, 'word_wizard']))
          }
        } catch { /* ignore */ }
      }
    }
  } catch { /* localStorage unavailable */ }
}

export default function DictionaryPopover({ word, onClose, maxWords }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    // Reset state immediately so we never show stale data from a previous word
    setLoading(true)
    setError(null)
    setData(null)

    const clean = word.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
    if (!clean) { setLoading(false); setError('No definition found.'); return }

    const controller = new AbortController()
    let canceled = false

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => {
        if (canceled || controller.signal.aborted) return
        if (Array.isArray(json) && json.length > 0) {
          setData(json[0])
          // Track this successful lookup for the word_wizard badge
          trackWordLookup(clean)
        } else {
          setError('No definition found.')
        }
        setLoading(false)
      })
      .catch(err => {
        if (canceled || (err && err.name === 'AbortError')) return
        setError('Could not load definition.')
        setLoading(false)
      })

    return () => {
      canceled = true
      controller.abort()
    }
  }, [word])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const firstMeaning = data?.meanings?.[0]
  const rawDefinition = firstMeaning?.definitions?.[0]?.definition
  const partOfSpeech = firstMeaning?.partOfSpeech
  const phonetic = data?.phonetic || data?.phonetics?.find(p => p.text)?.text
  const rawAudioUrl = data?.phonetics?.find(p => p.audio)?.audio
  // Validate audio URL – must be a well-formed https URL to avoid mixed-content failures
  const audioUrl = safeHttpsUrl(rawAudioUrl)

  // Truncate definition to maxWords if specified
  let firstDefinition = rawDefinition
  if (maxWords && rawDefinition) {
    const words = rawDefinition.split(/\s+/)
    if (words.length > maxWords) {
      firstDefinition = words.slice(0, maxWords).join(' ') + '…'
    }
  }

  return (
    <div
      ref={popoverRef}
      className="fixed inset-x-4 bottom-4 z-50 sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:left-0 sm:mt-1 sm:w-72 rounded-2xl bg-white shadow-2xl border border-koala-green/30 p-4 text-sm"
      role="dialog"
      aria-label={`Definition of ${word}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="font-extrabold text-koala-teal text-base">{word}</span>
          {phonetic && (
            <span className="ml-2 text-gray-400 text-xs">{phonetic}</span>
          )}
          {partOfSpeech && (
            <span className="ml-2 text-xs italic text-gray-400">{partOfSpeech}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold active:scale-90"
          aria-label="Close definition"
        >
          ✕
        </button>
      </div>

      {loading && (
        <p className="text-gray-400 animate-pulse">Looking up definition…</p>
      )}
      {error && (
        <p className="text-gray-400 italic">{error}</p>
      )}
      {!loading && !error && firstDefinition && (
        <p className="text-gray-700 leading-relaxed">{firstDefinition}</p>
      )}

      {audioUrl && (
        <button
          onClick={() => { try { new Audio(audioUrl).play() } catch { /* audio unsupported */ } }}
          className="mt-2 flex items-center gap-1 text-xs text-koala-teal hover:text-koala-green font-semibold"
          aria-label={`Listen to pronunciation of ${word}`}
        >
          🔊 Hear it
        </button>
      )}
    </div>
  )
}
