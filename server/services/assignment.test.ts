// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AssignmentFetchError,
  fetchCategoryMap,
} from './assignment.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchCategoryMap', () => {
  it('원본 사이트와 같은 POST 요청으로 카테고리 맵을 가져온다', async () => {
    const categories = {
      '50000123': {
        pid: 50000005,
        name: '외출용품',
      },
      '50000005': {
        pid: null,
        name: '출산/육아',
      },
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ cats: categories }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCategoryMap()).resolves.toEqual(categories)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://live.ecomm-data.com/api/home/gnb',
      expect.objectContaining({
        body: '{}',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          domain: 'ecomm-data.com',
        },
        method: 'POST',
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('카테고리 API가 비정상 상태로 응답하면 명확한 오류를 발생시킨다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 503 })),
    )

    await expect(fetchCategoryMap()).rejects.toEqual(
      new AssignmentFetchError(
        '카테고리 메타데이터가 HTTP 503으로 응답했습니다.',
      ),
    )
  })

  it('카테고리 API 응답 구조가 올바르지 않으면 오류를 발생시킨다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ cats: [] }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
      ),
    )

    await expect(fetchCategoryMap()).rejects.toEqual(
      new AssignmentFetchError(
        '카테고리 메타데이터의 구조가 올바르지 않습니다.',
      ),
    )
  })
})
