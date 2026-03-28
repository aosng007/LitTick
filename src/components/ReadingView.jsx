/**
 * ReadingView.jsx
 * Renders a full Project Gutenberg reading page directly inside an iframe,
 * bypassing any CORS or proxy issues associated with fetching raw text files.
 *
 * Usage:
 *   <ReadingView book={gutendexBook} onBack={handleBack}>
 *     {optionalChildren}
 *   </ReadingView>
 *
 * Props:
 *   book     – A gutendex book object with at minimum: id, title, authors, formats
 *   onBack   – Callback invoked when the user presses the Back button
 *   children – Optional content rendered below the iframe (e.g. a reading timer)
 */
export default function ReadingView({ book, onBack, children }) {
  // Validate that book.id is a positive integer before constructing the URL
  const safeId = Number.isInteger(book.id) && book.id > 0 ? book.id : null
  const embedUrl = safeId ? `https://www.gutenberg.org/ebooks/${safeId}` : null

  const coverUrl = (() => {
    try {
      const raw = book.formats?.['image/jpeg'] || ''
      const parsed = new URL(raw)
      return parsed.protocol === 'https:' ? parsed.href : null
    } catch {
      return null
    }
  })()

  return (
    <div className="flex flex-col gap-4">
      {/* Header: Back button + cover thumbnail + title/author */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-200 active:scale-95 transition-all"
          aria-label="Back to bookshelf"
        >
          ← Back
        </button>
        {coverUrl && (
          <img
            src={coverUrl}
            alt={`Cover of ${book.title}`}
            className="w-10 h-14 object-cover rounded shadow flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <h3 className="font-extrabold text-koala-teal text-base leading-snug line-clamp-2">
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {book.authors?.map(a => a.name).join(', ') || 'Unknown author'}
          </p>
        </div>
      </div>

      {/* Direct iframe embed of the Gutenberg reading page */}
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={book.title}
          aria-label={`Reading: ${book.title}`}
          className="w-full rounded-2xl border border-amber-200"
          style={{ height: '60vh', minHeight: '320px' }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      ) : (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center text-gray-500 text-sm">
          📚 This book is not available for reading.
        </div>
      )}

      {/* Optional content below the iframe (e.g. reading timer) */}
      {children}
    </div>
  )
}
