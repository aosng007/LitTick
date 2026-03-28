// src/__tests__/localStorage.prefix.test.js
import { readFileSync } from 'fs'
import { glob } from 'glob'

test('all localStorage.setItem calls use the littick_ prefix', async () => {
  const files = await glob('src/**/*.{js,jsx}')
  const badCalls = []

  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    // Build a map of simple string constants defined in this file:
    //   const SOME_KEY = 'littick_example'
    const constKeyMap = new Map()
    for (const [, name, value] of src.matchAll(
      /const\s+([A-Z0-9_]+)\s*=\s*['"`]([^'"`]+)['"`]/g
    )) {
      constKeyMap.set(name, value)
    }

    // Check setItem calls with a string literal key
    const literalMatches = [...src.matchAll(/localStorage\.setItem\(\s*['"`]([^'"`]+)['"`]/g)]
    for (const [, key] of literalMatches) {
      if (!key.startsWith('littick_')) {
        badCalls.push(`${file}: key="${key}"`)
      }
    }

    // Check setItem calls that use a named constant as the key, e.g.:
    //   localStorage.setItem(SOME_KEY, value)
    // Require a comma after the identifier to confirm it is the key argument.
    const identifierMatches = [...src.matchAll(/localStorage\.setItem\(\s*([A-Z0-9_]+)\s*,/g)]
    for (const [, identifier] of identifierMatches) {
      if (!constKeyMap.has(identifier)) {
        // Unknown or non-string constant – skip to avoid false positives
        continue
      }
      const key = constKeyMap.get(identifier)
      if (!key.startsWith('littick_')) {
        badCalls.push(`${file}: key constant ${identifier}="${key}"`)
      }
    }
  }

  expect(badCalls).toEqual([])
})
