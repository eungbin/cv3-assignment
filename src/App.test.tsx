import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the project setup status', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '프로젝트 기반 설정 완료' }),
    ).toBeInTheDocument()
  })
})
