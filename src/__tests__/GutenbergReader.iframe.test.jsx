// src/__tests__/GutenbergReader.iframe.test.jsx
// Verifies that GutenbergReader uses a direct iframe embed for Gutenberg books
// instead of fetching content via a CORS proxy.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiscoveryHub from '../components/DiscoveryHub'

// Minimal gutendex-style results payload with one book
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

describe('GutenbergReader iframe embed behaviour', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = (url) => {
      if (new URL(url).hostname === 'gutendex.com') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(GUTENDEX_RESULTS) })
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
    }
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('renders an iframe with the Gutenberg ebook URL when a book is opened', async () => {
    render(<DiscoveryHub />)

    const readBtn = await screen.findByRole('button', { name: /read my test book/i })
    await userEvent.click(readBtn)

    const iframe = screen.getByTitle('My Test Book')
    expect(iframe.tagName).toBe('IFRAME')
    expect(iframe.getAttribute('src')).toBe('https://www.gutenberg.org/ebooks/1')
  })

  test('iframe src contains the correct Gutenberg book ID', async () => {
    render(<DiscoveryHub />)

    const readBtn = await screen.findByRole('button', { name: /read my test book/i })
    await userEvent.click(readBtn)

    const iframe = screen.getByTitle('My Test Book')
    expect(iframe.getAttribute('src')).toContain('/ebooks/1')
  })

  test('does not call allorigins.win proxy when a book is opened', async () => {
    const calledUrls = []
    global.fetch = (url) => {
      calledUrls.push(url)
      if (new URL(url).hostname === 'gutendex.com') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(GUTENDEX_RESULTS) })
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
    }

    render(<DiscoveryHub />)

    const readBtn = await screen.findByRole('button', { name: /read my test book/i })
    await userEvent.click(readBtn)

    const proxyCall = calledUrls.find(u => u.includes('allorigins.win'))
    expect(proxyCall).toBeUndefined()
  })

  test('shows book title and author in the reader header', async () => {
    render(<DiscoveryHub />)

    const readBtn = await screen.findByRole('button', { name: /read my test book/i })
    await userEvent.click(readBtn)

    expect(screen.getByText('My Test Book')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
  })
})
