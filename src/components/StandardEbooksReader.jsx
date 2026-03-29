/**
 * StandardEbooksReader.jsx
 * In-app EPUB reader powered by epubjs for Standard Ebooks content.
 *
 * Features:
 *   • Renders the EPUB file directly inside the app (no raw external iframe).
 *   • Sticky 15-minute reading timer visible at the top throughout the session.
 *   • Bookmark system: "Save Progress" stores the current CFI location in
 *     localStorage under the key `littick_bookmark_<bookId>` and restores it
 *     automatically the next time the same book is opened.
 *
 * Props:
 *   book   – an entry from STANDARD_EBOOKS_CLASSICS (id, title, author, epubUrl, …)
 *   onBack – callback invoked when the user presses the Back button
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { TOTAL_SECONDS } from './Timer'

// ---------------------------------------------------------------------------
// localStorage helpers – always use the littick_ prefix
// ---------------------------------------------------------------------------

function loadBookmark(bookId) {
  try {
    return localStorage.getItem(`littick_bookmark_${bookId}`) || null
  } catch {
    return null
  }
}

function saveBookmark(bookId, cfi) {
  try {
    localStorage.setItem(`littick_bookmark_${bookId}`, cfi)
  } catch { /* localStorage unavailable – storage restriction */ }
}

// ---------------------------------------------------------------------------
// Timer colour constants (kept in sync with DiscoveryHub's ReadingTimer)
// ---------------------------------------------------------------------------
const WARNING_THRESHOLD_SECONDS = 120
const CRITICAL_THRESHOLD_SECONDS = 60
const TIMER_COLOR_GREEN = '#5BAD8F'
const TIMER_COLOR_AMBER = '#F59E0B'
const TIMER_COLOR_RED  = '#EF4444'

// ---------------------------------------------------------------------------
// StickyTimer – compact, always-visible countdown banner
// ---------------------------------------------------------------------------
function StickyTimer() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [isTimerActive, setIsTimerActive] = useState(true)
  const [hasFinished, setHasFinished] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!isTimerActive || hasFinished) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setIsTimerActive(false)
          setHasFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isTimerActive, hasFinished])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const ringColour =
    secondsLeft > WARNING_THRESHOLD_SECONDS ? TIMER_COLOR_GREEN
    : secondsLeft > CRITICAL_THRESHOLD_SECONDS ? TIMER_COLOR_AMBER
    : TIMER_COLOR_RED

  const progress = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100
  const r = 14
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between gap-3 rounded-2xl bg-white/95 border border-koala-green/20 px-4 py-2 shadow-md backdrop-blur-sm"
      aria-label="Reading session timer"
    >
      <div className="flex items-center gap-2">
        <span className="text-base" aria-hidden="true">⏱</span>
        <span className="font-bold text-koala-teal text-sm hidden sm:block">Reading Timer</span>
      </div>

      {/* Mini circular progress ring */}
      <div className="flex items-center gap-2">
        <svg
          width="36" height="36"
          viewBox="0 0 36 36"
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle cx="18" cy="18" r={r} fill="none" stroke="#E5E7EB" strokeWidth="3" />
          <circle
            cx="18" cy="18" r={r}
            fill="none"
            stroke={ringColour}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.6s ease' }}
          />
        </svg>
        <span
          className="font-extrabold tabular-nums text-sm"
          style={{ color: ringColour }}
          aria-live="polite"
          aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
        >
          {timeString}
        </span>
      </div>

      {/* Pause / Resume / Finished */}
      {hasFinished ? (
        <span className="text-xs font-bold text-koala-teal">🎉 Done!</span>
      ) : isTimerActive ? (
        <button
          onClick={() => setIsTimerActive(false)}
          className="rounded-lg bg-amber-400 px-3 py-1 text-white font-bold text-xs shadow hover:bg-amber-500 active:scale-95 transition-all"
          aria-label="Pause reading timer"
        >
          ⏸
        </button>
      ) : (
        <button
          onClick={() => setIsTimerActive(true)}
          className="rounded-lg bg-koala-green px-3 py-1 text-white font-bold text-xs shadow hover:bg-koala-teal active:scale-95 transition-all"
          aria-label="Resume reading timer"
        >
          ▶
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main StandardEbooksReader component
// ---------------------------------------------------------------------------
export default function StandardEbooksReader({ book, onBack }) {
  const viewerRef = useRef(null)
  const epubBookRef = useRef(null)
  const renditionRef = useRef(null)

  // CFI location – either restored from bookmark or null (start of book)
  const [currentCfi, setCurrentCfi] = useState(() => loadBookmark(book.id))
  const [bookmarkSaved, setBookmarkSaved] = useState(false)
  const [readerReady, setReaderReady] = useState(false)
  const [readerError, setReaderError] = useState(null)

  // Initialise epubjs when the component mounts
  useEffect(() => {
    if (!viewerRef.current) return

    let canceled = false

    import('epubjs').then(({ default: Epub }) => {
      if (canceled) return

      const epubBook = new Epub(book.epubUrl, { openAs: 'epub' })
      epubBookRef.current = epubBook

      const rendition = epubBook.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: 'scrolled-doc',
        allowScriptedContent: false,
      })
      renditionRef.current = rendition

      rendition.on('relocated', location => {
        if (location?.start?.cfi) {
          setCurrentCfi(location.start.cfi)
          setBookmarkSaved(false)
        }
      })

      rendition.on('rendered', () => {
        if (!canceled) setReaderReady(true)
      })

      epubBook.ready.catch(err => {
        if (!canceled) setReaderError(`Could not load book: ${err?.message || 'unknown error'}`)
      })

      // Display from saved bookmark or beginning
      const savedCfi = loadBookmark(book.id)
      rendition.display(savedCfi || undefined).catch(err => {
        if (!canceled) setReaderError(`Could not display book: ${err?.message || 'unknown error'}`)
      })
    }).catch(err => {
      if (!canceled) setReaderError(`Reader failed to load: ${err?.message || 'unknown error'}`)
    })

    return () => {
      canceled = true
      try { renditionRef.current?.destroy() } catch { /* ignore */ }
      try { epubBookRef.current?.destroy() } catch { /* ignore */ }
      renditionRef.current = null
      epubBookRef.current = null
    }
  }, [book.epubUrl, book.id])

  const handleSaveProgress = useCallback(() => {
    if (!currentCfi) return
    saveBookmark(book.id, currentCfi)
    setBookmarkSaved(true)
  }, [book.id, currentCfi])

  return (
    <div className="flex flex-col gap-3">
      {/* ── Sticky timer – visible throughout the reading session ── */}
      <StickyTimer />

      {/* ── Header: back button + book info + bookmark ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-200 active:scale-95 transition-all"
          aria-label="Back to bookshelf"
        >
          ← Back
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-koala-teal text-base leading-snug line-clamp-1">
            {book.emoji && <span className="mr-1" aria-hidden="true">{book.emoji}</span>}
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 truncate">{book.author}</p>
        </div>

        <button
          onClick={handleSaveProgress}
          disabled={!currentCfi}
          aria-label="Save reading progress as bookmark"
          className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold shadow transition-all active:scale-95 ${
            bookmarkSaved
              ? 'bg-koala-green text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {bookmarkSaved ? '✅ Saved!' : '🔖 Save Progress'}
        </button>
      </div>

      {/* ── Standard Ebooks attribution ── */}
      <p className="text-xs text-gray-400 text-center">
        Source:{' '}
        <a
          href={`https://standardebooks.org`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          Standard Ebooks
        </a>
        {' '}· Free, high-quality public-domain ebooks
      </p>

      {/* ── EPUB viewer container ── */}
      {readerError ? (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center text-gray-500 text-sm">
          📚 {readerError}
        </div>
      ) : (
        <div
          ref={viewerRef}
          className="w-full rounded-2xl border border-amber-200 bg-white overflow-hidden"
          style={{ height: '65vh', minHeight: '360px' }}
          aria-label={`Reading: ${book.title}`}
          data-testid="epub-viewer"
        />
      )}

      {!readerReady && !readerError && (
        <p className="text-center text-sm text-gray-400 animate-pulse">
          📖 Loading book…
        </p>
      )}

      {/* ── Bookmark restore hint ── */}
      {currentCfi && !bookmarkSaved && (
        <p className="text-xs text-center text-koala-teal font-semibold">
          💡 Press <strong>Save Progress</strong> to bookmark your place!
        </p>
      )}
    </div>
  )
}
