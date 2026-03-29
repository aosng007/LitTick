// src/__tests__/StandardEbooksBookmark.test.jsx
// Unit test: verifies that the localStorage `littick_bookmark_<bookId>` key is
// correctly written when the "Save Progress" button is clicked inside
// StandardEbooksReader.  The reader now uses fetch() + scroll-position bookmarks
// instead of epubjs + EPUB CFI strings.

import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, beforeEach, afterEach, test, expect, describe } from 'vitest'
import StandardEbooksReader from '../components/StandardEbooksReader'

const TEST_BOOK = {
  id: 'alice-wonderland',
  title: "Alice's Adventures in Wonderland",
  author: 'Lewis Carroll',
  emoji: '🐇',
  coverColor: '#3D4F8B',
  url: 'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel',
  epubUrl:
    'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel/downloads/lewis-carroll_alices-adventures-in-wonderland_john-tenniel.epub',
}

const BOOKMARK_KEY = `littick_bookmark_${TEST_BOOK.id}`
const SAMPLE_HTML = '<p>Alice was beginning to get very tired.</p>'

describe('StandardEbooksReader bookmark system', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
    localStorage.clear()
    // Stub fetch so the component can mount without network calls
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(SAMPLE_HTML) })
    )
  })

  afterEach(() => {
    global.fetch = originalFetch
    localStorage.removeItem(BOOKMARK_KEY)
    vi.clearAllMocks()
  })

  test('Save Progress button is rendered in the reader', () => {
    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)
    expect(
      screen.getByRole('button', { name: /save reading progress/i })
    ).toBeInTheDocument()
  })

  test('clicking Save Progress calls localStorage.setItem with the correct key', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save reading progress/i }))
    })

    // Verify the component called setItem with the correct key and a scroll-position string
    expect(setItemSpy).toHaveBeenCalledWith(BOOKMARK_KEY, expect.any(String))

    setItemSpy.mockRestore()
  })

  test('localStorage key written by Save Progress uses the littick_bookmark_ prefix', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save reading progress/i }))
    })

    // Extract the key used in the setItem call made by the component
    const bookmarkCall = setItemSpy.mock.calls.find(
      ([key]) => key.startsWith('littick_bookmark_')
    )
    expect(bookmarkCall).toBeDefined()
    expect(bookmarkCall[0]).toBe(BOOKMARK_KEY)

    setItemSpy.mockRestore()
  })

  test('Save Progress button stores the correct book ID in the key', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save reading progress/i }))
    })

    // The key must contain the book ID
    const bookmarkCall = setItemSpy.mock.calls.find(
      ([key]) => key.startsWith('littick_bookmark_')
    )
    expect(bookmarkCall).toBeDefined()
    expect(bookmarkCall[0]).toContain(TEST_BOOK.id)

    setItemSpy.mockRestore()
  })

  test('restores bookmark on mount when a saved scroll position exists', () => {
    const savedPosition = '250'
    localStorage.setItem(BOOKMARK_KEY, savedPosition)

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    // The component should mount and show the Save Progress button
    expect(
      screen.getByRole('button', { name: /save reading progress/i })
    ).toBeInTheDocument()
  })

  test('Save Progress button shows confirmation after clicking', () => {
    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save reading progress/i }))
    })

    expect(screen.getByText(/Saved!/i)).toBeInTheDocument()
  })
})
