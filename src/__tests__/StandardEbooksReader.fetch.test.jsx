// src/__tests__/StandardEbooksReader.fetch.test.jsx
// Unit test: verifies that StandardEbooksReader uses fetch() to retrieve book
// HTML from the Standard Ebooks single-page URL and renders the text in the DOM.

import { render, screen, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach, test, expect, describe } from 'vitest'
import StandardEbooksReader from '../components/StandardEbooksReader'

const TEST_BOOK = {
  id: 'peter-and-wendy',
  title: 'Peter and Wendy',
  author: 'J. M. Barrie',
  emoji: '🧚',
  coverColor: '#5BAD8F',
  url: 'https://standardebooks.org/ebooks/j-m-barrie/peter-and-wendy',
}

const SAMPLE_HTML = '<p>All children, except one, grow up.</p>'

describe('StandardEbooksReader – fetch-based rendering', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
    localStorage.clear()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  test('calls fetch with the Standard Ebooks single-page URL', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(SAMPLE_HTML) })
    )

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${TEST_BOOK.url}/text/single-page`,
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    })
  })

  test('renders fetched HTML string content in the reading container', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(SAMPLE_HTML) })
    )

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('reading-container')).toBeInTheDocument()
    })
    expect(screen.getByTestId('reading-container').innerHTML).toContain(
      'All children, except one, grow up.'
    )
  })

  test('shows loading indicator while fetch is in progress', () => {
    // Never-resolving fetch keeps the component in the loading state
    global.fetch = vi.fn(() => new Promise(() => {}))

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    expect(screen.getByText(/Loading book/i)).toBeInTheDocument()
  })

  test('shows error message when fetch returns a non-OK response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 403, text: () => Promise.resolve('') })
    )

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Could not load book/i)).toBeInTheDocument()
    })
  })

  test('shows error message when fetch rejects (network failure)', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Could not load book/i)).toBeInTheDocument()
    })
  })

  test('strips <script> tags from fetched HTML before rendering', async () => {
    const maliciousHtml = '<p>Safe text.</p><script>alert("xss")</script>'
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(maliciousHtml) })
    )

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('reading-container')).toBeInTheDocument()
    })
    const container = screen.getByTestId('reading-container')
    expect(container.innerHTML).not.toContain('<script>')
    expect(container.innerHTML).not.toContain('alert("xss")')
    expect(container.innerHTML).toContain('Safe text.')
  })

  test('strips inline event handlers from fetched HTML before rendering', async () => {
    const maliciousHtml = '<p onclick="alert(1)">Safe text.</p><a href="javascript:alert(2)">link</a>'
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(maliciousHtml) })
    )

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('reading-container')).toBeInTheDocument()
    })
    const container = screen.getByTestId('reading-container')
    expect(container.innerHTML).not.toContain('onclick')
    expect(container.innerHTML).not.toContain('javascript:')
  })

  test('shows error when book URL hostname is not standardebooks.org', async () => {
    const untrustedBook = {
      ...TEST_BOOK,
      url: 'https://evil.example.com/books/something',
    }
    global.fetch = vi.fn()

    render(<StandardEbooksReader book={untrustedBook} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Could not load book/i)).toBeInTheDocument()
    })
    // fetch must NOT have been called for an untrusted hostname
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('Save Progress button is disabled while loading', () => {
    global.fetch = vi.fn(() => new Promise(() => {}))

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    const btn = screen.getByRole('button', { name: /save reading progress/i })
    expect(btn).toBeDisabled()
  })

  test('strips top-level <nav> from fetched HTML but preserves in-book nav', async () => {
    // body > nav is site chrome; nav nested inside <main> is in-book content (e.g. ToC)
    const htmlWithNav =
      '<nav id="site-nav"><a href="/">Home</a></nav>' +
      '<main><nav id="toc"><a href="#ch1">Chapter 1</a></nav><p>Chapter text.</p></main>'
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(htmlWithNav) })
    )

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('reading-container')).toBeInTheDocument()
    })
    const container = screen.getByTestId('reading-container')
    // Top-level site nav must be gone
    expect(container.querySelector('#site-nav')).toBeNull()
    // In-book nav (nested inside main) must be preserved
    expect(container.querySelector('#toc')).not.toBeNull()
    expect(container.innerHTML).toContain('Chapter text.')
  })

  test('strips top-level <header>/<footer> but preserves nested in-book elements', async () => {
    const htmlWithChrome =
      '<header id="site-header"><nav>Site Nav</nav></header>' +
      '<main><header id="chapter-header"><h2>Chapter One</h2></header>' +
      '<p>Book content.</p>' +
      '<footer id="chapter-footer">— End of chapter —</footer></main>' +
      '<footer id="site-footer">Site footer</footer>'
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(htmlWithChrome) })
    )

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('reading-container')).toBeInTheDocument()
    })
    const container = screen.getByTestId('reading-container')
    // Top-level site chrome must be gone
    expect(container.querySelector('#site-header')).toBeNull()
    expect(container.querySelector('#site-footer')).toBeNull()
    // In-book nested header/footer must survive
    expect(container.querySelector('#chapter-header')).not.toBeNull()
    expect(container.querySelector('#chapter-footer')).not.toBeNull()
    expect(container.innerHTML).toContain('Book content.')
  })
})
