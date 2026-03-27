// src/__tests__/Timer.naming.test.js
import { readFileSync } from 'fs'

test('Timer.jsx uses isTimerActive and not banned aliases', () => {
  const src = readFileSync('src/components/Timer.jsx', 'utf8')

  // Must declare isTimerActive
  expect(src).toMatch(/isTimerActive/)

  // Must NOT declare banned aliases as state variables (destructuring form)
  const banned = [/const \[isRunning,/, /const \[running,/, /const \[timerOn,/, /const \[active,/]
  for (const pattern of banned) {
    expect(src).not.toMatch(pattern)
  }
})
