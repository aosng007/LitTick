// src/__tests__/localStorage.prefix.test.js
import { readFileSync } from 'fs'
import { glob } from 'glob'

test('all localStorage.setItem calls use the littick_ prefix', async () => {
  const files = await glob('src/**/*.{js,jsx}')
  const badCalls = []

  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    // Find every setItem call and capture the first argument expression
    const matches = [...src.matchAll(/localStorage\.setItem\(\s*([^,)\n]+)/g)]
    for (const [, rawArg] of matches) {
      const arg = rawArg.trim()
      // Only keys that clearly start with a quoted/backticked "littick_" prefix are allowed
      if (!/^['"`]littick_/.test(arg)) {
        badCalls.push(`${file}: key expression="${arg}"`)
      }
    }
  }

  expect(badCalls).toEqual([])
})
