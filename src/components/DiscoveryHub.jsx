/**
 * DiscoveryHub.jsx
 * Discovery Hub – showcases three content sources:
 *   1. Standard Ebooks Shelf  (8 child-friendly classics, rendered via fetch + dangerouslySetInnerHTML)
 *   2. Daily News             (NewsAPI – requires API key)
 *   3. Nature Explorer        (National Geographic RSS via rss2json, with local fallback)
 *
 * Primary reading and exploration experiences are rendered within the app UI.
 */
import { useState, useEffect } from 'react'
import Checklist from './Checklist'
import NATURE_STORIES from '../content/natureData'
import StandardEbooksReader from './StandardEbooksReader'
import { STANDARD_EBOOKS_CLASSICS } from '../content/StandardEbooksClassics'
import DictionaryPopover, { getSelectedWord } from './DictionaryPopover'

// ---------------------------------------------------------------------------
// Standard Ebooks Shelf – displays hardcoded Year 2 classics
// ---------------------------------------------------------------------------

/** Read the saved progress percentage for a book (0-100). */
function loadBookProgress(bookId) {
  try {
    const raw = localStorage.getItem(`littick_progress_${bookId}`)
    if (raw === null) return 0
    const n = parseFloat(raw)
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0
  } catch {
    return 0
  }
}

function StandardEbooksShelf({ initialBookId }) {
  const [selectedBook, setSelectedBook] = useState(() => {
    if (initialBookId) return STANDARD_EBOOKS_CLASSICS.find(b => b.id === initialBookId) || null
    return null
  })
  const [progressMap, setProgressMap] = useState({})

  // Load saved progress for every book on mount
  useEffect(() => {
    const map = {}
    STANDARD_EBOOKS_CLASSICS.forEach(book => {
      map[book.id] = loadBookProgress(book.id)
    })
    setProgressMap(map)
  }, [])

  if (selectedBook) {
    return (
      <StandardEbooksReader
        book={selectedBook}
        onBack={() => {
          // Refresh progress when returning to the shelf
          const map = {}
          STANDARD_EBOOKS_CLASSICS.forEach(book => { map[book.id] = loadBookProgress(book.id) })
          setProgressMap(map)
          setSelectedBook(null)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📚</span>
        <h3 className="font-extrabold text-koala-teal text-base">Classic Bookshelf</h3>
        <span className="text-xs text-gray-400 ml-auto">Standard Ebooks</span>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STANDARD_EBOOKS_CLASSICS.map(book => {
          const pct = progressMap[book.id] || 0
          return (
            <li key={book.id}>
              <button
                onClick={() => setSelectedBook(book)}
                className="w-full flex flex-col items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 p-2 text-sm hover:bg-amber-100 hover:border-amber-400 hover:shadow-md active:scale-[0.98] transition-all text-center"
                aria-label={`Read ${book.title}${pct > 0 ? ` – ${pct}% read` : ''}`}
              >
                <span
                  className="relative text-4xl w-16 h-[88px] flex items-center justify-center rounded shadow"
                  style={{ background: book.coverColor + '33' }}
                  aria-hidden="true"
                >
                  {book.emoji}
                  {pct > 0 && (
                    <span className="absolute top-1 right-1 text-[10px] font-bold bg-koala-green text-white rounded-full px-1 leading-4">
                      {pct}%
                    </span>
                  )}
                </span>
                <p className="font-bold text-gray-800 line-clamp-2 text-xs leading-snug">
                  {book.title}
                </p>
                <p className="text-xs text-gray-500 truncate w-full">{book.author}</p>
                {/* Per-book progress bar */}
                {pct > 0 && (
                  <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-koala-green"
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${book.title} reading progress`}
                      aria-label={`${book.title} reading progress: ${pct}%`}
                    />
                  </div>
                )}
                <p className="text-xs text-koala-teal font-semibold" aria-hidden="true">
                  {pct > 0 ? '▶ Open' : '▶ Read'}
                </p>
              </button>
            </li>
          )
        })}
      </ul>
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

/** Strip HTML tags from RSS content so it is safe to render as plain text. */
function stripHtml(html) {
  if (!html) return ''
  try {
    // Use the browser's HTML parser to extract plain text safely.
    // DOMParser avoids the incomplete-sanitization risk of a regex approach.
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  } catch {
    // DOMParser unavailable or parsing failed – fall back to the original text so
    // the Reading View still shows content. It will be rendered as escaped plain text.
    return typeof html === 'string' ? html : String(html)
  }
}

/**
 * Deterministically hash a string into a short base-36 ID fragment.
 * Used when an RSS item is missing both guid and link to avoid ID collisions.
 */
function hashString(value) {
  let hash = 0
  if (!value) return '0'
  for (let i = 0; i < value.length; i += 1) {
    const chr = value.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32-bit integer
  }
  return Math.abs(hash >>> 0).toString(36)
}

/**
 * Returns a stable, storage-safe ID for a nature story item.
 * Fallback stories already have a clean `id` field.
 * For live RSS items we derive one from the guid or link.
 * If both guid and link are missing, we fall back to a hashed representation
 * of the item (preferably its title) to avoid ID collisions.
 */
function getNatureStoryId(item) {
  if (item.id) return item.id
  const raw = item.guid || item.link
  if (raw) {
    return 'nature-' + raw.replace(/[^a-zA-Z0-9]/g, '-').slice(-MAX_ID_SUFFIX_LENGTH)
  }
  // Fallback when both guid and link are unavailable.
  const title = typeof item.title === 'string' ? item.title : ''
  const serialized = title || (() => {
    try { return JSON.stringify(item) } catch { return '' }
  })()
  return 'nature-' + hashString(serialized).slice(0, MAX_ID_SUFFIX_LENGTH)
}

// ---------------------------------------------------------------------------
// NatureReadingView – dedicated reading screen for a nature story
// ---------------------------------------------------------------------------
function NatureReadingView({ story, onBack }) {
  const storyId = getNatureStoryId(story)
  // Prefer fullContent (local stories), then summary, then strip HTML from RSS content
  const text = story.fullContent || story.summary || stripHtml(story.description || story.content || story.title || '')
  const [activeWord, setActiveWord] = useState(null)

  const handleTextSelect = () => {
    const word = getSelectedWord()
    if (word) setActiveWord(word)
  }

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

      {/* Story text – select a word to look it up */}
      <div className="relative">
        <div
          className="rounded-2xl bg-green-50 border border-green-200 p-4 max-h-64 overflow-y-auto"
          role="article"
          aria-label={`Story text: ${story.title}`}
          onMouseUp={handleTextSelect}
        >
          {text.split('\n\n').map((para) => (
            <p key={para.slice(0, 40)} className="text-gray-700 leading-relaxed text-base mb-3 last:mb-0">
              {para.trim()}
            </p>
          ))}
        </div>
        {activeWord && (
          <DictionaryPopover
            word={activeWord}
            onClose={() => setActiveWord(null)}
            maxWords={10}
          />
        )}
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
        setItems(NATURE_STORIES)
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
export default function DiscoveryHub({ storyTheme = 'children', initialBookId }) {
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
        {/* Standard Ebooks Classic Bookshelf */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 p-4 shadow-sm">
          <StandardEbooksShelf initialBookId={initialBookId} />
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
