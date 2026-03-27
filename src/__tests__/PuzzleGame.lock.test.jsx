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
