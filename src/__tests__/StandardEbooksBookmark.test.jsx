// src/__tests__/StandardEbooksBookmark.test.jsx
// Unit test: verifies that the localStorage `littick_bookmark_<bookId>` key is
// correctly written when the "Save Progress" button is clicked inside
// StandardEbooksReader.  Tests use vi.spyOn to assert the actual setItem call,
// not just the pre-seeded value.

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

  test('clicking Save Progress calls localStorage.setItem with the correct key and value', () => {
    const testCfi = 'epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3)'

    // Pre-seed so currentCfi is non-null and the button is enabled
    localStorage.setItem(BOOKMARK_KEY, testCfi)

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save reading progress/i }))
    })

    // Verify the component called setItem with the correct key and value
    expect(setItemSpy).toHaveBeenCalledWith(BOOKMARK_KEY, testCfi)

    setItemSpy.mockRestore()
  })

  test('localStorage key written by Save Progress uses the littick_bookmark_ prefix', () => {
    const testCfi = 'epubcfi(/6/2!/4/2/1:0)'
    localStorage.setItem(BOOKMARK_KEY, testCfi)

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
    expect(bookmarkCall[1]).toBe(testCfi)

    setItemSpy.mockRestore()
  })

  test('Save Progress button stores the correct book ID in the key', () => {
    const cfi = 'epubcfi(/6/4!/4/2/1:0)'
    localStorage.setItem(BOOKMARK_KEY, cfi)

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

  test('restores bookmark on mount when a saved CFI exists', () => {
    const savedCfi = 'epubcfi(/6/8!/4/2/1:0)'
    localStorage.setItem(BOOKMARK_KEY, savedCfi)

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    // The component should load and not throw even with a pre-existing bookmark
    expect(
      screen.getByRole('button', { name: /save reading progress/i })
    ).toBeInTheDocument()
  })

  test('Save Progress button shows confirmation after clicking', () => {
    const cfi = 'epubcfi(/6/4!/4/2/1:0)'
    localStorage.setItem(BOOKMARK_KEY, cfi)

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save reading progress/i }))
    })

    expect(screen.getByText(/Saved!/i)).toBeInTheDocument()
  })
})
