// src/__tests__/PuzzleGame.lock.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

test('Puzzle tab is locked before timer completes', async () => {
  render(<App />)

  // Pick the first story via its accessible name so the test is stable
  // as more buttons are added to the story-selection screen.
  const storyButtons = screen.getAllByRole('button', { name: /select story/i })
  fireEvent.click(storyButtons[0])

  // The Puzzle tab button must exist but be disabled
  const puzzleTab = screen.getByRole('tab', { name: /puzzle/i })
  expect(puzzleTab).toBeDisabled()

  // Clicking the disabled tab must NOT switch the active panel
  fireEvent.click(puzzleTab)
  expect(screen.queryByRole('grid')).not.toBeInTheDocument()
})
