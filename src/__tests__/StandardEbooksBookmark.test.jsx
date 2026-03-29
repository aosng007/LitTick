import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach, test, expect, describe } from 'vitest'
import StandardEbooksReader from '../components/StandardEbooksReader'

const TEST_BOOK = {
  id: 'alice-wonderland',
  title: "Alice's Adventures in Wonderland",
  author: 'Lewis Carroll',
  emoji: '🐇',
  coverColor: '#3D4F8B',
  url: 'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel',
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

  test('clicking Save Progress calls localStorage.setItem with the correct key', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    // Wait for the reading container to appear (fetch resolved)
    await waitFor(() => screen.getByTestId('reading-container'))

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save reading progress/i }))
    })

    // Verify the component called setItem with the correct key and a scroll-position string
    expect(setItemSpy).toHaveBeenCalledWith(BOOKMARK_KEY, expect.any(String))

    setItemSpy.mockRestore()
  })

  test('localStorage key written by Save Progress uses the littick_bookmark_ prefix', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => screen.getByTestId('reading-container'))

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

  test('Save Progress button stores the correct book ID in the key', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => screen.getByTestId('reading-container'))

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

  test('restores bookmark on mount by applying saved scroll position to container', async () => {
    const savedPosition = '250'
    localStorage.setItem(BOOKMARK_KEY, savedPosition)

    // jsdom does not implement real scrolling geometry, so intercept the setter
    let capturedScrollTop
    const originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop')
    Object.defineProperty(Element.prototype, 'scrollTop', {
      set(val) { capturedScrollTop = val },
      get() { return capturedScrollTop ?? 0 },
      configurable: true,
    })

    try {
      render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByTestId('reading-container')).toBeInTheDocument()
      })
      expect(capturedScrollTop).toBe(250)
    } finally {
      // Always restore the original descriptor even if assertions fail
      Object.defineProperty(Element.prototype, 'scrollTop', originalDescriptor)
    }
  })

  test('Save Progress button shows confirmation after clicking', async () => {
    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => screen.getByTestId('reading-container'))

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save reading progress/i }))
    })

    expect(screen.getByText(/Saved!/i)).toBeInTheDocument()
  })
})
