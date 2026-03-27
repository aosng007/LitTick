/**
 * PuzzleGame.jsx
 * Dynamic Word Search puzzle generated from 5 story keywords.
 * Words are placed horizontally, vertically, and diagonally on a grid.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'

const GRID_SIZE = 12

// ---------------------------------------------------------------------------
// Grid generation helpers
// ---------------------------------------------------------------------------

/** Return a GRID_SIZE × GRID_SIZE matrix filled with random uppercase letters */
function makeEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => '')
  )
}

const DIRECTIONS = [
  [0, 1],   // right
  [1, 0],   // down
  [1, 1],   // diagonal down-right
  [0, -1],  // left
  [-1, 0],  // up
  [-1, -1], // diagonal up-left
  [1, -1],  // diagonal down-left
  [-1, 1],  // diagonal up-right
]

function canPlace(grid, word, row, col, dr, dc) {
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i
    const c = col + dc * i
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false
    if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false
  }
  return true
}

function placeWord(grid, word, row, col, dr, dc) {
  const positions = []
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i
    const c = col + dc * i
    grid[r][c] = word[i]
    positions.push([r, c])
  }
  return positions
}

/** Seeded PRNG so the same keywords always produce the same puzzle */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildPuzzle(keywords) {
  const words = keywords.map(k => k.toUpperCase().replace(/[^A-Z]/g, ''))
  const seed = words.reduce((s, w) => s + w.charCodeAt(0), 0) * 31
  const rng = mulberry32(seed)
  const grid = makeEmptyGrid()
  const placements = {} // word → [[r,c], ...]

  for (const word of words) {
    let placed = false
    let attempts = 0
    while (!placed && attempts < 400) {
      attempts++
      const [dr, dc] = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)]
      const row = Math.floor(rng() * GRID_SIZE)
      const col = Math.floor(rng() * GRID_SIZE)
      if (canPlace(grid, word, row, col, dr, dc)) {
        placements[word] = placeWord(grid, word, row, col, dr, dc)
        placed = true
      }
    }
    // If we couldn't place, try simpler horizontal placement as fallback
    if (!placed) {
      for (let r = 0; r < GRID_SIZE && !placed; r++) {
        for (let c = 0; c <= GRID_SIZE - word.length && !placed; c++) {
          if (canPlace(grid, word, r, c, 0, 1)) {
            placements[word] = placeWord(grid, word, r, c, 0, 1)
            placed = true
          }
        }
      }
    }
  }

  // Fill empty cells with random letters
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = ALPHA[Math.floor(rng() * ALPHA.length)]
      }
    }
  }

  return { grid, placements }
}

// ---------------------------------------------------------------------------
// Cell component
// ---------------------------------------------------------------------------
function Cell({ letter, isSelected, isFound, isHighlighted, onClick, onMouseEnter }) {
  let bg = 'bg-white hover:bg-koala-sky/30'
  if (isFound) bg = 'bg-koala-green/30 text-koala-teal font-extrabold'
  if (isSelected) bg = 'bg-koala-yellow/60 font-extrabold'
  if (isHighlighted) bg = 'bg-koala-blue/30 font-bold'

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`aspect-square rounded-md text-xs sm:text-sm font-bold uppercase select-none cursor-pointer transition-colors active:scale-90 border border-gray-100 ${bg}`}
      aria-label={`Letter ${letter}`}
    >
      {letter}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Word list sidebar
// ---------------------------------------------------------------------------
function WordList({ words, foundWords }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {words.map(w => {
        const upper = w.toUpperCase()
        const found = foundWords.has(upper)
        return (
          <span
            key={w}
            className={`rounded-full px-3 py-1 text-sm font-bold border-2 transition-all ${
              found
                ? 'bg-koala-green text-white border-koala-green line-through opacity-70'
                : 'bg-white text-koala-teal border-koala-teal/40'
            }`}
          >
            {found ? '✓ ' : ''}{w.toLowerCase()}
          </span>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main PuzzleGame component
// ---------------------------------------------------------------------------
export default function PuzzleGame({ keywords = [], storyTitle = '' }) {
  const { grid, placements } = useMemo(
    () => buildPuzzle(keywords),
    [keywords]
  )

  const [selecting, setSelecting] = useState(false)
  const [selection, setSelection] = useState([]) // [[r,c], ...]
  const [foundWords, setFoundWords] = useState(new Set())
  const [shake, setShake] = useState(false)
  const [allFound, setAllFound] = useState(false)

  // Cells covered by successfully found words
  const foundCells = useMemo(() => {
    const set = new Set()
    for (const word of foundWords) {
      const positions = placements[word] || []
      positions.forEach(([r, c]) => set.add(`${r},${c}`))
    }
    return set
  }, [foundWords, placements])

  // Cells currently being dragged/selected
  const selectionSet = useMemo(
    () => new Set(selection.map(([r, c]) => `${r},${c}`)),
    [selection]
  )

  const checkSelection = useCallback(() => {
    if (selection.length < 2) { setSelection([]); return }
    // Build the selected word
    const selectedStr = selection.map(([r, c]) => grid[r][c]).join('')
    const match = Object.keys(placements).find(
      w => w === selectedStr || w === [...selectedStr].reverse().join('')
    )
    if (match && !foundWords.has(match)) {
      const updated = new Set([...foundWords, match])
      setFoundWords(updated)
      if (updated.size === keywords.length) setAllFound(true)
    } else if (!match) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
    setSelection([])
    setSelecting(false)
  }, [selection, grid, placements, foundWords, keywords.length])

  // Mouse / touch handlers
  const handleMouseDown = (r, c) => {
    setSelecting(true)
    setSelection([[r, c]])
  }

  const handleMouseEnter = (r, c) => {
    if (!selecting) return
    const start = selection[0]
    if (!start) return
    // Allow only straight lines (horizontal, vertical, diagonal)
    const dr = r - start[0]
    const dc = c - start[1]
    const len = Math.max(Math.abs(dr), Math.abs(dc))
    if (len === 0) { setSelection([start]); return }
    // Check straight line constraint
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr)
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc)
    // Only valid if ratio is 0, 1, or -1 in each axis
    if (Math.abs(dr) !== Math.abs(dc) && dr !== 0 && dc !== 0) return
    const cells = []
    for (let i = 0; i <= len; i++) {
      cells.push([start[0] + stepR * i, start[1] + stepC * i])
    }
    setSelection(cells)
  }

  const handleMouseUp = () => {
    if (selecting) checkSelection()
  }

  // Touch support
  const getGridPos = useCallback((e) => {
    const touch = e.changedTouches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!el) return null
    // elementFromPoint may return the inner <button> (Cell); find the nearest cell wrapper
    const cellEl = typeof el.closest === 'function'
      ? el.closest('[data-row][data-col]')
      : el
    if (!cellEl) return null
    const r = cellEl.getAttribute('data-row')
    const c = cellEl.getAttribute('data-col')
    if (r == null || c == null) return null
    return [parseInt(r), parseInt(c)]
  }, [])

  const handleTouchStart = (e) => {
    const pos = getGridPos(e)
    if (pos) { setSelecting(true); setSelection([pos]) }
  }
  const handleTouchMove = (e) => {
    e.preventDefault()
    const pos = getGridPos(e)
    if (pos) handleMouseEnter(pos[0], pos[1])
  }
  const handleTouchEnd = () => { if (selecting) checkSelection() }

  const handleReset = () => {
    setFoundWords(new Set())
    setSelection([])
    setSelecting(false)
    setAllFound(false)
  }

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-koala-teal text-lg flex items-center gap-2">
          🔍 Word Search
        </h3>
        <span className="text-sm text-gray-500 font-medium">
          {foundWords.size} / {keywords.length} found
        </span>
      </div>

      {/* Words to find */}
      <WordList words={keywords} foundWords={foundWords} />

      {/* Grid */}
      <div
        className={`grid gap-0.5 sm:gap-1 mx-auto w-full max-w-xs sm:max-w-sm cursor-pointer ${shake ? 'animate-[wiggle_0.3s_ease]' : ''}`}
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        onMouseLeave={() => { if (selecting) checkSelection() }}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label={`Word search puzzle for ${storyTitle}`}
        role="grid"
      >
        {grid.map((row, r) =>
          row.map((letter, c) => {
            const key = `${r},${c}`
            return (
              <div
                key={key}
                data-row={r}
                data-col={c}
                onMouseDown={() => handleMouseDown(r, c)}
                onMouseEnter={() => handleMouseEnter(r, c)}
              >
                <Cell
                  letter={letter}
                  isFound={foundCells.has(key)}
                  isSelected={selectionSet.has(key)}
                  isHighlighted={false}
                />
              </div>
            )
          })
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-center text-gray-400">
        Click and drag to select a word. Words can go in any direction!
      </p>

      {/* All found celebration */}
      {allFound && (
        <div className="rounded-2xl bg-gradient-to-r from-yellow-400 to-koala-yellow p-4 text-center shadow-lg">
          <div className="text-3xl mb-1">🏆⭐🎉</div>
          <p className="font-extrabold text-lg text-white">
            You found all the words! Superstar! 🌟
          </p>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={handleReset}
        className="self-center text-xs text-gray-400 hover:text-gray-600 underline"
        aria-label="Reset word search puzzle"
      >
        Reset puzzle
      </button>

      <style>{`
        @keyframes wiggle {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
