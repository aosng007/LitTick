// src/__tests__/DiscoveryHub.dictionary.test.jsx
// Tests: word-selection dictionary popover in Discovery Hub's NatureReadingView
// and StandardEbooksReader reading container.

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'
import DiscoveryHub from '../components/DiscoveryHub'

const KOALA_STORY_BUTTON_RE = /Read story: Koalas/i

describe('DiscoveryHub – NatureReadingView dictionary popover', () => {
  let originalFetch
  let originalGetSelection

  beforeEach(() => {
    originalFetch = global.fetch
    originalGetSelection = window.getSelection

    // Stub fetch: RSS feed fails → fallback nature stories; dictionary API
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string' && url.includes('dictionaryapi.dev')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                word: 'koala',
                phonetic: '/koʊˈɑːlə/',
                phonetics: [],
                meanings: [
                  {
                    partOfSpeech: 'noun',
                    definitions: [
                      {
                        definition:
                          'A small bear-like marsupial with thick grey fur native to Australia that lives in eucalyptus trees.',
                      },
                    ],
                  },
                ],
              },
            ]),
        })
      }
      // RSS/news fail → triggers fallback local stories
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    window.getSelection = originalGetSelection
    vi.clearAllMocks()
  })

  test('selecting a word in the nature story text triggers the dictionary popover', async () => {
    render(<DiscoveryHub />)

    // Wait for fallback stories to load and click the Koalas story
    const koalaBtn = await screen.findByRole('button', { name: KOALA_STORY_BUTTON_RE })
    fireEvent.click(koalaBtn)

    // Now in NatureReadingView – the story article should be visible
    expect(screen.getByRole('article')).toBeInTheDocument()

    // Simulate the user selecting the word "koala" by setting window.getSelection
    window.getSelection = vi.fn(() => ({ toString: () => 'koala' }))

    // Fire mouseup on the article container
    fireEvent.mouseUp(screen.getByRole('article'))

    // The dictionary popover should appear
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /definition of koala/i })).toBeInTheDocument()
    })
  })

  test('popover is not shown when selection is empty', async () => {
    render(<DiscoveryHub />)

    const koalaBtn = await screen.findByRole('button', { name: KOALA_STORY_BUTTON_RE })
    fireEvent.click(koalaBtn)

    // Empty selection → no popover
    window.getSelection = vi.fn(() => ({ toString: () => '' }))
    fireEvent.mouseUp(screen.getByRole('article'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('popover is not shown when selection contains spaces (multi-word)', async () => {
    render(<DiscoveryHub />)

    const koalaBtn = await screen.findByRole('button', { name: KOALA_STORY_BUTTON_RE })
    fireEvent.click(koalaBtn)

    // Multi-word selection → no popover
    window.getSelection = vi.fn(() => ({ toString: () => 'grey fur' }))
    fireEvent.mouseUp(screen.getByRole('article'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('definition is truncated to 10 words for Year 2 readers', async () => {
    render(<DiscoveryHub />)

    const koalaBtn = await screen.findByRole('button', { name: KOALA_STORY_BUTTON_RE })
    fireEvent.click(koalaBtn)

    window.getSelection = vi.fn(() => ({ toString: () => 'koala' }))
    fireEvent.mouseUp(screen.getByRole('article'))

    // Wait for the popover content to load
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /definition of koala/i })).toBeInTheDocument()
    })

    // Full definition is 18 words; should be truncated to 10 words + ellipsis
    const popover = screen.getByRole('dialog', { name: /definition of koala/i })
    const fullDef = 'A small bear-like marsupial with thick grey fur native to Australia that lives in eucalyptus trees.'
    const truncated = 'A small bear-like marsupial with thick grey fur native to…'
    expect(popover).not.toHaveTextContent(fullDef)
    expect(popover).toHaveTextContent(truncated)
  })

  test('popover can be closed with the close button', async () => {
    render(<DiscoveryHub />)

    const koalaBtn = await screen.findByRole('button', { name: KOALA_STORY_BUTTON_RE })
    fireEvent.click(koalaBtn)

    window.getSelection = vi.fn(() => ({ toString: () => 'koala' }))
    fireEvent.mouseUp(screen.getByRole('article'))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /definition of koala/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /close definition/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
