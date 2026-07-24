// @vitest-environment node

import express from 'express'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBroadcastsRouter } from './broadcasts.js'
import { AssignmentFetchError } from '../services/assignment.js'
import type { AssignmentHtmlFetcher } from '../services/assignment.js'

const buildHtml = (audienceLabel: '조회수' | '시청률') => `
  <table>
    <thead>
      <tr>
        <th></th>
        <th>방송정보</th>
        <th>분류</th>
        <th>방송시간</th>
        <th>${audienceLabel}</th>
        <th>판매량</th>
        <th>매출액</th>
        <th>상품수</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><a><span>테스트 방송</span><span>테스트 플랫폼</span></a></td>
        <td>식품</td>
        <td><span>26.07.24 (금)</span><span>10:00</span></td>
        <td>100</td>
        <td>20</td>
        <td>30만원</td>
        <td>4</td>
      </tr>
    </tbody>
  </table>
`

const servers: Server[] = []

const request = async (fetchHtml: AssignmentHtmlFetcher, query = '') => {
  const app = express()
  app.use('/api/broadcasts', createBroadcastsRouter(fetchHtml))

  const server = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(0, '127.0.0.1', () => {
      resolve(listeningServer)
    })
  })
  servers.push(server)

  const { port } = server.address() as AddressInfo
  return fetch(`http://127.0.0.1:${port}/api/broadcasts${query}`)
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error)
              return
            }

            resolve()
          })
        }),
    ),
  )
})

describe('GET /api/broadcasts', () => {
  it('type이 누락되면 lb 데이터를 반환한다', async () => {
    const fetchHtml = vi.fn<AssignmentHtmlFetcher>().mockResolvedValue(
      buildHtml('조회수'),
    )

    const response = await request(fetchHtml)

    expect(response.status).toBe(200)
    expect(fetchHtml).toHaveBeenCalledWith('lb')
    await expect(response.json()).resolves.toMatchObject({
      type: 'lb',
      audienceLabel: '조회수',
    })
  })

  it('type=hs이면 홈쇼핑 데이터를 반환한다', async () => {
    const fetchHtml = vi.fn<AssignmentHtmlFetcher>().mockResolvedValue(
      buildHtml('시청률'),
    )

    const response = await request(fetchHtml, '?type=hs')

    expect(response.status).toBe(200)
    expect(fetchHtml).toHaveBeenCalledWith('hs')
    await expect(response.json()).resolves.toMatchObject({
      type: 'hs',
      audienceLabel: '시청률',
    })
  })

  it('잘못된 type이면 원본을 요청하지 않고 400을 반환한다', async () => {
    const fetchHtml = vi.fn<AssignmentHtmlFetcher>()

    const response = await request(fetchHtml, '?type=invalid')

    expect(response.status).toBe(400)
    expect(fetchHtml).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: 'type은 lb 또는 hs여야 합니다.',
    })
  })

  it('원본 요청 실패 시 502를 반환한다', async () => {
    const fetchHtml = vi
      .fn<AssignmentHtmlFetcher>()
      .mockRejectedValue(new AssignmentFetchError('요청 실패'))

    const response = await request(fetchHtml)

    expect(response.status).toBe(502)
  })

  it('파싱 실패 시 502를 반환한다', async () => {
    const fetchHtml = vi
      .fn<AssignmentHtmlFetcher>()
      .mockResolvedValue('<html></html>')

    const response = await request(fetchHtml)

    expect(response.status).toBe(502)
  })
})
