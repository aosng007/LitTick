/**
 * DiscoveryHub.jsx
 * Discovery Hub – showcases three external content sources:
 *   1. Magic Bookshelf  (Project Gutenberg via gutendex.com)
 *   2. Daily News       (NewsAPI – requires API key)
 *   3. Nature Explorer  (National Geographic RSS via rss2json)
 */
import { useState, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Gutenberg card – fetches real books from gutendex.com
// ---------------------------------------------------------------------------
function MagicBookshelf({ query = 'children adventure' }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    fetch(
      `https://gutendex.com/books/?search=${encodeURIComponent(query)}&mime_type=text%2Fhtml`,
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
      <ul className="flex flex-col gap-2">
        {books.map(book => (
          <li key={book.id}>
            <a
              href={`https://www.gutenberg.org/ebooks/${book.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm hover:bg-amber-100 transition-colors group"
            >
              <span className="text-lg flex-shrink-0">📖</span>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 truncate group-hover:text-amber-700">
                  {book.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {book.authors?.map(a => a.name).join(', ') || 'Unknown author'}
                </p>
              </div>
              <span className="ml-auto text-amber-500 flex-shrink-0">→</span>
            </a>
          </li>
        ))}
      </ul>
      <a
        href={`https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="self-end text-xs text-amber-600 hover:text-amber-800 underline"
      >
        See all books →
      </a>
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
          <a
            href="https://newsapi.org/register"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs underline text-blue-600 hover:text-blue-800"
          >
            Get a free API key →
          </a>
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
      {NEWS_API_KEY && !loading && !error && (
        <ul className="flex flex-col gap-2">
          {articles.map((article, i) => (
            <li key={article.url || `${article.source?.name || 'unknown'}-${article.publishedAt || article.title}-${i}`}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-sm hover:bg-sky-100 transition-colors group"
              >
                <span className="text-lg flex-shrink-0">📄</span>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 line-clamp-2 group-hover:text-sky-700">
                    {article.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{article.source?.name}</p>
                </div>
                <span className="ml-auto text-sky-500 flex-shrink-0">→</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Nature Explorer card – Nat Geo RSS via rss2json proxy
// ---------------------------------------------------------------------------
const RSS2JSON_KEY = import.meta.env.VITE_RSS2JSON_API_KEY || ''

function NatureExplorer() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    setLoading(true)
    setError(null)

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
        if (data.status !== 'ok') throw new Error('RSS feed unavailable')
        setItems((data.items || []).slice(0, 4))
        setLoading(false)
      })
      .catch(err => {
        if (ignore) return
        if (err && err.name === 'AbortError') return
        setError('Could not load stories. Try again later.')
        setLoading(false)
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌿</span>
        <h3 className="font-extrabold text-koala-teal text-base">Nature Explorer</h3>
        <span className="text-xs text-gray-400 ml-auto">Nat Geo Animals</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4 text-gray-400 text-sm animate-pulse">
          🌿 Loading nature stories…
        </div>
      )}
      {error && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-orange-500 text-center py-1">{error}</p>
          <a
            href="https://www.nationalgeographic.com/animals"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-green-50 border border-green-200 px-3 py-3 text-sm hover:bg-green-100 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">🦁</span>
            <div>
              <p className="font-bold text-gray-800">Explore Animals on Nat Geo</p>
              <p className="text-xs text-gray-500">nationalgeographic.com/animals</p>
            </div>
            <span className="ml-auto text-green-500">→</span>
          </a>
        </div>
      )}
      {!loading && !error && (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={item.guid || item.link || i}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-sm hover:bg-green-100 transition-colors group"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="text-lg flex-shrink-0">🦁</span>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 line-clamp-2 group-hover:text-green-700">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">National Geographic</p>
                </div>
                <span className="ml-auto text-green-500 flex-shrink-0">→</span>
              </a>
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
export default function DiscoveryHub({ storyTheme = 'children adventure' }) {
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
