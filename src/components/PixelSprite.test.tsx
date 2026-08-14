import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PixelSprite from './PixelSprite'

describe('PixelSprite', () => {
  it('renders one rect per non-empty half-row cell, mirrored across the vertical axis', () => {
    // '.X' half-row mirrors to '.XX.' (4 columns), 1 row
    const { container } = render(<PixelSprite rows={['.X']} palette={{ X: '#ff0000' }} size={40} />)
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(2)
  })

  it('colors each rect using the palette entry for its character', () => {
    const { container } = render(<PixelSprite rows={['XO']} palette={{ X: '#111111', O: '#222222' }} size={40} />)
    const rects = container.querySelectorAll('rect')
    const fills = Array.from(rects).map((r) => r.getAttribute('fill'))
    expect(fills).toContain('#111111')
    expect(fills).toContain('#222222')
  })

  it('skips "." cells entirely (transparent background, no rect drawn)', () => {
    const { container } = render(<PixelSprite rows={['.']} palette={{}} size={40} />)
    expect(container.querySelectorAll('rect')).toHaveLength(0)
  })

  it('sizes the svg viewBox to the mirrored grid dimensions', () => {
    const { container } = render(<PixelSprite rows={['.X', 'XO']} palette={{ X: '#fff', O: '#000' }} size={40} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 4 2')
  })

  it('renders at the requested pixel size', () => {
    const { container } = render(<PixelSprite rows={['X']} palette={{ X: '#fff' }} size={96} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '96')
    expect(svg).toHaveAttribute('height', '96')
  })
})
