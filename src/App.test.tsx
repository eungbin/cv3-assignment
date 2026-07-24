import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { BroadcastTable } from './types'

const liveTable: BroadcastTable = {
  type: 'lb',
  audienceLabel: '조회수',
  rows: [
    {
      rank: '1',
      title: '라이브 방송 1',
      platform: '네이버쇼핑LIVE',
      category: '',
      broadcastTime: ['26.07.24 (금)', '10:00'],
      audience: '🔒 로그인',
      sales: '🔒 로그인',
      revenue: '🔒 로그인',
      productCount: '11',
    },
  ],
}

const homeShoppingTable: BroadcastTable = {
  type: 'hs',
  audienceLabel: '시청률',
  rows: [
    {
      rank: '1',
      title: '홈쇼핑 방송 1',
      platform: 'NS홈쇼핑',
      category: '식품',
      broadcastTime: ['26.07.24 (금)', '11:00'],
      audience: '0.1%',
      sales: '20',
      revenue: '30만원',
      productCount: '4',
    },
  ],
}

const jsonResponse = (table: BroadcastTable) =>
  new Response(JSON.stringify(table), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  })

const deferredResponse = () => {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('라이브 방송을 기본 선택하고 로딩 후 데이터를 표시한다', async () => {
    const liveResponse = deferredResponse()
    const fetchMock = vi.fn().mockReturnValue(liveResponse.promise)
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    expect(
      screen.getByRole('tab', { name: '라이브 방송' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('status', {
        name: '방송 데이터를 불러오는 중입니다.',
      }),
    ).toBeInTheDocument()

    await act(async () => {
      liveResponse.resolve(jsonResponse(liveTable))
    })

    expect(await screen.findByText('라이브 방송 1')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/broadcasts?type=lb',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(
      screen.getByRole('columnheader', { name: '조회수' }),
    ).toBeInTheDocument()
  })

  it('홈쇼핑 전환 결과를 표시하고 성공한 유형을 다시 요청하지 않는다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(liveTable))
      .mockResolvedValueOnce(jsonResponse(homeShoppingTable))
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    expect(await screen.findByText('라이브 방송 1')).toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('tab', { name: '라이브 방송' }), {
      key: 'ArrowRight',
    })

    expect(await screen.findByText('홈쇼핑 방송 1')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '홈쇼핑' })).toHaveFocus()
    expect(
      screen.getByRole('columnheader', { name: '시청률' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: '라이브 방송' }))

    expect(await screen.findByText('라이브 방송 1')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('요청 실패 시 오류와 재시도를 제공한다', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('요청 실패'))
      .mockResolvedValueOnce(jsonResponse(liveTable))
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    expect(
      await screen.findByRole('alert', {
        name: '방송 데이터를 불러오지 못했습니다.',
      }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByText('라이브 방송 1')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('빠르게 전환해도 늦게 끝난 이전 요청이 현재 화면을 덮지 않는다', async () => {
    const liveResponse = deferredResponse()
    const homeShoppingResponse = deferredResponse()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(liveResponse.promise)
      .mockReturnValueOnce(homeShoppingResponse.promise)
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '홈쇼핑' }))

    await act(async () => {
      homeShoppingResponse.resolve(jsonResponse(homeShoppingTable))
    })
    expect(await screen.findByText('홈쇼핑 방송 1')).toBeInTheDocument()

    await act(async () => {
      liveResponse.resolve(jsonResponse(liveTable))
    })

    expect(screen.getByText('홈쇼핑 방송 1')).toBeInTheDocument()
    expect(screen.queryByText('라이브 방송 1')).not.toBeInTheDocument()
  })
})
