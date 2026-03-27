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
