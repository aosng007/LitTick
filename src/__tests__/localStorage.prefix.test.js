// src/__tests__/localStorage.prefix.test.js
import { readFileSync } from 'fs'
import { glob } from 'glob'

test('all localStorage.setItem calls use the littick_ prefix', async () => {
  const files = await glob('src/**/*.{js,jsx}')
  const badCalls = []

  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    // Find every setItem call and capture the key argument
    const matches = [...src.matchAll(/localStorage\.setItem\(\s*['"`]([^'"`]+)['"`]/g)]
    for (const [, key] of matches) {
      if (!key.startsWith('littick_')) {
        badCalls.push(`${file}: key="${key}"`)
      }
    }
  }

  expect(badCalls).toEqual([])
})
