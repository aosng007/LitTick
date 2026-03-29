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
        `${TEST_BOOK.url}/text/single-page`
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
})
