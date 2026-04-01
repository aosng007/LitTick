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
    // Stub requestAnimationFrame with a counter+map so multiple concurrent schedule
    // calls are tracked correctly (matches browser API contract)
    let rafIdCounter = 0
    const pendingRafs = new Map()
    const originalRaf = global.requestAnimationFrame
    const originalCaf = global.cancelAnimationFrame
    global.requestAnimationFrame = (cb) => {
      const id = ++rafIdCounter
      pendingRafs.set(id, cb)
      return id
    }
    global.cancelAnimationFrame = (id) => { pendingRafs.delete(id) }

    // Helper to flush all pending rAF callbacks
    const flushRafs = () => {
      const cbs = [...pendingRafs.values()]
      pendingRafs.clear()
      cbs.forEach(cb => cb())
    }

    // Start geometry at 0 so initial sync computes 0% — no new saveProgress write
    let scrollTopVal = 0
    const originalDescs = {}
    for (const prop of ['scrollTop', 'scrollHeight', 'clientHeight']) {
      originalDescs[prop] = Object.getOwnPropertyDescriptor(Element.prototype, prop)
    }
    Object.defineProperty(Element.prototype, 'scrollTop', {
      get() { return scrollTopVal },
      set(v) { scrollTopVal = v },
      configurable: true,
    })
    Object.defineProperty(Element.prototype, 'scrollHeight', { get() { return 600 }, configurable: true })
    Object.defineProperty(Element.prototype, 'clientHeight', { get() { return 300 }, configurable: true })

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    try {
      render(<StandardEbooksReader book={TEST_BOOK} onBack={vi.fn()} />)
      await waitFor(() => screen.getByTestId('reading-container'))

      // Flush any pending rAF from post-mount effects
      act(() => { flushRafs() })

      // Record progress writes before the scroll
      const callsBefore = setItemSpy.mock.calls.filter(
        ([key]) => key === `littick_progress_${TEST_BOOK.id}`
      ).length

      // Simulate scrolling to 50%: 150px into a 300px scrollable area
      scrollTopVal = 150
      act(() => {
        fireEvent.scroll(screen.getByTestId('reading-container'))
        flushRafs() // flush the rAF callback registered by the scroll handler
      })

      const progressCalls = setItemSpy.mock.calls.filter(
        ([key]) => key === `littick_progress_${TEST_BOOK.id}`
      )
      expect(progressCalls.length).toBeGreaterThan(callsBefore)
      const lastCall = progressCalls[progressCalls.length - 1]
      expect(parseInt(lastCall[1], 10)).toBe(50) // 150/(600-300)*100 = 50%
    } finally {
      for (const prop of Object.keys(originalDescs)) {
        if (originalDescs[prop]) Object.defineProperty(Element.prototype, prop, originalDescs[prop])
      }
      setItemSpy.mockRestore()
      global.requestAnimationFrame = originalRaf
      global.cancelAnimationFrame = originalCaf
    }
  })
})
