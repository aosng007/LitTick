# LitTick – Technical Constitution

> **[Bruce] Bruce is online! I'm setting the ground rules to keep this project bug-free.**
>
> This document is the single source of truth for Developer Joey (Agent A) and Developer Matilda (Agent B). All code merged into `main` **must** conform to the standards below. Any deviation is a merge-blocker.

---

## 1. LocalStorage Schema

All keys written to `localStorage` **must** use the `littick_` prefix. Using any other prefix (e.g. the legacy `koalaread-` prefix) is forbidden in new code.

| Key | Type | Description |
|-----|------|-------------|
| `littick_selected_story` | `string` | ID of the story currently selected by the user (e.g. `"koala"`, `"space"`, `"magic"`). |
| `littick_unlocked_stories` | `JSON string → string[]` | Array of story IDs for which the 15-minute timer has been completed (e.g. `["koala","space"]`). |
| `littick_timer_state` | `JSON string → object` | Persisted timer snapshot: `{ secondsLeft: number, hasFinished: boolean, isTimerActive: boolean, lastSavedAt: number \| null }`. `lastSavedAt` is the `Date.now()` value at the time of the last save; used to fast-forward elapsed time on page reload. |
| `littick_checklist_<storyId>` | `JSON string → object` | Five Finger Retell state for a specific story: `{ checked: Record<string,boolean>, notes: Record<string,string> }`. `<storyId>` is replaced by the story ID (e.g. `littick_checklist_koala`). |
| `littick_user_badges` | `JSON string → string[]` | Array of badge identifiers earned by the user (e.g. `["reading_star","puzzle_master"]`). |
| `littick_bookmark_<bookId>` | `string` | EPUB CFI location string saved by the "Save Progress" button in the Standard Ebooks reader. `<bookId>` is the book's unique `id` field (e.g. `littick_bookmark_alice-wonderland`). |

### Rules

1. Always wrap `localStorage` access in a `try/catch` block to handle `SecurityError` (private browsing mode).
2. Always validate the parsed value with `Array.isArray()` or a type-guard before using it.
3. Never store sensitive data (PII, authentication tokens) in `localStorage`.
4. Keys not listed in this table must be proposed and approved before implementation.

---

## 2. Shared Variable Names

All developers **must** use the exact variable/state names defined here. Aliases (e.g. `running`, `timerOn`, `active`) are forbidden and will be rejected in code review.

### Global / App-level state (`App.jsx`)

| State variable | Type | Setter | Description |
|----------------|------|--------|-------------|
| `selectedStory` | `object \| null` | `setSelectedStory` | The story object currently loaded. `null` means the selection screen is shown. |
| `activeTab` | `'read' \| 'timer' \| 'retell' \| 'puzzle' \| 'discover'` | `setActiveTab` | Currently visible tab in the reading interface. |
| `puzzleUnlocked` | `boolean` | `setPuzzleUnlocked` | Whether the Word Search puzzle is accessible for the current story. |

### Timer state (`Timer.jsx`)

| State variable | Type | Setter | Description |
|----------------|------|--------|-------------|
| `secondsLeft` | `number` | `setSecondsLeft` | Remaining seconds in the countdown (0 – 900). |
| `isTimerActive` | `boolean` | `setIsTimerActive` | `true` while the timer is actively counting down. Use this name — **not** `isRunning`, `running`, or `timerOn`. |
| `hasFinished` | `boolean` | `setHasFinished` | `true` once the countdown reaches zero for the current session. |
| `showBadge` | `boolean` | `setShowBadge` | Controls visibility of the reward badge overlay. |

### Checklist state (`Checklist.jsx`)

| State variable | Type | Setter | Description |
|----------------|------|--------|-------------|
| `checked` | `Record<string, boolean>` | `setChecked` | Map of finger ID → checked state. |
| `notes` | `Record<string, string>` | `setNotes` | Map of finger ID → user-written note text. |
| `expanded` | `Record<string, boolean>` | `setExpanded` | Map of finger ID → expanded/collapsed state. |

### Puzzle state (`PuzzleGame.jsx`)

| State variable | Type | Setter | Description |
|----------------|------|--------|-------------|
| `selecting` | `boolean` | `setSelecting` | `true` while the user is dragging a selection. |
| `selection` | `[number, number][]` | `setSelection` | Ordered list of `[row, col]` pairs in the current drag path. |
| `foundWords` | `Set<string>` | `setFoundWords` | Uppercased words that have been successfully located. |
| `allFound` | `boolean` | `setAllFound` | `true` once every keyword has been found. |

### Constants

| Constant | Value | File | Description |
|----------|-------|------|-------------|
| `TOTAL_SECONDS` | `900` (15 × 60) | `Timer.jsx` | Total countdown duration in seconds. Do not hardcode `900` anywhere else. |
| `GRID_SIZE` | `12` | `PuzzleGame.jsx` | Word-search grid dimension. |
| `TABS` | (array) | `App.jsx` | Tab descriptor array — do not duplicate inline. |

---

## 3. Pre-Merge Test Plan

The following **5 automated tests** must pass on every pull request before merging into `main`. They guard against the "Blank Page" bug (missing/undefined state causing a white screen) and logic clashes between Joey and Matilda's work.

### Test 1 – App renders without crashing (Blank Page guard)

**What it tests:** The root `<App />` component mounts and renders at least one DOM node with no uncaught exceptions.

**Why it matters:** Any import error, undefined prop, or top-level `throw` in `App.jsx`, `Timer.jsx`, `Checklist.jsx`, or `PuzzleGame.jsx` will produce a blank page. This is the primary regression gate.

```js
// src/__tests__/App.smoke.test.jsx
import { render, screen } from '@testing-library/react'
import App from '../App'

test('App renders without crashing', () => {
  render(<App />)
  // The story-selection header must be visible
  expect(screen.getByRole('heading', { name: /LitTick|KoalaRead/i })).toBeInTheDocument()
})
```

---

### Test 2 – LocalStorage keys use the `littick_` prefix

**What it tests:** Every `localStorage.setItem` call in the source uses a key that starts with `littick_`. This prevents the `koalaread-` (legacy) prefix from sneaking back in, which caused key collisions in a previous sprint.

**Why it matters:** Mixed prefixes silently break state restoration (story selection, unlock state, checklist progress) without throwing any visible error.

```js
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
```

---

### Test 3 – Timer uses `isTimerActive` (not banned aliases)

**What it tests:** `Timer.jsx` declares the running-state variable as `isTimerActive` and does not use any of the banned aliases (`isRunning`, `running`, `timerOn`, `active`).

**Why it matters:** Joey and Matilda have historically used different names for the same boolean, causing the timer's pause/resume logic to silently diverge and produce double-counting bugs.

```js
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
```

---

### Test 4 – Puzzle tab is locked before timer completes

**What it tests:** On first load the Puzzle tab is disabled, and clicking it has no effect (tab does not change).

**Why it matters:** Early access to the puzzle before the full 15-minute read breaks the app's engagement loop and causes `PuzzleGame` to render with an empty `keywords` array, which previously produced a blank puzzle panel.

```js
// src/__tests__/PuzzleGame.lock.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

test('Puzzle tab is locked before timer completes', async () => {
  render(<App />)

  // Pick the first story
  const storyButtons = screen.getAllByRole('button')
  fireEvent.click(storyButtons[0])

  // The Puzzle tab button must exist but be disabled
  const puzzleTab = screen.getByRole('tab', { name: /puzzle/i })
  expect(puzzleTab).toBeDisabled()

  // Clicking the disabled tab must NOT switch the active panel
  fireEvent.click(puzzleTab)
  expect(screen.queryByRole('grid')).not.toBeInTheDocument()
})
```

---

### Test 5 – Checklist persists and restores state via `littick_checklist_<storyId>`

**What it tests:** Checking a retell item writes `littick_checklist_<storyId>` to `localStorage`, and re-mounting the component restores the checked state from that key.

**Why it matters:** If the storage key drifts (e.g. back to `koalaread-checklist-`), the checklist silently resets on every page reload, destroying user progress without any visible error — the classic "works on my machine" data loss bug.

```js
// src/__tests__/Checklist.persistence.test.jsx
import { render, screen, fireEvent, act } from '@testing-library/react'
import Checklist from '../components/Checklist'

test('Checklist saves and restores state using littick_ prefix', () => {
  const storyId = 'test-story'
  const expectedKey = `littick_checklist_${storyId}`

  const { unmount } = render(<Checklist storyId={storyId} />)

  // Tick the first checkbox (Characters)
  const checkboxes = screen.getAllByRole('button', { name: /mark/i })
  act(() => { fireEvent.click(checkboxes[0]) })

  // Confirm the key written to localStorage uses the correct prefix
  const stored = JSON.parse(localStorage.getItem(expectedKey) || '{}')
  expect(stored.checked?.characters).toBe(true)

  // Re-mount and confirm checked state is visually restored (button aria-label reflects "incomplete" → already checked)
  unmount()
  render(<Checklist storyId={storyId} />)

  // The re-mounted storage value must still reflect the checked item
  const restoredData = JSON.parse(localStorage.getItem(expectedKey) || '{}')
  expect(restoredData.checked?.characters).toBe(true)

  // The checkbox button should now read "mark as incomplete" (meaning it IS checked)
  const restoredCheckboxes = screen.getAllByRole('button', { name: /mark characters as incomplete/i })
  expect(restoredCheckboxes.length).toBeGreaterThan(0)

  // Clean up
  localStorage.removeItem(expectedKey)
})
```

---

## 4. Enforcement

| Rule | Enforced by |
|------|-------------|
| `littick_` prefix on all keys | Test 2 (static analysis of source) |
| Variable naming contract | Test 3 (static analysis) + code review |
| No blank-page regressions | Test 1 (smoke render) |
| Puzzle lock integrity | Test 4 (integration test) |
| Storage key stability | Test 5 (persistence test) |

All five tests must be green before any PR is approved. A single red test is an automatic merge block.

---

*Document owner: Bruce (Lead QA & System Architect) — LitTick project.*
