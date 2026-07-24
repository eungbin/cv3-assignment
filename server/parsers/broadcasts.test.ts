// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  BroadcastParseError,
  parseBroadcastTable,
} from './broadcasts.js'
import type { BroadcastType, CategoryMap } from '../types.js'

const buildRow = (type: BroadcastType, rank: number) => {
  const platform = type === 'lb' ? '네이버쇼핑LIVE' : 'NS홈쇼핑'
  const category = type === 'lb' && rank === 1 ? '' : '식품'
  const categoryHref =
    type === 'lb' && rank === 1 ? ' href="/report/category/50000123"' : ''
  const title = type === 'lb' ? `라이브 방송 ${rank}` : `홈쇼핑 방송 ${rank}`
  const time = String(rank).padStart(2, '0')

  return `
    <tr>
      <td><div>${rank}</div></td>
      <td>
        <a href="/broadcast/${rank}">
          <span>${title}</span>
          <span>${platform}<div aria-hidden="true">광고 아이콘</div></span>
        </a>
      </td>
      <td><div><a${categoryHref}>${category}</a></div></td>
      <td><div><span>26.07.24 (금)</span><span>10:${time}</span></div></td>
      <td><span>🔒 로그인</span></td>
      <td><span>🔒 로그인</span></td>
      <td><span>🔒 로그인</span></td>
      <td><span>${rank + 10}</span></td>
    </tr>
  `
}

const buildAssignmentHtml = (
  type: BroadcastType,
  rowCount = 2,
  includeUnrelatedTable = true,
) => {
  const audienceLabel = type === 'lb' ? '조회수' : '시청률'
  const rows = Array.from({ length: rowCount }, (_, index) =>
    buildRow(type, index + 1),
  ).join('')

  return `
    <html>
      <body>
        ${
          includeUnrelatedTable
            ? '<table><thead><tr><th>공지사항</th></tr></thead></table>'
            : ''
        }
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
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `
}

const categories: CategoryMap = {
  '50000123': {
    pid: 50000005,
    name: '외출용품',
  },
  '50000005': {
    pid: null,
    name: '출산/육아',
  },
}

describe('parseBroadcastTable', () => {
  it('관련 없는 테이블을 무시하고 라이브 방송 표시값을 추출한다', () => {
    const result = parseBroadcastTable(buildAssignmentHtml('lb'), 'lb')

    expect(result).toEqual({
      type: 'lb',
      audienceLabel: '조회수',
      rows: [
        {
          rank: '1',
          title: '라이브 방송 1',
          platform: '네이버쇼핑LIVE',
          category: '',
          broadcastTime: ['26.07.24 (금)', '10:01'],
          audience: '🔒 로그인',
          sales: '🔒 로그인',
          revenue: '🔒 로그인',
          productCount: '11',
        },
        {
          rank: '2',
          title: '라이브 방송 2',
          platform: '네이버쇼핑LIVE',
          category: '식품',
          broadcastTime: ['26.07.24 (금)', '10:02'],
          audience: '🔒 로그인',
          sales: '🔒 로그인',
          revenue: '🔒 로그인',
          productCount: '12',
        },
      ],
    })
  })

  it('빈 라이브 분류 링크의 ID를 상위 분류명으로 변환한다', () => {
    const result = parseBroadcastTable(
      buildAssignmentHtml('lb', 2),
      'lb',
      categories,
    )

    expect(result.rows.map(({ category }) => category)).toEqual([
      '출산/육아',
      '식품',
    ])
  })

  it('홈쇼핑 테이블의 시청률 헤더와 방송정보를 추출한다', () => {
    const result = parseBroadcastTable(buildAssignmentHtml('hs', 1), 'hs')

    expect(result.audienceLabel).toBe('시청률')
    expect(result.rows[0]).toMatchObject({
      title: '홈쇼핑 방송 1',
      platform: 'NS홈쇼핑',
      category: '식품',
    })
  })

  it('11개 행이 있어도 원본 순서대로 처음 10개만 반환한다', () => {
    const result = parseBroadcastTable(buildAssignmentHtml('lb', 11), 'lb')

    expect(result.rows).toHaveLength(10)
    expect(result.rows.map(({ rank }) => rank)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ])
  })

  it('방송정보 테이블이 없으면 명확한 오류를 발생시킨다', () => {
    expect(() => parseBroadcastTable('<div>테이블 없음</div>', 'lb')).toThrow(
      new BroadcastParseError('방송정보 테이블을 찾을 수 없습니다.'),
    )
  })

  it('필수 헤더가 다르면 명확한 오류를 발생시킨다', () => {
    const html = buildAssignmentHtml('lb').replace(
      '<th>매출액</th>',
      '<th>주문액</th>',
    )

    expect(() => parseBroadcastTable(html, 'lb')).toThrow(
      new BroadcastParseError('방송정보 테이블의 필수 헤더가 올바르지 않습니다.'),
    )
  })
})
