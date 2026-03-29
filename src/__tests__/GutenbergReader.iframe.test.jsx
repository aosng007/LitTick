// src/__tests__/GutenbergReader.iframe.test.jsx
// Updated: now tests the Standard Ebooks Classic Bookshelf (DiscoveryHub) which
// replaced the old Project Gutenberg iframe reader.
//
// These tests verify:
//   1. The Standard Ebooks bookshelf renders the 5 hardcoded classics.
//   2. Clicking a book card opens the StandardEbooksReader (not a raw external iframe).
//   3. The reader shows the correct book title and author.
//   4. No request is made to the old Gutenberg proxy (allorigins.win or gutendex.com).
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import DiscoveryHub from '../components/DiscoveryHub'

// Mock epubjs to prevent it attempting to load real EPUB files in jsdom
vi.mock('epubjs', () => {
  const mockRendition = {
    on: vi.fn(),
    display: vi.fn(() => Promise.resolve()),
    destroy: vi.fn(),
  }
  return {
    default: vi.fn(() => ({
      renderTo: vi.fn(() => mockRendition),
      ready: Promise.resolve(),
      destroy: vi.fn(),
    })),
  }
})

describe('StandardEbooksShelf (replaces Gutenberg reader)', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })
  test('renders the Classic Bookshelf section heading', () => {
    render(<DiscoveryHub />)
    expect(screen.getByText('Classic Bookshelf')).toBeInTheDocument()
  })

  test('renders all 5 Standard Ebooks classics', () => {
    render(<DiscoveryHub />)
    expect(screen.getByRole('button', { name: /Read Peter and Wendy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Read The Secret Garden/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Read Aesop's Fables/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Read Alice's Adventures in Wonderland/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Read The Wonderful Wizard of Oz/i })).toBeInTheDocument()
  })

  test('clicking a book card opens the StandardEbooksReader with correct title', () => {
    render(<DiscoveryHub />)

    const readBtn = screen.getByRole('button', { name: /Read Peter and Wendy/i })
    fireEvent.click(readBtn)

    expect(screen.getByText('Peter and Wendy')).toBeInTheDocument()
    expect(screen.getByText('J. M. Barrie')).toBeInTheDocument()
  })

  test('opens reader without a raw gutenberg.org iframe', () => {
    render(<DiscoveryHub />)

    const readBtn = screen.getByRole('button', { name: /Read Peter and Wendy/i })
    fireEvent.click(readBtn)

    // There must be no iframe pointing to gutenberg.org
    const iframes = document.querySelectorAll('iframe')
    const gutenbergIframe = Array.from(iframes).find(f => {
      try { return new URL(f.src).hostname === 'www.gutenberg.org' } catch { return false }
    })
    expect(gutenbergIframe).toBeUndefined()
  })

  test('does not call gutendex.com or allorigins.win when a book is opened', async () => {
    const calledUrls = []
    global.fetch = (url) => {
      calledUrls.push(url)
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
    }

    render(<DiscoveryHub />)

    const readBtn = screen.getByRole('button', { name: /Read Peter and Wendy/i })
    fireEvent.click(readBtn)

    // No requests to old Gutenberg sources should be made
    const gutendexCall = calledUrls.find(u => {
      try { return new URL(u).hostname === 'gutendex.com' } catch { return false }
    })
    const proxyCall = calledUrls.find(u => {
      try { return new URL(u).hostname === 'allorigins.win' } catch { return false }
    })
    expect(gutendexCall).toBeUndefined()
    expect(proxyCall).toBeUndefined()
  })

  test('shows a Save Progress bookmark button in the reader', () => {
    render(<DiscoveryHub />)

    const readBtn = screen.getByRole('button', { name: /Read Peter and Wendy/i })
    fireEvent.click(readBtn)

    expect(
      screen.getByRole('button', { name: /save reading progress/i })
    ).toBeInTheDocument()
  })

  test('back button returns to the bookshelf from the reader', () => {
    render(<DiscoveryHub />)

    fireEvent.click(screen.getByRole('button', { name: /Read Peter and Wendy/i }))
    expect(screen.getByText('Peter and Wendy')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /back to bookshelf/i }))

    expect(screen.getByText('Classic Bookshelf')).toBeInTheDocument()
  })
})

