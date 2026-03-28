/**
 * DiscoveryHub.jsx
 * Discovery Hub – showcases three external content sources:
 *   1. Magic Bookshelf  (Project Gutenberg via gutendex.com)
 *   2. Daily News       (NewsAPI – requires API key)
 *   3. Nature Explorer  (National Geographic RSS via rss2json, with local fallback)
 *
 * All content is rendered within the app UI. No <a> tags navigate away from the app.
 */
import { useState, useEffect, useRef } from 'react'
import Checklist from './Checklist'
import { TOTAL_SECONDS } from './Timer'

// ---------------------------------------------------------------------------
// Local fallback stories for Year 2 students (used when RSS is unavailable)
// ---------------------------------------------------------------------------
const FALLBACK_NATURE_STORIES = [
  {
    id: 'fallback-1',
    title: 'The Amazing Migration of Monarch Butterflies',
    summary:
      'Every year, millions of monarch butterflies travel thousands of kilometres to warmer places. Scientists are amazed by how these tiny insects know which way to go!',
    emoji: '🦋',
  },
  {
    id: 'fallback-2',
    title: 'Ocean Giants: The Humpback Whale',
    summary:
      'Humpback whales are famous for their beautiful songs. These giant animals can leap fully out of the water in a move called breaching. Find out how these incredible animals live!',
    emoji: '🐋',
  },
  {
    id: 'fallback-3',
    title: 'Clever Crows: Birds That Can Solve Puzzles',
    summary:
      'Did you know crows are one of the smartest animals on Earth? They can use tools, remember human faces, and even plan ahead. Scientists are still learning just how clever they are!',
    emoji: '🐦',
  },
]

// ---------------------------------------------------------------------------
// Gutenberg card – fetches real books from gutendex.com
// ---------------------------------------------------------------------------
function MagicBookshelf({ query = 'children' }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    setLoading(true)
    setError(null)
    setBooks([])

    fetch(
      `https://gutendex.com/books/?search=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    )
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (ignore) return
        setBooks((data.results || []).slice(0, 4))
        setLoading(false)
      })
      .catch(err => {
        if (ignore) return
        if (err && err.name === 'AbortError') return
        setBooks([])
        setError('Could not load books. Please try again later.')
        setLoading(false)
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [query])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📚</span>
        <h3 className="font-extrabold text-koala-teal text-base">Magic Bookshelf</h3>
        <span className="text-xs text-gray-400 ml-auto">Project Gutenberg</span>
      </div>
      {loading && (
        <div className="flex items-center justify-center py-4 text-gray-400 text-sm animate-pulse">
          📖 Loading books…
        </div>
      )}
      {error && (
        <p className="text-xs text-red-400 text-center py-2">{error}</p>
      )}
      {!loading && !error && books.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">No books found.</p>
      )}
      {!loading && !error && books.length > 0 && (
        <ul className="flex flex-col gap-2">
          {books.map(book => (
            <li key={book.id}>
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm">
                <span className="text-lg flex-shrink-0">📖</span>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">
                    {book.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {book.authors?.map(a => a.name).join(', ') || 'Unknown author'}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NewsAPI card – requires an API key configured via VITE_NEWS_API_KEY
// ---------------------------------------------------------------------------
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || ''

function DailyNews({ topic = 'children education' }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!NEWS_API_KEY) return
    let ignore = false
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&pageSize=4&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    fetch(url, { signal: controller.signal })
      .then(r => {
        if (!r.ok) {
          let message
          if (r.status === 401) {
            message = 'News API key is invalid or missing.'
          } else if (r.status === 429) {
            message = 'News service rate limit reached. Please try again later.'
          } else {
            message = 'News service is unavailable. Please try again later.'
          }
          throw new Error(message)
        }
        return r.json()
      })
      .then(data => {
        if (ignore) return
        if (data.status === 'error') throw new Error(data.message || 'News API returned an error.')
        setArticles((data.articles || []).slice(0, 4))
        setLoading(false)
      })
      .catch(err => {
        if (ignore) return
        if (err && err.name === 'AbortError') return
        setError(err.message || 'Could not load news. Please try again later.')
        setLoading(false)
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [topic])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📰</span>
        <h3 className="font-extrabold text-koala-teal text-base">Daily News</h3>
        <span className="text-xs text-gray-400 ml-auto">NewsAPI</span>
      </div>

      {!NEWS_API_KEY && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          <p className="font-bold mb-1">🔑 API Key Required</p>
          <p className="text-xs">
            Add your <strong>NewsAPI</strong> key as{' '}
            <code className="bg-blue-100 px-1 rounded">VITE_NEWS_API_KEY</code>{' '}
            in your <code className="bg-blue-100 px-1 rounded">.env</code> file to enable live news.
          </p>
        </div>
      )}

      {NEWS_API_KEY && loading && (
        <div className="flex items-center justify-center py-4 text-gray-400 text-sm animate-pulse">
          📰 Loading news…
        </div>
      )}
      {NEWS_API_KEY && error && (
        <p className="text-xs text-red-400 text-center py-2">{error}</p>
      )}
      {NEWS_API_KEY && !loading && !error && articles.length > 0 && (
        <ul className="flex flex-col gap-2">
          {articles.map((article, i) => (
            <li key={article.url || `${article.source?.name || 'unknown'}-${article.publishedAt || article.title}-${i}`}>
              <div className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-sm">
                <span className="text-lg flex-shrink-0">📄</span>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 line-clamp-2">
                    {article.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{article.source?.name}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers for Nature Reading View
// ---------------------------------------------------------------------------

/** Maximum number of characters to use from a raw guid/link when building a story ID. */
const MAX_ID_SUFFIX_LENGTH = 50

/** Seconds remaining when the timer ring turns amber (warning zone). */
const WARNING_THRESHOLD_SECONDS = 120
/** Seconds remaining when the timer ring turns red (critical zone). */
const CRITICAL_THRESHOLD_SECONDS = 60
/** Ring colour when reading time is plentiful. */
const TIMER_COLOR_GREEN = '#5BAD8F'
/** Ring colour in the warning zone (last 2 minutes). */
const TIMER_COLOR_AMBER = '#F59E0B'
/** Ring colour in the critical zone (last 1 minute). */
const TIMER_COLOR_RED = '#EF4444'

/** Strip HTML tags from RSS content so it is safe to render as plain text. */
function stripHtml(html) {
  if (!html) return ''
  try {
    // Use the browser's HTML parser to extract plain text safely.
    // DOMParser avoids the incomplete-sanitization risk of a regex approach.
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  } catch {
    // DOMParser unavailable – return empty string rather than risk partial sanitization.
    return ''
  }
}

/**
 * Returns a stable, storage-safe ID for a nature story item.
 * Fallback stories already have a clean `id` field.
 * For live RSS items we derive one from the guid or link.
 */
function getNatureStoryId(item) {
  if (item.id) return item.id
  const raw = item.guid || item.link || ''
  return 'nature-' + raw.replace(/[^a-zA-Z0-9]/g, '-').slice(-MAX_ID_SUFFIX_LENGTH)
}

// ---------------------------------------------------------------------------
// ReadingTimer – auto-starts countdown; session-only (no localStorage) so it
// does not conflict with the main story timer's littick_timer_state key.
// ---------------------------------------------------------------------------
function ReadingTimer() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [isTimerActive, setIsTimerActive] = useState(true) // auto-start
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
  const progress = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100
  const r = 42
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference - (progress / 100) * circumference
  const ringColour =
    secondsLeft > WARNING_THRESHOLD_SECONDS ? TIMER_COLOR_GREEN
    : secondsLeft > CRITICAL_THRESHOLD_SECONDS ? TIMER_COLOR_AMBER
    : TIMER_COLOR_RED

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">⏱</span>
        <span className="font-bold text-koala-teal text-base">15-Minute Reading Timer</span>
      </div>

      <div className="relative w-28 h-28" aria-hidden="true">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
          <circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={ringColour}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-xl font-extrabold tabular-nums"
            style={{ color: ringColour }}
            aria-live="polite"
            aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
          >
            {timeString}
          </span>
          <span className="text-xs text-gray-400 font-semibold mt-0.5">
            {hasFinished ? 'Done! 🎉' : isTimerActive ? 'Reading…' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {isTimerActive && !hasFinished && (
          <button
            onClick={() => setIsTimerActive(false)}
            className="rounded-xl bg-amber-400 px-4 py-2 text-white font-bold text-sm shadow hover:bg-amber-500 active:scale-95 transition-all"
            aria-label="Pause reading timer"
          >
            ⏸ Pause
          </button>
        )}
        {!isTimerActive && !hasFinished && (
          <button
            onClick={() => setIsTimerActive(true)}
            className="rounded-xl bg-koala-green px-4 py-2 text-white font-bold text-sm shadow hover:bg-koala-teal active:scale-95 transition-all"
            aria-label="Resume reading timer"
          >
            ▶ Resume
          </button>
        )}
        {hasFinished && (
          <p className="font-bold text-koala-teal text-sm text-center">
            🎉 Amazing reading! You finished your 15 minutes!
          </p>
        )}
      </div>

      {isTimerActive && !hasFinished && (
        <p className="text-xs text-koala-teal font-semibold animate-pulse text-center">
          📖 Great job reading! Keep going! 🌟
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NatureReadingView – dedicated reading screen for a nature story
// ---------------------------------------------------------------------------
function NatureReadingView({ story, onBack }) {
  const storyId = getNatureStoryId(story)
  // Prefer summary (fallback stories), then strip HTML from description/content
  const text = story.summary || stripHtml(story.description || story.content || story.title || '')

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-200 active:scale-95 transition-all"
          aria-label="Back to nature stories list"
        >
          ← Back
        </button>
        <h3 className="font-extrabold text-koala-teal text-base leading-snug flex-1 min-w-0">
          {story.emoji && <span className="mr-1" aria-hidden="true">{story.emoji}</span>}
          {story.title}
        </h3>
      </div>

      {/* Story text */}
      <div
        className="rounded-2xl bg-green-50 border border-green-200 p-4 max-h-64 overflow-y-auto"
        role="article"
        aria-label={`Story text: ${story.title}`}
      >
        <p className="text-gray-700 leading-relaxed text-base">{text}</p>
      </div>

      {/* Timer – auto-starts immediately */}
      <div className="rounded-2xl bg-white/90 border border-koala-green/20 p-4 shadow-sm">
        <ReadingTimer />
      </div>

      {/* Five Finger Retell Checklist */}
      <div className="rounded-2xl bg-white/90 border border-koala-green/20 p-4 shadow-sm">
        <Checklist storyId={storyId} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Nature Explorer card – Nat Geo RSS via rss2json proxy, with local fallback
// ---------------------------------------------------------------------------
const RSS2JSON_KEY = import.meta.env.VITE_RSS2JSON_API_KEY || ''

function NatureExplorer() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)
  const [selectedNatureStory, setSelectedNatureStory] = useState(null)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    setLoading(true)
    setUsingFallback(false)

    const rssUrl = 'https://www.nationalgeographic.com/animals/rss'
    const apiUrl = RSS2JSON_KEY
      ? `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=${RSS2JSON_KEY}&count=4`
      : `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=4`

    fetch(apiUrl, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (ignore) return
        if (data.status !== 'ok' || !data.items || data.items.length === 0) {
          throw new Error('RSS feed unavailable')
        }
        setItems(data.items.slice(0, 4))
        setUsingFallback(false)
        setLoading(false)
      })
      .catch(err => {
        if (ignore) return
        if (err && err.name === 'AbortError') return
        setItems(FALLBACK_NATURE_STORIES)
        setUsingFallback(true)
        setLoading(false)
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])

  // Show the dedicated reading view when a story is selected
  if (selectedNatureStory) {
    return (
      <NatureReadingView
        story={selectedNatureStory}
        onBack={() => setSelectedNatureStory(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌿</span>
        <h3 className="font-extrabold text-koala-teal text-base">Nature Explorer</h3>
        <span className="text-xs text-gray-400 ml-auto">
          {usingFallback ? 'Nature Stories' : 'Nat Geo Animals'}
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4 text-gray-400 text-sm animate-pulse">
          🌿 Loading nature stories…
        </div>
      )}
      {!loading && (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={item.id || item.guid || item.link || i}>
              <button
                onClick={() => setSelectedNatureStory(item)}
                className="w-full flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-sm hover:bg-green-100 hover:border-green-400 hover:shadow-md active:scale-[0.98] transition-all text-left"
                aria-label={`Read story: ${item.title}`}
              >
                {usingFallback ? (
                  <span className="text-lg flex-shrink-0" aria-hidden="true">{item.emoji}</span>
                ) : (
                  <span className="text-lg flex-shrink-0" aria-hidden="true">🦁</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800 line-clamp-2">
                    {item.title}
                  </p>
                  {usingFallback ? (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{item.summary}</p>
                  ) : (
                    <p className="text-xs text-gray-500">National Geographic</p>
                  )}
                </div>
                <span className="text-xs text-koala-teal font-bold flex-shrink-0 ml-1" aria-hidden="true">▶ Read</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Discovery Hub – main export
// ---------------------------------------------------------------------------
export default function DiscoveryHub({ storyTheme = 'children' }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-extrabold text-2xl text-koala-teal flex items-center justify-center gap-2">
          🔭 Discovery Hub
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Explore books, news, and nature stories from around the world!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Magic Bookshelf */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 p-4 shadow-sm">
          <MagicBookshelf query={storyTheme} />
        </div>

        {/* Daily News */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 p-4 shadow-sm">
          <DailyNews topic={storyTheme} />
        </div>

        {/* Nature Explorer */}
        <div className="rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-4 shadow-sm">
          <NatureExplorer />
        </div>
      </div>
    </div>
  )
}
