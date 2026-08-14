import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the NUMBLADE title and a question', () => {
    render(<App />)
    expect(screen.getByText('NUMBLADE')).toBeInTheDocument()
    expect(screen.getByText(/=\s*\?/)).toBeInTheDocument()
  })

  it('shows feedback after selecting a choice', () => {
    render(<App />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(screen.getByTestId('feedback')).toBeInTheDocument()
  })
})
