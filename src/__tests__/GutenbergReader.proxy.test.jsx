// src/__tests__/GutenbergReader.proxy.test.jsx
// Verifies that GutenbergReader routes fetch calls through allorigins.win
// and renders the loading spinner while content is pending.
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiscoveryHub from '../components/DiscoveryHub'

// Minimal gutendex-style results payload with one book that has a .txt.utf-8 URL
const GUTENDEX_RESULTS = {
  results: [
    {
      id: 1,
      title: 'My Test Book',
      authors: [{ name: 'Test Author' }],
      formats: {
        'text/plain; charset=utf-8':
          'https://www.gutenberg.org/cache/epub/1/pg1.txt.utf-8',
        'image/jpeg':
          'https://www.gutenberg.org/cache/epub/1/pg1.cover.medium.jpg',
      },
    },
  ],
}

describe('GutenbergReader proxy behaviour', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  function makeBookshelfFetch(bookTextContents, delayTextFetch = false) {
    // Keeps track of every URL fetch was called with
    const calledUrls = []

    let resolveText
    const textPromise = delayTextFetch
      ? new Promise(res => { resolveText = () => res({ contents: bookTextContents, status: {} }) })
      : Promise.resolve({ contents: bookTextContents, status: {} })

    global.fetch = (url, _opts) => {
      calledUrls.push(url)
      if (new URL(url).hostname === 'gutendex.com') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(GUTENDEX_RESULTS) })
      }
      if (url.includes('allorigins.win')) {
        return Promise.resolve({ ok: true, json: () => textPromise })
      }
      // Ignore any other fetch (e.g. cover images)
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
    }

    return { calledUrls, resolveText: resolveText || (() => {}) }
  }

  test('calls allorigins.win proxy (not gutenberg directly) when a book is opened', async () => {
    const { calledUrls } = makeBookshelfFetch('Hello from the book')

    render(<DiscoveryHub />)

    // Wait for the book list to appear
    const readBtn = await screen.findByRole('button', { name: /read my test book/i })
    await userEvent.click(readBtn)

    // Wait for text to resolve (loading finishes)
    await screen.findByText(/Hello from the book/)

    // At least one fetch must target allorigins.win
    const proxyCall = calledUrls.find(u => u.includes('allorigins.win'))
    expect(proxyCall).toBeTruthy()
    expect(proxyCall).toContain('api.allorigins.win/get?url=')

    // The raw Gutenberg text URL must NOT have been called directly
    const directGutenbergCall = calledUrls.find(url => {
      try {
        const { hostname } = new URL(url)
        return hostname === 'www.gutenberg.org' && url.includes('.txt')
      } catch { return false }
    })
    expect(directGutenbergCall).toBeUndefined()
  })

  test('proxy URL contains the encoded Gutenberg text URL', async () => {
    const { calledUrls } = makeBookshelfFetch('Book contents here')

    render(<DiscoveryHub />)

    const readBtn = await screen.findByRole('button', { name: /read my test book/i })
    await userEvent.click(readBtn)

    await screen.findByText(/Book contents here/)

    const proxyCall = calledUrls.find(u => u.includes('allorigins.win'))
    expect(proxyCall).toContain(
      encodeURIComponent('https://www.gutenberg.org/cache/epub/1/pg1.txt.utf-8')
    )
  })

  test('shows Loading spinner while proxy fetch is in-flight', async () => {
    const { resolveText } = makeBookshelfFetch('Final content', true)

    render(<DiscoveryHub />)

    const readBtn = await screen.findByRole('button', { name: /read my test book/i })
    await userEvent.click(readBtn)

    // Spinner (with its aria-label) must be visible before the fetch resolves
    expect(
      screen.getByLabelText('Loading book content')
    ).toBeInTheDocument()

    // Resolve the delayed fetch and verify spinner disappears
    await act(async () => { resolveText() })
    await waitFor(() =>
      expect(screen.queryByLabelText('Loading book content')).not.toBeInTheDocument()
    )
    expect(screen.getByText(/Final content/)).toBeInTheDocument()
  })

  test('slices content to 2000 characters from data.contents', async () => {
    const longText = 'X'.repeat(5000)
    makeBookshelfFetch(longText)

    render(<DiscoveryHub />)

    const readBtn = await screen.findByRole('button', { name: /read my test book/i })
    await userEvent.click(readBtn)

    const article = await screen.findByRole('article', { name: /book text: my test book/i })
    expect(article.textContent).toHaveLength(2000)
    expect(article.textContent).toBe('X'.repeat(2000))
  })
})
