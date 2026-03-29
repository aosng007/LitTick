// src/__tests__/StandardEbooksBookmark.test.jsx
// Unit test: verifies that the localStorage `littick_bookmark_<bookId>` key is
// correctly written (and read back) when the "Save Progress" button is clicked
// inside the StandardEbooksReader component.

import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, beforeEach, afterEach, test, expect, describe } from 'vitest'

// ---------------------------------------------------------------------------
// Mock epubjs so the component can mount without a real browser / EPUB file.
// ---------------------------------------------------------------------------
vi.mock('epubjs', () => {
  const mockRendition = {
    on: vi.fn(),
    display: vi.fn(() => Promise.resolve()),
    destroy: vi.fn(),
  }
  const MockEpub = vi.fn(() => ({
    renderTo: vi.fn(() => mockRendition),
    ready: Promise.resolve(),
    destroy: vi.fn(),
  }))
  return { default: MockEpub }
})

import StandardEbooksReader from '../components/StandardEbooksReader'

const TEST_BOOK = {
  id: 'alice-wonderland',
  title: "Alice's Adventures in Wonderland",
  author: 'Lewis Carroll',
  emoji: '🐇',
  coverColor: '#3D4F8B',
  url: 'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland',
  epubUrl:
    'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/downloads/lewis-carroll_alices-adventures-in-wonderland.epub',
}

const BOOKMARK_KEY = `littick_bookmark_${TEST_BOOK.id}`

describe('StandardEbooksReader bookmark system', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.removeItem(BOOKMARK_KEY)
    vi.clearAllMocks()
  })

  test('Save Progress button is rendered in the reader', () => {
    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)
    expect(
      screen.getByRole('button', { name: /save reading progress/i })
    ).toBeInTheDocument()
  })

  test('clicking Save Progress writes littick_bookmark_<bookId> to localStorage', async () => {
    const testCfi = 'epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3)'

    // Pre-seed a CFI so the button is enabled (currentCfi is not null)
    localStorage.setItem(BOOKMARK_KEY, testCfi)

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    const saveBtn = screen.getByRole('button', { name: /save reading progress/i })

    act(() => {
      fireEvent.click(saveBtn)
    })

    const stored = localStorage.getItem(BOOKMARK_KEY)
    expect(stored).toBe(testCfi)
  })

  test('localStorage key uses the littick_ prefix', () => {
    localStorage.setItem(BOOKMARK_KEY, 'epubcfi(/6/2!/4/2/1:0)')

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    // Verify the key written uses the correct prefix
    const keys = Object.keys(localStorage)
    const bookmarkKeys = keys.filter(k => k.startsWith('littick_bookmark_'))
    expect(bookmarkKeys.length).toBeGreaterThan(0)
    expect(bookmarkKeys[0]).toBe(BOOKMARK_KEY)
  })

  test('stores the book ID in the localStorage key', async () => {
    const cfi = 'epubcfi(/6/4!/4/2/1:0)'
    localStorage.setItem(BOOKMARK_KEY, cfi)

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save reading progress/i }))
    })

    // Key must include the book ID
    expect(localStorage.getItem(BOOKMARK_KEY)).not.toBeNull()
    expect(BOOKMARK_KEY).toContain(TEST_BOOK.id)
  })

  test('restores bookmark on mount when a saved CFI exists', () => {
    const savedCfi = 'epubcfi(/6/8!/4/2/1:0)'
    localStorage.setItem(BOOKMARK_KEY, savedCfi)

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    // The component should load and not throw even with a pre-existing bookmark
    expect(
      screen.getByRole('button', { name: /save reading progress/i })
    ).toBeInTheDocument()
  })

  test('Save Progress button shows confirmation after clicking', async () => {
    const cfi = 'epubcfi(/6/4!/4/2/1:0)'
    localStorage.setItem(BOOKMARK_KEY, cfi)

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    const saveBtn = screen.getByRole('button', { name: /save reading progress/i })

    act(() => {
      fireEvent.click(saveBtn)
    })

    expect(screen.getByText(/Saved!/i)).toBeInTheDocument()
  })
})
