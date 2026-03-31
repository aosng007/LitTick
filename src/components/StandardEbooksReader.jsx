/**
 * StandardEbooksReader.jsx
 * Fetches the single-page HTML edition of a book from Standard Ebooks using
 * fetch() and injects it directly into a scrollable ReadingContainer.
 *
 * This approach replaces the previous epubjs/EPUB strategy and avoids the
 * X-Frame-Options: sameorigin restriction that blocks iframe embeds.
 * Because the book text lives on the same page, the Timer and Bookmark
 * controls remain visible at all times.
 *
 * Features:
 *   • fetch() retrieves the book HTML from <bookUrl>/text/single-page
 *   • dangerouslySetInnerHTML injects the text into the ReadingContainer
 *   • sanitizeHtml strips scripts, styles, top-level site-chrome elements
 *     (body > nav/header/footer) then removes inline event handlers / JS URIs
 *   • Book typography is provided by the .reading-container CSS class in
 *     index.css (Georgia serif, heading sizes, paragraph indentation)
 *   • Bookmark system: "Save Progress" stores the scroll position in
 *     localStorage under the key `littick_bookmark_<bookId>` and restores
 *     it automatically the next time the same book is opened.
 *
 * Props:
 *   book   – an entry from STANDARD_EBOOKS_CLASSICS (id, title, author, url, …)
 *   onBack – callback invoked when the user presses the Back button
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import DictionaryPopover, { getSelectedWord } from './DictionaryPopover'

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

function saveBookmark(bookId, scrollPos) {
  try {
    localStorage.setItem(`littick_bookmark_${bookId}`, scrollPos)
  } catch { /* localStorage unavailable – storage restriction */ }
}

// ---------------------------------------------------------------------------
// Sanitize fetched HTML before injection
// Removes <script> tags, inline event handlers (on*), and javascript: URLs.
// Also rewrites relative image src attributes (e.g. ../images/foo.jpg) to
// absolute URLs using the provided baseUrl so that illustrations load correctly.
// ---------------------------------------------------------------------------
function sanitizeHtml(html, baseUrl) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  // Remove script, style, link, and top-level site-chrome elements.
  // Use child combinators (body > …) so that book-internal <nav> (e.g. ToC),
  // <header> (section headings), and <footer> (signatures) are preserved.
  doc.querySelectorAll('script, style, link, body > nav, body > header, body > footer').forEach(el => el.remove())
  // Strip inline event handlers and dangerous URIs from every element.
  // Normalize: remove whitespace and lowercase to catch obfuscated variants
  // (DOMParser already decodes HTML entities, e.g. &#106;avascript: → javascript:)
  doc.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name)
      } else if (['href', 'src', 'action'].includes(attr.name)) {
        const normalized = attr.value.replace(/\s/g, '').toLowerCase()
        if (normalized.startsWith('javascript:') || normalized.startsWith('data:') || normalized.startsWith('vbscript:')) {
          el.removeAttribute(attr.name)
        }
      }
    })
  })
  // Rewrite image src attributes to absolute URLs.
  // Handles: (a) normal relative paths, (b) EPUB internal 'image:…' labels.
  if (baseUrl) {
    doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src')
      if (!src) return
      // Already absolute HTTP/HTTPS or data URI – nothing to do
      if (src.startsWith('https://') || src.startsWith('http://') || src.startsWith('//') || src.startsWith('data:')) return

      // ── Case 1: Normal relative path (no scheme separator) ──────────────────
      if (!src.includes(':')) {
        try {
          img.setAttribute('src', new URL(src, baseUrl).href)
          return
        } catch { /* fall through */ }
      }

      // ── Case 2: EPUB internal label, e.g. 'image:image.illustration-1' ──────
      // Strategy A: use the href of a wrapping <a> tag
      const anchor = img.closest('a[href]')
      if (anchor) {
        const href = anchor.getAttribute('href') || ''
        const hrefNorm = href.replace(/\s/g, '').toLowerCase()
        if (!hrefNorm.startsWith('javascript:') && !hrefNorm.startsWith('data:') && !hrefNorm.startsWith('vbscript:')) {
          try {
            img.setAttribute('src', new URL(href, baseUrl).href)
            return
          } catch { /* fall through */ }
        }
      }

      // Strategy B: derive filename from the label, id, or alt text, then point
      // to the /images/ folder inside the book's /text/ directory.
      // e.g. 'image:image.illustration-1' → filename 'illustration-1'
      const afterColon = src.slice(src.indexOf(':') + 1)
      const dotIdx = afterColon.indexOf('.')
      const fromLabel = dotIdx >= 0 ? afterColon.slice(dotIdx + 1) : afterColon
      const fromId    = img.getAttribute('id') || ''
      const fromAlt   = (img.getAttribute('alt') || '').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()
      const filename  = fromId || fromLabel || fromAlt
      if (filename) {
        try {
          // Derive the /text/ base directory from the singlePageUrl
          // e.g. …/text/single-page → new URL('.', …) → …/text/
          const textDirUrl = new URL('.', baseUrl).href
          img.setAttribute('src', `${textDirUrl}images/${filename}.jpg`)
          return
        } catch { /* fall through */ }
      }

      // ── Fallback: hide the image to avoid a broken icon ─────────────────────
      img.style.display = 'none'
    })
  }
  return doc.body.innerHTML
}

// ---------------------------------------------------------------------------
// Main StandardEbooksReader component
// ---------------------------------------------------------------------------
export default function StandardEbooksReader({ book, onBack }) {
  const containerRef = useRef(null)

  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bookmarkSaved, setBookmarkSaved] = useState(false)
  const [activeWord, setActiveWord] = useState(null)

  // Construct the single-page URL from the book's canonical Standard Ebooks URL
  const singlePageUrl = `${book.url}/text/single-page`

  // Fetch the book HTML whenever the book changes
  useEffect(() => {
    // Validate that the URL comes from Standard Ebooks before fetching
    let parsedUrl
    try {
      parsedUrl = new URL(singlePageUrl)
    } catch {
      setError('Could not load book: invalid book URL')
      setLoading(false)
      return
    }
    if (parsedUrl.hostname !== 'standardebooks.org') {
      setError('Could not load book: content must come from Standard Ebooks')
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setHtmlContent('')

    fetch(singlePageUrl, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(html => {
        setHtmlContent(sanitizeHtml(html, singlePageUrl))
        setLoading(false)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setError(`Could not load book: ${err?.message || 'unknown error'}`)
        setLoading(false)
      })

    return () => { controller.abort() }
  }, [singlePageUrl])

  // Restore saved scroll position after content is injected
  useEffect(() => {
    if (!htmlContent || !containerRef.current) return
    const saved = loadBookmark(book.id)
    if (saved) {
      const pos = parseInt(saved, 10)
      if (!Number.isNaN(pos) && pos >= 0) containerRef.current.scrollTop = pos
    }
  }, [htmlContent, book.id])

  // Attach onerror handlers to every <img> so that images that still fail to
  // load (e.g. due to CORS or an unresolvable path) are hidden rather than
  // showing the browser's broken-image icon.
  useEffect(() => {
    if (!htmlContent || !containerRef.current) return
    containerRef.current.querySelectorAll('img').forEach(img => {
      if (!img.onerror) {
        img.onerror = () => { img.style.display = 'none' }
      }
    })
  }, [htmlContent])

  const handleSaveProgress = useCallback(() => {
    const scrollPos = String(containerRef.current?.scrollTop ?? 0)
    saveBookmark(book.id, scrollPos)
    setBookmarkSaved(true)
  }, [book.id])

  return (
    <div className="flex flex-col gap-3">
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
          disabled={loading || !!error}
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
          href="https://standardebooks.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          Standard Ebooks
        </a>
        {' '}· Free, high-quality public-domain ebooks
      </p>

      {/* ── Loading state ── */}
      {loading && (
        <p className="text-center text-sm text-gray-400 animate-pulse">
          📖 Loading book…
        </p>
      )}

      {/* ── Error state ── */}
      {error && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center text-gray-500 text-sm">
          📚 {error}
        </div>
      )}

      {/* ── ReadingContainer: injected book HTML styled for young readers ── */}
      {!loading && !error && (
        <div className="relative">
          <div
            ref={containerRef}
            data-testid="reading-container"
            className="reading-container w-full rounded-2xl border border-amber-200 bg-white overflow-auto"
            style={{
              height: '65vh',
              minHeight: '360px',
              fontSize: '1.25rem',
              lineHeight: '1.9',
              padding: '1.5rem',
            }}
            aria-label={`Reading: ${book.title}`}
            onMouseUp={() => {
              const word = getSelectedWord()
              if (word) setActiveWord(word)
            }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          {activeWord && (
            <DictionaryPopover
              word={activeWord}
              onClose={() => setActiveWord(null)}
              maxWords={10}
            />
          )}
        </div>
      )}
    </div>
  )
}
