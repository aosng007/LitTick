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
    localStorage.removeItem(`littick_progress_${TEST_BOOK.id}`)
    localStorage.removeItem('littick_last_book')
    localStorage.removeItem('littick_completed_books')
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

  test('sets littick_last_book in localStorage on mount', async () => {
    render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)

    await waitFor(() => screen.getByTestId('reading-container'))

    expect(localStorage.getItem('littick_last_book')).toBe(TEST_BOOK.id)
  })

  test('saves littick_progress_ to localStorage when scroll position changes', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    // Mock scrollable container geometry so computeAndSyncProgress detects a non-zero %
    const mockValues = { scrollTop: 150, scrollHeight: 600, clientHeight: 300 }
    const originalDescriptors = {}
    for (const prop of Object.keys(mockValues)) {
      originalDescriptors[prop] = Object.getOwnPropertyDescriptor(Element.prototype, prop)
      Object.defineProperty(Element.prototype, prop, {
        get() { return mockValues[prop] },
        set(v) { mockValues.scrollTop = v },
        configurable: true,
      })
    }

    try {
      render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)
      await waitFor(() => screen.getByTestId('reading-container'))

      const container = screen.getByTestId('reading-container')

      await act(async () => {
        fireEvent.scroll(container)
        // Allow the rAF callback to flush in jsdom
        await new Promise(r => setTimeout(r, 50))
      })

      const progressCall = setItemSpy.mock.calls.find(
        ([key]) => key === `littick_progress_${TEST_BOOK.id}`
      )
      expect(progressCall).toBeDefined()
      expect(Number.isFinite(parseInt(progressCall[1], 10))).toBe(true)
    } finally {
      for (const prop of Object.keys(mockValues)) {
        if (originalDescriptors[prop]) {
          Object.defineProperty(Element.prototype, prop, originalDescriptors[prop])
        }
      }
      setItemSpy.mockRestore()
    }
  })
})
