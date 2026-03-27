// src/__tests__/App.smoke.test.jsx
import { render, screen } from '@testing-library/react'
import App from '../App'

test('App renders without crashing', () => {
  render(<App />)
  // The story-selection header must be visible
  expect(screen.getByRole('heading', { name: /LitTick|KoalaRead/i })).toBeInTheDocument()
})
