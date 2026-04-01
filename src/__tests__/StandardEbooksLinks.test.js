// src/__tests__/StandardEbooksLinks.test.js
// Integration tests: verifies that the hardcoded Standard Ebooks classic book
// URLs return an HTTP 200 OK status, and that the classics data is correctly shaped.
//
// These tests guard against broken / renamed Standard Ebooks URLs sneaking into
// the codebase undetected.  When the test environment has network access the
// requests are made for real; on isolated machines the shape checks still run.

import { STANDARD_EBOOKS_CLASSICS } from '../content/StandardEbooksClassics'

// ---------------------------------------------------------------------------
// Shape / static checks (always run, no network needed)
// ---------------------------------------------------------------------------
describe('STANDARD_EBOOKS_CLASSICS data', () => {
  test('exports at least 8 books', () => {
    expect(STANDARD_EBOOKS_CLASSICS.length).toBeGreaterThanOrEqual(8)
  })

  test('every book has the required fields', () => {
    for (const book of STANDARD_EBOOKS_CLASSICS) {
      expect(typeof book.id).toBe('string')
      expect(book.id.length).toBeGreaterThan(0)
      expect(typeof book.title).toBe('string')
      expect(typeof book.author).toBe('string')
      expect(typeof book.url).toBe('string')
      expect(typeof book.epubUrl).toBe('string')
    }
  })

  test('all book page URLs use the standardebooks.org domain', () => {
    for (const book of STANDARD_EBOOKS_CLASSICS) {
      expect(new URL(book.url).hostname).toBe('standardebooks.org')
    }
  })

  test('all EPUB URLs use the standardebooks.org domain', () => {
    for (const book of STANDARD_EBOOKS_CLASSICS) {
      expect(new URL(book.epubUrl).hostname).toBe('standardebooks.org')
    }
  })

  test('all book page URLs use HTTPS', () => {
    for (const book of STANDARD_EBOOKS_CLASSICS) {
      expect(new URL(book.url).protocol).toBe('https:')
    }
  })

  test('contains Peter and Wendy', () => {
    const book = STANDARD_EBOOKS_CLASSICS.find(b => b.id === 'peter-and-wendy')
    expect(book).toBeDefined()
    expect(book.url).toBe(
      'https://standardebooks.org/ebooks/j-m-barrie/peter-and-wendy'
    )
  })

  test('contains The Secret Garden', () => {
    const book = STANDARD_EBOOKS_CLASSICS.find(b => b.id === 'secret-garden')
    expect(book).toBeDefined()
    expect(book.url).toContain('standardebooks.org')
  })

  test("contains Aesop's Fables", () => {
    const book = STANDARD_EBOOKS_CLASSICS.find(b => b.id === 'aesops-fables')
    expect(book).toBeDefined()
    expect(book.url).toBe(
      'https://standardebooks.org/ebooks/aesop/fables/v-s-vernon-jones'
    )
  })

  test("contains Alice's Adventures in Wonderland", () => {
    const book = STANDARD_EBOOKS_CLASSICS.find(b => b.id === 'alice-wonderland')
    expect(book).toBeDefined()
    expect(book.url).toContain('standardebooks.org')
  })

  test('contains The Wonderful Wizard of Oz', () => {
    const book = STANDARD_EBOOKS_CLASSICS.find(b => b.id === 'wizard-of-oz')
    expect(book).toBeDefined()
    expect(book.url).toContain('standardebooks.org')
  })

  test('contains The Jungle Book', () => {
    const book = STANDARD_EBOOKS_CLASSICS.find(b => b.id === 'jungle-book')
    expect(book).toBeDefined()
    expect(book.url).toBe('https://standardebooks.org/ebooks/rudyard-kipling/the-jungle-book')
  })

  test('contains Black Beauty', () => {
    const book = STANDARD_EBOOKS_CLASSICS.find(b => b.id === 'black-beauty')
    expect(book).toBeDefined()
    expect(book.url).toBe('https://standardebooks.org/ebooks/anna-sewell/black-beauty')
  })

  test('contains Treasure Island', () => {
    const book = STANDARD_EBOOKS_CLASSICS.find(b => b.id === 'treasure-island')
    expect(book).toBeDefined()
    expect(book.url).toBe('https://standardebooks.org/ebooks/robert-louis-stevenson/treasure-island')
  })
})

// ---------------------------------------------------------------------------
// HTTP 200 integration checks (network required)
// ---------------------------------------------------------------------------
describe('Standard Ebooks links return HTTP 200', () => {
  const TIMEOUT_MS = 5_000

  for (const book of STANDARD_EBOOKS_CLASSICS) {
    test(
      `${book.title} page returns 200 OK`,
      async (ctx) => {
        let response
        try {
          response = await fetch(book.url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(TIMEOUT_MS),
          })
        } catch {
          // Network unavailable in this environment – mark as skipped rather than passing
          ctx.skip()
          return
        }
        expect(response.status).toBe(200)
      },
      TIMEOUT_MS + 2000
    )
  }
})
