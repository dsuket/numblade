import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HpBar from './HpBar'

describe('HpBar', () => {
  it('defaults to the red fill color', () => {
    const { container } = render(<HpBar hp={50} maxHp={100} />)
    const fill = container.querySelector('[role="progressbar"] > div')
    expect(fill).toHaveClass('bg-[#ff4d6d]')
  })

  it('uses the given barColor class instead of the default', () => {
    const { container } = render(<HpBar hp={50} maxHp={100} barColor="bg-[#4ade80]" />)
    const fill = container.querySelector('[role="progressbar"] > div')
    expect(fill).toHaveClass('bg-[#4ade80]')
    expect(fill).not.toHaveClass('bg-[#ff4d6d]')
  })
})
